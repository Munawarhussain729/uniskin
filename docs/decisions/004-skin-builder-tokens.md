# 004 — Skin builder: border width and density have no token

Status: proposal (no change to core or adapters in this PR)

## Context

The skin builder (`apps/site/builder`) exports a standard adapter file. Most
of its knobs map directly to documented tokens: intent colours and their
`-fg`, the optional `--ui-<intent>-text` / `-soft-fg` pins, surfaces,
`--ui-ring`, `--ui-radius` and `--ui-font-sans`.

Two knobs have no token in the default theme:

- **Border width** — every bordered component hard-codes `border: 1px solid …`.
- **Density** — padding is hard-coded in rem per component and per size.

## What the builder does today

It exports them as `components` overrides, which the adapter contract allows:
`border-width` on the base slot of button, input, textarea, select, card,
badge and alert, and scaled paddings for base/sm/lg of every component. The
values it scales are a copy of the default theme's; a unit test
(`apps/site/tests/export.test.ts`) fails if the default theme drifts from that
table.

Consequences: the exported adapter is larger than a tokens-only one, and the
CSS-variables-only export cannot carry these two settings.

## Proposal

Add two tokens to the default theme and use them in the component rules:

- `--ui-border-width` (default `1px`) used by `border:` shorthands.
- `--ui-density` (default `1`) used as a multiplier,
  `padding: calc(0.5rem * var(--ui-density)) calc(1rem * var(--ui-density))`.

Then the builder can emit tokens only, the CSS snippet becomes complete, and
adapters such as daisyUI could map their own spacing variables onto them. This
is a vocabulary-neutral change to the default theme and needs a changeset for
`uniskin`; it is deliberately left out of the builder PR.

## Other contract notes

- `darkTokens` replaces the default dark tokens entirely, so the builder always
  emits the full dark colour set.
- Soft tints and hover shades stay derived by `color-mix()`; the builder
  mirrors that derivation (OKLab mix) to check contrast and only pins
  `-text` / `-soft-fg` when a user applies a fix.
