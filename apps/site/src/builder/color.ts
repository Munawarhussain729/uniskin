/**
 * Small colour toolkit for the skin builder: parsing (hex / oklch),
 * sRGB <-> OKLab, `color-mix(in oklab, ...)` and WCAG 2.x contrast.
 * No dependencies so it runs identically in the browser and in vitest.
 */

export type Rgb = readonly [number, number, number]; // sRGB, 0..1
type Lab = readonly [number, number, number];

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number): number =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

export function rgbToOklab([r, g, b]: Rgb): Lab {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [clamp01(fromLinear(lr)), clamp01(fromLinear(lg)), clamp01(fromLinear(lb))];
}

/** Parses `#rgb`, `#rrggbb` or `oklch(L C H)`. Returns null when invalid. */
export function parseColor(input: string): Rgb | null {
  const v = input.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as unknown as Rgb;
  }
  const ok = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/.exec(v);
  if (ok) {
    const L = parseFloat(ok[1]) / (ok[2] ? 100 : 1);
    const C = parseFloat(ok[3]);
    const h = (parseFloat(ok[4]) * Math.PI) / 180;
    return oklabToRgb([L, C * Math.cos(h), C * Math.sin(h)]);
  }
  return null;
}

export function isHex(input: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.trim());
}

export function toHex(rgb: Rgb): string {
  return `#${rgb
    .map((c) =>
      Math.round(clamp01(c) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Any parseable colour string to a lowercase #rrggbb. */
export function normalizeHex(input: string): string | null {
  const rgb = parseColor(input);
  return rgb ? toHex(rgb) : null;
}

/** `color-mix(in oklab, a pct%, b)` — both colours opaque. */
export function mixOklab(a: Rgb, pct: number, b: Rgb): Rgb {
  const t = pct / 100;
  const la = rgbToOklab(a);
  const lb = rgbToOklab(b);
  return oklabToRgb([
    la[0] * t + lb[0] * (1 - t),
    la[1] * t + lb[1] * (1 - t),
    la[2] * t + lb[2] * (1 - t),
  ]);
}

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2.x contrast ratio, 1..21, computed on the 8-bit colours browsers paint. */
export function contrast(a: Rgb, b: Rgb): number {
  const q = (c: Rgb): Rgb => c.map((v) => Math.round(clamp01(v) * 255) / 255) as unknown as Rgb;
  const la = luminance(q(a));
  const lb = luminance(q(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const WHITE: Rgb = [1, 1, 1];
const BLACK: Rgb = [0, 0, 0];
const INK: Rgb = [0.078, 0.067, 0.043]; // #14110b

/**
 * Best readable content colour for text/icons on `fill`: prefers white,
 * then a soft ink, falling back to pure black only when both miss 4.5:1
 * (mid-tones where only black clears the bar).
 */
export function pickOnColor(fill: Rgb): string {
  const candidates = [WHITE, INK, BLACK];
  const best = candidates.reduce((a, b) => (contrast(b, fill) > contrast(a, fill) ? b : a));
  const firstPassing = candidates.find((c) => contrast(c, fill) >= 4.5);
  return toHex(firstPassing ?? best);
}

/**
 * Moves `fg` toward `target` (usually the readable extreme) in 4% OKLab
 * steps until it reaches `min` against `bg` — keeps the brand hue for as
 * long as possible.
 */
export function nudgeToContrast(fg: Rgb, bg: Rgb, target: Rgb, min = 4.5): Rgb {
  for (let pct = 0; pct <= 100; pct += 4) {
    const c = mixOklab(target, pct, fg);
    if (contrast(c, bg) >= min) return c;
  }
  return target;
}
