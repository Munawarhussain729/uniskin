import { createRequire } from "node:module";
import path from "node:path";
import {
  INTENTS,
  SIZES,
  STATES,
  STYLES,
  VOCABULARY,
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
    tokens: { ...base.tokens, ...override.tokens },
    components,
  };
}

/**
 * Resolve the `adapter` option to an Adapter object.
 *
 * - `"default"` → the built-in theme (no merge needed)
 * - `"./my-adapter.js"` / absolute path → resolved from process.cwd()
 * - `"shadcn"` → tries `shadcn`, `@uniskin/shadcn`, `uniskin-adapter-shadcn`
 */
export function resolveAdapter(option: string): Adapter {
  if (option === "default") {
    // Lazy import cycle avoided by caller passing defaultAdapter in.
    return { name: "default" };
  }

  const req = createRequire(path.join(process.cwd(), "uniskin-resolve.js"));
  const isPath = option.startsWith(".") || option.startsWith("/");
  // For bare names prefer the conventional prefixed packages so that
  // `adapter: "daisyui"` finds @uniskin/daisyui rather than the (unrelated)
  // `daisyui` package itself.
  const candidates = isPath
    ? [path.resolve(process.cwd(), option)]
    : [`@uniskin/${option}`, `uniskin-adapter-${option}`, option];

  for (const candidate of candidates) {
    let mod: unknown;
    try {
      mod = req(candidate);
    } catch {
      continue; // not installed — try next candidate
    }
    const adapter = (mod as { default?: unknown }).default ?? mod;
    if (isAdapter(adapter)) return adapter;
    // Module resolved but isn't an adapter — keep looking (e.g. the
    // `daisyui` package when asked for the "daisyui" adapter).
  }

  throw new Error(
    `[uniskin] Could not resolve adapter "${option}". Tried: ${candidates.join(", ")}. ` +
      `Pass a built-in name ("default", "shadcn", "daisyui"), a package name, or a relative path like "./my-adapter.js". ` +
      `Adapters must be created with defineAdapter({ name, tokens, components }).`,
  );
}

function isAdapter(value: unknown): value is Adapter {
  return isPlainObject(value) && typeof value.name === "string";
}

/**
 * Dev-mode warning: list the vocabulary slots an adapter does not define
 * itself. Everything listed falls back to the default style silently.
 */
export function warnUnsupported(adapter: Adapter): void {
  if (adapter.name === "default") return;
  if (process.env.NODE_ENV === "production") return;

  const missing: string[] = [];
  const comps = adapter.components ?? {};
  for (const name of VOCABULARY) {
    const def = comps[name];
    if (!def) {
      missing.push(name);
      continue;
    }
    const slots: string[] = [];
    // An intent also counts as covered when the adapter remaps its token
    // (--ui-primary …) — the default intent rule picks the var up.
    for (const intent of INTENTS)
      if (!def.intents?.[intent] && !adapter.tokens?.[`--ui-${intent}`]) slots.push(intent);
    for (const style of STYLES) if (!def.styles?.[style]) slots.push(style);
    for (const size of SIZES) if (!def.sizes?.[size]) slots.push(size);
    for (const state of STATES) if (!def.states?.[state]) slots.push(state);
    if (slots.length > 0) missing.push(`${name} (${slots.join(", ")})`);
  }

  if (missing.length > 0) {
    console.warn(
      `[uniskin] adapter "${adapter.name}" does not define: ${missing.join(", ")}\n` +
        `          → falling back to the default style for these.`,
    );
  }
}
