import { describe, expect, it } from "vitest";
import { defaultState, type SkinState } from "../src/builder/model";
import { decodeHash, decodePayload, encodeHash, encodePayload } from "../src/builder/share";

const b64 = (s: string) =>
  Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

function busyState(): SkinState {
  const s = defaultState();
  s.name = "Ünïcode Café & Sons";
  s.radius = 1.0625;
  s.borderWidth = 3;
  s.density = 1.25;
  s.font = 'Charter, "Bitstream Charter", serif';
  s.light.intents.primary = { fill: "#0b7285", fg: null, text: "#083344", softFg: null };
  s.dark.intents.danger = { fill: "#ff8787", fg: "#201010", text: null, softFg: "#ffd6d6" };
  s.light.surfaceMuted = "#f1efe9";
  return s;
}

describe("share codec", () => {
  it("round-trips the default state in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const d = decodePayload(encodePayload(defaultState(), mode));
      expect(d.kind).toBe("ok");
      if (d.kind === "ok") {
        expect(d.state).toEqual(defaultState());
        expect(d.mode).toBe(mode);
      }
    }
  });

  it("round-trips a fully-edited state, including a non-ASCII name", () => {
    const s = busyState();
    const d = decodeHash(encodeHash(s, "dark"));
    expect(d.kind).toBe("ok");
    if (d.kind === "ok") {
      expect(d.state).toEqual(s);
      expect(d.mode).toBe("dark");
    }
  });

  it("is deterministic — identical states produce identical hashes", () => {
    expect(encodeHash(defaultState(), "light")).toBe(encodeHash(defaultState(), "light"));
  });

  it("hashes start with #s= and ignore unrelated hashes", () => {
    expect(encodeHash(defaultState(), "light")).toMatch(/^#s=[A-Za-z0-9_-]+$/);
    expect(decodeHash("#section-2").kind).toBe("none");
    expect(decodeHash("").kind).toBe("none");
    expect(decodeHash("#").kind).toBe("none");
  });

  it("rejects garbage payloads as invalid", () => {
    for (const h of ["#s=", "#s=!!!", "#s=abc", `#s=${b64("not json")}`]) {
      expect(decodeHash(h).kind, h).toBe("invalid");
    }
  });

  it("flags other versions as stale, not invalid", () => {
    for (const v of [0, 2, 99]) {
      const d = decodePayload(b64(JSON.stringify([v, "light", []])));
      expect(d.kind).toBe("stale");
      if (d.kind === "stale") expect(d.version).toBe(v);
    }
  });

  it("rejects well-formed JSON with wrong shapes", () => {
    const wrap = (wire: unknown) => decodePayload(b64(JSON.stringify(wire)));
    const good = JSON.parse(
      Buffer.from(
        encodePayload(defaultState(), "light").replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8"),
    ) as unknown[];
    expect(wrap({ v: 1 }).kind).toBe("invalid");
    expect(wrap([1, "light"]).kind).toBe("invalid");
    expect(wrap([1, "purple", good[2]]).kind).toBe("invalid");
    expect(wrap([1, "light", { name: "x" }]).kind).toBe("invalid");
    /* bad slot count / bad colour / bad scalar inside an otherwise valid shell */
    const badPal = (i: number, v: unknown) => {
      const s = structuredClone(good);
      ((s[2] as unknown[])[i] as unknown[])[0] = v;
      return wrap(s).kind;
    };
    expect(badPal(1, "#zzz")).toBe("invalid"); // light neutral fill
    expect(badPal(2, [1, 2, 3])).toBe("invalid"); // dark palette, wrong type
    const badScalar = (i: number, v: unknown) => {
      const s = structuredClone(good);
      (s[2] as unknown[])[i] = v;
      return wrap(s).kind;
    };
    expect(badScalar(0, "")).toBe("invalid"); // empty name
    expect(badScalar(0, "x".repeat(200))).toBe("invalid");
    expect(badScalar(3, "0.5")).toBe("invalid"); // radius must be a number
    expect(badScalar(3, 99)).toBe("invalid"); // radius out of sanity range
    expect(badScalar(4, -1)).toBe("invalid"); // border width
    expect(badScalar(5, 0)).toBe("invalid"); // density
    expect(badScalar(6, 42)).toBe("invalid"); // font must be a string
  });
});
