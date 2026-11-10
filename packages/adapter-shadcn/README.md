# @uniskin/shadcn

The shadcn/ui look for [uniskin](https://www.npmjs.com/package/uniskin): the
`ui-*` class vocabulary styled like shadcn/ui, as pure CSS. No React, no
Radix, no JavaScript.

```css
@import "tailwindcss";
@plugin "uniskin" { adapter: "shadcn"; }
```

```html
<button class="ui-button ui-primary">Save</button>
<button class="ui-button ui-danger ui-outline">Delete</button>
```

## Install

```sh
npx uniskin init --adapter shadcn --yes
```

or by hand:

```sh
npm install uniskin @uniskin/shadcn
```

and add the `@plugin` line shown above to your Tailwind v4 entry CSS.

Requires **tailwindcss 4.3.3 or newer** and the `uniskin` core package.

**1.0:** stable under semver; this adapter depends on `uniskin` at `^1.0.0`.

## What you get

- Every uniskin component restyled with shadcn's neutral palette, radius and
  focus ring: the whole vocabulary,
  from buttons and form controls to tables, accordions, tooltips, toasts, menus,
  pagination and sliders.
- A dark palette, active with `.dark`, `[data-theme="dark"]` or
  `prefers-color-scheme: dark`.
- Form-control boundaries and error text tuned to meet WCAG contrast
  (3:1 for borders, 4.5:1 for text).
- Anything this adapter doesn't override falls back to the uniskin default
  skin, so the whole vocabulary always works.

## Customise

Override any token in your own CSS, or write your own adapter on top of this
one. See the uniskin
[adapter guide](https://github.com/Munawarhussain729/uniskin/blob/main/docs/writing-adapters.md)
and the [vocabulary reference](https://github.com/Munawarhussain729/uniskin/blob/main/docs/vocabulary.md).

## License

MIT
