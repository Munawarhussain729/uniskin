---
"uniskin": minor
"@uniskin/shadcn": minor
"@uniskin/daisyui": minor
---

Add `ui-tooltip` and `ui-tooltip-anchor` (vocabulary v1.7): a CSS-only text bubble shown on hover and keyboard focus, which stays visible while the pointer is on it. Intents fill the bubble, `ui-soft` and `ui-outline` restyle it, `ui-sm`/`ui-lg` set the size, `ui-active` forces it visible, and `data-placement="top|bottom|start|end"` places it (`start` and `end` follow the writing direction). Component-scoped hooks `--ui-tooltip-*` are documented in `docs/writing-adapters.md`, along with the `data-placement` convention that later components share. The documentation states plainly that Escape cannot dismiss a CSS-only tooltip (WCAG 1.4.13) and that there is no collision handling. shadcn maps to `TooltipContent` and daisyUI to `tooltip-content`.
