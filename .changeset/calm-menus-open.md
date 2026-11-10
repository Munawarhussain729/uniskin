---
"uniskin": minor
"@uniskin/shadcn": minor
"@uniskin/daisyui": minor
---

Add `ui-dropdown`, `ui-menu`, `ui-menu-item`, `ui-menu-label` and `ui-menu-separator` (vocabulary v1.9): a CSS-only floating action menu and the same list un-floated. The dropdown hides its menu until `[open]` (a `<details>`), `aria-expanded="true"` on the trigger, `ui-active`, or `:popover-open`; closed items are not tabbable, and opening shows the panel at once so a script can focus the first item in the same tick. `data-placement` takes `bottom|top` with `start|end` (default `bottom-start`). Items tint on hover, `:focus-visible` (with a 2px ring) and `[data-highlighted]`; intents colour them (`ui-danger` for the destructive item), `ui-disabled` and `ui-active` are states, and `aria-checked="true"` shows a check mark that is kept out of the accessible name. The menu takes `ui-ghost`, `ui-soft`, `ui-sm` and `ui-lg`, with a 1px border so it stays visible on dark surfaces. Uniskin ships no JavaScript: the full keyboard contract (arrows, Home/End, typeahead, Escape returning focus, click-outside) is documented as the consumer's, and the playground has a short working handler. Hooks `--ui-menu-*` are in `docs/writing-adapters.md`. shadcn maps to `DropdownMenuContent` and daisyUI to its `menu` inside `dropdown-content`.
