# @uniskin/radix

## 1.2.0

### Minor Changes

- f1e85fe: Add `ui-spinner` (vocabulary v1.16): a CSS-only busy indicator, a ring with a rotating arc. The five intents colour the arc, `ui-sm` and `ui-lg` set the size, and `--ui-spinner-size`, `--ui-spinner-width`, `--ui-spinner-color` and `--ui-spinner-track` are the hooks. Under `prefers-reduced-motion` the rotation stops and the ring stays as a static mark. Give it `role="status"` and an accessible name. Every built-in adapter defines it, so `checkAdapter` reports full coverage for the Bootstrap, Flowbite and Radix Themes adapters (305 of 305).

## 1.1.0

### Minor Changes

- c57192c: Add `@uniskin/radix`, a Radix Themes adapter that defines the whole vocabulary: `checkAdapter` reports 297 of 297 combinations, so nothing falls back to the default skin. Colours are Radix's 12-step scales, read as `var(--blue-9, #3e63dd)` with the Radix value as the fallback, so loading Radix Themes' stylesheet (or overriding a step) carries a custom scale through and leaving it out still renders the default Radix look. Steps keep their Radix roles (3 soft, 9 solid, 10 hover, 11 text, 12 high-contrast). Dark mode is Radix's `.dark` / `.dark-theme` (also `[data-theme="dark"]` and `prefers-color-scheme`). Where a Radix value misses WCAG AA the adapter adjusts it and says so in its README: solid green and red fills, soft success and warning text, text-field borders (3:1) and a solid focus ring. `npx uniskin init --adapter radix` installs and wires it, and `adapter: "radix"` is treated as built in. The shared accessibility, contrast, keyboard and motion tests now run a sixth skin.
