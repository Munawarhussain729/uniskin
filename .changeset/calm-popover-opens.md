---
"uniskin": minor
"@uniskin/shadcn": minor
"@uniskin/daisyui": minor
"@uniskin/bootstrap": minor
"@uniskin/flowbite": minor
"@uniskin/radix": minor
---

Add `ui-popover` (vocabulary v1.17): a small anchored panel on the native Popover API. Put `popover` on the element and point a button at it with `popovertarget`; the browser supplies the top layer, light dismiss, Escape and focus return. `data-placement` (`bottom-start`, `bottom-end`, `top-start`, `top-end`) uses CSS anchor positioning with flip fallbacks, and a browser without it shows the panel centred. `ui-sm` and `ui-lg` set the size, and `--ui-popover-w`, `--ui-popover-max-w`, `--ui-popover-pad`, `--ui-popover-gap` and `--ui-popover-shadow` are the hooks. The fade is removed under `prefers-reduced-motion`. Every built-in adapter defines it, so `checkAdapter` reports full coverage for the Bootstrap, Flowbite and Radix Themes adapters (308 of 308).
