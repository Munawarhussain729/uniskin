import path from "node:path";
import { defaultAdapter, defaultKeyframes } from "./default-theme.js";
import { DEFAULT_PREFIX, buildRules, type DarkStrategy } from "./emit.js";
import { mergeAdapter, resolveAdapter, warnUnsupported } from "./merge.js";

export interface UniskinOptions {
  /**
   * Which adapter to use: `"default"`, a package shorthand (`"shadcn"`,
   * `"daisyui"` → `@uniskin/shadcn`, `@uniskin/daisyui`), any package
   * name, or a path to a local adapter file (`"./my-adapter.js"`).
   * Paths and package names resolve relative to the stylesheet that
   * declared `@plugin` — falling back to the process cwd when uniskin is
   * invoked directly from JavaScript.
   */
  adapter?: string;
  /** Class prefix. Defaults to `"ui"` → classes like `ui-button`. */
  prefix?: string;
  /**
   * How dark mode is activated. `"media"` (default): `.dark` /
   * `[data-theme="dark"]` plus `prefers-color-scheme: dark` (opt out with
   * `.light` / `[data-theme="light"]`). `"class"`: only `.dark` /
   * `[data-theme="dark"]`. `false`: no dark tokens.
   */
  dark?: DarkStrategy;
}

type CssInJs = Record<string, unknown>;

/** The slice of the Tailwind v4 PluginAPI uniskin uses. */
interface PluginApi {
  addBase(base: CssInJs): void;
  addUtilities(utilities: CssInJs): void;
}

/**
 * Tailwind v4 invokes a `@plugin` options function as
 * `details.plugin(details.options)`, so `this` is Tailwind's plugin-details
 * record. Its `src` is the `@plugin` at-rule's source location —
 * `src[0].file` is the stylesheet that declared the plugin, which makes it
 * the correct base for resolving relative adapter paths and package names
 * (monorepo subfolders included). Direct JS callers and `@plugin` without
 * options invoke this function with `this === undefined`, where resolution
 * falls back to the process cwd.
 */
interface PluginDetails {
  src?: [{ file?: string | null } | undefined, number, number];
}

function stylesheetDir(details: unknown): string | undefined {
  const file = (details as PluginDetails | null | undefined)?.src?.[0]?.file;
  return typeof file === "string" && file.length > 0
    ? path.dirname(path.resolve(file))
    : undefined;
}

function uniskin(this: unknown, options: UniskinOptions = {}) {
  const prefix = (options.prefix ?? DEFAULT_PREFIX).replace(/-+$/, "") || DEFAULT_PREFIX;
  const adapter = resolveAdapter(options.adapter ?? "default", {
    base: stylesheetDir(this),
  });
  const merged =
    adapter.name === "default" ? defaultAdapter : mergeAdapter(defaultAdapter, adapter);
  warnUnsupported(adapter);

  return {
    handler({ addBase, addUtilities }: PluginApi) {
      const { base, utilities } = buildRules(merged, prefix, defaultKeyframes, options.dark ?? "media");
      addBase(base as CssInJs);
      addUtilities(utilities as CssInJs);
    },
    config: {},
  };
}

// Same marker `tailwindcss/plugin`'s `withOptions` sets; the function is
// built by hand so adapter resolution can see the caller's `this` (which
// `withOptions` does not forward).
export default Object.assign(uniskin, { __isOptionsFunction: true as const });
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
export type { ResolveAdapterOptions } from "./merge.js";
export { buildRules } from "./emit.js";
export { defaultAdapter } from "./default-theme.js";
