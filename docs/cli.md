# Uniskin CLI

The `uniskin` package ships a small CLI. It has no runtime dependencies
(Node's built-in `util.parseArgs` and `readline` only) and is separate from
the Tailwind plugin entry: importing `uniskin` in your CSS never loads it.

```sh
npx uniskin init
npx uniskin new-adapter <name>
```

## `uniskin init`

Run it from the project (or workspace package) that owns the Tailwind
stylesheet.

1. **Checks Tailwind.** `tailwindcss` must be declared in the current
   `package.json` (or an ancestor one, for hoisted monorepos) and be
   `>= 4.3.3`. The installed version in `node_modules` wins over the declared
   range. Non-numeric ranges such as `latest` produce a warning and proceed.
2. **Finds the stylesheet.** Scans up to four directory levels (skipping
   `node_modules`, `dist`, dot-directories, ...) for a `.css` file containing
   `@import "tailwindcss"`. If several match, pass `--css <path>` (or pick one
   interactively).
3. **Picks the package manager** from the nearest lockfile, walking up:
   `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`/`bun.lockb`, `package-lock.json`;
   npm when none is found.
4. **Installs** only the packages not already declared, then
5. **Inserts** the `@plugin` line(s) after the last `@import` statement. Nothing
   else in the file is changed.

| `--adapter` | Packages | Lines added |
|---|---|---|
| `default` | `uniskin` | `@plugin "uniskin";` |
| `shadcn` | `uniskin`, `@uniskin/shadcn` | `@plugin "uniskin" { adapter: "shadcn"; }` |
| `daisyui` | `uniskin`, `@uniskin/daisyui`, `daisyui` | `@plugin "daisyui";` and `@plugin "uniskin" { adapter: "daisyui"; }` |
| `bootstrap` | `uniskin`, `@uniskin/bootstrap` | `@plugin "uniskin" { adapter: "bootstrap"; }` |

Flags:

- `--adapter <default|shadcn|daisyui|bootstrap>`: skip the prompt.
- `--css <path>`: the stylesheet to edit.
- `--yes`, `-y`: never prompt; uses `default` when `--adapter` is absent and
  fails instead of asking which stylesheet to use.
- `--dry-run`: print the install command that would run and a diff of the
  stylesheet; change nothing.

Without a TTY, `--adapter` or `--yes` is required.

**Idempotent.** If the stylesheet already has `@plugin "uniskin"`, `init`
reports that and exits without installing or editing anything, even when you
request a different adapter: change an existing adapter by editing the line.
If install fails, the stylesheet is not touched.

## `uniskin new-adapter <name>`

Scaffolds `uniskin-adapter-<name>/` (a leading `uniskin-adapter-` in the name
is accepted) containing `package.json` and an ESM `index.js` that calls
`defineAdapter` with a token override and one component override, as described
in [writing-adapters.md](./writing-adapters.md). With `--file` it writes a
single `<name>.js` instead, for use as `adapter: "./<name>.js"`. Existing files
are never overwritten.
