# Roadmap and release plan to 1.0.0

Status: complete on `main` (1.0.0 is versioned; publishing it is the
owner's step). The scope of each release was a plan, not a promise; the
numbers changed along the way, as recorded below.

Latest published release: **0.4.0** (vocabulary v1.4). **0.5.0**
(`2399ba0`, vocabulary v1.6), **0.6.0** (`a137182`, vocabulary v1.8) and
**0.7.0** (vocabulary v1.15) are versioned on `main` and waiting to be
published; see
[Release log](#release-log). The component order comes
from [ADR-003](decisions/003-vocabulary-expansion.md); the release
mechanics are in [releasing.md](releasing.md).

## How releases work

- **Versioning.** Every package is `0.x`. A minor bump carries features
  and any breaking change; a patch bump carries fixes. `uniskin`,
  `@uniskin/shadcn` and `@uniskin/daisyui` move together.
- **Vocabulary label.** The vocabulary has its own label (`v1.4` today)
  that increases by one minor step whenever classes are added. It is not
  the package version.
- **One change per PR.** One component per branch, each with a
  changeset (minor), the per-component checklist from ADR-003 and
  screenshots at 360, 768 and 1280 px in light and dark.
- **Conventional Commits** for every commit and PR title (`feat:`,
  `fix:`, `docs:`, `test:`, `chore:`), branches named
  `feat/ui-<name>`, `fix/<topic>`, `docs/<topic>`.
- **Patch releases** (`0.x.y`) ship fixes between feature releases, as
  needed, through the same sequence.

### Release sequence (every version)

1. Every planned PR is merged and `main` is green.
2. The Version Packages PR is reviewed and merged (check the bumped
   versions and the changelog text).
3. Publish `uniskin`, then `@uniskin/shadcn`, then `@uniskin/daisyui`
   ([releasing.md](releasing.md); needs the owner's 2FA).
4. `scripts/release-smoke.sh <version>` passes for all three adapters.
5. Push the tag `uniskin@<version>`; the GitHub Release is created from
   the changelog.
6. Redeploy the site and check `/`, `/builder/` and the adapter CSS.
7. Update this file: tick the release, re-confirm the next scope.

## Release log

A release is **versioned** when its Version Packages PR is merged, and
**published** when the owner runs the publish step. Because publishing
needs the owner's 2FA, the next release's features may already be on
`main` by then, so publish each version from its own version commit:

```sh
git checkout <version commit>
pnpm install --frozen-lockfile && pnpm -r build
pnpm --filter uniskin publish && pnpm --filter @uniskin/shadcn publish && pnpm --filter @uniskin/daisyui publish
git tag uniskin@<version> <version commit> && git push origin uniskin@<version>
```

| Version | Vocabulary | Version commit | State |
|---------|------------|----------------|-------|
| 0.4.0 | v1.4 | `c6f81a3` | published |
| 0.5.0 | v1.6 | `2399ba0` | versioned, not yet published |
| 0.6.0 | v1.8 | `a137182` | versioned, not yet published |
| 0.7.0 | v1.15 | `62e7d8c` | versioned, not yet published |
| 0.8.0 | v1.15 | `e6c3a1d` | versioned, not yet published (the release candidate) |
| 1.0.0 | v1.15 | `ce2191a` | versioned, not yet published |

Merging a Version Packages PR only versions a release. A GitHub Release
appears when the tag is pushed, and the tag comes after the npm publish. To
catch up on 0.5.0 and 0.6.0, publish in order, each from its own commit:

```sh
# 0.5.0
git checkout 2399ba0 && pnpm install --frozen-lockfile && pnpm -r build
pnpm --filter uniskin publish && pnpm --filter @uniskin/shadcn publish && pnpm --filter @uniskin/daisyui publish
git tag uniskin@0.5.0 2399ba0

# 0.6.0
git checkout a137182 && pnpm install --frozen-lockfile && pnpm -r build
pnpm --filter uniskin publish && pnpm --filter @uniskin/shadcn publish && pnpm --filter @uniskin/daisyui publish
git tag uniskin@0.6.0 a137182

# 0.7.0, 0.8.0 and 1.0.0 the same way, from 62e7d8c, e6c3a1d and ce2191a

git checkout main && git push origin uniskin@0.5.0 uniskin@0.6.0
```

Everything between 0.4.0 and 1.0.0 is additive and none of it is breaking, so
publishing only 1.0.0 is also valid; the intermediate versions are then
versioned history that npm never sees. If you do publish them, 0.8.0 is the
release candidate: run `scripts/release-smoke.sh 0.8.0 --upgrade-from 0.4.0`
against it before publishing 1.0.0.

Run `scripts/release-smoke.sh <version>` after each publish. Pushing the
tags starts the GitHub Release workflow; it failed with a GitHub-side error
on its first run (0.4.0), so if it does not create the release, create it
from the changelog with `gh release create uniskin@<version>`.

## Releases

### 0.5.0: disclosure and feedback (versioned)

Components that are native HTML, need no JavaScript, and finish the
"common app UI" basics.

| Item | Notes |
|------|-------|
| `ui-accordion` | Native `<details>`/`<summary>`; style the marker, `[open]`, focus ring; height/opacity animation only with a reduced-motion override. |
| `ui-progress` | Native `<progress>`; intents and sizes; determinate and `:indeterminate`. |
| Intent pins adopted | `ui-badge`, `ui-alert` and `ui-card.ui-outline` read `--ui-c-border`. `--ui-c-soft-hover` stays button-only: none of the three hovers. |
| Housekeeping | Enable "Allow GitHub Actions to create and approve pull requests" so the Version Packages PR opens itself; confirm the tag-triggered release workflow runs; connect the site's Vercel project to the repo for automatic deploys. |

Exit: both components pass the per-component checklist; `vocabulary.md`
and the coverage matrix are updated; vocabulary label becomes v1.6 (the
accordion is v1.5, progress v1.6). Also shipped: a fix for an alert
cascade bug that adding rules exposed (see `docs/qa/accordion-2026-11.md`).

### 0.6.0: overlays (versioned)

| Item | Notes |
|------|-------|
| `ui-tooltip` | CSS hover/focus-within. Sets the `data-placement` and `@starting-style` conventions. Documents the WCAG 1.4.13 Escape limitation without JavaScript and the Popover API upgrade path (decision 11). |
| `ui-toast` + `ui-toast-region` | CSS for placement and look; the live region, timers and dismissal stay with the consumer and are documented. |

Exit: the placement convention is written in `writing-adapters.md`; both
components pass axe and the reduced-motion checks; label v1.8 (tooltip
v1.7, toast v1.8). Done. Also written down: the entering-elements
convention (`@starting-style`) and the rule that intents only set
variables. Recorded exceptions: the bubble and toast fills reuse each
skin's intent pairs, so a few upstream palette values appear (see
`docs/qa/tooltip-2026-11.md` and `docs/qa/toast-2026-11.md`); 0.9.0 revisits
every allow-listed entry.

### 0.7.0: menus and the small components (versioned)

| Item | Notes |
|------|-------|
| `ui-dropdown`, `ui-menu`, `ui-menu-item` | Largest accessibility surface. Needs a full keyboard contract in `vocabulary.md` (arrow keys, Home/End, Escape, focus return, typeahead expectations), and honours `data-highlighted`/`data-state` for the menu only (decision 7). |
| Decision | Whether to ship a small optional JavaScript helper or stay CSS-only and point to headless libraries. Decide before implementation; the 1.0 promise of "CSS only" must stay true for the core package. |

Exit: keyboard e2e (arrows, Home/End, Escape, focus return) in all six
skin and mode combinations; label v1.9. Done: the decision is **CSS only,
no helper**. The package ships no JavaScript, the keyboard contract is
documented as the consumer's (with headless recipes), and the playground
demo has a short working handler that the e2e drives. See
`docs/qa/menu-2026-11.md`.

### 0.8.0: the remaining small components (folded into 0.7.0)

Pulled from the deferred list in ADR-003, ordered by demand when the
release starts: `ui-avatar`, `ui-breadcrumb`, `ui-pagination`,
`ui-skeleton`, `ui-separator`, `ui-slider` (native `<input type=range>`),
and `ui-drawer` (evaluated first as a `ui-modal` placement).
`ui-combobox`/`ui-listbox` stay out of scope; the name `ui-listbox` stays
reserved (decision 9). If the list is too long, split it into 0.8.0 and
0.8.1. Done, and shipped in **0.7.0**: the menu and these components all
merged before the Version Packages PR was opened, so they are one release
and there is no 0.8.0.

Exit: each item passes the checklist or is explicitly dropped in this
file with a reason. Shipped: avatar, skeleton and separator (v1.12);
breadcrumb and pagination (v1.14); slider (v1.15). The drawer is a
`data-placement` on `ui-modal` (no new class, so no label step). QA notes
are in `docs/qa/small-2026-11.md`, `nav-2026-11.md`, `slider-2026-11.md` and
`drawer-2026-11.md`.

### 0.9.0: release candidate (shipped as 0.8.0)

No new vocabulary. Work is hardening and documentation.

- **Freeze review.** Walk every public surface (class names, modifier
  sets, plugin options, adapter interface, token names, CLI flags) and
  mark each one stable or remove it. Deprecations announced in 0.8 are
  resolved here.
- **Adapter contract.** Resolve the open adapter-contract items; ship a
  conformance helper (an adapter checked against the coverage matrix)
  and re-test the contract with a deliberately different third adapter.
- **Accessibility audit.** Full pass over every component in six skin
  and mode combinations; every allow-listed axe entry has a written
  reason or is removed.
- **Docs.** Getting started, vocabulary, writing adapters, the skin
  builder and migration notes are complete and checked against the code.
- **Upgrade path.** `release-smoke.sh` also installs the previous minor
  and upgrades, to catch peer-range and changeset problems.

Exit: no open issue labelled `needs decision` or `breaking`; a 0.9.x
patch line is used for any fixes found while the freeze settles.

Done, and shipped as **0.8.0** (the 0.8 component scope went out in 0.7.0,
so the candidate took the next number): the freeze review is
[stability.md](stability.md); `uniskin/conformance` (`checkAdapter`) is the
conformance helper, proven with a deliberately different third adapter in the
unit tests; `release-smoke.sh --upgrade-from` is the upgrade-path check; the
axe allow-list now fails an entry that matches nothing (two stale ones were
narrowed) and every entry has its reason; a unit test fails when the default
theme reads a hook no doc mentions; the three packages are versioned
together (`fixed` in the changeset config); the upgrade notes are
[migrating.md](migrating.md). The freeze review found one inconsistency, in
the coverage matrix (table row states are not slots), and fixed it.

### 1.0.0 (versioned; to publish)

Criteria, all required:

1. **Stable surface.** Everything from the 0.9.0 freeze review is
   documented as stable, with the rule that breaking it needs 2.0.
2. **Peer ranges.** Adapters declare `uniskin` as `^1.0.0` (the
   `onlyUpdatePeerDependentsWhenOutOfRange` setting stays); the Tailwind
   floor is re-confirmed by the compatibility matrix.
3. **Quality bar.** Lint, build, typecheck, unit and e2e tests, axe and
   contrast checks pass on Node 20 and 22 and on the Tailwind matrix.
4. **Docs and examples.** Every component documented with markup,
   modifiers, native equivalents and accessibility notes; the site's
   demo and builder match the published packages.
5. **Release hygiene.** The Release workflow opens the Version Packages
   PR unattended; the tag workflow creates the GitHub Release; the smoke
   test passes against the published packages.
6. **Support policy.** A short statement of supported Node and Tailwind
   versions, and of how deprecations are announced.

After 1.0.0, vocabulary additions are minor releases and fixes are
patches, per semver.

## After 1.0

### 1.2.0: spinner and popover (in progress)

1.1.0 added the Bootstrap, Flowbite and Radix Themes adapters. 1.2.0 finishes
the components left in the "Deliberately deferred" list of ADR-003. Both are
additive minor changes; nothing in the 1.0 surface changes.

| Item | Notes |
|------|-------|
| `ui-spinner` | A CSS-only busy indicator for places where `ui-loading` on a control does not fit. Intents and sizes, `role="status"` guidance, and a slow, non-rotating fallback under reduced motion. Defined in all six skins. Vocabulary v1.16. |
| `ui-popover` | A small anchored panel on the native Popover API (`popover` attribute), placed with `data-placement` like the tooltip and dropdown. It is the Escape-capable upgrade path that decision 11 promised. Defined in all six skins. Vocabulary v1.17. |

Exit: each component passes the per-component checklist from ADR-003 (axe,
reduced motion, `prefix: "uk"` smoke test, screenshots at 360, 768 and 1280 px
in light and dark); every adapter keeps `checkAdapter` at full coverage; the
Version Packages PR is merged. Publishing stays the owner's step.

## Risks

- **Menus (0.7.0)** are the likeliest to slip: they carry the most JS and
  accessibility risk. If so, ship 0.8.0's components first and move the
  menu to 0.8.x.
- **Tooltip** cannot fully meet WCAG 1.4.13 without JavaScript; the docs
  must say so rather than overstate.
- **Adapter-contract changes** after 0.9.0 would delay 1.0.0. Anything
  that needs an owner decision is raised as an issue in 0.5.0 or 0.6.0,
  not at the end.
