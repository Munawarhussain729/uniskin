# @uniskin/bootstrap

The Bootstrap 5.3 look for [uniskin](https://www.npmjs.com/package/uniskin):
the `ui-*` class vocabulary styled like Bootstrap, as pure CSS. No Bootstrap
package, jQuery or Popper required, and no JavaScript.

```css
@import "tailwindcss";
@plugin "uniskin" { adapter: "bootstrap"; }
```

```html
<button class="ui-button ui-primary">Save</button>
<button class="ui-button ui-danger ui-outline">Delete</button>
```

**1.0:** stable under semver; this adapter depends on `uniskin` at `^1.0.0`.

## Install

```sh
npx uniskin init --adapter bootstrap --yes
```

or by hand:

```sh
npm install uniskin @uniskin/bootstrap
```

and add the `@plugin` line shown above to your Tailwind v4 entry CSS.

## What you get

- **The whole vocabulary.** Every component and every documented modifier is
  defined for Bootstrap, not left to the default skin: `checkAdapter` from
  `uniskin/conformance` reports 305 of 305 combinations, from buttons, form
  controls, cards and alerts to tables, accordions, tooltips, toasts, dropdown
  menus, pagination, sliders and the modal as a drawer.
- **Bootstrap's own values.** Palette, radii, spacing, type scale, hover
  shades and the `-subtle` / `-text-emphasis` colours of Bootstrap 5.3.
- **Follows your Bootstrap theme.** Every colour is `var(--bs-*)` with
  Bootstrap's default as the fallback. Load Bootstrap's stylesheet and a
  customised `--bs-primary`, `--bs-body-bg` or `--bs-border-radius` carries
  through; leave it out and you still get Bootstrap's default look.
- **Bootstrap's dark mode.** `data-bs-theme="dark"` switches the skin, as do
  Uniskin's `.dark` and `[data-theme="dark"]` and `prefers-color-scheme`.
- **Accessibility checked.** The same axe, contrast and keyboard tests as the
  other skins pass in light and dark.

## Where it differs from stock Bootstrap, on purpose

Uniskin holds every skin to WCAG 2.2 AA, and a few of Bootstrap's own values
fall short, so this adapter adjusts them:

- **Form-control borders** are a stronger grey than Bootstrap's `#dee2e6`
  (1.3:1 on white), so a control's boundary reaches 3:1 (WCAG 1.4.11).
- **Focus rings** are solid (a surface-colour gap, then the ring colour) at
  Bootstrap's 0.25rem size, instead of a translucent glow that is about 1.4:1.
- **Intent text** on a light page uses Bootstrap's darker `active` shades
  (for example `#0a58ca`, `#146c43`, `#b02a37`) so coloured text and outline
  buttons stay at 4.5:1.
- **Disabled form controls** dim to 50% like `.form-check-input:disabled`.

## Documentation

- [Vocabulary reference](https://github.com/Munawarhussain729/uniskin/blob/main/docs/vocabulary.md)
- [Writing adapters](https://github.com/Munawarhussain729/uniskin/blob/main/docs/writing-adapters.md)
- [Stability policy](https://github.com/Munawarhussain729/uniskin/blob/main/docs/stability.md)

## License

MIT
