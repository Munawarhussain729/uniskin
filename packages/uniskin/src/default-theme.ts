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

/** The five per-element variables an intent sets (see composition model). */
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
};

const fieldIntents = intentMap((i) => ({ "--ui-field-c": `var(--ui-${i})` }));

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
      intents,
      styles: {
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
        "&:checked, &:indeterminate": {
          "background-color": "var(--ui-c)",
          "border-color": "var(--ui-c)",
        },
        "&:checked::after": {
          transform: "translateY(-8%) rotate(45deg) scale(1)",
        },
        "&:indeterminate::after": {
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
          "--ui-check-mark": "var(--ui-c)",
          "border-color": "var(--ui-c)",
          "&:checked, &:indeterminate": { "background-color": "transparent" },
        },
        ghost: {
          "--ui-check-mark": "var(--ui-c-soft-fg)",
          "background-color": "var(--ui-surface-muted)",
          "border-color": "transparent",
          "&:checked, &:indeterminate": {
            "background-color": "var(--ui-c-soft)",
            "border-color": "transparent",
          },
        },
        soft: {
          "--ui-check-mark": "var(--ui-c-soft-fg)",
          "&:checked, &:indeterminate": {
            "background-color": "var(--ui-c-soft)",
            "border-color": "var(--ui-c)",
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
        outline: { "box-shadow": "none", "border-color": "var(--ui-c)" },
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
        border: "1px solid var(--ui-c)",
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
        border: "1px solid var(--ui-c)",
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
        "background-color": "rgb(0 0 0 / 0.5)",
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
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      styles: {
        ghost: { "background-color": "transparent" },
        soft: {
          "background-color": "rgb(255 255 255 / 0.6)",
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
};
