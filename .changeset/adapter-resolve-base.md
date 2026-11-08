---
"uniskin": patch
---

Resolve `adapter` relative to the stylesheet that declared `@plugin` (falling back to the process cwd for direct JS use), so relative adapter paths and adapter package names work when Tailwind runs from a different directory — e.g. a monorepo root or a CSS file in a subfolder. ESM-only adapters and `.ts` adapter files load wherever the Node runtime can load them, and resolution failures now name the module path and the underlying cause.
