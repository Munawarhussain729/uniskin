# @uniskin/flowbite

The Flowbite look for [uniskin](https://www.npmjs.com/package/uniskin):
the `ui-*` class vocabulary styled like Flowbite, as pure CSS. No Flowbite package or Flowbite JavaScript, and no runtime JavaScript.

```css
@import "tailwindcss";
@plugin "uniskin" { adapter: "flowbite"; }
```

```html
<button class="ui-button ui-primary">Save</button>
<button class="ui-button ui-danger ui-outline">Delete</button>
```

**1.0:** stable under semver; this adapter depends on `uniskin` at `^1.0.0`.

## Install

```sh
npx uniskin init --adapter flowbite --yes
```

or by hand:

```sh
npm install uniskin @uniskin/flowbite
```

and add the `@plugin` line shown above to your Tailwind v4 entry CSS.

## What you get

- **The whole vocabulary.** Every component and every documented modifier is
  defined for Flowbite, not left to the default skin: `checkAdapter` from
  `uniskin/conformance` reports 297 of 297 combinations.
- **Flowbite's own look.** `px-5 py-2.5 rounded-lg` buttons, `bg-gray-50`
  inputs, `bg-*-50` alerts and `bg-*-100` badges, `h-2.5` progress, the dark
  `bg-gray-900` tooltip, `w-44` dropdown menus, `h-8` pagination and the blue
  active tab.
- **Follows your Tailwind theme.** Flowbite is Tailwind utilities, so its
  tokens are Tailwind's palette. Every colour is a `var(--color-*)` with the
  palette value as the fallback: override `--color-blue-700` in your `@theme`
  and the skin follows; leave it alone and you get Flowbite's default blue.
- **Flowbite's dark mode.** The `.dark` class (also `[data-theme="dark"]`
  and `prefers-color-scheme`): gray-800 surfaces, `*-900` tints with `*-300`
  text and blue-600 fills.
- **Accessibility checked.** The same axe, contrast and keyboard tests as the
  other skins pass in light and dark.

## Where it differs from stock Flowbite, on purpose

Uniskin holds every skin to WCAG 2.2 AA, and a few Flowbite values fall
short, so this adapter adjusts them:

- **Form-control borders** are a stronger grey than `gray-300` (1.5:1 on
  white), so a control's boundary reaches 3:1 (WCAG 1.4.11).
- **Focus rings** keep Flowbite's 4px size but are solid, after a gap, instead
  of the pale `ring-blue-300` (about 1.7:1).
- **Intent text** on a light page uses the 700 and 800 shades so coloured
  text stays at 4.5:1; Flowbite's yellow is a fill only, and its text colour
  is `yellow-800`.
- **Disabled controls** dim to 50%.

## Documentation

- [Vocabulary reference](https://github.com/Munawarhussain729/uniskin/blob/main/docs/vocabulary.md)
- [Writing adapters](https://github.com/Munawarhussain729/uniskin/blob/main/docs/writing-adapters.md)
- [Stability policy](https://github.com/Munawarhussain729/uniskin/blob/main/docs/stability.md)

## License

MIT
