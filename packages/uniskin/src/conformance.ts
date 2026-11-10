import { COVERAGE, missingCoverage, type MissingCoverage } from "./coverage.js";
import { unknownSlots } from "./merge.js";
import { VOCABULARY, type Adapter } from "./types.js";

/** The result of {@link checkAdapter}. */
export interface ConformanceReport {
  adapter: string;
  /** Modifier combinations in the documented matrix, plus one per component's base. */
  total: number;
  /** How many of them the adapter defines itself. */
  covered: number;
  /** What falls back to the default style. */
  missing: MissingCoverage[];
  /** Slot keys outside the closed modifier sets; these are never emitted. */
  unknownSlots: string[];
  /** `true` when nothing is missing and no slot is unknown. */
  complete: boolean;
}

/**
 * Check an adapter against the documented coverage matrix. Nothing is
 * required: whatever an adapter leaves out falls back to the default style,
 * so a partial adapter is valid. This reports what falls back, so an author
 * can see how far a port has got.
 *
 * ```ts
 * import { checkAdapter } from "uniskin/conformance";
 * const report = checkAdapter(myAdapter);
 * console.log(`${report.covered}/${report.total}`, report.missing);
 * ```
 */
export function checkAdapter(adapter: Adapter): ConformanceReport {
  let total = 0;
  for (const name of VOCABULARY) {
    const c = COVERAGE[name];
    total += 1 + c.intents.length + c.styles.length + c.sizes.length + c.states.length;
  }
  const missing = missingCoverage(adapter);
  let gaps = 0;
  for (const m of missing) {
    const c = COVERAGE[m.component];
    gaps += m.whole ? 1 + c.intents.length + c.styles.length + c.sizes.length + c.states.length : m.slots.length;
  }
  const unknown = unknownSlots(adapter);
  return {
    adapter: adapter.name,
    total,
    covered: total - gaps,
    missing,
    unknownSlots: unknown,
    complete: missing.length === 0 && unknown.length === 0,
  };
}
