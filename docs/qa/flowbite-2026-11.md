# @uniskin/flowbite QA (November 2026)

Screenshots: `docs/qa/flowbite/`: an overview at 360, 768 and 1280 px in
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
| axe, light and dark | passes |
| Control boundaries and indicators >= 3:1 | passes |
| Visible focus ring >= 3:1 on every interactive element | passes |
| Error and hint text >= 4.5:1 | passes |
| Reduced motion | passes |
| Full suite, five skins | see the PR; all Flowbite specs pass |

## Where Flowbite's own values did not pass, and what the adapter does

| Flowbite | Problem | Adapter |
|----------|---------|---------|
| Control border `gray-300` | 1.5:1 on white, under WCAG 1.4.11's 3:1 | Controls use a 55% mix of the text colour; cards, tables and rules keep `gray-200` |
| Focus `ring-4 ring-blue-300` | about 1.7:1 | The same 4px footprint, solid, after a gap |
| Dark success fill `green-600` | 3.2:1 with white text | The light fill `green-700` (5.0:1) in both modes |
| Dark primary text `blue-400` on `gray-700` and `blue-900` | 3.9:1 | Dark text uses `blue-300` |
| Intent text on white | yellow is a fill only | 700 and 800 shades, and `yellow-800` for warning text |

Tailwind v4 emits the `--color-*` theme variables the adapter references with
its own (oklch) palette, which differs slightly from the v3 hex values most
Flowbite examples show. The fallbacks are the v4 values, and every check
above was measured against them.

Flowbite's JavaScript (dropdowns, modals, tooltips, the datepicker) is not part
of this adapter: Uniskin is CSS only, so the same consumer-provided behaviour
applies as for the other skins.
