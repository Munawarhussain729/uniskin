import {
  INTENTS,
  SIZES,
  STATES,
  STYLES,
  type Adapter,
  type CssRuleObject,
  type StateModifier,
} from "./types.js";

/** Native equivalents emitted alongside each `.ui-<state>` class. */
const STATE_NATIVES: Record<StateModifier, string[]> = {
  disabled: [":disabled", '[aria-disabled="true"]'],
  loading: ['[aria-busy="true"]'],
  active: ['[aria-selected="true"]', '[aria-pressed="true"]'],
};

/** Where dark tokens go unless the adapter sets `darkRootSelector`. */
export const DEFAULT_DARK_SELECTOR = '.dark, [data-theme="dark"]';

/** Default class/keyframes prefix — themes reference keyframes as `ui-<name>`. */
export const DEFAULT_PREFIX = "ui";

export interface EmittedRules {
  /** Goes to addBase — :root tokens, keyframes. Always emitted. */
  base: Record<string, unknown>;
  /** Goes to addUtilities — emitted on demand per component. */
  utilities: Record<string, CssRuleObject>;
}

/** Re-point `ui-<keyframe>` references in declaration values at `replacement`. */
function rePrefixKeyframes(
  rule: CssRuleObject,
  ref: RegExp,
  replacement: string,
): CssRuleObject {
  const out: CssRuleObject = {};
  for (const [key, value] of Object.entries(rule)) {
    out[key] =
      typeof value === "string"
        ? value.replace(ref, replacement)
        : value && rePrefixKeyframes(value, ref, replacement);
  }
  return out;
}

/** Re-point `.ui-<class>` references in nested selector keys at `replacement`. */
function rePrefixClassSelectors(
  rule: CssRuleObject,
  ref: RegExp,
  replacement: string,
): CssRuleObject {
  const out: CssRuleObject = {};
  for (const [key, value] of Object.entries(rule)) {
    out[key.replace(ref, replacement)] =
      value && typeof value === "object" ? rePrefixClassSelectors(value, ref, replacement) : value;
  }
  return out;
}

/**
 * Turn a merged adapter into Tailwind plugin rules for a given prefix.
 *
 * Every modifier is emitted as a compound selector
 * (`.ui-button.ui-primary`) so the same modifier can mean different
 * things on different components.
 *
 * Keyframes (the built-in spin/pulse plus any the adapter declares) are emitted as
 * `@keyframes <prefix>-<name>`. `animation:` values in the theme
 * reference them as `ui-<name>` and are re-prefixed to match.
 */
export type DarkStrategy = "media" | "class" | false;

export function buildRules(
  adapter: Adapter,
  prefix: string,
  builtinKeyframes?: Record<string, CssRuleObject>,
  dark: DarkStrategy = "media",
): EmittedRules {
  const p = `${prefix}-`;
  // Adapter keyframes win over the built-ins of the same name.
  const keyframes = { ...builtinKeyframes, ...adapter.keyframes };
  const utilities: Record<string, CssRuleObject> = {};
  const base: Record<string, unknown> = {};

  if (adapter.tokens && Object.keys(adapter.tokens).length > 0) {
    base[adapter.rootSelector ?? ":root"] = adapter.tokens;
  }
  if (dark && adapter.darkTokens && Object.keys(adapter.darkTokens).length > 0) {
    base[adapter.darkRootSelector ?? DEFAULT_DARK_SELECTOR] = adapter.darkTokens;
    if (dark === "media") {
      // OS preference, unless the page explicitly opts into light.
      base["@media (prefers-color-scheme: dark)"] = {
        ':root:not(.light):not([data-theme="light"])': adapter.darkTokens,
      };
    }
  }
  for (const [name, frames] of Object.entries(keyframes ?? {})) {
    base[`@keyframes ${p}${name}`] = frames;
  }

  for (const [name, def] of Object.entries(adapter.components ?? {})) {
    if (!def) continue;
    const cls = `.${p}${name}`;

    if (def.base) utilities[cls] = def.base;

    for (const intent of INTENTS) {
      const rules = def.intents?.[intent];
      if (rules) utilities[`${cls}.${p}${intent}`] = rules;
    }
    for (const style of STYLES) {
      const rules = def.styles?.[style];
      if (rules) utilities[`${cls}.${p}${style}`] = rules;
    }
    for (const size of SIZES) {
      const rules = def.sizes?.[size];
      if (rules) utilities[`${cls}.${p}${size}`] = rules;
    }
    for (const state of STATES) {
      const rules = def.states?.[state];
      if (!rules) continue;
      const selectors = [`${cls}.${p}${state}`, ...STATE_NATIVES[state].map((n) => `${cls}${n}`)];
      utilities[selectors.join(", ")] = rules;
    }
  }

  const kfNames = Object.keys(keyframes ?? {});
  if (kfNames.length > 0 && prefix !== DEFAULT_PREFIX) {
    // The lookbehind keeps custom properties (`--ui-*`) and longer
    // identifiers (`foo-ui-spin`) untouched.
    const ref = new RegExp(`(?<![-\\w])${DEFAULT_PREFIX}-(${kfNames.join("|")})\\b`, "g");
    for (const sel of Object.keys(utilities)) {
      utilities[sel] = rePrefixKeyframes(utilities[sel], ref, `${p}$1`);
    }
  }

  if (prefix !== DEFAULT_PREFIX) {
    // Nested selectors can reference vocabulary classes too (e.g. the
    // table's `& tbody tr.ui-active`) — re-prefix them like the emitted
    // class selectors.
    const clsRef = new RegExp(`\\.${DEFAULT_PREFIX}-([a-zA-Z][\\w-]*)`, "g");
    for (const sel of Object.keys(utilities)) {
      utilities[sel] = rePrefixClassSelectors(utilities[sel], clsRef, `.${p}$1`);
    }
  }

  for (const sel of Object.keys(utilities)) {
    utilities[sel] = withReducedMotion(utilities[sel]);
  }

  return { base, utilities };
}

const REDUCED_MOTION = "@media (prefers-reduced-motion: reduce)";

/**
 * Wherever a rule declares an `animation`, add a reduced-motion override that
 * turns it off (spinners and pulses stay static). Applied recursively so
 * nested rules such as the button's `&::after` spinner are covered.
 */
function withReducedMotion(rule: CssRuleObject): CssRuleObject {
  const out: CssRuleObject = {};
  let animates = false;
  for (const [key, value] of Object.entries(rule)) {
    if (typeof value === "object" && value !== null) out[key] = withReducedMotion(value);
    else {
      out[key] = value;
      if (key === "animation" && typeof value === "string" && value !== "none") animates = true;
    }
  }
  if (animates) out[REDUCED_MOTION] = { animation: "none" };
  return out;
}
