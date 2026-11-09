/**
 * Token-to-adapter exporter. Turns a `SkinState` into a plain uniskin
 * adapter object (`tokens`, `darkTokens`, `components`) and renders it as an
 * adapter file or a CSS-variables-only snippet.
 *
 * Contract notes (docs/writing-adapters.md, packages/uniskin/src/types.ts):
 * - `darkTokens`, when defined, REPLACES the default dark tokens, so every
 *   colour token is emitted for dark, not just the ones that changed.
 * - There is no first-class border-width or density token yet; those two
 *   knobs are exported as `components` overrides (see
 *   docs/decisions/0001-skin-builder-tokens.md for the proposal).
 */
import { toHex, parseColor } from "./color";
import {
  INTENT_KEYS,
  resolveFg,
  type IntentKey,
  type Palette,
  type SkinState,
} from "./model";

export type TokenMap = Record<string, string>;
type Rule = { [key: string]: string | Rule | undefined };

export interface ExportedAdapter {
  name: string;
  tokens: TokenMap;
  darkTokens: TokenMap;
  components?: Record<string, Rule>;
}

/** Colour tokens for one mode, in a stable, readable order. */
export function paletteTokens(p: Palette): TokenMap {
  const t: TokenMap = {
    "--ui-neutral": p.neutral.fill,
    "--ui-neutral-fg": p.neutral.fg,
    "--ui-neutral-soft": p.neutral.soft,
    "--ui-neutral-soft-fg": p.neutral.softFg,
  };
  for (const k of INTENT_KEYS) {
    const s = p.intents[k];
    t[`--ui-${k}`] = s.fill;
    t[`--ui-${k}-fg`] = resolveFg(s);
    if (s.text) t[`--ui-${k}-text`] = s.text;
    if (s.softFg) t[`--ui-${k}-soft-fg`] = s.softFg;
  }
  t["--ui-surface"] = p.surface;
  t["--ui-surface-fg"] = p.surfaceFg;
  t["--ui-surface-muted"] = p.surfaceMuted;
  t["--ui-border"] = p.border;
  t["--ui-ring"] = p.ring;
  return t;
}

/** `--ui-radius` and `--ui-font-sans`: shared by both modes. */
export function shapeTokens(s: SkinState): TokenMap {
  return {
    "--ui-font-sans": s.font,
    "--ui-radius": `${trim(s.radius)}rem`,
  };
}

const trim = (n: number): string => String(Math.round(n * 10000) / 10000);

/** Scales every `rem` length in a padding-like string. */
export function scaleRem(value: string, k: number): string {
  return value.replace(/(\d*\.?\d+)rem/g, (_, n: string) => `${trim(parseFloat(n) * k)}rem`);
}

/**
 * Default-theme paddings the density knob scales. A unit test compares each
 * entry to the real default adapter so this table cannot drift silently.
 */
export const DENSITY_TABLE: ReadonlyArray<{
  component: string;
  slot: "base" | "sm" | "lg";
  prop: string;
  value: string;
  /** the default is a `var(--prop, value)` fallback, not a declared property */
  fallback?: true;
}> = [
  { component: "button", slot: "base", prop: "padding", value: "0.5rem 1rem" },
  { component: "button", slot: "sm", prop: "padding", value: "0.375rem 0.75rem" },
  { component: "button", slot: "lg", prop: "padding", value: "0.75rem 1.5rem" },
  { component: "input", slot: "base", prop: "padding", value: "0.5rem 0.75rem" },
  { component: "input", slot: "sm", prop: "padding", value: "0.375rem 0.625rem" },
  { component: "input", slot: "lg", prop: "padding", value: "0.75rem 1rem" },
  { component: "textarea", slot: "base", prop: "padding", value: "0.5rem 0.75rem" },
  { component: "textarea", slot: "sm", prop: "padding", value: "0.375rem 0.625rem" },
  { component: "textarea", slot: "lg", prop: "padding", value: "0.75rem 1rem" },
  { component: "select", slot: "base", prop: "padding", value: "0.5rem 0.75rem" },
  { component: "select", slot: "sm", prop: "padding", value: "0.375rem 0.625rem" },
  { component: "select", slot: "lg", prop: "padding", value: "0.75rem 1rem" },
  { component: "badge", slot: "base", prop: "padding", value: "0.3125rem 0.625rem" },
  { component: "badge", slot: "sm", prop: "padding", value: "0.1875rem 0.5rem" },
  { component: "badge", slot: "lg", prop: "padding", value: "0.4375rem 0.875rem" },
  { component: "alert", slot: "base", prop: "padding", value: "0.875rem 1rem" },
  { component: "alert", slot: "sm", prop: "padding", value: "0.5rem 0.75rem" },
  { component: "alert", slot: "lg", prop: "padding", value: "1.125rem 1.375rem" },
  { component: "card", slot: "base", prop: "--ui-card-pad", value: "1.25rem", fallback: true },
  { component: "card", slot: "sm", prop: "--ui-card-pad", value: "0.75rem" },
  { component: "card", slot: "lg", prop: "--ui-card-pad", value: "1.75rem" },
  { component: "modal-box", slot: "base", prop: "padding", value: "1.5rem" },
  { component: "modal-box", slot: "sm", prop: "padding", value: "1rem" },
  { component: "modal-box", slot: "lg", prop: "padding", value: "2rem" },
  { component: "tabs", slot: "base", prop: "--ui-tab-px", value: "1rem", fallback: true },
  { component: "tabs", slot: "base", prop: "--ui-tab-py", value: "0.5rem", fallback: true },
  { component: "tabs", slot: "sm", prop: "--ui-tab-px", value: "0.75rem" },
  { component: "tabs", slot: "sm", prop: "--ui-tab-py", value: "0.375rem" },
  { component: "tabs", slot: "lg", prop: "--ui-tab-px", value: "1.25rem" },
  { component: "tabs", slot: "lg", prop: "--ui-tab-py", value: "0.75rem" },
];

/** Components whose base rule is `border: 1px solid …` in the default theme. */
export const BORDERED = ["button", "input", "textarea", "select", "card", "badge", "alert"] as const;

export function componentOverrides(s: SkinState): Record<string, Rule> | undefined {
  const out: Record<string, Rule> = {};
  const comp = (name: string): Rule => (out[name] ??= {});
  const slot = (name: string, which: "base" | "sm" | "lg"): Rule => {
    const c = comp(name);
    if (which === "base") return ((c.base as Rule) ??= {});
    const sizes = ((c.sizes as Rule) ??= {});
    return ((sizes[which] as Rule) ??= {});
  };

  if (s.density !== 1) {
    for (const row of DENSITY_TABLE) slot(row.component, row.slot)[row.prop] = scaleRem(row.value, s.density);
  }
  if (s.borderWidth !== 1) {
    for (const name of BORDERED) slot(name, "base")["border-width"] = `${trim(s.borderWidth)}px`;
  }
  return Object.keys(out).length ? out : undefined;
}

export function toAdapter(s: SkinState): ExportedAdapter {
  const components = componentOverrides(s);
  return {
    name: slug(s.name),
    tokens: { ...shapeTokens(s), ...paletteTokens(s.light) },
    darkTokens: paletteTokens(s.dark),
    ...(components ? { components } : {}),
  };
}

export function slug(name: string): string {
  const v = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return v || "my-skin";
}

export type AdapterFormat = "mjs" | "ts";

export function renderAdapterFile(s: SkinState, format: AdapterFormat = "mjs"): string {
  const a = toAdapter(s);
  const body = JSON.stringify(a, null, 2);
  const header =
    format === "ts"
      ? "// Needs Node 22.18+ (native type stripping). On older Node, ship the .mjs export instead."
      : "// ESM adapter — loads on Node 20.19+ / 22.12+ (require(esm)).";
  return [
    "// Generated by the uniskin skin builder (uniskin.dev/builder/).",
    header,
    'import { defineAdapter } from "uniskin/adapter";',
    "",
    `export default defineAdapter(${body});`,
    "",
  ].join("\n");
}

export function adapterFileName(s: SkinState, format: AdapterFormat): string {
  return `${slug(s.name)}.${format}`;
}

const block = (selector: string, tokens: TokenMap, indent = ""): string =>
  `${indent}${selector} {\n${Object.entries(tokens)
    .map(([k, v]) => `${indent}  ${k}: ${v};`)
    .join("\n")}\n${indent}}`;

/** Variables-only CSS: works with the default adapter, no JS file needed. */
export function renderCssSnippet(s: SkinState): string {
  const dark = paletteTokens(s.dark);
  const parts = [
    "/* Generated by the uniskin skin builder. Place after @plugin \"uniskin\". */",
    block(":root", { ...shapeTokens(s), ...paletteTokens(s.light) }),
    block('.dark,\n[data-theme="dark"]', dark),
    `@media (prefers-color-scheme: dark) {\n${block(':root:not(.light):not([data-theme="light"])', dark, "  ")}\n}`,
  ];
  if (s.density !== 1 || s.borderWidth !== 1) {
    parts.push(
      "/* Border width and density have no CSS variable yet — export the adapter file\n   to apply them. */",
    );
  }
  return parts.join("\n\n") + "\n";
}

/** Same variables, scoped for the live preview iframe (beats the media-query rule). */
export function previewCss(s: SkinState): string {
  const comps = componentOverrides(s);
  let extra = "";
  if (comps) {
    for (const [name, def] of Object.entries(comps)) {
      const base = def.base as Rule | undefined;
      if (base) extra += `.ui-${name} {${decls(base)}}\n`;
      const sizes = def.sizes as Record<string, Rule> | undefined;
      for (const [size, rule] of Object.entries(sizes ?? {})) {
        extra += `.ui-${name}.ui-${size} {${decls(rule)}}\n`;
      }
    }
  }
  return [
    block('html.light[data-theme="light"]:root', { ...shapeTokens(s), ...paletteTokens(s.light) }),
    block('html.dark[data-theme="dark"]:root', { ...shapeTokens(s), ...paletteTokens(s.dark) }),
    /* uniskin emits component rules in @layer utilities; staying in that layer
       keeps `.ui-button.ui-sm` (higher specificity) above `.ui-button`. */
    extra ? `@layer utilities {\n${extra}}` : "",
  ].join("\n");
}

const decls = (r: Rule): string =>
  Object.entries(r)
    .filter(([, v]) => typeof v === "string")
    .map(([k, v]) => ` ${k}: ${v};`)
    .join("");

/** Normalises user text to #rrggbb or returns null. */
export function coerceHex(input: string): string | null {
  const rgb = parseColor(input);
  return rgb ? toHex(rgb) : null;
}

export type { IntentKey };
