import { INTENTS, defineAdapter, type CssRuleObject, type Intent } from "./types.js";

/** [soft tint %, soft text darkening %] per intent. */
const INTENT_MIX: Record<Intent, [number, number]> = {
  primary: [14, 80],
  secondary: [14, 80],
  success: [16, 55],
  warning: [22, 45],
  danger: [12, 70],
};

/** Share of the intent colour kept when it is used as text (rest = surface text).
 *  Only warning is too light to read on a light surface at full strength. */
const INTENT_TEXT_MIX: Partial<Record<Intent, number>> = { warning: 55 };

/** The per-element variables an intent sets (see composition model). */
function intentVars(intent: Intent): CssRuleObject {
  const [soft, fg] = INTENT_MIX[intent];
  return {
    "--ui-c": `var(--ui-${intent})`,
    /* adapters can pin the text colour with --ui-<intent>-text */
    "--ui-c-text": `var(--ui-${intent}-text, ${
      INTENT_TEXT_MIX[intent]
        ? `color-mix(in oklab, var(--ui-${intent}) ${INTENT_TEXT_MIX[intent]}%, var(--ui-surface-fg))`
        : `var(--ui-${intent})`
    })`,
    "--ui-on-c": `var(--ui-${intent}-fg)`,
    /* mixed with the surface (not white/black) so soft looks stay legible in dark themes */
    /* adapters can pin exact soft colors with --ui-<intent>-soft / -soft-fg */
    "--ui-c-soft": `var(--ui-${intent}-soft, color-mix(in oklab, var(--ui-${intent}) ${soft}%, var(--ui-surface)))`,
    "--ui-c-soft-fg": `var(--ui-${intent}-soft-fg, color-mix(in oklab, var(--ui-${intent}) ${fg}%, var(--ui-surface-fg)))`,
    /* optional pins for systems with hand-picked steps (e.g. a 12-step scale);
       the fallbacks reproduce the derived look, so unset = no change */
    "--ui-c-hover": `var(--ui-${intent}-hover, color-mix(in oklab, var(--ui-c) 85%, black))`,
    "--ui-c-border": `var(--ui-${intent}-border, var(--ui-c))`,
    "--ui-c-soft-hover": `var(--ui-${intent}-soft-hover, var(--ui-c))`,
  };
}

/** Build a full intent map, optionally adding extra declarations per intent. */
function intentMap(extra?: (intent: Intent) => CssRuleObject): Record<Intent, CssRuleObject> {
  const out = {} as Record<Intent, CssRuleObject>;
  for (const i of INTENTS) out[i] = { ...intentVars(i), ...extra?.(i) };
  return out;
}

const intents = intentMap();

/** Variables for the neutral (no intent) look. */
const neutralVars: CssRuleObject = {
  "--ui-c": "var(--ui-neutral)",
  "--ui-c-text": "var(--ui-surface-fg)",
  "--ui-on-c": "var(--ui-neutral-fg)",
  "--ui-c-soft": "var(--ui-neutral-soft)",
  "--ui-c-soft-fg": "var(--ui-neutral-soft-fg)",
};

const transition = (props: string[]) => props.map((p) => `${p} 0.15s ease`).join(", ");

const focusRing: CssRuleObject = {
  outline: "2px solid var(--ui-ring)",
  "outline-offset": "2px",
};

/* ---- text fields (input / textarea / select) ---- */

const fieldBase: CssRuleObject = {
  /* focus/accent color; intents re-point it, --ui-field-c also tints the border */
  "--ui-c": "var(--ui-ring)",
  "--ui-c-text": "var(--ui-ring)",
  display: "block",
  width: "100%",
  "box-sizing": "border-box",
  margin: "0",
  "font-family": "var(--ui-font-sans)",
  "font-size": "var(--ui-text-md)",
  "line-height": "1.25",
  padding: "0.5rem 0.75rem",
  color: "var(--ui-surface-fg)",
  "background-color": "var(--ui-surface)",
  border: "1px solid var(--ui-field-c, var(--ui-border))",
  "border-radius": "var(--ui-radius)",
  transition: transition(["background-color", "border-color", "box-shadow"]),
  "&::placeholder": {
    color: "color-mix(in oklab, var(--ui-surface-fg) 45%, transparent)",
  },
  "&:hover": {
    "border-color":
      "var(--ui-field-c, color-mix(in oklab, var(--ui-border) 65%, var(--ui-surface-fg)))",
  },
  "&:focus-visible": {
    outline: "2px solid var(--ui-ring)",
    "outline-offset": "1px",
    "border-color": "var(--ui-c)",
    "box-shadow": "none",
  },
  "@media (prefers-reduced-motion: reduce)": { transition: "none" },
  /* aria-invalid renders like ui-danger without the class. The extra :not()
     lifts specificity so it also wins over intent, style and hover rules;
     the danger text colour doubles as the boundary colour (>= 3:1 in every skin). */
  '&[aria-invalid="true"]:not([aria-invalid="false"])': {
    "--ui-field-c": "var(--ui-danger-text, var(--ui-danger))",
    "border-color": "var(--ui-danger-text, var(--ui-danger))",
    "&:hover": { "border-color": "var(--ui-danger-text, var(--ui-danger))" },
  },
};

const fieldIntents = intentMap(() => ({ "--ui-field-c": "var(--ui-c-text)" }));

const fieldStyles: Record<"outline" | "ghost" | "soft", CssRuleObject> = {
  outline: {
    "border-color": "var(--ui-c)",
    "&:hover": { "border-color": "var(--ui-c)" },
  },
  ghost: {
    "background-color": "transparent",
    "border-color": "transparent",
    "&:hover": { "background-color": "var(--ui-surface-muted)", "border-color": "transparent" },
    "&:focus-visible": {
      "background-color": "var(--ui-surface)",
      "border-color": "var(--ui-c)",
    },
  },
  soft: {
    "background-color": "var(--ui-surface-muted)",
    "border-color": "transparent",
    "&:hover": { "border-color": "var(--ui-c)" },
    "&:focus-visible": {
      "background-color": "var(--ui-surface)",
      "border-color": "var(--ui-c)",
    },
  },
};

const fieldSizes = {
  sm: { "font-size": "var(--ui-text-sm)", padding: "0.375rem 0.625rem" },
  lg: { "font-size": "var(--ui-text-lg)", padding: "0.75rem 1rem" },
};

const fieldStates: Record<"disabled" | "loading" | "active", CssRuleObject> = {
  disabled: {
    opacity: "0.5",
    cursor: "not-allowed",
    "background-color": "var(--ui-surface-muted)",
  },
  loading: { cursor: "progress", animation: "ui-pulse 1.2s ease-in-out infinite" },
  active: {
    "border-color": "var(--ui-c)",
    "box-shadow": "0 0 0 3px color-mix(in oklab, var(--ui-c) 25%, transparent)",
  },
};

const chevron =
  "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)";

/* ---- shared status states (badge / alert) ---- */

const statusStates: Record<"disabled" | "loading" | "active", CssRuleObject> = {
  disabled: { opacity: "0.5", cursor: "not-allowed" },
  loading: { animation: "ui-pulse 1.2s ease-in-out infinite" },
  active: { "box-shadow": "0 0 0 3px color-mix(in oklab, var(--ui-c) 30%, transparent)" },
};


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
    "--ui-success": "oklch(0.5 0.14 163)",
    "--ui-success-fg": "oklch(0.98 0 0)",
    "--ui-warning": "oklch(0.78 0.15 85)",
    "--ui-warning-fg": "oklch(0.28 0.04 90)",
    "--ui-danger": "oklch(0.56 0.2 27)",
    "--ui-danger-fg": "oklch(0.98 0 0)",

    /* surfaces */
    "--ui-surface": "oklch(1 0 0)",
    "--ui-surface-fg": "oklch(0.24 0.02 265)",
    "--ui-surface-muted": "oklch(0.96 0.005 265)",
    "--ui-border": "oklch(0.89 0.008 265)",
    "--ui-ring": "oklch(0.62 0.18 262)",
    "--ui-overlay": "rgb(0 0 0 / 0.5)",
    "--ui-overlay-soft": "rgb(255 255 255 / 0.6)",

    /* shape & type */
    "--ui-radius": "0.5rem",
    "--ui-text-sm": "0.8125rem",
    "--ui-text-md": "0.9375rem",
    "--ui-text-lg": "1.0625rem",
  },
  darkTokens: {
    "--ui-neutral": "oklch(0.92 0.01 265)",
    "--ui-neutral-fg": "oklch(0.2 0.02 265)",
    "--ui-neutral-soft": "oklch(0.3 0.015 265)",
    "--ui-neutral-soft-fg": "oklch(0.92 0.01 265)",

    "--ui-primary": "oklch(0.68 0.17 267)",
    "--ui-primary-fg": "oklch(0.15 0.02 265)",
    "--ui-secondary": "oklch(0.7 0.07 285)",
    "--ui-secondary-fg": "oklch(0.15 0.02 285)",
    "--ui-success": "oklch(0.72 0.15 163)",
    "--ui-success-fg": "oklch(0.15 0.03 163)",
    "--ui-warning": "oklch(0.82 0.15 85)",
    "--ui-warning-fg": "oklch(0.2 0.04 90)",
    "--ui-danger": "oklch(0.68 0.19 27)",
    "--ui-danger-fg": "oklch(0.15 0.03 27)",

    "--ui-surface": "oklch(0.21 0.015 265)",
    "--ui-surface-fg": "oklch(0.95 0.005 265)",
    "--ui-surface-muted": "oklch(0.26 0.015 265)",
    "--ui-border": "oklch(0.34 0.015 265)",
    "--ui-ring": "oklch(0.7 0.15 262)",
    "--ui-overlay": "rgb(0 0 0 / 0.5)",
    "--ui-overlay-soft": "rgb(255 255 255 / 0.6)",
  },
  components: {
    button: {
      base: {
        /* default = neutral intent; intents below override these vars */
        "--ui-c": "var(--ui-neutral)",
        "--ui-c-text": "var(--ui-surface-fg)",
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
        "border-color": "var(--ui-c-border, var(--ui-c))",
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
      intents,
      styles: {
        outline: {
          "background-color": "transparent",
          color: "var(--ui-c-text)",
          "border-color": "var(--ui-c-border, var(--ui-c))",
          "&:hover": {
            "background-color": "var(--ui-c)",
            "border-color": "var(--ui-c)",
            color: "var(--ui-on-c)",
          },
        },
        ghost: {
          "background-color": "transparent",
          "border-color": "transparent",
          color: "var(--ui-c-text)",
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
            "background-color": "var(--ui-c-soft-hover, var(--ui-c))",
            "border-color": "var(--ui-c-border, var(--ui-c))",
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

    input: {
      base: { ...fieldBase },
      intents: fieldIntents,
      styles: fieldStyles,
      sizes: fieldSizes,
      states: fieldStates,
    },

    textarea: {
      base: { ...fieldBase, "line-height": "1.5", "min-height": "5rem", resize: "vertical" },
      intents: fieldIntents,
      styles: fieldStyles,
      sizes: fieldSizes,
      states: fieldStates,
    },

    select: {
      base: {
        ...fieldBase,
        appearance: "none",
        cursor: "pointer",
        "padding-right": "2.25rem",
        "background-image": chevron,
        "background-position": "calc(100% - 1.1rem) 55%, calc(100% - 0.75rem) 55%",
        "background-size": "0.35rem 0.35rem, 0.35rem 0.35rem",
        "background-repeat": "no-repeat",
        /* listbox-style selects have no dropdown arrow */
        '&[multiple], &[size]:not([size="1"])': {
          "background-image": "none",
          "padding-right": "0.75rem",
          height: "auto",
          cursor: "auto",
        },
      },
      intents: fieldIntents,
      styles: fieldStyles,
      sizes: {
        sm: { ...fieldSizes.sm, "padding-right": "2rem" },
        lg: { ...fieldSizes.lg, "padding-right": "2.5rem" },
      },
      states: fieldStates,
    },

    checkbox: {
      base: {
        ...neutralVars,
        appearance: "none",
        display: "inline-grid",
        "place-content": "center",
        "flex-shrink": "0",
        "box-sizing": "border-box",
        width: "var(--ui-check-size, 1.125rem)",
        height: "var(--ui-check-size, 1.125rem)",
        margin: "0",
        "vertical-align": "middle",
        cursor: "pointer",
        "background-color": "var(--ui-surface)",
        border: "1px solid color-mix(in oklab, var(--ui-border) 55%, var(--ui-surface-fg))",
        "border-radius": "calc(var(--ui-radius) * 0.5)",
        transition: transition(["background-color", "border-color", "box-shadow"]),
        "&::after": {
          content: '""',
          width: "0.3125em",
          height: "0.5625em",
          "box-sizing": "border-box",
          border: "solid var(--ui-check-mark, var(--ui-on-c))",
          "border-width": "0 2px 2px 0",
          transform: "translateY(-8%) rotate(45deg) scale(0)",
          transition: "transform 0.12s ease",
          "font-size": "var(--ui-check-size, 1.125rem)",
        },
        "&:hover": { "border-color": "var(--ui-c)" },
        '&:checked, &:indeterminate, &[aria-checked="true"], &[aria-checked="mixed"]': {
          "background-color": "var(--ui-c)",
          "border-color": "var(--ui-c-text)",
        },
        '&:checked::after, &[aria-checked="true"]::after': {
          transform: "translateY(-8%) rotate(45deg) scale(1)",
        },
        '&:indeterminate::after, &[aria-checked="mixed"]::after': {
          width: "0.55em",
          height: "2px",
          "border-width": "0",
          "background-color": "var(--ui-check-mark, var(--ui-on-c))",
          transform: "scale(1)",
        },
        "&:focus-visible": focusRing,
      },
      intents,
      styles: {
        outline: {
          "--ui-check-mark": "var(--ui-c-text)",
          "border-color": "var(--ui-c-text)",
          '&:checked, &:indeterminate, &[aria-checked="true"], &[aria-checked="mixed"]': { "background-color": "transparent" },
        },
        ghost: {
          "--ui-check-mark": "var(--ui-c-soft-fg)",
          "background-color": "var(--ui-surface-muted)",
          "border-color": "transparent",
          '&:checked, &:indeterminate, &[aria-checked="true"], &[aria-checked="mixed"]': {
            "background-color": "var(--ui-c-soft)",
            "border-color": "transparent",
          },
        },
        soft: {
          "--ui-check-mark": "var(--ui-c-soft-fg)",
          '&:checked, &:indeterminate, &[aria-checked="true"], &[aria-checked="mixed"]': {
            "background-color": "var(--ui-c-soft)",
            "border-color": "var(--ui-c-text)",
          },
        },
      },
      sizes: {
        sm: { "--ui-check-size": "0.9375rem" },
        lg: { "--ui-check-size": "1.5rem" },
      },
      states: {
        disabled: { opacity: "0.5", cursor: "not-allowed" },
        loading: { cursor: "progress", animation: "ui-pulse 1.2s ease-in-out infinite" },
        active: { "box-shadow": "0 0 0 3px color-mix(in oklab, var(--ui-c) 30%, transparent)" },
      },
    },

    radio: {
      base: {
        ...neutralVars,
        appearance: "none",
        display: "inline-grid",
        "place-content": "center",
        "flex-shrink": "0",
        "box-sizing": "border-box",
        width: "var(--ui-radio-size, 1.125rem)",
        height: "var(--ui-radio-size, 1.125rem)",
        margin: "0",
        "vertical-align": "middle",
        cursor: "pointer",
        "background-color": "var(--ui-surface)",
        border: "1px solid color-mix(in oklab, var(--ui-border) 55%, var(--ui-surface-fg))",
        "border-radius": "50%",
        transition: transition(["background-color", "border-color", "box-shadow"]),
        "&::after": {
          content: '""',
          width: "var(--ui-radio-dot-size, 0.5em)",
          height: "var(--ui-radio-dot-size, 0.5em)",
          "border-radius": "50%",
          "background-color": "var(--ui-radio-dot, var(--ui-on-c))",
          transform: "scale(0)",
          transition: "transform 0.12s ease",
          "font-size": "var(--ui-radio-size, 1.125rem)",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        },
        "&:hover": { "border-color": "var(--ui-c)" },
        '&:checked, &[aria-checked="true"]': {
          "background-color": "var(--ui-c)",
          "border-color": "var(--ui-c-text)",
        },
        '&:checked::after, &[aria-checked="true"]::after': { transform: "scale(1)" },
        "&:focus-visible": focusRing,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      intents,
      styles: {
        outline: {
          "--ui-radio-dot": "var(--ui-c-text)",
          "border-color": "var(--ui-c-text)",
          '&:checked, &[aria-checked="true"]': { "background-color": "transparent" },
        },
        ghost: {
          "--ui-radio-dot": "var(--ui-c-soft-fg)",
          "background-color": "var(--ui-surface-muted)",
          "border-color": "transparent",
          '&:checked, &[aria-checked="true"]': {
            "background-color": "var(--ui-c-soft)",
            "border-color": "transparent",
          },
        },
        soft: {
          "--ui-radio-dot": "var(--ui-c-soft-fg)",
          '&:checked, &[aria-checked="true"]': {
            "background-color": "var(--ui-c-soft)",
            "border-color": "var(--ui-c-text)",
          },
        },
      },
      sizes: {
        sm: { "--ui-radio-size": "0.9375rem" },
        lg: { "--ui-radio-size": "1.5rem" },
      },
      states: {
        disabled: { opacity: "0.5", cursor: "not-allowed" },
        loading: { cursor: "progress", animation: "ui-pulse 1.2s ease-in-out infinite" },
        active: { "box-shadow": "0 0 0 3px color-mix(in oklab, var(--ui-c) 30%, transparent)" },
      },
    },

    switch: {
      base: {
        ...neutralVars,
        appearance: "none",
        display: "inline-grid",
        "align-items": "center",
        "flex-shrink": "0",
        "box-sizing": "border-box",
        width: "calc(var(--ui-switch-size, 1.25rem) * 1.75)",
        height: "var(--ui-switch-size, 1.25rem)",
        margin: "0",
        padding: "0",
        "vertical-align": "middle",
        cursor: "pointer",
        /* off track: a mid grey mixed from the page text, >= 3:1 on the surface */
        "background-color":
          "var(--ui-switch-track, color-mix(in oklab, var(--ui-surface-fg) 55%, var(--ui-surface)))",
        border:
          "1px solid var(--ui-switch-track, color-mix(in oklab, var(--ui-surface-fg) 55%, var(--ui-surface)))",
        "border-radius": "9999px",
        transition: transition(["background-color", "border-color", "box-shadow"]),
        "&::after": {
          content: '""',
          "box-sizing": "border-box",
          width: "calc(var(--ui-switch-size, 1.25rem) - 2px - 2 * var(--ui-switch-pad, 2px))",
          height: "calc(var(--ui-switch-size, 1.25rem) - 2px - 2 * var(--ui-switch-pad, 2px))",
          "border-radius": "9999px",
          "background-color": "var(--ui-switch-thumb, var(--ui-surface))",
          "margin-inline-start": "var(--ui-switch-pad, 2px)",
          transition: "margin-inline-start 0.15s ease, background-color 0.15s ease",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        },
        '&:checked, &[aria-checked="true"]': {
          "background-color": "var(--ui-c)",
          "border-color": "var(--ui-c)",
        },
        '&:checked::after, &[aria-checked="true"]::after': {
          "background-color": "var(--ui-switch-thumb, var(--ui-on-c))",
          "margin-inline-start":
            "calc(var(--ui-switch-size, 1.25rem) * 0.75 + var(--ui-switch-pad, 2px))",
        },
        "&:focus-visible": focusRing,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        /* Windows high contrast: system colours, so the thumb and the on/off
           state stay visible without relying on background colours. */
        "@media (forced-colors: active)": {
          "forced-color-adjust": "none",
          "background-color": "Canvas !important",
          "border-color": "ButtonText !important",
          "&::after": { "background-color": "ButtonText !important" },
          '&:checked, &[aria-checked="true"]': {
            "background-color": "Highlight !important",
            "border-color": "Highlight !important",
          },
          '&:checked::after, &[aria-checked="true"]::after': {
            "background-color": "HighlightText !important",
          },
          '&:disabled, &[aria-disabled="true"]': {
            "border-color": "GrayText !important",
            "&::after": { "background-color": "GrayText !important" },
          },
          "&:focus-visible": { outline: "2px solid Highlight !important" },
        },
      },
      intents,
      styles: {
        outline: {
          "background-color": "transparent",
          "border-color": "var(--ui-c)",
          "--ui-switch-thumb": "var(--ui-c)",
        },
        ghost: {
          "background-color": "var(--ui-surface-muted)",
          "--ui-switch-thumb": "var(--ui-surface-fg)",
          '&:checked, &[aria-checked="true"]': {
            "background-color": "var(--ui-c-soft)",
            "--ui-switch-thumb": "var(--ui-c-soft-fg)",
          },
        },
        soft: {
          "background-color": "var(--ui-c-soft)",
          "--ui-switch-thumb": "var(--ui-c-soft-fg)",
          '&:checked, &[aria-checked="true"]': {
            "background-color": "var(--ui-c-soft)",
            "border-color": "var(--ui-c)",
          },
        },
      },
      sizes: {
        sm: { "--ui-switch-size": "1rem" },
        lg: { "--ui-switch-size": "1.5rem" },
      },
      states: {
        disabled: { opacity: "0.5", cursor: "not-allowed" },
        loading: {
          cursor: "progress",
          "&::after": { animation: "ui-pulse 1.2s ease-in-out infinite" },
        },
        active: { "box-shadow": "0 0 0 3px color-mix(in oklab, var(--ui-c) 30%, transparent)" },
      },
    },

    /* ui-field: label + control + hint/error stack. Hooks: --ui-field-gap,
       --ui-field-label / -hint / -error (text colours). Logical properties only. */
    field: {
      base: {
        display: "flex",
        "flex-direction": "column",
        "align-items": "stretch",
        gap: "var(--ui-field-gap, 0.375rem)",
        "min-inline-size": "0",
        "font-family": "var(--ui-font-sans)",
      },
    },
    "field-label": {
      base: {
        display: "block",
        "font-size": "var(--ui-text-sm)",
        "font-weight": "500",
        "line-height": "1.25",
        color: "var(--ui-field-label, var(--ui-surface-fg))",
      },
    },
    "field-hint": {
      base: {
        margin: "0",
        "font-size": "var(--ui-text-sm)",
        "line-height": "1.4",
        color: "var(--ui-field-hint, color-mix(in oklab, var(--ui-surface-fg) 72%, var(--ui-surface)))",
        "&:empty": { display: "none" },
      },
    },
    "field-error": {
      base: {
        margin: "0",
        "font-size": "var(--ui-text-sm)",
        "font-weight": "500",
        "line-height": "1.4",
        color: "var(--ui-field-error, var(--ui-danger-text, var(--ui-danger)))",
        "&:empty": { display: "none" },
      },
    },

    card: {
      base: {
        ...neutralVars,
        display: "flex",
        "flex-direction": "column",
        "box-sizing": "border-box",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-text-md)",
        color: "var(--ui-surface-fg)",
        "background-color": "var(--ui-surface)",
        border: "1px solid var(--ui-card-border, var(--ui-border))",
        "border-radius": "calc(var(--ui-radius) * 1.5)",
        "box-shadow": "0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.04)",
        overflow: "hidden",
        transition: transition(["box-shadow", "border-color", "background-color"]),
      },
      intents: intentMap((i) => ({
        "--ui-card-border": `color-mix(in oklab, var(--ui-${i}) 45%, var(--ui-border))`,
      })),
      styles: {
        outline: { "box-shadow": "none", "border-color": "var(--ui-c-border, var(--ui-c))" },
        ghost: {
          "box-shadow": "none",
          "background-color": "transparent",
          "border-color": "transparent",
        },
        soft: {
          "box-shadow": "none",
          "background-color": "var(--ui-c-soft)",
          color: "var(--ui-c-soft-fg)",
          "border-color": "transparent",
        },
      },
      sizes: {
        sm: { "--ui-card-pad": "0.75rem", "font-size": "var(--ui-text-sm)" },
        lg: { "--ui-card-pad": "1.75rem", "font-size": "var(--ui-text-lg)" },
      },
      states: {
        disabled: { opacity: "0.5", "pointer-events": "none" },
        loading: { "pointer-events": "none", animation: "ui-pulse 1.2s ease-in-out infinite" },
        active: {
          "border-color": "var(--ui-c)",
          "box-shadow": "0 0 0 3px color-mix(in oklab, var(--ui-c) 25%, transparent)",
        },
      },
    },

    "card-header": {
      base: {
        padding: "calc(var(--ui-card-pad, 1.25rem) * 0.8) var(--ui-card-pad, 1.25rem)",
        "font-weight": "600",
        "border-bottom": "1px solid var(--ui-border)",
      },
    },
    "card-body": {
      base: { flex: "1 1 auto", padding: "var(--ui-card-pad, 1.25rem)" },
    },
    "card-footer": {
      base: {
        display: "flex",
        "align-items": "center",
        "justify-content": "flex-end",
        gap: "0.5rem",
        padding: "calc(var(--ui-card-pad, 1.25rem) * 0.8) var(--ui-card-pad, 1.25rem)",
        "border-top": "1px solid var(--ui-border)",
        "background-color": "var(--ui-surface-muted)",
      },
    },

    badge: {
      base: {
        ...neutralVars,
        display: "inline-flex",
        "align-items": "center",
        gap: "0.25rem",
        "box-sizing": "border-box",
        "font-family": "var(--ui-font-sans)",
        "font-size": "0.75rem",
        "font-weight": "600",
        "line-height": "1",
        padding: "0.3125rem 0.625rem",
        "border-radius": "9999px",
        border: "1px solid var(--ui-c-border, var(--ui-c))",
        "background-color": "var(--ui-c)",
        color: "var(--ui-on-c)",
        "white-space": "nowrap",
      },
      intents,
      styles: {
        outline: { "background-color": "transparent", color: "var(--ui-c-text)" },
        ghost: {
          "background-color": "transparent",
          "border-color": "transparent",
          color: "var(--ui-c-text)",
        },
        soft: {
          "background-color": "var(--ui-c-soft)",
          "border-color": "transparent",
          color: "var(--ui-c-soft-fg)",
        },
      },
      sizes: {
        sm: { "font-size": "0.6875rem", padding: "0.1875rem 0.5rem" },
        lg: { "font-size": "0.875rem", padding: "0.4375rem 0.875rem" },
      },
      states: statusStates,
    },

    alert: {
      base: {
        ...neutralVars,
        display: "flex",
        "align-items": "flex-start",
        gap: "0.75rem",
        "box-sizing": "border-box",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-text-md)",
        "line-height": "1.4",
        padding: "0.875rem 1rem",
        "border-radius": "var(--ui-radius)",
        border: "1px solid var(--ui-c-border, var(--ui-c))",
        "background-color": "var(--ui-c)",
        color: "var(--ui-on-c)",
      },
      intents,
      styles: {
        outline: { "background-color": "var(--ui-surface)", color: "var(--ui-surface-fg)" },
        ghost: {
          "background-color": "transparent",
          "border-color": "transparent",
          color: "var(--ui-c-text)",
        },
        soft: {
          "background-color": "var(--ui-c-soft)",
          "border-color": "color-mix(in oklab, var(--ui-c) 28%, transparent)",
          color: "var(--ui-c-soft-fg)",
        },
      },
      sizes: {
        sm: { "font-size": "var(--ui-text-sm)", padding: "0.5rem 0.75rem" },
        lg: { "font-size": "var(--ui-text-lg)", padding: "1.125rem 1.375rem" },
      },
      states: statusStates,
    },

    /* ui-table styles native th/td/tr/caption through nested selectors
       (decision 003) — no row/cell classes. tr-level states live here;
       the emitted states slot only covers table-level ui-loading. */
    table: {
      base: {
        /* neutral intent vars — a table with no intent class still needs
           --ui-c for the header underline and --ui-c-soft for selected rows */
        "--ui-c": "var(--ui-neutral)",
        "--ui-c-text": "var(--ui-neutral-text, var(--ui-neutral))",
        "--ui-on-c": "var(--ui-neutral-fg)",
        "--ui-c-soft": "var(--ui-neutral-soft)",
        "--ui-c-soft-fg": "var(--ui-neutral-soft-fg)",

        width: "100%",
        "border-collapse": "collapse",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-text-md)",
        "line-height": "1.25",
        color: "var(--ui-surface-fg)",
        "& caption": {
          "caption-side": "bottom",
          "font-size": "var(--ui-text-sm)",
          color: "color-mix(in oklab, var(--ui-surface-fg) 65%, var(--ui-surface))",
          "padding-block": "0.5rem",
          "text-align": "start",
        },
        "& th, & td": {
          padding:
            "var(--ui-table-pad-y, 0.5rem) var(--ui-table-pad-x, 0.75rem)",
          "text-align": "start",
          "vertical-align": "top",
        },
        "& thead th": {
          "font-weight": "600",
          "font-size": "var(--ui-text-sm)",
          color: "var(--ui-table-head-fg, var(--ui-surface-fg))",
          "background-color": "var(--ui-table-head-bg, var(--ui-surface))",
          /* intent-tinted but deepened so it stays >= 3:1 (a bright intent
             alone would not) */
          "border-bottom":
            "2px solid color-mix(in oklab, var(--ui-c) 55%, var(--ui-surface-fg))",
          position: "sticky",
          top: "0",
        },
        "& th[aria-sort]": { cursor: "pointer" },
        '& th[aria-sort="ascending"]::after, & th[aria-sort="descending"]::after': {
          content: '""',
          display: "inline-block",
          "margin-inline-start": "0.4em",
          "border-inline": "0.3em solid transparent",
        },
        '& th[aria-sort="ascending"]::after': {
          "border-bottom": "0.35em solid currentColor",
        },
        '& th[aria-sort="descending"]::after': {
          "border-top": "0.35em solid currentColor",
        },
        "& tbody tr": {
          "border-bottom": "1px solid var(--ui-table-border, var(--ui-border))",
          transition: "background-color 0.15s ease",
        },
        "& tbody tr:last-child": { "border-bottom": "0" },
        "& tbody tr:hover": {
          "background-color": "var(--ui-table-row-hover, var(--ui-surface-muted))",
        },
        "& tbody tr.ui-active, & tbody tr[aria-selected='true']": {
          "background-color": "var(--ui-c-soft)",
          color: "var(--ui-c-soft-fg)",
        },
        "& tbody tr.ui-disabled, & tbody tr[aria-disabled='true']": {
          opacity: "0.5",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& tbody tr": { transition: "none" },
        },
      },
      intents,
      styles: {
        /* zebra stripes — decision 5 in ADR-003 */
        soft: {
          "& tbody tr:nth-of-type(even)": {
            "background-color": "var(--ui-table-stripe, var(--ui-surface-muted))",
          },
          "& tbody tr.ui-active, & tbody tr[aria-selected='true']": {
            "background-color": "var(--ui-c-soft)",
          },
        },
        /* full cell grid */
        outline: {
          "& th, & td": {
            border: "1px solid var(--ui-table-border, var(--ui-border))",
          },
        },
        /* no lines at all */
        ghost: {
          "& tbody tr": { "border-bottom-color": "transparent" },
          "& thead th": {
            "border-bottom-color":
              "color-mix(in oklab, var(--ui-c) 55%, var(--ui-surface-fg))",
          },
        },
      },
      sizes: {
        sm: {
          "font-size": "var(--ui-text-sm)",
          "--ui-table-pad-y": "0.25rem",
          "--ui-table-pad-x": "0.5rem",
        },
        lg: {
          "font-size": "var(--ui-text-lg)",
          "--ui-table-pad-y": "0.75rem",
          "--ui-table-pad-x": "1rem",
        },
      },
      states: {
        /* pulsing body while the table is busy — ui-loading / aria-busy
           on the table element itself */
        loading: {
          "& tbody": { animation: "ui-pulse 1.2s ease-in-out infinite" },
        },
      },
    },
    /* scroll container part — bounded height enables the sticky header;
       consumers add role=region + label + tabindex=0 when it scrolls. */
    "table-wrap": {
      base: {
        "overflow-x": "auto",
        border: "1px solid var(--ui-table-border, var(--ui-border))",
        "border-radius": "var(--ui-radius)",
        "&:focus-visible": {
          outline: "2px solid var(--ui-ring)",
          "outline-offset": "2px",
        },
      },
    },
    /* ui-accordion: native <details>/<summary>, no JavaScript. The
       container carries the modifiers; the item, trigger and panel parts
       are styled from their own slots. `[open]` is the state hook. */
    accordion: {
      base: {
        /* neutral intent vars — an intent class re-points them, and the
           open trigger is tinted with --ui-c-text */
        "--ui-c": "var(--ui-neutral)",
        "--ui-c-text": "var(--ui-surface-fg)",
        "--ui-on-c": "var(--ui-neutral-fg)",
        "--ui-c-soft": "var(--ui-neutral-soft)",
        "--ui-c-soft-fg": "var(--ui-neutral-soft-fg)",

        display: "block",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-text-md)",
        "line-height": "1.25",
        color: "var(--ui-surface-fg)",
        border: "1px solid var(--ui-accordion-border, var(--ui-border))",
        "border-radius": "var(--ui-radius)",
        overflow: "hidden",
        "& .ui-accordion-item + .ui-accordion-item": {
          "border-top": "1px solid var(--ui-accordion-border, var(--ui-border))",
        },
      },
      intents,
      styles: {
        /* separate bordered items */
        outline: {
          border: "0",
          display: "grid",
          gap: "0.5rem",
          overflow: "visible",
          "& .ui-accordion-item": {
            border: "1px solid var(--ui-accordion-border, var(--ui-border))",
            "border-radius": "var(--ui-radius)",
            overflow: "hidden",
          },
        },
        /* no lines at all */
        ghost: {
          border: "0",
          "& .ui-accordion-item + .ui-accordion-item": { "border-top": "0" },
        },
        /* filled container; the open trigger takes the intent's soft tint */
        soft: {
          border: "0",
          "background-color": "var(--ui-accordion-soft-bg, var(--ui-surface-muted))",
          "& .ui-accordion-item + .ui-accordion-item": { "border-top-color": "var(--ui-surface)" },
          /* the whole open item takes the tint (trigger and panel), so the
             panel text does not sit against the edge of a band */
          "& .ui-accordion-item[open]": { "background-color": "var(--ui-c-soft)" },
          "& .ui-accordion-item[open] > .ui-accordion-trigger": { color: "var(--ui-c-soft-fg)" },
          /* the default ring colour can fall under 3:1 on a tint; the tint's
             own foreground is chosen to contrast with it */
          "& .ui-accordion-item[open] > .ui-accordion-trigger:focus-visible": {
            "outline-color": "var(--ui-c-soft-fg)",
          },
          "& .ui-accordion-item[open] > .ui-accordion-panel": { color: "var(--ui-c-soft-fg)" },
        },
      },
      sizes: {
        sm: {
          "font-size": "var(--ui-text-sm)",
          "--ui-accordion-pad-y": "0.5rem",
          "--ui-accordion-pad-x": "0.75rem",
        },
        lg: {
          "font-size": "var(--ui-text-lg)",
          "--ui-accordion-pad-y": "1rem",
          "--ui-accordion-pad-x": "1.25rem",
        },
      },
    },
    "accordion-item": {
      base: {
        display: "block",
        /* tinted by the intent, with a share of the surface text mixed back
           in so a saturated intent stays >= 4.5:1 on any surface */
        "&[open] > .ui-accordion-trigger": {
          color: "color-mix(in oklab, var(--ui-c-text) 75%, var(--ui-surface-fg))",
        },
        "&[open] > .ui-accordion-trigger::after": {
          transform: "translateY(0.15em) rotate(-135deg)",
        },
        "&[open] > .ui-accordion-panel": {
          animation: "ui-accordion-reveal 0.18s ease-out",
        },
      },
    },
    /* the <summary>: a keyboard-focusable disclosure button for free */
    "accordion-trigger": {
      base: {
        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "1rem",
        padding: "var(--ui-accordion-pad-y, 0.75rem) var(--ui-accordion-pad-x, 1rem)",
        "font-weight": "500",
        color: "var(--ui-surface-fg)",
        cursor: "pointer",
        "list-style": "none",
        "user-select": "none",
        transition: transition(["background-color", "color"]),
        "&::-webkit-details-marker": { display: "none" },
        "&::marker": { content: '""' },
        /* chevron drawn from borders, not an icon font */
        "&::after": {
          content: '""',
          flex: "none",
          width: "0.5em",
          height: "0.5em",
          "border-right": "2px solid currentColor",
          "border-bottom": "2px solid currentColor",
          transform: "translateY(-0.15em) rotate(45deg)",
          transition: "transform 0.15s ease",
        },
        "&:hover": { "background-color": "var(--ui-accordion-hover, var(--ui-surface-muted))" },
        "&:focus-visible": { ...focusRing, "outline-offset": "-2px" },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&::after": { transition: "none" },
        },
      },
    },
    "accordion-panel": {
      base: {
        padding: "0 var(--ui-accordion-pad-x, 1rem) var(--ui-accordion-pad-y, 0.75rem)",
        "font-size": "var(--ui-text-sm)",
        "line-height": "1.55",
        color: "color-mix(in oklab, var(--ui-surface-fg) 78%, var(--ui-surface))",
      },
    },
    /* ui-progress: native <progress>. The element is the track (so `color`
       is the bar); the value pseudo-elements paint with currentColor. The
       consumer provides the accessible name and value/max. */
    progress: {
      base: {
        /* neutral intent vars; the bar uses --ui-c-text, so it stays
           visible with no intent class and an intent tints it */
        "--ui-c": "var(--ui-neutral)",
        "--ui-c-text": "var(--ui-surface-fg)",
        "--ui-on-c": "var(--ui-neutral-fg)",
        "--ui-c-soft": "var(--ui-neutral-soft)",
        "--ui-c-soft-fg": "var(--ui-neutral-soft-fg)",

        appearance: "none",
        "-webkit-appearance": "none",
        display: "block",
        width: "100%",
        height: "var(--ui-progress-h, 0.5rem)",
        border: "0",
        "border-radius": "9999px",
        overflow: "hidden",
        "background-color": "var(--ui-progress-track, var(--ui-surface-muted))",
        color: "var(--ui-progress-bar, var(--ui-c-text))",
        "&::-webkit-progress-bar": { "background-color": "transparent" },
        "&::-webkit-progress-value": {
          "background-color": "currentColor",
          "border-radius": "inherit",
          transition: "width 0.2s ease",
        },
        "&::-moz-progress-bar": {
          "background-color": "currentColor",
          "border-radius": "inherit",
        },
        /* no value: a bar slides across the track (Chromium paints nothing
           for an indeterminate progress once the native look is removed) */
        "&:indeterminate": {
          "background-image":
            "linear-gradient(90deg, transparent 0, currentColor 50%, transparent 100%)",
          "background-size": "40% 100%",
          "background-repeat": "no-repeat",
          animation: "ui-progress-slide 1.4s ease-in-out infinite alternate",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "&::-webkit-progress-value": { transition: "none" },
          /* no motion: a dim, full-width bar says "working" without
             implying a percentage */
          "&:indeterminate": {
            "background-image": "none",
            "background-color":
              "color-mix(in oklab, currentColor 35%, var(--ui-progress-track, var(--ui-surface-muted)))",
          },
        },
      },
      intents,
      styles: {
        /* outlined track */
        outline: { "box-shadow": "inset 0 0 0 1px var(--ui-progress-border, var(--ui-border))" },
        /* no track fill: just the bar */
        ghost: { "background-color": "transparent" },
      },
      sizes: {
        sm: { "--ui-progress-h": "0.25rem" },
        lg: { "--ui-progress-h": "0.75rem" },
      },
    },
    /* ui-tooltip: CSS-only hover/focus bubble. The anchor reveals it on
       :hover and :focus-within, so the bubble stays visible while the
       pointer is over it (hoverable, WCAG 1.4.13). Dismissing it with
       Escape needs JavaScript or the Popover API: CSS cannot do it. */
    "tooltip-anchor": {
      base: {
        position: "relative",
        display: "inline-block",
        "&:hover > .ui-tooltip, &:focus-within > .ui-tooltip": {
          visibility: "visible",
          opacity: "1",
        },
      },
    },
    tooltip: {
      base: {
        /* neutral = the inverted surface; an intent re-points --ui-c */
        "--ui-c": "var(--ui-surface-fg)",
        "--ui-c-text": "var(--ui-surface-fg)",
        "--ui-on-c": "var(--ui-surface)",
        "--ui-c-soft": "var(--ui-neutral-soft)",
        "--ui-c-soft-fg": "var(--ui-neutral-soft-fg)",

        position: "absolute",
        "z-index": "20",
        width: "max-content",
        "max-width": "var(--ui-tooltip-max-w, 16rem)",
        "box-sizing": "border-box",
        padding: "var(--ui-tooltip-pad-y, 0.375rem) var(--ui-tooltip-pad-x, 0.625rem)",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-tooltip-fs, 0.8125rem)",
        "font-weight": "500",
        "line-height": "1.35",
        "text-align": "start",
        "border-radius": "calc(var(--ui-radius) * 0.75)",
        border: "1px solid transparent",
        "background-color": "var(--ui-tooltip-bg, var(--ui-c))",
        color: "var(--ui-tooltip-fg, var(--ui-on-c))",
        /* hidden until the anchor is hovered or focused */
        visibility: "hidden",
        opacity: "0",
        transition: "opacity 0.12s ease, visibility 0.12s",
        /* default placement: above, centred */
        bottom: "calc(100% + var(--ui-tooltip-gap, 0.5rem))",
        left: "50%",
        transform: "translateX(-50%)",
        "&[hidden]": { display: "none" },
        /* a transparent bridge over the gap keeps the hover unbroken */
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "calc(var(--ui-tooltip-gap, 0.5rem) * -1)",
          "z-index": "-1",
        },
        /* arrow: a rotated square in the bubble's own fill; size 0 removes it */
        "&::after": {
          content: '""',
          position: "absolute",
          width: "var(--ui-tooltip-arrow, 0.5rem)",
          height: "var(--ui-tooltip-arrow, 0.5rem)",
          "background-color": "inherit",
          "border-color": "inherit",
          "border-style": "solid",
          "border-width": "0",
          transform: "rotate(45deg)",
          bottom: "calc(var(--ui-tooltip-arrow, 0.5rem) / -2)",
          left: "calc(50% - var(--ui-tooltip-arrow, 0.5rem) / 2)",
        },
        '&[data-placement="bottom"]': {
          bottom: "auto",
          top: "calc(100% + var(--ui-tooltip-gap, 0.5rem))",
        },
        '&[data-placement="bottom"]::after': {
          bottom: "auto",
          top: "calc(var(--ui-tooltip-arrow, 0.5rem) / -2)",
        },
        /* start / end follow the writing direction (left / right in LTR) */
        '&[data-placement="start"]': {
          bottom: "auto",
          left: "auto",
          top: "50%",
          "inset-inline-end": "calc(100% + var(--ui-tooltip-gap, 0.5rem))",
          transform: "translateY(-50%)",
        },
        '&[data-placement="start"]::after': {
          bottom: "auto",
          left: "auto",
          top: "calc(50% - var(--ui-tooltip-arrow, 0.5rem) / 2)",
          "inset-inline-end": "calc(var(--ui-tooltip-arrow, 0.5rem) / -2)",
        },
        '&[data-placement="end"]': {
          bottom: "auto",
          left: "auto",
          top: "50%",
          "inset-inline-start": "calc(100% + var(--ui-tooltip-gap, 0.5rem))",
          transform: "translateY(-50%)",
        },
        '&[data-placement="end"]::after': {
          bottom: "auto",
          left: "auto",
          top: "calc(50% - var(--ui-tooltip-arrow, 0.5rem) / 2)",
          "inset-inline-start": "calc(var(--ui-tooltip-arrow, 0.5rem) / -2)",
        },
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      intents,
      styles: {
        /* tinted fill, the intent's soft foreground */
        soft: {
          "background-color": "var(--ui-tooltip-bg, var(--ui-c-soft))",
          color: "var(--ui-tooltip-fg, var(--ui-c-soft-fg))",
        },
        /* surface fill with an accent border */
        outline: {
          "background-color": "var(--ui-tooltip-bg, var(--ui-surface))",
          color: "var(--ui-tooltip-fg, var(--ui-surface-fg))",
          "border-color": "var(--ui-c-border, var(--ui-c))",
          /* the arrow carries the border on the two edges that point out */
          "&::after": { "border-width": "0 1px 1px 0" },
          '&[data-placement="bottom"]::after': { "border-width": "1px 0 0 1px" },
          '&[data-placement="start"]::after': { "border-width": "1px 1px 0 0" },
          '&[data-placement="end"]::after': { "border-width": "0 0 1px 1px" },
        },
      },
      sizes: {
        sm: { "--ui-tooltip-fs": "0.75rem", "--ui-tooltip-pad-y": "0.25rem", "--ui-tooltip-pad-x": "0.5rem" },
        lg: { "--ui-tooltip-fs": "0.9375rem", "--ui-tooltip-pad-y": "0.5rem", "--ui-tooltip-pad-x": "0.875rem" },
      },
      states: {
        /* force visible, for JS-driven or headless use */
        active: { visibility: "visible", opacity: "1" },
      },
    },
    /* ui-toast-region / ui-toast: CSS for position, stacking, elevation and
       the enter transition. Everything dynamic is the consumer's: inserting
       and removing toasts, timers, the live region (it must already exist
       in the DOM before a toast is inserted, or screen readers drop the
       announcement) and a visible dismiss control. */
    "toast-region": {
      base: {
        position: "fixed",
        "z-index": "60",
        display: "flex",
        "flex-direction": "column",
        gap: "var(--ui-toast-gap, 0.5rem)",
        "box-sizing": "border-box",
        width: "min(100%, calc(var(--ui-toast-w, 22rem) + 2 * var(--ui-toast-offset, 1rem)))",
        padding:
          "calc(var(--ui-toast-offset, 1rem) + env(safe-area-inset-top, 0px)) calc(var(--ui-toast-offset, 1rem) + env(safe-area-inset-right, 0px)) calc(var(--ui-toast-offset, 1rem) + env(safe-area-inset-bottom, 0px)) calc(var(--ui-toast-offset, 1rem) + env(safe-area-inset-left, 0px))",
        /* the region never blocks the page; only the toasts take the pointer */
        "pointer-events": "none",
        /* default placement: bottom-end */
        "inset-block-end": "0",
        "inset-inline-end": "0",
        '&[data-placement^="top"]': { "inset-block-start": "0", "inset-block-end": "auto" },
        '&[data-placement$="start"]': { "inset-inline-start": "0", "inset-inline-end": "auto" },
        '&[data-placement$="center"]': {
          left: "50%",
          right: "auto",
          "inset-inline-start": "50%",
          "inset-inline-end": "auto",
          transform: "translateX(-50%)",
        },
      },
    },
    toast: {
      base: {
        /* neutral = a surface card; an intent re-points --ui-c / --ui-on-c
           and the edge, so intents only set variables and never compete
           with the style rules */
        "--ui-c": "var(--ui-surface)",
        "--ui-c-text": "var(--ui-surface-fg)",
        "--ui-on-c": "var(--ui-surface-fg)",
        "--ui-c-soft": "var(--ui-neutral-soft)",
        "--ui-c-soft-fg": "var(--ui-neutral-soft-fg)",
        "--ui-toast-edge": "var(--ui-border)",

        display: "flex",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "0.75rem",
        "box-sizing": "border-box",
        width: "100%",
        padding: "var(--ui-toast-pad-y, 0.75rem) var(--ui-toast-pad-x, 1rem)",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-toast-fs, 0.9375rem)",
        "line-height": "1.4",
        "border-radius": "var(--ui-radius)",
        border: "1px solid var(--ui-toast-edge)",
        "background-color": "var(--ui-c)",
        /* the toast's text colour as a variable, so controls inside it (a
           dismiss button) can follow it on any fill */
        "--ui-toast-fg": "var(--ui-on-c)",
        color: "var(--ui-toast-fg)",
        /* the 1px edge keeps the card visible on dark surfaces, where a
           shadow does not */
        "box-shadow": "var(--ui-toast-shadow, 0 10px 24px -10px rgb(0 0 0 / 0.35))",
        "pointer-events": "auto",
        opacity: "1",
        transform: "none",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        "&[hidden]": { display: "none" },
        /* a button inside (typically a ghost dismiss) takes the toast's text
           colour for its label, hover tint and focus ring, so it stays legible
           and focusable on a solid fill */
        "& .ui-button": {
          "--ui-c-text": "var(--ui-toast-fg)",
          "--ui-c-soft": "color-mix(in oklab, var(--ui-toast-fg) 16%, transparent)",
          "--ui-c-soft-fg": "var(--ui-toast-fg)",
        },
        /* set explicitly as well: an adapter may paint its ghost button's
           colour directly instead of through the variables */
        "& .ui-button.ui-ghost, & .ui-button.ui-ghost:hover": {
          color: "var(--ui-toast-fg)",
        },
        "& .ui-button.ui-ghost:hover": {
          "background-color": "color-mix(in oklab, var(--ui-toast-fg) 16%, transparent)",
        },
        "& .ui-button:focus-visible": { "outline-color": "var(--ui-toast-fg)" },
        /* enter: fade and rise in when the node is inserted */
        "@starting-style": { opacity: "0", transform: "translateY(0.5rem)" },
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      intents: intentMap(() => ({ "--ui-toast-edge": "var(--ui-c-border, var(--ui-c))" })),
      styles: {
        /* tinted fill; the edge is a faint accent */
        soft: {
          "background-color": "var(--ui-c-soft)",
          "--ui-toast-fg": "var(--ui-c-soft-fg)",
          "border-color": "color-mix(in oklab, var(--ui-c-border, var(--ui-c)) 28%, transparent)",
        },
        /* surface fill with an accent edge */
        outline: {
          "background-color": "var(--ui-surface)",
          "--ui-toast-fg": "var(--ui-surface-fg)",
          "border-color": "var(--ui-c-border, var(--ui-c))",
        },
      },
      sizes: {
        sm: { "--ui-toast-fs": "0.8125rem", "--ui-toast-pad-y": "0.5rem", "--ui-toast-pad-x": "0.75rem" },
        lg: { "--ui-toast-fs": "1.0625rem", "--ui-toast-pad-y": "1rem", "--ui-toast-pad-x": "1.25rem" },
      },
      states: {
        /* e.g. "uploading" */
        loading: { animation: "ui-pulse 1.2s ease-in-out infinite" },
      },
    },
    /* ui-dropdown / ui-menu / ui-menu-item: CSS for the floating panel, its
       placement and the item states. Uniskin ships no JavaScript: the roving
       focus, typeahead, Escape-and-return-focus and click-outside dismissal of
       a real menu button are the consumer's (or a headless library's). The
       panel opens on [open] (a <details>), aria-expanded="true" on the
       trigger, ui-active on the dropdown, or :popover-open on the menu. */
    dropdown: {
      base: {
        position: "relative",
        display: "inline-block",
        "& > .ui-menu": {
          position: "absolute",
          "z-index": "var(--ui-menu-z, 50)",
          "inset-block-start": "calc(100% + var(--ui-menu-gap, 0.25rem))",
          "inset-inline-start": "0",
          visibility: "hidden",
          opacity: "0",
          /* closing fades, then hides; opening shows at once (below), so a
             script can focus the first item in the same tick */
          transition: "opacity 0.12s ease, visibility 0s linear 0.12s",
        },
        /* placement: a vertical side then a horizontal one */
        '&[data-placement^="top"] > .ui-menu': {
          "inset-block-start": "auto",
          "inset-block-end": "calc(100% + var(--ui-menu-gap, 0.25rem))",
        },
        '&[data-placement$="end"] > .ui-menu': {
          "inset-inline-start": "auto",
          "inset-inline-end": "0",
        },
        "&[open] > .ui-menu, &.ui-active > .ui-menu, &:has(> [aria-expanded=\"true\"]) > .ui-menu, & > .ui-menu:popover-open": {
          visibility: "visible",
          opacity: "1",
          transition: "opacity 0.12s ease, visibility 0s",
        },
        "@media (prefers-reduced-motion: reduce)": { "& > .ui-menu": { transition: "none" } },
        /* a <summary> trigger: drop the disclosure marker */
        "& > summary": { "list-style": "none", cursor: "pointer" },
        "& > summary::-webkit-details-marker": { display: "none" },
      },
    },
    menu: {
      base: {
        "--ui-menu-fs": "0.9375rem",
        display: "flex",
        "flex-direction": "column",
        gap: "1px",
        "box-sizing": "border-box",
        "min-width": "var(--ui-menu-w, 10rem)",
        "max-height": "var(--ui-menu-max-h, 20rem)",
        "overflow-y": "auto",
        margin: "0",
        padding: "var(--ui-menu-pad, 0.25rem)",
        "list-style": "none",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-menu-fs)",
        color: "var(--ui-surface-fg)",
        "background-color": "var(--ui-surface)",
        /* the border keeps the panel visible on dark surfaces, where a
           shadow does not */
        border: "1px solid var(--ui-border)",
        "border-radius": "var(--ui-radius)",
        "box-shadow": "var(--ui-menu-shadow, 0 10px 24px -10px rgb(0 0 0 / 0.35))",
        "&[hidden]": { display: "none" },
      },
      styles: {
        /* no border, fill or shadow: a plain list, for sidebars */
        ghost: {
          "background-color": "transparent",
          "border-color": "transparent",
          "box-shadow": "none",
        },
        /* muted fill */
        soft: { "background-color": "var(--ui-neutral-soft)" },
      },
      sizes: {
        sm: { "--ui-menu-fs": "0.8125rem", "--ui-menu-item-py": "0.25rem", "--ui-menu-item-px": "0.5rem" },
        lg: { "--ui-menu-fs": "1.0625rem", "--ui-menu-item-py": "0.5rem", "--ui-menu-item-px": "0.75rem" },
      },
    },
    "menu-item": {
      base: {
        "--ui-c-text": "var(--ui-surface-fg)",
        appearance: "none",
        display: "flex",
        "align-items": "center",
        gap: "0.5rem",
        "box-sizing": "border-box",
        width: "100%",
        margin: "0",
        padding: "var(--ui-menu-item-py, 0.375rem) var(--ui-menu-item-px, 0.625rem)",
        "font-family": "inherit",
        "font-size": "var(--ui-menu-fs, 0.9375rem)",
        "line-height": "1.3",
        "text-align": "start",
        "text-decoration": "none",
        color: "var(--ui-c-text)",
        "background-color": "transparent",
        border: "0",
        "border-radius": "calc(var(--ui-radius) * 0.75)",
        cursor: "pointer",
        transition: transition(["background-color", "color"]),
        /* :hover, keyboard focus and the headless library's highlight */
        "&:hover, &:focus-visible, &[data-highlighted]": {
          "background-color": "var(--ui-menu-item-hover-bg, color-mix(in oklab, var(--ui-c-text) 9%, transparent))",
          color: "var(--ui-menu-item-hover-fg, var(--ui-c-text))",
        },
        "&:focus-visible": { outline: "2px solid var(--ui-ring)", "outline-offset": "-2px" },
        /* a checked menuitemcheckbox / menuitemradio shows a trailing check;
           the empty alt text keeps it out of the accessible name */
        '&[aria-checked="true"]::after': {
          content: '"\\2713" / ""',
          "margin-inline-start": "auto",
        },
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      intents,
      sizes: {
        sm: { "--ui-menu-fs": "0.8125rem", "--ui-menu-item-py": "0.25rem", "--ui-menu-item-px": "0.5rem" },
        lg: { "--ui-menu-fs": "1.0625rem", "--ui-menu-item-py": "0.5rem", "--ui-menu-item-px": "0.75rem" },
      },
      states: {
        disabled: { opacity: "0.45", cursor: "not-allowed", "pointer-events": "none" },
        /* the current item */
        active: {
          "background-color": "color-mix(in oklab, var(--ui-c-text) 14%, transparent)",
          "font-weight": "600",
        },
      },
    },
    "menu-label": {
      base: {
        padding: "var(--ui-menu-item-py, 0.375rem) var(--ui-menu-item-px, 0.625rem)",
        "font-size": "0.75em",
        "font-weight": "600",
        "letter-spacing": "0.02em",
        color: "color-mix(in oklab, var(--ui-surface-fg) 68%, transparent)",
        cursor: "default",
      },
    },
    "menu-separator": {
      base: {
        height: "1px",
        margin: "0.25rem 0",
        padding: "0",
        border: "0",
        "background-color": "var(--ui-border)",
        "align-self": "stretch",
      },
    },
    /* ui-avatar: a circle holding initials, an icon or an <img>. The label
       or alt text is the consumer's. */
    avatar: {
      base: {
        "--ui-c": "var(--ui-neutral)",
        "--ui-on-c": "var(--ui-neutral-fg)",
        "--ui-c-text": "var(--ui-surface-fg)",
        "--ui-c-soft": "var(--ui-neutral-soft)",
        "--ui-c-soft-fg": "var(--ui-neutral-soft-fg)",
        "--ui-avatar-size": "2.5rem",
        display: "inline-flex",
        "align-items": "center",
        "justify-content": "center",
        "flex-shrink": "0",
        "box-sizing": "border-box",
        width: "var(--ui-avatar-size)",
        height: "var(--ui-avatar-size)",
        overflow: "hidden",
        "border-radius": "9999px",
        border: "1px solid transparent",
        "font-family": "var(--ui-font-sans)",
        "font-size": "calc(var(--ui-avatar-size) * 0.4)",
        "font-weight": "600",
        "line-height": "1",
        "text-transform": "uppercase",
        "user-select": "none",
        "background-color": "var(--ui-avatar-bg, var(--ui-c))",
        color: "var(--ui-avatar-fg, var(--ui-on-c))",
        "& > img": { width: "100%", height: "100%", "object-fit": "cover", display: "block" },
      },
      intents,
      styles: {
        soft: {
          "background-color": "var(--ui-avatar-bg, var(--ui-c-soft))",
          color: "var(--ui-avatar-fg, var(--ui-c-soft-fg))",
        },
        outline: {
          "background-color": "transparent",
          color: "var(--ui-c-text)",
          "border-color": "var(--ui-c-border, var(--ui-c))",
        },
      },
      sizes: {
        sm: { "--ui-avatar-size": "1.75rem" },
        lg: { "--ui-avatar-size": "3.5rem" },
      },
    },
    /* ui-skeleton: a placeholder block while content loads. Mark it
       aria-hidden and put aria-busy on the region that is loading. */
    skeleton: {
      base: {
        display: "block",
        "box-sizing": "border-box",
        width: "var(--ui-skeleton-w, 100%)",
        height: "var(--ui-skeleton-h, 1rem)",
        "border-radius": "calc(var(--ui-radius) * 0.75)",
        "background-color": "var(--ui-skeleton-bg, color-mix(in oklab, var(--ui-surface-fg) 12%, transparent))",
        animation: "ui-pulse 1.5s ease-in-out infinite",
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      },
    },
    /* ui-separator: a 1px rule, horizontal by default; vertical with
       aria-orientation="vertical" (or data-orientation="vertical") */
    separator: {
      base: {
        display: "block",
        "box-sizing": "border-box",
        width: "100%",
        height: "1px",
        margin: "var(--ui-separator-gap, 1rem) 0",
        padding: "0",
        border: "0",
        "flex-shrink": "0",
        "background-color": "var(--ui-separator-color, var(--ui-border))",
        '&[aria-orientation="vertical"], &[data-orientation="vertical"]': {
          display: "inline-block",
          width: "1px",
          height: "auto",
          "align-self": "stretch",
          "min-height": "1em",
          margin: "0 var(--ui-separator-gap, 1rem)",
        },
      },
    },
    /* ui-breadcrumb: put it on the <ol> inside <nav aria-label="Breadcrumb">.
       The separators are decorative generated content with empty alt text. */
    breadcrumb: {
      base: {
        "--ui-breadcrumb-fs": "0.9375rem",
        display: "flex",
        "flex-wrap": "wrap",
        "align-items": "center",
        gap: "0.25rem 0.5rem",
        margin: "0",
        padding: "0",
        "list-style": "none",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-breadcrumb-fs)",
        "line-height": "1.4",
        color: "color-mix(in oklab, var(--ui-surface-fg) 68%, transparent)",
        "& > li": { display: "inline-flex", "align-items": "center", gap: "0.5rem" },
        '& > li + li::before': {
          content: '"/" / ""',
          color: "var(--ui-breadcrumb-sep, color-mix(in oklab, var(--ui-surface-fg) 45%, transparent))",
        },
        "& a": {
          color: "inherit",
          "text-decoration": "none",
          "border-radius": "calc(var(--ui-radius) * 0.5)",
          "&:hover": { color: "var(--ui-surface-fg)", "text-decoration": "underline" },
          "&:focus-visible": { outline: "2px solid var(--ui-ring)", "outline-offset": "2px" },
        },
        '& [aria-current="page"]': { color: "var(--ui-surface-fg)", "font-weight": "600" },
      },
      sizes: {
        sm: { "--ui-breadcrumb-fs": "0.8125rem" },
        lg: { "--ui-breadcrumb-fs": "1.0625rem" },
      },
    },
    /* ui-pagination / ui-pagination-item: page links. Put the intent on the
       <ul>; the current page is aria-current="page" (or ui-active). */
    pagination: {
      base: {
        "--ui-c": "var(--ui-neutral)",
        "--ui-on-c": "var(--ui-neutral-fg)",
        "--ui-c-text": "var(--ui-surface-fg)",
        "--ui-pagination-size": "2.25rem",
        "--ui-pagination-fs": "0.9375rem",
        display: "flex",
        "flex-wrap": "wrap",
        "align-items": "center",
        gap: "0.25rem",
        margin: "0",
        padding: "0",
        "list-style": "none",
      },
      intents,
      sizes: {
        sm: { "--ui-pagination-size": "1.75rem", "--ui-pagination-fs": "0.8125rem" },
        lg: { "--ui-pagination-size": "2.75rem", "--ui-pagination-fs": "1.0625rem" },
      },
    },
    "pagination-item": {
      base: {
        appearance: "none",
        display: "inline-flex",
        "align-items": "center",
        "justify-content": "center",
        "box-sizing": "border-box",
        "min-width": "var(--ui-pagination-size, 2.25rem)",
        height: "var(--ui-pagination-size, 2.25rem)",
        margin: "0",
        padding: "0 0.5rem",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-pagination-fs, 0.9375rem)",
        "font-weight": "500",
        "line-height": "1",
        "text-decoration": "none",
        color: "var(--ui-surface-fg)",
        "background-color": "transparent",
        border: "1px solid var(--ui-border)",
        "border-radius": "var(--ui-radius)",
        cursor: "pointer",
        transition: transition(["background-color", "color", "border-color"]),
        "&:hover": { "background-color": "color-mix(in oklab, var(--ui-surface-fg) 8%, transparent)" },
        "&:focus-visible": { outline: "2px solid var(--ui-ring)", "outline-offset": "2px" },
        /* the current page: filled with the pagination's colour */
        '&[aria-current="page"], &[aria-current="page"]:hover': {
          "background-color": "var(--ui-c)",
          color: "var(--ui-on-c)",
          "border-color": "var(--ui-c)",
        },
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        disabled: { opacity: "0.45", cursor: "not-allowed", "pointer-events": "none" },
        active: {
          "background-color": "var(--ui-c)",
          color: "var(--ui-on-c)",
          "border-color": "var(--ui-c)",
          "&:hover": { "background-color": "var(--ui-c)" },
        },
      },
    },
    modal: {
      base: {
        /* works as a <div>, a <dialog> (open / showModal) or a :target */
        position: "fixed",
        inset: "0",
        "z-index": "1000",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "box-sizing": "border-box",
        width: "100%",
        height: "100%",
        "max-width": "none",
        "max-height": "none",
        margin: "0",
        padding: "1rem",
        border: "0",
        "background-color": "var(--ui-overlay, rgb(0 0 0 / 0.5))",
        visibility: "hidden",
        opacity: "0",
        "pointer-events": "none",
        transition: "opacity 0.2s ease, visibility 0s linear 0.2s",
        "&[open], &:target": {
          visibility: "visible",
          opacity: "1",
          "pointer-events": "auto",
          "transition-delay": "0s",
        },
        "&::backdrop": { background: "transparent" },
        /* drawer: data-placement="start|end|top|bottom" docks the box to an
           edge and slides it in. Not a new class: it is a placement of the
           modal, like the tooltip's and the toast region's. */
        '&[data-placement="start"], &[data-placement="end"]': {
          padding: "0",
          "align-items": "stretch",
          "justify-content": "flex-start",
        },
        '&[data-placement="end"]': { "justify-content": "flex-end" },
        '&[data-placement="top"], &[data-placement="bottom"]': {
          padding: "0",
          "justify-content": "stretch",
          "align-items": "flex-start",
        },
        '&[data-placement="bottom"]': { "align-items": "flex-end" },
        '&[data-placement] > .ui-modal-box': {
          "max-height": "none",
          "border-radius": "0",
          transition: "transform 0.25s ease",
        },
        '&[data-placement="start"] > .ui-modal-box, &[data-placement="end"] > .ui-modal-box': {
          width: "min(var(--ui-modal-w, 24rem), 100%)",
          height: "100%",
        },
        '&[data-placement="top"] > .ui-modal-box, &[data-placement="bottom"] > .ui-modal-box': {
          width: "100%",
          height: "auto",
          "max-height": "var(--ui-drawer-h, 80%)",
        },
        '&[data-placement="start"] > .ui-modal-box': { transform: "translateX(-100%)" },
        '&[data-placement="end"] > .ui-modal-box': { transform: "translateX(100%)" },
        '&[data-placement="start"]:dir(rtl) > .ui-modal-box': { transform: "translateX(100%)" },
        '&[data-placement="end"]:dir(rtl) > .ui-modal-box': { transform: "translateX(-100%)" },
        '&[data-placement="top"] > .ui-modal-box': { transform: "translateY(-100%)" },
        '&[data-placement="bottom"] > .ui-modal-box': { transform: "translateY(100%)" },
        "&[data-placement][open] > .ui-modal-box, &[data-placement]:target > .ui-modal-box, &[data-placement].ui-active > .ui-modal-box":
          { transform: "none" },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&[data-placement] > .ui-modal-box": { transition: "none" },
        },
      },
      styles: {
        ghost: { "background-color": "transparent" },
        soft: {
          "background-color": "var(--ui-overlay-soft, rgb(255 255 255 / 0.6))",
          "backdrop-filter": "blur(6px)",
        },
      },
      sizes: {
        sm: { "--ui-modal-w": "24rem" },
        lg: { "--ui-modal-w": "48rem" },
      },
      states: {
        active: {
          visibility: "visible",
          opacity: "1",
          "pointer-events": "auto",
          "transition-delay": "0s",
        },
      },
    },

    "modal-box": {
      base: {
        ...neutralVars,
        "box-sizing": "border-box",
        width: "min(var(--ui-modal-w, 32rem), 100%)",
        "max-height": "100%",
        overflow: "auto",
        padding: "1.5rem",
        "font-family": "var(--ui-font-sans)",
        "font-size": "var(--ui-text-md)",
        color: "var(--ui-surface-fg)",
        "background-color": "var(--ui-surface)",
        "border-radius": "calc(var(--ui-radius) * 1.5)",
        "border-top": "3px solid transparent",
        "box-shadow": "0 20px 40px -8px rgb(0 0 0 / 0.3), 0 4px 10px rgb(0 0 0 / 0.1)",
      },
      intents: intentMap((i) => ({ "border-top-color": `var(--ui-${i})` })),
      sizes: {
        sm: { padding: "1rem", "font-size": "var(--ui-text-sm)" },
        lg: { padding: "2rem", "font-size": "var(--ui-text-lg)" },
      },
    },

    tabs: {
      base: {
        ...neutralVars,
        display: "flex",
        "flex-wrap": "wrap",
        gap: "0.25rem",
        "font-family": "var(--ui-font-sans)",
        "border-bottom": "1px solid var(--ui-border)",
      },
      intents,
      styles: {
        /* boxed active tab */
        outline: {
          "--ui-tab-active-line": "transparent",
          "--ui-tab-active-shadow": "inset 0 0 0 1px var(--ui-c)",
          "--ui-tab-radius": "var(--ui-radius)",
          "border-bottom-color": "transparent",
        },
        /* bare text, color only */
        ghost: {
          "--ui-tab-active-line": "transparent",
          "--ui-tab-hover-bg": "var(--ui-surface-muted)",
          "--ui-tab-radius": "var(--ui-radius)",
          "border-bottom-color": "transparent",
        },
        /* pill with tinted background */
        soft: {
          "--ui-tab-active-line": "transparent",
          "--ui-tab-active-bg": "var(--ui-c-soft)",
          "--ui-tab-active-fg": "var(--ui-c-soft-fg)",
          "--ui-tab-hover-bg": "var(--ui-surface-muted)",
          "--ui-tab-radius": "var(--ui-radius)",
          "border-bottom-color": "transparent",
        },
      },
      sizes: {
        sm: { "--ui-tab-fs": "var(--ui-text-sm)", "--ui-tab-px": "0.75rem", "--ui-tab-py": "0.375rem" },
        lg: { "--ui-tab-fs": "var(--ui-text-lg)", "--ui-tab-px": "1.25rem", "--ui-tab-py": "0.75rem" },
      },
    },

    tab: {
      base: {
        appearance: "none",
        margin: "0 0 -1px",
        padding: "var(--ui-tab-py, 0.5rem) var(--ui-tab-px, 1rem)",
        "font-family": "inherit",
        "font-size": "var(--ui-tab-fs, var(--ui-text-md))",
        "font-weight": "500",
        "line-height": "1.25",
        color: "color-mix(in oklab, var(--ui-surface-fg) 62%, transparent)",
        "background-color": "transparent",
        border: "0",
        "border-bottom": "2px solid transparent",
        "border-radius": "var(--ui-tab-radius, 0)",
        cursor: "pointer",
        "white-space": "nowrap",
        transition: transition(["color", "background-color", "border-color", "box-shadow"]),
        "&:hover": {
          color: "var(--ui-surface-fg)",
          "background-color": "var(--ui-tab-hover-bg, transparent)",
        },
        "&:focus-visible": { ...focusRing, "outline-offset": "-2px" },
      },
      intents,
      sizes: {
        sm: { "font-size": "var(--ui-text-sm)", padding: "0.375rem 0.75rem" },
        lg: { "font-size": "var(--ui-text-lg)", padding: "0.75rem 1.25rem" },
      },
      states: {
        disabled: { opacity: "0.45", cursor: "not-allowed", "pointer-events": "none" },
        loading: { cursor: "progress", animation: "ui-pulse 1.2s ease-in-out infinite" },
        active: {
          color: "var(--ui-tab-active-fg, var(--ui-c-text, var(--ui-surface-fg)))",
          "background-color": "var(--ui-tab-active-bg, transparent)",
          "border-bottom-color": "var(--ui-tab-active-line, var(--ui-c, var(--ui-surface-fg)))",
          "box-shadow": "var(--ui-tab-active-shadow, none)",
          "&:hover": {
            color: "var(--ui-tab-active-fg, var(--ui-c-text, var(--ui-surface-fg)))",
            "background-color": "var(--ui-tab-active-bg, transparent)",
          },
        },
      },
    },
  },
});

/**
 * Base-layer keyframes that can't live inside a component rule.
 * Emitted as `@keyframes <prefix>-<name>`; `animation:` values in this
 * theme reference them as `ui-<name>` and are re-prefixed in buildRules.
 */
export const defaultKeyframes: Record<string, CssRuleObject> = {
  spin: { to: { transform: "rotate(360deg)" } },
  pulse: { "50%": { opacity: "0.55" } },
  "progress-slide": {
    from: { "background-position": "0% 0" },
    to: { "background-position": "100% 0" },
  },
  "accordion-reveal": {
    from: { opacity: "0", transform: "translateY(-0.25rem)" },
    to: { opacity: "1", transform: "none" },
  },
};
