# Roadmap and release plan to 1.0.0

Status: proposed. The scope of each release is a plan, not a promise; it
is reviewed when the previous release ships.

Current release: **0.4.0** (vocabulary v1.4). The component order comes
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

## Releases

### 0.5.0: disclosure and feedback

Components that are native HTML, need no JavaScript, and finish the
"common app UI" basics.

| Item | Notes |
|------|-------|
| `ui-accordion` | Native `<details>`/`<summary>`; style the marker, `[open]`, focus ring; height/opacity animation only with a reduced-motion override. |
| `ui-progress` | Native `<progress>`; intents and sizes; determinate and `:indeterminate`. |
| Intent pins adopted | `ui-badge`, `ui-alert` and `ui-card` read `--ui-c-border` and `--ui-c-soft-hover` (follow-up of the intent-pin work in 0.4.0). |
| Housekeeping | Enable "Allow GitHub Actions to create and approve pull requests" so the Version Packages PR opens itself; confirm the tag-triggered release workflow runs; connect the site's Vercel project to the repo for automatic deploys. |

Exit: both components pass the per-component checklist; `vocabulary.md`
and the coverage matrix are updated; vocabulary label becomes v1.5.

### 0.6.0: overlays

| Item | Notes |
|------|-------|
| `ui-tooltip` | CSS hover/focus-within. Sets the `data-placement` and `@starting-style` conventions. Documents the WCAG 1.4.13 Escape limitation without JavaScript and the Popover API upgrade path (decision 11). |
| `ui-toast` + `ui-toast-region` | CSS for placement and look; the live region, timers and dismissal stay with the consumer and are documented. |

Exit: the placement convention is written in `writing-adapters.md`; both
components pass axe and the reduced-motion checks; label v1.6.

### 0.7.0: menus

| Item | Notes |
|------|-------|
| `ui-dropdown`, `ui-menu`, `ui-menu-item` | Largest accessibility surface. Needs a full keyboard contract in `vocabulary.md` (arrow keys, Home/End, Escape, focus return, typeahead expectations), and honours `data-highlighted`/`data-state` for the menu only (decision 7). |
| Decision | Whether to ship a small optional JavaScript helper or stay CSS-only and point to headless libraries. Decide before implementation; the 1.0 promise of "CSS only" must stay true for the core package. |

Exit: keyboard e2e (arrows, Home/End, Escape, focus return) in all six
skin and mode combinations; label v1.7.

### 0.8.0: the remaining small components

Pulled from the deferred list in ADR-003, ordered by demand when the
release starts: `ui-avatar`, `ui-breadcrumb`, `ui-pagination`,
`ui-skeleton`, `ui-separator`, `ui-slider` (native `<input type=range>`),
and `ui-drawer` (evaluated first as a `ui-modal` placement).
`ui-combobox`/`ui-listbox` stay out of scope; the name `ui-listbox` stays
reserved (decision 9). If the list is too long, split it into 0.8.0 and
0.8.1.

Exit: each item passes the checklist or is explicitly dropped in this
file with a reason.

### 0.9.0: release candidate

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

### 1.0.0

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

## Risks

- **Menus (0.7.0)** are the likeliest to slip: they carry the most JS and
  accessibility risk. If so, ship 0.8.0's components first and move the
  menu to 0.8.x.
- **Tooltip** cannot fully meet WCAG 1.4.13 without JavaScript; the docs
  must say so rather than overstate.
- **Adapter-contract changes** after 0.9.0 would delay 1.0.0. Anything
  that needs an owner decision is raised as an issue in 0.5.0 or 0.6.0,
  not at the end.
