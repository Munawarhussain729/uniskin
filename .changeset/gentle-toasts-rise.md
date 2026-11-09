---
"uniskin": minor
"@uniskin/shadcn": minor
"@uniskin/daisyui": minor
---

Add `ui-toast` and `ui-toast-region` (vocabulary v1.8): a fixed, stacking region (`data-placement="top|bottom"` with `start|center|end`, default `bottom-end`, safe-area aware, never blocking the page) and the messages in it. The neutral toast is a surface card with a 1px edge; intents give a solid fill, `ui-soft` a tint and `ui-outline` an accent edge; `ui-sm`/`ui-lg` set the size and `ui-loading` pulses it. A toast fades and rises in when inserted (`@starting-style`) and appears instantly under reduced motion. Buttons inside a toast, such as a ghost dismiss, take the toast's text colour for their label and focus ring so they stay legible and focusable on any fill. Hooks `--ui-toast-*` are documented in `docs/writing-adapters.md`, together with the entering-elements convention; the docs spell out what the consumer provides (the live region, timers, dismissal). shadcn maps to `Toast` and daisyUI to the `alert` look inside its `toast` container.
