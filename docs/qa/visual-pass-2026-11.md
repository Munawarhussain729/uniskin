# Visual QA pass — 2026-11

Scope: `apps/playground` rendered against all three skins (default,
`@uniskin/shadcn`, `@uniskin/daisyui`), light and dark contexts
(`data-theme="dark"` for daisyUI; `.dark` class + `prefers-color-scheme`
emulation for default/shadcn), desktop 1280px and mobile 375px.
Screenshots in `docs/qa/img/` (Playwright, deviceScaleFactor 2).

Verified-working across all skins: every component emits and renders
(button intents × styles × sizes, input/textarea/select incl. intent
borders, checkbox incl. indeterminate, badge, alert, card + parts,
tabs incl. underline/boxed/pill/ghost, modal backdrop + box); hover
darkening, `:focus-visible` rings, `disabled`/`aria-disabled`,
`ui-loading` spinner, `aria-busy`, `aria-pressed`/`aria-selected`;
0 px horizontal overflow at 375 px for all skins.

## Defects

| Component | Skin | Issue | Severity | Screenshot |
|---|---|---|---|---|
| button (soft) | daisyui dark | `ui-soft` buttons unreadable in `data-theme="dark"`: neutral soft is black-on-black; intent softs are ~2.4:1 (text `--ui-c` on 12%-surface tint). Real daisyUI `btn-soft` stays legible in dark. | **critical** | [img](img/daisyui-buttons-dark.png) (soft row) |
| button (ghost) | daisyui dark | `ui-ghost` with no intent renders `--ui-c` = `--color-neutral` (near-black in dark) on transparent bg — invisible on dark surfaces (see "Cancel" inside dark card). | major | [img](img/daisyui-card-dark-zoom.png) |
| badge, alert (soft) | daisyui dark | Soft tints are `color-mix(--ui-c, white)` — stay light-mode pale in dark theme, inconsistent with daisyUI dark tokens. | moderate | [img](img/daisyui-badges-dark-zoom.png), [img](img/daisyui-alerts-dark-zoom.png) |
| button (soft) | shadcn | `ui-secondary ui-soft`: `--ui-c-soft-fg` derives from a light-gray secondary → light-gray text on near-white, ~3:1, below WCAG AA. | major | [img](img/shadcn-buttons.png) (soft row) |
| all | shadcn, default | No dark theme: `.dark` class / `prefers-color-scheme` produce zero change — tokens only emitted on `:root`. shadcn convention is a `.dark` var block; dark-mode users get a light UI. | major | [img](img/shadcn-buttons-dark.png) |
| tabs | daisyui dark | Inactive `ui-tab` text is unreadable on a light page in dark theme (text maps to light base-content). Likely correct on a real dark surface — verify once a dark page exists; neutral selected-tab text may still fail. | minor | [img](img/daisyui-tabs-dark-zoom.png) |
| button (danger) | shadcn | `ui-danger` white-on-`#ef4444` = 3.6:1, below AA 4.5:1. **Note: this is shadcn's own `--destructive` value — upstream has the same ratio.** Decide whether to inherit upstream or fix. | minor | [img](img/shadcn-buttons.png) |
| input (ghost) | daisyui dark | Ghost input placeholder/label invisible — light `base-content` text on transparent bg over a light page. Artifact of dark-theme-on-light-page; correct on real dark surfaces. | informational | [img](img/daisyui-inputs-dark-zoom.png) |

## Comparison notes vs upstream

- **shadcn**: near-black primary, gray secondary, neutral outline/ghost,
  `h-8/9/10` sizes, ring focus, pill tabs — faithful. Intents `success`
  and `warning` fall back to Uniskin defaults (shadcn has no such
  variants — documented). Reference: [img](img/ref-shadcn-button.png).
- **daisyUI**: indigo/pink/teal/orange/red palette, `--radius-field`,
  semibold, press-scale — faithful to `btn`. Reference:
  [img](img/ref-daisyui-button.png), [img](img/ref-daisyui-input.png).
- **default**: coherent neutral design-token skin; all states present.

## Methodology caveats

- Dark shots for daisyUI run `data-theme="dark"` on the playground's
  fixed light page — the *component* colours are what matter; neutral
  elements whose text darkens are doubly affected (real defect, not an
  artifact, where they sit on dark component surfaces).
- Section screenshots are 1280 px; thin 1 px borders are best judged in
  the `*-zoom.png` crops.

## Coverage matrix

| Section | default | shadcn | daisyui | dark shot exists |
|---|---|---|---|---|
| buttons (all intents/styles/sizes/states) | ✅ | ✅ | ✅ | all three |
| input/textarea/select/checkbox | ✅ | ✅ | ✅ | all three |
| badge/alert | ✅ | ✅ | ✅ | all three |
| card | ✅ | ✅ | ✅ | all three |
| tabs | ✅ | ✅ | ✅ | all three |
| modal | ✅ | ✅ | ✅ | all three |
| hover / focus-visible | ✅ | ✅ | ✅ | light |
| 375 px layout | ✅ | ✅ | ✅ | — |
