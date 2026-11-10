import type { Page } from "@playwright/test";

export const ADAPTERS = ["default", "shadcn", "daisyui", "bootstrap", "flowbite", "radix"] as const;
export type Adapter = (typeof ADAPTERS)[number];
export const MODES = ["light", "dark"] as const;
export type Mode = (typeof MODES)[number];

export async function openPlayground(page: Page, adapter: Adapter, mode: Mode): Promise<void> {
  await page.goto(`/?adapter=${adapter}&theme=${mode}`);
  await page.waitForLoadState("networkidle");
}

export interface InspectInfo {
  descriptor: string;
  ring: { kind: "outline" | "box-shadow" | "none"; color: string | null };
  /** backdrop the ring is drawn on (first non-transparent ancestor bg) */
  background: string;
  /** the element's own effective background (incl. itself) */
  elementBg: string;
  /** contrast ratio of focus ring vs the backdrop it is drawn on */
  ringRatio: number | null;
  /** contrast ratio of text colour vs the element's own background */
  textRatio: number | null;
}

/**
 * Runs in the browser (via locator.evaluate / elementHandle.evaluate):
 * reports the focus-ring treatment and computed contrast ratios for `el`.
 * The ring is drawn *outside* the element's border box, so its "background"
 * is the surrounding backdrop (first non-transparent ancestor background).
 */
export function inspectElement(el: Element): InspectInfo {
  const doc = el.ownerDocument;

  const toRgba = (
    css: string,
    over?: [number, number, number] | null,
  ): [number, number, number, number] | null => {
    const cnv = doc.createElement("canvas");
    cnv.width = cnv.height = 2;
    const ctx = cnv.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    if (over) {
      ctx.fillStyle = `rgb(${over[0]},${over[1]},${over[2]})`;
      ctx.fillRect(0, 0, 2, 2);
    }
    ctx.fillStyle = "#010203";
    const sentinel = ctx.fillStyle;
    ctx.fillStyle = css;
    if (ctx.fillStyle === sentinel) return null;
    ctx.fillRect(0, 0, 2, 2);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3]];
  };

  const lum = (rgb: readonly number[]): number => {
    const f = (v: number): number => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  };

  const ratio = (
    a: readonly number[] | null,
    b: readonly number[] | null,
  ): number | null =>
    a && b
      ? (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
      : null;

  const cs = getComputedStyle(el);

  // backdrop under the ring = first non-transparent background above el
  let bgCss = "rgb(255, 255, 255)";
  let bg = toRgba(bgCss);
  for (let n: Element | null = el.parentElement; n; n = n.parentElement) {
    const c = getComputedStyle(n).backgroundColor;
    const rgba = toRgba(c);
    if (rgba && rgba[3] > 0) {
      bgCss = c;
      bg = rgba;
      break;
    }
  }

  // the element's own background (for text) — first non-transparent including el
  let elBgCss = bgCss;
  let elBg = bg;
  for (let n: Element | null = el; n; n = n.parentElement) {
    const c = getComputedStyle(n).backgroundColor;
    const rgba = toRgba(c);
    if (rgba && rgba[3] > 0) {
      elBgCss = c;
      elBg = rgba;
      break;
    }
  }

  const colorRe = /(rgba?|oklch|oklab|lab|lch|hsla?|color)\([^)]*\)|#[0-9a-fA-F]{3,8}/g;
  const visible = (css: string | null): boolean => {
    if (!css) return false;
    const r = toRgba(css);
    return !!r && r[3] > 0;
  };

  let ring: InspectInfo["ring"] = { kind: "none", color: null };
  const outlineVisible =
    cs.outlineStyle !== "none" &&
    cs.outlineStyle !== "hidden" &&
    parseFloat(cs.outlineWidth) > 0 &&
    visible(cs.outlineColor);
  if (outlineVisible) {
    ring = { kind: "outline", color: cs.outlineColor };
  } else if (cs.boxShadow && cs.boxShadow !== "none") {
    const layers = cs.boxShadow.split(
      /,(?=\s*(?:inset\s+)?(?:rgba?\(|oklch\(|oklab\(|lab\(|lch\(|hsla?\(|color\(|#))/,
    );
    // a multi-layer shadow can pair a faint offset with the real ring —
    // judge by the *most* contrasting visible layer
    let best = -1;
    for (const layer of layers) {
      const col = layer.match(colorRe)?.[0] ?? null;
      const lengths =
        layer
          .replace(colorRe, " ")
          .match(/-?[\d.]+px/g)
          ?.map(parseFloat) ?? [];
      if (!col || !visible(col) || !lengths.some((n) => n !== 0)) continue;
      const r = ratio(toRgba(col, bg ? [bg[0], bg[1], bg[2]] : null), bg) ?? 0;
      if (r > best) {
        best = r;
        ring = { kind: "box-shadow", color: col };
      }
    }
    // no visible shadow layer — surface the (invisible) outline for reporting
    if (ring.kind === "none" && cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0)
      ring = { kind: "outline", color: cs.outlineColor };
  } else if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) {
    ring = { kind: "outline", color: cs.outlineColor };
  }

  const descriptor =
    `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}` +
    `${(el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean).map((c) => `.${c}`).join("")}` +
    ` "${(el.textContent ?? "").trim().slice(0, 40)}"`;

  return {
    descriptor,
    ring,
    background: bgCss,
    elementBg: elBgCss,
    ringRatio: ring.color ? ratio(toRgba(ring.color, bg ? [bg[0], bg[1], bg[2]] : null), bg) : null,
    textRatio: ratio(toRgba(cs.color, elBg ? [elBg[0], elBg[1], elBg[2]] : null), elBg),
  };
}
