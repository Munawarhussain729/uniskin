import { describe, expect, it } from "vitest";
import { defaultAdapter, defaultKeyframes } from "../src/default-theme.js";
import { buildRules } from "../src/emit.js";
import { defineAdapter, type CssRuleObject } from "../src/types.js";

const REDUCED_MOTION = "@media (prefers-reduced-motion: reduce)";

/** Every `animation:` value anywhere in a rule tree (nested rules included). */
function animationValues(rule: CssRuleObject): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(rule)) {
    if (key === "animation" && typeof value === "string") out.push(value);
    else if (typeof value === "object" && value !== null) out.push(...animationValues(value));
  }
  return out;
}

/** Every object in the tree that declares a real `animation` (not `none`). */
function animationNodes(rule: CssRuleObject): CssRuleObject[] {
  const out: CssRuleObject[] = [];
  for (const value of Object.values(rule)) {
    if (typeof value === "object" && value !== null) {
      if (typeof value.animation === "string" && value.animation !== "none") out.push(value);
      out.push(...animationNodes(value));
    }
  }
  return out;
}

describe("keyframes prefix", () => {
  it("emits @keyframes under the default ui- prefix", () => {
    const { base } = buildRules(defaultAdapter, "ui", defaultKeyframes);
    expect(base["@keyframes ui-spin"]).toEqual(defaultKeyframes.spin);
    expect(base["@keyframes ui-pulse"]).toEqual(defaultKeyframes.pulse);
  });

  it("emits @keyframes under a custom prefix", () => {
    const { base } = buildRules(defaultAdapter, "uk", defaultKeyframes);
    expect(base["@keyframes uk-spin"]).toEqual(defaultKeyframes.spin);
    expect(base["@keyframes uk-pulse"]).toEqual(defaultKeyframes.pulse);
    for (const key of Object.keys(base)) {
      expect(key).not.toMatch(/^@keyframes ui-/);
    }
  });

  it("re-points every animation: reference to the custom prefix", () => {
    const { utilities } = buildRules(defaultAdapter, "uk", defaultKeyframes);
    const values = Object.values(utilities).flatMap(animationValues);
    expect(values.length).toBeGreaterThan(0);
    // both stock keyframes are referenced somewhere
    expect(values.some((v) => v.includes("uk-spin"))).toBe(true);
    expect(values.some((v) => v.includes("uk-pulse"))).toBe(true);
    // no reference keeps the default ui- name
    for (const value of values) {
      expect(value).not.toMatch(/(?<![-\w])ui-(spin|pulse)\b/);
    }
  });

  it("keeps ui- references under the default prefix", () => {
    const { utilities } = buildRules(defaultAdapter, "ui", defaultKeyframes);
    const values = Object.values(utilities).flatMap(animationValues);
    expect(values.some((v) => v.includes("ui-spin"))).toBe(true);
    expect(values.some((v) => v.includes("ui-pulse"))).toBe(true);
    for (const value of values) {
      expect(value).not.toContain("uk-");
    }
  });

  it("does not rewrite longer identifiers or custom properties", () => {
    const adapter = defineAdapter({
      name: "edge",
      components: {
        button: {
          base: {
            // looks like a keyframe name but is a longer identifier / a var
            animation: "foo-ui-spin 1s, ui-spinner 1s",
            "--ui-spin": "4s",
          },
        },
      },
    });
    const { utilities } = buildRules(adapter, "uk", defaultKeyframes);
    const button = utilities[".uk-button"];
    expect(button.animation).toBe("foo-ui-spin 1s, ui-spinner 1s");
    expect(button["--ui-spin"]).toBe("4s");
  });
});

describe("prefers-reduced-motion", () => {
  it("adds an override next to every animation declaration in the default theme", () => {
    const { utilities } = buildRules(defaultAdapter, "ui", defaultKeyframes);
    const nodes = Object.values(utilities).flatMap(animationNodes);
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      expect(node[REDUCED_MOTION]).toEqual({ animation: "none" });
    }
  });

  it("covers the nested button ::after spinner", () => {
    const { utilities } = buildRules(defaultAdapter, "ui", defaultKeyframes);
    const loading =
      utilities['.ui-button.ui-loading, .ui-button[aria-busy="true"]'];
    const after = loading["&::after"];
    expect(after.animation).toContain("ui-spin");
    expect(after[REDUCED_MOTION]).toEqual({ animation: "none" });
  });

  it("covers top-level animation declarations (input loading)", () => {
    const { utilities } = buildRules(defaultAdapter, "ui", defaultKeyframes);
    const loading =
      utilities['.ui-input.ui-loading, .ui-input[aria-busy="true"]'];
    expect(loading.animation).toContain("ui-pulse");
    expect(loading[REDUCED_MOTION]).toEqual({ animation: "none" });
  });

  it("overrides survive re-prefixing (uk-)", () => {
    const { utilities } = buildRules(defaultAdapter, "uk", defaultKeyframes);
    const nodes = Object.values(utilities).flatMap(animationNodes);
    for (const node of nodes) {
      expect(node[REDUCED_MOTION]).toEqual({ animation: "none" });
    }
  });

  it('leaves `animation: "none"` alone — no useless override', () => {
    const adapter = defineAdapter({
      name: "still",
      components: {
        badge: { base: { animation: "none" } },
      },
    });
    const { utilities } = buildRules(adapter, "ui", defaultKeyframes);
    expect(utilities[".ui-badge"][REDUCED_MOTION]).toBeUndefined();
  });
});

describe("overlay and intent tokens", () => {
  const { utilities, base } = buildRules(defaultAdapter, "ui", defaultKeyframes);
  const css = JSON.stringify([utilities, base]);

  it("defines overlay tokens in both colour modes and reads them with a fallback", () => {
    expect(defaultAdapter.tokens!["--ui-overlay"]).toBeDefined();
    expect(defaultAdapter.darkTokens!["--ui-overlay-soft"]).toBeDefined();
    expect(css).toContain("var(--ui-overlay, rgb(0 0 0 / 0.5))");
    expect(css).toContain("var(--ui-overlay-soft, rgb(255 255 255 / 0.6))");
  });

  it("lets each intent pin hover, border and soft-hover with today's look as the fallback", () => {
    const primary = utilities[".ui-button.ui-primary"]!;
    expect(primary["--ui-c-hover"]).toBe(
      "var(--ui-primary-hover, color-mix(in oklab, var(--ui-c) 85%, black))",
    );
    expect(primary["--ui-c-border"]).toBe("var(--ui-primary-border, var(--ui-c))");
    expect(primary["--ui-c-soft-hover"]).toBe("var(--ui-primary-soft-hover, var(--ui-c))");
  });
});
