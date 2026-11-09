---
"uniskin": minor
---

`ui-badge`, `ui-alert` and `ui-card.ui-outline` now read their border colour from `--ui-c-border`, so an adapter can pin it per intent with `--ui-<intent>-border`. The fallback is the accent colour, so nothing changes unless a pin is set.
