# @uniskin/shadcn

## 0.2.0

### Minor Changes

- 14238bc: Dark mode and contrast. Adapters can declare `darkTokens` (emitted under `.dark, [data-theme="dark"]` and `prefers-color-scheme: dark`; new `dark: "media" | "class" | false` plugin option). The default and shadcn skins now ship dark palettes. Soft tints derive from the surface instead of white/black, a new `--ui-c-text` keeps neutral ghost/outline text readable on dark surfaces, and adapters can pin soft colours with `--ui-<intent>-soft` / `-soft-fg` (used by shadcn for `ui-secondary ui-soft`). daisyUI tokens now re-resolve on every `[data-theme]` element.

### Patch Changes

- 6fa090e: Accessibility fixes from the November audit. The default light palette's success and danger fills are darker (white text now at least 4.9:1) and warning outline/ghost text is darkened. Text fields focus with a solid 2px ring-colour outline, shadcn pressed outline buttons keep their focus ring, and daisyUI rings and bright-intent text use darkened colours. Every `animation` now has a `prefers-reduced-motion: reduce` override that stops it. New adapter hook `--ui-<intent>-text` pins an intent's text colour.
- d22d630: Raise the `tailwindcss` peer floor to `^4.3.3` — the oldest 4.x verified by the new `tailwind-compat` CI matrix (older releases serialize plugin utilities differently, and 4.0.0 does not forward the `@plugin` source location used to resolve relative adapter paths). Also throw a clear error when Tailwind's `@plugin` `this.src` context has an unexpected shape; a missing context still falls back to `process.cwd()` adapter resolution as before.

## 0.1.0

### Minor Changes

- b445b98: Initial 0.1.0 release: full v1 `ui-*` vocabulary (components, intents, styles, sizes, states) in the default theme, shadcn and daisyUI adapters.

### Patch Changes

- Updated dependencies [b445b98]
  - uniskin@0.1.0
