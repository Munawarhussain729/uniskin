# @uniskin/bootstrap

## 1.2.0

### Minor Changes

- f1e85fe: Add `ui-spinner` (vocabulary v1.16): a CSS-only busy indicator, a ring with a rotating arc. The five intents colour the arc, `ui-sm` and `ui-lg` set the size, and `--ui-spinner-size`, `--ui-spinner-width`, `--ui-spinner-color` and `--ui-spinner-track` are the hooks. Under `prefers-reduced-motion` the rotation stops and the ring stays as a static mark. Give it `role="status"` and an accessible name. Every built-in adapter defines it, so `checkAdapter` reports full coverage for the Bootstrap, Flowbite and Radix Themes adapters (305 of 305).

## 1.1.0

### Minor Changes

- 59d256b: Add `@uniskin/bootstrap`, a Bootstrap 5.3 adapter that defines the whole vocabulary: `checkAdapter` reports 297 of 297 combinations, so nothing falls back to the default skin. Colours, radii, type scale, hover shades and the `-subtle` / `-text-emphasis` pairs are Bootstrap's own, each as `var(--bs-*)` with Bootstrap's default as the fallback, so loading Bootstrap's stylesheet carries a customised theme through and leaving it out still renders Bootstrap's default look. Dark mode follows `data-bs-theme="dark"` as well as `.dark`, `[data-theme="dark"]` and `prefers-color-scheme`. Where a Bootstrap value misses WCAG AA the adapter adjusts it and says so in its README: form-control borders (3:1), a solid focus ring at Bootstrap's 0.25rem size, and darker intent text on light pages. `npx uniskin init --adapter bootstrap` installs and wires it, and `adapter: "bootstrap"` is treated as built in. The playground and the accessibility, contrast, keyboard and motion tests now cover a fourth skin.
