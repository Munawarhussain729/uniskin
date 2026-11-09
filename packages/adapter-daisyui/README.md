# @uniskin/daisyui

The daisyUI look for [uniskin](https://www.npmjs.com/package/uniskin): the
`ui-*` class vocabulary styled from your live daisyUI theme variables, as pure
CSS.

```css
@import "tailwindcss";
@plugin "daisyui";
@plugin "uniskin" { adapter: "daisyui"; }
```

```html
<button class="ui-button ui-primary">Save</button>
<button class="ui-button ui-danger ui-outline">Delete</button>
```

## Install

```sh
npx uniskin init --adapter daisyui --yes
```

or by hand:

```sh
npm install uniskin @uniskin/daisyui daisyui
```

and add the two `@plugin` lines shown above to your Tailwind v4 entry CSS.
`daisyui` is an optional peer dependency: the adapter uses the live daisyUI
theme variables when they are present, and sensible fallbacks when they are
not.

Requires **tailwindcss 4.3.3 or newer** and the `uniskin` core package.

## What you get

- Every uniskin component restyled from daisyUI's theme tokens: button, input,
  textarea, select, checkbox, radio, switch, field, card, badge, alert, modal
  and tabs.
- Your daisyUI themes apply automatically: tokens re-resolve on every
  `[data-theme]` element, so switching themes just works.
- Form-control boundaries and error text tuned to meet WCAG contrast
  (3:1 for borders, 4.5:1 for text).
- Anything this adapter doesn't override falls back to the uniskin default
  skin, so the whole vocabulary always works.

## Customise

Write your own adapter on top of this one. See the uniskin
[adapter guide](https://github.com/Munawarhussain729/uniskin/blob/main/docs/writing-adapters.md)
and the [vocabulary reference](https://github.com/Munawarhussain729/uniskin/blob/main/docs/vocabulary.md).

## License

MIT
