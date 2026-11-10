import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { CliError, init, type Io } from "./init.js";
import { newAdapter } from "./new-adapter.js";

const HELP = `uniskin - set up the Uniskin Tailwind v4 plugin

Usage:
  uniskin init [--adapter default|shadcn|daisyui|bootstrap] [--css <path>] [--yes] [--dry-run]
  uniskin new-adapter <name> [--file]

init         Install packages and add the @plugin line to your Tailwind CSS.
new-adapter  Scaffold uniskin-adapter-<name>/ (or <name>.js with --file).
`;

function ownVersion(): string {
  const pkgPath = new URL("../../package.json", import.meta.url);
  return (JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string }).version;
}

export function realIo(): Io {
  return {
    log: (m) => console.log(m),
    error: (m) => console.error(m),
    select: process.stdin.isTTY
      ? async (question, choices) => {
          const rl = createInterface({ input: process.stdin, output: process.stdout });
          try {
            for (;;) {
              const list = choices.map((c, i) => `  ${i + 1}) ${c}`).join("\n");
              const answer = (await rl.question(`${question}\n${list}\n> `)).trim();
              const byIndex = choices[Number(answer) - 1];
              if (byIndex) return byIndex;
              if (choices.includes(answer)) return answer;
            }
          } finally {
            rl.close();
          }
        }
      : undefined,
    run: (command, args, cwd) =>
      spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" }).status ?? 1,
  };
}

/** Runs the CLI and returns the process exit code. */
export async function main(argv: string[], io: Io = realIo(), cwd = process.cwd()): Promise<number> {
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        adapter: { type: "string" },
        css: { type: "string" },
        yes: { type: "boolean", short: "y" },
        "dry-run": { type: "boolean" },
        file: { type: "boolean" },
        help: { type: "boolean", short: "h" },
      },
    });
    const [command, ...rest] = positionals;
    if (values.help || !command) {
      io.log(HELP);
      return values.help ? 0 : 1;
    }
    if (command === "init") {
      return await init(
        { cwd, adapter: values.adapter, css: values.css, yes: values.yes, dryRun: values["dry-run"] },
        io,
      );
    }
    if (command === "new-adapter") {
      if (rest.length !== 1) throw new CliError("Usage: uniskin new-adapter <name> [--file]");
      return newAdapter({ cwd, name: rest[0]!, file: values.file, uniskinVersion: ownVersion() }, io);
    }
    throw new CliError(`Unknown command "${command}".\n\n${HELP}`);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (e instanceof CliError || code?.startsWith("ERR_PARSE_ARGS")) {
      io.error(`error: ${(e as Error).message}`);
      return 1;
    }
    throw e;
  }
}
