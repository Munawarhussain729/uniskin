# uniskin

One semantic class vocabulary, swappable Tailwind CSS v4 UI skins.

**1.0:** the public surface is stable under semver ([policy](https://github.com/Munawarhussain729/uniskin/blob/main/docs/stability.md), [upgrading from 0.x](https://github.com/Munawarhussain729/uniskin/blob/main/docs/migrating.md)).

[Live demo](https://uniskin-css.vercel.app) · [Skin builder](https://uniskin-css.vercel.app/builder/) · [GitHub](https://github.com/Munawarhussain729/uniskin)

Write `ui-button ui-primary` once, in plain HTML, React, Vue, PHP or anything
else. Pick an **adapter** in your CSS to decide how it looks: the built-in
default, a shadcn/ui look, a daisyUI look, or your own. Switching adapters
needs **zero markup changes**. The output is CSS only, with no runtime
JavaScript.

```css
@import "tailwindcss";
@plugin "uniskin" { adapter: "shadcn"; }   /* or "daisyui", or "./my-adapter.js" */
```

```html
<button class="ui-button ui-primary ui-outline ui-sm">Save</button>
```

## Install

The quickest way is the CLI. It detects your package manager and Tailwind v4
stylesheet, installs the packages and adds the `@plugin` line for you:

```sh
npx uniskin init
# or choose the skin up front
npx uniskin init --adapter shadcn --yes
```

Or install by hand:

```sh
npm install uniskin                 # core plugin + built-in default skin
npm install @uniskin/shadcn         # optional: shadcn/ui look
npm install @uniskin/daisyui daisyui  # optional: daisyUI look
```

Then add the `@plugin` line to your Tailwind entry CSS (see above).

Requires **tailwindcss 4.3.3 or newer**, on Node 20 or 22.

## Plugin options

```css
@plugin "uniskin" {
  adapter: "shadcn";   /* "default" | "shadcn" | "daisyui" | package name | "./path.js" */
  prefix: "ui";        /* class prefix: ui-button, or uk-button with prefix "uk" */
  dark: "media";       /* "media" | "class" | false */
}
```

| Option    | Default     | What it does |
|-----------|-------------|--------------|
| `adapter` | `"default"` | Which skin to use. A relative path or package name resolves from the stylesheet that declared `@plugin`. |
| `prefix`  | `"ui"`      | Class prefix for every class and keyframe. |
| `dark`    | `"media"`   | `"media"`: `.dark` / `[data-theme="dark"]` plus `prefers-color-scheme: dark`. `"class"`: only the class or attribute. `false`: no dark tokens. |
| `debug`   | `false`     | Print the full list of slots an adapter leaves to the default style. Also enabled by `UNISKIN_DEBUG=1`. |

## Vocabulary

| Kind       | Classes |
|------------|---------|
| Components | `ui-button`, `ui-input`, `ui-textarea`, `ui-select`, `ui-checkbox`, `ui-radio`, `ui-switch`, `ui-field`, `ui-card`, `ui-badge`, `ui-alert`, `ui-modal`, `ui-tabs`, `ui-table`, `ui-accordion`, `ui-progress`, `ui-tooltip`, `ui-toast`, `ui-dropdown`, `ui-menu`, `ui-avatar`, `ui-skeleton`, `ui-separator`, `ui-breadcrumb`, `ui-pagination`, `ui-slider` |
| Parts      | `ui-field-label`, `ui-field-hint`, `ui-field-error`, `ui-card-header`, `ui-card-body`, `ui-card-footer`, `ui-modal-box`, `ui-tab`, `ui-table-wrap`, `ui-accordion-item`, `ui-accordion-trigger`, `ui-accordion-panel`, `ui-tooltip-anchor`, `ui-toast-region`, `ui-menu-item`, `ui-menu-label`, `ui-menu-separator`, `ui-pagination-item` |
| Intent     | `ui-primary`, `ui-secondary`, `ui-success`, `ui-warning`, `ui-danger` |
| Style      | `ui-outline`, `ui-ghost`, `ui-soft` (solid is the default) |
| Size       | `ui-sm`, `ui-lg` (medium is the default) |
| State      | `ui-disabled`, `ui-loading`, `ui-active` |

- Intents and styles combine freely: `ui-danger ui-outline`.
- Modifiers compile to compound selectors (`.ui-button.ui-primary`), so
  `ui-outline` on a button and on a card can look completely different.
- States also style their native equivalents: `ui-disabled` matches
  `:disabled` and `[aria-disabled="true"]`, `ui-loading` matches
  `[aria-busy="true"]`, `ui-active` matches `[aria-selected="true"]` and
  `[aria-pressed="true"]`.
- Every interactive component has `:focus-visible` styling, and animations
  respect `prefers-reduced-motion`.

Classes are emitted on demand from Tailwind's automatic content detection, the
same scanning that finds `p-4` finds `ui-button`. Per-component markup,
modifiers and accessibility notes are in the
[vocabulary reference](https://github.com/Munawarhussain729/uniskin/blob/main/docs/vocabulary.md).

## Write your own adapter

An adapter overrides only what it wants; everything else falls back to the
default skin.

```ts
// my-adapter.ts
import { defineAdapter } from "uniskin/adapter";

export default defineAdapter({
  name: "acme",
  tokens: { "--ui-primary": "rebeccapurple" },
  components: {
    button: {
      base: { "border-radius": "999px" },
      styles: { outline: { "border-width": "2px" } },
    },
  },
});
```

```css
@plugin "uniskin" { adapter: "./my-adapter.ts"; }
```

`npx uniskin new-adapter <name>` scaffolds one, and `checkAdapter` from
`uniskin/conformance` reports which components and modifiers an adapter still
leaves to the default skin. See the
[adapter guide](https://github.com/Munawarhussain729/uniskin/blob/main/docs/writing-adapters.md).

## Documentation

- [Getting started](https://github.com/Munawarhussain729/uniskin/blob/main/docs/getting-started.md)
- [CLI reference](https://github.com/Munawarhussain729/uniskin/blob/main/docs/cli.md)
- [Vocabulary reference](https://github.com/Munawarhussain729/uniskin/blob/main/docs/vocabulary.md)
- [Writing adapters](https://github.com/Munawarhussain729/uniskin/blob/main/docs/writing-adapters.md)
- [Stability and support policy](https://github.com/Munawarhussain729/uniskin/blob/main/docs/stability.md)
- [Upgrading to 1.0](https://github.com/Munawarhussain729/uniskin/blob/main/docs/migrating.md)
- [Changelog](https://github.com/Munawarhussain729/uniskin/blob/main/packages/uniskin/CHANGELOG.md)

## License

MIT
