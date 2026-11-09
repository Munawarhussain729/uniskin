# Palette contrast fixes (2026-11)

Follow-up to `radio-contrast-2026-11.md`. Targets: >= 3:1 for non-text UI
boundaries and checked indicators (WCAG 1.4.11), >= 4.5:1 for text.

## Method

Every intent (neutral, primary, secondary, success, warning, danger) x style
(solid, outline, ghost, soft) x skin (default, shadcn, daisyUI) x mode
(light, dark) was rendered for button, badge, alert, checkbox, radio (checked
and unchecked), input, select and textarea in the playground build. Colours
are the browser's resolved values (canvas readback, so `oklch()` and
`color-mix()` are exact), composited over the real ancestor backdrop, with the
WCAG relative-luminance ratio. The "circle" metric is the better of
border-vs-surface and fill-vs-surface; "dot" is the checked dot vs its fill.
Before = `origin/main`, after = this change. Screenshots of the same grid are
in `docs/qa/palette-contrast/` (`before-*.png`, `after-*.png`).

## What changed

1. **Control boundaries use the intent's text colour** (`--ui-c-text`, the
   existing hook) instead of the raw fill (`--ui-c`) for the outline/soft
   border, the checked border, the outline check mark / radio dot, and the
   `ui-input|select|textarea` intent border (`--ui-field-c`) in the default
   theme. Where an adapter pins `--ui-<intent>-text` (daisyUI success,
   secondary, danger) or the default warning text mix applies, the boundary
   becomes darker; where `-text` equals the fill (default and shadcn primary,
   success, danger) nothing moves. Hover and fills are untouched.
2. **shadcn dark `--ui-danger`** (`hsl(0 62.8% 30.6%)`, about 1.8:1 on the page)
   is lifted to `hsl(0 62.8% 48%)` for the `ui-danger` hook only; shadcn's
   `--destructive` variable is unchanged. The light label on the solid fill
   stays above 4.5:1.
3. **daisyUI neutral control border** for `ui-input|select|textarea` and
   `ui-checkbox` was 20% `base-content` (1.5 to 1.9:1); it now uses the same
   mix the default radio uses (`--ui-border` 55% into `--ui-surface-fg`).
4. **shadcn radio dot** uses `--ui-c-text` (was `--ui-c`), fixing the warning
   dot (2.0:1).

Hook contract unchanged: `--ui-<intent>-text`, `-soft`, `-soft-fg` keep their
meaning; no tokens were added or removed.

## Before / after (changed rows, ghost excluded)

Checkbox values equal the radio values in every row and are omitted. Rows
where nothing changed are omitted; every row below passes after.

| Skin | Mode | Component | Intent / style | Metric | Before | After | >= 3:1 |
|---|---|---|---|---|---|---|---|
| default | light | radio | neutral outline | circle/dot | 14.58 | 16.48 | pass |
| default | light | radio | warning solid | circle/dot | 2.03 | 5.18 | pass |
| default | light | radio | warning outline | circle/dot | 2.03 | 5.18 | pass |
| default | light | radio | warning soft | circle/dot | 2.03 | 5.18 | pass |
| default | light | input | warning | field border | 2.03 | 5.18 | pass |
| default | light | select | warning | field border | 2.03 | 5.18 | pass |
| default | light | textarea | warning | field border | 2.03 | 5.18 | pass |
| default | dark | radio | neutral solid | circle/dot | 14.05 | 14.31 | pass |
| default | dark | radio | neutral outline | circle/dot | 14.05 | 15.32 | pass |
| default | dark | radio | warning solid | circle/dot | 10.04 | 10.24 | pass |
| default | dark | radio | warning outline | circle/dot | 10.04 | 12.31 | pass |
| default | dark | input | warning | field border | 10.04 | 12.31 | pass |
| default | dark | select | warning | field border | 10.04 | 12.31 | pass |
| default | dark | textarea | warning | field border | 10.04 | 12.31 | pass |
| shadcn | light | radio | neutral solid | circle/dot | 17.85 | 20.01 | pass |
| shadcn | light | radio | neutral outline | circle/dot | 17.85 | 20.01 | pass |
| shadcn | light | radio | warning solid | circle/dot | 2.03 | 6.27 | pass |
| shadcn | light | radio | warning outline | circle/dot | 2.03 | 6.27 | pass |
| shadcn | light | radio | warning soft | circle/dot | 2.03 | 6.27 | pass |
| shadcn | light | input | warning | field border | 2.03 | 6.27 | pass |
| shadcn | light | select | warning | field border | 2.03 | 6.27 | pass |
| shadcn | light | textarea | warning | field border | 2.03 | 6.27 | pass |
| shadcn | dark | radio | warning solid | circle/dot | 11.31 | 14.54 | pass |
| shadcn | dark | radio | warning outline | circle/dot | 11.31 | 14.54 | pass |
| shadcn | dark | radio | danger solid | circle/dot | 2.00 | 3.68 | pass |
| shadcn | dark | radio | danger outline | circle/dot | 2.00 | 3.68 | pass |
| shadcn | dark | radio | danger soft | circle/dot | 2.00 | 3.68 | pass |
| shadcn | dark | input | warning | field border | 11.31 | 14.54 | pass |
| shadcn | dark | select | warning | field border | 11.31 | 14.54 | pass |
| shadcn | dark | textarea | warning | field border | 11.31 | 14.54 | pass |
| shadcn | dark | input | danger | field border | 2.00 | 3.68 | pass |
| shadcn | dark | select | danger | field border | 2.00 | 3.68 | pass |
| shadcn | dark | textarea | danger | field border | 2.00 | 3.68 | pass |
| daisyui | light | radio | neutral outline | circle/dot | 19.90 | 17.72 | pass |
| daisyui | light | radio | secondary outline | circle/dot | 3.67 | 5.12 | pass |
| daisyui | light | radio | secondary soft | circle/dot | 3.67 | 4.35 | pass |
| daisyui | light | radio | success solid | circle/dot | 1.96 | 5.12 | pass |
| daisyui | light | radio | success outline | circle/dot | 1.96 | 5.40 | pass |
| daisyui | light | radio | success soft | circle/dot | 1.96 | 4.89 | pass |
| daisyui | light | radio | warning solid | circle/dot | 1.76 | 5.01 | pass |
| daisyui | light | radio | warning outline | circle/dot | 1.76 | 5.01 | pass |
| daisyui | light | radio | warning soft | circle/dot | 1.76 | 5.01 | pass |
| daisyui | light | radio | danger solid | circle/dot | 2.86 | 5.01 | pass |
| daisyui | light | radio | danger outline | circle/dot | 2.86 | 5.01 | pass |
| daisyui | light | radio | danger soft | circle/dot | 2.86 | 4.47 | pass |
| daisyui | light | input | neutral | field border | 1.53 | 3.68 | pass |
| daisyui | light | select | neutral | field border | 1.53 | 3.68 | pass |
| daisyui | light | textarea | neutral | field border | 1.53 | 3.68 | pass |
| daisyui | light | input | secondary | field border | 3.67 | 5.12 | pass |
| daisyui | light | select | secondary | field border | 3.67 | 5.12 | pass |
| daisyui | light | textarea | secondary | field border | 3.67 | 5.12 | pass |
| daisyui | light | input | success | field border | 1.96 | 5.40 | pass |
| daisyui | light | select | success | field border | 1.96 | 5.40 | pass |
| daisyui | light | textarea | success | field border | 1.96 | 5.40 | pass |
| daisyui | light | input | warning | field border | 1.76 | 5.01 | pass |
| daisyui | light | select | warning | field border | 1.76 | 5.01 | pass |
| daisyui | light | textarea | warning | field border | 1.76 | 5.01 | pass |
| daisyui | light | input | danger | field border | 2.86 | 5.01 | pass |
| daisyui | light | select | danger | field border | 2.86 | 5.01 | pass |
| daisyui | light | textarea | danger | field border | 2.86 | 5.01 | pass |
| daisyui | dark | radio | neutral solid | circle/dot | 1.26 | 14.75 | pass |
| daisyui | dark | radio | neutral outline | circle/dot | 1.26 | 14.75 | pass |
| daisyui | dark | radio | neutral soft | circle/dot | 1.26 | 14.75 | pass |
| daisyui | dark | radio | secondary outline | circle/dot | 4.32 | 5.72 | pass |
| daisyui | dark | radio | secondary soft | circle/dot | 4.32 | 4.83 | pass |
| daisyui | dark | radio | success outline | circle/dot | 8.08 | 10.75 | pass |
| daisyui | dark | radio | warning outline | circle/dot | 8.98 | 11.37 | pass |
| daisyui | dark | radio | danger outline | circle/dot | 5.53 | 7.62 | pass |
| daisyui | dark | radio | danger soft | circle/dot | 5.53 | 6.43 | pass |
| daisyui | dark | input | neutral | field border | 1.87 | 3.35 | pass |
| daisyui | dark | select | neutral | field border | 1.87 | 3.35 | pass |
| daisyui | dark | textarea | neutral | field border | 1.87 | 3.35 | pass |
| daisyui | dark | input | secondary | field border | 4.32 | 5.72 | pass |
| daisyui | dark | select | secondary | field border | 4.32 | 5.72 | pass |
| daisyui | dark | textarea | secondary | field border | 4.32 | 5.72 | pass |
| daisyui | dark | input | success | field border | 8.08 | 10.75 | pass |
| daisyui | dark | select | success | field border | 8.08 | 10.75 | pass |
| daisyui | dark | textarea | success | field border | 8.08 | 10.75 | pass |
| daisyui | dark | input | warning | field border | 8.98 | 11.37 | pass |
| daisyui | dark | select | warning | field border | 8.98 | 11.37 | pass |
| daisyui | dark | textarea | warning | field border | 8.98 | 11.37 | pass |
| daisyui | dark | input | danger | field border | 5.53 | 7.62 | pass |
| daisyui | dark | select | danger | field border | 5.53 | 7.62 | pass |
| daisyui | dark | textarea | danger | field border | 5.53 | 7.62 | pass |


## Enforced now

- `e2e/radio.spec.ts`: the `KNOWN_PALETTE_LIMITS` skip is removed;
  `ui-success ui-soft` and `ui-danger ui-outline` are asserted in all six
  skin/mode combinations.
- New `e2e/contrast.spec.ts`: checkbox and radio (checked, plus unchecked
  radio) for primary/success/warning/danger x solid/outline/soft, and
  input/textarea intent borders, >= 3:1 in all six combinations; the daisyUI
  neutral input and checkbox border too.

## daisyUI radio border workaround

Kept, not churned. daisyUI's native radio border (20% `base-content`) measures
1.5 to 1.8:1, so the adapter still inherits the default theme's stronger
border. The checkbox and fields now use the same stronger mix explicitly.

## Not changed: needs an owner design decision

These stay below target and are all either upstream palette values or an
intentional style; fixing them visibly changes a skin's identity.

- **shadcn `ui-danger` solid (light)**: white on `hsl(0 84.2% 60.2%)` is 3.60:1
  text (button, badge, solid alert). Fix would be a darker destructive in light
  (about `hsl(0 72% 51%)` gives >= 4.5:1). Remains on the axe allow-list.
- **shadcn `ui-secondary`** (near-white tint): checkbox/radio/field boundaries
  1.1 to 1.4:1 in both modes.
- **Neutral field border** (`ui-input|select|textarea` without intent):
  default 1.39 (light) / 1.51 (dark), shadcn 1.23 / 1.37 (`--input`); daisyUI
  was fixed above. Fields have no other boundary cue
  besides the fill; a stronger default border changes the whole look.
- **`ui-ghost` checkbox/radio** (all skins): no boundary by design (tinted
  fill only), 1.06 to 1.4:1.
- **daisyUI fills with their own content colour** (text): light secondary solid
  3.04, solid alerts success/warning/danger 2.29 to 3.37, soft secondary/danger
  4.35 to 4.47; dark primary solid 4.13, primary outline/ghost text 3.40,
  primary soft 3.02, secondary solid 3.04. These mirror upstream daisyUI and
  stay on the axe allow-list (`e2e/axe.spec.ts`).
- **daisyUI warning (and default warning) solid/outline** fills are unchanged:
  only the boundary and indicator switched to the darker text mix, so the brand
  yellow fill remains.
- **Visual note**: daisyUI light warning/success outline boundaries and
  outline check marks are now a darker olive/green than the fill; the fill
  colour of solid controls is unchanged.

## Verification

Measured by the sweep above and enforced by `pnpm test` (playground vitest +
Playwright axe, keyboard, radio, contrast, motion; site e2e). Screenshots in
`docs/qa/palette-contrast/` were opened and inspected for shadcn dark and
daisyUI light (before and after); the other four skin/mode pairs were
captured but not individually reviewed.
