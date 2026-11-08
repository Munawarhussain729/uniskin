import { defineAdapter } from "./types.js";

/**
 * Built-in default skin. Every Uniskin class has a complete style here;
 * adapters deep-merge over this object, so anything they omit falls back
 * to these rules.
 *
 * Composition model: every intent sets five per-element variables
 * (`--ui-c`, `--ui-on-c`, `--ui-c-hover`, `--ui-c-soft`,
 * `--ui-c-soft-fg`) and every style maps those variables onto real
 * properties. That is why intents and styles combine freely
 * (`ui-danger ui-outline`) without 5×4 hand-written rules.
 */
export const defaultAdapter = defineAdapter({
  name: "default",
  tokens: {
    "--ui-font-sans":
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',

    /* neutral (no intent) */
    "--ui-neutral": "oklch(0.28 0.02 265)",
    "--ui-neutral-fg": "oklch(0.98 0 0)",
    "--ui-neutral-soft": "oklch(0.94 0.01 265)",
    "--ui-neutral-soft-fg": "oklch(0.32 0.02 265)",

    /* intents — *-hover and *-soft derive from the base color, so an
       adapter that only remaps --ui-<intent> still gets matching states */
    "--ui-primary": "oklch(0.55 0.21 267)",
    "--ui-primary-fg": "oklch(0.98 0 0)",
    "--ui-secondary": "oklch(0.55 0.05 285)",
    "--ui-secondary-fg": "oklch(0.98 0 0)",
    "--ui-success": "oklch(0.62 0.15 163)",
    "--ui-success-fg": "oklch(0.98 0 0)",
    "--ui-warning": "oklch(0.78 0.15 85)",
    "--ui-warning-fg": "oklch(0.28 0.04 90)",
    "--ui-danger": "oklch(0.58 0.21 27)",
    "--ui-danger-fg": "oklch(0.98 0 0)",

    /* surfaces */
    "--ui-surface": "oklch(1 0 0)",
    "--ui-surface-fg": "oklch(0.24 0.02 265)",
    "--ui-surface-muted": "oklch(0.96 0.005 265)",
    "--ui-border": "oklch(0.89 0.008 265)",
    "--ui-ring": "oklch(0.62 0.18 262)",

    /* shape & type */
    "--ui-radius": "0.5rem",
    "--ui-text-sm": "0.8125rem",
    "--ui-text-md": "0.9375rem",
    "--ui-text-lg": "1.0625rem",
  },
  components: {
    button: {
      base: {
        /* default = neutral intent; intents below override these vars */
        "--ui-c": "var(--ui-neutral)",
        "--ui-on-c": "var(--ui-neutral-fg)",
        "--ui-c-hover": "color-mix(in oklab, var(--ui-c) 85%, black)",
        "--ui-c-soft": "var(--ui-neutral-soft)",
        "--ui-c-soft-fg": "var(--ui-neutral-soft-fg)",

        display: "inline-flex",
        "align-items": "center",
        "justify-content": "center",
        gap: "0.5rem",
        "font-family": "var(--ui-font-sans)",
        "font-weight": "500",
        "font-size": "var(--ui-text-md)",
        "line-height": "1.25",
        padding: "0.5rem 1rem",
        "border-radius": "var(--ui-radius)",
        border: "1px solid transparent",
        "background-color": "var(--ui-c)",
        color: "var(--ui-on-c)",
        "border-color": "var(--ui-c)",
        cursor: "pointer",
        "user-select": "none",
        "text-decoration": "none",
        transition:
          "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          "background-color": "var(--ui-c-hover)",
          "border-color": "var(--ui-c-hover)",
        },
        "&:focus-visible": {
          outline: "2px solid var(--ui-ring)",
          "outline-offset": "2px",
        },
      },
      intents: {
        primary: {
          "--ui-c": "var(--ui-primary)",
          "--ui-on-c": "var(--ui-primary-fg)",
          "--ui-c-soft": "color-mix(in oklab, var(--ui-primary) 14%, white)",
          "--ui-c-soft-fg": "color-mix(in oklab, var(--ui-primary) 80%, black)",
        },
        secondary: {
          "--ui-c": "var(--ui-secondary)",
          "--ui-on-c": "var(--ui-secondary-fg)",
          "--ui-c-soft": "color-mix(in oklab, var(--ui-secondary) 14%, white)",
          "--ui-c-soft-fg": "color-mix(in oklab, var(--ui-secondary) 80%, black)",
        },
        success: {
          "--ui-c": "var(--ui-success)",
          "--ui-on-c": "var(--ui-success-fg)",
          "--ui-c-soft": "color-mix(in oklab, var(--ui-success) 16%, white)",
          "--ui-c-soft-fg": "color-mix(in oklab, var(--ui-success) 55%, black)",
        },
        warning: {
          "--ui-c": "var(--ui-warning)",
          "--ui-on-c": "var(--ui-warning-fg)",
          "--ui-c-soft": "color-mix(in oklab, var(--ui-warning) 22%, white)",
          "--ui-c-soft-fg": "color-mix(in oklab, var(--ui-warning) 45%, black)",
        },
        danger: {
          "--ui-c": "var(--ui-danger)",
          "--ui-on-c": "var(--ui-danger-fg)",
          "--ui-c-soft": "color-mix(in oklab, var(--ui-danger) 12%, white)",
          "--ui-c-soft-fg": "color-mix(in oklab, var(--ui-danger) 70%, black)",
        },
      },
      styles: {
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
        ghost: {
          "background-color": "transparent",
          "border-color": "transparent",
          color: "var(--ui-c)",
          "&:hover": {
            "background-color": "var(--ui-c-soft)",
            "border-color": "transparent",
            color: "var(--ui-c-soft-fg)",
          },
        },
        soft: {
          "background-color": "var(--ui-c-soft)",
          "border-color": "transparent",
          color: "var(--ui-c-soft-fg)",
          "&:hover": {
            "background-color": "var(--ui-c)",
            "border-color": "var(--ui-c)",
            color: "var(--ui-on-c)",
          },
        },
      },
      sizes: {
        sm: {
          "font-size": "var(--ui-text-sm)",
          padding: "0.375rem 0.75rem",
        },
        lg: {
          "font-size": "var(--ui-text-lg)",
          padding: "0.75rem 1.5rem",
        },
      },
      states: {
        disabled: {
          opacity: "0.5",
          cursor: "not-allowed",
          "pointer-events": "none",
        },
        loading: {
          cursor: "progress",
          "pointer-events": "none",
          "&::after": {
            content: '""',
            width: "1em",
            height: "1em",
            "flex-shrink": "0",
            "border-radius": "9999px",
            border: "2px solid currentColor",
            "border-top-color": "transparent",
            animation: "ui-spin 0.6s linear infinite",
          },
        },
        active: {
          "box-shadow": "inset 0 2px 4px rgb(0 0 0 / 0.2)",
        },
      },
    },
  },
});

/** Base-layer extras that can't live inside a component rule. */
export const defaultBaseExtras: Record<string, unknown> = {
  "@keyframes ui-spin": {
    to: { transform: "rotate(360deg)" },
  },
};
