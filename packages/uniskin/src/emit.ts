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

export interface EmittedRules {
  /** Goes to addBase — :root tokens, keyframes. Always emitted. */
  base: Record<string, unknown>;
  /** Goes to addUtilities — emitted on demand per component. */
  utilities: Record<string, CssRuleObject>;
}

/**
 * Turn a merged adapter into Tailwind plugin rules for a given prefix.
 *
 * Every modifier is emitted as a compound selector
 * (`.ui-button.ui-primary`) so the same modifier can mean different
 * things on different components.
 */
export function buildRules(adapter: Adapter, prefix: string): EmittedRules {
  const p = `${prefix}-`;
  const utilities: Record<string, CssRuleObject> = {};
  const base: Record<string, unknown> = {};

  if (adapter.tokens && Object.keys(adapter.tokens).length > 0) {
    base[adapter.rootSelector ?? ":root"] = adapter.tokens;
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

  return { base, utilities };
}
