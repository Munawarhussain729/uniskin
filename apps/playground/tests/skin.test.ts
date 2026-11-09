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
  radio: FULL,
  switch: FULL,
  field: {},
  "field-label": {},
  "field-hint": {},
  "field-error": {},
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
  /* tr-level selected/disabled live in nested base selectors (decision
     003 §4), so the emitted states slot only covers table-level loading */
  table: { intents: true, styles: STYLES, sizes: true, states: ["loading"] },
  "table-wrap": {},
  /* parts take no modifiers; native <details> has no disabled/loading state */
  accordion: { intents: true, styles: STYLES, sizes: true },
  "accordion-item": {},
  "accordion-trigger": {},
  "accordion-panel": {},
  /* native <progress>: no states (indeterminate is the :indeterminate pseudo-class) */
  progress: { intents: true, styles: ["outline", "ghost"], sizes: true },
  tooltip: { intents: true, styles: ["outline", "soft"], sizes: true, states: ["active"] },
  "tooltip-anchor": {},
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
  it("is quiet for built-in adapters by default", () => {
    expect(compileAdapterStderr("shadcn")).not.toContain("[uniskin]");
  });

  it("lists undefined slots for built-in adapters with UNISKIN_DEBUG=1", () => {
    expect(compileAdapterStderr("shadcn", { UNISKIN_DEBUG: "1" })).toContain(
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
    "ui-radio ui-primary ui-outline",
    "ui-switch ui-success ui-soft",
    "ui-field ui-field-label ui-field-hint ui-field-error",
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

describe("radio and checkbox/select gap fixes (decision 003, wave 1)", () => {
  for (const adapter of ["default", "shadcn", "daisyui"]) {
    describe(adapter, () => {
      const css = () => skin(adapter);

      it("ui-radio styles native :checked and headless [aria-checked]", () => {
        const block = ruleBlock(css(), ".ui-radio");
        expect(block).toContain("&:checked");
        expect(block).toContain('&[aria-checked="true"]');
        expect(block).toContain("border-radius: 50%");
      });

      it("ui-radio is not scoped to a wrapper and adds no global token", () => {
        expect(css()).not.toMatch(/--ui-shadow\b/);
        expect(css()).not.toMatch(/label\.ui-radio/);
      });

      it("ui-checkbox also keys off [aria-checked] true and mixed", () => {
        const block = ruleBlock(css(), ".ui-checkbox");
        expect(block).toContain('&[aria-checked="true"]');
        expect(block).toContain('&[aria-checked="mixed"]');
        expect(block).toContain(":indeterminate");
      });

      it("ui-select drops the chevron on [multiple] and [size]", () => {
        const block = ruleBlock(css(), ".ui-select");
        expect(block).toContain('&[multiple], &[size]:not([size="1"])');
        expect(block).toContain("background-image: none");
      });
    });
  }

  it("radio hooks: shadcn and daisyUI set size, default reads it with a fallback", () => {
    expect(ruleBlock(skin("default"), ".ui-radio")).toContain("var(--ui-radio-size, 1.125rem)");
    expect(ruleBlock(skin("default"), ".ui-radio")).toContain("var(--ui-radio-dot-size, 0.5em)");
    expect(ruleBlock(skin("shadcn"), ".ui-radio")).toContain("--ui-radio-size: 1rem");
    expect(ruleBlock(skin("daisyui"), ".ui-radio")).toContain("--size-selector");
  });

  it("radio transitions are disabled under prefers-reduced-motion", () => {
    const block = ruleBlock(skin("default"), ".ui-radio");
    expect(block).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/);
  });

  it('prefix: "uk" renames radio classes and keyframes', () => {
    const css = compileWithFiles(
      { "index.html": '<input type="radio" class="uk-radio uk-primary uk-loading" />' },
      'prefix: "uk";',
    );
    expect(css).toContain(".uk-radio");
    expect(css).toContain(".uk-radio.uk-primary");
    expect(css).toContain(".uk-radio.uk-loading");
    expect(css).toContain("uk-pulse 1.2s ease-in-out infinite");
    expect(css).not.toMatch(/\.ui-/);
  });
});

describe("ui-switch (decision 003, component 3)", () => {
  for (const adapter of ["default", "shadcn", "daisyui"]) {
    describe(adapter, () => {
      const css = () => skin(adapter);

      it("styles native :checked and headless [aria-checked]", () => {
        const block = ruleBlock(css(), ".ui-switch");
        expect(block).toContain("&:checked");
        expect(block).toContain('&[aria-checked="true"]');
        expect(block).toContain("border-radius: 9999px");
      });

      it("uses logical properties for the thumb and adds no global token", () => {
        const block = ruleBlock(css(), ".ui-switch");
        expect(block).toContain("margin-inline-start");
        expect(block).not.toMatch(/translateX|margin-left|margin-right/);
        expect(css()).not.toMatch(/--ui-shadow\b/);
        expect(css()).not.toMatch(/label\.ui-switch/);
      });

      it("keeps forced-colors working with system colours", () => {
        const block = ruleBlock(css(), ".ui-switch");
        expect(block).toContain("forced-colors: active");
        expect(block).toContain("Highlight");
      });
    });
  }

  it("hooks are read with fallbacks in the default theme", () => {
    const block = ruleBlock(skin("default"), ".ui-switch");
    expect(block).toContain("var(--ui-switch-size, 1.25rem)");
    expect(block).toContain("var(--ui-switch-track,");
    expect(block).toContain("var(--ui-switch-thumb,");
    expect(block).toContain("var(--ui-switch-pad, 2px)");
    expect(ruleBlock(skin("shadcn"), ".ui-switch")).toContain("--ui-switch-size: 1.25rem");
    expect(ruleBlock(skin("daisyui"), ".ui-switch")).toContain("--size-selector");
  });

  it("transitions are disabled under prefers-reduced-motion", () => {
    const block = ruleBlock(skin("default"), ".ui-switch");
    expect(block).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/);
  });

  it('prefix: "uk" renames switch classes and the loading keyframes', () => {
    const css = compileWithFiles(
      { "index.html": '<input type="checkbox" role="switch" class="uk-switch uk-primary uk-loading" />' },
      'prefix: "uk";',
    );
    expect(css).toContain(".uk-switch");
    expect(css).toContain(".uk-switch.uk-primary");
    expect(css).toContain(".uk-switch.uk-loading");
    expect(css).toContain("uk-pulse 1.2s ease-in-out infinite");
    expect(css).not.toMatch(/\.ui-/);
  });
});

describe("ui-field (decision 003, component 4)", () => {
  for (const adapter of ["default", "shadcn", "daisyui"]) {
    describe(adapter, () => {
      const css = () => skin(adapter);

      it("emits the four parts, with no modifier selectors and no global token", () => {
        for (const part of ["field", "field-label", "field-hint", "field-error"]) {
          expect(css()).toContain(`.ui-${part} {`);
          expect(css()).not.toContain(`.ui-${part}.ui-`);
        }
        expect(css()).not.toMatch(/--ui-shadow\b/);
      });

      it("uses logical properties only", () => {
        for (const part of ["field", "field-label", "field-hint", "field-error"]) {
          expect(ruleBlock(css(), `.ui-${part}`)).not.toMatch(
            /margin-left|margin-right|padding-left|padding-right|text-align:\s*(left|right)|\bleft:|\bright:/,
          );
        }
      });

      for (const component of ["input", "textarea", "select"]) {
        it(`${component} styles [aria-invalid="true"] as danger`, () => {
          const block = ruleBlock(css(), `.ui-${component}`);
          expect(block).toContain('[aria-invalid="true"]');
          expect(block).toContain("--ui-field-c: var(--ui-danger-text, var(--ui-danger))");
        });
      }
    });
  }

  it("hooks are read with fallbacks in the default theme", () => {
    expect(ruleBlock(skin("default"), ".ui-field")).toContain("var(--ui-field-gap, 0.375rem)");
    expect(ruleBlock(skin("default"), ".ui-field-label")).toContain("var(--ui-field-label,");
    expect(ruleBlock(skin("default"), ".ui-field-hint")).toContain("var(--ui-field-hint,");
    expect(ruleBlock(skin("default"), ".ui-field-error")).toContain(
      "var(--ui-field-error, var(--ui-danger-text, var(--ui-danger)))",
    );
  });

  it("adapters set their own gap", () => {
    expect(ruleBlock(skin("shadcn"), ".ui-field")).toContain("--ui-field-gap: 0.5rem");
    expect(ruleBlock(skin("daisyui"), ".ui-field")).toContain("--ui-field-gap: 0.25rem");
  });

  it('prefix: "uk" renames field classes and the invalid selector', () => {
    const css = compileWithFiles(
      {
        "index.html":
          '<div class="uk-field"><label class="uk-field-label"></label><input class="uk-input" aria-invalid="true" /><p class="uk-field-hint"></p><p class="uk-field-error"></p></div>',
      },
      'prefix: "uk";',
    );
    for (const part of ["field", "field-label", "field-hint", "field-error"]) {
      expect(css).toContain(`.uk-${part}`);
    }
    expect(css).toContain('[aria-invalid="true"]');
    expect(css).not.toMatch(/\.ui-/);
  });
});

describe("ui-table (decision 003, component 5)", () => {
  for (const adapter of ADAPTERS) {
    describe(adapter, () => {
      it("styles th/td/tr/caption through nested selectors", () => {
        const block = ruleBlock(skin(adapter), ".ui-table");
        expect(block).toContain("& th, & td");
        expect(block).toContain("& thead th");
        expect(block).toContain("& tbody tr");
        expect(block).toContain("& caption");
        expect(block).toContain("position: sticky");
      });

      it("draws a CSS sort arrow on [aria-sort]", () => {
        const block = ruleBlock(skin(adapter), ".ui-table");
        expect(block).toContain('[aria-sort="ascending"]::after');
        expect(block).toContain('[aria-sort="descending"]::after');
      });

      it("supports tr-level selected and disabled states", () => {
        const block = ruleBlock(skin(adapter), ".ui-table");
        expect(block).toContain("tr[aria-selected='true']");
        expect(block).toContain("tr[aria-disabled='true']");
        expect(block).toContain("tr.ui-active");
        expect(block).toContain("tr.ui-disabled");
      });

      it("wrap is a scroll container with a focus ring", () => {
        const block = ruleBlock(skin(adapter), ".ui-table-wrap");
        expect(block).toContain("overflow-x: auto");
        expect(block).toContain(":focus-visible");
      });
    });
  }

  it("maps soft to zebra, outline to grid and ghost to no lines", () => {
    const css = skin("default");
    /* styles whose rules target descendants flatten to compound selectors;
       simple declarations nest as `&.ui-*` inside the `.ui-table` block */
    expect(css).toContain(".ui-table.ui-soft tbody tr:nth-of-type(even)");
    expect(css).toContain(".ui-table.ui-outline th");
    expect(css).toContain(".ui-table.ui-ghost tbody tr");
  });

  it("loading pulses the tbody under ui-loading and aria-busy", () => {
    const css = skin("default");
    expect(css).toContain(".ui-table.ui-loading tbody");
    expect(ruleBlock(css, ".ui-table.ui-loading tbody")).toContain("ui-pulse");
    expect(ruleBlock(css, ".ui-table")).toContain('[aria-busy="true"]');
  });

  it("hooks are read with fallbacks in the default theme", () => {
    const block = ruleBlock(skin("default"), ".ui-table");
    for (const hook of [
      "--ui-table-pad-x",
      "--ui-table-pad-y",
      "--ui-table-head-bg",
      "--ui-table-head-fg",
      "--ui-table-stripe",
      "--ui-table-row-hover",
      "--ui-table-border",
    ])
      expect(block).toContain(`var(${hook},`);
    expect(ruleBlock(skin("shadcn"), ".ui-table")).toContain("--ui-table-head-fg");
    expect(ruleBlock(skin("daisyui"), ".ui-table")).toContain("--ui-table-stripe");
  });

  it("row hover transition is disabled under prefers-reduced-motion", () => {
    const block = ruleBlock(skin("default"), ".ui-table");
    expect(block).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/);
  });

  it('prefix: "uk" renames table classes and the loading keyframes', () => {
    const css = compileWithFiles(
      {
        "index.html":
          '<div class="uk-table-wrap"><table class="uk-table uk-soft uk-loading"><tbody><tr><td></td></tr></tbody></table></div>',
      },
      'prefix: "uk";',
    );
    expect(css).toContain(".uk-table");
    expect(css).toContain(".uk-table-wrap");
    expect(css).toContain(".uk-table.uk-soft");
    expect(css).toContain(".uk-table.uk-loading");
    expect(css).not.toMatch(/\.ui-/);
  });
});

describe("alert intents do not compete with styles", () => {
  /* An intent and a style are same-specificity single-class modifiers; the
     adapters' intent paints are guarded so the emitted order of the two
     cannot change the look (it did, when unrelated rules were added). */
  for (const adapter of ["shadcn", "daisyui"] as const) {
    it(`${adapter}: intent paints exclude the style classes`, () => {
      const block = ruleBlock(skin(adapter), ".ui-alert.ui-success");
      expect(block).toContain(":not(.ui-soft)");
      expect(block).toContain(":not(.ui-ghost)");
      // no unguarded paint declared directly in the intent block
      const direct = block.split("\n").filter((l) => /^ {4}(background-color|border-color|color):/.test(l));
      expect(direct, "direct paint declarations in the intent rule").toEqual([]);
    });
  }

  it('prefix: "uk" keeps the guard on the renamed style classes', () => {
    const css = compileWithFiles(
      { "index.html": '<div class="uk-alert uk-success uk-soft" role="alert">x</div>' },
      'prefix: "uk"; adapter: "daisyui";',
    );
    expect(css).toContain(":not(.uk-soft)");
    expect(css).not.toContain(":not(.ui-soft)");
  });
});

describe("ui-accordion (roadmap 0.5.0)", () => {
  for (const adapter of ADAPTERS) {
    describe(adapter, () => {
      it("hides the native marker and draws a CSS chevron", () => {
        const block = ruleBlock(skin(adapter), ".ui-accordion-trigger");
        expect(block).toContain("::-webkit-details-marker");
        expect(block).toContain("list-style: none");
        expect(block).toContain("&::after");
      });

      it("keys the open state off [open] on the item", () => {
        const block = ruleBlock(skin(adapter), ".ui-accordion-item");
        expect(block).toContain("&[open] > .ui-accordion-trigger");
        expect(block).toContain("rotate(-135deg)");
        expect(block).toContain("ui-accordion-reveal");
      });

      it("trigger keeps a focus-visible ring", () => {
        expect(ruleBlock(skin(adapter), ".ui-accordion-trigger")).toContain(":focus-visible");
      });
    });
  }

  it("maps outline to separate items, ghost to no lines and soft to a filled list", () => {
    const css = skin("default");
    expect(ruleBlock(css, ".ui-accordion.ui-outline")).toContain("& .ui-accordion-item");
    expect(ruleBlock(css, ".ui-accordion.ui-ghost")).toContain("& .ui-accordion-item + .ui-accordion-item");
    expect(ruleBlock(css, ".ui-accordion.ui-soft")).toContain(
      "& .ui-accordion-item[open] > .ui-accordion-trigger",
    );
  });

  it("hooks are read with fallbacks in the default theme", () => {
    const css = skin("default");
    for (const hook of ["--ui-accordion-pad-x", "--ui-accordion-pad-y"])
      expect(ruleBlock(css, ".ui-accordion-trigger")).toContain(`var(${hook},`);
    expect(ruleBlock(css, ".ui-accordion")).toContain("var(--ui-accordion-border,");
    expect(ruleBlock(css, ".ui-accordion-trigger")).toContain("var(--ui-accordion-hover,");
  });

  it("reveal animation and trigger transitions are disabled under reduced motion", () => {
    const css = skin("default");
    expect(css).toMatch(/@keyframes ui-accordion-reveal/);
    expect(ruleBlock(css, ".ui-accordion-item")).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{[^}]*animation: none/,
    );
    expect(ruleBlock(css, ".ui-accordion-trigger")).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/,
    );
  });

  it('prefix: "uk" renames the classes, nested references and the reveal keyframes', () => {
    const css = compileWithFiles(
      {
        "index.html":
          '<div class="uk-accordion uk-soft"><details class="uk-accordion-item" open><summary class="uk-accordion-trigger">a</summary><div class="uk-accordion-panel">b</div></details></div>',
      },
      'prefix: "uk";',
    );
    expect(css).toContain(".uk-accordion");
    expect(css).toContain(".uk-accordion-item[open] > .uk-accordion-trigger");
    expect(css).toContain("@keyframes uk-accordion-reveal");
    expect(css).not.toMatch(/\.ui-/);
  });
});

describe("intent border pin (--ui-c-border)", () => {
  it("badge, alert and the outline card read it, with the accent as the fallback", () => {
    const css = skin("default");
    const pin = "var(--ui-c-border, var(--ui-c))";
    expect(ruleBlock(css, ".ui-badge")).toContain(`border: 1px solid ${pin}`);
    expect(ruleBlock(css, ".ui-alert")).toContain(`border: 1px solid ${pin}`);
    expect(ruleBlock(css, ".ui-card")).toContain(`border-color: ${pin}`);
  });

  it("an intent defines the pin from --ui-<intent>-border", () => {
    expect(skin("default")).toContain("--ui-c-border: var(--ui-primary-border, var(--ui-c))");
  });
});

describe("ui-progress (roadmap 0.5.0)", () => {
  for (const adapter of ADAPTERS) {
    describe(adapter, () => {
      it("styles the native progress pseudo-elements", () => {
        const block = ruleBlock(skin(adapter), ".ui-progress");
        expect(block).toContain("appearance: none");
        expect(block).toContain("&::-webkit-progress-bar");
        expect(block).toContain("&::-webkit-progress-value");
        expect(block).toContain("&::-moz-progress-bar");
      });

      it("slides a bar for :indeterminate", () => {
        const block = ruleBlock(skin(adapter), ".ui-progress");
        expect(block).toContain("&:indeterminate");
        expect(block).toContain("ui-progress-slide");
      });
    });
  }

  it("reads its hooks with fallbacks and stays visible with no intent", () => {
    const block = ruleBlock(skin("default"), ".ui-progress");
    expect(block).toContain("var(--ui-progress-h,");
    expect(block).toContain("var(--ui-progress-track,");
    expect(block).toContain("var(--ui-progress-bar, var(--ui-c-text))");
  });

  it("the shadcn and daisyUI tracks follow the intent colour", () => {
    expect(ruleBlock(skin("shadcn"), ".ui-progress")).toContain("--ui-progress-track");
    expect(ruleBlock(skin("daisyui"), ".ui-progress")).toContain("--ui-progress-track");
  });

  it("indeterminate motion is replaced under reduced motion", () => {
    const css = skin("default");
    expect(css).toMatch(/@keyframes ui-progress-slide/);
    const block = ruleBlock(css, ".ui-progress");
    expect(block).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/);
    expect(block).toMatch(/animation: none/);
  });

  it('prefix: "uk" renames the class and the slide keyframes', () => {
    const css = compileWithFiles(
      { "index.html": '<progress class="uk-progress uk-primary" aria-label="x"></progress>' },
      'prefix: "uk";',
    );
    expect(css).toContain(".uk-progress");
    expect(css).toContain("@keyframes uk-progress-slide");
    expect(css).not.toMatch(/\.ui-/);
  });
});

describe("ui-tooltip (roadmap 0.6.0)", () => {
  for (const adapter of ADAPTERS) {
    describe(adapter, () => {
      it("is hidden until the anchor is hovered or focused", () => {
        const bubble = ruleBlock(skin(adapter), ".ui-tooltip");
        expect(bubble).toContain("visibility: hidden");
        expect(bubble).toContain("opacity: 0");
        const anchor = ruleBlock(skin(adapter), ".ui-tooltip-anchor");
        expect(anchor).toContain("&:hover > .ui-tooltip");
        expect(anchor).toContain("&:focus-within > .ui-tooltip");
      });

      it("places by data-placement, with logical properties for start and end", () => {
        const bubble = ruleBlock(skin(adapter), ".ui-tooltip");
        for (const p of ["bottom", "start", "end"]) expect(bubble).toContain(`[data-placement="${p}"]`);
        expect(bubble).toContain("inset-inline-end");
        expect(bubble).toContain("inset-inline-start");
      });
    });
  }

  it("reads its hooks with fallbacks", () => {
    const bubble = ruleBlock(skin("default"), ".ui-tooltip");
    for (const hook of ["--ui-tooltip-gap", "--ui-tooltip-arrow", "--ui-tooltip-max-w"])
      expect(bubble).toContain(`var(${hook},`);
    expect(bubble).toContain("var(--ui-tooltip-bg, var(--ui-c))");
    expect(bubble).toContain("var(--ui-tooltip-fg, var(--ui-on-c))");
  });

  it("ui-active forces the bubble visible and [hidden] hides it", () => {
    const css = skin("default");
    expect(ruleBlock(css, ".ui-tooltip")).toContain("&.ui-active");
    expect(ruleBlock(css, ".ui-tooltip")).toContain("&[hidden]");
  });

  it("the fade is disabled under reduced motion", () => {
    expect(ruleBlock(skin("default"), ".ui-tooltip")).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/,
    );
  });

  it('prefix: "uk" renames the anchor, bubble and the nested anchor selectors', () => {
    const css = compileWithFiles(
      { "index.html": '<span class="uk-tooltip-anchor"><button>x</button><span class="uk-tooltip uk-soft" role="tooltip">t</span></span>' },
      'prefix: "uk";',
    );
    expect(css).toContain(".uk-tooltip-anchor");
    expect(css).toContain("&:hover > .uk-tooltip");
    expect(css).not.toMatch(/\.ui-/);
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

describe("dark mode", () => {
  const darkBlock = (css: string) => css.match(/\.dark, \[data-theme="dark"\] \{[\s\S]*?\n {2}\}/)?.[0] ?? "";

  it("default skin emits dark tokens for .dark, [data-theme=dark] and prefers-color-scheme", () => {
    const css = compileAdapter("default");
    expect(darkBlock(css)).toContain("--ui-surface:");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toMatch(/:root:not\(\.light\):not\(\[data-theme="light"\]\)/);
  });

  it("shadcn dark scope re-declares the --ui-* aliases and the shadcn palette", () => {
    const block = darkBlock(compileAdapter("shadcn"));
    expect(block).toContain("--card: 222.2 84% 4.9%");
    expect(block).toContain("--ui-surface: hsl(var(--card))");
    expect(block).toContain("--ui-secondary-soft:");
  });

  it("daisyui does not override its theme: no dark tokens, aliases follow [data-theme]", () => {
    const css = compileAdapter("daisyui");
    expect(darkBlock(css)).toBe("");
    // (daisyUI itself emits prefers-color-scheme rules; ours use :root:not(.light))
    expect(css).not.toMatch(/:root:not\(\.light\)/);
    expect(css).toMatch(/:root,\s*\[data-theme\]\s*\{/);
  });

  it('dark: "class" drops the media query, dark: false drops everything', () => {
    const cls = compileWithFiles({ "a.html": '<b class="ui-button"></b>' }, 'dark: "class";');
    expect(cls).toContain('[data-theme="dark"]');
    expect(cls).not.toContain("prefers-color-scheme");
    const off = compileWithFiles({ "a.html": '<b class="ui-button"></b>' }, "dark: false;");
    expect(off).not.toContain('[data-theme="dark"]');
    expect(off).not.toContain("prefers-color-scheme");
  });
});

describe("contrast and dark-theme legibility", () => {
  for (const adapter of ["default", "shadcn", "daisyui"]) {
    it(`${adapter}: soft tints derive from the surface, not hard-coded white/black`, () => {
      const css = compileAdapter(adapter);
      expect(css).toMatch(/--ui-c-soft:\s*var\(--ui-\w+-soft, color-mix\([^;]*var\(--ui-surface\)\)\)/);
      expect(css).toMatch(/--ui-c-soft-fg:\s*var\(--ui-\w+-soft-fg, color-mix\([^;]*var\(--ui-surface-fg\)\)\)/);
      expect(css).not.toMatch(/--ui-c-soft:[^;]*\bwhite\b/);
    });

    it(`${adapter}: ghost/outline text uses --ui-c-text so neutral never vanishes`, () => {
      const css = compileAdapter(adapter);
      expect(css).toContain("--ui-c-text: var(--ui-surface-fg)");
      expect(css).toContain("--ui-c-text: var(--ui-primary-text, var(--ui-primary))");
      expect(css).toMatch(/--ui-c-text: var\(--ui-warning-text, color-mix\(in oklab, var\(--ui-warning\) 55%, var\(--ui-surface-fg\)\)\)/);
    });
  }

  it("shadcn pins secondary soft to its own secondary / secondary-foreground", () => {
    const css = compileAdapter("shadcn");
    expect(css).toContain("--ui-secondary-soft: hsl(var(--secondary))");
    expect(css).toContain("--ui-secondary-soft-fg: hsl(var(--secondary-foreground))");
  });
});

describe("accessibility fixes", () => {
  for (const adapter of ADAPTERS) {
    it(`${adapter}: every animation has a prefers-reduced-motion override`, () => {
      const css = skin(adapter);
      expect(css).toContain("@media (prefers-reduced-motion: reduce)");
      // the spinner and the pulse each stop
      expect(css).toMatch(/ui-spin 0\.6s linear infinite[\s\S]{0,600}prefers-reduced-motion: reduce[\s\S]{0,80}animation: none/);
    });
  }

  it("default: text fields focus with a solid 2px ring-colour outline (not a faint shadow)", () => {
    const css = skin("default");
    expect(css).toMatch(/&:focus-visible \{\s*outline: 2px solid var\(--ui-ring\);\s*outline-offset: 1px;/);
  });

  it("daisyui pins readable text colours for its bright intents", () => {
    const css = skin("daisyui");
    for (const i of ["secondary", "success", "danger"])
      expect(css).toContain(`--ui-${i}-text: color-mix(`);
  });

  it("shadcn pressed outline buttons keep their focus ring", () => {
    const css = skin("shadcn");
    expect(css).toMatch(/\.ui-button\.ui-active \{[\s\S]{0,200}&:focus-visible \{\s*box-shadow: inset 0 2px 4px[^;]*0 0 0 4px/);
  });

  it("the default light palette's success and danger fills are dark enough for light text", () => {
    const css = skin("default");
    expect(css).toContain("--ui-success: oklch(0.5 0.14 163)");
    expect(css).toContain("--ui-danger: oklch(0.56 0.2 27)");
  });
});
