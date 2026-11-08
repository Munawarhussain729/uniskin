import { describe, expect, it } from "vitest";
import { compileAdapter, compileWithFiles } from "./compile.js";

describe("compiled skins", () => {
  for (const adapter of ["default", "shadcn", "daisyui"]) {
    it(`${adapter}: emits every ui-button variant`, () => {
      const css = compileAdapter(adapter);
      expect(css).toContain(".ui-button");
      // intents as compound selectors
      for (const intent of ["primary", "secondary", "success", "warning", "danger"])
        expect(css).toContain(`.ui-button.ui-${intent}`);
      // styles + sizes
      for (const mod of ["outline", "ghost", "soft", "sm", "lg"])
        expect(css).toContain(`.ui-button.ui-${mod}`);
      // states + native equivalents
      expect(css).toContain(":disabled");
      expect(css).toContain('[aria-disabled="true"]');
      expect(css).toContain('[aria-busy="true"]');
      // no standalone global modifiers
      expect(css).not.toMatch(/^\s*\.ui-primary\s*[,{]/m);
      expect(css).not.toMatch(/^\s*\.ui-outline\s*[,{]/m);
    });

    it(`${adapter}: output matches snapshot`, () => {
      expect(compileAdapter(adapter)).toMatchSnapshot();
    });
  }
});

describe("full vocabulary", () => {
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
  for (const adapter of ["default", "shadcn", "daisyui"]) {
    it(`${adapter}: every component compiles`, () => {
      const css = compileAdapter(adapter);
      for (const sel of [
        ".ui-input", ".ui-textarea", ".ui-select", ".ui-checkbox", ".ui-card",
        ".ui-card-header", ".ui-card-body", ".ui-card-footer", ".ui-badge",
        ".ui-alert", ".ui-modal", ".ui-modal-box", ".ui-tabs", ".ui-tab",
      ])
        expect(css).toContain(sel);
      expect(css).toContain(".ui-input.ui-danger");
      expect(css).toContain(".ui-card.ui-outline");
      expect(css).toContain(".ui-tabs.ui-soft");
    });
  }

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
});

describe("content scanning", () => {
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
