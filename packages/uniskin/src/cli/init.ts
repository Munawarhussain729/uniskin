import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  ADAPTERS,
  ADAPTER_PACKAGES,
  type AdapterChoice,
  hasUniskinPlugin,
  insertPlugin,
  insertionDiff,
  pluginLines,
} from "./css.js";
import {
  checkTailwind,
  detectPackageManager,
  findTailwindCss,
  hasTailwindImport,
  installCommand,
  isDeclared,
} from "./project.js";

export interface InitOptions {
  cwd: string;
  adapter?: string;
  css?: string;
  yes?: boolean;
  dryRun?: boolean;
}

export interface Io {
  log(message: string): void;
  error(message: string): void;
  /** Interactive prompt; undefined when not interactive. */
  select?(question: string, choices: string[]): Promise<string>;
  /** Runs an install command; returns the exit code. */
  run(command: string, args: string[], cwd: string): number;
}

export class CliError extends Error {}

/** Returns a process exit code. Throws CliError for user-facing failures. */
export async function init(opts: InitOptions, io: Io): Promise<number> {
  const cwd = path.resolve(opts.cwd);

  if (opts.adapter !== undefined && !ADAPTERS.includes(opts.adapter as AdapterChoice)) {
    throw new CliError(`Unknown adapter "${opts.adapter}". Choose one of: ${ADAPTERS.join(", ")}.`);
  }

  const tw = checkTailwind(cwd);
  if (!tw.ok) throw new CliError(tw.reason);
  if (tw.warning) io.log(`warning: ${tw.warning}`);

  let cssFile: string;
  if (opts.css !== undefined) {
    cssFile = path.resolve(cwd, opts.css);
    let text: string;
    try {
      text = readFileSync(cssFile, "utf8");
    } catch {
      throw new CliError(`Cannot read CSS file ${opts.css}.`);
    }
    if (!hasTailwindImport(text)) {
      throw new CliError(`${opts.css} does not contain @import "tailwindcss". Pass the Tailwind entry stylesheet.`);
    }
  } else {
    const candidates = findTailwindCss(cwd);
    if (candidates.length === 0) {
      throw new CliError('No CSS file with @import "tailwindcss" found. Create one, or pass --css <path>.');
    }
    if (candidates.length === 1) {
      cssFile = candidates[0]!;
    } else {
      const rel = candidates.map((c) => path.relative(cwd, c));
      if (opts.yes || !io.select) {
        throw new CliError(
          `Found several Tailwind entry stylesheets (${rel.join(", ")}). Pick one with --css <path>.`,
        );
      }
      cssFile = path.resolve(cwd, await io.select("Which stylesheet should be updated?", rel));
    }
  }
  const relCss = path.relative(cwd, cssFile) || cssFile;
  const original = readFileSync(cssFile, "utf8");

  if (hasUniskinPlugin(original)) {
    io.log(`${relCss} already configures uniskin; nothing to do.`);
    return 0;
  }

  let adapter = opts.adapter as AdapterChoice | undefined;
  if (adapter === undefined) {
    if (opts.yes) adapter = "default";
    else if (io.select) adapter = (await io.select("Which adapter do you want?", [...ADAPTERS])) as AdapterChoice;
    else throw new CliError("Not an interactive terminal: pass --adapter <default|shadcn|daisyui|bootstrap|flowbite> or --yes.");
  }

  const pm = detectPackageManager(cwd);
  const missing = ADAPTER_PACKAGES[adapter].filter((p) => !isDeclared(cwd, p));
  const result = insertPlugin(original, adapter);

  if (opts.dryRun) {
    io.log(`dry run (package manager: ${pm}) - no changes made.`);
    if (missing.length > 0) {
      const { command, args } = installCommand(pm, missing);
      io.log(`would run: ${command} ${args.join(" ")}`);
    } else {
      io.log("all required packages are already declared.");
    }
    io.log(insertionDiff(relCss, original, result.line ?? 1, result.added));
    return 0;
  }

  if (missing.length > 0) {
    const { command, args } = installCommand(pm, missing);
    io.log(`running: ${command} ${args.join(" ")}`);
    const code = io.run(command, args, cwd);
    if (code !== 0) {
      throw new CliError(`${command} exited with code ${code}; the stylesheet was not modified.`);
    }
  }

  writeFileSync(cssFile, result.content);
  io.log(`updated ${relCss}:`);
  for (const l of pluginLines(adapter)) io.log(`  ${l}`);
  return 0;
}
