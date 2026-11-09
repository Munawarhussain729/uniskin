import { describe, expect, it } from "vitest";
import {
  renderAdapterFile,
  renderCssSnippet,
  toAdapter,
  type AdapterFormat,
} from "../src/builder/export";
import { parseAdapterFile } from "../src/builder/importer";
import { defaultState, type Mode, type SkinState } from "../src/builder/model";

function customState(): SkinState {
  const s = defaultState();
  s.name = "Acme Skin!";
  s.radius = 1;
  s.density = 1.25;
  s.borderWidth = 2;
  s.font = "Georgia, serif";
  s.light.intents.primary = { fill: "#0b7285", fg: null, text: "#083344", softFg: null };
  s.light.intents.warning = { fill: "#ffd43b", fg: "#2b2110", text: null, softFg: "#5c4300" };
  return s;
}

const roundTrip = (s: SkinState, fmt: AdapterFormat, mode: Mode) => {
  const file = renderAdapterFile(s, fmt, mode);
  const r = parseAdapterFile(file);
  expect(r.ok).toBe(true);
  if (!r.ok) return "";
  return renderAdapterFile(r.state, fmt, r.mode);
};

describe("adapter import — header path", () => {
  it("export → import → export is byte-identical", () => {
    for (const s of [defaultState(), customState()]) {
      for (const fmt of ["mjs", "ts"] as const) {
        for (const mode of ["light", "dark"] as const) {
          expect(roundTrip(s, fmt, mode)).toBe(renderAdapterFile(s, fmt, mode));
        }
      }
    }
  });

  it("restores auto-derived colours and the un-slugged name (lossless)", () => {
    const s = customState(); // fg: null and a name that slugs differently
    const r = parseAdapterFile(renderAdapterFile(s, "mjs", "dark"));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state).toEqual(s);
      expect(r.mode).toBe("dark");
      expect(r.state.name).toBe("Acme Skin!");
      expect(r.state.light.intents.primary.fg).toBeNull();
    }
  });
});

describe("adapter import — literal fallback", () => {
  const stripHeader = (file: string) =>
    file
      .split("\n")
      .filter((l) => !l.startsWith("// uniskin-state:"))
      .join("\n");

  it("imports files exported before the state header existed", () => {
    const s = customState();
    const r = parseAdapterFile(stripHeader(renderAdapterFile(s, "mjs", "light")));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    /* adapter-faithful: the adapter object is identical even though the
       builder-only details (auto colours, raw name) can't be recovered */
    expect(toAdapter(r.state)).toEqual(toAdapter(s));
    expect(r.state.name).toBe("acme-skin");
    expect(r.state.density).toBe(1.25);
    expect(r.state.borderWidth).toBe(2);
    expect(r.state.radius).toBe(1);
    expect(r.state.font).toBe("Georgia, serif");
  });

  it("trusts the body over the header: edited files import the edited values", () => {
    const s = defaultState();
    const original = renderAdapterFile(s, "mjs", "light");
    const edited = original.replace(/"--ui-primary": "#[0-9a-f]{6}"/, '"--ui-primary": "#0b7285"');
    expect(edited).not.toBe(original); /* the replace really landed */
    const r = parseAdapterFile(edited);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.warning).toMatch(/edited after export/);
    expect(r.state.light.intents.primary.fill).toBe("#0b7285");
  });

  it("warns and falls back when the header is unreadable", () => {
    const s = defaultState();
    const file = renderAdapterFile(s, "mjs", "light").replace(
      /\/\/ uniskin-state: \S+/,
      "// uniskin-state: %%%garbage%%%",
    );
    const r = parseAdapterFile(file);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.warning).toMatch(/state header/i);
    expect(toAdapter(r.state)).toEqual(toAdapter(s));
  });
});

describe("adapter import — rejection", () => {
  const bad = (name: string, file: string, match: RegExp) => {
    it(name, () => {
      const r = parseAdapterFile(file);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(match);
    });
  };

  bad("empty input", "", /empty/i);
  bad("the css-variables export is not an adapter", renderCssSnippet(defaultState()), /CSS-variables/);
  bad("no defineAdapter call", "export const x = 1;", /defineAdapter/);
  bad("non-JSON adapter body", 'defineAdapter({ name: "x" })', /couldn't parse/);
  bad("truncated file", 'export default defineAdapter({"name": "x", "tokens": {', /couldn't parse/);

  /* a fully valid adapter body, patched per case */
  const validFile = (patch: (a: Record<string, any>) => void) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const a = JSON.parse(
      `{"name":"x","tokens":${JSON.stringify(toAdapter(defaultState()).tokens)},"darkTokens":${JSON.stringify(toAdapter(defaultState()).darkTokens)}}`,
    ) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    patch(a);
    return `export default defineAdapter(${JSON.stringify(a)});`;
  };

  bad(
    "no adapter object at all",
    `export default defineAdapter(${JSON.stringify({ name: "x" })});`,
    /parse/,
  );
  bad(
    "missing colour keys",
    validFile((a) => {
      delete a.tokens["--ui-primary"];
    }),
    /missing --ui-primary/,
  );
  bad(
    "unparseable colour",
    validFile((a) => {
      a.tokens["--ui-primary"] = "banana";
    }),
    /unparseable --ui-primary/,
  );
  bad(
    "unparseable radius",
    validFile((a) => {
      a.tokens["--ui-radius"] = "big";
    }),
    /--ui-radius/,
  );
  bad(
    "foreign component overrides are rejected, not dropped",
    validFile((a) => {
      a.components = { button: { base: { padding: "9rem 9rem", color: "red" } } };
    }),
    /overrides/,
  );
});
