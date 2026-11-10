import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { INTENTS, SIZES, STATES, STYLES, VOCABULARY } from "../src/types.js";

const PREFIX = "ui";

/** Every class that exists in vocabulary v1: components, parts, modifiers. */
const KNOWN = new Set(
  [...VOCABULARY, ...INTENTS, ...STYLES, ...SIZES, ...STATES].map((n) => `${PREFIX}-${n}`),
);

const doc = readFileSync(resolve(process.cwd(), "../../docs/vocabulary.md"), "utf8");

/** Fenced code blocks only — inline prose may mention CSS vars like `--ui-c`. */
function codeBlocks(markdown: string): string[] {
  return [...markdown.matchAll(/```[^\n]*\n[\s\S]*?```/g)].map((m) => m[0]);
}

// `ui-` not preceded by `-`/word char, so `--ui-c` CSS vars don't match.
const CLASS_RE = /(?<![\w-])ui-[a-z0-9-]+/g;

describe("docs/vocabulary.md", () => {
  it("only uses classes that exist in the v1 vocabulary", () => {
    const offenders = new Set<string>();
    for (const block of codeBlocks(doc)) {
      for (const match of block.matchAll(CLASS_RE)) {
        if (!KNOWN.has(match[0])) offenders.add(match[0]);
      }
    }
    expect([...offenders].sort()).toEqual([]);
  });

  it("documents every class in the v1 vocabulary", () => {
    const missing = [...KNOWN].filter((cls) => !doc.includes(`\`${cls}\``));
    expect(missing.sort()).toEqual([]);
  });
});

describe("documented hooks", () => {
  /** Composition variables and the per-intent pins have their own table in writing-adapters.md. */
  const INTERNAL = /^--ui-(c(-[a-z-]+)?|on-c|(primary|secondary|success|warning|danger|neutral)-(text|soft|soft-fg|hover|border|soft-hover))$/;

  it("lists every custom property the default theme reads with a fallback", () => {
    const src = readFileSync(resolve(process.cwd(), "src/default-theme.ts"), "utf8");
    const docs =
      readFileSync(resolve(process.cwd(), "../../docs/writing-adapters.md"), "utf8") + doc;
    const hooks = new Set([...src.matchAll(/var\((--ui-[a-z0-9-]+),/g)].map((m) => m[1]!));
    const undocumented = [...hooks].filter((h) => !INTERNAL.test(h) && !docs.includes(h)).sort();
    expect(undocumented, "hooks the theme reads but no doc mentions").toEqual([]);
  });
});
