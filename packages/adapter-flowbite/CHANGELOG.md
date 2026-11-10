# @uniskin/flowbite

## 1.1.0

### Minor Changes

- aba18e6: Add `@uniskin/flowbite`, a Flowbite adapter that defines the whole vocabulary: `checkAdapter` reports 297 of 297 combinations, so nothing falls back to the default skin. Flowbite is Tailwind utilities, so its tokens are Tailwind's palette: every colour is a `var(--color-*)` with the palette value as the fallback, and overriding `--color-blue-700` in `@theme` re-themes the skin. Dark mode is Flowbite's `.dark` class (also `[data-theme="dark"]` and `prefers-color-scheme`). Where a Flowbite value misses WCAG AA the adapter adjusts it and says so in its README: form-control borders (3:1), a solid 4px focus ring, and darker intent text on light pages. `npx uniskin init --adapter flowbite` installs and wires it, and `adapter: "flowbite"` is treated as built in. The shared accessibility, contrast, keyboard and motion tests now run a fifth skin.
