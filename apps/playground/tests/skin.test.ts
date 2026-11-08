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
