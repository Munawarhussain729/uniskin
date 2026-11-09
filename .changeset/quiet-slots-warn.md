---
"uniskin": patch
---

Adapter warnings are more accurate. `warnUnsupported` now checks an adapter against the documented coverage matrix instead of every modifier, so a conforming adapter is no longer warned about combinations that are not part of the vocabulary. Slot keys outside the known modifier sets (for example `styles: { classic: … }`) are now reported instead of being silently dropped.
