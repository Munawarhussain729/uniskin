/**
 * Imports an adapter file back into builder state — no eval, no Function.
 *
 * Two paths:
 * - the `// uniskin-state: <payload>` header current exports carry: the exact
 *   builder state (including auto-derived colours and the adapter name
 *   before slugging), verified against the file's own `defineAdapter` body;
 * - a strict parse of the `defineAdapter({…})` JSON literal, for files
 *   exported before the header existed. That path is adapter-faithful:
 *   re-exporting produces the same adapter, though auto/pinned colour
 *   choices come back pinned.
 *
 * Density / border-width are recovered by inverting the component overrides
 * the builder emits and verifying the whole set matches; anything else is
 * rejected rather than silently dropped.
 */
import { parseColor } from "./color";
import {
  BORDERED,
  DENSITY_TABLE,
  componentOverrides,
  toAdapter,
  type ExportedAdapter,
} from "./export";
import {
  INTENT_KEYS,
  defaultState,
  type IntentKey,
  type Mode,
  type Palette,
  type SkinState,
  type Swatch,
} from "./model";
import { decodePayload, STATE_HEADER } from "./share";

export type ImportResult =
  | { ok: true; state: SkinState; mode: Mode; warning?: string }
  | { ok: false; error: string };

/* ------------------------------------------------------------ body parse */

/** Extracts the balanced `{…}` starting at the first `{` after `from`. */
function extractObject(src: string, from: number): string | null {
  const start = src.indexOf("{", from);
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') {
      inStr = true;
    } else if (c === "{") {
      depth++;
    } else if (c === "}" && --depth === 0) {
      return src.slice(start, i + 1);
    }
  }
  return null;
}

function parseAdapterBody(src: string): ExportedAdapter | null {
  const call = /defineAdapter\s*\(/.exec(src);
  if (!call) return null;
  const json = extractObject(src, call.index + call[0].length);
  if (!json) return null;
  let a: ExportedAdapter;
  try {
    a = JSON.parse(json) as ExportedAdapter;
  } catch {
    return null;
  }
  const isTokens = (t: unknown): t is Record<string, string> =>
    !!t && typeof t === "object" && Object.values(t).every((v) => typeof v === "string");
  if (typeof a.name !== "string" || !isTokens(a.tokens) || !isTokens(a.darkTokens)) return null;
  if (a.components !== undefined && (typeof a.components !== "object" || a.components === null)) {
    return null;
  }
  return a;
}

/* -------------------------------------------------------- adapter → state */

/** Reads the colour tokens of one mode. `label` is "tokens" or "darkTokens". */
function paletteFromTokens(t: Record<string, string>, label: string): Palette | string {
  const colour = (key: string): string | Error => {
    const v = t[key];
    if (v === undefined) return new Error(`missing ${key} in ${label}`);
    if (!parseColor(v)) return new Error(`unparseable ${key}: "${v}"`);
    return v;
  };
  const need = (key: string): string => {
    const v = colour(key);
    if (v instanceof Error) throw v;
    return v;
  };
  const opt = (key: string): string | null => {
    if (t[key] === undefined) return null;
    const v = colour(key);
    if (v instanceof Error) throw v;
    return v;
  };
  try {
    const intents = {} as Record<IntentKey, Swatch>;
    for (const k of INTENT_KEYS) {
      intents[k] = {
        fill: need(`--ui-${k}`),
        fg: need(`--ui-${k}-fg`),
        text: opt(`--ui-${k}-text`),
        softFg: opt(`--ui-${k}-soft-fg`),
      };
    }
    return {
      neutral: {
        fill: need("--ui-neutral"),
        fg: need("--ui-neutral-fg"),
        soft: need("--ui-neutral-soft"),
        softFg: need("--ui-neutral-soft-fg"),
      },
      intents,
      surface: need("--ui-surface"),
      surfaceFg: need("--ui-surface-fg"),
      surfaceMuted: need("--ui-surface-muted"),
      border: need("--ui-border"),
      ring: need("--ui-ring"),
    };
  } catch (e) {
    return (e as Error).message;
  }
}

/* -------------------------------------------------- overrides → d, bw */

type Rule = { [key: string]: string | Rule | undefined };

function ruleAt(comps: Record<string, Rule>, component: string, slot: "base" | "sm" | "lg"): Rule | undefined {
  const c = comps[component];
  if (!c || typeof c !== "object") return undefined;
  if (slot === "base") return typeof c.base === "object" ? (c.base as Rule) : undefined;
  const sizes = c.sizes;
  if (!sizes || typeof sizes !== "object") return undefined;
  const r = (sizes as Rule)[slot];
  return r && typeof r === "object" ? (r as Rule) : undefined;
}

const REMS = /(\d*\.?\d+)rem/g;

/** Recovers (density, borderWidth) or returns an error string. */
function invertComponents(comps: Record<string, Rule>): { d: number; bw: number } | string {
  let bw = 1;
  const bwValues = BORDERED.map((n) => ruleAt(comps, n, "base")?.["border-width"]).filter(
    (v): v is string => typeof v === "string",
  );
  if (bwValues.length) {
    const first = bwValues[0];
    const m = /^(\d*\.?\d+)px$/.exec(first);
    if (!m || !bwValues.every((v) => v === first)) {
      return "the adapter's border-width overrides aren't uniform — not a builder export";
    }
    bw = parseFloat(m[1]);
  }

  let d = 1;
  let bestRatio: number | null = null;
  let bestMagnitude = 0;
  const ratios: number[] = [];
  for (const row of DENSITY_TABLE) {
    const v = ruleAt(comps, row.component, row.slot)?.[row.prop];
    if (typeof v !== "string") continue;
    const orig = [...row.value.matchAll(REMS)].map((x) => parseFloat(x[1]));
    const scaled = [...v.matchAll(REMS)].map((x) => parseFloat(x[1]));
    if (orig.length !== scaled.length || orig.some((n, i) => scaled[i] <= 0 || n <= 0)) {
      return `padding override "${v}" doesn't look builder-generated`;
    }
    for (let i = 0; i < orig.length; i++) {
      const r = scaled[i] / orig[i];
      ratios.push(r);
      if (orig[i] > bestMagnitude) {
        bestMagnitude = orig[i];
        bestRatio = r;
      }
    }
  }
  if (bestRatio !== null) {
    /* scaled values are rounded to 4 decimals — allow a little drift */
    if (!ratios.every((r) => Math.abs(r - bestRatio) <= 0.01 * bestRatio)) {
      return "the adapter's padding overrides aren't one consistent density";
    }
    d = Math.round(bestRatio * 100) / 100;
  }

  /* verify the whole set is exactly what the builder would emit for d, bw */
  const stub = { ...defaultState(), density: d, borderWidth: bw };
  const expected = componentOverrides(stub);
  if (stable(expected) !== stable(comps)) {
    return "the adapter's component overrides don't match what the builder emits — hand-edited or foreign adapters can't be imported";
  }
  return { d, bw };
}

/** Deterministic JSON: object keys sorted, so structural equality is string equality. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v !== null && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

function stateFromAdapter(a: ExportedAdapter): SkinState | string {
  const light = paletteFromTokens(a.tokens, "tokens");
  if (typeof light === "string") return light;
  const dark = paletteFromTokens(a.darkTokens, "darkTokens");
  if (typeof dark === "string") return dark;
  const s = defaultState();
  s.name = a.name || s.name;
  s.light = light;
  s.dark = dark;
  const radius = /^(\d*\.?\d+)rem$/.exec(a.tokens["--ui-radius"] ?? "");
  if (a.tokens["--ui-radius"] !== undefined && !radius) return 'unparseable --ui-radius';
  if (radius) s.radius = parseFloat(radius[1]);
  if (a.tokens["--ui-font-sans"] !== undefined) s.font = a.tokens["--ui-font-sans"];
  if (a.components && Object.keys(a.components).length) {
    const inv = invertComponents(a.components as Record<string, Rule>);
    if (typeof inv === "string") return inv;
    s.density = inv.d;
    s.borderWidth = inv.bw;
  }
  return s;
}

/* ------------------------------------------------------------------ main */

export function parseAdapterFile(text: string): ImportResult {
  const src = text.trim();
  if (!src) return { ok: false, error: "the file is empty" };
  if (!/defineAdapter/.test(src)) {
    if (/^\/\*/.test(src) && /:root\s*\{/.test(src)) {
      return {
        ok: false,
        error:
          "that looks like the CSS-variables export — it isn't an adapter file; paste it into your stylesheet instead",
      };
    }
    return { ok: false, error: "no defineAdapter(…) call found — is this a file the builder exported?" };
  }

  let headerState: { state: SkinState; mode: Mode } | null = null;
  let headerWarning: string | undefined;
  const hm = new RegExp(`^${STATE_HEADER.replace(/\//g, "\\/")}\\s*(\\S+)\\s*$`, "m").exec(src);
  if (hm) {
    const d = decodePayload(hm[1]);
    if (d.kind === "ok") headerState = { state: d.state, mode: d.mode };
    else if (d.kind === "stale") {
      headerWarning = "the file's state header is from a different builder version — imported the adapter values instead";
    } else {
      headerWarning = "the file's state header is unreadable — imported the adapter values instead";
    }
  }

  const adapter = parseAdapterBody(src);
  if (!adapter) {
    return {
      ok: false,
      error:
        "couldn't parse the defineAdapter(…) object — the builder writes plain JSON; hand-edited files may not load",
    };
  }

  /* Header path: trust it only when the file's body still says the same. */
  if (headerState) {
    if (stable(toAdapter(headerState.state)) === stable(adapter)) {
      return { ok: true, state: headerState.state, mode: headerState.mode, warning: headerWarning };
    }
    headerWarning = "the file was edited after export — imported the adapter values, not the saved state";
  }

  const state = stateFromAdapter(adapter);
  if (typeof state === "string") return { ok: false, error: state };
  return { ok: true, state, mode: "light", warning: headerWarning };
}
