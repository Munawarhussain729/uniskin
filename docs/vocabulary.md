# Vocabulary reference

Every class in Uniskin vocabulary v1.1, grouped by component. The prefix is
`ui-` by default — if you set `prefix: "uk"` in the `@plugin` options,
read every `ui-*` class below as `uk-*`.

Classes are emitted on demand by Tailwind's automatic content detection
and modifiers compile to compound selectors (`.ui-button.ui-primary`),
so the same modifier can mean different things on different components.

## Modifier kinds

| Kind   | Classes | Omitted means |
|--------|---------|---------------|
| Intent | `ui-primary`, `ui-secondary`, `ui-success`, `ui-warning`, `ui-danger` | neutral |
| Style  | `ui-outline`, `ui-ghost`, `ui-soft` | solid |
| Size   | `ui-sm`, `ui-lg` | md |
| State  | `ui-disabled`, `ui-loading`, `ui-active` | — |

Intents and styles combine freely — `ui-danger ui-outline` needs no
special rule. Intents set the `--ui-c*` accent variables on the element;
styles map those variables to real properties. Not every component
supports every modifier; each section below lists exactly what applies.

## States and their native equivalents

Per [decision 002](decisions/002-vocabulary-modifiers-and-state.md),
each state class is emitted together with its native-attribute
selectors, so either form produces the same styling:

| Class         | Also matches |
|---------------|--------------|
| `ui-disabled` | `:disabled`, `[aria-disabled="true"]` |
| `ui-loading`  | `[aria-busy="true"]` |
| `ui-active`   | `[aria-selected="true"]`, `[aria-pressed="true"]` |

Prefer the attribute whenever the element supports it — the same state
is then both styled and accessible. The class exists for elements with
no native equivalent (a `<div>` modal, an `<a>` button) and for
imperative toggling from JS.

## Components

### `ui-button`

Action element — `<button>`, `<a>`, or `<input type="submit">`.

```html
<button class="ui-button ui-primary">Save</button>
<button class="ui-button ui-danger ui-outline ui-sm">Delete</button>
<a class="ui-button ui-ghost" href="/docs">Docs</a>
```

- **Intents:** all five; unset is neutral.
- **Styles:** `ui-outline` (bordered, fills on hover), `ui-ghost`
  (transparent, soft tint on hover), `ui-soft` (tinted background).
- **Sizes:** `ui-sm`, `ui-lg`.
- **States:** `ui-disabled`, `ui-loading` (spinner via `::after`),
  `ui-active` (pressed inset).
- **Native equivalents:** `:disabled`, `[aria-disabled="true"]`,
  `[aria-busy="true"]`, `[aria-pressed="true"]`. `ui-loading` also
  disables pointer events; pair it with `aria-busy="true"` for
  assistive tech.
- Every variant has `:focus-visible` ring styling.

### `ui-input`

Single-line text field — `<input>` (text, email, number, …).

```html
<input class="ui-input" placeholder="you@example.com" />
<input class="ui-input ui-danger ui-sm" value="bad value" />
```

- **Intents:** all five; tint the border and the focus ring.
- **Styles:** `ui-outline` (accent border), `ui-ghost` (borderless until
  focus), `ui-soft` (filled background).
- **Sizes:** `ui-sm`, `ui-lg`.
- **States:** `ui-disabled`, `ui-loading`, `ui-active`.
- **Native equivalents:** `:disabled`, `[aria-disabled="true"]`,
  `[aria-busy="true"]`, `[aria-selected="true"]`.

### `ui-textarea`

Multiline text field — `<textarea>`. Same contract as `ui-input`, with a
default `min-height` and vertical resize.

```html
<textarea class="ui-textarea ui-soft ui-lg" rows="4"></textarea>
```

- **Intents / styles / sizes / states:** identical to `ui-input`.
- **Native equivalents:** identical to `ui-input`.

### `ui-select`

Dropdown — `<select>`. Renders an inline chevron (no extra markup), so
keep the element's own `<option>` children.

```html
<select class="ui-select ui-primary">
  <option>Small</option>
  <option>Large</option>
</select>
```

- **Intents / styles / sizes / states:** identical to `ui-input`; the
  size modifiers also adjust the chevron padding.
- **Native equivalents:** identical to `ui-input`.
- **Listbox selects:** `<select multiple>` and `<select size="N">` (N > 1)
  render as a list, so the chevron is dropped and the element grows to
  fit its rows. `<optgroup>` and `<option>` keep the browser's own
  styling; Uniskin does not restyle the popup.

### `ui-checkbox`

Native checkbox restyled — `<input type="checkbox">`. The check mark is
drawn with `::after`; no wrapper needed.

```html
<label>
  <input type="checkbox" class="ui-checkbox ui-success" checked />
  Subscribe
</label>
```

- **Intents:** all five; set the checked fill color.
- **Styles:** `ui-outline` (accent border, mark drawn in the accent
  color), `ui-ghost` / `ui-soft` (muted box, soft fill when checked).
- **Sizes:** `ui-sm`, `ui-lg` (box size via `--ui-check-size`).
- **States:** `ui-disabled`, `ui-loading`, `ui-active`.
- **Native equivalents:** `:disabled`, `[aria-disabled="true"]`,
  `[aria-busy="true"]`. Checked and indeterminate styling comes from the
  real `:checked` / `:indeterminate` pseudo-classes — no extra classes.
- **Headless checkboxes:** `<button role="checkbox" aria-checked="true">`
  (or `"mixed"`) renders checked / indeterminate too, so Radix, Ark and
  similar libraries work without extra classes. The library owns the
  click and Space handling.
- **Indeterminate needs JS:** no HTML attribute sets `:indeterminate`;
  it only exists as a DOM property, so set it from script:
  `input.indeterminate = true`. It clears when the user toggles the box
  and has no effect on the submitted value.

### `ui-radio`

Native radio restyled — `<input type="radio">`. The dot is drawn with
`::after`; no wrapper needed. Put the class on the **input**, not on a
`<label>`.

```html
<fieldset>
  <legend>Plan</legend>
  <label><input type="radio" name="plan" class="ui-radio ui-primary" checked /> Free</label>
  <label><input type="radio" name="plan" class="ui-radio ui-primary" /> Pro</label>
</fieldset>
```

- **Intents:** all five; set the checked fill color.
- **Styles:** `ui-outline` (accent border, dot in the accent color),
  `ui-ghost` / `ui-soft` (muted circle, soft fill when checked).
- **Sizes:** `ui-sm`, `ui-lg` (circle size via `--ui-radio-size`, dot
  size via `--ui-radio-dot-size`, dot color via `--ui-radio-dot`).
- **States:** `ui-disabled`, `ui-loading`, `ui-active`.
- **Native equivalents:** `:checked`, `:disabled`,
  `[aria-disabled="true"]`, `[aria-busy="true"]`, and
  `[aria-checked="true"]` for `<button role="radio">` from a headless
  library.
- **You provide:** a shared `name`, a visible label (wrapping `<label>`
  or `for`) and a group label (`<fieldset>` + `<legend>`, or
  `role="radiogroup"` with `aria-labelledby`). Single selection, one tab
  stop and arrow-key movement are native for same-`name` inputs; for
  `role="radio"` buttons the library owns roving tabindex and arrows.

### `ui-card`, `ui-card-header`, `ui-card-body`, `ui-card-footer`

Content container with optional header/body/footer parts. `ui-card` is
the flex column; the part classes are padding/separator primitives that
read `--ui-card-pad`, so `ui-sm`/`ui-lg` on the card scales all three.

```html
<section class="ui-card ui-lg">
  <header class="ui-card-header">Invoice</header>
  <div class="ui-card-body">Line items…</div>
  <footer class="ui-card-footer">
    <button class="ui-button ui-primary ui-sm">Pay</button>
  </footer>
</section>
```

- **`ui-card` intents:** all five; tint the border (`--ui-card-border`).
- **`ui-card` styles:** `ui-outline` (accent border, no shadow),
  `ui-ghost` (fully transparent), `ui-soft` (soft tinted fill).
- **`ui-card` sizes:** `ui-sm`, `ui-lg` — scale part padding and font.
- **`ui-card` states:** `ui-disabled`, `ui-loading`, `ui-active`
  (accent ring — useful for selectable cards).
- **Parts:** `ui-card-header`, `ui-card-body`, `ui-card-footer` take no
  modifiers.
- **Native equivalents:** `[aria-disabled="true"]`, `[aria-busy="true"]`,
  `[aria-selected="true"]` — a `<section>` has no `:disabled`.

### `ui-badge`

Inline status label — `<span>`.

```html
<span class="ui-badge ui-success">Paid</span>
<span class="ui-badge ui-danger ui-outline ui-sm">Overdue</span>
```

- **Intents:** all five.
- **Styles:** `ui-outline`, `ui-ghost`, `ui-soft`.
- **Sizes:** `ui-sm`, `ui-lg`.
- **States:** `ui-disabled`, `ui-loading`, `ui-active`.
- **Native equivalents:** `[aria-disabled="true"]`, `[aria-busy="true"]`,
  `[aria-selected="true"]` / `[aria-pressed="true"]` (e.g. a toggleable
  `<button class="ui-badge" aria-pressed="true">`).

### `ui-alert`

Contextual message block — `<div>` or any flow element. Default
(solid) fills with the intent color; use `role="alert"` /
`aria-live` as appropriate.

```html
<div class="ui-alert ui-warning ui-soft" role="alert">
  Trial ends in 3 days.
</div>
```

- **Intents:** all five; drive background, border and text color.
- **Styles:** `ui-outline` (surface background, intent border),
  `ui-ghost` (transparent, intent-colored text), `ui-soft` (soft tint).
- **Sizes:** `ui-sm`, `ui-lg`.
- **States:** `ui-disabled`, `ui-loading`, `ui-active`.
- **Native equivalents:** `[aria-disabled="true"]`, `[aria-busy="true"]`.

### `ui-modal`, `ui-modal-box`

Overlay plus dialog panel. `ui-modal` is the fixed full-screen overlay;
`ui-modal-box` is the centered panel inside it. The overlay supports
three open mechanisms — a native `<dialog open>` (or `showModal()`), a
CSS `:target`, or `ui-active` on any element:

```html
<dialog class="ui-modal" id="confirm">
  <div class="ui-modal-box">
    <p>Delete this file?</p>
    <form method="dialog">
      <button class="ui-button ui-danger ui-sm">Delete</button>
      <button class="ui-button ui-ghost ui-sm">Cancel</button>
    </form>
  </div>
</dialog>
```

```html
<!-- CSS-only: opens while #confirm is the URL fragment target -->
<a href="#confirm">Open</a>
<div class="ui-modal" id="confirm">
  <div class="ui-modal-box">
    <a href="#">Close</a>
  </div>
</div>
```

- **`ui-modal` styles:** `ui-ghost` (transparent overlay),
  `ui-soft` (light overlay + backdrop blur). No `ui-outline` — an
  overlay has no border to outline.
- **`ui-modal` sizes:** `ui-sm`, `ui-lg` — set the box width via
  `--ui-modal-w` (default 32rem).
- **`ui-modal` states:** `ui-active` — shows a non-`<dialog>` overlay.
  (`disabled`/`loading` are not meaningful here.)
- **`ui-modal-box` intents:** all five; paint a colored accent bar on
  the top edge.
- **`ui-modal-box` sizes:** `ui-sm`, `ui-lg` — padding and font size.
- See [Accessibility → `ui-modal`](#ui-modal-1) for the behavior you
  must add when not using `<dialog>`.

### `ui-tabs`, `ui-tab`

Tab strip. `ui-tabs` is the `role="tablist"` container (bottom border,
gap); `ui-tab` goes on each `role="tab"` button. Active-tab styling is
driven entirely by the `ui-active` state selectors, so
`aria-selected="true"` needs no extra class.

```html
<div class="ui-tabs ui-soft" role="tablist">
  <button class="ui-tab" role="tab" aria-selected="true">General</button>
  <button class="ui-tab" role="tab" aria-selected="false">Billing</button>
  <button class="ui-tab ui-disabled" role="tab" aria-disabled="true">Admin</button>
</div>
```

- **`ui-tabs` intents:** all five; set the accent color the active tab
  reads via `--ui-c`.
- **`ui-tabs` styles:** default = underline; `ui-outline` = boxed tab,
  `ui-soft` = pill, `ui-ghost` = colored text only. The style is set on
  the container, not per tab.
- **`ui-tabs` sizes:** `ui-sm`, `ui-lg` — set `--ui-tab-*` padding/font
  vars the tabs inherit.
- **`ui-tab` intents / sizes:** all five / `ui-sm`, `ui-lg`, for
  overriding a single tab.
- **`ui-tab` states:** `ui-disabled`, `ui-loading`, `ui-active`.
- **Native equivalents:** `:disabled`, `[aria-disabled="true"]`,
  `[aria-busy="true"]`, `[aria-selected="true"]`.
- See [Accessibility → `ui-tabs`](#ui-tabs-1) — CSS does not give you
  tab semantics or arrow-key navigation.

## Coverage matrix

Supported modifiers in the built-in default skin (adapters may cover
fewer — anything omitted falls back to the default):

| Component        | Intents | Styles | Sizes | States |
|------------------|:-------:|:------:|:-----:|:------:|
| `ui-button`      | ✓ | outline ghost soft | ✓ | disabled loading active |
| `ui-input`       | ✓ | outline ghost soft | ✓ | disabled loading active |
| `ui-textarea`    | ✓ | outline ghost soft | ✓ | disabled loading active |
| `ui-select`      | ✓ | outline ghost soft | ✓ | disabled loading active |
| `ui-checkbox`    | ✓ | outline ghost soft | ✓ | disabled loading active |
| `ui-radio`       | ✓ | outline ghost soft | ✓ | disabled loading active |
| `ui-card`        | ✓ | outline ghost soft | ✓ | disabled loading active |
| `ui-card-header` | — | — | — | — |
| `ui-card-body`   | — | — | — | — |
| `ui-card-footer` | — | — | — | — |
| `ui-badge`       | ✓ | outline ghost soft | ✓ | disabled loading active |
| `ui-alert`       | ✓ | outline ghost soft | ✓ | disabled loading active |
| `ui-modal`       | — | ghost soft | ✓ | active |
| `ui-modal-box`   | ✓ | — | ✓ | — |
| `ui-tabs`        | ✓ | outline ghost soft | ✓ | — |
| `ui-tab`         | ✓ | — | ✓ | disabled loading active |

## Accessibility

Uniskin is CSS only — it styles semantics, it does not create them.
These two components need behavior you must add yourself (or delegate
to a JS library; see the recipes below).

### `ui-modal`

**Preferred: native `<dialog>`.** Put `ui-modal` on a `<dialog>` element
and open it with `showModal()`. You get, for free, what a `<div>` can
never do:

- top-layer rendering (no `z-index` fights), Esc-to-close, and focus
  containment;
- a built-in `open` attribute Uniskin already styles (`&[open]`), and
  `method="dialog"` forms that close it without JS;
- `::backdrop` — Uniskin keeps it transparent since `ui-modal` *is* the
  backdrop.

```html
<dialog class="ui-modal">
  <div class="ui-modal-box ui-sm">
    <h2>Confirm</h2>
    <form method="dialog">
      <button class="ui-button ui-primary">OK</button>
    </form>
  </div>
</dialog>
<script>
  document.querySelector("dialog.ui-modal").showModal();
</script>
```

**If you use `<div class="ui-modal ui-active">`, you must add:**

- `role="dialog"` and `aria-modal="true"` on `ui-modal-box`, plus
  `aria-labelledby`/`aria-label` naming the dialog;
- focus management: move focus into the box on open, trap it while
  open, restore it on close;
- an Escape-key handler and a visible close control;
- `inert` or `aria-hidden` on the page behind the overlay.

The `:target` trick is fine for demos but is not accessible — no focus
management, and the URL fragment leaks into history.

### `ui-tabs`

`ui-tabs` paints a tab strip; it does not implement the
[tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). You must
add:

- `role="tablist"` on `ui-tabs`; `role="tab"` on each `ui-tab`;
  `role="tabpanel"` on each panel;
- `aria-selected` on every tab — this doubles as the active style hook,
  so keep it truthful (`ui-active` is only for non-`role="tab"` uses);
- `aria-controls` on each tab → panel `id`, and `aria-labelledby` back;
- roving `tabindex`: the selected tab is `tabindex="0"`, the rest `-1`;
- keyboard handling: ←/→ (or ↑/↓ for vertical lists) move between tabs,
  Home/End jump to first/last. Decide between automatic activation
  (focus switches the panel, APG's recommendation for simple cases) and
  manual activation (arrows move focus, Enter/Space activates).

### Recipe: headless libraries (Radix UI, Ark UI)

Headless components render your markup, set all the ARIA above, and
take `className` verbatim — so `ui-*` classes drop straight in, and
because Uniskin styles `[aria-selected="true"]` etc., the states the
library manages are styled with zero glue code:

```jsx
// React + Radix — same idea in Ark UI / Zag.js
<Tabs.Root defaultValue="general">
  <Tabs.List className="ui-tabs ui-soft">
    <Tabs.Trigger className="ui-tab" value="general">General</Tabs.Trigger>
    <Tabs.Trigger className="ui-tab" value="billing">Billing</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="general">…</Tabs.Content>
</Tabs.Root>

<Dialog.Root>
  <Dialog.Portal>
    <Dialog.Overlay className="ui-modal ui-active" />
    <Dialog.Content className="ui-modal-box">…</Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

Radix/Ark set `aria-selected` on the active trigger and handle the
roving tabindex and arrow keys; `Dialog` handles the focus trap, Esc,
and `aria-modal`. (Their `data-state` attributes also work — Uniskin
just doesn't need them.)

### Recipe: Alpine.js

Drive the state attributes directly; Uniskin's state selectors do the
rest — no class toggling needed for the active tab:

```html
<div x-data="{ tab: 'general' }">
  <div class="ui-tabs" role="tablist">
    <button class="ui-tab" role="tab"
            :aria-selected="tab === 'general'"
            @click="tab = 'general'">General</button>
    <button class="ui-tab" role="tab"
            :aria-selected="tab === 'billing'"
            @click="tab = 'billing'">Billing</button>
  </div>
  <div x-show="tab === 'general'" role="tabpanel">…</div>
  <div x-show="tab === 'billing'" role="tabpanel">…</div>
</div>

<div x-data="{ open: false }">
  <button class="ui-button ui-primary" @click="open = true">Open</button>
  <div class="ui-modal" :class="open && 'ui-active'" @keydown.escape.window="open = false">
    <div class="ui-modal-box">
      <button class="ui-button ui-ghost" @click="open = false">Close</button>
    </div>
  </div>
</div>
```

The `<div>` modal above still needs the focus/`aria-modal` work listed
under `ui-modal` — Alpine toggles visibility, not semantics. For
production dialogs prefer `<dialog>` or a headless library.
