# ui-tooltip QA (November 2026)

Screenshots: `docs/qa/tooltip/`, three skins by light and dark by 360, 768
and 1280 px. Checked by `apps/playground/e2e/tooltip.spec.ts` in all six
skin and mode combinations, plus the shared axe and reduced-motion specs.

## What is asserted

| Check | Result |
|-------|--------|
| Hidden until the anchor is hovered; shown on hover | passes |
| Stays visible while the pointer moves onto the bubble (WCAG 1.4.13, hoverable) | passes |
| Shown on keyboard focus, hidden on blur | passes |
| `aria-describedby` gives the trigger the bubble text; `role="tooltip"` | passes |
| `[hidden]` removes the bubble even while hovered | passes |
| `data-placement` top, bottom, start, end put the bubble on that side | passes |
| RTL: `start` and `end` flip | passes |
| Reduced motion: the opacity fade stops | passes (shared motion spec) |
| Bubble text >= 4.5:1 | passes except the upstream palette values below |

## Not met by CSS alone

**Escape does not dismiss the bubble** (WCAG 1.4.13, dismissible). CSS
cannot listen for a key. The documentation says so and gives the two
fixes: a small keydown handler that sets `hidden` on the bubble, or the
Popover API (`popover="hint"`). The tooltip is therefore *hoverable* and
*persistent* but not *dismissible* on its own.

**No collision handling.** The bubble is positioned relative to its
anchor; near a viewport edge it can be clipped. Documented, with the
advice to pick another `data-placement` or use a positioning library.

## Contrast exceptions (palette values, mirrored from upstream)

The bubble's solid and soft fills reuse each skin's intent pairs, so the
same upstream palette values that are recorded in `a11y-2026-11.md` appear
here, on 12-13px text:

| Skin / mode | Bubble | Ratio |
|-------------|--------|-------|
| shadcn light | solid `ui-danger` | 3.60 |
| daisyUI light | solid `ui-secondary` | 3.04 |
| daisyUI light | `ui-soft ui-danger` | 4.47 |
| daisyUI dark | solid `ui-primary` | 4.13 |
| daisyUI dark | solid `ui-secondary` | 3.04 |
| daisyUI dark | `ui-soft ui-primary` | 4.18 |

The default, soft, outline and size variants of the neutral bubble are
all >= 4.5:1 in every skin. `tooltip.spec.ts` asserts this exact set, so a
fix or a regression both fail the test; the axe allow-list has one entry
(shadcn solid danger, same destructive colour as the button).
