import { describe, expect, it } from "vitest";
import { compileAdapter, compileAdapterStderr, compileWithFiles } from "./compile.js";

const ADAPTERS = ["default", "shadcn", "daisyui"] as const;

const INTENTS = ["primary", "secondary", "success", "warning", "danger"] as const;
const STYLES = ["outline", "ghost", "soft"] as const;
const SIZES = ["sm", "lg"] as const;
/** Native equivalents emitted alongside each `.ui-<state>` class. */
const STATES = {
  disabled: [":disabled", '[aria-disabled="true"]'],
  loading: ['[aria-busy="true"]'],
  active: ['[aria-selected="true"]', '[aria-pressed="true"]'],
} as const;
type State = keyof typeof STATES;

interface Slots {
  intents?: boolean;
  styles?: readonly string[];
  sizes?: boolean;
  states?: readonly State[];
}

const FULL: Slots = {
  intents: true,
  styles: STYLES,
  sizes: true,
  states: ["disabled", "loading", "active"],
};

/**
 * The selector matrix every adapter emits — the default theme's slots.
 * Adapters only change what the rules look like, never which exist.
 */
const COMPONENTS: Record<string, Slots> = {
  button: FULL,
  input: FULL,
  textarea: FULL,
  select: FULL,
  checkbox: FULL,
  card: FULL,
  "card-header": {},
  "card-body": {},
  "card-footer": {},
  badge: FULL,
  alert: FULL,
  modal: { styles: ["ghost", "soft"], sizes: true, states: ["active"] },
  "modal-box": { intents: true, sizes: true },
  tabs: { intents: true, styles: STYLES, sizes: true },
  tab: { intents: true, sizes: true, states: ["disabled", "loading", "active"] },
};

const cssCache = new Map<string, string>();
function skin(adapter: string): string {
  let css = cssCache.get(adapter);
  if (css === undefined) cssCache.set(adapter, (css = compileAdapter(adapter)));
  return css;
}

/** Extract a rule block (`selector { … }`) via balanced-brace matching. */
function ruleBlock(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`${selector} rule not found`);
  let depth = 0;
  for (let i = start; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(start, i + 1);
  }
  throw new Error(`unbalanced braces in ${selector}`);
}

/**
 * A rule's own content only — Tailwind appends the injected `&.ui-*`
 * modifier rules inside the base block; the snapshot stops before them.
 */
function baseRule(css: string, selector: string): string {
  const lines = ruleBlock(css, selector).split("\n");
  const cut = lines.findIndex((l) => l.includes("&.ui-"));
  return [...lines.slice(0, cut < 0 ? lines.length : cut), "  }"].join("\n");
}

describe("compiled skins", () => {
  for (const adapter of ADAPTERS) {
    describe(adapter, () => {
      for (const [component, slots] of Object.entries(COMPONENTS)) {
        it(`${component}: emits exactly its defined selectors`, () => {
          const css = skin(adapter);
          const base = `.ui-${component}`;
          const block = ruleBlock(css, base);

          for (const intent of INTENTS) {
            const sel = `${base}.ui-${intent}`;
            if (slots.intents) expect(css, sel).toContain(sel);
            else expect(css, sel).not.toContain(sel);
          }
          for (const style of STYLES) {
            const sel = `${base}.ui-${style}`;
            if (slots.styles?.includes(style)) expect(css, sel).toContain(sel);
            else expect(css, sel).not.toContain(sel);
          }
          for (const size of SIZES) {
            const sel = `${base}.ui-${size}`;
            if (slots.sizes) expect(css, sel).toContain(sel);
            else expect(css, sel).not.toContain(sel);
          }
          for (const state of Object.keys(STATES) as State[]) {
            const sel = `${base}.ui-${state}`;
            if (slots.states?.includes(state)) expect(css, sel).toContain(sel);
            else expect(css, sel).not.toContain(sel);
            /* native equivalents are emitted nested inside the base block */
            if (slots.states?.includes(state))
              for (const native of STATES[state]) expect(block).toContain(`&${native}`);
          }
        });
      }

      it("modifiers never emit as standalone global classes", () => {
        const css = skin(adapter);
        for (const mod of [...INTENTS, ...STYLES, ...SIZES, ...Object.keys(STATES)])
          expect(css).not.toMatch(new RegExp(`^\\s*\\.ui-${mod}\\s*[,{]`, "m"));
      });

      it(".ui-button base rule matches snapshot", () => {
        expect(baseRule(skin(adapter), ".ui-button")).toMatchSnapshot();
      });
    });
  }
});

describe("key declarations", () => {
  it("default: neutral button driven by --ui-* tokens", () => {
    const block = ruleBlock(skin("default"), ".ui-button");
    expect(block).toContain("font-weight: 500");
    expect(block).toContain("border-radius: var(--ui-radius)");
    expect(block).toContain("background-color: var(--ui-c)");
    expect(block).toContain("color: var(--ui-on-c)");
  });

  it("shadcn: h-9 button, neutral outline, shadcn :root tokens", () => {
    const css = skin("shadcn");
    const block = ruleBlock(css, ".ui-button");
    expect(block).toContain("height: 2.25rem");
    expect(block).toContain("font-size: 0.875rem");
    expect(css).toContain("--radius: 0.5rem");
    /* shadcn outline stays neutral — intent colors intentionally don't tint it */
    const outline = ruleBlock(css, ".ui-button.ui-outline");
    expect(outline).toContain("color: hsl(var(--foreground))");
    expect(outline).not.toContain("var(--ui-c)");
  });

  it("daisyui: semibold button sized by daisyUI field tokens", () => {
    const css = skin("daisyui");
    const block = ruleBlock(css, ".ui-button");
    expect(block).toContain("font-weight: 600");
    expect(block).toContain("height: calc(var(--size-field, 0.25rem) * 10)");
    expect(block).toContain("transform: scale(0.97)");
    expect(css).toContain("--ui-radius: var(--radius-field, 0.25rem)");
    expect(ruleBlock(css, ".ui-card")).toContain("border-radius: var(--radius-box, 1rem)");
  });
});

describe("fallback to the default theme", () => {
  it("components an adapter omits entirely still emit the default rules", () => {
    /* neither adapter defines modal or modal-box */
    for (const adapter of ["shadcn", "daisyui"] as const) {
      const modal = ruleBlock(skin(adapter), ".ui-modal");
      expect(modal).toContain("position: fixed");
      expect(modal).toContain("z-index: 1000");
      expect(ruleBlock(skin(adapter), ".ui-modal-box")).toContain(
        "width: min(var(--ui-modal-w, 32rem), 100%)",
      );
    }
    /* daisyui also omits tabs/tab entirely */
    expect(ruleBlock(skin("daisyui"), ".ui-tabs")).toContain(
      "border-bottom: 1px solid var(--ui-border)",
    );
  });

  it("slots an adapter omits fall back per component", () => {
    /* shadcn input defines base/sizes only — states and styles are default */
    const shadcn = skin("shadcn");
    expect(shadcn).toContain(".ui-input.ui-outline");
    expect(shadcn).toContain(".ui-input.ui-disabled");
    expect(ruleBlock(shadcn, ".ui-input")).toContain('&[aria-busy="true"]');
    /* daisyui button defines no states — loading is the default spinner+pulse */
    const daisyui = skin("daisyui");
    expect(daisyui).toContain(".ui-button.ui-loading");
    expect(ruleBlock(daisyui, ".ui-button")).toContain("&:disabled");
  });
});

describe("adapter coverage warnings", () => {
  it("warns about slots an adapter does not define (dev)", () => {
    expect(compileAdapterStderr("shadcn")).toContain(
      '[uniskin] adapter "shadcn" does not define:',
    );
  });

  it("does not print the warning in production builds", () => {
    expect(compileAdapterStderr("shadcn", { NODE_ENV: "production" })).not.toContain(
      "[uniskin]",
    );
  });
});

describe("content scanning", () => {
  const markup = [
    "ui-input ui-danger ui-soft ui-sm",
    "ui-textarea ui-lg",
    "ui-select ui-outline",
    "ui-checkbox ui-success ui-soft",
    "ui-card ui-primary ui-outline ui-lg",
    "ui-card-header ui-card-body ui-card-footer",
    "ui-badge ui-warning ui-ghost",
    "ui-alert ui-danger ui-soft",
    "ui-modal ui-soft",
    "ui-modal-box ui-danger",
    "ui-tabs ui-primary ui-outline",
    "ui-tab",
  ];

  it("emits only the components that are used", () => {
    const css = compileWithFiles({
      "page.html": `<div class="${markup.join(" ")}"></div>`,
    });
    expect(css).toContain(".ui-checkbox.ui-success");
    expect(css).toContain(".ui-modal-box.ui-danger");
    // shared modifiers (ui-danger, ui-soft…) pull in compound rules of every
    // component, but a component's base rule is only emitted when it's used
    expect(css).not.toMatch(/^\s*\.ui-button\s*\{/m);
  });

  it("picks up classes used only in .php files", () => {
    const css = compileWithFiles({
      "page.php": '<?php ?>\n<button class="ui-button ui-warning ui-outline">x</button>\n',
    });
    expect(css).toContain(".ui-button");
    expect(css).toContain(".ui-button.ui-warning");
    expect(css).toContain(".ui-button.ui-outline");
  });

  it("picks up classes used only in .vue files", () => {
    const css = compileWithFiles({
      "Widget.vue": '<template><button class="ui-button ui-success ui-soft">x</button></template>',
    });
    expect(css).toContain(".ui-button.ui-success");
    expect(css).toContain(".ui-button.ui-soft");
  });

  it("does not emit unused component css", () => {
    const css = compileWithFiles({ "index.html": '<div class="p-4">x</div>' });
    expect(css).not.toContain(".ui-button");
  });
});

describe("custom prefix", () => {
  it('prefix: "uk" namespaces classes, keyframes and animation references', () => {
    const css = compileWithFiles(
      { "index.html": '<button class="uk-button uk-loading">x</button>' },
      'prefix: "uk";',
    );
    expect(css).toContain(".uk-button");
    expect(css).toContain(".uk-button.uk-loading");
    expect(css).toContain("@keyframes uk-spin");
    expect(css).toContain("@keyframes uk-pulse");
    expect(css).toContain("uk-pulse 1.2s ease-in-out infinite");
    expect(css).toContain("uk-spin 0.6s linear infinite");
    expect(css).not.toContain("ui-spin");
    expect(css).not.toContain("ui-pulse");
    expect(css).not.toMatch(/\.ui-/);
  });
});
