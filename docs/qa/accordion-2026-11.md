# ui-accordion QA (November 2026)

Screenshots: `docs/qa/accordion/`, three skins by light and dark by 360,
768 and 1280 px. Checked by the Playwright suite in
`apps/playground/e2e/accordion.spec.ts` (all six skin and mode
combinations) plus the shared axe, keyboard and reduced-motion specs.

## What is asserted

| Check | Result |
|-------|--------|
| Trigger and panel text, closed and open | >= 4.5:1 in all six combinations |
| Open trigger under every intent and style in the playground | >= 4.5:1 |
| Open panel inside `ui-soft` lists | >= 4.5:1 |
| Enter and Space toggle the native `<details>` | passes |
| Chevron drawn and rotates when open; native marker hidden | passes |
| Keyboard: every `<summary>` is reached by Tab with a focus ring >= 3:1 | passes (shared keyboard spec) |
| Reduced motion: panel reveal and trigger/chevron transitions off | passes (shared motion spec) |
| axe on the playground | no new allow-list entries |

## Findings

- **Open-trigger tint.** Using the intent's `--ui-c-text` alone put the
  open trigger at 3.8:1 for `ui-primary` in daisyUI dark (daisyUI's own
  dark primary; see `a11y-2026-11.md`, "upstream exceptions"). The open
  trigger mixes 25% of the surface text colour into the tint, which keeps
  the intent colour and clears 4.5:1 in every skin. The other components
  are unchanged.
- **Soft list.** Tinting only the open trigger left the panel text hard
  against the band's edge, so the whole open item takes the soft tint.
- **Focus ring on a tint.** With the whole open item tinted, the default
  ring colour measured 2.98:1 on `ui-success ui-soft` (default skin,
  light), just under the 3:1 the keyboard spec requires. In `ui-soft`
  lists the open trigger's ring now uses the tint's own foreground
  (`--ui-c-soft-fg`), which is chosen to contrast with it.
- **daisyUI corners.** Rounding every item made the dividers between rows
  curve at the edges; rounded-box corners apply to `ui-outline` (separate
  boxes) only.
- **Dividers.** The 1px dividers between items are low contrast (about
  1.3:1), like the table row dividers and the upstream shadcn and daisyUI
  separators. They are decorative: each item is identified by its text and
  chevron, which are >= 4.5:1 and >= 3:1.
- **Alert cascade (found while adding this).** Adding the accordion rules
  changed Tailwind's emission order and exposed a latent bug in the alert
  adapters (a soft success alert at 2.5:1). Fixed separately in the alert
  intent change; the accordion has no same-specificity paint conflicts.
