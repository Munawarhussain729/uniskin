import { defineAdapter } from "uniskin/adapter";

/* daisyUI input/select: field-height box, 1px base-content border, outline focus */
const field = {
  "border-width": "var(--border, 1px)",
  "border-color":
    "var(--ui-field-c, color-mix(in oklab, var(--ui-border) 55%, var(--ui-surface-fg)))",
  "&:hover": {},
  "&:focus-visible": {
    outline: "2px solid var(--ui-c-text)",
    "outline-offset": "2px",
    "box-shadow": "none",
    "border-color":
      "var(--ui-field-c, color-mix(in oklab, var(--ui-border) 55%, var(--ui-surface-fg)))",
  },
};
const singleLine = {
  ...field,
  height: "calc(var(--size-field, 0.25rem) * 10)",
  padding: "0 0.75rem",
};
const fieldSizes = {
  sm: { height: "calc(var(--size-field, 0.25rem) * 8)", padding: "0 0.625rem", "font-size": "0.75rem" },
  lg: { height: "calc(var(--size-field, 0.25rem) * 12)", padding: "0 1rem", "font-size": "1.125rem" },
};

/* daisyUI alert: tinted surface with a matching border, text in the intent color.
   An intent and a style are both single-class modifiers of the same
   specificity, so their order in the emitted CSS must not decide the look:
   the tint applies only when no style class overrides it. */
const alertIntent = {
  "&:not(.ui-soft):not(.ui-ghost):not(.ui-outline)": {
    "background-color": "color-mix(in oklab, var(--ui-c) 10%, var(--ui-surface))",
    color: "color-mix(in oklab, var(--ui-c) 85%, var(--ui-surface-fg))",
  },
  "&:not(.ui-soft):not(.ui-ghost)": {
    "border-color": "color-mix(in oklab, var(--ui-c) 40%, transparent)",
  },
};

/**
 * daisyUI 5 visual style for Uniskin.
 *
 * Every color/radius is a var() reference to daisyUI's own theme
 * variables (`--color-primary`, `--radius-field`, …) with the daisyUI
 * "light" theme value as fallback. So:
 *
 * - with `@plugin "daisyui"` also loaded, Uniskin classes follow the
 *   user's active daisyUI theme — including dark mode and custom themes;
 * - without daisyUI installed, they still render in daisyUI's light look.
 *
 * See docs/decisions/001-daisyui-adapter.md for why we map variables
 * instead of @apply-ing daisyUI's component classes.
 */
/* the arc already follows the intent colour; stating it makes the slot explicit */
const spinnerIntent = { "--ui-spinner-color": "var(--ui-c-text)" };

export default defineAdapter({
  name: "daisyui",
  /* the --ui-* tokens are var() aliases of daisyUI's theme variables; re-declare
     them on every [data-theme] element so nested/switched themes re-resolve */
  rootSelector: ":root, [data-theme]",
  /* dark mode is handled by daisyUI's own themes, not by Uniskin */
  darkTokens: {},
  tokens: {
    "--ui-primary": "var(--color-primary, oklch(45% 0.24 277.023))",
    "--ui-primary-fg": "var(--color-primary-content, oklch(93% 0.034 272.788))",
    "--ui-secondary": "var(--color-secondary, oklch(65% 0.241 354.308))",
    "--ui-secondary-fg": "var(--color-secondary-content, oklch(94% 0.028 342.258))",
    "--ui-success": "var(--color-success, oklch(76% 0.177 163.223))",
    "--ui-success-fg": "var(--color-success-content, oklch(37% 0.077 168.94))",
    "--ui-warning": "var(--color-warning, oklch(82% 0.189 84.429))",
    "--ui-warning-fg": "var(--color-warning-content, oklch(41% 0.112 45.904))",
    "--ui-danger": "var(--color-error, oklch(71% 0.194 13.428))",
    "--ui-danger-fg": "var(--color-error-content, oklch(27% 0.105 12.094))",

    /* daisyUI's bright intent colours are too light to read as text or focus
       rings on a light page: use a darkened mix (against base-content) wherever
       the intent colour is the foreground. Fills keep daisyUI's exact colours. */
    "--ui-secondary-text": "color-mix(in oklab, var(--ui-secondary) 80%, var(--ui-surface-fg))",
    "--ui-success-text": "color-mix(in oklab, var(--ui-success) 55%, var(--ui-surface-fg))",
    "--ui-danger-text": "color-mix(in oklab, var(--ui-danger) 70%, var(--ui-surface-fg))",

    "--ui-neutral": "var(--color-neutral, oklch(14% 0.005 285.823))",
    "--ui-neutral-fg": "var(--color-neutral-content, oklch(92% 0.004 286.32))",
    "--ui-neutral-soft": "var(--color-base-200, oklch(98% 0 0))",
    "--ui-neutral-soft-fg": "var(--color-base-content, oklch(21% 0.006 285.885))",

    "--ui-surface": "var(--color-base-100, oklch(100% 0 0))",
    "--ui-surface-fg": "var(--color-base-content, oklch(21% 0.006 285.885))",
    "--ui-surface-muted": "var(--color-base-200, oklch(98% 0 0))",
    "--ui-border": "var(--color-base-300, oklch(95% 0 0))",
    "--ui-ring": "var(--color-primary, oklch(45% 0.24 277.023))",
    "--ui-radius": "var(--radius-field, 0.25rem)",
  },
  components: {
    input: { base: singleLine, sizes: fieldSizes },
    textarea: { base: field },
    select: { base: singleLine, sizes: fieldSizes },
    checkbox: {
      base: {
        "--ui-check-size": "calc(var(--size-selector, 0.25rem) * 6)",
        "border-radius": "var(--radius-selector, 0.5rem)",
        "border-color": "color-mix(in oklab, var(--ui-border) 55%, var(--ui-surface-fg))",
      },
      sizes: {
        sm: { "--ui-check-size": "calc(var(--size-selector, 0.25rem) * 5)" },
        lg: { "--ui-check-size": "calc(var(--size-selector, 0.25rem) * 7)" },
      },
    },
    radio: {
      base: {
        "--ui-radio-size": "calc(var(--size-selector, 0.25rem) * 6)",
      },
      sizes: {
        sm: { "--ui-radio-size": "calc(var(--size-selector, 0.25rem) * 5)" },
        lg: { "--ui-radio-size": "calc(var(--size-selector, 0.25rem) * 7)" },
      },
    },
    switch: {
      /* daisyUI toggle: sized from --size-selector like checkbox/radio; the off
         track stays the default >= 3:1 grey rather than 20% base-content. */
      base: {
        "--ui-switch-size": "calc(var(--size-selector, 0.25rem) * 6)",
      },
      sizes: {
        sm: { "--ui-switch-size": "calc(var(--size-selector, 0.25rem) * 5)" },
        lg: { "--ui-switch-size": "calc(var(--size-selector, 0.25rem) * 7)" },
      },
    },
    /* daisyUI fieldset: tighter gap, semibold label, hint in softened base-content */
    field: { base: { "--ui-field-gap": "0.25rem" } },
    "field-label": { base: { "font-weight": "600" } },
    card: {
      base: {
        "border-radius": "var(--radius-box, 1rem)",
        "box-shadow": "0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      },
    },
    "card-header": { base: { "border-bottom": "0", "padding-bottom": "0" } },
    "card-footer": { base: { "background-color": "transparent", "border-top": "0" } },
    badge: {
      base: {
        height: "calc(var(--size-selector, 0.25rem) * 6)",
        "border-radius": "var(--radius-selector, 0.5rem)",
        "font-size": "0.875rem",
        padding: "0 0.5rem",
      },
      sizes: {
        sm: { height: "calc(var(--size-selector, 0.25rem) * 5)", "font-size": "0.75rem" },
        lg: { height: "calc(var(--size-selector, 0.25rem) * 7)", "font-size": "1rem" },
      },
    },
    table: {
      base: {
        /* daisy table: base-300 rules, base-200 zebra under ui-soft,
           radius-box on the wrap */
        /* base-300 dividers are ~1:1 on the dark theme — mix toward
           base-content so the default row dividers stay visible */
        "--ui-table-border":
          "color-mix(in oklab, var(--color-base-content, oklch(20% 0 0)) 30%, var(--color-base-100, oklch(100% 0 0)))",
        "--ui-table-stripe": "var(--color-base-200, oklch(98% 0 0))",
        "--ui-table-row-hover": "var(--color-base-200, oklch(98% 0 0))",
        "--ui-table-pad-y": "0.625rem",
        "--ui-table-pad-x": "0.75rem",
        /* intent soft-fg on the tinted fill misses 4.5:1 (measured 4.47
           light / 4.17 dark) — keep the tint, text in surface fg */
        "& tbody tr.ui-active, & tbody tr[aria-selected='true']": {
          color: "var(--ui-surface-fg)",
        },
      },
      sizes: {
        sm: { "--ui-table-pad-y": "0.375rem", "--ui-table-pad-x": "0.5rem" },
        lg: { "--ui-table-pad-y": "1rem", "--ui-table-pad-x": "1.25rem" },
      },
    },
    "table-wrap": { base: { "border-radius": "var(--radius-box, 1rem)" } },
    toast: {
      base: {
        /* daisy toast is only the container; the message is an alert, so the
           toast takes the alert look: rounded-box on a base-200 fill */
        "--ui-c": "var(--color-base-200, oklch(98% 0 0))",
        "--ui-on-c": "var(--color-base-content, oklch(21% 0.006 285))",
        "--ui-toast-edge": "var(--color-base-300, oklch(95% 0 0))",
        "border-radius": "var(--radius-box, 1rem)",
        "font-size": "0.875rem",
      },
    },
    /* daisyUI menu in a dropdown-content: rounded-box on base-100, items take
       rounded-field and a base-content tint on hover */
    menu: {
      base: {
        "--ui-menu-fs": "0.875rem",
        "--ui-menu-pad": "0.5rem",
        "--ui-menu-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "border-color": "var(--color-base-300, oklch(95% 0 0))",
        "border-radius": "var(--radius-box, 1rem)",
      },
    },
    "menu-item": { base: { "border-radius": "var(--radius-field, 0.25rem)" } },
    /* daisyUI avatar placeholder: neutral fill, rounded-full; skeleton on base-300 */
    avatar: {
      base: {
        "--ui-c": "var(--color-neutral, oklch(14% 0.005 285))",
        "--ui-on-c": "var(--color-neutral-content, oklch(98% 0 0))",
      },
    },
    skeleton: { base: { "--ui-skeleton-bg": "var(--color-base-300, oklch(95% 0 0))", "border-radius": "var(--radius-box, 1rem)" } },
    /* daisyUI loading-spinner: 1.5rem; xs 1rem; lg 2.5rem */
    spinner: {
      base: { "--ui-spinner-size": "1.5rem", "--ui-spinner-width": "2px" },
      intents: {
        primary: spinnerIntent,
        secondary: spinnerIntent,
        success: spinnerIntent,
        warning: spinnerIntent,
        danger: spinnerIntent,
      },
      sizes: {
        sm: { "--ui-spinner-size": "1rem", "--ui-spinner-width": "2px" },
        lg: { "--ui-spinner-size": "2.5rem", "--ui-spinner-width": "3px" },
      },
    },
    tooltip: {
      base: {
        /* daisy tooltip-content: neutral fill, neutral-content text, rounded-field */
        "--ui-c": "var(--ui-neutral)",
        "--ui-on-c": "var(--ui-neutral-fg)",
        "--ui-tooltip-fs": "0.875rem",
        "--ui-tooltip-pad-y": "0.25rem",
        "--ui-tooltip-pad-x": "0.5rem",
        "border-radius": "var(--radius-field, 0.5rem)",
        "font-weight": "400",
      },
    },
    progress: {
      base: {
        /* daisy progress: base-content bar on a faint base-content track */
        "--ui-c-text": "var(--color-base-content, oklch(21% 0.006 285))",
        /* upstream's track is 20% base-content; a fainter track plus a small
           share of base-content in the bar keeps the bar >= 3:1 on dark
           themes, where daisyUI's own primary is only ~2:1 against it */
        "--ui-progress-bar":
          "color-mix(in oklab, var(--ui-c-text) 85%, var(--color-base-content, oklch(21% 0.006 285)))",
        "--ui-progress-track":
          "color-mix(in oklab, var(--color-base-content, oklch(21% 0.006 285)) 10%, var(--color-base-100, oklch(100% 0 0)))",
        "border-radius": "var(--radius-box, 1rem)",
      },
    },
    accordion: {
      base: {
        /* daisy collapse: base-300 border, rounded-box, semibold title */
        "--ui-accordion-border": "var(--color-base-300, oklch(90% 0 0))",
        "--ui-accordion-hover": "var(--color-base-200, oklch(98% 0 0))",
        "--ui-accordion-soft-bg": "var(--color-base-200, oklch(98% 0 0))",
        "--ui-accordion-pad-y": "1rem",
        "--ui-accordion-pad-x": "1.25rem",
        "border-radius": "var(--radius-box, 1rem)",
      },
      styles: {
        /* separate boxes get the rounded-box corner; the divided list does
           not, so its dividers stay straight */
        outline: { "& .ui-accordion-item": { "border-radius": "var(--radius-box, 1rem)" } },
      },
      sizes: {
        sm: { "--ui-accordion-pad-y": "0.625rem", "--ui-accordion-pad-x": "1rem" },
        lg: { "--ui-accordion-pad-y": "1.25rem", "--ui-accordion-pad-x": "1.5rem" },
      },
    },
    "accordion-trigger": { base: { "font-weight": "600" } },
    alert: {
      base: {
        "border-radius": "var(--radius-box, 1rem)",
        "background-color": "var(--ui-surface-muted)",
        color: "var(--ui-surface-fg)",
        "border-color": "var(--ui-border)",
        "font-size": "0.875rem",
      },
      intents: {
        primary: alertIntent,
        secondary: alertIntent,
        success: alertIntent,
        warning: alertIntent,
        danger: alertIntent,
      },
    },
    "modal-box": {
      base: {
        "border-radius": "var(--radius-box, 1rem)",
        "box-shadow": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      },
    },
    button: {
      base: {
        /* daisyUI btn: semibold, snappy press animation */
        "font-weight": "600",
        height: "calc(var(--size-field, 0.25rem) * 10)",
        padding: "0 1rem",
        transition:
          "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease",
        "&:hover": {
          "background-color": "color-mix(in oklab, var(--ui-c) 90%, black)",
          "border-color": "color-mix(in oklab, var(--ui-c) 90%, black)",
        },
        "&:active": {
          transform: "scale(0.97)",
        },
        "&:focus-visible": {
          outline: "2px solid var(--ui-c-text)",
          "outline-offset": "2px",
        },
      },
      styles: {
        /* daisyUI btn-outline: colored border + text, hover fills and
           inverts to the intent's content color */
        outline: {
          "background-color": "transparent",
          color: "var(--ui-c-text)",
          "border-color": "var(--ui-c)",
          "&:hover": {
            "background-color": "var(--ui-c)",
            "border-color": "var(--ui-c)",
            color: "var(--ui-on-c)",
          },
        },
        /* daisyUI btn-ghost */
        ghost: {
          "background-color": "transparent",
          "border-color": "transparent",
          color: "var(--ui-c-text)",
          "&:hover": {
            "background-color": "color-mix(in oklab, var(--ui-c) 20%, transparent)",
            "border-color": "transparent",
          },
        },
        /* btn-soft (daisyUI 5.4+) */
        soft: {
          "background-color": "color-mix(in oklab, var(--ui-c) 12%, var(--ui-surface))",
          "border-color": "transparent",
          color: "var(--ui-c-text)",
          "&:hover": {
            "background-color": "var(--ui-c)",
            "border-color": "var(--ui-c)",
            color: "var(--ui-on-c)",
          },
        },
      },
      sizes: {
        sm: {
          height: "calc(var(--size-field, 0.25rem) * 8)",
          padding: "0 0.75rem",
          "font-size": "0.75rem",
        },
        lg: {
          height: "calc(var(--size-field, 0.25rem) * 12)",
          padding: "0 1.5rem",
          "font-size": "1.125rem",
        },
      },
    },
  },
});
