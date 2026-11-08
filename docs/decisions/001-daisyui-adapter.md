# 001 — How the daisyUI adapter applies daisyUI's look

Status: decided
Date: 2026-11-08

## Question

`@uniskin/daisyui` must make `ui-button` look like daisyUI's `btn`
without changing markup. Under Tailwind CSS v4, how?

## Options evaluated

### A. `@apply` daisyUI's component classes inside Uniskin rules

`.ui-button { @apply btn; }` **does** work when written in a user
stylesheet — verified with tailwindcss 4.3.5 + daisyui 5.7.50.

But Uniskin emits component CSS through the plugin API
(`addUtilities`/`addComponents`), and **`@apply` is not processed inside
plugin-registered styles**: `{ '.ui-button': { '@apply': 'btn' } }` is
emitted literally as `@apply: btn;` — invalid CSS. The only way to use
`@apply` would be shipping a separate `.css` file the user must
`@import` alongside `@plugin "daisyui"` — a two-step setup for a
project whose whole pitch is "one line, zero markup changes". Rejected.

### B. Depend on daisyUI and reuse its emitted classes at runtime

E.g. instructing users to write both `btn` and `ui-button`, or asking
them to keep daisyUI markup. This changes markup — the one thing the
project exists to avoid. Rejected.

### C. Map Uniskin's design tokens onto daisyUI's CSS variables — chosen

daisyUI 5 exposes its entire theme as plain CSS variables under
`:root`/`[data-theme]`: `--color-primary`, `--color-primary-content`,
`--radius-field`, `--size-field`, `--border`, `--depth`, …

The adapter therefore just remaps Uniskin tokens:

```ts
"--ui-primary": "var(--color-primary, oklch(45% 0.24 277.023))",
"--ui-radius":  "var(--radius-field, 0.25rem)",
```

where the `var()` fallback is daisyUI's own "light" theme value, so:

- **`@plugin "daisyui"` also loaded** → `ui-*` classes follow the user's
  active daisyUI theme for free, including `data-theme="dark"` and
  custom themes;
- **daisyUI not installed** → the bundled fallbacks still render
  daisyUI's light look.

Component slots override only the characterful details (semibold
weight, `--size-field`-derived heights, the `scale(0.97)` press,
`btn-outline`/`btn-ghost`/`btn-soft` hover behaviour). Everything else
falls back to Uniskin's defaults, which already compose intents ×
styles via `--ui-c` variables.

## Consequences

- Zero markup changes — the project's core guarantee.
- No hard dependency on `daisyui`; it is an optional enhancement.
- Downside: we re-implement ~60 lines of `btn` CSS instead of reusing
  daisyUI's source, so exotic daisyUI button features (join, noise/depth
  textures) are approximated, not inherited.
- If a future Tailwind version processes `@apply` inside plugin rules,
  option A can be revisited.
