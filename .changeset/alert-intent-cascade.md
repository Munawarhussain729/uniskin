---
"@uniskin/shadcn": patch
"@uniskin/daisyui": patch
---

Make the alert look independent of CSS emission order. The adapters painted `background-color`, `border-color` and `color` in the intent rules, which have the same specificity as `ui-soft`, `ui-ghost` and `ui-outline`, so the soft, ghost and outline looks only won because Tailwind happened to emit them later; adding unrelated rules could flip it (a soft success alert rendered at 2.5:1). The intent paints are now guarded with `:not()` on the style classes. Output is unchanged for existing markup.
