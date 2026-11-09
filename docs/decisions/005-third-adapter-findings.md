# 005 — Third-adapter spike findings (Radix Themes-like)

Status: spike — findings for discussion, **not implemented**
Date: 2026-11-09

## Context

Task: build a third adapter in a deliberately different visual style to
stress-test whether the `ui-*` vocabulary and the adapter contract
(`docs/writing-adapters.md`, `packages/uniskin/src/types.ts`) are too
shaped around shadcn and daisyUI.

Built: `packages/adapter-spike/` (`uniskin-adapter-spike`, `private`,
not published, excluded via .changeset/config.json ignore). The style is "Radix
Themes-like": every component is painted from a generated **12-step
colour scale per hue** (1–2 backgrounds, 3–5 component bg, 6–8 borders,
9–10 solids, 11–12 text) — a different colour model from both existing
adapters (shadcn: semantic vars; daisyUI: external theme vars; default:
one accent + `color-mix` derivation). No core changes were made; this
doc lists the gaps found.

Result: **the vocabulary ports** — every component and documented slot
renders in a recognisably Radix-ish way in light and dark (screenshots:
`docs/qa/img/spike-*.png`). The friction is in the adapter contract,
not the class names.

> **Update after rebasing onto main (2026-11-09):** this file was
> renumbered 003 → 005 because `003-vocabulary-expansion.md` (the next
> component wave) was *accepted* and `004-skin-builder-tokens.md` also
> landed while the spike was open. Since then `ui-radio` has shipped in
> the default skin and `select`/`checkbox` gaps were fixed — the
> vocabulary the spike tested against is now bigger, which strengthens
> the conclusion that the contract, not the class list, is where the
> friction is. The §6 `ui-invalid` proposal is still unproposed; the §1
> `warnUnsupported`-vs-coverage-matrix mismatch still applies.

## What worked well

- **The `--ui-c` composition model generalises.** Intents-as-variables ×
  styles-as-mappings handled a scale-driven system without new rules;
  `ui-danger ui-outline` etc. just work.
- **Adapters are executable JS.** Generating 2×78 scale tokens in a
  loop inside the adapter file was trivial — a real port could generate
  them from `@radix-ui/colors` at build time. This is a genuine contract
  strength worth documenting.
- **`rootSelector` and `darkTokens` are sufficient** for a
  token-driven skin; the `var()`-alias re-resolution under the dark
  scope behaves exactly as documented.
- **Extra components emit for free.** `components: { kbd: … }` produces
  `.ui-kbd` (verified: emit iterates the merged adapter's component
  keys). Vocabulary extensions on the component axis already work.

## What was awkward

### 1. `warnUnsupported` doesn't match the documented coverage matrix

A *fully* implemented adapter still gets:

```
[uniskin] adapter "spike" does not define: card-header (outline, ghost,
soft, sm, lg, disabled, loading, active), card-body (…), card-footer (…),
modal (outline, disabled, loading), modal-box (outline, ghost, soft,
disabled, loading, active), tabs (disabled, loading, active),
tab (outline, ghost, soft)
```

…because the warning checks every component against *all* modifiers,
while `docs/vocabulary.md` documents a smaller matrix (modal has no
`ui-outline`; card parts take no modifiers; `ui-tab` has no styles;
`ui-tabs`/`ui-modal-box` have no states). The warning therefore cries
wolf on a conforming adapter and trains authors to ignore it.

**Proposal:** encode the coverage matrix (component → supported
modifiers) in core and warn against it, not against "all slots".
Trade-off: the warning stops nudging adapters to cover undocumented
combinations — arguably correct, since undocumented combinations
shouldn't exist.

### 2. writing-adapters.md's intent-var list is wrong

The doc says intents set `--ui-c`, `--ui-on-c`, `--ui-c-hover`,
`--ui-c-soft`, `--ui-c-soft-fg`. The code (`intentVars` in
`default-theme.ts`) actually sets `--ui-c`, `--ui-c-text`, `--ui-on-c`,
`--ui-c-soft`, `--ui-c-soft-fg`. `--ui-c-hover` is only declared in
`button.base` — no other component consults it, and no intent sets it.
`--ui-c-text` (which the a11y work relies on for readable accent text)
isn't documented at all, nor are the per-intent token escape hatches
(`--ui-<intent>-text/-soft/-soft-fg`, which both shadcn and daisyUI
already use).

**Proposal:** fix the doc to the real contract, and document the
`--ui-<intent>-*` token hooks as the intended way to pin derived
colours. Cheap doc fix; no code change.

### 3. Scale-driven systems need per-intent pinning everywhere

Radix wants *different* steps for fill (9), fill-hover (10), border
(7–8), soft bg (3), soft hover (4), text (11) — none derivable from
each other by `color-mix`. The contract supports this, but only by
re-emitting the whole intent var block per component: the spike defines
its own `intentVars`/`intents` helpers mirroring `default-theme.ts`
internals, and adds three *new* element vars (`--ui-c-hover`,
`--ui-c-soft-hover`, `--ui-c-border`) consumed by its style slots —
with neutral fallbacks declared as *root* tokens.

**Proposal:** promote `--ui-c-hover`, `--ui-c-border`,
`--ui-c-soft-hover` to first-class intent vars in the default theme
(with `var(…, <current behaviour>)` fallbacks so nothing changes
visually). Then scale-driven adapters only remap tokens instead of
rewriting style slots. Trade-off: a bigger documented var surface —
but the hooks already exist de-facto (`--ui-field-c`, `--ui-card-pad`,
`--ui-tab-*`, `--ui-check-*` are all undocumented hooks adapters must
discover by reading `default-theme.ts`).

### 4. Modifier names are a closed set — and unknown keys are silently dropped

`INTENTS`/`STYLES`/`SIZES`/`STATES` are fixed consts; emit iterates
them, so `styles: { classic: {…} }` or `states: { invalid: {…} }`
emit nothing **and produce no warning** (verified against `buildRules`).
Combined with §3 this is the sharpest trap: an adapter can
*define* a slot that never appears in CSS. Radix Themes has variants
(`classic`, `surface`) and ~30 accent hues that can't map onto the
closed sets at all; `ui-<hue>` per accent is out of scope by design.

**Proposal:** at minimum, dev-warn on slot keys outside the known
modifier sets (typos and silent drops become visible). Possibly
controversial extension: let adapters declare extra intents/styles
that emit the same compound-selector way — needs an owner decision on
vocabulary stability.

### 5. Deep-merge can't delete inherited rules

`"&:hover": {}` does not clear a parent rule's hover; you must repaint
every property (`border-bottom: "0"` in shadcn tabs,
`border-color: "transparent"` in the spike's callout base). And because
"no style class" *is* the solid variant, a system whose canonical
variant is soft (Radix Callout) has to repaint `base` — which works,
but means `ui-alert` reads as soft and true solid becomes unreachable.

**Proposal:** either document "repaint, don't delete" explicitly, or
support a deletion sentinel (`null` value = drop the declaration).
Trade-off: deletion makes merge results order-sensitive and harder to
reason about — documenting repaint-only is the safer fix.

### 6. No `invalid` state / `aria-invalid` hook

Radix-style "invalid" fields are a first-class look; the vocabulary's
states are `disabled`/`loading`/`active`. The closest mapping is
`ui-danger` (which the spike pushes to step-8 borders — looks right),
but `aria-invalid="true"` is unstyled (the playground already sets it
on the danger input).

**Proposal:** candidate vocabulary addition — `ui-invalid` ⇔
`[aria-invalid="true"]`. Trade-off: new state modifier = vocabulary
change; owner decision.

### 7. Adapters can't emit `@keyframes`

`buildRules` only emits the default theme's `spin`/`pulse`; an
`animation: my-shimmer` in a slot references a keyframe that never
gets emitted — silent failure again. A Radix-like skeleton/shimmer or
custom spinner isn't expressible.

**Proposal:** accept an optional `keyframes` map on the adapter,
deep-merged over `defaultKeyframes` and re-prefixed the same way.
Cheap and backwards-compatible.

### 8. Dark tokens are all-or-nothing and the dark selector is fixed

`darkTokens` *replaces* the whole default dark set — correct for the
spike (it owns its scales), but an adapter wanting to tweak one dark
token must restate everything. Separately, the dark scope is hardcoded
`.dark, [data-theme="dark"]`; a Radix Themes port would really want
`.radix-themes[data-appearance="dark"]` or a user-chosen attribute —
`rootSelector` only covers light tokens, and the `dark` plugin option
is the *consumer's* knob, not the adapter's.

**Proposal:** add `darkRootSelector` (defaulting to the current
`.dark, [data-theme="dark"]`). Trade-off: one more adapter knob; the
media/class/false strategy stays consumer-side.

### 9. Untokenised literals in the default theme

The modal scrim (`rgb(0 0 0 / 0.5)`) and the `ui-soft` overlay
(`rgb(255 255 255 / 0.6)` — *white* even in dark mode) are literals,
not tokens. The spike worked around it with its own `--rt-overlay*`
tokens, but every adapter has to rediscover these.

**Proposal:** `--ui-overlay` / `--ui-overlay-soft` tokens in the
default theme, dark-aware. Same for `alert`'s solid fill if it stays
the canonical default variant (see §5).

### 10. `STATE_NATIVES` is global, not per-component

`ui-active` emits `[aria-selected]`/`[aria-pressed]` selectors for
*every* component — including `ui-modal` (where "active" means
"open") and `ui-card`. Harmless CSS, but semantically loose, and
Radix-headless `data-state` attributes can never map. Conversely
`.ui-modal.ui-active` can't be made to also respond to
`[data-state="open"]` without core changes.

**Proposal:** allow per-component state→attribute maps (or simply
accept the looseness — it costs nothing at runtime). If a `data-state`
bridge is wanted for headless integrations, that's a vocabulary RFC.

## Suggested priority

Cheap, uncontroversial, would have saved spike time:

1. Fix writing-adapters.md's intent-var list (§2) and document the
   `--ui-<intent>-*`/`--ui-field-c`/`--ui-tab-*`/`--ui-card-*`/
   `--ui-check-*`/`--ui-modal-w` hooks.
2. Dev-warn on unknown slot keys (§4) and align `warnUnsupported`
   with the coverage matrix (§1).
3. Tokenise the overlay colours (§9).

Needs owner input:

4. Extra intent vars `--ui-c-hover`/`-border`/`-soft-hover` in the
   default theme (§3).
5. `keyframes` adapter field (§7); `darkRootSelector` (§8);
   deletion sentinel or "repaint only" doc note (§5).
6. Vocabulary additions: `ui-invalid` (§6), per-component or
   `data-state` natives (§10), extra modifier names (§4).

## Follow-ups not in scope for the spike

- Spike skin is not covered by `tests/skin.test.ts`, e2e or axe —
  deliberate (it's not for merge); a real third adapter would join
  the `ADAPTERS` lists.
- `packages/adapter-spike` must be built before the playground
  compiles `skins/spike.css` (the `pretest` filter handles it;
  `pnpm -r build` orders it via the workspace dep).
- Colour values approximate Radix Colors by hand; a real port would
  generate the scales from `@radix-ui/colors`.
