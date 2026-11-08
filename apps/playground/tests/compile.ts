import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const playgroundRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const tailwind = join(playgroundRoot, "node_modules", ".bin", "tailwindcss");

/** Compile one of the playground adapter stylesheets, return the CSS. */
export function compileAdapter(name: string): string {
  const out = join(playgroundRoot, "tests", "__out__", `${name}.css`);
  mkdirSync(dirname(out), { recursive: true });
  execFileSync(tailwind, ["-i", join(playgroundRoot, "skins", `${name}.css`), "-o", out], {
    cwd: playgroundRoot,
    stdio: "pipe",
  });
  return readFileSync(out, "utf8");
}

/**
 * Compile a minimal project in a temp dir containing ONLY the given files.
 * Used to prove that classes appearing solely in .php/.vue/… sources are
 * picked up by Tailwind's automatic content detection.
 */
export function compileWithFiles(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "uniskin-scan-"));
  const uniskinEntry = join(playgroundRoot, "node_modules", "uniskin", "dist", "index.js");
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
  }
  writeFileSync(
    join(dir, "in.css"),
    `@import "tailwindcss";\n@plugin "${uniskinEntry}";\n`,
  );
  const out = join(dir, "out.css");
  execFileSync(tailwind, ["-i", join(dir, "in.css"), "-o", out], {
    cwd: dir,
    stdio: "pipe",
  });
  return readFileSync(out, "utf8");
}
