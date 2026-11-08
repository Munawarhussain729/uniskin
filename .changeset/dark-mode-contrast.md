---
"uniskin": minor
"@uniskin/shadcn": minor
"@uniskin/daisyui": minor
---

Dark mode and contrast. Adapters can declare `darkTokens` (emitted under `.dark, [data-theme="dark"]` and `prefers-color-scheme: dark`; new `dark: "media" | "class" | false` plugin option). The default and shadcn skins now ship dark palettes. Soft tints derive from the surface instead of white/black, a new `--ui-c-text` keeps neutral ghost/outline text readable on dark surfaces, and adapters can pin soft colours with `--ui-<intent>-soft` / `-soft-fg` (used by shadcn for `ui-secondary ui-soft`). daisyUI tokens now re-resolve on every `[data-theme]` element.
