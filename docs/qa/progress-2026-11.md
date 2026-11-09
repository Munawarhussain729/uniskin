# ui-progress QA (November 2026)

Screenshots: `docs/qa/progress/`, three skins by light and dark by 360,
768 and 1280 px. Checked by `apps/playground/e2e/progress.spec.ts` in all
six skin and mode combinations, plus the shared axe and reduced-motion
specs.

## What is asserted

| Check | Result |
|-------|--------|
| Bar against track, every intent, solid and outline | >= 3:1 (WCAG 1.4.11) in all six combinations |
| `ui-ghost` (no track fill): bar against the page | >= 3:1 |
| Sizes change the height (sm < md < lg) | passes |
| Indeterminate progress animates (`:indeterminate`) | passes |
| Reduced motion: the slide stops; a dim full-width bar remains | passes (shared motion spec) |
| axe: every playground `<progress>` has an accessible name | no new allow-list entries |
| Role and value exposed (`progressbar`, `value="60"`) | passes |

## Findings

- **shadcn `ui-secondary`.** shadcn's secondary is a near-white surface
  grey with no progress variant upstream, so the bar measured 1.08:1
  against its track (1.32:1 in dark). The progress bar for `ui-secondary`
  uses `--secondary-foreground` instead. Scoped to `ui-progress`; no
  other component changes.
- **daisyUI dark primary.** daisyUI's dark primary against its upstream
  20% `base-content` track was 1.99:1. A 10% track plus a 15% share of
  `base-content` in the bar clears 3:1 in dark. The cost is that light
  intents are slightly deeper than daisyUI's own `progress-*` colours;
  the track is fainter than upstream. Recorded as a deliberate deviation.
- **Indeterminate.** Chromium paints nothing for an indeterminate
  `<progress>` once the native appearance is removed, so the bar is drawn
  as an animated gradient on the element. Under reduced motion it becomes
  a dim, full-width bar, which signals "working" without implying a
  percentage.
