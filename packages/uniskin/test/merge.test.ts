import { describe, expect, it } from "vitest";
import { defaultAdapter } from "../src/default-theme.js";
import { buildRules } from "../src/emit.js";
import { deepMerge, mergeAdapter } from "../src/merge.js";
import { defineAdapter } from "../src/types.js";

describe("deepMerge", () => {
  it("overrides scalars and merges nested objects", () => {
    expect(
      deepMerge(
        { a: "1", nested: { x: "1", y: "2" } },
        { a: "9", nested: { y: "8", z: "7" } },
      ),
    ).toEqual({ a: "9", nested: { x: "1", y: "8", z: "7" } });
  });

  it("returns the override when types differ", () => {
    expect(deepMerge({ a: { b: "1" } }, { a: "flat" })).toEqual({ a: "flat" });
  });
});

describe("mergeAdapter fallback", () => {
  it("keeps every default token when the adapter defines none", () => {
    const merged = mergeAdapter(defaultAdapter, defineAdapter({ name: "bare" }));
    expect(merged.tokens).toEqual(defaultAdapter.tokens);
    expect(merged.components).toEqual(defaultAdapter.components);
  });

  it("overrides only the tokens the adapter sets", () => {
    const merged = mergeAdapter(
      defaultAdapter,
      defineAdapter({ name: "x", tokens: { "--ui-primary": "red" } }),
    );
    expect(merged.tokens?.["--ui-primary"]).toBe("red");
    expect(merged.tokens?.["--ui-danger"]).toBe(defaultAdapter.tokens?.["--ui-danger"]);
  });

  it("fills missing intents/styles/sizes/states from the default", () => {
    const merged = mergeAdapter(
      defaultAdapter,
      defineAdapter({
        name: "x",
        components: {
          button: { intents: { primary: { "--ui-c": "hotpink" } } },
        },
      }),
    );
    const button = merged.components!.button!;
    // the adapter's value wins…
    expect(button.intents?.primary?.["--ui-c"]).toBe("hotpink");
    // …while the rest of the default slot remains (deep merge)
    expect(button.intents?.primary?.["--ui-on-c"]).toBe("var(--ui-primary-fg)");
    expect(button.intents?.danger).toEqual(defaultAdapter.components?.button?.intents?.danger);
    expect(button.styles?.outline).toEqual(defaultAdapter.components?.button?.styles?.outline);
    expect(button.sizes?.sm).toEqual(defaultAdapter.components?.button?.sizes?.sm);
    expect(button.states?.disabled).toEqual(defaultAdapter.components?.button?.states?.disabled);
    expect(button.base).toEqual(defaultAdapter.components?.button?.base);
  });

  it("deep-merges within a slot instead of replacing it", () => {
    const merged = mergeAdapter(
      defaultAdapter,
      defineAdapter({
        name: "x",
        components: {
          button: { base: { "border-radius": "999px" } },
        },
      }),
    );
    const base = merged.components!.button!.base!;
    expect(base["border-radius"]).toBe("999px");
    expect(base.display).toBe("inline-flex"); // untouched default property
  });

  it("keeps adapter name and honors rootSelector", () => {
    const merged = mergeAdapter(
      defaultAdapter,
      defineAdapter({ name: "mine", rootSelector: "[data-theme=mine]" }),
    );
    expect(merged.name).toBe("mine");
    expect(merged.rootSelector).toBe("[data-theme=mine]");
  });
});

describe("buildRules", () => {
  it("emits tokens on :root", () => {
    const { base } = buildRules(defaultAdapter, "ui");
    expect(base[":root"]).toEqual(defaultAdapter.tokens);
  });

  it("emits modifiers as compound selectors, never standalone", () => {
    const { utilities } = buildRules(defaultAdapter, "ui");
    expect(utilities[".ui-button"]).toBeDefined();
    expect(utilities[".ui-button.ui-primary"]).toBeDefined();
    expect(utilities[".ui-button.ui-outline"]).toBeDefined();
    expect(utilities[".ui-button.ui-sm"]).toBeDefined();
    // no global modifier classes
    expect(utilities[".ui-primary"]).toBeUndefined();
    expect(utilities[".ui-outline"]).toBeUndefined();
    expect(utilities[".ui-sm"]).toBeUndefined();
  });

  it("pairs state classes with their native selectors", () => {
    const { utilities } = buildRules(defaultAdapter, "ui");
    const keys = Object.keys(utilities);
    expect(keys).toContain(
      '.ui-button.ui-disabled, .ui-button:disabled, .ui-button[aria-disabled="true"]',
    );
    expect(keys).toContain('.ui-button.ui-loading, .ui-button[aria-busy="true"]');
    expect(keys).toContain(
      '.ui-button.ui-active, .ui-button[aria-selected="true"], .ui-button[aria-pressed="true"]',
    );
  });

  it("honors a custom prefix", () => {
    const { utilities } = buildRules(defaultAdapter, "uk");
    expect(utilities[".uk-button.uk-primary"]).toBeDefined();
    expect(utilities[".ui-button"]).toBeUndefined();
  });
});
