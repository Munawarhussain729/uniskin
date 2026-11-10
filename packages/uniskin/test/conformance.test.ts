import { describe, expect, it } from "vitest";
import { checkAdapter } from "../src/conformance.js";
import { COVERAGE } from "../src/coverage.js";
import { defaultAdapter } from "../src/default-theme.js";
import { buildRules } from "../src/emit.js";
import { mergeAdapter } from "../src/merge.js";
import { VOCABULARY, defineAdapter, type Adapter } from "../src/types.js";

/**
 * A deliberately different third adapter: a classless-CSS look (Pico-style
 * flat tokens and one hand-written component) that shares nothing with the
 * shadcn or daisyUI ports. It proves the contract holds for a port that
 * defines almost nothing: everything else falls back to the default theme.
 */
const flat = defineAdapter({
  name: "flat",
  tokens: { "--ui-radius": "0", "--ui-surface": "#fff", "--ui-surface-fg": "#111" },
  components: {
    button: {
      base: { "text-transform": "uppercase", "letter-spacing": "0.05em" },
      sizes: { sm: { "font-size": "0.75rem" } },
    },
  },
});

describe("checkAdapter", () => {
  it("reports the default adapter as complete", () => {
    const report = checkAdapter(defaultAdapter);
    expect(report.missing).toEqual([]);
    expect(report.unknownSlots).toEqual([]);
    expect(report.complete).toBe(true);
    expect(report.covered).toBe(report.total);
  });

  it("counts a total that matches the documented matrix", () => {
    let expected = 0;
    for (const name of VOCABULARY) {
      const c = COVERAGE[name];
      expected += 1 + c.intents.length + c.styles.length + c.sizes.length + c.states.length;
    }
    expect(checkAdapter({ name: "empty" }).total).toBe(expected);
  });

  it("an empty adapter is valid: everything is missing, nothing is covered", () => {
    const report = checkAdapter({ name: "empty" });
    expect(report.covered).toBe(0);
    expect(report.missing).toHaveLength(VOCABULARY.length);
    expect(report.missing.every((m) => m.whole)).toBe(true);
    expect(report.complete).toBe(false);
  });

  it("a partial adapter lists exactly the slots it lacks", () => {
    const report = checkAdapter(flat);
    const button = report.missing.find((m) => m.component === "button")!;
    expect(button.whole).toBe(false);
    expect(button.slots).not.toContain("sm");
    expect(button.slots).toContain("lg");
    expect(report.missing.some((m) => m.component === "menu" && m.whole)).toBe(true);
    expect(report.covered).toBeGreaterThan(0);
    expect(report.covered).toBeLessThan(report.total);
  });

  it("counts an intent as covered when the adapter remaps its token", () => {
    const adapter: Adapter = {
      name: "tokens",
      tokens: { "--ui-primary": "red" },
      components: { button: { base: {} } },
    };
    const button = checkAdapter(adapter).missing.find((m) => m.component === "button")!;
    expect(button.slots).not.toContain("primary");
    expect(button.slots).toContain("danger");
  });

  it("flags slot keys outside the closed modifier sets", () => {
    const adapter = {
      name: "typo",
      components: { button: { base: {}, styles: { classic: { color: "red" } } } },
    } as unknown as Adapter;
    expect(checkAdapter(adapter).unknownSlots).toEqual(["button.styles.classic"]);
  });

  it("a third adapter still compiles every component through the default fallback", () => {
    const rules = buildRules(mergeAdapter(defaultAdapter, flat), "ui");
    const selectors = Object.keys(rules.utilities).join("\n");
    for (const name of VOCABULARY) expect(selectors, name).toContain(`.ui-${name}`);
    // its own slot wins over the default
    const button = rules.utilities[".ui-button"] as Record<string, string>;
    expect(button["text-transform"]).toBe("uppercase");
  });
});
