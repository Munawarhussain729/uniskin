---
"uniskin": minor
---

Add `uniskin/conformance` with `checkAdapter(adapter)`: compares an adapter with the documented coverage matrix and reports how many combinations it defines, which components and modifiers fall back to the default style, and any slot keys that are never emitted. Nothing in an adapter is required; this shows how far a port has got. The unit tests also prove the contract with a deliberately different third adapter that defines almost nothing. The coverage matrix no longer lists `disabled` and `active` for `ui-table`: those are `<tr>` selectors inside the table's base rule, not slots.
