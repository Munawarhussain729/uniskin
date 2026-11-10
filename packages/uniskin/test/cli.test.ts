import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { main } from "../src/cli/main.js";
import type { Io } from "../src/cli/init.js";

interface Harness {
  io: Io;
  out: string[];
  err: string[];
  runs: Array<{ command: string; args: string[]; cwd: string }>;
}

function harness(opts: { select?: (q: string, c: string[]) => string; exit?: number } = {}): Harness {
  const h: Harness = { out: [], err: [], runs: [], io: undefined as unknown as Io };
  h.io = {
    log: (m) => h.out.push(m),
    error: (m) => h.err.push(m),
    select: opts.select ? async (q, c) => opts.select!(q, c) : undefined,
    run: (command, args, cwd) => {
      h.runs.push({ command, args, cwd });
      return opts.exit ?? 0;
    },
  };
  return h;
}

const BASE_CSS = '@import "tailwindcss";\n\n@theme {\n  --color-brand: red;\n}\n';

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "uniskin-cli-"));
});

function project(
  dir: string,
  o: { lock?: string; tailwind?: string | null; css?: string; cssPath?: string; deps?: Record<string, string>; installed?: string } = {},
): string {
  mkdirSync(dir, { recursive: true });
  const deps: Record<string, string> = { ...(o.deps ?? {}) };
  if (o.tailwind !== null) deps.tailwindcss = o.tailwind ?? "^4.3.5";
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "fx", dependencies: deps }));
  if (o.lock) writeFileSync(path.join(dir, o.lock), "");
  if (o.installed) {
    const nm = path.join(dir, "node_modules", "tailwindcss");
    mkdirSync(nm, { recursive: true });
    writeFileSync(path.join(nm, "package.json"), JSON.stringify({ version: o.installed }));
  }
  const cssPath = path.join(dir, o.cssPath ?? "src/app.css");
  mkdirSync(path.dirname(cssPath), { recursive: true });
  writeFileSync(cssPath, o.css ?? BASE_CSS);
  return cssPath;
}

const read = (f: string) => readFileSync(f, "utf8");

describe("init: package manager detection", () => {
  it.each([
    ["package-lock.json", "npm", ["install", "uniskin"]],
    ["pnpm-lock.yaml", "pnpm", ["add", "uniskin"]],
    ["yarn.lock", "yarn", ["add", "uniskin"]],
    ["bun.lock", "bun", ["add", "uniskin"]],
  ])("%s -> %s", async (lock, pm, args) => {
    const css = project(root, { lock });
    const h = harness();
    expect(await main(["init", "--yes"], h.io, root)).toBe(0);
    expect(h.runs).toEqual([{ command: pm, args, cwd: root }]);
    expect(read(css)).toContain('@plugin "uniskin";');
  });

  it("defaults to npm without a lockfile", async () => {
    project(root);
    const h = harness();
    await main(["init", "--yes"], h.io, root);
    expect(h.runs[0]!.command).toBe("npm");
  });
});

describe("init: adapters", () => {
  it("shadcn adds both packages and the adapter option", async () => {
    const css = project(root, { lock: "pnpm-lock.yaml" });
    const h = harness();
    await main(["init", "--adapter", "shadcn"], h.io, root);
    expect(h.runs[0]!.args).toEqual(["add", "uniskin", "@uniskin/shadcn"]);
    expect(read(css)).toBe(
      '@import "tailwindcss";\n@plugin "uniskin" { adapter: "shadcn"; }\n\n@theme {\n  --color-brand: red;\n}\n',
    );
  });

  it("daisyui also installs and loads daisyui", async () => {
    const css = project(root);
    const h = harness();
    await main(["init", "--adapter", "daisyui"], h.io, root);
    expect(h.runs[0]!.args).toEqual(["install", "uniskin", "@uniskin/daisyui", "daisyui"]);
    expect(read(css)).toContain('@plugin "daisyui";\n@plugin "uniskin" { adapter: "daisyui"; }');
  });

  it("bootstrap adds the adapter and no extra library", async () => {
    const css = project(root);
    const h = harness();
    await main(["init", "--adapter", "bootstrap"], h.io, root);
    expect(h.runs[0]!.args).toEqual(["install", "uniskin", "@uniskin/bootstrap"]);
    expect(read(css)).toContain('@plugin "uniskin" { adapter: "bootstrap"; }');
  });

  it("flowbite adds the adapter and no extra library", async () => {
    const css = project(root);
    const h = harness();
    await main(["init", "--adapter", "flowbite"], h.io, root);
    expect(h.runs[0]!.args).toEqual(["install", "uniskin", "@uniskin/flowbite"]);
    expect(read(css)).toContain('@plugin "uniskin" { adapter: "flowbite"; }');
  });

  it("radix adds the adapter and no extra library", async () => {
    const css = project(root);
    const h = harness();
    await main(["init", "--adapter", "radix"], h.io, root);
    expect(h.runs[0]!.args).toEqual(["install", "uniskin", "@uniskin/radix"]);
    expect(read(css)).toContain('@plugin "uniskin" { adapter: "radix"; }');
  });

  it("skips packages already declared", async () => {
    project(root, { deps: { uniskin: "^0.1.0" } });
    const h = harness();
    await main(["init", "--adapter", "shadcn"], h.io, root);
    expect(h.runs[0]!.args).toEqual(["install", "@uniskin/shadcn"]);
  });

  it("prompts when interactive and no flags", async () => {
    const css = project(root);
    const h = harness({ select: (_q, c) => (c.includes("shadcn") ? "shadcn" : c[0]!) });
    await main(["init"], h.io, root);
    expect(read(css)).toContain('adapter: "shadcn"');
  });

  it("errors without adapter in a non-interactive terminal", async () => {
    const css = project(root);
    const h = harness();
    expect(await main(["init"], h.io, root)).toBe(1);
    expect(h.err[0]).toMatch(/--adapter/);
    expect(read(css)).toBe(BASE_CSS);
  });

  it("rejects unknown adapters", async () => {
    project(root);
    const h = harness();
    expect(await main(["init", "--adapter", "bogus"], h.io, root)).toBe(1);
    expect(h.err[0]).toMatch(/Unknown adapter/);
  });

  it("keeps the stylesheet untouched when install fails", async () => {
    const css = project(root);
    const h = harness({ exit: 1 });
    expect(await main(["init", "--yes"], h.io, root)).toBe(1);
    expect(read(css)).toBe(BASE_CSS);
  });
});

describe("init: placement", () => {
  it("goes after the last @import and preserves CRLF and user content", async () => {
    const original = '@import "tailwindcss";\r\n@import "./fonts.css";\r\n\r\n.x { color: red; }\r\n';
    const css = project(root, { css: original });
    await main(["init", "--yes"], harness().io, root);
    expect(read(css)).toBe(
      '@import "tailwindcss";\r\n@import "./fonts.css";\r\n@plugin "uniskin";\r\n\r\n.x { color: red; }\r\n',
    );
  });

  it("ignores a commented-out tailwind import", async () => {
    project(root, { css: '/* @import "tailwindcss"; */\n.x{}' });
    const h = harness();
    expect(await main(["init", "--yes"], h.io, root)).toBe(1);
    expect(h.err[0]).toMatch(/No CSS file/);
  });
});

describe("init: already configured and idempotency", () => {
  it("does nothing when uniskin is already configured", async () => {
    const css0 = '@import "tailwindcss";\n@plugin "uniskin" { adapter: "daisyui"; }\n';
    const css = project(root, { css: css0 });
    const h = harness();
    expect(await main(["init", "--adapter", "shadcn"], h.io, root)).toBe(0);
    expect(h.runs).toEqual([]);
    expect(read(css)).toBe(css0);
    expect(h.out.join("\n")).toMatch(/already configures uniskin/);
  });

  it("running twice changes nothing the second time", async () => {
    const css = project(root);
    await main(["init", "--adapter", "daisyui"], harness().io, root);
    const once = read(css);
    const h = harness();
    expect(await main(["init", "--adapter", "daisyui"], h.io, root)).toBe(0);
    expect(read(css)).toBe(once);
    expect(h.runs).toEqual([]);
    expect(once.match(/@plugin "uniskin"/g)).toHaveLength(1);
  });

  it("does not duplicate an existing daisyui plugin line", async () => {
    const css = project(root, { css: '@import "tailwindcss";\n@plugin "daisyui";\n' });
    await main(["init", "--adapter", "daisyui"], harness().io, root);
    expect(read(css).match(/@plugin "daisyui"/g)).toHaveLength(1);
  });
});

describe("init: Tailwind detection", () => {
  it("fails when tailwindcss is missing", async () => {
    const css = project(root, { tailwind: null });
    const h = harness();
    expect(await main(["init", "--yes"], h.io, root)).toBe(1);
    expect(h.err[0]).toMatch(/Tailwind CSS is not a dependency/);
    expect(h.runs).toEqual([]);
    expect(read(css)).toBe(BASE_CSS);
  });

  it("rejects Tailwind 3 and versions below 4.3.3", async () => {
    project(root, { tailwind: "^3.4.0" });
    expect(await main(["init", "--yes"], harness().io, root)).toBe(1);
    const root2 = mkdtempSync(path.join(tmpdir(), "uniskin-cli-"));
    project(root2, { tailwind: "^4.0.0" });
    const h = harness();
    expect(await main(["init", "--yes"], h.io, root2)).toBe(1);
    expect(h.err[0]).toMatch(/older than/);
  });

  it("prefers the installed version over the declared range", async () => {
    project(root, { tailwind: "^4.0.0", installed: "4.3.5" });
    expect(await main(["init", "--yes"], harness().io, root)).toBe(0);
  });

  it("warns but proceeds for non-numeric ranges", async () => {
    project(root, { tailwind: "latest" });
    const h = harness();
    expect(await main(["init", "--yes"], h.io, root)).toBe(0);
    expect(h.out.join("\n")).toMatch(/warning:/);
  });

  it("errors when no stylesheet imports tailwindcss", async () => {
    project(root, { css: "body{}" });
    const h = harness();
    expect(await main(["init", "--yes"], h.io, root)).toBe(1);
    expect(h.err[0]).toMatch(/No CSS file/);
  });
});

describe("init: monorepo subfolder", () => {
  it("uses the root lockfile and hoisted tailwindcss from a workspace package", async () => {
    project(root, { lock: "pnpm-lock.yaml", cssPath: "unrelated.css", css: "body{}" });
    const app = path.join(root, "apps", "web");
    mkdirSync(app, { recursive: true });
    writeFileSync(path.join(app, "package.json"), JSON.stringify({ name: "web" }));
    mkdirSync(path.join(app, "app"));
    const css = path.join(app, "app", "globals.css");
    writeFileSync(css, BASE_CSS);
    const h = harness();
    expect(await main(["init", "--yes"], h.io, app)).toBe(0);
    expect(h.runs).toEqual([{ command: "pnpm", args: ["add", "uniskin"], cwd: app }]);
    expect(read(css)).toContain('@plugin "uniskin";');
    expect(read(path.join(root, "unrelated.css"))).toBe("body{}");
  });

  it("requires --css when several entry stylesheets exist, and honours it", async () => {
    const a = project(root, { cssPath: "src/a.css" });
    const b = path.join(root, "src", "b.css");
    writeFileSync(b, BASE_CSS);
    const h = harness();
    expect(await main(["init", "--yes"], h.io, root)).toBe(1);
    expect(h.err[0]).toMatch(/--css/);
    expect(await main(["init", "--yes", "--css", "src/b.css"], harness().io, root)).toBe(0);
    expect(read(b)).toContain("@plugin");
    expect(read(a)).toBe(BASE_CSS);
  });

  it("asks which stylesheet when interactive", async () => {
    project(root, { cssPath: "src/a.css" });
    const b = path.join(root, "src", "b.css");
    writeFileSync(b, BASE_CSS);
    const h = harness({ select: (q, c) => (q.includes("stylesheet") ? c[1]! : "default") });
    await main(["init"], h.io, root);
    expect(read(b)).toContain("@plugin");
  });
});

describe("init: --dry-run", () => {
  it("changes nothing, runs nothing and prints a diff", async () => {
    const css = project(root, { lock: "yarn.lock" });
    const h = harness();
    expect(await main(["init", "--adapter", "shadcn", "--dry-run"], h.io, root)).toBe(0);
    expect(read(css)).toBe(BASE_CSS);
    expect(h.runs).toEqual([]);
    const text = h.out.join("\n");
    expect(text).toContain("would run: yarn add uniskin @uniskin/shadcn");
    expect(text).toContain('+@plugin "uniskin" { adapter: "shadcn"; }');
    expect(text).toContain('--- src/app.css');
    expect(text).toContain(' @import "tailwindcss";');
  });
});

describe("new-adapter", () => {
  it("scaffolds a package", async () => {
    const h = harness();
    expect(await main(["new-adapter", "sunset"], h.io, root)).toBe(0);
    const dir = path.join(root, "uniskin-adapter-sunset");
    const pkg = JSON.parse(read(path.join(dir, "package.json")));
    expect(pkg.name).toBe("uniskin-adapter-sunset");
    expect(pkg.peerDependencies.uniskin).toMatch(/^\^\d+\.\d+\.\d+/);
    const src = read(path.join(dir, "index.js"));
    expect(src).toContain('defineAdapter');
    expect(src).toContain('"--ui-primary"');
    expect(h.out.join("\n")).toContain('adapter: "uniskin-adapter-sunset"');
  });

  it("accepts the full package name and refuses to overwrite", async () => {
    await main(["new-adapter", "uniskin-adapter-x"], harness().io, root);
    expect(existsSync(path.join(root, "uniskin-adapter-x", "index.js"))).toBe(true);
    const h = harness();
    expect(await main(["new-adapter", "x"], h.io, root)).toBe(1);
    expect(h.err[0]).toMatch(/already exists/);
  });

  it("--file writes a single file", async () => {
    expect(await main(["new-adapter", "mine", "--file"], harness().io, root)).toBe(0);
    expect(read(path.join(root, "mine.js"))).toContain("defineAdapter");
  });

  it("rejects bad names", async () => {
    const h = harness();
    expect(await main(["new-adapter", "../evil"], h.io, root)).toBe(1);
    expect(await main(["new-adapter"], h.io, root)).toBe(1);
  });
});

describe("cli misc", () => {
  it("prints help and rejects unknown commands/flags", async () => {
    const h = harness();
    expect(await main(["--help"], h.io, root)).toBe(0);
    expect(await main(["bogus"], h.io, root)).toBe(1);
    expect(await main(["init", "--nope"], h.io, root)).toBe(1);
  });
});
