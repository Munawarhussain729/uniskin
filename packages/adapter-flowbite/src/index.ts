import { defineAdapter } from "uniskin/adapter";

/**
 * Flowbite visual style for Uniskin: pure CSS, no Flowbite package, no
 * Flowbite JavaScript.
 *
 * Flowbite is built from Tailwind utilities, so its design tokens are
 * Tailwind's palette. Every colour here is a `var(--color-*)` reference to
 * Tailwind v4's theme variable with the palette value as the fallback, so a
 * project that overrides `--color-blue-700` in `@theme` re-themes the skin,
 * and one that does not still gets Flowbite's default look. Dark mode is
 * Flowbite's: the `.dark` class (also `[data-theme="dark"]` and
 * `prefers-color-scheme`).
 *
 * Every component and every documented modifier is defined (see
 * `checkAdapter` in `uniskin/conformance`).
 */

const c = (name: string, hex: string) => `var(--color-${name}, ${hex})`;

/* ---- palette --------------------------------------------------------- */

const light = {
  "--ui-primary": c("blue-700", "#1447e6"),
  "--ui-primary-fg": "#fff",
  "--ui-secondary": c("purple-700", "#8200db"),
  "--ui-secondary-fg": "#fff",
  "--ui-success": c("green-700", "#008236"),
  "--ui-success-fg": "#fff",
  "--ui-warning": c("yellow-400", "#fdc700"),
  "--ui-warning-fg": c("gray-900", "#101828"),
  "--ui-danger": c("red-700", "#c10007"),
  "--ui-danger-fg": "#fff",

  /* Flowbite's hover shades (hover:bg-*-800) */
  "--ui-primary-hover": c("blue-800", "#193cb8"),
  "--ui-secondary-hover": c("purple-800", "#6e11b0"),
  "--ui-success-hover": c("green-800", "#016630"),
  "--ui-warning-hover": c("yellow-500", "#f0b100"),
  "--ui-danger-hover": c("red-800", "#9f0712"),

  /* alerts and badges: bg-*-50 / 100 with text-*-800 */
  "--ui-primary-soft": c("blue-100", "#dbeafe"),
  "--ui-primary-soft-fg": c("blue-800", "#193cb8"),
  "--ui-secondary-soft": c("purple-100", "#f3e8ff"),
  "--ui-secondary-soft-fg": c("purple-800", "#6e11b0"),
  "--ui-success-soft": c("green-100", "#dcfce7"),
  "--ui-success-soft-fg": c("green-800", "#016630"),
  "--ui-warning-soft": c("yellow-100", "#fef9c2"),
  "--ui-warning-soft-fg": c("yellow-800", "#894b00"),
  "--ui-danger-soft": c("red-100", "#ffe2e2"),
  "--ui-danger-soft-fg": c("red-800", "#9f0712"),

  /* each intent as text on white; Flowbite's yellow is a fill only */
  "--ui-primary-text": c("blue-700", "#1447e6"),
  "--ui-secondary-text": c("purple-700", "#8200db"),
  "--ui-success-text": c("green-700", "#008236"),
  "--ui-warning-text": c("yellow-800", "#894b00"),
  "--ui-danger-text": c("red-700", "#c10007"),

  "--ui-neutral": c("gray-800", "#1e2939"),
  "--ui-neutral-fg": "#fff",
  "--ui-neutral-soft": c("gray-100", "#f3f4f6"),
  "--ui-neutral-soft-fg": c("gray-900", "#101828"),

  "--ui-surface": "#fff",
  "--ui-surface-fg": c("gray-900", "#101828"),
  "--ui-surface-muted": c("gray-100", "#f3f4f6"),
  "--ui-border": c("gray-200", "#e5e7eb"),
  "--ui-ring": c("blue-600", "#155dfc"),
  "--ui-radius": "0.5rem",
  "--ui-font-sans":
    "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  "--ui-text-sm": "0.875rem",
  "--ui-text-md": "0.875rem",
  "--ui-text-lg": "1rem",
  "--ui-overlay": "rgb(17 24 39 / 0.5)",
  "--ui-overlay-soft": "rgb(255 255 255 / 0.6)",
};

/* Flowbite dark: gray-800 cards on a gray-900 page, text gray-400 / white,
   blue-600 fills, *-900 tints with *-300 text */
const dark = {
  ...light,
  "--ui-primary": c("blue-600", "#155dfc"),
  "--ui-primary-hover": c("blue-700", "#1447e6"),
  "--ui-secondary": c("purple-600", "#9810fa"),
  "--ui-secondary-hover": c("purple-700", "#8200db"),
  "--ui-danger": c("red-600", "#e7000b"),
  "--ui-danger-hover": c("red-700", "#c10007"),

  "--ui-primary-text": c("blue-300", "#8ec5ff"),
  "--ui-secondary-text": c("purple-400", "#c27aff"),
  "--ui-success-text": c("green-400", "#05df72"),
  "--ui-warning-text": c("yellow-300", "#ffdf20"),
  "--ui-danger-text": c("red-400", "#ff6467"),

  "--ui-primary-soft": c("blue-900", "#1c398e"),
  "--ui-primary-soft-fg": c("blue-300", "#8ec5ff"),
  "--ui-secondary-soft": c("purple-900", "#59168b"),
  "--ui-secondary-soft-fg": c("purple-300", "#dab2ff"),
  "--ui-success-soft": c("green-900", "#0d542b"),
  "--ui-success-soft-fg": c("green-300", "#7bf1a8"),
  "--ui-warning-soft": c("yellow-900", "#733e0a"),
  "--ui-warning-soft-fg": c("yellow-300", "#ffdf20"),
  "--ui-danger-soft": c("red-900", "#82181a"),
  "--ui-danger-soft-fg": c("red-300", "#ffa2a2"),

  "--ui-neutral": c("gray-200", "#e5e7eb"),
  "--ui-neutral-fg": c("gray-900", "#101828"),
  "--ui-neutral-soft": c("gray-700", "#364153"),
  "--ui-neutral-soft-fg": "#fff",

  "--ui-surface": c("gray-800", "#1e2939"),
  "--ui-surface-fg": "#fff",
  "--ui-surface-muted": c("gray-700", "#364153"),
  "--ui-border": c("gray-600", "#4a5565"),
  "--ui-ring": c("blue-400", "#51a2ff"),
  "--ui-overlay": "rgb(17 24 39 / 0.7)",
  "--ui-overlay-soft": "rgb(31 41 55 / 0.6)",
};

/* ---- shared fragments ------------------------------------------------- */

/* Flowbite's focus is ring-4 in a pale blue (about 1.7:1 on white, under
   WCAG 1.4.11's 3:1): the same 4px footprint, solid, after a gap */
const ring = "0 0 0 2px var(--ui-surface), 0 0 0 4px var(--ui-c-text, var(--ui-ring))";
const fieldRing = "0 0 0 2px var(--ui-surface), 0 0 0 4px var(--ui-field-c, var(--ui-ring))";

/* Flowbite's gray-300 control border is 1.5:1 on white; controls must reach
   3:1, so they use gray-500 (4.8:1) in light and gray-400 in dark */
const controlBorder = "color-mix(in oklab, var(--ui-surface-fg) 55%, var(--ui-surface))";

const control = {
  padding: "0.625rem",
  "font-size": "0.875rem",
  "font-weight": "400",
  "line-height": "1.25rem",
  "border-radius": "0.5rem",
  "border-width": "1px",
  "border-color": `var(--ui-field-c, ${controlBorder})`,
  /* bg-gray-50 / dark:bg-gray-700 */
  "background-color": "var(--ui-surface-muted)",
  "box-shadow": "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  "&:hover": { "border-color": `var(--ui-field-c, ${controlBorder})` },
  "&:focus-visible": { outline: "0", "border-color": "var(--ui-field-c, var(--ui-ring))", "box-shadow": fieldRing },
};
const controlStyles = {
  outline: { "background-color": "var(--ui-surface)", "border-color": "var(--ui-field-c, var(--ui-c-text))" },
  ghost: { "background-color": "transparent", "border-color": "transparent" },
  soft: { "background-color": "var(--ui-c-soft, var(--ui-surface-muted))", "border-color": "transparent" },
};
const controlSizes = {
  sm: { padding: "0.5rem", "font-size": "0.75rem", "border-radius": "0.5rem" },
  lg: { padding: "1rem", "font-size": "1rem", "border-radius": "0.5rem" },
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

const checkBase = { "--ui-check-size": "1rem", "border-color": controlBorder, "border-radius": "0.25rem" };
const checkStyles = {
  outline: { "border-color": "var(--ui-c-text)", "border-width": "2px" },
  ghost: { "background-color": "var(--ui-surface-muted)" },
  soft: { "background-color": "var(--ui-c-soft)" },
};
const checkSizes = { sm: { "--ui-check-size": "0.875rem" }, lg: { "--ui-check-size": "1.25rem" } };

/* Flowbite alerts: bg-*-50 with text-*-800 and no border (the tint is the
   edge); the tint applies only when no style class overrides it */
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
  name: "flowbite",
  darkTokens: dark,
  tokens: light,
  components: {
    /* ---- buttons: px-5 py-2.5 text-sm font-medium rounded-lg -------- */
    button: {
      base: {
        padding: "0.625rem 1.25rem",
        "font-size": "0.875rem",
        "font-weight": "500",
        "line-height": "1.25rem",
        "border-radius": "0.5rem",
        gap: "0.5rem",
        transition: "none",
        "&:focus-visible": { outline: "0", "box-shadow": ring },
      },
      styles: {
        outline: { "&:hover": { "background-color": "var(--ui-c)", color: "var(--ui-on-c)", "border-color": "var(--ui-c)" } },
        /* Flowbite "alternative": a plain button that gains a fill on hover */
        ghost: { "&:hover": { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)" } },
        soft: { "&:hover": { "background-color": "var(--ui-c-soft-hover, var(--ui-c))", color: "var(--ui-on-c)" } },
      },
      sizes: {
        sm: { padding: "0.375rem 0.75rem", "font-size": "0.75rem" },
        lg: { padding: "0.75rem 1.5rem", "font-size": "1rem" },
      },
      states: opacityStates,
    },

    input: { base: control, styles: controlStyles, sizes: controlSizes, states: controlStates },
    textarea: { base: { ...control, "min-height": "5rem" }, styles: controlStyles, sizes: controlSizes, states: controlStates },
    select: { base: control, styles: controlStyles, sizes: controlSizes, states: controlStates },
    checkbox: { base: checkBase, styles: checkStyles, sizes: checkSizes, states: opacityStates },
    radio: {
      base: { "--ui-radio-size": "1rem", "border-color": controlBorder },
      styles: checkStyles,
      sizes: { sm: { "--ui-radio-size": "0.875rem" }, lg: { "--ui-radio-size": "1.25rem" } },
      states: opacityStates,
    },
    /* Flowbite toggle: w-11 h-6 pill, thumb 20px */
    switch: {
      base: { "--ui-switch-size": "1.5rem", "--ui-switch-pad": "2px" },
      styles: checkStyles,
      sizes: { sm: { "--ui-switch-size": "1.25rem" }, lg: { "--ui-switch-size": "1.75rem" } },
      states: opacityStates,
    },
    field: { base: { "--ui-field-gap": "0.5rem" } },
    "field-label": { base: { "font-size": "0.875rem", "font-weight": "500", "margin-bottom": "0.5rem" } },
    "field-hint": { base: { "font-size": "0.875rem", color: "var(--ui-hint, color-mix(in oklab, var(--ui-surface-fg) 70%, var(--ui-surface)))" } },
    "field-error": { base: { "font-size": "0.875rem", color: "var(--ui-danger-text, var(--ui-danger))" } },

    /* ---- card: bg-white border border-gray-200 rounded-lg shadow-sm p-6 */
    card: {
      base: {
        "--ui-card-pad": "1.5rem",
        "border-radius": "0.5rem",
        "border-color": "var(--ui-border)",
        "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      styles: {
        outline: { "border-color": "var(--ui-c-border, var(--ui-c))", "border-width": "2px" },
        ghost: { "border-color": "transparent", "box-shadow": "none", "background-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)", "border-color": "transparent" },
      },
      sizes: { sm: { "--ui-card-pad": "1rem" }, lg: { "--ui-card-pad": "2rem" } },
      states: opacityStates,
    },
    "card-header": { base: { "border-bottom": "0", "padding-bottom": "0", "font-weight": "700", "font-size": "1.25rem" } },
    "card-body": { base: { padding: "var(--ui-card-pad, 1.5rem)" } },
    "card-footer": { base: { "border-top": "0", "background-color": "transparent" } },

    /* ---- badge: text-xs font-medium px-2.5 py-0.5 rounded ------------ */
    badge: {
      base: {
        padding: "0.125rem 0.625rem",
        "font-size": "0.75rem",
        "font-weight": "500",
        "line-height": "1rem",
        "border-radius": "0.25rem",
        /* bg-*-100 text-*-800 is Flowbite's default badge */
        "background-color": "var(--ui-c-soft)",
        color: "var(--ui-c-soft-fg)",
        "border-color": "transparent",
      },
      styles: {
        outline: { "background-color": "transparent", color: "var(--ui-c-text)", "border-color": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "background-color": "transparent", "border-color": "transparent", color: "var(--ui-c-text)" },
        soft: { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)" },
      },
      sizes: { sm: { "font-size": "0.75rem", padding: "0.125rem 0.375rem" }, lg: { "font-size": "0.875rem", padding: "0.25rem 0.625rem", "border-radius": "0.25rem" } },
      states: opacityStates,
    },

    /* ---- alert: p-4 text-sm rounded-lg bg-*-50 text-*-800 ----------- */
    alert: {
      base: { padding: "1rem", "font-size": "0.875rem", "border-radius": "0.5rem", "border-width": "1px", "border-color": "transparent" },
      intents: { primary: alertIntent, secondary: alertIntent, success: alertIntent, warning: alertIntent, danger: alertIntent },
      styles: {
        outline: { "background-color": "transparent", color: "var(--ui-c-text)", "border-color": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "background-color": "transparent", "border-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)", "border-color": "transparent" },
      },
      sizes: { sm: { padding: "0.5rem 0.75rem", "font-size": "0.75rem" }, lg: { padding: "1.25rem", "font-size": "1rem" } },
      states: opacityStates,
    },

    /* ---- table: text-sm, uppercase text-xs gray-50 header, row rules - */
    table: {
      base: {
        "--ui-table-pad-y": "1rem",
        "--ui-table-pad-x": "1.5rem",
        "--ui-table-border": "var(--ui-border)",
        "--ui-table-stripe": "var(--ui-surface-muted)",
        "--ui-table-row-hover": "var(--ui-surface-muted)",
        "--ui-table-head-bg": "var(--ui-surface-muted)",
        "font-size": "0.875rem",
      },
      styles: {
        outline: { "--ui-table-border": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "--ui-table-border": "transparent" },
        soft: { "--ui-table-stripe": "var(--ui-c-soft, var(--ui-surface-muted))" },
      },
      sizes: {
        sm: { "--ui-table-pad-y": "0.5rem", "--ui-table-pad-x": "0.75rem" },
        lg: { "--ui-table-pad-y": "1.25rem", "--ui-table-pad-x": "1.75rem" },
      },
      states: { loading: { cursor: "progress" } },
    },
    "table-wrap": { base: { "border-radius": "0.5rem", "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)" } },

    /* ---- accordion: bordered, rounded ends, p-5 font-medium trigger - */
    accordion: {
      base: {
        "--ui-accordion-pad-x": "1.25rem",
        "--ui-accordion-pad-y": "1.25rem",
        "--ui-accordion-border": "var(--ui-border)",
        "--ui-accordion-hover": "var(--ui-surface-muted)",
        "border-radius": "0.75rem",
      },
      styles: {
        outline: { "--ui-accordion-border": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "--ui-accordion-border": "transparent" },
        soft: { "--ui-accordion-soft-bg": "var(--ui-c-soft)" },
      },
      sizes: {
        sm: { "--ui-accordion-pad-x": "0.75rem", "--ui-accordion-pad-y": "0.75rem" },
        lg: { "--ui-accordion-pad-x": "1.75rem", "--ui-accordion-pad-y": "1.5rem" },
      },
    },
    "accordion-item": { base: { "background-color": "var(--ui-surface)" } },
    "accordion-trigger": { base: { "font-weight": "500", "font-size": "1rem" } },
    "accordion-panel": { base: { "font-size": "1rem" } },

    /* ---- progress: h-2.5 gray-200 track, blue-600 bar --------------- */
    progress: {
      base: { "--ui-progress-h": "0.625rem", "--ui-progress-track": "var(--ui-surface-muted)" },
      styles: {
        outline: { "--ui-progress-border": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "--ui-progress-track": "transparent" },
      },
      sizes: { sm: { "--ui-progress-h": "0.375rem" }, lg: { "--ui-progress-h": "1rem" } },
    },

    /* ---- tooltip: px-3 py-2 text-sm font-medium bg-gray-900 -------- */
    tooltip: {
      base: {
        "--ui-tooltip-fs": "0.875rem",
        "--ui-tooltip-pad-y": "0.5rem",
        "--ui-tooltip-pad-x": "0.75rem",
        "--ui-tooltip-bg": c("gray-900", "#101828"),
        "--ui-tooltip-fg": "#fff",
        "border-radius": "0.5rem",
        "font-weight": "500",
        "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      styles: {
        outline: { "--ui-tooltip-bg": "var(--ui-surface)", "--ui-tooltip-fg": "var(--ui-surface-fg)" },
        soft: { "--ui-tooltip-bg": "var(--ui-c-soft)", "--ui-tooltip-fg": "var(--ui-c-soft-fg)" },
      },
      sizes: {
        sm: { "--ui-tooltip-fs": "0.75rem", "--ui-tooltip-pad-y": "0.25rem", "--ui-tooltip-pad-x": "0.5rem" },
        lg: { "--ui-tooltip-fs": "1rem", "--ui-tooltip-pad-y": "0.625rem", "--ui-tooltip-pad-x": "1rem" },
      },
      states: { active: { visibility: "visible", opacity: "1" } },
    },
    "tooltip-anchor": { base: { "vertical-align": "middle" } },

    /* ---- toast: max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm */
    toast: {
      base: {
        "--ui-toast-w": "20rem",
        "--ui-toast-fs": "0.875rem",
        "--ui-toast-pad-x": "1rem",
        "--ui-toast-pad-y": "1rem",
        "--ui-toast-gap": "1rem",
        "--ui-toast-edge": "transparent",
        "--ui-toast-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "border-radius": "0.5rem",
      },
      styles: { outline: {}, soft: {} },
      sizes: {
        sm: { "--ui-toast-fs": "0.75rem", "--ui-toast-pad-x": "0.75rem", "--ui-toast-pad-y": "0.75rem" },
        lg: { "--ui-toast-fs": "1rem", "--ui-toast-pad-x": "1.25rem", "--ui-toast-pad-y": "1.25rem" },
      },
      states: { loading: { cursor: "progress" } },
    },
    "toast-region": { base: { "--ui-toast-offset": "1.25rem" } },

    /* ---- dropdown: rounded-lg shadow-sm, w-44, px-4 py-2 items ------ */
    dropdown: { base: { "vertical-align": "middle" } },
    menu: {
      base: {
        "--ui-menu-fs": "0.875rem",
        "--ui-menu-w": "11rem",
        "--ui-menu-pad": "0.25rem 0",
        "--ui-menu-gap": "0.5rem",
        "--ui-menu-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "--ui-menu-item-py": "0.5rem",
        "--ui-menu-item-px": "1rem",
        "border-color": "var(--ui-border)",
        "border-radius": "0.5rem",
        gap: "0",
      },
      styles: {
        ghost: { "border-color": "transparent", "box-shadow": "none" },
        soft: { "background-color": "var(--ui-surface-muted)" },
      },
      sizes: {
        sm: { "--ui-menu-fs": "0.75rem", "--ui-menu-item-py": "0.25rem", "--ui-menu-item-px": "0.75rem" },
        lg: { "--ui-menu-fs": "1rem", "--ui-menu-item-py": "0.625rem", "--ui-menu-item-px": "1.25rem" },
      },
    },
    "menu-item": {
      base: {
        "--ui-menu-item-hover-bg": "var(--ui-surface-muted)",
        "--ui-menu-item-hover-fg": "var(--ui-surface-fg)",
        "border-radius": "0",
        "font-weight": "400",
      },
      sizes: {
        sm: { "--ui-menu-fs": "0.75rem", "--ui-menu-item-py": "0.25rem", "--ui-menu-item-px": "0.75rem" },
        lg: { "--ui-menu-fs": "1rem", "--ui-menu-item-py": "0.625rem", "--ui-menu-item-px": "1.25rem" },
      },
      states: {
        disabled: { opacity: "0.5", "pointer-events": "none" },
        active: { "background-color": "var(--ui-surface-muted)", color: "var(--ui-primary-text)", "font-weight": "500" },
      },
    },
    "menu-label": { base: { "font-size": "0.75rem", "font-weight": "500" } },
    "menu-separator": { base: { margin: "0.25rem 0", "background-color": "var(--ui-border)" } },

    /* ---- avatar: rounded-full, gray placeholder --------------------- */
    avatar: {
      base: { "--ui-avatar-size": "2.5rem", "font-weight": "500" },
      styles: { soft: { "font-weight": "500" }, outline: { "border-width": "2px" } },
      sizes: { sm: { "--ui-avatar-size": "2rem" }, lg: { "--ui-avatar-size": "3.5rem" } },
    },

    /* ---- skeleton: gray-200 / dark gray-700, animate-pulse ---------- */
    skeleton: {
      base: { "--ui-skeleton-bg": "var(--ui-surface-muted)", "border-radius": "9999px", height: "0.625rem" },
    },
    /* ---- spinner: 2rem, 3px ring (Flowbite's w-8 h-8) ---------------- */
    spinner: {
      base: { "--ui-spinner-size": "2rem", "--ui-spinner-width": "3px" },
      intents: {
        primary: spinnerIntent,
        secondary: spinnerIntent,
        success: spinnerIntent,
        warning: spinnerIntent,
        danger: spinnerIntent,
      },
      sizes: {
        sm: { "--ui-spinner-size": "1.25rem", "--ui-spinner-width": "2px" },
        lg: { "--ui-spinner-size": "3rem", "--ui-spinner-width": "4px" },
      },
    },

    separator: {
      base: { "--ui-separator-color": "var(--ui-border)", "--ui-separator-gap": "1.5rem" },
    },

    /* ---- breadcrumb: text-sm font-medium gray-700, hover blue-600 --- */
    breadcrumb: {
      base: { "--ui-breadcrumb-fs": "0.875rem", "--ui-breadcrumb-sep": "var(--ui-surface-fg)", gap: "0.5rem" },
      sizes: { sm: { "--ui-breadcrumb-fs": "0.75rem" }, lg: { "--ui-breadcrumb-fs": "1rem" } },
    },

    /* ---- pagination: h-8 px-3 leading-tight border gray-300 --------- */
    pagination: {
      base: { "--ui-pagination-size": "2rem", "--ui-pagination-fs": "0.875rem", gap: "0" },
      sizes: {
        sm: { "--ui-pagination-size": "1.75rem", "--ui-pagination-fs": "0.75rem" },
        lg: { "--ui-pagination-size": "2.5rem", "--ui-pagination-fs": "1rem" },
      },
    },
    "pagination-item": {
      base: {
        "border-radius": "0",
        "margin-left": "-1px",
        "font-weight": "400",
        "background-color": "transparent",
        color: "color-mix(in oklab, var(--ui-surface-fg) 75%, var(--ui-surface))",
        "&:hover": { "background-color": "var(--ui-surface-muted)" },
        /* the current page: text-blue-600 border-blue-300 bg-blue-50 */
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

    slider: {
      base: { "--ui-slider-track": "0.5rem", "--ui-slider-thumb": "1rem", "--ui-slider-track-bg": "var(--ui-surface-muted)" },
      sizes: {
        sm: { "--ui-slider-track": "0.25rem", "--ui-slider-thumb": "0.875rem" },
        lg: { "--ui-slider-track": "0.75rem", "--ui-slider-thumb": "1.5rem" },
      },
      states: { disabled: { opacity: "0.5", cursor: "not-allowed" } },
    },

    /* ---- modal: rounded-lg shadow-sm; drawer: w-80 ------------------ */
    modal: {
      base: { "--ui-modal-w": "32rem", padding: "1rem" },
      styles: { ghost: { "background-color": "transparent" }, soft: { "background-color": "var(--ui-overlay-soft)" } },
      sizes: { sm: { "--ui-modal-w": "28rem" }, lg: { "--ui-modal-w": "56rem" } },
      states: { active: { visibility: "visible", opacity: "1", "pointer-events": "auto", "transition-delay": "0s" } },
    },
    "modal-box": {
      base: {
        padding: "1.25rem",
        "border-radius": "0.5rem",
        "border-top": "0",
        "box-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      },
      sizes: { sm: { padding: "1rem" }, lg: { padding: "1.75rem" } },
    },

    /* ---- tabs: text-sm font-medium, border-b, active blue border ---- */
    tabs: {
      base: { "border-color": "var(--ui-border)" },
      styles: {
        outline: { "border-color": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "border-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)" },
      },
      sizes: { sm: { "font-size": "0.75rem" }, lg: { "font-size": "1rem" } },
    },
    tab: {
      base: {
        "--ui-tab-fs": "0.875rem",
        "--ui-tab-px": "1rem",
        "--ui-tab-py": "1rem",
        "--ui-tab-radius": "0.5rem 0.5rem 0 0",
        "font-weight": "500",
        color: "color-mix(in oklab, var(--ui-surface-fg) 75%, var(--ui-surface))",
        "&:hover": {
          color: "var(--ui-surface-fg)",
          "background-color": "transparent",
          "border-color": "var(--ui-border)",
        },
      },
      sizes: {
        sm: { "--ui-tab-fs": "0.75rem", "--ui-tab-px": "0.75rem", "--ui-tab-py": "0.5rem" },
        lg: { "--ui-tab-fs": "1rem", "--ui-tab-px": "1.25rem", "--ui-tab-py": "1.25rem" },
      },
      states: {
        disabled: { opacity: "0.5", "pointer-events": "none" },
        loading: { cursor: "progress" },
        active: {
          color: "var(--ui-primary-text)",
          "background-color": "transparent",
          "border-bottom-color": "var(--ui-primary-text)",
        },
      },
    },
  },
});
