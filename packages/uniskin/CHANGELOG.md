# uniskin

## 0.3.0

### Minor Changes

- c25280a: Stop printing the long "adapter does not define" warning for the built-in adapters (`default`, `shadcn`, `daisyui`), whose fallbacks to the default style are intentional. Third-party adapters now get a single summary line. Add a `debug` plugin option (or `UNISKIN_DEBUG=1`) that prints the full detailed list. Generated CSS is unchanged.
- b6f4ef4: Add `ui-field` with `ui-field-label`, `ui-field-hint` and `ui-field-error` (vocabulary v1.3): a label, control, help text and error stack for accessible forms in the default theme and both adapters, plus `[aria-invalid="true"]` styling on `ui-input`, `ui-textarea` and `ui-select` (danger border, in every style). Error text meets 4.5:1 and the invalid border 3:1 in light and dark; layout uses logical properties for right-to-left. Per-component hooks: `--ui-field-gap`, `--ui-field-label`, `--ui-field-hint`, `--ui-field-error`.
- 2360820: Add `ui-radio` (vocabulary v1.1): a native `<input type="radio">` restyled with the same intents, styles, sizes and states as `ui-checkbox`, in the default theme and both adapters, with dark mode and reduced-motion support. `ui-checkbox` and `ui-radio` now also render `<button role="checkbox|radio" aria-checked>` from headless libraries, and `ui-select` drops its chevron on `<select multiple>` and `<select size="N">`. Existing class names and rules are unchanged for current markup.
- 708b640: Add `ui-switch` (vocabulary v1.2): an on/off toggle drawn on a native `<input type="checkbox" role="switch">` or a headless `<button role="switch" aria-checked>`, with the same intents, styles, sizes and states as `ui-checkbox`, in the default theme and both adapters. The off track and thumb keep 3:1 contrast against the page surface in light and dark, the thumb travels with logical properties so it flips in right-to-left layouts, and transitions respect `prefers-reduced-motion` and `forced-colors`. Per-component hooks: `--ui-switch-size`, `--ui-switch-track`, `--ui-switch-thumb`, `--ui-switch-pad`.

### Patch Changes

- b2250c2: Raise non-text contrast of form-control boundaries and checked indicators to at least 3:1: checkbox, radio and field intent borders now use the intent's text colour (`--ui-<intent>-text`), the shadcn dark `ui-danger` colour is lighter, and the daisyUI neutral field and checkbox border is stronger. Fills and the `--ui-<intent>-text` / `-soft` / `-soft-fg` hooks keep their meaning.

## 0.2.0

### Minor Changes

- 6fa090e: Accessibility fixes from the November audit. The default light palette's success and danger fills are darker (white text now at least 4.9:1) and warning outline/ghost text is darkened. Text fields focus with a solid 2px ring-colour outline, shadcn pressed outline buttons keep their focus ring, and daisyUI rings and bright-intent text use darkened colours. Every `animation` now has a `prefers-reduced-motion: reduce` override that stops it. New adapter hook `--ui-<intent>-text` pins an intent's text colour.
- acd7a8f: Add a `uniskin` CLI: `npx uniskin init` installs the packages for an adapter (default, shadcn or daisyui) with the detected package manager and idempotently adds the `@plugin` line(s) to your Tailwind v4 stylesheet (`--adapter`, `--css`, `--yes`, `--dry-run`), and `npx uniskin new-adapter <name>` scaffolds an adapter. The plugin entry is unchanged and the CLI has no dependencies.
- 14238bc: Dark mode and contrast. Adapters can declare `darkTokens` (emitted under `.dark, [data-theme="dark"]` and `prefers-color-scheme: dark`; new `dark: "media" | "class" | false` plugin option). The default and shadcn skins now ship dark palettes. Soft tints derive from the surface instead of white/black, a new `--ui-c-text` keeps neutral ghost/outline text readable on dark surfaces, and adapters can pin soft colours with `--ui-<intent>-soft` / `-soft-fg` (used by shadcn for `ui-secondary ui-soft`). daisyUI tokens now re-resolve on every `[data-theme]` element.

### Patch Changes

- d3939b8: Resolve `adapter` relative to the stylesheet that declared `@plugin` (falling back to the process cwd for direct JS use), so relative adapter paths and adapter package names work when Tailwind runs from a different directory — e.g. a monorepo root or a CSS file in a subfolder. ESM-only adapters and `.ts` adapter files load wherever the Node runtime can load them, and resolution failures now name the module path and the underlying cause.
- 12c343e: Emit `@keyframes` and `animation:` references under the configured `prefix` (e.g. `uk-spin`, `uk-pulse`) instead of the hard-coded `ui-*` names.
- d22d630: Raise the `tailwindcss` peer floor to `^4.3.3` — the oldest 4.x verified by the new `tailwind-compat` CI matrix (older releases serialize plugin utilities differently, and 4.0.0 does not forward the `@plugin` source location used to resolve relative adapter paths). Also throw a clear error when Tailwind's `@plugin` `this.src` context has an unexpected shape; a missing context still falls back to `process.cwd()` adapter resolution as before.

## 0.1.0

### Minor Changes

- b445b98: Initial 0.1.0 release: full v1 `ui-*` vocabulary (components, intents, styles, sizes, states) in the default theme, shadcn and daisyUI adapters.
