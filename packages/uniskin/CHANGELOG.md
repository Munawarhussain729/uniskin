# uniskin

## 1.1.0

### Minor Changes

- 59d256b: Add `@uniskin/bootstrap`, a Bootstrap 5.3 adapter that defines the whole vocabulary: `checkAdapter` reports 297 of 297 combinations, so nothing falls back to the default skin. Colours, radii, type scale, hover shades and the `-subtle` / `-text-emphasis` pairs are Bootstrap's own, each as `var(--bs-*)` with Bootstrap's default as the fallback, so loading Bootstrap's stylesheet carries a customised theme through and leaving it out still renders Bootstrap's default look. Dark mode follows `data-bs-theme="dark"` as well as `.dark`, `[data-theme="dark"]` and `prefers-color-scheme`. Where a Bootstrap value misses WCAG AA the adapter adjusts it and says so in its README: form-control borders (3:1), a solid focus ring at Bootstrap's 0.25rem size, and darker intent text on light pages. `npx uniskin init --adapter bootstrap` installs and wires it, and `adapter: "bootstrap"` is treated as built in. The playground and the accessibility, contrast, keyboard and motion tests now cover a fourth skin.
- aba18e6: Add `@uniskin/flowbite`, a Flowbite adapter that defines the whole vocabulary: `checkAdapter` reports 297 of 297 combinations, so nothing falls back to the default skin. Flowbite is Tailwind utilities, so its tokens are Tailwind's palette: every colour is a `var(--color-*)` with the palette value as the fallback, and overriding `--color-blue-700` in `@theme` re-themes the skin. Dark mode is Flowbite's `.dark` class (also `[data-theme="dark"]` and `prefers-color-scheme`). Where a Flowbite value misses WCAG AA the adapter adjusts it and says so in its README: form-control borders (3:1), a solid 4px focus ring, and darker intent text on light pages. `npx uniskin init --adapter flowbite` installs and wires it, and `adapter: "flowbite"` is treated as built in. The shared accessibility, contrast, keyboard and motion tests now run a fifth skin.
- c57192c: Add `@uniskin/radix`, a Radix Themes adapter that defines the whole vocabulary: `checkAdapter` reports 297 of 297 combinations, so nothing falls back to the default skin. Colours are Radix's 12-step scales, read as `var(--blue-9, #3e63dd)` with the Radix value as the fallback, so loading Radix Themes' stylesheet (or overriding a step) carries a custom scale through and leaving it out still renders the default Radix look. Steps keep their Radix roles (3 soft, 9 solid, 10 hover, 11 text, 12 high-contrast). Dark mode is Radix's `.dark` / `.dark-theme` (also `[data-theme="dark"]` and `prefers-color-scheme`). Where a Radix value misses WCAG AA the adapter adjusts it and says so in its README: solid green and red fills, soft success and warning text, text-field borders (3:1) and a solid focus ring. `npx uniskin init --adapter radix` installs and wires it, and `adapter: "radix"` is treated as built in. The shared accessibility, contrast, keyboard and motion tests now run a sixth skin.

### Patch Changes

- c57192c: Lighten the default menu-item hover tint from 9% to 6% of the item's text colour. Measured on the settled colours (the earlier test sampled mid-fade), the danger and warning items fell to 4.4 to 4.5:1 on hover; at 6% every intent stays at or above 4.5:1 apart from the recorded daisyUI dark primary.

## 1.0.1

### Patch Changes

- 7c50c4e: Documentation only: the package READMEs now describe 1.0 (the full 26-component vocabulary, the stability policy, the upgrade guide and `checkAdapter`), so the npm pages match the release. No code changes.

## 1.0.0

### Major Changes

- 6968e88: 1.0.0. The public surface is now stable under semver, and breaking it needs 2.0: the class vocabulary and its modifier sets, the native state hooks, the plugin options, the adapter interface and the `uniskin/adapter` and `uniskin/conformance` exports, the documented design tokens and per-component hooks, and the CLI. `docs/stability.md` lists what is stable, what is not (visual values, emitted CSS structure, undocumented variables), the deprecation rule and the supported Node (20, 22), Tailwind (from 4.3.3) and daisyUI (5) versions; `docs/migrating.md` covers the move from 0.x. There are no breaking changes from 0.8.0. The adapters now depend on `uniskin` as a peer at `^1.0.0` (the peer range was `>=0.1.0 <1.0.0`), so an adapter written for 0.x declares a new range to work with 1.0.

## 0.8.0

### Minor Changes

- 73526ca: Add `uniskin/conformance` with `checkAdapter(adapter)`: compares an adapter with the documented coverage matrix and reports how many combinations it defines, which components and modifiers fall back to the default style, and any slot keys that are never emitted. Nothing in an adapter is required; this shows how far a port has got. The unit tests also prove the contract with a deliberately different third adapter that defines almost nothing. The coverage matrix no longer lists `disabled` and `active` for `ui-table`: those are `<tr>` selectors inside the table's base rule, not slots.

## 0.7.0

### Minor Changes

- 27af24d: Add `ui-dropdown`, `ui-menu`, `ui-menu-item`, `ui-menu-label` and `ui-menu-separator` (vocabulary v1.9): a CSS-only floating action menu and the same list un-floated. The dropdown hides its menu until `[open]` (a `<details>`), `aria-expanded="true"` on the trigger, `ui-active`, or `:popover-open`; closed items are not tabbable, and opening shows the panel at once so a script can focus the first item in the same tick. `data-placement` takes `bottom|top` with `start|end` (default `bottom-start`). Items tint on hover, `:focus-visible` (with a 2px ring) and `[data-highlighted]`; intents colour them (`ui-danger` for the destructive item), `ui-disabled` and `ui-active` are states, and `aria-checked="true"` shows a check mark that is kept out of the accessible name. The menu takes `ui-ghost`, `ui-soft`, `ui-sm` and `ui-lg`, with a 1px border so it stays visible on dark surfaces. Uniskin ships no JavaScript: the full keyboard contract (arrows, Home/End, typeahead, Escape returning focus, click-outside) is documented as the consumer's, and the playground has a short working handler. Hooks `--ui-menu-*` are in `docs/writing-adapters.md`. shadcn maps to `DropdownMenuContent` and daisyUI to its `menu` inside `dropdown-content`.
- 9dc2bb5: Add a drawer as a placement of `ui-modal`, with no new class: `data-placement="start|end|top|bottom"` on the modal docks the box to that edge and slides it in. `start` and `end` follow the writing direction; side drawers are full height and `--ui-modal-w` wide, top and bottom drawers are full width up to `--ui-drawer-h`. The slide is off under reduced motion. The open mechanisms, backdrop and the `<dialog>` guidance are the modal's own.
- f44f66a: Add `ui-breadcrumb`, `ui-pagination` and `ui-pagination-item`. The breadcrumb goes on the `<ol>` of a labelled `<nav>`, with decorative separators (empty alt text) and a bold `aria-current="page"` item; `ui-sm` and `ui-lg` set the size. The pagination goes on a `<ul>`: intents on the list fill the current page (`aria-current="page"` or `ui-active`), sizes set the item size, and items take `ui-disabled`. Hooks `--ui-breadcrumb-*` and `--ui-pagination-*` are in `docs/writing-adapters.md`.
- 59b4434: Add `ui-avatar`, `ui-skeleton` and `ui-separator`. The avatar is a circle for initials, an icon or an image, with intents, `ui-soft`, `ui-outline` and three sizes. The skeleton is a pulsing placeholder block that stops under reduced motion. The separator is a 1px rule, horizontal by default and vertical on `aria-orientation="vertical"`. Hooks `--ui-avatar-*`, `--ui-skeleton-*` and `--ui-separator-*` are documented in `docs/writing-adapters.md`; shadcn and daisyUI map the avatar fallback and the skeleton fill.
- d75d9da: Add `ui-slider` on the native `<input type="range">` (vocabulary v1.15): intents tint the thumb and the filled track, `ui-sm` and `ui-lg` set the size, and `ui-disabled` dims it. The filled part of the track is painted from a `--ui-slider-fill` percentage the consumer sets (one line of script, documented); without it the track is unfilled and the thumb alone shows the value. The track and thumb are styled for both WebKit/Blink and Firefox.

## 0.6.0

### Minor Changes

- c59e761: Add `ui-toast` and `ui-toast-region` (vocabulary v1.8): a fixed, stacking region (`data-placement="top|bottom"` with `start|center|end`, default `bottom-end`, safe-area aware, never blocking the page) and the messages in it. The neutral toast is a surface card with a 1px edge; intents give a solid fill, `ui-soft` a tint and `ui-outline` an accent edge; `ui-sm`/`ui-lg` set the size and `ui-loading` pulses it. A toast fades and rises in when inserted (`@starting-style`) and appears instantly under reduced motion. Buttons inside a toast, such as a ghost dismiss, take the toast's text colour for their label and focus ring so they stay legible and focusable on any fill. Hooks `--ui-toast-*` are documented in `docs/writing-adapters.md`, together with the entering-elements convention; the docs spell out what the consumer provides (the live region, timers, dismissal). shadcn maps to `Toast` and daisyUI to the `alert` look inside its `toast` container.
- c1c72a1: Add `ui-tooltip` and `ui-tooltip-anchor` (vocabulary v1.7): a CSS-only text bubble shown on hover and keyboard focus, which stays visible while the pointer is on it. Intents fill the bubble, `ui-soft` and `ui-outline` restyle it, `ui-sm`/`ui-lg` set the size, `ui-active` forces it visible, and `data-placement="top|bottom|start|end"` places it (`start` and `end` follow the writing direction). Component-scoped hooks `--ui-tooltip-*` are documented in `docs/writing-adapters.md`, along with the `data-placement` convention that later components share. The documentation states plainly that Escape cannot dismiss a CSS-only tooltip (WCAG 1.4.13) and that there is no collision handling. shadcn maps to `TooltipContent` and daisyUI to `tooltip-content`.

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
