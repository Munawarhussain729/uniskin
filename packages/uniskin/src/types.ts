/**
 * Uniskin adapter interface.
 *
 * An adapter is a plain object describing how the `ui-*` vocabulary looks.
 * Adapters are deep-merged over the built-in default theme: anything an
 * adapter does not define silently falls back to the default style.
 */

/** A flat map of CSS declarations. Keys are CSS property names. */
export type CssDeclarations = Record<string, string>;

/**
 * CSS rules for one compound selector, expressed as CSS-in-JS.
 * Nested selectors (`&:hover`, `&::after`, `@media …`) are supported —
 * they are resolved relative to the compound selector (e.g.
 * `.ui-button.ui-outline:hover`).
 */
export interface CssRuleObject {
  [key: string]: string | CssRuleObject | undefined;
}

/** Intent modifiers: `.ui-primary`, `.ui-secondary`, … */
export const INTENTS = ["primary", "secondary", "success", "warning", "danger"] as const;
export type Intent = (typeof INTENTS)[number];

/** Style modifiers: `.ui-outline`, `.ui-ghost`, `.ui-soft` (`solid` is the default). */
export const STYLES = ["outline", "ghost", "soft"] as const;
export type StyleModifier = (typeof STYLES)[number];

/** Size modifiers: `.ui-sm`, `.ui-lg` (`md` is the default). */
export const SIZES = ["sm", "lg"] as const;
export type SizeModifier = (typeof SIZES)[number];

/** State modifiers: `.ui-disabled`, `.ui-loading`, `.ui-active`. */
export const STATES = ["disabled", "loading", "active"] as const;
export type StateModifier = (typeof STATES)[number];

/**
 * A component (or component part) definition.
 *
 * Every slot maps to a compound selector on the component class:
 * - `base`             → `.ui-button`
 * - `intents.primary`  → `.ui-button.ui-primary`
 * - `styles.outline`   → `.ui-button.ui-outline`
 * - `sizes.sm`         → `.ui-button.ui-sm`
 * - `states.disabled`  → `.ui-button.ui-disabled`, `.ui-button:disabled`,
 *                        `.ui-button[aria-disabled="true"]`
 */
export interface ComponentDef {
  /** Rules for `.ui-<name>`. */
  base?: CssRuleObject;
  /** Rules for `.ui-<name>.ui-<intent>` — usually just sets `--ui-*` vars. */
  intents?: Partial<Record<Intent, CssRuleObject>>;
  /** Rules for `.ui-<name>.ui-<style>`. */
  styles?: Partial<Record<StyleModifier, CssRuleObject>>;
  /** Rules for `.ui-<name>.ui-<size>`. */
  sizes?: Partial<Record<SizeModifier, CssRuleObject>>;
  /**
   * Rules for `.ui-<name>.ui-<state>` — emitted together with the native
   * equivalents (`:disabled`, `[aria-disabled]`, `[aria-busy]`,
   * `[aria-selected]`, `[aria-pressed]`).
   */
  states?: Partial<Record<StateModifier, CssRuleObject>>;
}

/** Component names shipped in vocabulary v1. */
export const VOCABULARY = [
  "button",
  "input",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "switch",
  "field",
  "field-label",
  "field-hint",
  "field-error",
  "card",
  "card-header",
  "card-body",
  "card-footer",
  "badge",
  "alert",
  "modal",
  "modal-box",
  "tabs",
  "tab",
] as const;
export type ComponentName = (typeof VOCABULARY)[number];

export interface Adapter {
  /** Adapter name, used in build warnings. */
  name: string;
  /**
   * Design tokens — CSS custom properties emitted on `rootSelector`
   * (`:root` by default). Deep-merged over the default tokens: set only
   * what you want to change. Values may reference other variables
   * (`var(--primary)`) including variables you define yourself.
   */
  tokens?: Record<string, string>;
  /**
   * Selector the tokens are emitted under. Defaults to `":root"`.
   * Useful for adapters that target a theme attribute, e.g. `[data-theme=x]`.
   */
  rootSelector?: string;
  /**
   * Token overrides for dark mode, emitted under `.dark, [data-theme="dark"]`
   * and (unless the `dark` plugin option says otherwise) inside
   * `@media (prefers-color-scheme: dark)`. When defined — even as `{}` — it
   * replaces the default theme's dark tokens entirely; leave it undefined to
   * inherit them. Adapters whose tokens already follow an external theme
   * (daisyUI) should set `{}`. Tokens that are `var()` aliases of other
   * variables must be repeated here so they re-resolve inside the dark scope.
   */
  darkTokens?: Record<string, string>;
  /**
   * Selector `darkTokens` are emitted under. Defaults to
   * `'.dark, [data-theme="dark"]'`. Set it when the design system you are
   * porting has its own dark scope, e.g.
   * `'.radix-themes[data-appearance="dark"]'`. How dark mode is *activated*
   * (the `prefers-color-scheme` media query, or class only) stays the
   * consumer's `dark` plugin option.
   */
  darkRootSelector?: string;
  /**
   * Extra `@keyframes`, keyed by name and merged over the built-in
   * `spin`/`pulse`. Emitted as `@keyframes <prefix>-<name>`; reference them
   * from a slot as `animation: "ui-<name> …"` (re-prefixed to match the
   * consumer's `prefix`). Any `animation` is switched off under
   * `prefers-reduced-motion` automatically.
   */
  keyframes?: Record<string, CssRuleObject>;
  /**
   * Per-component overrides, deep-merged over the default theme.
   * Only define what your style changes — everything else falls back.
   */
  components?: Partial<Record<ComponentName, ComponentDef>>;
}

/** Identity helper that gives adapter authors full typing + inference. */
export function defineAdapter<const A extends Adapter>(adapter: A): A {
  return adapter;
}
