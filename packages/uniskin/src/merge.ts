import { createRequire } from "node:module";
import path from "node:path";
import { missingCoverage } from "./coverage.js";
import {
  INTENTS,
  SIZES,
  STATES,
  STYLES,
  type Adapter,
  type ComponentDef,
  type CssRuleObject,
} from "./types.js";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Recursively merge `override` onto `base`. Scalar/array values from
 *  `override` win; plain objects merge key by key. */
export function deepMerge<T>(base: T, override: T): T {
  if (!isPlainObject(base) || !isPlainObject(override)) return override;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] =
      key in out ? deepMerge(out[key], value) : value;
  }
  return out as T;
}

function mergeComponent(base: ComponentDef | undefined, override: ComponentDef | undefined): ComponentDef {
  if (!base) return override ?? {};
  if (!override) return base;
  return {
    base: mergeSlot(base.base, override.base),
    intents: mergeNamedSlot(base.intents, override.intents),
    styles: mergeNamedSlot(base.styles, override.styles),
    sizes: mergeNamedSlot(base.sizes, override.sizes),
    states: mergeNamedSlot(base.states, override.states),
  };
}

function mergeSlot(
  base: CssRuleObject | undefined,
  override: CssRuleObject | undefined,
): CssRuleObject | undefined {
  if (!base) return override;
  if (!override) return base;
  return deepMerge(base, override);
}

function mergeNamedSlot<K extends string>(
  base: Partial<Record<K, CssRuleObject>> | undefined,
  override: Partial<Record<K, CssRuleObject>> | undefined,
): Partial<Record<K, CssRuleObject>> | undefined {
  if (!base) return override;
  if (!override) return base;
  const out: Partial<Record<K, CssRuleObject>> = { ...base };
  for (const key of Object.keys(override) as K[]) {
    out[key] = mergeSlot(base[key], override[key]);
  }
  return out;
}

/**
 * Merge an adapter over the default theme. The adapter only needs to
 * define what it changes — every missing token/component/slot falls
 * back to `base` (the built-in default style).
 */
export function mergeAdapter(base: Adapter, override: Adapter): Adapter {
  const components: NonNullable<Adapter["components"]> = {};
  const names = new Set([
    ...Object.keys(base.components ?? {}),
    ...Object.keys(override.components ?? {}),
  ]);
  for (const name of names) {
    components[name as keyof typeof components] = mergeComponent(
      base.components?.[name as keyof typeof components],
      override.components?.[name as keyof typeof components],
    );
  }
  return {
    name: override.name,
    rootSelector: override.rootSelector ?? base.rootSelector,
    darkTokens: override.darkTokens ?? base.darkTokens,
    darkRootSelector: override.darkRootSelector ?? base.darkRootSelector,
    keyframes: { ...base.keyframes, ...override.keyframes },
    tokens: { ...base.tokens, ...override.tokens },
    components,
  };
}

/** Options for {@link resolveAdapter}. */
export interface ResolveAdapterOptions {
  /**
   * Directory adapter paths and package names resolve from. The plugin
   * passes the directory of the stylesheet containing `@plugin`, so
   * `adapter: "./my-adapter.js"` and `adapter: "my-adapter-pkg"` work no
   * matter where the Tailwind process was started (e.g. a monorepo root).
   * Defaults to `process.cwd()` for direct JS callers.
   */
  base?: string;
}

/**
 * Resolve the `adapter` option to an Adapter object.
 *
 * - `"default"` → the built-in theme (no merge needed)
 * - `"./my-adapter.js"` / absolute path → resolved from `options.base`
 *   (the declaring stylesheet's directory when invoked through `@plugin`,
 *   `process.cwd()` otherwise)
 * - `"shadcn"` → tries `@uniskin/shadcn`, `uniskin-adapter-shadcn`, `shadcn`
 *
 * Adapters may ship as CJS or ESM, and `.ts` files load where the Node
 * runtime strips types (v22.18+/v23+). Anything Node cannot load —
 * an ESM-only module on an old runtime, a broken file, a missing file —
 * is reported in the thrown error with the module's path and cause.
 */
export function resolveAdapter(option: string, options?: ResolveAdapterOptions): Adapter {
  if (option === "default") {
    // Lazy import cycle avoided by caller passing defaultAdapter in.
    return { name: "default" };
  }

  const base = options?.base ?? process.cwd();
  const req = createRequire(path.join(base, "uniskin-resolve.js"));
  const isPath = option.startsWith(".") || option.startsWith("/");
  // For bare names prefer the conventional prefixed packages so that
  // `adapter: "daisyui"` finds @uniskin/daisyui rather than the (unrelated)
  // `daisyui` package itself.
  const candidates = isPath
    ? [path.resolve(base, option)]
    : [`@uniskin/${option}`, `uniskin-adapter-${option}`, option];

  const failures: string[] = [];
  for (const candidate of candidates) {
    let mod: unknown;
    try {
      mod = req(candidate);
    } catch (err) {
      failures.push(`${candidate}: ${describeLoadError(err)}`);
      continue;
    }
    const adapter = (mod as { default?: unknown }).default ?? mod;
    if (isAdapter(adapter)) return adapter;
    // Module resolved but isn't an adapter — keep looking (e.g. the
    // `daisyui` package when asked for the "daisyui" adapter).
    failures.push(`${candidate}: resolved, but does not export a uniskin adapter`);
  }

  throw new Error(
    `[uniskin] Could not resolve adapter "${option}" (base: ${base}):\n` +
      failures.map((f) => `  - ${f}`).join("\n") +
      `\nPass a built-in name ("default", "shadcn", "daisyui"), a package name, or a relative path like "./my-adapter.js". ` +
      `Adapters must be created with defineAdapter({ name, tokens, components }).`,
  );
}

/** One-line description of why `require` rejected a candidate. */
function describeLoadError(err: unknown): string {
  const code = (err as NodeJS.ErrnoException | undefined)?.code;
  const message = (err instanceof Error ? err.message : String(err)).split("\n")[0];
  // `require` of an ESM-only module on a Node without require(esm)
  // (< v20.19 / v22.12), of a module using top-level await, or of a `.ts`
  // file without type stripping (< v22.18) lands here — prefix the code so
  // the runtime limitation is unmistakable.
  if (code && code !== "MODULE_NOT_FOUND") return `${code} — ${message}`;
  return message;
}

function isAdapter(value: unknown): value is Adapter {
  return isPlainObject(value) && typeof value.name === "string";
}

export interface WarnOptions {
  /** Print the full detailed list, even for built-in adapters. */
  debug?: boolean;
  /** The adapter ships with uniskin; its fallbacks are intentional. */
  builtin?: boolean;
}

/**
 * Dev-mode notice about vocabulary slots an adapter does not define itself
 * (they fall back to the default style). Quiet for built-in adapters; one
 * summary line for third-party adapters; the full list with `debug`.
 */
export function warnUnsupported(adapter: Adapter, opts: WarnOptions = {}): void {
  const debug = opts.debug === true;
  warnUnknownSlots(adapter);
  if (!debug) {
    if (opts.builtin) return;
    if (adapter.name === "default") return;
    if (process.env.NODE_ENV === "production") return;
  }

  const missing = missingCoverage(adapter).map((m) =>
    m.whole ? m.component : `${m.component} (${m.slots.join(", ")})`,
  );

  if (missing.length === 0) return;
  if (debug) {
    console.warn(
      `[uniskin] adapter "${adapter.name}" does not define: ${missing.join(", ")}\n` +
        `          → falling back to the default style for these.`,
    );
    return;
  }
  const count = missing.reduce((n, m) => n + (m.includes("(") ? m.split(",").length : 1), 0);
  console.warn(
    `[uniskin] adapter "${adapter.name}": ${count} modifier combinations fall back to the default style (set debug: true to list them)`,
  );
}

const SLOT_KEYS: Record<string, readonly string[]> = {
  intents: INTENTS,
  styles: STYLES,
  sizes: SIZES,
  states: STATES,
};

/**
 * Slot keys outside the closed modifier sets (`styles: { classic: … }`,
 * `states: { invalid: … }`, a misspelt `intent:`) are never emitted. List
 * them so the silent drop is visible. Skipped in production builds.
 */
export function unknownSlots(adapter: Adapter): string[] {
  const out: string[] = [];
  for (const [name, def] of Object.entries(adapter.components ?? {})) {
    if (!def) continue;
    for (const [group, value] of Object.entries(def)) {
      if (group === "base") continue;
      const allowed = SLOT_KEYS[group];
      if (!allowed) {
        out.push(`${name}.${group}`);
        continue;
      }
      if (!isPlainObject(value)) continue;
      for (const key of Object.keys(value))
        if (!allowed.includes(key)) out.push(`${name}.${group}.${key}`);
    }
  }
  return out;
}

function warnUnknownSlots(adapter: Adapter): void {
  if (process.env.NODE_ENV === "production") return;
  const unknown = unknownSlots(adapter);
  if (unknown.length === 0) return;
  console.warn(
    `[uniskin] adapter "${adapter.name}" defines slots that are never emitted: ${unknown.join(", ")}\n` +
      `          → valid modifiers: intents ${INTENTS.join("/")}; styles ${STYLES.join("/")}; ` +
      `sizes ${SIZES.join("/")}; states ${STATES.join("/")}.`,
  );
}
