import {
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
  table: ALL,
  "table-wrap": NONE,
  accordion: { ...ALL, states: [] },
  "accordion-item": NONE,
  "accordion-trigger": NONE,
  "accordion-panel": NONE,
  tooltip: { ...NONE, intents: INTENTS, styles: ["outline", "soft"], sizes: SIZES, states: ["active"] },
  "tooltip-anchor": NONE,
  progress: { ...NONE, intents: INTENTS, styles: ["outline", "ghost"], sizes: SIZES },
};
