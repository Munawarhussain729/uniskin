import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { defaultAdapter } from "../src/default-theme.js";
import { buildRules } from "../src/emit.js";
import uniskin from "../src/index.js";
import { deepMerge, mergeAdapter, resolveAdapter } from "../src/merge.js";
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

describe("resolveAdapter", () => {
  const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

  const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
  // require(ESM) is unflagged since v20.19 / v22.12; type stripping since v22.18.
  const supportsRequireEsm =
    nodeMajor >= 23 || (nodeMajor === 22 && nodeMinor >= 12) || (nodeMajor === 20 && nodeMinor >= 19);
  const supportsTs = nodeMajor >= 23 || (nodeMajor === 22 && nodeMinor >= 18);

  /** A directory whose node_modules only exists relative to `base`. */
  function makeNestedProject(): string {
    const root = mkdtempSync(path.join(tmpdir(), "uniskin-resolve-"));
    for (const [pkg, esm] of [
      ["uniskin-adapter-nested", false],
      ["esm-only-adapter", true],
    ] as const) {
      const dir = path.join(root, "node_modules", pkg);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        path.join(dir, "package.json"),
        JSON.stringify({
          name: pkg,
          version: "0.0.0",
          ...(esm ? { type: "module", exports: { ".": "./index.js" } } : { main: "./index.js" }),
        }),
      );
      writeFileSync(
        path.join(dir, "index.js"),
        esm
          ? `export default { name: "fixture-${pkg}-adapter" };`
          : `module.exports = { name: "fixture-${pkg}-adapter" };`,
      );
    }
    return root;
  }

  it("returns the built-in marker for \"default\"", () => {
    expect(resolveAdapter("default")).toEqual({ name: "default" });
  });

  it("loads a CJS adapter file relative to the base dir", () => {
    expect(resolveAdapter("./adapters/cjs-adapter.cjs", { base: fixtures }).name).toBe(
      "fixture-cjs-adapter",
    );
  });

  it("resolves relative paths from base, not from cwd", () => {
    // The same specifier fails from the test process cwd (the package root)
    // and succeeds relative to the fixture "stylesheet" directory.
    expect(() => resolveAdapter("./fixtures/adapters/cjs-adapter.cjs")).toThrowError(
      /Could not resolve adapter/,
    );
    expect(
      resolveAdapter("./adapters/cjs-adapter.cjs", { base: fixtures }).name,
    ).toBe("fixture-cjs-adapter");
  });

  it.skipIf(!supportsRequireEsm)("loads ESM adapter files (.mjs and type:module .js)", () => {
    expect(resolveAdapter("./adapters/esm-adapter.mjs", { base: fixtures }).name).toBe(
      "fixture-esm-adapter",
    );
    expect(resolveAdapter("./adapters/esm-js-adapter.js", { base: fixtures }).name).toBe(
      "fixture-esm-js-adapter",
    );
  });

  it.skipIf(!supportsTs)("loads .ts adapter files where Node strips types", () => {
    expect(resolveAdapter("./adapters/ts-adapter.ts", { base: fixtures }).name).toBe(
      "fixture-ts-adapter",
    );
  });

  it("finds adapter packages relative to the base dir (monorepo subfolder)", () => {
    const nested = makeNestedProject();
    expect(resolveAdapter("nested", { base: nested }).name).toBe(
      "fixture-uniskin-adapter-nested-adapter",
    );
    // Not reachable from an unrelated base.
    expect(() => resolveAdapter("nested", { base: fixtures })).toThrowError(
      /Could not resolve adapter "nested"/,
    );
  });

  it.skipIf(!supportsRequireEsm)("loads ESM-only adapter packages", () => {
    const nested = makeNestedProject();
    expect(resolveAdapter("esm-only-adapter", { base: nested }).name).toBe(
      "fixture-esm-only-adapter-adapter",
    );
  });

  it("throws an error naming every candidate for a missing package", () => {
    let message = "";
    try {
      resolveAdapter("missing-pkg", { base: fixtures });
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain('Could not resolve adapter "missing-pkg"');
    for (const candidate of [
      "@uniskin/missing-pkg",
      "uniskin-adapter-missing-pkg",
      "missing-pkg",
    ]) {
      expect(message).toContain(candidate);
    }
    expect(message).toContain("Cannot find module");
  });

  it("names the file for a missing relative adapter", () => {
    expect(() => resolveAdapter("./does-not-exist.js", { base: fixtures })).toThrowError(
      /does-not-exist\.js/,
    );
  });

  it("names the file and the underlying cause when an adapter can't be loaded", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "uniskin-broken-"));
    writeFileSync(path.join(dir, "broken-adapter.cjs"), "module.exports = { name: ;\n");
    let message = "";
    try {
      resolveAdapter("./broken-adapter.cjs", { base: dir });
    } catch (err) {
      message = (err as Error).message;
    }
    expect(message).toContain("broken-adapter.cjs");
    expect(message).toMatch(/failed to load|Invalid or unexpected|Unexpected token/i);
  });

  it("reports a resolved module that is not an adapter", () => {
    expect(() =>
      resolveAdapter("./adapters/not-an-adapter.cjs", { base: fixtures }),
    ).toThrowError(/not-an-adapter\.cjs.*does not export a uniskin adapter/);
  });
});

describe("uniskin plugin adapter base", () => {
  const cssDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "css");

  it("resolves the adapter relative to the @plugin stylesheet's directory", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // What Tailwind passes as `this` when calling details.plugin(details.options):
    // src is the @plugin at-rule's SourceLocation — src[0].file is the stylesheet.
    const details = { src: [{ file: path.join(cssDir, "skin.css"), code: "" }, 0, 0] };
    const { handler } = uniskin.call(details, { adapter: "./adapters/local-adapter.cjs" });

    const bases: Record<string, unknown>[] = [];
    handler({
      addBase: (b) => bases.push(b),
      addUtilities: () => {},
    });
    const root = bases.find((b) => ":root" in b)?.[":root"] as Record<string, string>;
    expect(root["--ui-fixture-loaded"]).toBe("yes");
    warn.mockRestore();
  });

  it("falls back to cwd when invoked without Tailwind's call context", () => {
    // `./adapters/…` does not exist relative to the package cwd…
    expect(() => uniskin({ adapter: "./adapters/local-adapter.cjs" })).toThrowError(
      /Could not resolve adapter/,
    );
    // …but the same file resolves when addressed from the cwd.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() =>
      uniskin({ adapter: "./test/fixtures/css/adapters/local-adapter.cjs" }),
    ).not.toThrow();
    warn.mockRestore();
  });

  it("falls back to cwd for every odd-but-harmless `this` shape", () => {
    // None of these contexts carry a usable stylesheet path — a direct JS
    // call, a caller that binds `{}`, stdin CSS (file: null), or a Tailwind
    // version that doesn't forward `src` (e.g. 4.0.0). Resolution must land
    // on the process cwd rather than throw.
    const oddContexts = [
      {},
      42,
      "string",
      null,
      { src: null },
      { src: [] },
      { src: [null, 0, 0] },
      { src: [{ file: null }, 0, 0] },
      { src: [{}, 0, 0] },
      { options: { adapter: "x" } },
    ];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const context of oddContexts) {
      const { handler } = uniskin.call(context, {
        adapter: "./test/fixtures/css/adapters/local-adapter.cjs",
      });
      const bases: Record<string, unknown>[] = [];
      handler({
        addBase: (b) => bases.push(b),
        addUtilities: () => {},
      });
      // The adapter loaded and the build produced its :root tokens.
      const root = bases.find((b) => ":root" in b)?.[":root"] as Record<string, string>;
      expect(root["--ui-fixture-loaded"], JSON.stringify(context)).toBe("yes");
    }
    warn.mockRestore();
  });

  it("throws a clear error when `this.src` has an unexpected shape", () => {
    const malformedContexts = [
      { src: "styles.css" },
      { src: { file: "styles.css" } },
      { src: [42] },
      { src: [["nested", "array"]] },
      { src: [{ file: 123 }] },
    ];
    for (const context of malformedContexts) {
      expect(() => uniskin.call(context, {}), JSON.stringify(context)).toThrowError(
        /\[uniskin\] Unexpected Tailwind plugin context/,
      );
    }
  });
});
