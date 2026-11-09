# 003 — Vocabulary expansion: the next wave of components

Status: proposed (no code changes; nothing here is decided until the owner answers the [open questions](#open-questions))
Date: 2026-11-09

Class names are public API. This document proposes names and contracts
only. It adds no class to `packages/uniskin/src`, either adapter, or the
playground. Every class written below that is not in
[`docs/vocabulary.md`](../vocabulary.md) is a **proposal**; the
`vocabulary-docs` test must keep failing on them if they leak into
`vocabulary.md` before the implementing PR lands.

## Findings that change the brief

1. **`select` and `checkbox` already ship in v1** (`VOCABULARY` in
   `types.ts`, both adapters, `vocabulary.md`). They are not new
   components. Section 1 below lists the remaining gaps instead
   (indeterminate docs, `<select multiple>`/`<optgroup>`, checkbox on
   `role="checkbox"`). The genuinely new set is radio, switch, tooltip,
   toast, table, menu/dropdown.
2. **The adapter contract has exactly five slots** (`base`, `intents`,
   `styles`, `sizes`, `states`; `ComponentDef` in `types.ts`).
   Parts (`ui-card-header`, `ui-modal-box`) are *separate component
   names*, not a slot. Anything that does not fit a slot (placement,
   density, open/checked) must use a nested selector inside `base`
   (`&:checked`, `&[open]`, `&[data-placement="top"]`) or be a new part.
   This proposal adds **no new modifier kind and no new slot**, so no
   adapter has to change shape and no existing adapter breaks.
3. **State natives are fixed** by decision 002 (`STATE_NATIVES` in
   `emit.ts`): `ui-active` = `aria-selected` / `aria-pressed`;
   `ui-disabled` = `:disabled` / `aria-disabled`; `ui-loading` =
   `aria-busy`. `aria-checked`, `aria-expanded`, `aria-current`,
   `aria-sort`, `[open]`, `:popover-open` are **not** mapped. Per
   decision 002 changing the mapping is a breaking vocabulary change,
   so the proposal keys those attributes off nested selectors in each
   component's own `base`, exactly as `ui-modal` already does with
   `&[open], &:target` and `ui-checkbox` does with `&:checked`.
4. **Observed conventions to follow** (from `default-theme.ts`, both
   adapters and `vocabulary.md`):
   - Base class `ui-<name>`; parts `ui-<name>-<part>` (flat, one hyphen
     level, `ui-card-header`, `ui-modal-box`). Containers are plural
     only when the DOM role is a group of things (`ui-tabs` over
     `ui-tab`).
   - Modifiers are separate classes on the same element: intent,
     style, size, state (`ui-danger ui-outline ui-sm`). Compound
     selectors, never `ui-danger-outline`.
   - Intents set `--ui-c`, `--ui-c-text`, `--ui-on-c`, `--ui-c-soft`,
     `--ui-c-soft-fg` (plus `--ui-c-hover` on button); styles map them.
     A component with no intent gets the neutral vars.
   - Per-component hooks are `--ui-<component>-<thing>` with a
     `var()` fallback (`--ui-check-size`, `--ui-check-mark`,
     `--ui-modal-w`, `--ui-card-pad`, `--ui-tab-active-bg`,
     `--ui-tab-radius`). Adapters set them in `base`/`sizes`; the
     default theme reads them with a fallback so an unset hook is
     harmless.
   - Surface tokens: `--ui-surface`, `--ui-surface-fg`,
     `--ui-surface-muted`, `--ui-border`, `--ui-ring`, `--ui-radius`,
     `--ui-text-{sm,md,lg}`, `--ui-font-sans`. New components should
     reuse these and introduce **no new global tokens** (see open
     question 6 for the one possible exception, elevation).
   - Focus: `:focus-visible` outline `2px solid var(--ui-ring)`. The
     e2e keyboard spec fails any visible focusable with a ring below
     3:1.
   - Motion: any `animation` is automatically disabled under
     `prefers-reduced-motion` by `withReducedMotion` in `emit.ts`;
     `transition` is not, so components must add their own
     `@media (prefers-reduced-motion: reduce) { transition: none }`
     (as `modal` does).
   - Dark mode is token-only (`darkTokens`); components must not
     hard-code light/dark colors. daisyUI sets `darkTokens: {}`
     because its tokens already follow the theme.
   - Uniskin is CSS only. Each component section states what the
     consumer must provide.
5. **What the e2e specs assert today** (`apps/playground/e2e`):
   `keyboard.spec.ts` Tabs through every element matching a fixed
   `FOCUSABLE` selector (button, a[href], input, select, textarea,
   `[role=tab]`) across 3 adapters x 2 modes, requires a visible ring
   with >= 3:1 contrast, and that anything *looking* disabled
   (`.ui-disabled`, `:disabled`, `[aria-disabled=true]`) is also
   announced as disabled. `axe.spec.ts` runs axe with a documented
   allow-list of known contrast results. `motion.spec.ts` asserts that
   animations stop under reduced motion and that the modal transition
   honours it. New components therefore need: playground sections,
   an extended `FOCUSABLE` selector, and arrow-key assertions (the
   existing specs do not exercise arrows, because the playground has
   no JS behaviour yet).

## Components

Notation: "consumer provides" = markup, ARIA and JS; "CSS does" = what
Uniskin can honestly do. Every component supports the shared modifier
vocabulary only where it makes sense, as `vocabulary.md` already does
per component.

### 1. Gaps in the shipped `select` and `checkbox` (S)

No new class names. Work: (a) document `:indeterminate` set via
`el.indeterminate = true` (no attribute exists, so a JS note is
required), `<select multiple>` and `size>1` (currently the chevron is
wrong on listbox-style selects; render none when `[multiple]` or
`[size]`), `<optgroup>`; (b) `ui-checkbox` on `<button role="checkbox"
aria-checked>` is **not** supported by the current CSS (it keys off
`:checked`); add `&[aria-checked="true"]` / `[aria-checked="mixed"]`
to `base` so headless libraries work. (c) Pair label and hint guidance
with `ui-field` (section 8). All non-breaking additions to existing
rules.

### 2. `ui-radio` (S)

```html
<fieldset>
  <legend>Plan</legend>
  <label><input type="radio" name="plan" class="ui-radio ui-primary" checked> Free</label>
  <label><input type="radio" name="plan" class="ui-radio ui-primary"> Pro</label>
</fieldset>
```

- **Classes:** `ui-radio`. No parts.
- **Intents / styles / sizes / states:** identical to `ui-checkbox`
  (all five intents; outline/ghost/soft; sm/lg; disabled/loading/
  active). Size via `--ui-radio-size` (default `1.125rem`, same as
  checkbox).
- **Consumer provides:** native `<input type="radio">` with a shared
  `name`, a visible label (wrapping `<label>` or `for`), and a
  `<fieldset>`/`<legend>` or `role="radiogroup"` +
  `aria-labelledby` for the group. Arrow-key movement, roving
  tabindex and single-selection are **native** for same-`name`
  inputs; no JS. For non-native (`role="radio"` buttons from a
  headless lib) the library owns the roving tabindex and arrow keys.
- **CSS keys off:** `:checked`, `[aria-checked="true"]` (for
  `role="radio"` elements), `:disabled`/`[aria-disabled]`,
  `:focus-visible`. Indicator is a `::after` dot (same technique as
  checkbox's mark), not an extra element.
- **Hooks:** `--ui-radio-size`, `--ui-radio-dot` (dot color, default
  `--ui-on-c`; outline/soft styles repoint it like `--ui-check-mark`),
  `--ui-radio-dot-size` (default `0.5em`).
- **shadcn:** `RadioGroupItem` - `aspect-square h-4 w-4 rounded-full
  border border-primary shadow`, indicator is a filled
  `Circle h-3.5 w-3.5 fill-primary`. The adapter sets
  `--ui-radio-size: 1rem`, `border-color: hsl(var(--primary))`, and
  keeps the checked fill transparent with a primary dot (mirrors its
  checkbox override).
- **daisyUI:** `radio` (+ `radio-sm/lg`, `radio-primary`...). Size
  from `--size-selector * 6`, border `base-content` 20%, checked dot
  uses the intent color. Same recipe as the daisy checkbox override.
- **Dark / motion:** token-driven. The unchecked border must be
  >= 3:1 on `--ui-surface` (WCAG 1.4.11); reuse the checkbox border
  mix. Dot `transform: scale()` transition gets a reduced-motion
  override.
- **Conflicts:** none in names. `ui-radio` on a `<label>` (the daisyUI
  habit of a `<label class="radio">`) is **not** supported;
  document that the class goes on the input.

### 3. `ui-switch` (S-M)

```html
<label>
  <input type="checkbox" role="switch" class="ui-switch ui-success" checked>
  Notifications
</label>
<!-- headless / non-native -->
<button role="switch" aria-checked="true" class="ui-switch"></button>
```

- **Classes:** `ui-switch`. Track and thumb are drawn on the element
  itself (`background` for the track, `::after` for the thumb), so the
  native input needs no wrapper (same trick as `ui-checkbox`).
- **Intents / styles / sizes / states:** intents = the on-state track
  color; `ui-outline` (transparent track, accent border/thumb),
  `ui-soft`/`ui-ghost` (tinted track, as checkbox); sm/lg via
  `--ui-switch-size`; disabled/loading/active. `ui-loading` shows a
  pulsing thumb (a spinner would not fit the thumb at `sm`).
- **Consumer provides:** `<input type="checkbox" role="switch">`
  (preferred: native toggle with Space, form submission, `:checked`)
  or `<button role="switch" aria-checked>` with its own click/Space
  handling. An accessible name (label, `aria-label`) is mandatory.
  Do **not** use `ui-active`/`aria-pressed` for a switch; `aria-checked`
  is the contract (`aria-pressed` is for toggle buttons, which remain
  `ui-button ui-active`).
- **CSS keys off:** `:checked`, `[aria-checked="true"]`, `:disabled`,
  `[aria-disabled]`, `:focus-visible`; thumb travel is
  `translateX` (logical via `margin-inline-start` is preferred so RTL
  flips; open question 8).
- **Hooks:** `--ui-switch-size` (height; width = `1.75x`),
  `--ui-switch-track` (off color), `--ui-switch-thumb`,
  `--ui-switch-pad`.
- **shadcn:** `Switch` - `h-5 w-9 rounded-full`, checked `bg-primary`,
  unchecked `bg-input`, thumb `h-4 w-4 rounded-full bg-background
  shadow-lg`, 2px thumb inset.
- **daisyUI:** `toggle` (+ `toggle-primary`, `toggle-sm/lg`), track
  `base-content` at low opacity, thumb same color; checked uses the
  intent. Size from `--size-selector`.
- **Dark / motion:** off-track must reach 3:1 against the surface
  (unlike shadcn's very light `--input`; the shadcn adapter will need
  a stronger off-track token than the upstream one, an a11y delta to
  call out). Thumb slide transition gets a reduced-motion override.
- **Conflicts:** the word "switch" overlaps nothing. `role="switch"`
  on `type=checkbox` means `ui-checkbox` and `ui-switch` can never be
  on the same element; document it.

### 4. `ui-table` (M)

```html
<div class="ui-table-wrap" role="region" aria-label="Invoices" tabindex="0">
  <table class="ui-table ui-soft">
    <caption>Invoices</caption>
    <thead><tr><th scope="col" aria-sort="ascending">Date</th><th scope="col">Amount</th></tr></thead>
    <tbody>
      <tr aria-selected="true"><td>2026-11-01</td><td>$12</td></tr>
    </tbody>
  </table>
</div>
```

- **Classes:** `ui-table` (on `<table>`), `ui-table-wrap` (scroll
  container part). No row/cell classes: `ui-table` styles `th`, `td`,
  `tr`, `caption` through nested element selectors, which
  `CssRuleObject` supports. This keeps markup native and avoids a
  `ui-table-row`/`ui-table-cell` explosion; the cost is that nested
  tables inherit (documented: put `ui-table` on the inner one too, or
  accept the inherit; open question 4).
- **Intents:** tint the header underline and the selected-row fill
  (`--ui-c`, `--ui-c-soft`).
- **Styles:** default = row dividers; `ui-soft` = zebra stripes
  (`--ui-surface-muted`); `ui-outline` = full cell grid;
  `ui-ghost` = no lines at all. Reusing existing style words avoids a
  new "striped/bordered" modifier kind.
- **Sizes:** `ui-sm`, `ui-lg` = row density (`--ui-table-pad-y/-x`,
  font size).
- **States:** `ui-active`/`aria-selected="true"` on a `<tr>` = selected
  row; `ui-disabled`/`aria-disabled` on a `<tr>` = dimmed. `ui-loading`
  (`aria-busy` on the table) = pulsing body. Hover highlight on
  `tbody tr` is CSS-only.
- **Consumer provides:** real table semantics (`<th scope>`,
  `<caption>` or `aria-label`), sorting behaviour and `aria-sort`
  on the sorted header (CSS draws an arrow from `[aria-sort]`
  via `::after`; it does not sort), selection behaviour, and a
  keyboard-reachable scroll region (`tabindex="0"`, `role=region`,
  label) when `ui-table-wrap` scrolls. Sticky header is
  `position: sticky` in CSS (the wrap must have a bounded height).
  `role="grid"` / cell-level arrow navigation is **out of scope**;
  that needs JS (point to a headless lib).
- **CSS keys off:** `[aria-selected]`, `[aria-sort]`,
  `[aria-disabled]`, `[aria-busy]`, `:hover`, `:focus-visible`
  (focusable rows/sort buttons in `th`).
- **Hooks:** `--ui-table-pad-x`, `--ui-table-pad-y`,
  `--ui-table-head-bg`, `--ui-table-head-fg`, `--ui-table-stripe`,
  `--ui-table-row-hover`, `--ui-table-border`.
- **shadcn:** `Table` - `w-full caption-bottom text-sm`; `th` `h-10 px-2
  text-left font-medium text-muted-foreground`; `tr` `border-b
  transition-colors hover:bg-muted/50
  data-[state=selected]:bg-muted`; `td` `p-2`. Sets hover/selected
  hooks to `--muted`.
- **daisyUI:** `table` (+ `table-zebra`, `table-pin-rows`, `table-xs/
  sm/lg`), `tr.hover`, `tr.active` zebra. Maps cleanly onto
  `ui-soft` (zebra) and the size modifiers.
- **Dark / motion:** stripes and hover must keep text >= 4.5:1; derive
  from `--ui-surface-muted`. Only a hover `background-color`
  transition; reduced-motion override. Sort arrow is a CSS shape, not an
  icon font.
- **Conflicts:** `ui-outline` here means "grid lines", loosely
  consistent with "bordered". `ui-soft` as zebra is the least obvious
  mapping (open question 5).

### 5. `ui-tooltip` (M)

```html
<span class="ui-tooltip-anchor">
  <button class="ui-button" aria-describedby="tip-1">Save</button>
  <span class="ui-tooltip" id="tip-1" role="tooltip" data-placement="top">Ctrl+S</span>
</span>
```

- **Classes:** `ui-tooltip` (the bubble), `ui-tooltip-anchor` (a
  `position: relative; display: inline-block` wrapper that reveals the
  bubble on `:hover` / `:focus-within`).
- **Intents:** background fill (default is the inverted surface:
  `--ui-surface-fg` on `--ui-surface`). **Styles:** `ui-soft` (tinted),
  `ui-outline` (surface bg, accent border). **Sizes:** `ui-sm`,
  `ui-lg` (font/padding). **States:** `ui-active` forces visible (for
  JS-driven/headless use); no disabled/loading.
- **Placement:** `data-placement="top|bottom|start|end"` (default
  `top`) in a nested attribute selector. This deliberately is **not**
  a `ui-top`/`ui-left` modifier class: a placement kind would need a
  new adapter slot and enlarge the vocabulary test (open question 3).
- **Consumer provides:** `role="tooltip"` on the bubble,
  `aria-describedby` from the trigger to the bubble (never put the
  text only in `data-tip`/`content: attr()`; pseudo-element content
  is unreliably announced), and **the trigger must be focusable**
  (button/link; a bare `<span>` is not keyboard reachable). Escape to
  dismiss (WCAG 1.4.13, dismissible) and hoverable bubble need JS or the
  Popover API; CSS-only is hover/focus-within and **does not meet the
  Escape requirement**. Say so plainly in the docs. Tooltips must not
  hold interactive content (that is a popover/menu).
- **CSS keys off:** `.ui-tooltip-anchor:hover .ui-tooltip`,
  `:focus-within`, `ui-active`, `[hidden]`, `:popover-open` (when the
  consumer uses `popover="hint"`), `[data-placement]`.
- **Hooks:** `--ui-tooltip-bg`, `--ui-tooltip-fg`, `--ui-tooltip-gap`,
  `--ui-tooltip-arrow` (arrow size; 0 disables), `--ui-tooltip-max-w`
  (default `16rem`).
- **shadcn:** `TooltipContent` - `bg-primary text-primary-foreground
  rounded-md px-3 py-1.5 text-xs` with fade/zoom animation. Maps to the
  inverted default; the animation is the part we should not copy
  (reduced motion).
- **daisyUI:** `tooltip` wrapper + `data-tip` pseudo content,
  `tooltip-open`, `tooltip-top/bottom/left/right`, intent classes.
  Closest native equivalent is the wrapper, but the `data-tip`
  technique is the accessibility trap noted above; the daisy adapter
  styles our bubble element to match daisy's `tooltip-content` look
  instead of using `data-tip`.
- **Dark / motion:** inverted colors flip with `--ui-surface-fg`;
  verify 4.5:1 for the bubble text in all skins (xs text needs
  care). Fade `opacity` transition gets a reduced-motion override;
  show delay is not animated.
- **Conflicts:** none in names. Positioning at viewport edges needs
  JS or CSS anchor positioning (limited support at time of
  writing); the CSS-only version can clip near edges. Document it.

### 6. `ui-toast` (M)

```html
<div class="ui-toast-region" role="region" aria-label="Notifications" data-placement="bottom-end">
  <div class="ui-toast ui-success" role="status">
    Saved.
    <button class="ui-button ui-ghost ui-sm" aria-label="Dismiss">x</button>
  </div>
  <div class="ui-toast ui-danger" role="alert">Upload failed.</div>
</div>
```

- **Classes:** `ui-toast` (one message), `ui-toast-region` (fixed
  stacking container; `data-placement="top|bottom"` x `start|center|end`,
  default `bottom-end`).
- **Intents / styles / sizes:** same as `ui-alert` (solid, outline,
  ghost, soft; sm/lg). **States:** `ui-loading` (pulse, for
  "uploading"), `ui-disabled` not meaningful.
- **Consumer provides:** everything dynamic. Insert/remove nodes,
  auto-dismiss timers (pause on hover/focus; do not auto-dismiss
  actionable or error toasts, WCAG 2.2.1), a visible dismiss control,
  `role="status"` (polite) or `role="alert"` (assertive) **on a live
  region that already exists in the DOM before the toast is
  inserted**, otherwise screen readers drop the announcement. Toasts
  must never steal focus. Keyboard: the region must be reachable
  (a hotkey like Sonner's is the consumer's job).
- **CSS does:** fixed positioning, stacking gap, elevation, enter
  animation via `@starting-style` + `transition`, `pointer-events:
  none` on the region and `auto` on toasts, safe-area padding.
  CSS cannot time out or remove a toast.
- **CSS keys off:** `[data-placement]` on the region, `[open]`/
  `[hidden]` for exit (`transition-behavior: allow-discrete`),
  `[aria-busy]`.
- **Hooks:** `--ui-toast-w` (default `22rem`), `--ui-toast-gap`,
  `--ui-toast-shadow`, `--ui-toast-offset`; colors reuse the alert
  intent vars.
- **shadcn:** `Toast`/`Toaster` (Radix) and Sonner: bordered card,
  `shadow-lg`, `destructive` variant. Adapter: surface background +
  border for neutral, `--ui-danger` solid for `ui-danger`.
- **daisyUI:** `toast` is **only the positioned container**
  (`toast-top/bottom`, `toast-start/center/end`) and the message is an
  `alert` inside it. This is the one structural mismatch: daisyUI's
  `toast` = our `ui-toast-region`; our `ui-toast` ~ daisy `alert`
  content. The adapter maps `ui-toast` onto the daisy alert look and
  `ui-toast-region` onto daisy `toast`.
- **Dark / motion:** shadow is invisible on dark surfaces, so the
  neutral toast needs a 1px `--ui-border` as well. Enter/exit
  transitions get reduced-motion overrides (instant appearance).
- **Conflicts:** high overlap with `ui-alert`. Alternatives: reuse
  `ui-alert` inside the region and add only `ui-toast-region`; see open
  question 2. Name `ui-toaster` was rejected: it reads as the library,
  and the pair `ui-tab/ui-tabs` already shows the "plural container"
  convention only for lists of the same child, which a toast region is
  not strictly.

### 7. `ui-dropdown` + `ui-menu` + `ui-menu-item` (L)

```html
<div class="ui-dropdown">
  <button class="ui-button" aria-haspopup="menu" aria-expanded="true" aria-controls="m1">Options</button>
  <div class="ui-menu" id="m1" role="menu" aria-labelledby="...">
    <button class="ui-menu-item" role="menuitem">Rename</button>
    <hr class="ui-menu-separator" role="separator">
    <button class="ui-menu-item ui-danger" role="menuitem">Delete</button>
  </div>
</div>
```

- **Classes:** `ui-dropdown` (positioned wrapper; `position: relative`,
  hides `ui-menu` unless open), `ui-menu` (the surface: bordered,
  elevated, scrollable; also valid un-floated as a plain vertical menu
  list), `ui-menu-item`, `ui-menu-label` (non-interactive heading),
  `ui-menu-separator`. Placement through `data-placement` on
  `ui-dropdown`, as with tooltip.
- **Modifiers:** `ui-menu`: sizes sm/lg (item padding/font), styles
  `ui-ghost` (no border/shadow, for sidebars), `ui-soft` (muted
  fill). `ui-menu-item`: intents (hover/highlight tint; `ui-danger`
  is the destructive item), sizes, states `ui-disabled`
  (`aria-disabled` or `:disabled`) and `ui-active`
  (`aria-selected`/`aria-pressed`, current item). No `ui-outline`.
- **Open state:** `ui-dropdown` is open when any of these holds,
  mirroring `ui-modal`'s three mechanisms: `[open]` (on a `<details
  class="ui-dropdown">`), `:has([aria-expanded="true"])` on the
  trigger, or `ui-active` on `ui-dropdown`. The panel can also be a
  `popover` (`:popover-open`), so Uniskin does not own the top layer.
- **Consumer provides (the hard part; this is the biggest JS gap in the
  vocabulary):** trigger `aria-haspopup`, `aria-expanded`,
  `aria-controls`; menu `role="menu"` and items `role="menuitem"` (or
  `menuitemcheckbox`/`menuitemradio` with `aria-checked`); roving
  focus with ArrowUp/Down, Home/End, typeahead, Enter/Space to
  activate, Escape to close **and return focus to the trigger**, Tab
  closes; click-outside dismissal; viewport collision. None of this
  is possible in CSS. A `<details>` fallback gives disclosure
  semantics only (not `role=menu`) and must be documented as a
  "disclosure list of links", not an ARIA menu. Recommend headless
  recipes (Radix `DropdownMenu`, Ark/Zag `Menu`) exactly like the
  existing Tabs/Dialog recipes; Radix sets `data-highlighted` on the
  active item, which the CSS must also honour in addition to `:focus`
  (a small deviation from "Uniskin doesn't need `data-state`"; open
  question 7).
- **CSS keys off:** `:focus-visible`/`:focus`, `[data-highlighted]`,
  `[aria-disabled]`, `[aria-checked="true"]` (check indicator),
  `[aria-selected]`, `[open]`, `[aria-expanded="true"]`.
- **Hooks:** `--ui-menu-w` (min width), `--ui-menu-pad`,
  `--ui-menu-item-hover-bg`, `--ui-menu-item-hover-fg`,
  `--ui-menu-shadow`, `--ui-menu-gap`, `--ui-menu-z` (default `50`,
  below modal's `1000`).
- **shadcn:** `DropdownMenuContent` (`min-w-[8rem] rounded-md border
  bg-popover p-1 shadow-md`), `DropdownMenuItem` (`rounded-sm px-2
  py-1.5 text-sm focus:bg-accent focus:text-accent-foreground
  data-[disabled]:opacity-50`), `DropdownMenuLabel`, `...Separator`.
  Maps one-to-one onto menu/item/label/separator; the destructive
  variant is `ui-danger` on the item.
- **daisyUI:** two components. `dropdown` (+ `dropdown-content`,
  `dropdown-end`, `dropdown-open`) is the floating wrapper = our
  `ui-dropdown`; `menu` (+ `menu-title`, `menu-active`,
  `menu-disabled`, `menu-sm/lg`) is the list = our `ui-menu`/
  `ui-menu-item`. Mapping is clean but daisy's `menu` items are `<li>
  > a`, so our flat items need `display: flex` rules, not daisy's
  descendant selectors; recommend the adapter style our classes
  instead of depending on daisy's markup.
- **Dark / motion:** `ui-menu` needs a 1px border for dark mode
  (shadow vanishes); item hover/highlight 4.5:1. Fade/scale entry uses
  `@starting-style` with a reduced-motion override.
- **Conflicts:** the generic word "menu" collides semantically with
  nav menus (`<nav><ul>`) and daisyUI's own `menu` (a static list);
  we document that `ui-menu` is permitted static (no `ui-dropdown`)
  but `role="menu"` must only be used for application menus, not site
  navigation (APG warning). `ui-dropdown` vs existing `ui-select`:
  `ui-select` is a native `<select>`; a custom listbox/combobox is
  **out of scope** and, if ever added, should be `ui-listbox`, never
  `ui-select`-with-parts (open question 9).

### 8. Extras that are justified

Only components that fill an accessibility or CSS-only gap are
proposed; everything else is in "Deliberately deferred".

- **`ui-field`, `ui-field-label`, `ui-field-hint`, `ui-field-error`
  (S).** Without them, radio/switch/checkbox/select guidance cannot
  express label + help text + error spacing, and `ui-danger` on an
  input has no matching message style. CSS-only layout (stack, gap,
  inline for checkbox rows via `ui-sm`...). Consumer provides
  `for`/`id`, `aria-describedby` to hint and error, `aria-invalid`
  (CSS may style `ui-input[aria-invalid="true"]` like `ui-danger`; a
  non-breaking addition and the biggest form-a11y win in this list).
  shadcn: `FormItem/FormLabel/FormDescription/FormMessage`. daisyUI:
  `fieldset`, `label`, `fieldset-legend`, `validator-hint`.
- **`ui-accordion`, `ui-accordion-item`, `ui-accordion-trigger`,
  `ui-accordion-panel` (S-M).** Native `<details><summary>` gives
  open/close, keyboard and `aria-expanded` for free with zero JS, the
  one pattern where CSS-only is accessible. Styles outline/ghost/soft,
  sizes sm/lg, intents tint the open trigger. `details[open]` is the
  state hook. shadcn `Accordion`; daisyUI `collapse` + `collapse-title`
  /`collapse-content` (`collapse-arrow`/`-plus`). Honest caveat:
  `details name=` (exclusive groups) has partial browser support.
- **`ui-progress` (S).** Native `<progress>`/`<meter>` styling, intents,
  sizes; `ui-loading` indeterminate bar (reduced-motion override
  required). shadcn `Progress`; daisyUI `progress`. Consumer provides
  `aria-label` and `value`/`max`.

## Priority ranking

Ranked by (user demand in forms/app UIs) x (how well CSS alone can
deliver an accessible result) / effort.

| # | Component | Effort | Why this rank |
|---|-----------|:------:|---------------|
| 1 | `ui-radio` (+ section 1 gap fixes) | S | Completes the native form set; copy of checkbox; native a11y |
| 2 | `ui-switch` | S-M | Most-requested control; native checkbox gives a11y; needs 3:1 off-track care |
| 3 | `ui-field` + `aria-invalid` styling | S | Unblocks accessible forms for 1, 2 and the existing controls |
| 4 | `ui-table` | M | High-value, native semantics, element-selector styling; no JS contract |
| 5 | `ui-accordion` | S-M | Native `<details>`; high a11y return for low cost |
| 6 | `ui-tooltip` | M | Common but CSS-only cannot meet 1.4.13 fully; honest docs needed |
| 7 | `ui-toast` | M | Mostly JS (live regions, timers); CSS is positioning and look |
| 8 | `ui-progress` | S | Cheap, native |
| 9 | `ui-dropdown` / `ui-menu` | L | Largest JS contract, most a11y risk, depends on shared overlay conventions |

## Recommended implementation order

1. **Radio + checkbox/select gap fixes** (one PR; establishes the
   "extend `base` with `&[aria-checked]`" pattern).
2. **Switch** (reuses the pattern and the 3:1 non-text contrast
   method).
3. **Field** (before more controls pile up undocumented
   label/hint/error conventions).
4. **Table**.
5. **Accordion**, **Progress** (independent, can parallelise).
6. **Tooltip**, then **Toast** (both introduce `data-placement` and
   `@starting-style` entry; settle those conventions in the tooltip PR).
7. **Menu/dropdown** last: it reuses placement, elevation, `--ui-menu-z`
   and the headless recipe format, and is the only one that needs a
   new `vocabulary.md` Accessibility subsection with a full keyboard
   contract.

One component per PR, each with its own changeset (minor).

## Migration and compatibility

All additions are non-breaking by construction:

- New names only; no existing class, token, modifier kind or slot is
  renamed, removed or re-meant. The five `ComponentDef` slots and
  `STATE_NATIVES` are untouched (decision 002 stays intact).
- `VOCABULARY` in `types.ts` is a `const` tuple used as
  `Partial<Record<ComponentName, ComponentDef>>`; widening it keeps
  every existing adapter type-checking. Third-party adapters that do
  not define the new components fall back to the default theme (the
  documented merge behaviour), so nothing disappears or errors; the
  dev-build "undefined slots" warning will list them, which may be noisy
  and is worth a changelog line.
- Existing rules change only in additive ways (section 1 selectors
  `&[aria-checked]`, `aria-invalid`). Each needs a snapshot/visual
  check that today's default markup is unchanged.
- Peer range: nothing here needs a newer Tailwind. `@starting-style`,
  `:has()` and `popover` are progressive enhancements: the components
  must work (statically visible/hidden) where unsupported.
- `prefix` option: all new keyframes/animations must go through the
  `ui-<name>` keyframe re-prefixing in `emit.ts`; new class names are
  automatically re-prefixed.
- Semver: each PR is a minor; the first wave bumps the documented
  "vocabulary v1" to "v1.1" in `vocabulary.md`, since the title
  currently claims "every class in vocabulary v1".

## Per-component PR verification checklist

Each component PR must tick all of these (the existing three suites run
on 3 adapters x 2 modes):

- [ ] `VOCABULARY` (and only it) in `types.ts` gains the new names;
      `vocabulary-docs.test.ts` passes: every new class is documented in
      `docs/vocabulary.md` as `` `ui-...` `` and every `ui-*` in a code
      fence there exists. Add the component to the coverage matrix.
- [ ] Default theme defines the full slot set; shadcn and daisyUI
      adapters define overrides, or the PR explains why the default
      suffices. Hooks documented in `docs/writing-adapters.md`.
- [ ] Playground gets a section (all intents x styles x sizes x states)
      in both light and dark.
- [ ] e2e keyboard: extend `FOCUSABLE` for new roles
      (`[role=switch]`, `[role=menuitem]`, `[tabindex=0]`); Tab reaches
      each, visible ring >= 3:1 in all 6 skin/mode combos; for
      radio/menu/tabs-like widgets add arrow-key, Home/End, Escape
      and focus-return assertions. Disabled-looking elements must be
      announced (`:disabled`/`aria-disabled`).
- [ ] e2e ARIA: the documented markup passes axe (`axe.spec.ts`) with no
      new allow-list entries; if one is unavoidable it carries a
      written reason like the select-chevron entry.
- [ ] Contrast: text >= 4.5:1; non-text boundaries (checkbox/radio/
      switch borders and off-track, focus rings, table lines that
      convey structure) >= 3:1, measured with `inspectElement` in
      light and dark for every skin; record anything that fails in
      `docs/qa/` the way the November a11y audit does.
- [ ] Reduced motion: every `animation` is covered by
      `withReducedMotion` automatically; every `transition` and
      `@starting-style` entry has an explicit override; extend
      `motion.spec.ts`.
- [ ] No new `--ui-*` global token; if elevation or similar is needed,
      the owner decision (open question 6) is cited.
- [ ] `prefix: "uk"` build smoke test: new classes and keyframes follow
      the prefix.
- [ ] `pnpm lint && pnpm test` green; changeset (minor) added.

## Deliberately deferred

`ui-avatar`, `ui-breadcrumb`, `ui-pagination`, `ui-drawer` (largely a
`ui-modal` variant; evaluate as `ui-modal` placement first),
`ui-skeleton`, `ui-separator` (the `<hr>`; folded into menu),
`ui-popover` (overlaps tooltip + menu; do after both), `ui-combobox`/
`ui-listbox` (JS-heavy, see open question 9), `ui-slider` (native
`<input type=range>` is a good later S item), `ui-spinner` (loading is
already a state of existing components).

## Open questions

1. **`select`/`checkbox` were already shipped.** Is the intent to
   *extend* them (section 1) or was a different, custom
   listbox-style select meant? (Proposal assumes the former.)
2. **Toast as its own component or `ui-alert` in a region?** Own
   `ui-toast` + `ui-toast-region` (proposed, clearer adapter
   mapping) vs only `ui-toast-region` wrapping `ui-alert`
   (smaller vocabulary, matches daisyUI's `toast` exactly).
3. **Placement:** `data-placement` attribute (proposed; no new modifier
   kind) or a new `ui-top/ui-bottom/ui-start/ui-end` modifier class
   kind (more consistent with class-based modifiers, but a new slot and
   an adapter-contract change)?
4. **Element-selector styling for `ui-table`** (`.ui-table th`) vs part
   classes (`ui-table-head/-row/-cell`). Native markup is simpler for
   consumers; classes are more adapter-friendly and nest-safe.
5. **Style-word reuse:** is `ui-soft` = zebra and `ui-outline` = grid
   acceptable for tables, or do you prefer new `ui-striped`/
   `ui-bordered` modifiers (would extend the style kind and break the
   "three styles" rule in the docs)?
6. **Elevation token:** menus/toasts/tooltips need a shadow. Add a
   global `--ui-shadow` token (touches both adapters and darkTokens), or
   keep per-component hooks only (proposed)?
7. **`data-*` attributes:** may the CSS honour `data-highlighted` /
   `data-state` (Radix/Ark) for the menu, given decision 002 and the
   docs' "Uniskin doesn't need `data-state`" line? Menus have no native
   highlighted attribute, so `:focus` alone breaks hover-driven
   highlighting in headless libraries.
8. **RTL:** commit to logical properties (`margin-inline-*`,
   `inset-inline-*`) for all new components? Existing ones use physical
   properties in places.
9. **Custom select/combobox/listbox:** in or out of the roadmap? If in,
   the name must not be `ui-select` parts; proposed `ui-listbox`.
10. **Mapping `aria-checked`/`aria-expanded` into `STATE_NATIVES`** as
    part of `ui-active` (one-line change, simplest for adapters, but it
    widens decision 002 and `ui-active` would then mean "on" in more
    contexts) versus the per-component nested selectors proposed here.
11. **Tooltip honesty:** ship CSS hover/focus-within tooltips knowing
    they miss the WCAG 1.4.13 Escape-to-dismiss rule without JS, or
    require the Popover API (`popover="hint"`) and accept limited
    browser support?
12. **Versioning:** is "vocabulary v1.1" an acceptable label, or should
    expansions be separate, versioned packs?
