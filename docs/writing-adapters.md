# Writing a Uniskin adapter

An adapter is a plain object that describes how the `ui-*` vocabulary
looks. It is **deep-merged over the built-in default theme** — you only
define what you change.

```ts
import { defineAdapter } from "uniskin/adapter";

export default defineAdapter({
  name: "my-adapter",
  rootSelector: ":root",          // optional, where tokens are emitted
  tokens: { "--ui-primary": "#5b21b6" },
  components: {
    button: {
      base:    { /* .ui-button */ },
      intents: { primary: { /* .ui-button.ui-primary */ } },
      styles:  { outline: { /* .ui-button.ui-outline */ } },
      sizes:   { sm: { /* .ui-button.ui-sm */ } },
      states:  { disabled: { /* .ui-button.ui-disabled
                                  .ui-button:disabled
                                  .ui-button[aria-disabled="true"] */ } },
    },
  },
});
```

Use it:

```css
@plugin "uniskin" { adapter: "my-adapter"; }      /* package name */
@plugin "uniskin" { adapter: "./my-adapter.ts"; } /* or a local file */
```

Package shorthand: `adapter: "foo"` resolves `foo`,
`@uniskin/foo`, then `uniskin-adapter-foo`. Relative/absolute paths
resolve from the project root (cwd).

## Slots

Every slot value is CSS-in-JS. Nested `&` selectors and at-rules are
resolved relative to the slot's compound selector:

```ts
styles: {
  ghost: {
    color: "var(--ui-c)",
    "&:hover": { "background-color": "var(--ui-c-soft)" },
    "@media (prefers-reduced-motion: reduce)": { transition: "none" },
  },
},
```

| Slot | Selector(s) emitted |
|------|---------------------|
| `base` | `.ui-<component>` |
| `intents.<intent>` | `.ui-<component>.ui-<intent>` for `primary secondary success warning danger` |
| `styles.<style>` | `.ui-<component>.ui-<style>` for `outline ghost soft` |
| `sizes.<size>` | `.ui-<component>.ui-<size>` for `sm lg` |
| `states.disabled` | `.ui-<c>.ui-disabled`, `.ui-<c>:disabled`, `.ui-<c>[aria-disabled="true"]` |
| `states.loading` | `.ui-<c>.ui-loading`, `.ui-<c>[aria-busy="true"]` |
| `states.active` | `.ui-<c>.ui-active`, `.ui-<c>[aria-selected="true"]`, `.ui-<c>[aria-pressed="true"]` |

## The `--ui-c` composition model

Intents and styles combine without combinatorial rules because the
default theme separates *which color* from *how it's applied*:

- **Intents set five variables on the element:**
  `--ui-c` (the accent color), `--ui-c-text` (the accent when used as
  *text* or a thin border on the surface), `--ui-on-c` (content color on
  top of the accent), `--ui-c-soft` and `--ui-c-soft-fg` (the soft tint and
  its text). `--ui-c-hover` is not an intent variable: `ui-button` declares
  it in its `base` and nothing else reads it.
- **Styles map those variables to real properties** — e.g. `outline`
  paints `color: var(--ui-c)` and `border-color: var(--ui-c)` on a
  transparent background.

The easiest adapter strategy is therefore: **only override `tokens`.**
Remap `--ui-primary` & friends and every component/style/size inherits
your palette. Hover shades and soft tints are derived with
`color-mix()`, so they follow automatically. That's how
`@uniskin/daisyui` works — it points `--ui-*` at daisyUI's own
`--color-*` variables.

### Pinning derived colours

`--ui-c-text`, `--ui-c-soft` and `--ui-c-soft-fg` are derived with
`color-mix()` from the intent colour. When the derivation does not suit
your palette (a light warning colour, a design system with hand-picked
tints), pin the result by setting a per-intent token in `tokens` (and
`darkTokens`); no component rule needs to change:

| Token | Pins |
|-------|------|
| `--ui-<intent>-text` | `--ui-c-text`, the accent used as text and thin borders |
| `--ui-<intent>-soft` | `--ui-c-soft`, the `ui-soft` background |
| `--ui-<intent>-soft-fg` | `--ui-c-soft-fg`, text on that background |

Three more pins cover systems whose hover, border and soft-hover colours
are hand-picked steps rather than mixes of the accent. Each intent sets the
element variable from its token and falls back to today's derived value, so
leaving them unset changes nothing:

| Token | Sets | Used by | Fallback |
|-------|------|---------|----------|
| `--ui-<intent>-hover` | `--ui-c-hover` | `ui-button` solid hover fill | the accent mixed 15% toward black |
| `--ui-<intent>-border` | `--ui-c-border` | `ui-button` border (solid, outline, soft hover); `ui-badge` and `ui-alert` base border; `ui-card.ui-outline` border | the accent |
| `--ui-<intent>-soft-hover` | `--ui-c-soft-hover` | `ui-button.ui-soft` hover fill | the accent |

`<intent>` is one of `primary secondary success warning danger`.
`@uniskin/shadcn` and `@uniskin/daisyui` use the first three pins.

You can still override a component's `&:`-level states or repaint a
whole slot when tokens aren't enough (see `@uniskin/shadcn`'s outline,
which stays neutral because shadcn/ui has no colored-outline variant).

## Dark mode and animation

- **Overlay tokens.** `--ui-overlay` colours the `ui-modal` scrim (default
  `rgb(0 0 0 / 0.5)`) and `--ui-overlay-soft` the `ui-modal.ui-soft` veil
  (default `rgb(255 255 255 / 0.6)`). Both exist in the light and dark
  sets, so remap them in `tokens` and `darkTokens` to match your system's
  backdrop.
- **`darkTokens`** are emitted under `.dark, [data-theme="dark"]`. If the
  system you are porting has its own dark scope, set
  `darkRootSelector` (for example `'.radix-themes[data-appearance="dark"]'`).
  When the consumer uses the default `dark: "media"` strategy, the
  `prefers-color-scheme` fallback still targets `:root`, so keep the
  adapter's `rootSelector` at `:root` (or use `dark: "class"`) when you
  also set `darkRootSelector`.
- **`keyframes`** declares extra `@keyframes`, merged over the built-in
  `spin` and `pulse`. They are emitted as `@keyframes <prefix>-<name>`;
  write the reference as `ui-<name>` in a slot
  (`animation: "ui-shimmer 1s linear infinite"`) and it is re-prefixed to
  match the consumer's `prefix`. Every `animation` is turned off under
  `prefers-reduced-motion` for you.

## Placement convention

Components that sit beside another element (tooltips now; toasts and menus
later) take a `data-placement` attribute instead of a modifier class:

- Values name a side, `top | bottom | start | end` (`start` and `end` follow
  the writing direction, so they flip in RTL). Components that also align
  along the side use a two-part value, for example `bottom-end`.
- The default placement is the component's own base rule; each other
  placement is a nested attribute selector in the same slot
  (`'&[data-placement="bottom"]'`).
- Use logical properties (`inset-inline-start`, `inset-inline-end`) for
  `start` and `end`.
- Why an attribute: a placement modifier kind would need a new adapter slot
  and would enlarge the vocabulary for something that only positions.
- Positioning is relative to the anchor and has no collision handling;
  document that, and point to a positioning library.
- A fixed container (the toast region) takes the two-part form, a vertical
  side then a horizontal one (`top-start`, `bottom-center`, ...), and
  `pointer-events: none` so it never blocks the page.

A dropdown places its menu with the same two-part `data-placement` as the
toast region, set on the **wrapper** (`ui-dropdown`) because the menu is
positioned against it. Show a floating panel with `visibility` and
`opacity`, and give the *open* rule `transition: ... visibility 0s` while
the closed rule delays it (`visibility 0s linear <duration>`): a plain
`visibility` transition keeps the panel hidden for the first frame, and a
script that opens it and focuses the first item in the same tick would
focus nothing.

## Entering elements

Components inserted into the page at runtime (toasts now) enter with a
transition instead of an animation, using `@starting-style` so the browser
has a "from" state without any script:

```ts
base: {
  opacity: "1",
  transform: "none",
  transition: "opacity 0.2s ease, transform 0.2s ease",
  "@starting-style": { opacity: "0", transform: "translateY(0.5rem)" },
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
}
```

- Always add the reduced-motion override: with `transition: none` the
  element simply appears.
- Exit is the consumer's job (CSS cannot remove a node). Do not rely on
  `transition-behavior: allow-discrete` for a component that must work in
  browsers without it.
- Intents must only set variables, never paint, on a component that also has
  style modifiers: an intent and a style are same-specificity single-class
  rules, so which one wins would depend on emission order. Paint once in
  `base` from the variables (see `ui-toast`).

## Runtime notes

Measured on the CI Node matrix (20 and 22):

- **CJS adapters** load on every supported Node.
- **ESM adapters** (`.mjs`, or `.js` in a `type: "module"` package) load
  via `require(esm)` — unflagged since **Node 20.19 / 22.12**. On Node
  20.0–20.18 an ESM-only adapter fails to load; the resolution error
  reports `ERR_REQUIRE_ESM` with the module path.
- **`.ts` adapters** load only where Node strips types — **Node 22.18+**
  (and 23+). On Node 20 a `.ts` adapter cannot load; ship compiled `.js`
  for broad compatibility.
- Whatever Node cannot load is named — path and underlying cause — in
  the `Could not resolve adapter` error.

## Publishing an adapter

- Package it as anything resolvable (`@scope/name`, `uniskin-adapter-x`).
- Ship the compiled JS as the default export (`export default
  defineAdapter({…})`); ESM and CJS both work.
- In dev builds Uniskin prints one summary line with how many modifier
  combinations you haven't defined — that's normal; they fall back to the
  default style. Set `debug: true` (or `UNISKIN_DEBUG=1`) to list them all.
  Built-in adapters are silent unless debug is on.

## Per-component hooks

Components read optional `--ui-<component>-*` variables with a built-in
fallback, so an adapter sets them in `base` or `sizes` and an unset hook
is harmless:

| Component | Hooks |
|-----------|-------|
| `ui-checkbox` | `--ui-check-size`, `--ui-check-mark` |
| `ui-radio` | `--ui-radio-size` (default `1.125rem`), `--ui-radio-dot` (dot color, default `--ui-on-c`), `--ui-radio-dot-size` (default `0.5em`) |
| `ui-table` | `--ui-table-pad-x`, `--ui-table-pad-y` (density), `--ui-table-head-bg`, `--ui-table-head-fg`, `--ui-table-stripe` (zebra under `ui-soft`), `--ui-table-row-hover`, `--ui-table-border` |
| `ui-accordion` | `--ui-accordion-pad-x`, `--ui-accordion-pad-y` (trigger and panel padding; sizes set them), `--ui-accordion-border`, `--ui-accordion-hover` (trigger hover fill), `--ui-accordion-soft-bg` (list fill under `ui-soft`) |
| `ui-progress` | `--ui-progress-h` (height; sizes set it), `--ui-progress-track` (track fill), `--ui-progress-bar` (bar colour, default `--ui-c-text` so intents tint it), `--ui-progress-border` (track outline under `ui-outline`) |
| `ui-tooltip` | `--ui-tooltip-bg`, `--ui-tooltip-fg` (override the intent-driven fill and text), `--ui-tooltip-gap` (distance from the anchor), `--ui-tooltip-arrow` (arrow size, `0` removes it), `--ui-tooltip-max-w`, `--ui-tooltip-fs`, `--ui-tooltip-pad-x`, `--ui-tooltip-pad-y` (sizes set the last three) |
| `ui-toast` | `--ui-toast-w` (toast width, default `22rem`), `--ui-toast-gap` (stack gap), `--ui-toast-shadow`, `--ui-toast-offset` (distance from the viewport edge), `--ui-toast-edge` (border colour; intents set it), `--ui-toast-fs`, `--ui-toast-pad-x`, `--ui-toast-pad-y` (sizes set the last three) |
| `ui-menu` | `--ui-menu-w` (minimum width, default `10rem`), `--ui-menu-max-h`, `--ui-menu-pad`, `--ui-menu-gap` (distance from the trigger, set on the dropdown or above), `--ui-menu-shadow`, `--ui-menu-z` (default `50`), `--ui-menu-fs`, `--ui-menu-item-py`, `--ui-menu-item-px` (sizes set these on the menu and on items) |
| `ui-menu-item` | `--ui-menu-item-hover-bg`, `--ui-menu-item-hover-fg` (hover, focus and `[data-highlighted]` tint and label) |
| `ui-avatar` | `--ui-avatar-size` (diameter; sizes set it), `--ui-avatar-bg`, `--ui-avatar-fg` |
| `ui-skeleton` | `--ui-skeleton-w`, `--ui-skeleton-h`, `--ui-skeleton-bg` |
| `ui-separator` | `--ui-separator-color`, `--ui-separator-gap` |
| `ui-breadcrumb` | `--ui-breadcrumb-fs` (sizes set it), `--ui-breadcrumb-sep` (separator colour) |
| `ui-pagination` | `--ui-pagination-size` (item height and minimum width; sizes set it), `--ui-pagination-fs` (sizes set it); the current page reads `--ui-c` and `--ui-on-c` |
| `ui-switch` | `--ui-switch-size` (height, default `1.25rem`; width is `1.75x`), `--ui-switch-track` (off colour, default a grey mixed from `--ui-surface-fg`), `--ui-switch-thumb` (thumb colour), `--ui-switch-pad` (thumb inset, default `2px`) |
| `ui-card` | `--ui-card-pad` (padding shared by header, body and footer, default `1.25rem`), `--ui-card-border` (border colour, default `--ui-border`; intents mix their colour into it) |
| `ui-modal` | `--ui-modal-w` (width of `ui-modal-box`, default `32rem`; `ui-sm` and `ui-lg` set `24rem` and `48rem`) |
| `ui-tab` | `--ui-tab-py`, `--ui-tab-px`, `--ui-tab-fs`, `--ui-tab-radius` (shape); `--ui-tab-hover-bg`, `--ui-tab-active-fg`, `--ui-tab-active-bg`, `--ui-tab-active-line`, `--ui-tab-active-shadow` (the active tab) |
| `ui-field` | `--ui-field-gap` (stack gap, default `0.375rem`), `--ui-field-label`, `--ui-field-hint`, `--ui-field-error` (text colours; the error falls back to `--ui-danger-text`, then `--ui-danger`) |

`ui-radio` and `ui-checkbox` also match `[aria-checked]` (headless
libraries), so nest your checked-state overrides under the same
selector the default theme uses, for example
`'&:checked, &[aria-checked="true"]'`.

`ui-switch` also matches `[aria-checked="true"]` (for `<button role="switch">`);
nest checked overrides under `'&:checked, &[aria-checked="true"]'`. The thumb
travels with `margin-inline-start`, so keep any new positioning logical
(RTL-safe).

`ui-input`, `ui-textarea` and `ui-select` style `[aria-invalid="true"]` inside
their `base` (it sets `--ui-field-c` and `border-color` to `--ui-danger`); if
your adapter replaces `border-color` there, keep reading `--ui-field-c`. Pin
`--ui-danger-text` when your danger colour is too light or too dark to read as
text (the daisyUI adapter does).

## Overriding means repainting

Adapter rules are deep-merged over the default theme, and the merge can
only add or replace values. It cannot delete them: an empty rule such as
`"&:hover": {}` does **not** clear the default theme's hover rule.

To remove an inherited effect, repaint the property to its neutral value
instead: `"border-bottom": "0"`, `"border-color": "transparent"`,
`"box-shadow": "none"`, `"background-color": "transparent"`. The shadcn
tabs do this.

The same applies to the solid look. "No style class" *is* the solid
variant, so a system whose canonical variant is soft should repaint
`base`; true solid then becomes unreachable for that component.
