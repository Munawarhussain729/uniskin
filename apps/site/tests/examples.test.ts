import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { INTENTS, SIZES, STATES, STYLES, VOCABULARY } from "uniskin/adapter";
import { buildExamples, CLASS_RE } from "../src/examples";

const doc = readFileSync(resolve(process.cwd(), "../../docs/vocabulary.md"), "utf8");

/** Same known-class set as packages/uniskin/test/vocabulary-docs.test.ts. */
const KNOWN = new Set(
  [...VOCABULARY, ...INTENTS, ...STYLES, ...SIZES, ...STATES].map((n) => `ui-${n}`),
);

const examples = buildExamples(doc);
const covered = new Set(examples.flatMap((e) => e.classes));

/** Classes a documented ui-* token can legitimately appear beside in a
   fenced block without owning its own section (snippet syntax, not a
   class — e.g. `ui-modal` ids). Doc-level list coverage lives in the
   package test; here we assert every KNOWN class has a site example. */
describe("components section examples", () => {
  it("has an example for every class in the v1 vocabulary", () => {
    const missing = [...KNOWN].filter((cls) => !covered.has(cls));
    expect(missing.sort()).toEqual([]);
  });

  it("fails if a documented class has no example", () => {
    /* every ui-* class the doc's code fences mention must be covered —
       a new public class in the doc can't land without an example. */
    const offenders = new Set<string>();
    for (const block of doc.matchAll(/```[^\n]*\n[\s\S]*?```/g)) {
      for (const match of block[0].matchAll(CLASS_RE)) {
        if (KNOWN.has(match[0]) && !covered.has(match[0])) offenders.add(match[0]);
      }
    }
    expect([...offenders].sort()).toEqual([]);
  });

  it("only renders documented classes in example markup", () => {
    const offenders = new Set<string>();
    for (const example of examples) {
      for (const match of example.markup.matchAll(CLASS_RE)) {
        if (!KNOWN.has(match[0])) offenders.add(match[0]);
      }
    }
    expect([...offenders].sort()).toEqual([]);
  });

  it("renders every example class inside its own markup", () => {
    const bad = examples.filter((e) => e.classes.some((c) => !e.markup.includes(c)));
    expect(bad.map((e) => e.id)).toEqual([]);
  });
});
