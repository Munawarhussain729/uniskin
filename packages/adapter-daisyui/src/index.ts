import { defineAdapter } from "uniskin/adapter";

/* daisyUI input/select: field-height box, 1px base-content border, outline focus */
const field = {
  "border-width": "var(--border, 1px)",
  "border-color":
    "var(--ui-field-c, color-mix(in oklab, var(--color-base-content, #1f2937) 20%, transparent))",
  "&:hover": {},
  "&:focus-visible": {
    outline: "2px solid var(--ui-c)",
    "outline-offset": "2px",
    "box-shadow": "none",
    "border-color":
      "var(--ui-field-c, color-mix(in oklab, var(--color-base-content, #1f2937) 20%, transparent))",
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

/* daisyUI alert: tinted surface with a matching border, text in the intent color */
const alertIntent = {
  "background-color": "color-mix(in oklab, var(--ui-c) 10%, var(--ui-surface))",
  "border-color": "color-mix(in oklab, var(--ui-c) 40%, transparent)",
  color: "color-mix(in oklab, var(--ui-c) 85%, var(--ui-surface-fg))",
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
export default defineAdapter({
  name: "daisyui",
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
        "border-color": "color-mix(in oklab, var(--color-base-content, #1f2937) 20%, transparent)",
      },
      sizes: {
        sm: { "--ui-check-size": "calc(var(--size-selector, 0.25rem) * 5)" },
        lg: { "--ui-check-size": "calc(var(--size-selector, 0.25rem) * 7)" },
      },
    },
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
          outline: "2px solid var(--ui-c)",
          "outline-offset": "2px",
        },
      },
      styles: {
        /* daisyUI btn-outline: colored border + text, hover fills and
           inverts to the intent's content color */
        outline: {
          "background-color": "transparent",
          color: "var(--ui-c)",
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
          color: "var(--ui-c)",
          "&:hover": {
            "background-color": "color-mix(in oklab, var(--ui-c) 20%, transparent)",
            "border-color": "transparent",
          },
        },
        /* btn-soft (daisyUI 5.4+) */
        soft: {
          "background-color": "color-mix(in oklab, var(--ui-c) 12%, var(--ui-surface))",
          "border-color": "transparent",
          color: "var(--ui-c)",
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
