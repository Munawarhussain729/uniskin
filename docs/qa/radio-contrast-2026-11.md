# ui-radio contrast notes (wave 1)

Measured by `apps/playground/e2e/radio.spec.ts` in all three skins, light and
dark (WCAG 1.4.11, non-text >= 3:1).

- Unchecked border vs page surface: asserted >= 3:1 in all six combinations.
  The daisyUI adapter deliberately does not copy daisyUI's 20% `base-content`
  border (about 1.5:1 to 1.8:1); it uses the default theme's stronger border.
- Checked default (`ui-primary`) radio: dot vs fill and circle vs surface
  asserted >= 3:1 in all six combinations.
- Intent colours below 3:1 on the surface come from the upstream palettes,
  not from the component, so the extra `ui-success ui-soft` and
  `ui-danger ui-outline` assertions are skipped there:
  - shadcn dark: `--destructive` (dark red) outline radio, about 1.8:1.
  - daisyUI light: success soft border, about 1.9:1.
  Consumers needing these combinations should pick a stronger intent colour.

Update: the skipped combinations above were fixed in
`palette-contrast-2026-11.md` and are now asserted in the e2e suite.
