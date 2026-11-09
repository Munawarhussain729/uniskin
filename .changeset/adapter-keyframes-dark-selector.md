---
"uniskin": minor
---

Adapters can now declare their own `@keyframes` (`keyframes`, merged over the built-in `spin`/`pulse` and re-prefixed with the consumer's `prefix`) and choose where dark tokens are emitted (`darkRootSelector`, default `.dark, [data-theme="dark"]`). Both are optional, so existing adapters are unaffected.
