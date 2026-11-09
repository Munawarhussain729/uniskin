---
"uniskin": minor
---

Add a `uniskin` CLI: `npx uniskin init` installs the packages for an adapter (default, shadcn or daisyui) with the detected package manager and idempotently adds the `@plugin` line(s) to your Tailwind v4 stylesheet (`--adapter`, `--css`, `--yes`, `--dry-run`), and `npx uniskin new-adapter <name>` scaffolds an adapter. The plugin entry is unchanged and the CLI has no dependencies.
