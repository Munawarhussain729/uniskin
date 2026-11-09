import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COVERAGE } from "../src/coverage.js";
import { defaultAdapter } from "../src/default-theme.js";
import { unknownSlots, warnUnsupported } from "../src/merge.js";
import { INTENTS, SIZES, STATES, STYLES, VOCABULARY, type Adapter } from "../src/types.js";

afterEach(() => vi.restoreAllMocks());

/** An adapter that defines exactly the documented matrix, nothing more. */
function conforming(): Adapter {
  const components: Record<string, unknown> = {};
  for (const name of VOCABULARY) {
    const cov = COVERAGE[name];
    const slot = { color: "red" };
    components[name] = {
      base: slot,
      intents: Object.fromEntries(cov.intents.map((k) => [k, slot])),
      styles: Object.fromEntries(cov.styles.map((k) => [k, slot])),
      sizes: Object.fromEntries(cov.sizes.map((k) => [k, slot])),
      states: Object.fromEntries(cov.states.map((k) => [k, slot])),
    };
  }
  return { name: "conforming", components } as Adapter;
}

describe("warnUnsupported", () => {
  it("does not warn a fully conforming adapter", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnUnsupported(conforming(), { debug: true });
    expect(warn).not.toHaveBeenCalled();
  });

  it("names a modifier that is documented but missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const adapter = conforming();
    delete adapter.components!.button!.styles!.soft;
    warnUnsupported(adapter, { debug: true });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain("button (soft)");
  });
});

describe("unknown slot keys", () => {
  it("flags unknown styles, states, intents and groups", () => {
    const adapter = {
      name: "typo",
      components: {
        button: {
          base: {},
          styles: { classic: {}, outline: {} },
          states: { invalid: {} },
          intent: { primary: {} },
          intents: { brand: {} },
        },
      },
    } as unknown as Adapter;
    expect(unknownSlots(adapter).sort()).toEqual([
      "button.intent",
      "button.intents.brand",
      "button.states.invalid",
      "button.styles.classic",
    ]);
  });

  it("warns once, even for built-in adapters, and stays silent when clean", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnUnsupported(defaultAdapter, { builtin: true });
    expect(warn).not.toHaveBeenCalled();
    warnUnsupported(
      { name: "x", components: { card: { styles: { classic: {} } } } } as unknown as Adapter,
      { builtin: true },
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain("card.styles.classic");
  });
});

describe("COVERAGE matches docs/vocabulary.md", () => {
  const doc = readFileSync(resolve(process.cwd(), "../../docs/vocabulary.md"), "utf8");
  const section = doc.slice(doc.indexOf("## Coverage matrix"));
  const rows = [...section.matchAll(/^\| `ui-([a-z-]+)`\s*\|(.*)\|\s*$/gm)];

  /** "✓" = every modifier, "—" = none, otherwise the listed words. */
  function parse(cell: string, all: readonly string[]): string[] {
    const t = cell.trim();
    if (t.startsWith("✓")) return [...all];
    return all.filter((w) => new RegExp(`\\b${w}\\b`).test(t));
  }

  it("has a row for every component", () => {
    expect(rows.map((r) => r[1]).sort()).toEqual([...VOCABULARY].sort());
  });

  it.each(rows.map((r) => [r[1]!, r[2]!] as const))("ui-%s", (name, rest) => {
    const [i, st, sz, s] = rest.split("|");
    const cov = COVERAGE[name as keyof typeof COVERAGE];
    expect([...cov.intents]).toEqual(parse(i!, INTENTS));
    expect([...cov.styles]).toEqual(parse(st!, STYLES));
    expect([...cov.sizes]).toEqual(parse(sz!, SIZES));
    expect([...cov.states]).toEqual(parse(s!, STATES));
  });
});
