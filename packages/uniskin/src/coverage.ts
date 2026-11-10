import {
  VOCABULARY,
  type Adapter,
  INTENTS,
  SIZES,
  STATES,
  STYLES,
  type ComponentName,
  type Intent,
  type SizeModifier,
  type StateModifier,
  type StyleModifier,
} from "./types.js";

/** Which modifiers a component supports. Mirrors the coverage matrix in `docs/vocabulary.md`. */
export interface Coverage {
  intents: readonly Intent[];
  styles: readonly StyleModifier[];
  sizes: readonly SizeModifier[];
  states: readonly StateModifier[];
}

const NONE: Coverage = { intents: [], styles: [], sizes: [], states: [] };
const ALL: Coverage = { intents: INTENTS, styles: STYLES, sizes: SIZES, states: STATES };

/**
 * The documented coverage matrix, keyed by component. `warnUnsupported`
 * checks adapters against this rather than against every modifier, so a
 * fully conforming adapter is not warned about combinations that are not
 * part of the vocabulary. `test/vocabulary-docs.test.ts` keeps it in sync
 * with the table in `docs/vocabulary.md`.
 */
export const COVERAGE: Record<ComponentName, Coverage> = {
  button: ALL,
  input: ALL,
  textarea: ALL,
  select: ALL,
  checkbox: ALL,
  radio: ALL,
  switch: ALL,
  field: NONE,
  "field-label": NONE,
  "field-hint": NONE,
  "field-error": NONE,
  card: ALL,
  "card-header": NONE,
  "card-body": NONE,
  "card-footer": NONE,
  badge: ALL,
  alert: ALL,
  modal: { ...NONE, styles: ["ghost", "soft"], sizes: SIZES, states: ["active"] },
  "modal-box": { ...NONE, intents: INTENTS, sizes: SIZES },
  tabs: { ...ALL, states: [] },
  tab: { ...NONE, intents: INTENTS, sizes: SIZES, states: STATES },
  /* row states (`ui-disabled`, `ui-active` on a <tr>) are nested selectors in `base`, not slots */
  table: { ...ALL, states: ["loading"] },
  "table-wrap": NONE,
  accordion: { ...ALL, states: [] },
  "accordion-item": NONE,
  "accordion-trigger": NONE,
  "accordion-panel": NONE,
  tooltip: { ...NONE, intents: INTENTS, styles: ["outline", "soft"], sizes: SIZES, states: ["active"] },
  "tooltip-anchor": NONE,
  toast: { ...NONE, intents: INTENTS, styles: ["outline", "soft"], sizes: SIZES, states: ["loading"] },
  "toast-region": NONE,
  dropdown: NONE,
  menu: { ...NONE, styles: ["ghost", "soft"], sizes: SIZES },
  "menu-item": { ...NONE, intents: INTENTS, sizes: SIZES, states: ["disabled", "active"] },
  "menu-label": NONE,
  "menu-separator": NONE,
  avatar: { ...NONE, intents: INTENTS, styles: ["outline", "soft"], sizes: SIZES },
  skeleton: NONE,
  separator: NONE,
  breadcrumb: { ...NONE, sizes: SIZES },
  pagination: { ...NONE, intents: INTENTS, sizes: SIZES },
  "pagination-item": { ...NONE, states: ["disabled", "active"] },
  slider: { ...NONE, intents: INTENTS, sizes: SIZES, states: ["disabled"] },
  progress: { ...NONE, intents: INTENTS, styles: ["outline", "ghost"], sizes: SIZES },
};

/** A component the adapter leaves to the default style, and which slots. */
export interface MissingCoverage {
  component: ComponentName;
  /** `true` when the adapter does not define the component at all. */
  whole: boolean;
  /** Modifier names (`primary`, `outline`, `sm`, `loading`, ...) it does not define. */
  slots: string[];
}

/**
 * What an adapter leaves to the default style, measured against the
 * documented matrix. An intent also counts as covered when the adapter
 * remaps its token (`--ui-primary` ...): the default intent rule picks the
 * variable up.
 */
export function missingCoverage(adapter: Adapter): MissingCoverage[] {
  const out: MissingCoverage[] = [];
  const comps = adapter.components ?? {};
  for (const name of VOCABULARY) {
    const def = comps[name];
    if (!def) {
      out.push({ component: name, whole: true, slots: [] });
      continue;
    }
    const cov = COVERAGE[name];
    const slots: string[] = [];
    for (const intent of cov.intents)
      if (!def.intents?.[intent] && !adapter.tokens?.[`--ui-${intent}`]) slots.push(intent);
    for (const style of cov.styles) if (!def.styles?.[style]) slots.push(style);
    for (const size of cov.sizes) if (!def.sizes?.[size]) slots.push(size);
    for (const state of cov.states) if (!def.states?.[state]) slots.push(state);
    if (slots.length > 0) out.push({ component: name, whole: false, slots });
  }
  return out;
}
