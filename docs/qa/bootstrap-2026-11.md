# @uniskin/bootstrap QA (November 2026)

Screenshots: `docs/qa/bootstrap/`: an overview at 360, 768 and 1280 px in
light and dark, plus the menu, avatar and skeleton, breadcrumb and
pagination, slider and drawer sections. Checked by the shared specs, which
now run a fourth skin: unit tests, axe, contrast, keyboard, motion, and the
per-component specs (field, radio, switch, table, tooltip, toast, menu,
slider, drawer, nav, small), in light and dark.

## Coverage

`checkAdapter(adapter)` reports **297 of 297** combinations, no components
missing, no unknown slots; a unit test pins it. For comparison the shadcn and
daisyUI adapters define 108 and 138 of the 297 and fall back to the default
skin for the rest.

## What is asserted

| Check | Result |
|-------|--------|
| Every component and modifier defined | 297/297 |
| Unit tests (compiled rule shapes, prefix, dark selectors) | passes |
| axe, light and dark | passes, with the same documented "incomplete" entries as the other skins |
| Control boundaries and indicators >= 3:1 | passes |
| Visible focus ring >= 3:1 on every interactive element | passes |
| Error and hint text >= 4.5:1 | passes |
| Reduced motion | passes |
| Full suite, four skins | 733 passed |

## Where Bootstrap's own values did not pass, and what the adapter does

| Bootstrap | Problem | Adapter |
|-----------|---------|---------|
| Control border `#dee2e6` | 1.3:1 on white, under WCAG 1.4.11's 3:1 | Controls use a 55% mix of the text colour; cards, tables and rules keep `#dee2e6` |
| Focus ring: translucent glow | about 1.4:1 | Solid ring (surface-colour gap, then the ring colour) at the same 0.25rem size |
| Intent text on white | warning `#ffc107` is 1.6:1; danger `#dc3545` measured 4.34:1 on the field | Bootstrap's own darker shades: `#0a58ca`, `#5c636a`, `#146c43`, `#b02a37`, and the warning emphasis `#664d03` |
| Dark-mode primary ring on muted surfaces | under 3:1 on `#343a40` | Dark mode uses Bootstrap's own dark link blue `#6ea8fe` for the ring |
| Loading state with a static opacity | lowered text under 4.5:1 | The busy cursor and the default pulse signal it, with no static dimming |

The disabled state of checks, radios and switches is 50% opacity, like
`.form-check-input:disabled`; disabled buttons are 65%, like `.btn:disabled`.

## Not Bootstrap, by design

Bootstrap has no avatar, skeleton (it has `.placeholder`), slider track fill
or drawer markup with these names; those map onto the closest Bootstrap
idiom (`.rounded-circle`, `.placeholder-glow`, `.form-range`, `.offcanvas`).
Bootstrap's JavaScript behaviour (dropdowns, modals, tooltips) is not part of
this adapter: Uniskin is CSS only, so the same consumer-provided behaviour
applies as for the other skins.
