/**
 * Skin-builder state model: the editable design tokens, the built-in
 * starting points, and the accessibility audit that mirrors how the default
 * theme derives text / soft colours from an intent fill.
 */
import {
  contrast,
  mixOklab,
  nudgeToContrast,
  parseColor,
  pickOnColor,
  toHex,
  type Rgb,
} from "./color";

export const INTENT_KEYS = ["primary", "secondary", "success", "warning", "danger"] as const;
export type IntentKey = (typeof INTENT_KEYS)[number];
export type Mode = "light" | "dark";

/**
 * [soft tint %, soft text mix %] per intent and the share of the fill kept
 * when it is used as text — a copy of the default theme's derivation
 * (packages/uniskin/src/default-theme.ts, INTENT_MIX / INTENT_TEXT_MIX).
 */
export const INTENT_MIX: Record<IntentKey, { soft: number; softFg: number; text: number }> = {
  primary: { soft: 14, softFg: 80, text: 100 },
  secondary: { soft: 14, softFg: 80, text: 100 },
  success: { soft: 16, softFg: 55, text: 100 },
  warning: { soft: 22, softFg: 45, text: 55 },
  danger: { soft: 12, softFg: 70, text: 100 },
};

/** One intent in one mode. `null` means "derive it, as the default theme does". */
export interface Swatch {
  fill: string;
  /** content colour on the fill; null = auto-pick the most readable */
  fg: string | null;
  /** pinned `--ui-<intent>-text` (intent used as text on the surface) */
  text: string | null;
  /** pinned `--ui-<intent>-soft-fg` (text on the soft tint) */
  softFg: string | null;
}

export interface Palette {
  neutral: { fill: string; fg: string; soft: string; softFg: string };
  intents: Record<IntentKey, Swatch>;
  surface: string;
  surfaceFg: string;
  surfaceMuted: string;
  border: string;
  ring: string;
}

export interface SkinState {
  name: string;
  light: Palette;
  dark: Palette;
  /** corner radius in rem (`--ui-radius`) */
  radius: number;
  /** border width in px, applied to bordered components (1 = default theme) */
  borderWidth: number;
  /** padding multiplier (1 = default theme) */
  density: number;
  /** `--ui-font-sans` */
  font: string;
}

const sw = (fill: string, fg: string): Swatch => ({ fill, fg, text: null, softFg: null });

/* Default theme values, verbatim from default-theme.ts (a unit test keeps this in sync). */
export const DEFAULT_LIGHT_OKLCH = {
  "--ui-neutral": "oklch(0.28 0.02 265)",
  "--ui-neutral-fg": "oklch(0.98 0 0)",
  "--ui-neutral-soft": "oklch(0.94 0.01 265)",
  "--ui-neutral-soft-fg": "oklch(0.32 0.02 265)",
  "--ui-primary": "oklch(0.55 0.21 267)",
  "--ui-primary-fg": "oklch(0.98 0 0)",
  "--ui-secondary": "oklch(0.55 0.05 285)",
  "--ui-secondary-fg": "oklch(0.98 0 0)",
  "--ui-success": "oklch(0.5 0.14 163)",
  "--ui-success-fg": "oklch(0.98 0 0)",
  "--ui-warning": "oklch(0.78 0.15 85)",
  "--ui-warning-fg": "oklch(0.28 0.04 90)",
  "--ui-danger": "oklch(0.56 0.2 27)",
  "--ui-danger-fg": "oklch(0.98 0 0)",
  "--ui-surface": "oklch(1 0 0)",
  "--ui-surface-fg": "oklch(0.24 0.02 265)",
  "--ui-surface-muted": "oklch(0.96 0.005 265)",
  "--ui-border": "oklch(0.89 0.008 265)",
  "--ui-ring": "oklch(0.62 0.18 262)",
} as const;

export const DEFAULT_DARK_OKLCH = {
  "--ui-neutral": "oklch(0.92 0.01 265)",
  "--ui-neutral-fg": "oklch(0.2 0.02 265)",
  "--ui-neutral-soft": "oklch(0.3 0.015 265)",
  "--ui-neutral-soft-fg": "oklch(0.92 0.01 265)",
  "--ui-primary": "oklch(0.68 0.17 267)",
  "--ui-primary-fg": "oklch(0.15 0.02 265)",
  "--ui-secondary": "oklch(0.7 0.07 285)",
  "--ui-secondary-fg": "oklch(0.15 0.02 285)",
  "--ui-success": "oklch(0.72 0.15 163)",
  "--ui-success-fg": "oklch(0.15 0.03 163)",
  "--ui-warning": "oklch(0.82 0.15 85)",
  "--ui-warning-fg": "oklch(0.2 0.04 90)",
  "--ui-danger": "oklch(0.68 0.19 27)",
  "--ui-danger-fg": "oklch(0.15 0.03 27)",
  "--ui-surface": "oklch(0.21 0.015 265)",
  "--ui-surface-fg": "oklch(0.95 0.005 265)",
  "--ui-surface-muted": "oklch(0.26 0.015 265)",
  "--ui-border": "oklch(0.34 0.015 265)",
  "--ui-ring": "oklch(0.7 0.15 262)",
  /* not part of the palette editor: translucent layers, carried through so
     an exported darkTokens (which replaces the defaults) keeps them */
  "--ui-overlay": "rgb(0 0 0 / 0.5)",
  "--ui-overlay-soft": "rgb(255 255 255 / 0.6)",
} as const;

export const DEFAULT_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function hex(css: string): string {
  const rgb = parseColor(css);
  if (!rgb) throw new Error(`bad colour ${css}`);
  return toHex(rgb);
}

function paletteFromTokens(t: Record<keyof typeof DEFAULT_LIGHT_OKLCH, string>): Palette {
  const h = (k: keyof typeof DEFAULT_LIGHT_OKLCH): string => hex(t[k]);
  return {
    neutral: {
      fill: h("--ui-neutral"),
      fg: h("--ui-neutral-fg"),
      soft: h("--ui-neutral-soft"),
      softFg: h("--ui-neutral-soft-fg"),
    },
    intents: {
      primary: sw(h("--ui-primary"), h("--ui-primary-fg")),
      secondary: sw(h("--ui-secondary"), h("--ui-secondary-fg")),
      success: sw(h("--ui-success"), h("--ui-success-fg")),
      warning: sw(h("--ui-warning"), h("--ui-warning-fg")),
      danger: sw(h("--ui-danger"), h("--ui-danger-fg")),
    },
    surface: h("--ui-surface"),
    surfaceFg: h("--ui-surface-fg"),
    surfaceMuted: h("--ui-surface-muted"),
    border: h("--ui-border"),
    ring: h("--ui-ring"),
  };
}

export function defaultState(): SkinState {
  return {
    name: "my-skin",
    light: paletteFromTokens(DEFAULT_LIGHT_OKLCH),
    dark: paletteFromTokens(DEFAULT_DARK_OKLCH),
    radius: 0.5,
    borderWidth: 1,
    density: 1,
    font: DEFAULT_FONT,
  };
}

/* ---------------------------------------------------------------- presets */

function withIntents(
  base: Palette,
  patch: Partial<Record<IntentKey, string | [string, string | null]>>,
  rest: Partial<Omit<Palette, "intents" | "neutral">> & { neutral?: Partial<Palette["neutral"]> } = {},
): Palette {
  const intents = { ...base.intents };
  for (const k of INTENT_KEYS) {
    const p = patch[k];
    if (!p) continue;
    const [fill, fg] = typeof p === "string" ? [p, null] : p;
    intents[k] = { fill, fg, text: null, softFg: null };
  }
  const { neutral, ...flat } = rest;
  return { ...base, ...flat, neutral: { ...base.neutral, ...neutral }, intents };
}

export interface Preset {
  id: string;
  label: string;
  blurb: string;
  apply: (base: SkinState) => SkinState;
}

export const PRESETS: Preset[] = [
  {
    id: "default",
    label: "Default",
    blurb: "The built-in theme, untouched.",
    apply: () => defaultState(),
  },
  {
    id: "specimen",
    label: "Specimen",
    blurb: "Warm paper, ink and vermilion — this site's own look.",
    apply: (b) => ({
      ...b,
      light: withIntents(
        b.light,
        { primary: "#b23a1d", secondary: "#6b5f45", success: "#2f6b3e", danger: "#a3262a" },
        {
          surface: "#fcfaf3",
          surfaceFg: "#211d14",
          surfaceMuted: "#f5f1e7",
          border: "#d9d1bd",
          ring: "#b23a1d",
          neutral: { fill: "#211d14", fg: "#fcfaf3", soft: "#efe8d6", softFg: "#3a3426" },
        },
      ),
      dark: withIntents(
        b.dark,
        { primary: "#ff8055", secondary: "#b5a98f", success: "#7fc48c", danger: "#ff8a83" },
        {
          surface: "#201c15",
          surfaceFg: "#ece5d5",
          surfaceMuted: "#2a251c",
          border: "#574f3f",
          ring: "#ff8055",
          neutral: { fill: "#ece5d5", fg: "#171410", soft: "#332d22", softFg: "#ece5d5" },
        },
      ),
      radius: 0.25,
      borderWidth: 1,
      density: 1,
      font: 'ui-serif, "Iowan Old Style", "New York", Georgia, serif',
    }),
  },
  {
    id: "tide",
    label: "Tide",
    blurb: "Cool teal, round and roomy, 2px borders.",
    apply: (b) => ({
      ...b,
      light: withIntents(
        b.light,
        { primary: "#0b7285", secondary: "#4c6a7a", success: "#2b7a3d", danger: "#c92a2a" },
        { ring: "#0b7285" },
      ),
      dark: withIntents(
        b.dark,
        { primary: "#3bc9db", secondary: "#8fb1c2", success: "#69db7c", danger: "#ff8787" },
        { ring: "#3bc9db" },
      ),
      radius: 1,
      borderWidth: 2,
      density: 1.15,
    }),
  },
];

/* ------------------------------------------------------------------ audit */

function rgb(css: string): Rgb {
  return parseColor(css) ?? [0, 0, 0];
}

export function resolveFg(s: Swatch): string {
  return s.fg ?? pickOnColor(rgb(s.fill));
}

/** The colours the default theme actually paints for an intent, honouring pins. */
export function derive(p: Palette, key: IntentKey) {
  const s = p.intents[key];
  const mix = INTENT_MIX[key];
  const fill = rgb(s.fill);
  const surface = rgb(p.surface);
  const surfaceFg = rgb(p.surfaceFg);
  const text = s.text
    ? rgb(s.text)
    : mix.text === 100
      ? fill
      : mixOklab(fill, mix.text, surfaceFg);
  const soft = mixOklab(fill, mix.soft, surface);
  const softFg = s.softFg ? rgb(s.softFg) : mixOklab(fill, mix.softFg, surfaceFg);
  return { fill, fg: rgb(resolveFg(s)), text, soft, softFg, surface };
}

export type CheckKind = "solid" | "text" | "soft" | "body" | "ring";

export interface Check {
  id: string;
  /** intent key, "neutral", or "surface" */
  group: string;
  kind: CheckKind;
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  min: number;
  pass: boolean;
}

function mk(
  id: string,
  group: string,
  kind: CheckKind,
  label: string,
  fg: Rgb,
  bg: Rgb,
  min: number,
): Check {
  const ratio = contrast(fg, bg);
  return { id, group, kind, label, fg: toHex(fg), bg: toHex(bg), ratio, min, pass: ratio >= min };
}

export const TEXT_MIN = 4.5;
export const UI_MIN = 3;

export function audit(p: Palette): Check[] {
  const out: Check[] = [];
  const surface = rgb(p.surface);
  out.push(mk("body", "surface", "body", "Body text on surface", rgb(p.surfaceFg), surface, TEXT_MIN));
  out.push(mk("ring", "surface", "ring", "Focus ring on surface", rgb(p.ring), surface, UI_MIN));
  out.push(
    mk("solid:neutral", "neutral", "solid", "Text on fill", rgb(p.neutral.fg), rgb(p.neutral.fill), TEXT_MIN),
  );
  out.push(
    mk("soft:neutral", "neutral", "soft", "Text on soft tint", rgb(p.neutral.softFg), rgb(p.neutral.soft), TEXT_MIN),
  );
  for (const k of INTENT_KEYS) {
    const d = derive(p, k);
    out.push(mk(`solid:${k}`, k, "solid", "Text on fill", d.fg, d.fill, TEXT_MIN));
    out.push(mk(`text:${k}`, k, "text", "As text on surface", d.text, surface, TEXT_MIN));
    out.push(mk(`soft:${k}`, k, "soft", "Text on soft tint", d.softFg, d.soft, TEXT_MIN));
  }
  return out;
}

/** Returns a copy of `p` with the failing check repaired, keeping hue where possible. */
export function fixCheck(p: Palette, id: string): Palette {
  const next: Palette = structuredClone(p);
  const [kind, key] = id.split(":") as [CheckKind, string | undefined];
  const surface = rgb(p.surface);
  const dir = (bg: Rgb): Rgb => (contrast([1, 1, 1], bg) >= contrast([0, 0, 0], bg) ? [1, 1, 1] : [0, 0, 0]);

  if (kind === "body") next.surfaceFg = toHex(nudgeToContrast(rgb(p.surfaceFg), surface, dir(surface)));
  else if (kind === "ring") next.ring = toHex(nudgeToContrast(rgb(p.ring), surface, dir(surface), UI_MIN));
  else if (key === "neutral") {
    if (kind === "solid") next.neutral.fg = pickOnColor(rgb(p.neutral.fill));
    if (kind === "soft")
      next.neutral.softFg = toHex(nudgeToContrast(rgb(p.neutral.softFg), rgb(p.neutral.soft), dir(rgb(p.neutral.soft))));
  } else if (key && (INTENT_KEYS as readonly string[]).includes(key)) {
    const k = key as IntentKey;
    const d = derive(p, k);
    if (kind === "solid") next.intents[k].fg = null;
    if (kind === "text") next.intents[k].text = toHex(nudgeToContrast(d.text, surface, dir(surface)));
    if (kind === "soft") next.intents[k].softFg = toHex(nudgeToContrast(d.softFg, d.soft, dir(d.soft)));
  }
  return next;
}

export function failures(p: Palette): Check[] {
  return audit(p).filter((c) => !c.pass);
}
