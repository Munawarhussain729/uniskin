# ui-switch contrast notes (wave 1, component 3)

Measured by `apps/playground/e2e/switch.spec.ts` in all three skins, light and
dark (WCAG 1.4.11, non-text >= 3:1). Screenshots of every skin and mode are in
[`docs/qa/switch/`](switch/); regenerate them with
`apps/playground/scripts/qa-switch-shots.mjs`.

- Off track vs page surface: asserted >= 3:1 in all six combinations. The
  track is a grey mixed from the page text colour (`--ui-switch-track`
  default), so the shadcn adapter does not use upstream's very light `--input`
  (an a11y delta from shadcn) and the daisyUI adapter does not use its 20%
  `base-content` track.
- Off thumb vs off track: asserted >= 3:1 in all six combinations.
- On state, default `ui-primary` switch: thumb vs track and track vs surface
  asserted >= 3:1 in all six combinations.
- Focus ring: covered by the existing keyboard spec (every switch is reached
  with Tab) plus a dedicated ring >= 3:1 assertion.
- Intent colours below 3:1 on the surface come from the upstream palettes,
  not from the component, so the extra `ui-success` / `ui-danger` assertions
  are skipped there (shadcn dark, daisyUI light), as for `ui-radio`.
- Known palette limit: shadcn light `ui-secondary` (`--secondary` is
  `210 40% 96%`, almost the page colour) renders an on-track that is not
  distinguishable from the surface (visibly far below 3:1 in the screenshot;
  not measured separately). It is not asserted;
  consumers should use another intent for a switch on a light shadcn page.
  Fixing it belongs with the palette contrast work, not this component.
- Disabled switches are exempt from the contrast requirement and render at
  50% opacity.
