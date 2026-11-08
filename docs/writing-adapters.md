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
  `--ui-c` (the accent color), `--ui-on-c` (content color on top of it),
  `--ui-c-hover`, `--ui-c-soft`, `--ui-c-soft-fg`.
- **Styles map those variables to real properties** — e.g. `outline`
  paints `color: var(--ui-c)` and `border-color: var(--ui-c)` on a
  transparent background.

The easiest adapter strategy is therefore: **only override `tokens`.**
Remap `--ui-primary` & friends and every component/style/size inherits
your palette. Hover shades and soft tints are derived with
`color-mix()`, so they follow automatically. That's how
`@uniskin/daisyui` works — it points `--ui-*` at daisyUI's own
`--color-*` variables.

You can still override a component's `&:`-level states or repaint a
whole slot when tokens aren't enough (see `@uniskin/shadcn`'s outline,
which stays neutral because shadcn/ui has no colored-outline variant).

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
- In dev builds Uniskin warns which vocabulary slots you haven't
  defined — that's normal; they fall back to the default style.
