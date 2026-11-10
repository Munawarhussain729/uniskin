---
"uniskin": major
"@uniskin/shadcn": major
"@uniskin/daisyui": major
---

1.0.0. The public surface is now stable under semver, and breaking it needs 2.0: the class vocabulary and its modifier sets, the native state hooks, the plugin options, the adapter interface and the `uniskin/adapter` and `uniskin/conformance` exports, the documented design tokens and per-component hooks, and the CLI. `docs/stability.md` lists what is stable, what is not (visual values, emitted CSS structure, undocumented variables), the deprecation rule and the supported Node (20, 22), Tailwind (from 4.3.3) and daisyUI (5) versions; `docs/migrating.md` covers the move from 0.x. There are no breaking changes from 0.8.0. The adapters now depend on `uniskin` as a peer at `^1.0.0` (the peer range was `>=0.1.0 <1.0.0`), so an adapter written for 0.x declares a new range to work with 1.0.
