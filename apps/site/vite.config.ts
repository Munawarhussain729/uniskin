import { readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

const framesDir = join(root, "frames");
const frames = Object.fromEntries(
  readdirSync(framesDir)
    .filter((file) => file.endsWith(".html"))
    .map((file) => [`frames/${basename(file, ".html")}`, join(framesDir, file)]),
);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: join(root, "index.html"),
        builder: join(root, "builder/index.html"),
        ...frames,
      },
    },
  },
});
