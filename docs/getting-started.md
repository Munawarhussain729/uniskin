# Getting started

This guide takes a fresh Tailwind CSS v4 project to a styled `ui-button` in
one CSS file. Verified end-to-end against tailwindcss **4.3.5** (any 4.x ≥
**4.3.3** works — see [Compatibility](#compatibility)).

## Prerequisites

- A project using **tailwindcss ≥ 4.3.3** (v4 plugin API; this does not work
  on Tailwind v3).
- A CSS entry file compiled by Tailwind — via `@tailwindcss/cli`, Vite
  (`@tailwindcss/vite`), or your framework's Tailwind integration.

## 1. Install

```sh
pnpm add uniskin            # core plugin + built-in default skin
pnpm add @uniskin/shadcn    # optional: shadcn/ui skin
pnpm add @uniskin/daisyui   # optional: daisyUI skin
pnpm add @uniskin/bootstrap  # optional: Bootstrap 5.3 skin
```

Only `uniskin` is required. `@uniskin/daisyui` works standalone — installing
the `daisyui` package itself is optional and only needed if you want the
adapter to follow your active daisyUI theme (it maps onto daisyUI's
`--color-*` variables; without it, bundled fallbacks render the daisyUI
light look). `@uniskin/bootstrap` also works standalone: it carries
Bootstrap's own values and follows `--bs-*` and `data-bs-theme` when
Bootstrap's stylesheet is loaded too.

## 2. Enable the plugin

In your Tailwind entry CSS:

```css
@import "tailwindcss";
@plugin "uniskin" { adapter: "shadcn"; }
```

`adapter` accepts:

- `"default"` — the built-in skin (also the value when the option is omitted);
- `"shadcn"`, `"daisyui"` or `"bootstrap"` — the published adapters;
- any package name — shorthand resolves `name`, `@uniskin/name`, then
  `uniskin-adapter-name`;
- a path like `"./my-adapter.js"` — resolved **relative to the stylesheet
  that declares `@plugin`**, not the project root.

That's it — markup needs nothing else:

```html
<button class="ui-button ui-primary ui-outline ui-sm">Save</button>
```

Classes are emitted on demand from Tailwind's automatic content detection.
If your templates live in a file type Tailwind doesn't scan, add an explicit
[`@source`](https://tailwindcss.com/docs/functions-and-directives#source-directive).

## 3. Options

```css
@plugin "uniskin" {
  adapter: "daisyui";
  prefix: "uk";        /* uk-button, uk-input, … */
  dark: "media";       /* "media" (default) | "class" | false */
  debug: false;        /* true: list every default-style fallback */
}
```

| Option | Values | Effect |
|---|---|---|
| `adapter` | `"default"`, package name, or path | Which skin to use; everything the adapter omits falls back to the default theme. |
| `prefix` | string, default `"ui"` | Namespaces every class: `prefix: "uk"` → `uk-button`. |
| `dark` | `"media"` (default), `"class"`, `false` | How dark-mode tokens are emitted (below). |
| `debug` | `true`, `false` (default) | Print the full list of modifier combinations an adapter leaves to the default style. Also enabled by `UNISKIN_DEBUG=1`. Built-in adapters are otherwise silent; other adapters print one summary line. |

### Dark mode

The skin emits dark design tokens under `.dark` and `[data-theme="dark"]`
selectors, so both class-based and attribute-based theme toggles work:

- `"media"` (default): dark tokens also apply inside
  `@media (prefers-color-scheme: dark)` — opt out per user by adding
  `.light` / `[data-theme="light"]` to `<html>`.
- `"class"`: only `.dark` / `[data-theme="dark"]` — you toggle it yourself.
- `false`: no dark tokens at all.

A minimal class toggle:

```js
document.documentElement.classList.toggle("dark", wantsDark);
document.documentElement.dataset.theme = wantsDark ? "dark" : "light";
```

## 4. A first page

States double as the native attributes — prefer the attribute so the state
is both styled and announced:

```html
<button class="ui-button ui-primary">Save</button>
<button class="ui-button ui-primary" disabled>Can't click</button>
<button class="ui-button ui-secondary" aria-busy="true">Loading</button>

<input class="ui-input" placeholder="Email" aria-label="Email" />
```

Tabs and modal style the semantics you provide — `role`/`aria-selected` on
tabs, a native `<dialog>` for the modal (free Esc-close and focus
containment):

```html
<div class="ui-tabs" role="tablist">
  <button class="ui-tab" role="tab" aria-selected="true">General</button>
  <button class="ui-tab" role="tab" aria-selected="false">Billing</button>
</div>

<button id="open" class="ui-button ui-primary">Open</button>
<dialog class="ui-modal" aria-label="Confirm">
  <div class="ui-modal-box">
    <form method="dialog"><button class="ui-button ui-danger">OK</button></form>
  </div>
</dialog>
<script>open.onclick = () => document.querySelector(".ui-modal").showModal()</script>
```

The full vocabulary and per-component accessibility requirements (e.g.
roving tabindex / arrow keys for real tablists) are in
[docs/vocabulary.md](vocabulary.md).

## Compatibility

**tailwindcss ≥ 4.3.3.** Older 4.x releases compile but are unsupported:
they serialize plugin utilities differently, and 4.0.0 does not forward the
`@plugin` source location uniskin needs to resolve relative adapter paths.

## Troubleshooting

**`Error: [uniskin] Could not resolve adapter "…"`** — a path adapter is
resolved relative to the stylesheet that declares `@plugin`, not the project
root. If your entry CSS lives in `styles/`, `"./my-adapter.js"` must be
`styles/my-adapter.js` (or use `"../my-adapter.js"` for the root). A bare
name resolves `name`, `@uniskin/name`, `uniskin-adapter-name` in that order —
check the package is actually installed.

**`[uniskin] adapter "…" does not define: …`** — a dev-build warning listing
the slots the adapter doesn't cover. It's informational: those components
fall back to the default skin. It is not printed in production builds.

**Classes missing from the output** — `ui-*` classes are emitted only for
markup Tailwind scans. Confirm the file type is covered by automatic content
detection or add `@source`.

**Tailwind v3 / < 4.3.3** — `@plugin` options and the resolution behaviour
above require Tailwind v4.3.3+.

## Next steps

- [docs/vocabulary.md](vocabulary.md) — every class, modifier and a11y note.
- [docs/writing-adapters.md](writing-adapters.md) — write your own skin.
