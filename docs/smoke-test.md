# Release smoke test

`scripts/release-smoke.sh` verifies a release end to end **the way a
user consumes it**: from a fresh npm project, against the real npm
registry (or local tarballs), with no dependence on this repo's
workspace.

Run it after the manual publish step in
[releasing.md](releasing.md), or before publishing to preview exactly
what will ship. It is not part of CI.

## Usage

```sh
# latest on npm (the default)
scripts/release-smoke.sh

# a specific published version
scripts/release-smoke.sh 0.2.0

# or via the root script
pnpm release:smoke
```

## Upgrade path

```sh
# install 0.4.0, run init, upgrade to the version under test, compile again
scripts/release-smoke.sh 0.7.0 --upgrade-from 0.4.0
scripts/release-smoke.sh --from-tarballs DIR --upgrade-from 0.6.0
```

With `--upgrade-from VERSION` each adapter gets a second project: the three
packages are installed at `VERSION`, `uniskin init` runs, then the packages
are moved to the version under test. The step fails if the install is
refused (a wrong peer range), if `init` left the stylesheet different after
the upgrade, or if the compiled output lacks `.ui-button` or the dark block.
Run it with the previous minor before every release.

## What it checks

In a temp dir outside the repo, for each of `default`, `shadcn` and
`daisyui`, the script creates a fresh npm project and:

1. `npm init -y`, then installs `tailwindcss`, `@tailwindcss/cli`,
   `uniskin` and the adapter (plus `daisyui` for the daisyUI skin) —
   all at the requested version.
2. `npx uniskin init --adapter <name> --yes` and asserts the `@plugin`
   line lands in the stylesheet.
3. Runs `init` a second time and asserts the stylesheet is unchanged —
   `init` is documented as idempotent.
4. Compiles the stylesheet with `@tailwindcss/cli`.
5. Greps the output for `.ui-button` and a `prefers-color-scheme` dark
   block.

It prints a PASS/FAIL table per adapter (with the resolved `uniskin` and
`tailwindcss` versions), tails the failing step's log on failure,
removes the temp dir and exits non-zero if anything failed.

## Tarball mode (pre-publish)

When the version under test isn't on npm yet, pack the workspace and
point the script at the tarballs:

```sh
tb=$(mktemp -d)
for p in uniskin adapter-shadcn adapter-daisyui; do
  (cd "packages/$p" && pnpm pack --pack-destination "$tb")
done
scripts/release-smoke.sh --from-tarballs "$tb"
```

`pnpm pack` rewrites `workspace:` peer ranges to real versions, so this
exercises the exact artifacts `pnpm publish` would upload. External
dependencies (`tailwindcss`, `daisyui`) still come from the registry.

## Notes

- Needs `node`, `npm`, `npx`, network access to registry.npmjs.org and a
  writable `$TMPDIR`. Registry mode takes ~30 s on a warm cache.
- `tailwindcss` and `@tailwindcss/cli` are installed unpinned (`latest`)
  — that matches what a new user gets; the resolved versions are printed
  in the table.
- The script is POSIX `sh` with `set -eu` and no repo dependencies — it
  can be copied anywhere and run standalone.
