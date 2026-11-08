import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const adapters = ["default", "shadcn", "daisyui"];

mkdirSync(join(root, "public/adapters"), { recursive: true });

const children = [];
for (const name of adapters) {
  children.push(
    spawn(
      "pnpm",
      [
        "exec",
        "tailwindcss",
        "-i",
        join(root, "skins", `${name}.css`),
        "-o",
        join(root, `public/adapters/${name}.css`),
        "--watch",
      ],
      { cwd: root, stdio: "inherit" },
    ),
  );
}
children.push(spawn("pnpm", ["exec", "vite"], { cwd: root, stdio: "inherit" }));

const shutdown = () => {
  for (const child of children) child.kill("SIGTERM");
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
for (const child of children) child.on("exit", (code) => code && process.exit(code));
