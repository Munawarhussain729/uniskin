# 002 — Intent/style are separate modifiers; state uses classes and native attributes

Status: decided
Date: 2026-11-08

## Decisions

1. **Intent and style are separate modifiers.** `ui-danger ui-outline`, never a
   combined `ui-danger-outline`. Intents set the `--ui-c*` variables; styles map
   those variables to real properties, so 5 intents × 3 styles need no
   hand-written combinations.
2. **State is styled by both classes and native attributes.**
   `ui-disabled` ⇔ `:disabled` / `[aria-disabled="true"]`,
   `ui-loading` ⇔ `[aria-busy="true"]`,
   `ui-active` ⇔ `[aria-selected="true"]` / `[aria-pressed="true"]`.
   Native attributes keep markup accessible; classes cover elements with no
   native equivalent (plain `<div>`, `<a>`).

## Consequences

- Adapter slots stay small: `intents`, `styles`, `sizes`, `states`.
- Implemented in `packages/uniskin/src/emit.ts` (`STATE_NATIVES`).
- Changing either decision later is a breaking vocabulary change.
