import { defineAdapter } from "uniskin/adapter";

/**
 * Radix Themes visual style for Uniskin: pure CSS, no React, no Radix
 * primitives, no `<Theme>` wrapper.
 *
 * Radix Themes colours come from 12-step scales (`--blue-1` .. `--blue-12`,
 * `--gray-1` .. `--gray-12`). Every colour here is `var(--<scale>-<step>)`
 * with the Radix value as the fallback, so loading Radix Themes' stylesheet
 * carries a customised scale through, and leaving it out still renders the
 * default Radix look. The steps keep their Radix roles: 3 for a soft
 * background, 9 for a solid fill, 10 for its hover, 11 for text, 12 for
 * high-contrast text, 7 for borders.
 *
 * Dark mode is Radix's own: `.dark`, `.dark-theme` (also
 * `[data-theme="dark"]` and `prefers-color-scheme`).
 *
 * Every component and every documented modifier is defined (see
 * `checkAdapter` in `uniskin/conformance`).
 */

const s = (scale: string, step: number, hex: string) => `var(--${scale}-${step}, ${hex})`;

/* ---- palette --------------------------------------------------------- */

const light = {
  /* solid fills: step 9, hover step 10. Radix's green and red step 9 are
     3.1:1 and 4.0:1 with white text, under 4.5:1, so those two use step 11 */
  "--ui-primary": s("blue", 9, "#3e63dd"),
  "--ui-primary-fg": "#fff",
  "--ui-secondary": s("violet", 9, "#6e56cf"),
  "--ui-secondary-fg": "#fff",
  "--ui-success": s("green", 11, "#218358"),
  "--ui-success-fg": "#fff",
  "--ui-warning": s("amber", 9, "#ffc53d"),
  "--ui-warning-fg": s("amber", 12, "#4f3422"),
  "--ui-danger": s("red", 11, "#ce2c31"),
  "--ui-danger-fg": "#fff",

  "--ui-primary-hover": s("blue", 10, "#3358d4"),
  "--ui-secondary-hover": s("violet", 10, "#654dc4"),
  "--ui-success-hover": s("green", 12, "#193b2d"),
  "--ui-warning-hover": s("amber", 10, "#ffba18"),
  "--ui-danger-hover": s("red", 12, "#641723"),

  /* soft: step 3 background, step 11 text */
  "--ui-primary-soft": s("blue", 3, "#edf2fe"),
  "--ui-primary-soft-fg": s("blue", 11, "#3a5bc7"),
  "--ui-secondary-soft": s("violet", 3, "#f4f0fe"),
  "--ui-secondary-soft-fg": s("violet", 11, "#6550b9"),
  "--ui-success-soft": s("green", 3, "#e6f6eb"),
  "--ui-success-soft-fg": s("green", 12, "#193b2d"),
  "--ui-warning-soft": s("amber", 3, "#fff7c2"),
  "--ui-warning-soft-fg": s("amber", 12, "#4f3422"),
  "--ui-danger-soft": s("red", 3, "#feebec"),
  "--ui-danger-soft-fg": s("red", 11, "#ce2c31"),

  /* each intent as text and as an outline: step 11 (amber's step 11 is the
     brown that stays legible) */
  "--ui-primary-text": s("blue", 11, "#3a5bc7"),
  "--ui-secondary-text": s("violet", 11, "#6550b9"),
  "--ui-success-text": s("green", 11, "#218358"),
  "--ui-warning-text": s("amber", 12, "#4f3422"),
  "--ui-danger-text": s("red", 11, "#ce2c31"),
  "--ui-primary-border": s("blue", 9, "#3e63dd"),

  "--ui-neutral": s("gray", 12, "#202020"),
  "--ui-neutral-fg": s("gray", 1, "#fcfcfc"),
  "--ui-neutral-soft": s("gray", 3, "#f0f0f0"),
  "--ui-neutral-soft-fg": s("gray", 12, "#202020"),

  "--ui-surface": "var(--color-panel-solid, #fff)",
  "--ui-surface-fg": s("gray", 12, "#202020"),
  "--ui-surface-muted": s("gray", 3, "#f0f0f0"),
  "--ui-border": s("gray", 6, "#d9d9d9"),
  "--ui-ring": s("blue", 9, "#3e63dd"),
  "--ui-radius": "var(--radius-3, 6px)",
  "--ui-font-sans":
    "var(--default-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI (Custom)', Roboto, 'Helvetica Neue', 'Open Sans (Custom)', system-ui, sans-serif)",
  "--ui-text-sm": "var(--font-size-1, 12px)",
  "--ui-text-md": "var(--font-size-2, 14px)",
  "--ui-text-lg": "var(--font-size-3, 16px)",
  "--ui-overlay": "rgb(0 0 0 / 0.4)",
  "--ui-overlay-soft": "rgb(255 255 255 / 0.6)",
};

const dark = {
  ...light,
  /* on the dark scales red and green step 9 take dark text instead */
  "--ui-primary": s("blue", 9, "#3e63dd"),
  "--ui-success": s("green", 9, "#30a46c"),
  "--ui-success-fg": s("green", 1, "#0e1512"),
  "--ui-danger": s("red", 10, "#ec5d5e"),
  "--ui-danger-fg": s("red", 1, "#191111"),
  "--ui-warning-fg": s("amber", 1, "#16120c"),

  "--ui-primary-hover": s("blue", 10, "#5472e4"),
  "--ui-secondary-hover": s("violet", 10, "#7d66d9"),
  "--ui-success-hover": s("green", 10, "#33b074"),
  "--ui-warning-hover": s("amber", 10, "#ffd60a"),
  "--ui-danger-hover": s("red", 9, "#e5484d"),

  "--ui-primary-soft": s("blue", 3, "#182449"),
  "--ui-primary-soft-fg": s("blue", 11, "#9eb1ff"),
  "--ui-secondary-soft": s("violet", 3, "#291f43"),
  "--ui-secondary-soft-fg": s("violet", 11, "#baa7ff"),
  "--ui-success-soft": s("green", 3, "#132d21"),
  "--ui-success-soft-fg": s("green", 11, "#3dd68c"),
  "--ui-warning-soft": s("amber", 3, "#302008"),
  "--ui-warning-soft-fg": s("amber", 11, "#ffca16"),
  "--ui-danger-soft": s("red", 3, "#3b1219"),
  "--ui-danger-soft-fg": s("red", 11, "#ff9592"),

  "--ui-primary-text": s("blue", 11, "#9eb1ff"),
  "--ui-secondary-text": s("violet", 11, "#baa7ff"),
  "--ui-success-text": s("green", 11, "#3dd68c"),
  "--ui-warning-text": s("amber", 11, "#ffca16"),
  "--ui-danger-text": s("red", 11, "#ff9592"),
  "--ui-primary-border": s("blue", 9, "#3e63dd"),

  "--ui-neutral": s("gray", 12, "#eeeeee"),
  "--ui-neutral-fg": s("gray", 1, "#111111"),
  "--ui-neutral-soft": s("gray", 3, "#222222"),
  "--ui-neutral-soft-fg": s("gray", 12, "#eeeeee"),

  "--ui-surface": "var(--color-panel-solid, #191919)",
  "--ui-surface-fg": s("gray", 12, "#eeeeee"),
  "--ui-surface-muted": s("gray", 3, "#222222"),
  "--ui-border": s("gray", 6, "#3a3a3a"),
  "--ui-ring": s("blue", 11, "#9eb1ff"),
  "--ui-overlay": "rgb(0 0 0 / 0.6)",
  "--ui-overlay-soft": "rgb(25 25 25 / 0.6)",
};

/* ---- shared fragments ------------------------------------------------- */

/* Radix focus: a 2px outline in the accent, 2px off the edge. Step 8 is
   about 2.4:1 on white, so the ring uses the solid step 9 / 11 */
const ring = "0 0 0 2px var(--ui-surface), 0 0 0 4px var(--ui-c-text, var(--ui-ring))";
const fieldRing = "0 0 0 2px var(--ui-surface), 0 0 0 4px var(--ui-field-c, var(--ui-ring))";

/* Radix text fields: inset 1px gray-a7 (about 1.7:1). Controls must reach
   3:1, so the boundary is a 55% mix of the text colour */
/* secondary text: 68% of the text colour, so it follows light and dark */
const muted = "color-mix(in oklab, var(--ui-surface-fg) 68%, var(--ui-surface))";

const controlBorder = "color-mix(in oklab, var(--ui-surface-fg) 55%, var(--ui-surface))";

const control = {
  /* TextField size 2: 32px high, 8px inline padding, radius 4px */
  padding: "0 var(--space-2, 8px)",
  "min-height": "var(--space-6, 32px)",
  "font-size": "var(--font-size-2, 14px)",
  "font-weight": "400",
  "line-height": "var(--line-height-2, 20px)",
  "border-radius": "var(--radius-2, 4px)",
  "border-width": "1px",
  "border-color": `var(--ui-field-c, ${controlBorder})`,
  "background-color": "var(--ui-surface)",
  "box-shadow": "none",
  transition: "border-color 0.1s ease, box-shadow 0.1s ease",
  "&:hover": { "border-color": `var(--ui-field-c, ${controlBorder})` },
  "&:focus-visible": { outline: "0", "border-color": "var(--ui-field-c, var(--ui-ring))", "box-shadow": fieldRing },
};
const controlStyles = {
  /* variant="surface" is the default; classic/soft/ghost map below */
  outline: { "border-color": "var(--ui-field-c, var(--ui-c-text))" },
  ghost: { "background-color": "transparent", "border-color": "transparent" },
  soft: { "background-color": "var(--ui-c-soft, var(--ui-surface-muted))", "border-color": "transparent" },
};
const controlSizes = {
  sm: { "min-height": "var(--space-5, 24px)", "font-size": "var(--font-size-1, 12px)", padding: "0 var(--space-1, 4px)", "border-radius": "var(--radius-1, 3px)" },
  lg: { "min-height": "var(--space-7, 40px)", "font-size": "var(--font-size-3, 16px)", padding: "0 var(--space-3, 12px)", "border-radius": "var(--radius-3, 6px)" },
};
const controlStates = {
  disabled: { opacity: "0.5", cursor: "not-allowed" },
  loading: { cursor: "progress" },
  active: { "border-color": "var(--ui-field-c, var(--ui-ring))", "box-shadow": fieldRing },
};
const opacityStates = {
  disabled: { opacity: "0.5", cursor: "not-allowed", "pointer-events": "none" },
  loading: { cursor: "progress" },
  active: { "box-shadow": ring },
};

const checkBase = { "--ui-check-size": "1rem", "border-color": controlBorder, "border-radius": "var(--radius-1, 3px)" };
const checkStyles = {
  outline: { "border-color": "var(--ui-c-text)", "border-width": "2px" },
  ghost: { "background-color": "var(--ui-surface-muted)" },
  soft: { "background-color": "var(--ui-c-soft)" },
};
const checkSizes = { sm: { "--ui-check-size": "0.875rem" }, lg: { "--ui-check-size": "1.25rem" } };

/* Callout (soft): step 3 background, step 11 text; applies only when no
   style class overrides it */
const alertIntent = {
  "&:not(.ui-soft):not(.ui-ghost):not(.ui-outline)": {
    "background-color": "var(--ui-c-soft)",
    color: "var(--ui-c-soft-fg)",
  },
  "&:not(.ui-soft):not(.ui-ghost)": { "border-color": "transparent" },
};

/* the arc already follows the intent colour; stating it makes the slot explicit */
const spinnerIntent = { "--ui-spinner-color": "var(--ui-c-text)" };

export default defineAdapter({
  name: "radix",
  darkRootSelector: '.dark, .dark-theme, [data-theme="dark"]',
  tokens: light,
  darkTokens: dark,
  components: {
    /* ---- Button size 2: 32px, 12px inline, 14px, radius 4px --------- */
    button: {
      base: {
        padding: "0 var(--space-3, 12px)",
        "min-height": "var(--space-6, 32px)",
        "font-size": "var(--font-size-2, 14px)",
        "font-weight": "500",
        "line-height": "var(--line-height-2, 20px)",
        "border-radius": "var(--radius-2, 4px)",
        gap: "var(--space-2, 8px)",
        transition: "none",
        "&:focus-visible": { outline: "0", "box-shadow": ring },
      },
      styles: {
        /* variant="outline" */
        outline: { "&:hover": { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)" } },
        /* variant="ghost" */
        ghost: { "&:hover": { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)" } },
        /* variant="soft" */
        soft: { "&:hover": { "background-color": "var(--ui-c-soft-hover, var(--ui-c))", color: "var(--ui-on-c)" } },
      },
      sizes: {
        sm: { "min-height": "var(--space-5, 24px)", padding: "0 var(--space-2, 8px)", "font-size": "var(--font-size-1, 12px)", "border-radius": "var(--radius-1, 3px)" },
        lg: { "min-height": "var(--space-7, 40px)", padding: "0 var(--space-4, 16px)", "font-size": "var(--font-size-3, 16px)", "border-radius": "var(--radius-3, 6px)" },
      },
      states: opacityStates,
    },

    input: { base: control, styles: controlStyles, sizes: controlSizes, states: controlStates },
    textarea: { base: { ...control, padding: "var(--space-1, 4px) var(--space-2, 8px)", "min-height": "4rem" }, styles: controlStyles, sizes: controlSizes, states: controlStates },
    select: { base: control, styles: controlStyles, sizes: controlSizes, states: controlStates },
    checkbox: { base: checkBase, styles: checkStyles, sizes: checkSizes, states: opacityStates },
    radio: {
      base: { "--ui-radio-size": "1rem", "border-color": controlBorder },
      styles: checkStyles,
      sizes: { sm: { "--ui-radio-size": "0.875rem" }, lg: { "--ui-radio-size": "1.25rem" } },
      states: opacityStates,
    },
    /* Switch size 2: 36x20 pill */
    switch: {
      base: { "--ui-switch-size": "1.25rem", "--ui-switch-pad": "2px" },
      styles: checkStyles,
      sizes: { sm: { "--ui-switch-size": "1rem" }, lg: { "--ui-switch-size": "1.5rem" } },
      states: opacityStates,
    },
    field: { base: { "--ui-field-gap": "var(--space-1, 4px)" } },
    "field-label": { base: { "font-size": "var(--font-size-2, 14px)", "font-weight": "500", "margin-bottom": "var(--space-1, 4px)" } },
    "field-hint": { base: { "font-size": "var(--font-size-1, 12px)", color: muted } },
    "field-error": { base: { "font-size": "var(--font-size-1, 12px)", color: "var(--ui-danger-text, var(--ui-danger))" } },

    /* ---- Card (surface): radius-4, inset 1px gray ring, 16px padding */
    card: {
      base: {
        "--ui-card-pad": "var(--space-4, 16px)",
        "border-radius": "var(--radius-4, 8px)",
        "border-color": "var(--ui-border)",
        "box-shadow": "none",
      },
      styles: {
        outline: { "border-color": "var(--ui-c-border, var(--ui-c))", "border-width": "2px" },
        ghost: { "border-color": "transparent", "background-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)", "border-color": "transparent" },
      },
      sizes: { sm: { "--ui-card-pad": "var(--space-3, 12px)" }, lg: { "--ui-card-pad": "var(--space-5, 24px)" } },
      states: opacityStates,
    },
    "card-header": { base: { "border-bottom": "0", "padding-bottom": "0", "font-weight": "700", "font-size": "var(--font-size-3, 16px)" } },
    "card-body": { base: { padding: "var(--ui-card-pad, 16px)" } },
    "card-footer": { base: { "border-top": "0", "background-color": "transparent" } },

    /* ---- Badge size 1 (soft): 12px text, 8px inline, radius 4px ----- */
    badge: {
      base: {
        padding: "var(--space-1, 4px) var(--space-2, 8px)",
        "font-size": "var(--font-size-1, 12px)",
        "font-weight": "500",
        "line-height": "var(--line-height-1, 16px)",
        "border-radius": "var(--radius-2, 4px)",
        "background-color": "var(--ui-c-soft)",
        color: "var(--ui-c-soft-fg)",
        "border-color": "transparent",
      },
      styles: {
        outline: { "background-color": "transparent", color: "var(--ui-c-text)", "border-color": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "background-color": "transparent", "border-color": "transparent", color: "var(--ui-c-text)" },
        soft: { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)" },
      },
      sizes: { sm: { padding: "var(--space-1, 4px)", "font-size": "var(--font-size-1, 12px)" }, lg: { padding: "var(--space-1, 4px) var(--space-3, 12px)", "font-size": "var(--font-size-2, 14px)" } },
      states: opacityStates,
    },

    /* ---- Callout (soft): 12px padding, radius-3 --------------------- */
    alert: {
      base: { padding: "var(--space-3, 12px)", "font-size": "var(--font-size-2, 14px)", "border-radius": "var(--radius-3, 6px)", "border-width": "1px", "border-color": "transparent" },
      intents: { primary: alertIntent, secondary: alertIntent, success: alertIntent, warning: alertIntent, danger: alertIntent },
      styles: {
        outline: { "background-color": "transparent", color: "var(--ui-c-text)", "border-color": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "background-color": "transparent", "border-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)", "border-color": "transparent" },
      },
      sizes: { sm: { padding: "var(--space-2, 8px)", "font-size": "var(--font-size-1, 12px)" }, lg: { padding: "var(--space-4, 16px)", "font-size": "var(--font-size-3, 16px)" } },
      states: opacityStates,
    },

    /* ---- Table (surface) -------------------------------------------- */
    table: {
      base: {
        "--ui-table-pad-y": "var(--space-2, 8px)",
        "--ui-table-pad-x": "var(--space-3, 12px)",
        "--ui-table-border": "var(--ui-border)",
        "--ui-table-stripe": "var(--ui-surface-muted)",
        "--ui-table-row-hover": "var(--ui-surface-muted)",
        "font-size": "var(--font-size-2, 14px)",
      },
      styles: {
        outline: { "--ui-table-border": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "--ui-table-border": "transparent" },
        soft: { "--ui-table-stripe": "var(--ui-c-soft, var(--ui-surface-muted))" },
      },
      sizes: {
        sm: { "--ui-table-pad-y": "var(--space-1, 4px)", "--ui-table-pad-x": "var(--space-2, 8px)" },
        lg: { "--ui-table-pad-y": "var(--space-3, 12px)", "--ui-table-pad-x": "var(--space-4, 16px)" },
      },
      states: { loading: { cursor: "progress" } },
    },
    "table-wrap": { base: { "border-radius": "var(--radius-3, 6px)" } },

    /* ---- Accordion (a Radix primitive: themed like the other lists) */
    accordion: {
      base: {
        "--ui-accordion-pad-x": "var(--space-3, 12px)",
        "--ui-accordion-pad-y": "var(--space-3, 12px)",
        "--ui-accordion-border": "var(--ui-border)",
        "--ui-accordion-hover": "var(--ui-surface-muted)",
        "border-radius": "var(--radius-3, 6px)",
      },
      styles: {
        outline: { "--ui-accordion-border": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "--ui-accordion-border": "transparent" },
        soft: { "--ui-accordion-soft-bg": "var(--ui-c-soft)" },
      },
      sizes: {
        sm: { "--ui-accordion-pad-x": "var(--space-2, 8px)", "--ui-accordion-pad-y": "var(--space-2, 8px)" },
        lg: { "--ui-accordion-pad-x": "var(--space-4, 16px)", "--ui-accordion-pad-y": "var(--space-4, 16px)" },
      },
    },
    "accordion-item": { base: { "background-color": "var(--ui-surface)" } },
    "accordion-trigger": { base: { "font-weight": "500", "font-size": "var(--font-size-2, 14px)" } },
    "accordion-panel": { base: { "font-size": "var(--font-size-2, 14px)" } },

    /* ---- Progress size 2: 6px, gray track, accent bar --------------- */
    progress: {
      base: { "--ui-progress-h": "6px", "--ui-progress-track": "var(--ui-surface-muted)" },
      styles: {
        outline: { "--ui-progress-border": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "--ui-progress-track": "transparent" },
      },
      sizes: { sm: { "--ui-progress-h": "4px" }, lg: { "--ui-progress-h": "8px" } },
    },

    /* ---- Tooltip: gray-12 on gray-1, radius 4px, 12px text ---------- */
    tooltip: {
      base: {
        "--ui-tooltip-fs": "var(--font-size-1, 12px)",
        "--ui-tooltip-pad-y": "var(--space-1, 4px)",
        "--ui-tooltip-pad-x": "var(--space-2, 8px)",
        "--ui-tooltip-bg": "var(--ui-neutral)",
        "--ui-tooltip-fg": "var(--ui-neutral-fg)",
        "border-radius": "var(--radius-2, 4px)",
        "font-weight": "400",
      },
      styles: {
        outline: { "--ui-tooltip-bg": "var(--ui-surface)", "--ui-tooltip-fg": "var(--ui-surface-fg)" },
        soft: { "--ui-tooltip-bg": "var(--ui-c-soft)", "--ui-tooltip-fg": "var(--ui-c-soft-fg)" },
      },
      sizes: {
        sm: { "--ui-tooltip-fs": "11px" },
        lg: { "--ui-tooltip-fs": "var(--font-size-2, 14px)", "--ui-tooltip-pad-y": "var(--space-2, 8px)", "--ui-tooltip-pad-x": "var(--space-3, 12px)" },
      },
      states: { active: { visibility: "visible", opacity: "1" } },
    },
    "tooltip-anchor": { base: { "vertical-align": "middle" } },

    /* ---- Toast (a Radix primitive): panel, radius-3, shadow --------- */
    toast: {
      base: {
        "--ui-toast-w": "360px",
        "--ui-toast-fs": "var(--font-size-2, 14px)",
        "--ui-toast-pad-x": "var(--space-3, 12px)",
        "--ui-toast-pad-y": "var(--space-3, 12px)",
        "--ui-toast-gap": "var(--space-2, 8px)",
        "--ui-toast-edge": "var(--ui-border)",
        "--ui-toast-shadow": "0 12px 32px -16px rgb(0 0 0 / 0.3), 0 12px 60px rgb(0 0 0 / 0.15)",
        "border-radius": "var(--radius-3, 6px)",
      },
      styles: { outline: {}, soft: {} },
      sizes: {
        sm: { "--ui-toast-fs": "var(--font-size-1, 12px)", "--ui-toast-pad-x": "var(--space-2, 8px)", "--ui-toast-pad-y": "var(--space-2, 8px)" },
        lg: { "--ui-toast-fs": "var(--font-size-3, 16px)", "--ui-toast-pad-x": "var(--space-4, 16px)", "--ui-toast-pad-y": "var(--space-4, 16px)" },
      },
      states: { loading: { cursor: "progress" } },
    },
    "toast-region": { base: { "--ui-toast-offset": "var(--space-4, 16px)" } },

    /* ---- DropdownMenu: panel, radius-4, 4px padding, 32px items ----- */
    dropdown: { base: { "vertical-align": "middle" } },
    menu: {
      base: {
        "--ui-menu-fs": "var(--font-size-2, 14px)",
        "--ui-menu-w": "8rem",
        "--ui-menu-pad": "var(--space-1, 4px)",
        "--ui-menu-gap": "var(--space-1, 4px)",
        "--ui-menu-shadow": "0 12px 32px -16px rgb(0 0 0 / 0.3), 0 12px 60px rgb(0 0 0 / 0.15)",
        "--ui-menu-item-py": "6px",
        "--ui-menu-item-px": "var(--space-2, 8px)",
        "border-color": "var(--ui-border)",
        "border-radius": "var(--radius-4, 8px)",
      },
      styles: {
        ghost: { "border-color": "transparent", "box-shadow": "none" },
        soft: { "background-color": "var(--ui-surface-muted)" },
      },
      sizes: {
        sm: { "--ui-menu-fs": "var(--font-size-1, 12px)", "--ui-menu-item-py": "4px", "--ui-menu-item-px": "var(--space-2, 8px)" },
        lg: { "--ui-menu-fs": "var(--font-size-3, 16px)", "--ui-menu-item-py": "8px", "--ui-menu-item-px": "var(--space-3, 12px)" },
      },
    },
    "menu-item": {
      base: {
        /* a highlighted Radix menu item is a solid accent with white text */
        "--ui-menu-item-hover-bg": "var(--ui-primary)",
        "--ui-menu-item-hover-fg": "var(--ui-primary-fg)",
        "border-radius": "var(--radius-2, 4px)",
        "font-weight": "400",
      },
      sizes: {
        sm: { "--ui-menu-fs": "var(--font-size-1, 12px)", "--ui-menu-item-py": "4px", "--ui-menu-item-px": "var(--space-2, 8px)" },
        lg: { "--ui-menu-fs": "var(--font-size-3, 16px)", "--ui-menu-item-py": "8px", "--ui-menu-item-px": "var(--space-3, 12px)" },
      },
      states: {
        disabled: { opacity: "0.5", "pointer-events": "none" },
        active: { "background-color": "var(--ui-c-soft, var(--ui-primary-soft))", color: "var(--ui-c-soft-fg, var(--ui-primary-soft-fg))", "font-weight": "500" },
      },
    },
    "menu-label": { base: { "font-size": "var(--font-size-1, 12px)", "font-weight": "500" } },
    "menu-separator": { base: { margin: "var(--space-1, 4px) 0", "background-color": "var(--ui-border)" } },

    /* ---- Avatar (soft): size 3 = 40px ------------------------------- */
    avatar: {
      base: { "--ui-avatar-size": "40px", "font-weight": "500" },
      styles: { soft: { "font-weight": "500" }, outline: { "border-width": "2px" } },
      sizes: { sm: { "--ui-avatar-size": "32px" }, lg: { "--ui-avatar-size": "48px" } },
    },

    /* ---- Skeleton: gray-3 block, radius-2 --------------------------- */
    skeleton: {
      base: { "--ui-skeleton-bg": "var(--ui-surface-muted)", "border-radius": "var(--radius-2, 4px)" },
    },
    /* ---- Spinner size 2: 20px, 2px ring ----------------------------- */
    spinner: {
      base: { "--ui-spinner-size": "20px", "--ui-spinner-width": "2px" },
      intents: {
        primary: spinnerIntent,
        secondary: spinnerIntent,
        success: spinnerIntent,
        warning: spinnerIntent,
        danger: spinnerIntent,
      },
      sizes: {
        sm: { "--ui-spinner-size": "16px", "--ui-spinner-width": "2px" },
        lg: { "--ui-spinner-size": "24px", "--ui-spinner-width": "3px" },
      },
    },

    /* ---- Separator: 1px gray-6 -------------------------------------- */
    separator: {
      base: { "--ui-separator-color": "var(--ui-border)", "--ui-separator-gap": "var(--space-4, 16px)" },
    },

    /* ---- Breadcrumb (no Radix Themes part): gray-11 text, accent links */
    breadcrumb: {
      base: { "--ui-breadcrumb-fs": "var(--font-size-2, 14px)", "--ui-breadcrumb-sep": muted, gap: "var(--space-2, 8px)" },
      sizes: { sm: { "--ui-breadcrumb-fs": "var(--font-size-1, 12px)" }, lg: { "--ui-breadcrumb-fs": "var(--font-size-3, 16px)" } },
    },

    /* ---- Pagination (no Radix Themes part): outline IconButtons ----- */
    pagination: {
      base: { "--ui-pagination-size": "var(--space-6, 32px)", "--ui-pagination-fs": "var(--font-size-2, 14px)", gap: "var(--space-1, 4px)" },
      sizes: {
        sm: { "--ui-pagination-size": "var(--space-5, 24px)", "--ui-pagination-fs": "var(--font-size-1, 12px)" },
        lg: { "--ui-pagination-size": "var(--space-7, 40px)", "--ui-pagination-fs": "var(--font-size-3, 16px)" },
      },
    },
    "pagination-item": {
      base: {
        "border-radius": "var(--radius-2, 4px)",
        "font-weight": "500",
        "background-color": "transparent",
        "&:hover": { "background-color": "var(--ui-surface-muted)" },
        '&[aria-current="page"], &[aria-current="page"]:hover': {
          "background-color": "var(--ui-c-soft, var(--ui-neutral-soft))",
          color: "var(--ui-c-soft-fg, var(--ui-neutral-soft-fg))",
          "border-color": "var(--ui-c)",
        },
      },
      states: {
        disabled: { opacity: "0.5", "pointer-events": "none" },
        active: { "background-color": "var(--ui-c-soft, var(--ui-neutral-soft))", color: "var(--ui-c-soft-fg, var(--ui-neutral-soft-fg))", "border-color": "var(--ui-c)" },
      },
    },

    /* ---- Slider size 2: 6px track, 16px thumb ----------------------- */
    slider: {
      base: { "--ui-slider-track": "6px", "--ui-slider-thumb": "16px", "--ui-slider-track-bg": "var(--ui-surface-muted)" },
      sizes: {
        sm: { "--ui-slider-track": "4px", "--ui-slider-thumb": "12px" },
        lg: { "--ui-slider-track": "8px", "--ui-slider-thumb": "20px" },
      },
      states: { disabled: { opacity: "0.5", cursor: "not-allowed" } },
    },

    /* ---- Dialog size 3: 24px padding, radius-4; drawer docks it ----- */
    modal: {
      base: { "--ui-modal-w": "450px", padding: "var(--space-4, 16px)" },
      styles: { ghost: { "background-color": "transparent" }, soft: { "background-color": "var(--ui-overlay-soft)" } },
      sizes: { sm: { "--ui-modal-w": "300px" }, lg: { "--ui-modal-w": "600px" } },
      states: { active: { visibility: "visible", opacity: "1", "pointer-events": "auto", "transition-delay": "0s" } },
    },
    "modal-box": {
      base: {
        padding: "var(--space-5, 24px)",
        "border-radius": "var(--radius-4, 8px)",
        "border-top": "0",
        "box-shadow": "0 12px 32px -16px rgb(0 0 0 / 0.3), 0 12px 60px rgb(0 0 0 / 0.15)",
      },
      sizes: { sm: { padding: "var(--space-4, 16px)" }, lg: { padding: "var(--space-6, 32px)" } },
    },

    /* ---- Tabs: 40px triggers, a 2px accent rule under the active one */
    tabs: {
      base: { "border-color": "var(--ui-border)" },
      styles: {
        outline: { "border-color": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "border-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)" },
      },
      sizes: { sm: { "font-size": "var(--font-size-1, 12px)" }, lg: { "font-size": "var(--font-size-3, 16px)" } },
    },
    tab: {
      base: {
        "--ui-tab-fs": "var(--font-size-2, 14px)",
        "--ui-tab-px": "var(--space-3, 12px)",
        "--ui-tab-py": "var(--space-2, 8px)",
        "--ui-tab-radius": "0",
        "font-weight": "500",
        color: muted,
        "&:hover": { color: "var(--ui-surface-fg)", "background-color": "var(--ui-surface-muted)", "border-color": "transparent" },
      },
      sizes: {
        sm: { "--ui-tab-fs": "var(--font-size-1, 12px)", "--ui-tab-px": "var(--space-2, 8px)", "--ui-tab-py": "var(--space-1, 4px)" },
        lg: { "--ui-tab-fs": "var(--font-size-3, 16px)", "--ui-tab-px": "var(--space-4, 16px)", "--ui-tab-py": "var(--space-3, 12px)" },
      },
      states: {
        disabled: { opacity: "0.5", "pointer-events": "none" },
        loading: { cursor: "progress" },
        active: {
          color: "var(--ui-surface-fg)",
          "background-color": "transparent",
          "border-bottom-color": "var(--ui-primary-text)",
        },
      },
    },
  },
});
