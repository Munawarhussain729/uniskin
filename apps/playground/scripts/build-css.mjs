import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const adapters = ["default", "shadcn", "daisyui", "bootstrap"];

mkdirSync(join(root, "public/adapters"), { recursive: true });

for (const name of adapters) {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "tailwindcss",
      "-i",
      join(root, "skins", `${name}.css`),
      "-o",
      join(root, `public/adapters/${name}.css`),
      "--minify",
    ],
    { cwd: root, stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
