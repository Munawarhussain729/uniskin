import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultAdapter } from "uniskin";
import { describe, expect, it } from "vitest";
import { contrast, mixOklab, parseColor, pickOnColor, toHex } from "../src/builder/color";
import {
  BORDERED,
  DENSITY_TABLE,
  paletteTokens,
  renderAdapterFile,
  renderCssSnippet,
  scaleRem,
  slug,
  toAdapter,
} from "../src/builder/export";
import {
  DEFAULT_DARK_OKLCH,
  DEFAULT_FONT,
  DEFAULT_LIGHT_OKLCH,
  INTENT_KEYS,
  PRESETS,
  audit,
  defaultState,
  failures,
  fixCheck,
  type SkinState,
} from "../src/builder/model";

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const tailwind = join(siteRoot, "node_modules", ".bin", "tailwindcss");

const rgb = (css: string) => {
  const c = parseColor(css);
  if (!c) throw new Error(`unparseable: ${css}`);
  return c;
};

/** Body of the first top-level `selector { ... }` rule, braces balanced. */
function ruleBody(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return "";
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(css.indexOf("{", start) + 1, i);
  }
  return "";
}

/** Max per-channel difference in 8-bit steps. */
const delta = (a: string, b: string) =>
  Math.max(...rgb(a).map((v, i) => Math.abs(v - rgb(b)[i]) * 255));

describe("defaults stay in sync with the real default adapter", () => {
  it("light tokens", () => {
    expect(DEFAULT_LIGHT_OKLCH).toEqual(
      Object.fromEntries(
        Object.entries(defaultAdapter.tokens ?? {}).filter(([k]) => k in DEFAULT_LIGHT_OKLCH),
      ),
    );
  });
  it("dark tokens", () => {
    expect(DEFAULT_DARK_OKLCH).toEqual(defaultAdapter.darkTokens);
  });
  it("font", () => {
    expect(DEFAULT_FONT).toBe(defaultAdapter.tokens?.["--ui-font-sans"]);
  });
  it("density table and bordered list match the real component rules", () => {
    const comps = defaultAdapter.components as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const row of DENSITY_TABLE) {
      const def = comps[row.component];
      if (row.fallback) {
        expect(JSON.stringify(defaultAdapter.components), `${row.prop} fallback`).toContain(
          `var(${row.prop}, ${row.value})`,
        );
        continue;
      }
      const rule = row.slot === "base" ? def.base : def.sizes[row.slot];
      expect(rule[row.prop], `${row.component}.${row.slot}.${row.prop}`).toBe(row.value);
    }
    for (const name of BORDERED) {
      expect(String(comps[name].base.border), name).toMatch(/^1px solid/);
    }
  });
});

describe("colour maths", () => {
  it("hex round-trips and contrast matches WCAG reference values", () => {
    expect(toHex(rgb("#abc"))).toBe("#aabbcc");
    expect(contrast(rgb("#000"), rgb("#fff"))).toBeCloseTo(21, 5);
    expect(contrast(rgb("#767676"), rgb("#fff"))).toBeCloseTo(4.54, 2);
  });
  it("oklab mix is a straight blend in oklab", () => {
    expect(toHex(mixOklab(rgb("#ffffff"), 50, rgb("#ffffff")))).toBe("#ffffff");
    expect(toHex(mixOklab(rgb("#000"), 100, rgb("#fff")))).toBe("#000000");
  });
  it("pickOnColor always clears 4.5:1", () => {
    for (let l = 0; l <= 255; l += 15) {
      const fill = rgb(`#${[l, l, l].map((n) => n.toString(16).padStart(2, "0")).join("")}`);
      expect(contrast(rgb(pickOnColor(fill)), fill)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("token exporter", () => {
  it("default state reproduces the default theme's colours", () => {
    const a = toAdapter(defaultState());
    for (const [k, v] of Object.entries(DEFAULT_LIGHT_OKLCH)) {
      expect(delta(a.tokens[k], v), k).toBeLessThanOrEqual(1);
    }
    for (const [k, v] of Object.entries(DEFAULT_DARK_OKLCH)) {
      expect(delta(a.darkTokens[k], v), k).toBeLessThanOrEqual(1);
    }
    expect(a.tokens["--ui-radius"]).toBe("0.5rem");
    expect(a.components).toBeUndefined();
  });

  it("darkTokens covers every default dark token (it replaces them entirely)", () => {
    const a = toAdapter(defaultState());
    for (const k of Object.keys(defaultAdapter.darkTokens ?? {})) {
      expect(a.darkTokens, k).toHaveProperty(k);
    }
  });

  it("emits --ui-<intent>-text / -soft-fg only when pinned", () => {
    const s = defaultState();
    expect(Object.keys(paletteTokens(s.light)).some((k) => /-(text|soft-fg)$/.test(k) && !k.includes("neutral"))).toBe(false);
    s.light.intents.warning.text = "#7a5a00";
    s.light.intents.warning.softFg = "#5c4300";
    const t = paletteTokens(s.light);
    expect(t["--ui-warning-text"]).toBe("#7a5a00");
    expect(t["--ui-warning-soft-fg"]).toBe("#5c4300");
  });

  it("density scales paddings; border width adds border-width", () => {
    const s = { ...defaultState(), density: 1.5, borderWidth: 2 };
    const c = toAdapter(s).components as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(c.button.base.padding).toBe("0.75rem 1.5rem");
    expect(c.button.sizes.sm.padding).toBe("0.5625rem 1.125rem");
    expect(c.button.base["border-width"]).toBe("2px");
    expect(c.card.base["--ui-card-pad"]).toBe("1.875rem");
    expect(scaleRem("0.5rem 1rem", 2)).toBe("1rem 2rem");
  });

  it("slugifies the adapter name", () => {
    expect(slug("  Acme Brand!  ")).toBe("acme-brand");
    expect(slug("***")).toBe("my-skin");
  });

  it("css snippet has :root, class/attribute dark and the media-query dark block", () => {
    const css = renderCssSnippet(defaultState());
    expect(css).toMatch(/:root \{[^}]*--ui-primary: #/);
    expect(css).toMatch(/\.dark,\n\[data-theme="dark"\] \{/);
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\n {2}:root:not\(\.light\):not\(\[data-theme="light"\]\) \{/);
    expect(css).not.toMatch(/border width/i);
    expect(renderCssSnippet({ ...defaultState(), density: 1.2 })).toMatch(/no CSS variable yet/);
  });
});

describe("accessibility audit", () => {
  it("flags a light warning fill with white text and offers a fix", () => {
    const s = defaultState();
    s.light.intents.warning = { fill: "#ffd43b", fg: "#ffffff", text: null, softFg: null };
    const bad = failures(s.light).map((c) => c.id);
    expect(bad).toContain("solid:warning");
    expect(bad).toContain("text:warning");
    let fixed = fixCheck(s.light, "solid:warning");
    fixed = fixCheck(fixed, "text:warning");
    expect(failures(fixed).map((c) => c.id)).not.toContain("solid:warning");
    expect(failures(fixed).map((c) => c.id)).not.toContain("text:warning");
  });

  it("every preset passes all checks in both modes", () => {
    for (const p of PRESETS) {
      const s = p.apply(defaultState());
      expect(failures(s.light).map((c) => `${p.id}/light/${c.id}=${c.ratio.toFixed(2)}`)).toEqual([]);
      expect(failures(s.dark).map((c) => `${p.id}/dark/${c.id}=${c.ratio.toFixed(2)}`)).toEqual([]);
    }
  });

  it("covers body text, ring, neutral and each intent", () => {
    const ids = audit(defaultState().light).map((c) => c.id);
    for (const k of INTENT_KEYS) expect(ids).toEqual(expect.arrayContaining([`solid:${k}`, `text:${k}`, `soft:${k}`]));
    expect(ids).toEqual(expect.arrayContaining(["body", "ring", "solid:neutral", "soft:neutral"]));
  });
});

/* ------------------------------------------------------------------------
   Contract test: write the generated adapter to disk, load it through the
   real Tailwind plugin and assert on the emitted CSS.
   ------------------------------------------------------------------------ */

function compile(state: SkinState): { css: string; stderr: string } {
  const root = join(siteRoot, "tests", "__out__");
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(join(root, "run-"));
  writeFileSync(join(dir, "skin.mjs"), renderAdapterFile(state, "mjs"));
  writeFileSync(
    join(dir, "probe.html"),
    '<button class="ui-button ui-primary ui-sm">a</button><input class="ui-input"><div class="ui-card ui-lg ui-warning ui-soft"></div><span class="ui-badge ui-danger"></span>',
  );
  writeFileSync(
    join(dir, "in.css"),
    '@import "tailwindcss" source(none);\n@plugin "uniskin" { adapter: "./skin.mjs"; }\n@source "./probe.html";\n',
  );
  const out = join(dir, "out.css");
  const res = spawnSync(tailwind, ["-i", join(dir, "in.css"), "-o", out], {
    cwd: siteRoot,
    encoding: "utf8",
  });
  if (res.status !== 0) throw new Error(`tailwindcss failed:\n${res.stderr}`);
  const stderr = res.stderr;
  return { css: readFileSync(out, "utf8"), stderr };
}

describe("generated adapter loads through the uniskin plugin", () => {
  const state: SkinState = (() => {
    const s = defaultState();
    s.name = "Contract Test";
    s.light.intents.primary = { fill: "#0b7285", fg: null, text: null, softFg: null };
    s.dark.intents.primary = { fill: "#3bc9db", fg: null, text: null, softFg: null };
    s.light.intents.warning.text = "#6b4e00";
    s.radius = 1;
    s.density = 1.25;
    s.borderWidth = 2;
    s.font = "Georgia, serif";
    return s;
  })();
  const { css, stderr } = compile(state);

  it("compiles without warnings", () => {
    // Match diagnostics, not component names: a class such as `field-error`
    // may legitimately appear in plugin output. A custom adapter that only
    // overrides tokens gets one informational "fall back to the default
    // style" line from the plugin; that is expected, anything else is not.
    // eslint-disable-next-line no-control-regex
    const plain = stderr.replace(/\u001b\[[0-9;]*m/g, "");
    const unexpected = plain
      .split("\n")
      .filter((line) => !/modifier combinations fall back to the default style/.test(line))
      .join("\n");
    expect(unexpected).not.toMatch(/\[uniskin\]|^\s*(error|warn(ing)?)\b|could not resolve/im);
  });

  it("emits the chosen tokens on :root", () => {
    expect(css).toMatch(/:root[^{]*\{[^}]*--ui-primary:\s*#0b7285/);
    expect(css).toMatch(/--ui-radius:\s*1rem/);
    expect(css).toMatch(/--ui-font-sans:\s*Georgia, serif/);
    expect(css).toMatch(/--ui-warning-text:\s*#6b4e00/);
  });

  it("emits the full dark token set under .dark and prefers-color-scheme", () => {
    const dark = css.match(/\.dark,\s*\[data-theme="dark"\]\s*\{([^}]*)\}/);
    expect(dark).not.toBeNull();
    for (const k of Object.keys(defaultAdapter.darkTokens ?? {})) expect(dark![1]).toContain(`${k}:`);
    expect(dark![1]).toMatch(/--ui-primary:\s*#3bc9db/);
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)/);
  });

  it("applies density and border-width to the component rules", () => {
    expect(ruleBody(css, ".ui-button")).toContain("padding: 0.625rem 1.25rem");
    expect(ruleBody(css, ".ui-button")).toContain("border-width: 2px");
    expect(ruleBody(css, ".ui-button.ui-sm")).toContain("padding: 0.4688rem 0.9375rem");
    expect(ruleBody(css, ".ui-input")).toContain("border-width: 2px");
    expect(ruleBody(css, ".ui-card")).toContain("--ui-card-pad: 1.5625rem");
  });

  it("keeps the default component rules the adapter did not touch", () => {
    expect(css).toContain(".ui-button.ui-primary");
    expect(css).toMatch(/\.ui-card\.ui-warning/);
  });
});
