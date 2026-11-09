---
"uniskin": minor
---

Stop printing the long "adapter does not define" warning for the built-in adapters (`default`, `shadcn`, `daisyui`), whose fallbacks to the default style are intentional. Third-party adapters now get a single summary line. Add a `debug` plugin option (or `UNISKIN_DEBUG=1`) that prints the full detailed list. Generated CSS is unchanged.
