import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { CliError, type Io } from "./init.js";

export interface NewAdapterOptions {
  cwd: string;
  name: string;
  /** Write a single `<name>.js` file instead of a package directory. */
  file?: boolean;
  /** Version of uniskin, used as the peer range base. */
  uniskinVersion: string;
}

const ADAPTER_PREFIX = "uniskin-adapter-";

function adapterSource(name: string): string {
  return `import { defineAdapter } from "uniskin/adapter";

// Deep-merged over the built-in default theme: define only what you change.
// Overriding tokens is the easiest start; every component inherits them.
export default defineAdapter({
  name: ${JSON.stringify(name)},
  tokens: {
    "--ui-primary": "oklch(0.55 0.2 300)",
    "--ui-primary-fg": "oklch(0.98 0 0)",
  },
  components: {
    button: {
      base: {
        "border-radius": "9999px",
      },
    },
  },
});
`;
}

export function newAdapter(opts: NewAdapterOptions, io: Io): number {
  const slug = opts.name.startsWith(ADAPTER_PREFIX) ? opts.name.slice(ADAPTER_PREFIX.length) : opts.name;
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new CliError(
      `Invalid adapter name "${opts.name}". Use lowercase letters, digits and hyphens, starting with a letter.`,
    );
  }
  const cwd = path.resolve(opts.cwd);

  if (opts.file) {
    const target = path.join(cwd, `${slug}.js`);
    if (existsSync(target)) throw new CliError(`${slug}.js already exists; not overwriting.`);
    writeFileSync(target, adapterSource(slug));
    io.log(`created ${slug}.js`);
    io.log(`use it: @plugin "uniskin" { adapter: "./${slug}.js"; }`);
    return 0;
  }

  const pkgName = `${ADAPTER_PREFIX}${slug}`;
  const dir = path.join(cwd, pkgName);
  if (existsSync(dir)) throw new CliError(`${pkgName}/ already exists; not overwriting.`);
  mkdirSync(dir, { recursive: true });
  const pkg = {
    name: pkgName,
    version: "0.0.0",
    description: `${slug} adapter for Uniskin`,
    type: "module",
    main: "./index.js",
    exports: { ".": "./index.js" },
    files: ["index.js"],
    keywords: ["tailwindcss", "uniskin", "adapter"],
    license: "MIT",
    peerDependencies: { uniskin: `^${opts.uniskinVersion}` },
  };
  writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  writeFileSync(path.join(dir, "index.js"), adapterSource(slug));
  io.log(`created ${pkgName}/package.json`);
  io.log(`created ${pkgName}/index.js`);
  io.log(`use it: @plugin "uniskin" { adapter: "${pkgName}"; }`);
  io.log("see docs/writing-adapters.md for the full slot reference.");
  return 0;
}
