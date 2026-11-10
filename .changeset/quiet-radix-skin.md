---
"uniskin": minor
"@uniskin/radix": minor
---

Add `@uniskin/radix`, a Radix Themes adapter that defines the whole vocabulary: `checkAdapter` reports 297 of 297 combinations, so nothing falls back to the default skin. Colours are Radix's 12-step scales, read as `var(--blue-9, #3e63dd)` with the Radix value as the fallback, so loading Radix Themes' stylesheet (or overriding a step) carries a custom scale through and leaving it out still renders the default Radix look. Steps keep their Radix roles (3 soft, 9 solid, 10 hover, 11 text, 12 high-contrast). Dark mode is Radix's `.dark` / `.dark-theme` (also `[data-theme="dark"]` and `prefers-color-scheme`). Where a Radix value misses WCAG AA the adapter adjusts it and says so in its README: solid green and red fills, soft success and warning text, text-field borders (3:1) and a solid focus ring. `npx uniskin init --adapter radix` installs and wires it, and `adapter: "radix"` is treated as built in. The shared accessibility, contrast, keyboard and motion tests now run a sixth skin.
