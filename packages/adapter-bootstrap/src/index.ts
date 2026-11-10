import { defineAdapter } from "uniskin/adapter";

/**
 * Bootstrap 5.3 visual style for Uniskin: pure CSS, no Bootstrap package
 * required, no jQuery or Popper.
 *
 * Every colour, radius and font is a `var(--bs-*)` reference with Bootstrap's
 * own value as the fallback, so:
 *
 * - with Bootstrap's stylesheet also loaded, Uniskin classes follow its
 *   variables, including a customised `--bs-primary` and `data-bs-theme`;
 * - without Bootstrap, they still render in Bootstrap's default look.
 *
 * Dark mode follows Bootstrap's own switch, `data-bs-theme="dark"`, as well as
 * Uniskin's `.dark` and `[data-theme="dark"]`.
 *
 * Every component and every documented modifier is defined here (see
 * `checkAdapter` in `uniskin/conformance`); nothing falls back to the default
 * skin's look except where Bootstrap has no equivalent and the token mapping
 * is the faithful result.
 */

/* ---- palette --------------------------------------------------------- */

const light = {
  "--ui-primary": "var(--bs-primary, #0d6efd)",
  "--ui-primary-fg": "#fff",
  "--ui-secondary": "var(--bs-secondary, #6c757d)",
  "--ui-secondary-fg": "#fff",
  "--ui-success": "var(--bs-success, #198754)",
  "--ui-success-fg": "#fff",
  "--ui-warning": "var(--bs-warning, #ffc107)",
  "--ui-warning-fg": "#000",
  "--ui-danger": "var(--bs-danger, #dc3545)",
  "--ui-danger-fg": "#fff",

  /* Bootstrap's own hover shades (btn-*-hover-bg) */
  "--ui-primary-hover": "#0b5ed7",
  "--ui-secondary-hover": "#5c636a",
  "--ui-success-hover": "#157347",
  "--ui-warning-hover": "#ffca2c",
  "--ui-danger-hover": "#bb2d3b",

  /* the -subtle backgrounds and -text-emphasis colours: ui-soft, and the
     text colour of an intent on a light page (a bright warning yellow is
     not legible as text, so it uses the emphasis colour) */
  "--ui-primary-soft": "var(--bs-primary-bg-subtle, #cfe2ff)",
  "--ui-primary-soft-fg": "var(--bs-primary-text-emphasis, #052c65)",
  "--ui-secondary-soft": "var(--bs-secondary-bg-subtle, #e2e3e5)",
  "--ui-secondary-soft-fg": "var(--bs-secondary-text-emphasis, #2b2f32)",
  "--ui-success-soft": "var(--bs-success-bg-subtle, #d1e7dd)",
  "--ui-success-soft-fg": "var(--bs-success-text-emphasis, #0a3622)",
  "--ui-warning-soft": "var(--bs-warning-bg-subtle, #fff3cd)",
  "--ui-warning-soft-fg": "var(--bs-warning-text-emphasis, #664d03)",
  "--ui-danger-soft": "var(--bs-danger-bg-subtle, #f8d7da)",
  "--ui-danger-soft-fg": "var(--bs-danger-text-emphasis, #58151c)",
  "--ui-warning-text": "var(--bs-warning-text-emphasis, #664d03)",

  "--ui-neutral": "var(--bs-dark, #212529)",
  "--ui-neutral-fg": "#fff",
  "--ui-neutral-soft": "var(--bs-tertiary-bg, #f8f9fa)",
  "--ui-neutral-soft-fg": "var(--bs-body-color, #212529)",

  "--ui-surface": "var(--bs-body-bg, #fff)",
  "--ui-surface-fg": "var(--bs-body-color, #212529)",
  "--ui-surface-muted": "var(--bs-secondary-bg, #e9ecef)",
  "--ui-border": "var(--bs-border-color, #dee2e6)",
  "--ui-ring": "var(--bs-primary, #0d6efd)",
  "--ui-radius": "var(--bs-border-radius, 0.375rem)",
  "--ui-font-sans":
    "var(--bs-font-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', 'Liberation Sans', Arial, sans-serif)",
  "--ui-text-sm": "0.875rem",
  "--ui-text-md": "1rem",
  "--ui-text-lg": "1.25rem",
  "--ui-overlay": "rgb(0 0 0 / 0.5)",
  "--ui-overlay-soft": "rgb(255 255 255 / 0.6)",
};

/* Bootstrap's dark theme (data-bs-theme="dark"). Fills keep the same colours;
   text, subtle backgrounds, surfaces and borders switch. These are literal
   values rather than var() aliases of --bs-*, because Bootstrap's own dark
   values are what we want even when its stylesheet is not loaded. */
const dark = {
  ...light,
  "--ui-primary-text": "var(--bs-primary-text-emphasis, #6ea8fe)",
  "--ui-secondary-text": "var(--bs-secondary-text-emphasis, #a7acb1)",
  "--ui-success-text": "var(--bs-success-text-emphasis, #75b798)",
  "--ui-warning-text": "var(--bs-warning-text-emphasis, #ffda6a)",
  "--ui-danger-text": "var(--bs-danger-text-emphasis, #ea868f)",

  "--ui-primary-soft": "var(--bs-primary-bg-subtle, #031633)",
  "--ui-primary-soft-fg": "var(--bs-primary-text-emphasis, #6ea8fe)",
  "--ui-secondary-soft": "var(--bs-secondary-bg-subtle, #161719)",
  "--ui-secondary-soft-fg": "var(--bs-secondary-text-emphasis, #a7acb1)",
  "--ui-success-soft": "var(--bs-success-bg-subtle, #051b11)",
  "--ui-success-soft-fg": "var(--bs-success-text-emphasis, #75b798)",
  "--ui-warning-soft": "var(--bs-warning-bg-subtle, #332701)",
  "--ui-warning-soft-fg": "var(--bs-warning-text-emphasis, #ffda6a)",
  "--ui-danger-soft": "var(--bs-danger-bg-subtle, #2c0b0e)",
  "--ui-danger-soft-fg": "var(--bs-danger-text-emphasis, #ea868f)",

  "--ui-neutral": "var(--bs-light, #dee2e6)",
  "--ui-neutral-fg": "#212529",
  "--ui-neutral-soft": "var(--bs-tertiary-bg, #2b3035)",
  "--ui-neutral-soft-fg": "var(--bs-body-color, #dee2e6)",

  "--ui-surface": "var(--bs-body-bg, #212529)",
  "--ui-surface-fg": "var(--bs-body-color, #dee2e6)",
  "--ui-surface-muted": "var(--bs-secondary-bg, #343a40)",
  "--ui-border": "var(--bs-border-color, #495057)",
  "--ui-overlay": "rgb(0 0 0 / 0.6)",
  "--ui-overlay-soft": "rgb(33 37 41 / 0.6)",
  /* Bootstrap's blue is under 3:1 against its dark muted surfaces; its own
     dark link colour keeps the focus ring visible on them */
  "--ui-ring": "var(--bs-primary-text-emphasis, #6ea8fe)",
};

/* the text colour of each intent on a light page: the fill itself is already
   >= 4.5:1 against white for primary, secondary, success and danger */
const lightOnly = {
  "--ui-primary-text": "#0a58ca",
  "--ui-secondary-text": "#5c636a",
  "--ui-success-text": "#146c43",
  "--ui-danger-text": "#b02a37",
};

/* ---- shared fragments ------------------------------------------------- */

/* Bootstrap's focus ring is a 0.25rem translucent glow. That glow is about
   1.4:1 against the page, below WCAG 1.4.11's 3:1, so the ring here keeps the
   same 0.25rem footprint but is solid: a gap in the surface colour, then the
   ring colour. */
const ring = "0 0 0 0.125rem var(--ui-surface), 0 0 0 0.25rem var(--ui-c-text, var(--ui-ring))";
const fieldRing = "0 0 0 0.125rem var(--ui-surface), 0 0 0 0.25rem var(--ui-field-c, var(--ui-ring))";

/* Bootstrap's #dee2e6 control border is 1.3:1 on white. Form-control
   boundaries must reach 3:1 (WCAG 1.4.11), so controls use a stronger border
   than Bootstrap's decorative one; cards, tables and rules keep the original. */
const controlBorder = "color-mix(in oklab, var(--ui-surface-fg) 55%, var(--ui-surface))";

/* .form-control / .form-select */
const control = {
  padding: "0.375rem 0.75rem",
  "font-size": "1rem",
  "font-weight": "400",
  "line-height": "1.5",
  "border-radius": "var(--bs-border-radius, 0.375rem)",
  "border-width": "var(--bs-border-width, 1px)",
  "border-color": `var(--ui-field-c, ${controlBorder})`,
  "background-color": "var(--ui-surface)",
  "box-shadow": "none",
  transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
  "&:hover": { "border-color": `var(--ui-field-c, ${controlBorder})` },
  "&:focus-visible": {
    outline: "0",
    "border-color": "var(--ui-field-c, var(--ui-ring))",
    "box-shadow": fieldRing,
  },
};

const controlStyles = {
  outline: { "border-color": "var(--ui-field-c, var(--ui-c-text))" },
  ghost: { "background-color": "transparent", "border-color": "transparent" },
  soft: { "background-color": "var(--ui-c-soft, var(--ui-surface-muted))", "border-color": "transparent" },
};
const controlSizes = {
  sm: { padding: "0.25rem 0.5rem", "font-size": "0.875rem", "border-radius": "var(--bs-border-radius-sm, 0.25rem)" },
  lg: { padding: "0.5rem 1rem", "font-size": "1.25rem", "border-radius": "var(--bs-border-radius-lg, 0.5rem)" },
};
const controlStates = {
  disabled: { opacity: "0.5", "background-color": "var(--ui-surface-muted)", cursor: "not-allowed" },
  loading: { cursor: "progress" },
  active: { "border-color": "var(--ui-field-c, var(--ui-ring))", "box-shadow": fieldRing },
};
const opacityStates = {
  disabled: { opacity: "0.65", cursor: "not-allowed", "pointer-events": "none" },
  loading: { cursor: "progress" },
  active: { "box-shadow": ring },
};

/* check / radio / switch: Bootstrap's .form-check-input is 1em with a 1px
   border-color --bs-border-color; checked fills with the primary */
const checkStates = {
  disabled: { opacity: "0.5", cursor: "not-allowed", "pointer-events": "none" },
  loading: { cursor: "progress" },
  active: { "box-shadow": ring },
};
const checkBase = {
  "--ui-check-size": "1em",
  "border-color": controlBorder,
  "border-radius": "0.25em",
};
const checkStyles = {
  outline: { "border-color": "var(--ui-c-text)", "border-width": "2px" },
  ghost: { "background-color": "var(--ui-surface-muted)" },
  soft: { "background-color": "var(--ui-c-soft)" },
};
const checkSizes = {
  sm: { "--ui-check-size": "0.875em" },
  lg: { "--ui-check-size": "1.25em" },
};

/* cards, alerts, badges: the intent decides the colours, never the shape */
const alertIntent = {
  "&:not(.ui-soft):not(.ui-ghost):not(.ui-outline)": {
    "background-color": "var(--ui-c-soft)",
    color: "var(--ui-c-soft-fg)",
  },
  "&:not(.ui-soft):not(.ui-ghost)": {
    "border-color": "color-mix(in oklab, var(--ui-c-soft-fg) 30%, var(--ui-c-soft))",
  },
};

export default defineAdapter({
  name: "bootstrap",
  /* Uniskin's own switches (.dark, [data-theme="dark"]) plus Bootstrap's */
  darkRootSelector: '.dark, [data-theme="dark"], [data-bs-theme="dark"]',
  tokens: { ...light, ...lightOnly },
  darkTokens: dark,
  components: {
    /* ---- buttons: .btn, .btn-outline-*, .btn-sm, .btn-lg -------------- */
    button: {
      base: {
        padding: "0.375rem 0.75rem",
        "font-size": "1rem",
        "font-weight": "400",
        "line-height": "1.5",
        "border-radius": "var(--bs-border-radius, 0.375rem)",
        "border-width": "var(--bs-border-width, 1px)",
        gap: "0.5rem",
        transition:
          "color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
        "&:focus-visible": { outline: "0", "box-shadow": ring },
      },
      styles: {
        outline: {
          "&:hover": { "background-color": "var(--ui-c)", color: "var(--ui-on-c)", "border-color": "var(--ui-c)" },
        },
        ghost: {
          /* .btn-link */
          "&:hover": { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)", "text-decoration": "underline" },
        },
        soft: {
          "&:hover": { "background-color": "var(--ui-c-soft-hover, var(--ui-c))", color: "var(--ui-on-c)" },
        },
      },
      sizes: {
        sm: { padding: "0.25rem 0.5rem", "font-size": "0.875rem", "border-radius": "var(--bs-border-radius-sm, 0.25rem)" },
        lg: { padding: "0.5rem 1rem", "font-size": "1.25rem", "border-radius": "var(--bs-border-radius-lg, 0.5rem)" },
      },
      states: opacityStates,
    },

    /* ---- form controls ---------------------------------------------- */
    input: { base: control, styles: controlStyles, sizes: controlSizes, states: controlStates },
    textarea: { base: { ...control, "min-height": "calc(1.5em + 0.75rem + 2px)" }, styles: controlStyles, sizes: controlSizes, states: controlStates },
    select: { base: control, styles: controlStyles, sizes: controlSizes, states: controlStates },
    checkbox: { base: checkBase, styles: checkStyles, sizes: checkSizes, states: checkStates },
    radio: { base: { "--ui-radio-size": "1em", "border-color": controlBorder }, styles: checkStyles, sizes: { sm: { "--ui-radio-size": "0.875em" }, lg: { "--ui-radio-size": "1.25em" } }, states: checkStates },
    switch: {
      /* .form-switch: 2em x 1em pill, the thumb inset 2px */
      base: { "--ui-switch-size": "1.25rem", "--ui-switch-pad": "2px" },
      styles: checkStyles,
      sizes: { sm: { "--ui-switch-size": "1rem" }, lg: { "--ui-switch-size": "1.5rem" } },
      states: checkStates,
    },
    field: { base: { "--ui-field-gap": "0.5rem" } },
    "field-label": { base: { "font-weight": "400", "margin-bottom": "0.5rem" } },
    "field-hint": { base: { "font-size": "0.875em", color: "var(--bs-secondary-color, color-mix(in oklab, var(--ui-surface-fg) 75%, transparent))" } },
    "field-error": { base: { "font-size": "0.875em", color: "var(--ui-danger-text, var(--ui-danger))" } },

    /* ---- .card ------------------------------------------------------ */
    card: {
      base: {
        "--ui-card-pad": "1rem",
        "border-color": "var(--bs-border-color-translucent, rgb(0 0 0 / 0.175))",
        "border-radius": "var(--bs-border-radius, 0.375rem)",
        "box-shadow": "none",
      },
      styles: {
        outline: { "border-color": "var(--ui-c-border, var(--ui-c))", "border-width": "2px" },
        ghost: { "border-color": "transparent", "background-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)", "border-color": "transparent" },
      },
      sizes: { sm: { "--ui-card-pad": "0.75rem" }, lg: { "--ui-card-pad": "1.5rem" } },
      states: {
        disabled: { opacity: "0.65", "pointer-events": "none" },
        loading: { cursor: "progress" },
        active: { "box-shadow": ring },
      },
    },
    /* .card-header and .card-footer are tinted bars with a rule */
    "card-header": {
      base: {
        "background-color": "color-mix(in oklab, var(--ui-surface-fg) 3%, transparent)",
        "border-bottom": "var(--bs-border-width, 1px) solid var(--bs-border-color-translucent, rgb(0 0 0 / 0.175))",
        "font-weight": "400",
      },
    },
    "card-body": { base: { padding: "var(--ui-card-pad, 1rem)" } },
    "card-footer": {
      base: {
        "background-color": "color-mix(in oklab, var(--ui-surface-fg) 3%, transparent)",
        "border-top": "var(--bs-border-width, 1px) solid var(--bs-border-color-translucent, rgb(0 0 0 / 0.175))",
      },
    },

    /* ---- .badge ----------------------------------------------------- */
    badge: {
      base: {
        padding: "0.35em 0.65em",
        "font-size": "0.75em",
        "font-weight": "700",
        "line-height": "1",
        "border-radius": "var(--bs-border-radius, 0.375rem)",
        "white-space": "nowrap",
      },
      styles: {
        outline: { "border-width": "1px" },
        ghost: { "background-color": "transparent", "border-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)", "border-color": "transparent" },
      },
      sizes: { sm: { "font-size": "0.65em", padding: "0.3em 0.5em" }, lg: { "font-size": "0.95em", padding: "0.4em 0.8em" } },
      states: opacityStates,
    },

    /* ---- .alert: subtle background, emphasis text, subtle border ---- */
    alert: {
      base: {
        padding: "1rem",
        "border-radius": "var(--bs-border-radius, 0.375rem)",
        "border-width": "var(--bs-border-width, 1px)",
      },
      intents: {
        primary: alertIntent,
        secondary: alertIntent,
        success: alertIntent,
        warning: alertIntent,
        danger: alertIntent,
      },
      styles: {
        outline: { "background-color": "transparent", color: "var(--ui-c-text)", "border-color": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "background-color": "transparent", "border-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)", "border-color": "transparent" },
      },
      sizes: { sm: { padding: "0.5rem 0.75rem", "font-size": "0.875rem" }, lg: { padding: "1.5rem", "font-size": "1.125rem" } },
      states: opacityStates,
    },

    /* ---- .table ----------------------------------------------------- */
    table: {
      base: {
        "--ui-table-pad-y": "0.5rem",
        "--ui-table-pad-x": "0.5rem",
        "--ui-table-border": "var(--bs-border-color, var(--ui-border))",
        "--ui-table-stripe": "rgb(0 0 0 / 0.05)",
        "--ui-table-row-hover": "rgb(0 0 0 / 0.075)",
      },
      styles: {
        outline: { "--ui-table-border": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "--ui-table-border": "transparent" },
        soft: { "--ui-table-stripe": "var(--ui-c-soft, rgb(0 0 0 / 0.05))" },
      },
      sizes: {
        sm: { "--ui-table-pad-y": "0.25rem", "--ui-table-pad-x": "0.25rem" },
        lg: { "--ui-table-pad-y": "0.75rem", "--ui-table-pad-x": "0.75rem" },
      },
      states: { loading: { cursor: "progress" } },
    },
    "table-wrap": { base: { "border-radius": "var(--bs-border-radius, 0.375rem)" } },

    /* ---- .accordion ------------------------------------------------- */
    accordion: {
      base: {
        "--ui-accordion-pad-x": "1.25rem",
        "--ui-accordion-pad-y": "1rem",
        "--ui-accordion-border": "var(--bs-border-color-translucent, rgb(0 0 0 / 0.175))",
        "--ui-accordion-hover": "transparent",
        "border-radius": "var(--bs-border-radius, 0.375rem)",
      },
      styles: {
        outline: { "--ui-accordion-border": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "--ui-accordion-border": "transparent" },
        soft: { "--ui-accordion-soft-bg": "var(--ui-c-soft)" },
      },
      sizes: {
        sm: { "--ui-accordion-pad-x": "0.75rem", "--ui-accordion-pad-y": "0.5rem" },
        lg: { "--ui-accordion-pad-x": "1.5rem", "--ui-accordion-pad-y": "1.25rem" },
      },
    },
    "accordion-item": { base: { "background-color": "var(--ui-surface)" } },
    "accordion-trigger": { base: { "font-size": "1rem", "font-weight": "400" } },
    "accordion-panel": { base: { "font-size": "1rem" } },

    /* ---- .progress / .progress-bar ---------------------------------- */
    progress: {
      base: {
        "--ui-progress-h": "1rem",
        "--ui-progress-track": "var(--bs-secondary-bg, var(--ui-surface-muted))",
        "font-size": "0.75rem",
      },
      styles: {
        outline: { "--ui-progress-border": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "--ui-progress-track": "transparent" },
      },
      sizes: { sm: { "--ui-progress-h": "0.5rem" }, lg: { "--ui-progress-h": "1.5rem" } },
    },

    /* ---- .tooltip: black, 0.9 opacity, 0.25rem radius --------------- */
    tooltip: {
      base: {
        "--ui-tooltip-fs": "0.875rem",
        "--ui-tooltip-pad-y": "0.25rem",
        "--ui-tooltip-pad-x": "0.5rem",
        "--ui-tooltip-max-w": "200px",
        "--ui-tooltip-bg": "var(--bs-emphasis-color, #000)",
        "--ui-tooltip-fg": "var(--bs-body-bg, #fff)",
        "border-radius": "var(--bs-border-radius, 0.375rem)",
        "font-weight": "400",
        "text-align": "center",
      },
      styles: {
        outline: { "--ui-tooltip-bg": "var(--ui-surface)", "--ui-tooltip-fg": "var(--ui-surface-fg)" },
        soft: { "--ui-tooltip-bg": "var(--ui-c-soft)", "--ui-tooltip-fg": "var(--ui-c-soft-fg)" },
      },
      sizes: {
        sm: { "--ui-tooltip-fs": "0.75rem" },
        lg: { "--ui-tooltip-fs": "1rem", "--ui-tooltip-pad-y": "0.5rem", "--ui-tooltip-pad-x": "0.75rem" },
      },
      states: { active: { visibility: "visible", opacity: "1" } },
    },
    "tooltip-anchor": { base: { "vertical-align": "middle" } },

    /* ---- .toast: translucent white, 350px, radius, soft shadow ------ */
    toast: {
      base: {
        "--ui-toast-w": "350px",
        "--ui-toast-fs": "0.875rem",
        "--ui-toast-pad-x": "0.75rem",
        "--ui-toast-pad-y": "0.5rem",
        "--ui-toast-gap": "0.75rem",
        "--ui-toast-edge": "var(--bs-border-color-translucent, rgb(0 0 0 / 0.175))",
        "--ui-toast-shadow": "0 0.5rem 1rem rgb(0 0 0 / 0.15)",
        "border-radius": "var(--bs-border-radius, 0.375rem)",
      },
      styles: {
        outline: {},
        soft: {},
      },
      sizes: {
        sm: { "--ui-toast-fs": "0.75rem" },
        lg: { "--ui-toast-fs": "1rem", "--ui-toast-pad-x": "1rem", "--ui-toast-pad-y": "0.75rem" },
      },
      states: { loading: { cursor: "progress" } },
    },
    "toast-region": { base: { "--ui-toast-offset": "1rem" } },

    /* ---- .dropdown / .dropdown-menu / .dropdown-item ---------------- */
    dropdown: { base: { "vertical-align": "middle" } },
    menu: {
      base: {
        "--ui-menu-fs": "1rem",
        "--ui-menu-w": "10rem",
        "--ui-menu-pad": "0.5rem 0",
        "--ui-menu-gap": "0.125rem",
        "--ui-menu-shadow": "none",
        "--ui-menu-item-py": "0.25rem",
        "--ui-menu-item-px": "1rem",
        "border-color": "var(--bs-border-color-translucent, rgb(0 0 0 / 0.175))",
        "border-radius": "var(--bs-border-radius, 0.375rem)",
        gap: "0",
      },
      styles: {
        ghost: { "border-color": "transparent", "box-shadow": "none" },
        soft: { "background-color": "var(--ui-surface-muted)" },
      },
      sizes: {
        sm: { "--ui-menu-fs": "0.875rem", "--ui-menu-item-py": "0.125rem", "--ui-menu-item-px": "0.75rem" },
        lg: { "--ui-menu-fs": "1.25rem", "--ui-menu-item-py": "0.5rem", "--ui-menu-item-px": "1.25rem" },
      },
    },
    "menu-item": {
      base: {
        "--ui-menu-item-hover-bg": "var(--bs-tertiary-bg, var(--ui-neutral-soft))",
        "--ui-menu-item-hover-fg": "var(--bs-body-color, var(--ui-surface-fg))",
        "border-radius": "0",
        "font-weight": "400",
      },
      sizes: {
        sm: { "--ui-menu-fs": "0.875rem", "--ui-menu-item-py": "0.125rem", "--ui-menu-item-px": "0.75rem" },
        lg: { "--ui-menu-fs": "1.25rem", "--ui-menu-item-py": "0.5rem", "--ui-menu-item-px": "1.25rem" },
      },
      states: {
        disabled: { opacity: "0.65", "pointer-events": "none" },
        /* .dropdown-item.active: filled with the primary */
        active: { "background-color": "var(--ui-primary)", color: "var(--ui-primary-fg)", "font-weight": "400" },
      },
    },
    "menu-label": { base: { "font-size": "0.875rem", "font-weight": "400" } },
    "menu-separator": { base: { margin: "0.5rem 0", opacity: "1", "background-color": "var(--bs-border-color-translucent, rgb(0 0 0 / 0.175))" } },

    /* ---- avatar (Bootstrap has none: .rounded-circle on a .bg-* box) */
    avatar: {
      base: { "--ui-avatar-size": "2.5rem", "font-weight": "400" },
      styles: {
        soft: { "font-weight": "400" },
        outline: { "border-width": "2px" },
      },
      sizes: { sm: { "--ui-avatar-size": "2rem" }, lg: { "--ui-avatar-size": "3.5rem" } },
    },

    /* ---- .placeholder / .placeholder-glow --------------------------- */
    skeleton: {
      base: {
        "--ui-skeleton-bg": "var(--bs-secondary-color, color-mix(in oklab, var(--ui-surface-fg) 75%, transparent))",
        opacity: "0.5",
        "border-radius": "var(--bs-border-radius, 0.375rem)",
        "min-height": "1em",
      },
    },

    /* ---- hr: 1px, 25% opacity -------------------------------------- */
    separator: {
      base: {
        "--ui-separator-color": "var(--bs-border-color, currentColor)",
        "--ui-separator-gap": "1rem",
        opacity: "0.25",
        "background-color": "currentColor",
      },
    },

    /* ---- .breadcrumb ------------------------------------------------ */
    breadcrumb: {
      base: { "--ui-breadcrumb-fs": "1rem", "--ui-breadcrumb-sep": "var(--bs-secondary-color, #6c757d)", gap: "0.5rem" },
      sizes: { sm: { "--ui-breadcrumb-fs": "0.875rem" }, lg: { "--ui-breadcrumb-fs": "1.25rem" } },
    },

    /* ---- .pagination / .page-link ----------------------------------- */
    pagination: {
      base: { "--ui-pagination-size": "2.375rem", "--ui-pagination-fs": "1rem", gap: "0" },
      sizes: {
        sm: { "--ui-pagination-size": "1.875rem", "--ui-pagination-fs": "0.875rem" },
        lg: { "--ui-pagination-size": "3rem", "--ui-pagination-fs": "1.25rem" },
      },
    },
    "pagination-item": {
      base: {
        "border-radius": "0",
        "margin-left": "calc(var(--bs-border-width, 1px) * -1)",
        "font-weight": "400",
        color: "var(--ui-primary-text, var(--ui-primary))",
        "&:hover": { "background-color": "var(--ui-surface-muted)" },
      },
      states: {
        disabled: { opacity: "1", color: "color-mix(in oklab, var(--ui-surface-fg) 65%, transparent)", "background-color": "var(--ui-surface)", "pointer-events": "none" },
        active: { "background-color": "var(--ui-c)", color: "var(--ui-on-c)", "border-color": "var(--ui-c)" },
      },
    },

    /* ---- .form-range ------------------------------------------------ */
    slider: {
      base: {
        "--ui-slider-track": "0.5rem",
        "--ui-slider-thumb": "1rem",
        "--ui-slider-track-bg": "var(--bs-secondary-bg, var(--ui-surface-muted))",
      },
      sizes: {
        sm: { "--ui-slider-track": "0.375rem", "--ui-slider-thumb": "0.875rem" },
        lg: { "--ui-slider-track": "0.625rem", "--ui-slider-thumb": "1.25rem" },
      },
      states: { disabled: { opacity: "0.5", cursor: "not-allowed" } },
    },

    /* ---- .modal / .modal-content / .offcanvas ----------------------- */
    modal: {
      base: { "--ui-modal-w": "500px", padding: "1.75rem 0.5rem" },
      styles: {
        ghost: { "background-color": "transparent" },
        soft: { "background-color": "var(--ui-overlay-soft)" },
      },
      sizes: { sm: { "--ui-modal-w": "300px" }, lg: { "--ui-modal-w": "800px" } },
      states: {
        active: { visibility: "visible", opacity: "1", "pointer-events": "auto", "transition-delay": "0s" },
      },
    },
    "modal-box": {
      base: {
        padding: "1rem",
        "border-radius": "var(--bs-border-radius-lg, 0.5rem)",
        border: "var(--bs-border-width, 1px) solid var(--bs-border-color-translucent, rgb(0 0 0 / 0.175))",
        "border-top": "var(--bs-border-width, 1px) solid var(--bs-border-color-translucent, rgb(0 0 0 / 0.175))",
        "box-shadow": "0 0.5rem 1rem rgb(0 0 0 / 0.15)",
      },
      sizes: { sm: { padding: "0.75rem" }, lg: { padding: "1.5rem" } },
    },

    /* ---- .nav-tabs / .nav-link -------------------------------------- */
    tabs: {
      base: { "border-color": "var(--bs-border-color, var(--ui-border))" },
      styles: {
        outline: { "border-color": "var(--ui-c-border, var(--ui-c))" },
        ghost: { "border-color": "transparent" },
        soft: { "background-color": "var(--ui-c-soft)" },
      },
      sizes: { sm: { "font-size": "0.875rem" }, lg: { "font-size": "1.25rem" } },
    },
    tab: {
      base: {
        "--ui-tab-fs": "1rem",
        "--ui-tab-px": "1rem",
        "--ui-tab-py": "0.5rem",
        "--ui-tab-radius": "var(--bs-border-radius, 0.375rem) var(--bs-border-radius, 0.375rem) 0 0",
        "font-weight": "400",
        color: "var(--ui-primary-text, var(--ui-primary))",
        "&:hover": {
          color: "var(--ui-primary-hover, var(--ui-primary))",
          "background-color": "transparent",
          "border-color": "var(--bs-secondary-bg, var(--ui-surface-muted))",
        },
      },
      sizes: {
        sm: { "--ui-tab-fs": "0.875rem", "--ui-tab-px": "0.75rem", "--ui-tab-py": "0.25rem" },
        lg: { "--ui-tab-fs": "1.25rem", "--ui-tab-px": "1.25rem", "--ui-tab-py": "0.75rem" },
      },
      states: {
        disabled: { opacity: "1", color: "color-mix(in oklab, var(--ui-surface-fg) 65%, transparent)", "pointer-events": "none" },
        loading: { cursor: "progress" },
        active: {
          color: "var(--ui-surface-fg)",
          "background-color": "var(--ui-surface)",
          "border-color": "var(--ui-border) var(--ui-border) var(--ui-surface)",
        },
      },
    },
  },
});
