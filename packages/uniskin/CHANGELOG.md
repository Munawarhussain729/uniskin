# uniskin

## 0.5.0

### Minor Changes

- be46bbe: Add `ui-progress` (vocabulary v1.6): a progress bar styled on the native `<progress>` element, with intents, `ui-outline` and `ui-ghost` styles and `ui-sm`/`ui-lg` sizes. An indeterminate `<progress>` shows a sliding bar, replaced by a dim full-width bar under `prefers-reduced-motion`. The bar keeps at least 3:1 against its track in all three skins in light and dark. Component-scoped hooks `--ui-progress-*` are documented in `docs/writing-adapters.md`; shadcn maps to `Progress` and daisyUI to `progress`.
- 416b1d7: Add `ui-accordion` and its parts `ui-accordion-item`, `ui-accordion-trigger` and `ui-accordion-panel` (vocabulary v1.5): a disclosure list built on native `<details>`/`<summary>`, so open/close, Enter/Space and the expanded state need no JavaScript. Intents tint the open trigger, `ui-outline`, `ui-ghost` and `ui-soft` change the list style, `ui-sm`/`ui-lg` set density, and the chevron and the panel reveal are CSS only (the reveal and transitions stop under reduced motion). Component-scoped hooks `--ui-accordion-*` are documented in `docs/writing-adapters.md`. shadcn maps to `Accordion` (borderless, `border-b` per item, hover underline) and daisyUI to `collapse`.
- 5f1e5ca: `ui-badge`, `ui-alert` and `ui-card.ui-outline` now read their border colour from `--ui-c-border`, so an adapter can pin it per intent with `--ui-<intent>-border`. The fallback is the accent colour, so nothing changes unless a pin is set.

## 0.4.0

### Minor Changes

- a3ed9df: Adapters can now declare their own `@keyframes` (`keyframes`, merged over the built-in `spin`/`pulse` and re-prefixed with the consumer's `prefix`) and choose where dark tokens are emitted (`darkRootSelector`, default `.dark, [data-theme="dark"]`). Both are optional, so existing adapters are unaffected.
- 10f416e: New optional tokens, all defaulting to today's look: `--ui-overlay` and `--ui-overlay-soft` for the modal scrim and soft veil (light and dark sets), and per-intent pins `--ui-<intent>-hover`, `--ui-<intent>-border` and `--ui-<intent>-soft-hover` (exposed as `--ui-c-hover`, `--ui-c-border`, `--ui-c-soft-hover` on every intent). Scale-driven adapters can now remap tokens instead of rewriting button style slots.
- bb38532: Add `ui-table` and `ui-table-wrap` to the vocabulary (v1.4): native `<table>` styling via nested `th`/`td`/`tr`/`caption` selectors, `ui-soft` zebra, `ui-outline` cell grid, `ui-ghost` line-less, intents tinting header underline + selected-row fill, `ui-sm`/`ui-lg` density, `[aria-sort]` arrows, sticky `thead th`, tr-level selected/disabled and table-level `ui-loading`/`aria-busy`. Component-scoped hooks `--ui-table-*` documented in `docs/writing-adapters.md`. shadcn maps to `Table` (`border-b`, `hover:bg-muted/50`, selected `--muted`); daisyUI maps to `table`/`table-zebra`.

### Patch Changes

- f88f506: Adapter warnings are more accurate. `warnUnsupported` now checks an adapter against the documented coverage matrix instead of every modifier, so a conforming adapter is no longer warned about combinations that are not part of the vocabulary. Slot keys outside the known modifier sets (for example `styles: { classic: … }`) are now reported instead of being silently dropped.

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
