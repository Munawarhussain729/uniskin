# Branch protection for `main`

Recommended GitHub settings — configure under
**Settings → Rules → Rulesets → New branch ruleset** (or
**Settings → Branches → Add rule** for classic protection). Target
branch: `main`.

| Setting | Value |
|---------|-------|
| Restrict creations / updates / deletions | default ruleset behaviour |
| **Require a pull request before merging** | on — recommended: ≥1 approval, dismiss stale approvals on new pushes |
| **Require status checks to pass** | on — add the checks listed below |
| Require branches to be up to date before merging | on (recommended) |
| **Block force pushes** | on |
| Require linear history | optional, matches the squash/merge style |

## Required status checks

Check names are `<job> (<matrix value>)` where the job uses a matrix.
Require:

- `test (20)`
- `test (22)`
- `install-check`
- `tailwind-compat (4.3.3)` — measured Tailwind floor
- `tailwind-compat (4.3.5)` — the pinned Tailwind version

Do **not** require `tailwind-compat (latest)` — that leg is
`continue-on-error` by design so a breaking Tailwind release surfaces as
a visible-but-non-blocking annotation instead of freezing every PR.

## Notes

- Status checks only appear in the picker after a workflow has produced
  them once — open a throwaway PR first if a check isn't listed.
- The "Version Packages" PR opened by `changesets/action` is authored by
  `github-actions[bot]`; with PR-required protection it still needs a
  human review/merge, which is what you want.
