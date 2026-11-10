# @uniskin/radix

The Radix Themes look for [uniskin](https://www.npmjs.com/package/uniskin):
the `ui-*` class vocabulary styled like Radix Themes, as pure CSS. No React, no Radix primitives, no `<Theme>` wrapper, and no JavaScript.

```css
@import "tailwindcss";
@plugin "uniskin" { adapter: "radix"; }
```

```html
<button class="ui-button ui-primary">Save</button>
<button class="ui-button ui-danger ui-outline">Delete</button>
```

**1.0:** stable under semver; this adapter depends on `uniskin` at `^1.0.0`.

## Install

```sh
npx uniskin init --adapter radix --yes
```

or by hand:

```sh
npm install uniskin @uniskin/radix
```

and add the `@plugin` line shown above to your Tailwind v4 entry CSS.

## What you get

- **The whole vocabulary.** Every component and every documented modifier is
  defined for Radix Themes, not left to the default skin: `checkAdapter` from
  `uniskin/conformance` reports 297 of 297 combinations.
- **Radix Themes' own look.** 32px buttons and text fields at size 2, the
  12px/14px/16px type scale, `radius-2` to `radius-4`, the surface Card, the
  soft Badge and Callout, the dark-gray Tooltip, DropdownMenu with its solid
  accent highlight, Tabs with the 2px rule, and the 6px Progress and Slider.
- **Follows your Radix scales.** Colours are Radix's 12-step scales, read as
  `var(--blue-9, #3e63dd)` and so on, with the Radix value as the fallback:
  load Radix Themes' stylesheet (or override `--blue-9`) and the skin follows;
  leave it out and you get the default Radix look. Steps keep their Radix
  roles: 3 soft background, 9 solid fill, 10 hover, 11 text, 12 high-contrast
  text, 6 borders.
- **Radix's dark mode.** `.dark` and `.dark-theme` (also
  `[data-theme="dark"]` and `prefers-color-scheme`).
- **Accessibility checked.** The same axe, contrast and keyboard tests as the
  other skins pass in light and dark.

## Where it differs from stock Radix Themes, on purpose

Uniskin holds every skin to WCAG 2.2 AA, and Radix's scales are tuned for APCA
contrast, which is more lenient than WCAG in places, so this adapter adjusts a
few values:

- **Solid green and red** use step 11 (light) because step 9 is 3.1:1 and 4.0:1
  with white text; in dark mode they take dark text on step 9 and 10.
- **Soft success and warning text** use step 12 on the step 3 tint (4.2:1 at
  step 11), and warning text on a light page is step 12.
- **Text-field borders** are a stronger grey than Radix's inset `gray-a7`
  (about 1.7:1), so a control's boundary reaches 3:1 (WCAG 1.4.11).
- **Focus rings** keep Radix's 2px accent but use the solid step 9 / 11 after
  a gap, instead of step 8 (about 2.4:1).
- **Disabled controls** dim to 50%.

Radix Themes has no Accordion, Toast, Breadcrumb, Pagination, Skeleton-as-a-
class or Slider track fill markup of this shape (some are separate Radix
primitives); those are themed from the same scales so they sit with the rest.

## Documentation

- [Vocabulary reference](https://github.com/Munawarhussain729/uniskin/blob/main/docs/vocabulary.md)
- [Writing adapters](https://github.com/Munawarhussain729/uniskin/blob/main/docs/writing-adapters.md)
- [Stability policy](https://github.com/Munawarhussain729/uniskin/blob/main/docs/stability.md)

## License

MIT
