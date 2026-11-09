/**
 * Shareable-state codec. The whole builder state is packed into a compact,
 * versioned payload and carried either in the URL hash (`#s=…`) or in the
 * `// uniskin-state: …` header line of an exported adapter file.
 *
 * Wire format (JSON, positional):
 *   [version, mode, [name, lightPalette, darkPalette, radius, borderWidth, density, font]]
 * A palette is 29 slots: neutral fill/fg/soft/softFg, then per intent
 * (INTENT_KEYS order) fill/fg/text/softFg, then surface/surfaceFg/
 * surfaceMuted/border/ring. `null` keeps a slot on its derived default.
 */
import { parseColor } from "./color";
import {
  INTENT_KEYS,
  type IntentKey,
  type Mode,
  type Palette,
  type SkinState,
  type Swatch,
} from "./model";

export const SHARE_VERSION = 1;

/** Comment marker an exported adapter file carries its payload in. */
export const STATE_HEADER = "// uniskin-state:";

/* -------------------------------------------------------------- base64url */

function b64encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64decode(text: string): string {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/* ------------------------------------------------------------ compaction */

const PAL_LEN = 4 + INTENT_KEYS.length * 4 + 5;
const FIN = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

function compactPalette(p: Palette): (string | null)[] {
  const out: (string | null)[] = [p.neutral.fill, p.neutral.fg, p.neutral.soft, p.neutral.softFg];
  for (const k of INTENT_KEYS) {
    const s: Swatch = p.intents[k];
    out.push(s.fill, s.fg, s.text, s.softFg);
  }
  out.push(p.surface, p.surfaceFg, p.surfaceMuted, p.border, p.ring);
  return out;
}

/** Expands a compact palette. Throws on anything that isn't 29 colour slots. */
function expandPalette(raw: unknown): Palette {
  if (!Array.isArray(raw) || raw.length !== PAL_LEN) throw new Error("bad palette");
  const fail = (): never => {
    throw new Error("bad colour slot");
  };
  const slot = (i: number, required: boolean): string | null => {
    const v = raw[i];
    if (v === null) return required ? fail() : null;
    if (typeof v !== "string" || !parseColor(v)) return fail();
    return v;
  };
  const intents = {} as Record<IntentKey, Swatch>;
  INTENT_KEYS.forEach((k, i) => {
    const at = 4 + i * 4;
    intents[k] = {
      fill: slot(at, true) as string,
      fg: slot(at + 1, false),
      text: slot(at + 2, false),
      softFg: slot(at + 3, false),
    };
  });
  return {
    neutral: {
      fill: slot(0, true) as string,
      fg: slot(1, true) as string,
      soft: slot(2, true) as string,
      softFg: slot(3, true) as string,
    },
    intents,
    surface: slot(24, true) as string,
    surfaceFg: slot(25, true) as string,
    surfaceMuted: slot(26, true) as string,
    border: slot(27, true) as string,
    ring: slot(28, true) as string,
  };
}

/* -------------------------------------------------------- payload encode */

/** Serialises state + mode to the versioned payload string. */
export function encodePayload(state: SkinState, mode: Mode): string {
  const compact = [
    SHARE_VERSION,
    mode,
    [
      state.name,
      compactPalette(state.light),
      compactPalette(state.dark),
      state.radius,
      state.borderWidth,
      state.density,
      state.font,
    ],
  ];
  return b64encode(JSON.stringify(compact));
}

export type ShareDecode =
  | { kind: "none" }
  | { kind: "ok"; state: SkinState; mode: Mode }
  | { kind: "invalid" }
  | { kind: "stale"; version: unknown };

/** Parses a raw payload (after the `s=` / header prefix is stripped). */
export function decodePayload(payload: string): ShareDecode {
  let wire: unknown;
  try {
    wire = JSON.parse(b64decode(payload));
  } catch {
    return { kind: "invalid" };
  }
  if (!Array.isArray(wire) || wire.length !== 3) return { kind: "invalid" };
  const [version, mode, s] = wire;
  if (version !== SHARE_VERSION) return { kind: "stale", version };
  if (!Array.isArray(s) || s.length !== 7) return { kind: "invalid" };
  const [name, light, dark, radius, borderWidth, density, font] = s;
  if (mode !== "light" && mode !== "dark") return { kind: "invalid" };
  if (typeof name !== "string" || name.length < 1 || name.length > 80) return { kind: "invalid" };
  if (typeof font !== "string" || font.length < 1 || font.length > 240) return { kind: "invalid" };
  /* Sanity bounds — generous on purpose so hand-tuned states still load. */
  if (!FIN(radius) || radius < 0 || radius > 4) return { kind: "invalid" };
  if (!FIN(borderWidth) || borderWidth < 0 || borderWidth > 16) return { kind: "invalid" };
  if (!FIN(density) || density < 0.25 || density > 4) return { kind: "invalid" };
  try {
    const state: SkinState = {
      name,
      light: expandPalette(light),
      dark: expandPalette(dark),
      radius,
      borderWidth,
      density,
      font,
    };
    return { kind: "ok", state, mode };
  } catch {
    return { kind: "invalid" };
  }
}

/* ------------------------------------------------------------ URL helper */

const PREFIX = "s=";

/** `#s=<payload>` for location.hash. */
export function encodeHash(state: SkinState, mode: Mode): string {
  return `#${PREFIX}${encodePayload(state, mode)}`;
}

/** Decodes location.hash; `{kind:"none"}` when there is no share hash. */
export function decodeHash(hash: string): ShareDecode {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!h) return { kind: "none" };
  if (!h.startsWith(PREFIX)) return { kind: "none" };
  return decodePayload(h.slice(PREFIX.length));
}
