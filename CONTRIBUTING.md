# Contributing to Uniskin

Thanks for helping. This guide covers setup, the checks CI runs,
changesets, and the conventions PRs are expected to follow.

## Prerequisites

- **Node 22** recommended (CI also tests on Node 20).
- **pnpm 11.13.1** — pinned via `packageManager`; run `corepack enable`
  or let pnpm bootstrap it on first use.

## Setup

```sh
git clone https://github.com/Munawarhussain729/uniskin.git
cd uniskin
pnpm install --frozen-lockfile
```

## Verify your change

Run the same checks CI runs, in this order:

```sh
pnpm lint          # eslint over the whole repo
pnpm -r build      # build every package and app
pnpm -r typecheck  # typecheck — see the gotcha below
pnpm test          # unit tests + Playwright e2e (apps/playground, apps/site)
```

**Build before typecheck.** Package typechecks resolve cross-package
imports (`uniskin/adapter`, `@uniskin/shadcn`, …) against each package's
built `dist/` output, not its source. Typechecking a clean checkout — or
after editing a package another package depends on — produces stale or
missing-module errors. Always `pnpm -r build` first, then
`pnpm -r typecheck`.

## Playground e2e

```sh
pnpm --filter playground test
```

This runs the Vitest unit tests, installs Playwright's Chromium if
needed, then runs the Playwright suite (compiled-CSS assertions and axe
accessibility checks) against a Vite build of the demo. For manual
poking, `pnpm --filter playground dev` serves the same demo.
`pnpm --filter site test` is the equivalent for the docs site (unit
tests plus the builder e2e).

## Changesets (versions and changelogs)

This repo uses [changesets](https://github.com/changesets/changesets) —
see [docs/releasing.md](docs/releasing.md) for the full flow. Add a
changeset whenever a PR changes published behaviour:

```sh
pnpm changeset
```

Pre-1.0 rules (every published package is `0.x`):

- **minor** for features and breaking changes
- **patch** for fixes
- chores that touch nothing published (CI, repo docs, the private apps)
  need no changeset
- **never hand-edit** a `version` field or a `CHANGELOG.md` — the
  automated Version Packages PR rewrites them mechanically on merge to
  `main`

The private apps (`playground`, `site`) are ignored by changesets and
are never published. Publishing itself is manual and owner-only — never
run `npm publish` or `pnpm publish` from a contribution branch.

## Branches, commits, PRs

- Branch from `origin/main`. One change per branch, one PR per branch.
- Use [Conventional Commits](https://www.conventionalcommits.org):
  `feat:`, `fix:`, `docs:`, `chore:`, `test:` — scope optional, e.g.
  `feat(site):`.
- Keep PRs focused; list anything you deliberately skipped under
  **Follow-ups** in the PR body.
- For UI changes, check light **and** dark mode, keyboard focus and
  `prefers-reduced-motion`, and attach screenshots at 360/768/1280 px.
- CI runs lint → build → test on Node 20 and 22 plus a Tailwind
  compatibility matrix. Keep it green; routine PRs shouldn't add CI jobs.
- Don't merge your own PR — a maintainer reviews and merges.

## Writing an adapter

The fastest start is the CLI scaffold:

```sh
npx uniskin new-adapter <name>
```

Then read [docs/writing-adapters.md](docs/writing-adapters.md) for the
adapter interface, the `--ui-*` token model and the fallback rules.
`packages/adapter-shadcn` and `packages/adapter-daisyui` are working
examples. Markup and class names come from
[docs/vocabulary.md](docs/vocabulary.md).

## Repo layout

- `packages/uniskin` — core plugin, default theme, adapter interface, CLI
- `packages/adapter-shadcn`, `packages/adapter-daisyui` — adapters
- `apps/playground` — e2e suite + manual demo
- `apps/site` — docs site + skin builder
- `docs/` — guides, QA notes and decisions (`docs/decisions/`)

## Questions

Open an issue. For security reports use the private channel described in
[SECURITY.md](SECURITY.md).
