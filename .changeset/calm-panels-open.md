---
"uniskin": minor
"@uniskin/shadcn": minor
"@uniskin/daisyui": minor
---

Add `ui-accordion` and its parts `ui-accordion-item`, `ui-accordion-trigger` and `ui-accordion-panel` (vocabulary v1.5): a disclosure list built on native `<details>`/`<summary>`, so open/close, Enter/Space and the expanded state need no JavaScript. Intents tint the open trigger, `ui-outline`, `ui-ghost` and `ui-soft` change the list style, `ui-sm`/`ui-lg` set density, and the chevron and the panel reveal are CSS only (the reveal and transitions stop under reduced motion). Component-scoped hooks `--ui-accordion-*` are documented in `docs/writing-adapters.md`. shadcn maps to `Accordion` (borderless, `border-b` per item, hover underline) and daisyUI to `collapse`.
