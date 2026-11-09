import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

const LOCKFILES: Array<[string, PackageManager]> = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["package-lock.json", "npm"],
  ["npm-shrinkwrap.json", "npm"],
];

/** Detects the package manager from the nearest lockfile, walking up from `cwd`. Defaults to npm. */
export function detectPackageManager(cwd: string): PackageManager {
  let dir = path.resolve(cwd);
  for (;;) {
    for (const [file, pm] of LOCKFILES) {
      if (existsSync(path.join(dir, file))) return pm;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return "npm";
    dir = parent;
  }
}

export function installCommand(pm: PackageManager, packages: string[]): { command: string; args: string[] } {
  if (pm === "npm") return { command: "npm", args: ["install", ...packages] };
  return { command: pm, args: ["add", ...packages] };
}

interface PackageJson {
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

function readJson(file: string): PackageJson | undefined {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as PackageJson;
  } catch {
    return undefined;
  }
}

function declared(pkg: PackageJson | undefined, name: string): string | undefined {
  if (!pkg) return undefined;
  return (
    pkg.dependencies?.[name] ??
    pkg.devDependencies?.[name] ??
    pkg.optionalDependencies?.[name] ??
    pkg.peerDependencies?.[name]
  );
}

/** True when `name` is declared in the package.json at `cwd`. */
export function isDeclared(cwd: string, name: string): boolean {
  return declared(readJson(path.join(cwd, "package.json")), name) !== undefined;
}

export const MIN_TAILWIND = "4.3.3";

export type TailwindCheck =
  | { ok: true; version?: string; warning?: string }
  | { ok: false; reason: string };

type Version = [number, number, number];

function parseVersion(text: string): Version | undefined {
  const m = /(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(text);
  if (!m) return undefined;
  return [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)];
}

function gte(a: Version, b: Version): boolean {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i]! > b[i]!;
  }
  return true;
}

/**
 * Checks that Tailwind CSS >= 4.3.3 is available. Looks at `cwd`'s
 * package.json first, then ancestors (hoisted monorepo roots). The
 * installed version in node_modules wins over the declared range.
 */
export function checkTailwind(cwd: string): TailwindCheck {
  let dir = path.resolve(cwd);
  let range: string | undefined;
  let found: string | undefined;
  for (;;) {
    const r = declared(readJson(path.join(dir, "package.json")), "tailwindcss");
    if (r !== undefined) {
      range = r;
      found = dir;
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (range === undefined || found === undefined) {
    return {
      ok: false,
      reason:
        'Tailwind CSS is not a dependency of this project. Uniskin needs tailwindcss >= 4.3.3 - install it first (for example "npm install tailwindcss").',
    };
  }
  const min = parseVersion(MIN_TAILWIND)!;
  const installed = readJson(path.join(found, "node_modules", "tailwindcss", "package.json"));
  const installedVersion = installed?.version ? parseVersion(installed.version) : undefined;
  if (installedVersion) {
    return gte(installedVersion, min)
      ? { ok: true, version: installed!.version }
      : {
          ok: false,
          reason: `Installed tailwindcss ${installed!.version} is older than the supported ${MIN_TAILWIND}. Upgrade Tailwind CSS first.`,
        };
  }
  const declaredVersion = /^[\^~<>=\sv0-9.xX*|-]+$/.test(range) ? parseVersion(range) : undefined;
  if (!declaredVersion) {
    return {
      ok: true,
      warning: `Could not verify the tailwindcss version from "${range}"; make sure it is >= ${MIN_TAILWIND}.`,
    };
  }
  return gte(declaredVersion, min)
    ? { ok: true, version: range }
    : {
        ok: false,
        reason: `package.json declares tailwindcss "${range}", which is older than the supported ${MIN_TAILWIND}. Upgrade Tailwind CSS first.`,
      };
}

const TAILWIND_IMPORT = /@import\s+(?:url\(\s*)?["']tailwindcss["']/;
const SKIP_DIRS = new Set(["node_modules", "dist", "build", "out", "coverage", "vendor", "public"]);
const MAX_DEPTH = 4;

/** Blanks out CSS comments, keeping line structure. */
export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
}

export function hasTailwindImport(css: string): boolean {
  return TAILWIND_IMPORT.test(stripComments(css));
}

/** Finds `.css` files under `cwd` that import Tailwind, shallowest first. */
export function findTailwindCss(cwd: string): string[] {
  const results: string[] = [];
  const walk = (dir: string, depth: number) => {
    let entries: string[];
    try {
      entries = readdirSync(dir).sort();
    } catch {
      return;
    }
    for (const name of entries) {
      if (name.startsWith(".") || SKIP_DIRS.has(name)) continue;
      const full = path.join(dir, name);
      try {
        if (statSync(full).isDirectory()) {
          if (depth < MAX_DEPTH) walk(full, depth + 1);
        } else if (name.endsWith(".css") && hasTailwindImport(readFileSync(full, "utf8"))) {
          results.push(full);
        }
      } catch {
        /* unreadable entry: ignore */
      }
    }
  };
  walk(cwd, 0);
  return results.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length || a.localeCompare(b));
}
