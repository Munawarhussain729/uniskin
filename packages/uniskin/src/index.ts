import plugin from "tailwindcss/plugin";
import { defaultAdapter, defaultBaseExtras } from "./default-theme.js";
import { buildRules } from "./emit.js";
import { mergeAdapter, resolveAdapter, warnUnsupported } from "./merge.js";

export interface UniskinOptions {
  /**
   * Which adapter to use: `"default"`, a package shorthand (`"shadcn"`,
   * `"daisyui"` → `@uniskin/shadcn`, `@uniskin/daisyui`), any package
   * name, or a path to a local adapter file (`"./my-adapter.js"`).
   */
  adapter?: string;
  /** Class prefix. Defaults to `"ui"` → classes like `ui-button`. */
  prefix?: string;
}

const uniskin: (options?: UniskinOptions) => unknown = plugin.withOptions<UniskinOptions>(
  (options = {}) => {
    const prefix = (options.prefix ?? "ui").replace(/-+$/, "") || "ui";
    const adapter = resolveAdapter(options.adapter ?? "default");
    const merged =
      adapter.name === "default" ? defaultAdapter : mergeAdapter(defaultAdapter, adapter);
    warnUnsupported(adapter);

    return ({ addBase, addUtilities }) => {
      const { base, utilities } = buildRules(merged, prefix);
      type CssInJs = Parameters<typeof addBase>[0];
      addBase(base as CssInJs);
      addBase(defaultBaseExtras as CssInJs);
      addUtilities(utilities as Parameters<typeof addUtilities>[0]);
    };
  },
  () => ({}),
);

export default uniskin;
export { defineAdapter } from "./types.js";
export type {
  Adapter,
  ComponentDef,
  CssDeclarations,
  CssRuleObject,
  Intent,
  SizeModifier,
  StateModifier,
  StyleModifier,
} from "./types.js";
export { mergeAdapter, resolveAdapter } from "./merge.js";
export { buildRules } from "./emit.js";
export { defaultAdapter } from "./default-theme.js";
