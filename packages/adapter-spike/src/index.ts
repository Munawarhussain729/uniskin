import { INTENTS, defineAdapter, type CssRuleObject, type Intent } from "uniskin/adapter";

/* ------------------------------------------------------------------ *
 * Radix-Themes-like skin for Uniskin — a vocabulary spike, not a product.
 *
 * Radix Themes styles every component from a 12-step colour scale per
 * hue instead of "one accent + derived tints":
 *   1–2 app/subtle backgrounds · 3–5 component bg (rest/hover/active)
 *   6–8 borders · 9–10 solid fills · 11–12 text (low/high contrast)
 *
 * The adapter is executable JS, so the scales are generated once and the
 * component slots only ever reference scale steps — nothing is derived
 * with color-mix(). Values below approximate Radix Colors; a real port
 * would generate them from @radix-ui/colors.
 *
 * Slots written as {} intentionally inherit the merged-in default rule —
 * they exist so the dev coverage warning counts them as defined.
 * ------------------------------------------------------------------ */

type Scale = [string, string, string, string, string, string, string, string, string, string, string, string];

const SCALES: Record<string, { light: Scale; dark: Scale }> = {
  gray: {
    light: ["#fcfcfd", "#f9f9fb", "#f0f0f3", "#e8e8ec", "#e0e1e6", "#d9d9e0", "#cdced6", "#b9bbc6", "#8b8d98", "#80838d", "#60646c", "#1e1f24"],
    dark:  ["#111113", "#19191b", "#222325", "#292a2e", "#303136", "#393a40", "#46484f", "#5f606a", "#6c6e79", "#797b86", "#b2b3bd", "#eeeef0"],
  },
  indigo: {
    light: ["#fdfdfe", "#f7f9ff", "#edf2fe", "#e1e9ff", "#d2deff", "#c1d0ff", "#abbdf9", "#8da4ef", "#3e63dd", "#3358d4", "#3a5bc7", "#1f2d5c"],
    dark:  ["#11131f", "#141726", "#182449", "#1d2e62", "#223974", "#2a448a", "#3a569f", "#4861b8", "#3e63dd", "#5472e9", "#9eb1ff", "#d6e1ff"],
  },
  plum: {
    light: ["#fefcff", "#fdf7fd", "#fbebf8", "#f7def5", "#f2d1f0", "#e9c2e9", "#dcafdd", "#cf91d2", "#ab4aba", "#a03eae", "#953ea3", "#53195d"],
    dark:  ["#181119", "#201320", "#351a35", "#451f45", "#512454", "#5e3067", "#70407a", "#885095", "#ab4aba", "#b95cc4", "#e796f5", "#f4d4f4"],
  },
  green: {
    light: ["#fbfefc", "#f4fbf6", "#e6f6eb", "#d6f1df", "#c4e9d1", "#adddc0", "#8fcea8", "#5bb98a", "#30a46c", "#2b9a66", "#218358", "#193b2d"],
    dark:  ["#0e1512", "#121c17", "#15372a", "#1a4836", "#1f5641", "#24684e", "#297b5b", "#2f9069", "#30a46c", "#33b074", "#55d39a", "#c2f0d5"],
  },
  amber: {
    light: ["#fefdfb", "#fef9e7", "#fff3cf", "#ffeab3", "#ffdd8a", "#f5ce74", "#eebc5f", "#f3a83f", "#ffc53d", "#ffba18", "#ab6400", "#4f3422"],
    dark:  ["#16120c", "#1d180f", "#302008", "#3f2905", "#4e3510", "#5f430b", "#725212", "#8a6522", "#f1a10d", "#ffba18", "#ffcb47", "#f5e0b8"],
  },
  red: {
    light: ["#fffcfc", "#fff7f7", "#feebec", "#ffdbdc", "#ffcdce", "#fdbdbe", "#f4a9aa", "#eb8e90", "#e5484d", "#dc3e42", "#cd2b31", "#641723"],
    dark:  ["#191111", "#201314", "#3b1219", "#500f1c", "#611623", "#72232d", "#8c3339", "#b54548", "#e5484d", "#ec5d5e", "#ff9592", "#fbd3d8"],
  },
};

/** Step-9 fills need a contrasting foreground; amber is the odd one out. */
const CONTRAST: Record<string, string> = {
  gray: "#ffffff",
  indigo: "#ffffff",
  plum: "#ffffff",
  green: "#ffffff",
  amber: "#21201c",
  red: "#ffffff",
};

const HUE: Record<Intent, keyof typeof SCALES> = {
  primary: "indigo",
  secondary: "plum",
  success: "green",
  warning: "amber",
  danger: "red",
};

/** Emit `--rt-<hue>-1..12` + `--rt-<hue>-contrast` for one mode. */
function scaleTokens(mode: "light" | "dark"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, scale] of Object.entries(SCALES)) {
    scale[mode].forEach((v, i) => (out[`--rt-${name}-${i + 1}`] = v));
    out[`--rt-${name}-contrast`] = CONTRAST[name];
  }
  return out;
}

/**
 * The full per-element variable set an intent paints. Beyond the default
 * theme's five vars this adds three hooks the spike's style slots consume:
 * `--ui-c-hover` (step 10), `--ui-c-soft-hover` (step 4) and
 * `--ui-c-border` (step 8). Root tokens below carry the neutral
 * equivalents, so intents are the only place these change per hue.
 */
const intentVars = (i: Intent): CssRuleObject => {
  const h = HUE[i];
  return {
    "--ui-c": `var(--rt-${h}-9)`,
    "--ui-c-text": `var(--rt-${h}-11)`,
    "--ui-on-c": `var(--rt-${h}-contrast)`,
    "--ui-c-hover": `var(--rt-${h}-10)`,
    "--ui-c-soft": `var(--rt-${h}-3)`,
    "--ui-c-soft-hover": `var(--rt-${h}-4)`,
    "--ui-c-soft-fg": `var(--rt-${h}-11)`,
    "--ui-c-border": `var(--rt-${h}-8)`,
  };
};

const intents = (extra?: (i: Intent) => CssRuleObject): Record<Intent, CssRuleObject> =>
  Object.fromEntries(
    INTENTS.map((i) => [i, { ...intentVars(i), ...extra?.(i) }]),
  ) as Record<Intent, CssRuleObject>;

/** Neutral (no intent) vars for component bases that need the full set. */
const neutralVars: CssRuleObject = {
  "--ui-c": "var(--rt-gray-12)",
  "--ui-c-text": "var(--rt-gray-11)",
  "--ui-on-c": "var(--rt-gray-1)",
  "--ui-c-hover": "var(--rt-gray-11)",
  "--ui-c-soft": "var(--rt-gray-3)",
  "--ui-c-soft-hover": "var(--rt-gray-4)",
  "--ui-c-soft-fg": "var(--rt-gray-11)",
  "--ui-c-border": "var(--rt-gray-7)",
};

/** Aliases uniskin reads (`--ui-*`) onto scale steps — repeated under the
 *  dark scope so they re-resolve against the dark scales. */
const uiMap: Record<string, string> = {
  "--ui-neutral": "var(--rt-gray-12)",
  "--ui-neutral-fg": "var(--rt-gray-1)",
  "--ui-neutral-soft": "var(--rt-gray-3)",
  "--ui-neutral-soft-fg": "var(--rt-gray-11)",
  "--ui-surface": "var(--rt-gray-1)",
  "--ui-surface-fg": "var(--rt-gray-12)",
  "--ui-surface-muted": "var(--rt-gray-3)",
  "--ui-border": "var(--rt-gray-7)",
  "--ui-ring": "var(--rt-indigo-8)",
  /* neutral fallbacks for the spike's extra element vars */
  "--ui-c-soft-hover": "var(--rt-gray-4)",
  "--ui-c-border": "var(--rt-gray-7)",
};
for (const i of INTENTS) {
  const h = HUE[i];
  uiMap[`--ui-${i}`] = `var(--rt-${h}-9)`;
  uiMap[`--ui-${i}-fg`] = `var(--rt-${h}-contrast)`;
  uiMap[`--ui-${i}-text`] = `var(--rt-${h}-11)`;
  uiMap[`--ui-${i}-soft`] = `var(--rt-${h}-3)`;
  uiMap[`--ui-${i}-soft-fg`] = `var(--rt-${h}-11)`;
}

/* Radix Themes size-2 field: 32px surface box, gray-7 border → gray-8 on
   hover, accent border + soft ring on focus. */
const field: CssRuleObject = {
  "--ui-c": "var(--rt-indigo-9)",
  "--ui-c-text": "var(--rt-indigo-11)",
  "background-color": "var(--rt-gray-2)",
  border: "1px solid var(--ui-field-c, var(--rt-gray-7))",
  "border-radius": "var(--ui-radius)",
  "&:hover": { "border-color": "var(--ui-field-c, var(--rt-gray-8))" },
  "&:focus-visible": {
    "border-color": "var(--ui-c)",
    outline: "none",
    "box-shadow": "0 0 0 3px color-mix(in oklab, var(--ui-c) 35%, transparent)",
  },
};
const fieldHeights = {
  base: { height: "2rem" },
  sizes: {
    sm: { height: "1.5rem", "font-size": "0.75rem", padding: "0 0.5rem" },
    lg: { height: "2.5rem", "font-size": "0.9375rem", padding: "0 1rem" },
  },
};
/* Intent fields: border follows the hue's step-8 (Radix "invalid" look). */
const fieldIntents = intents((i) => ({ "--ui-field-c": `var(--rt-${HUE[i]}-8)` }));
/* Radix "soft" fields: filled step-3, no border, keep it on hover. */
const fieldSoft: CssRuleObject = {
  "background-color": "var(--rt-gray-3)",
  "border-color": "transparent",
  "&:hover": { "border-color": "transparent" },
};
const fieldDisabled: CssRuleObject = {
  opacity: "1",
  color: "var(--rt-gray-9)",
  "background-color": "var(--rt-gray-3)",
  "border-color": "var(--rt-gray-6)",
};

/* Radix Callout is "soft" by design — the spike repaints alert's base to
   soft and treats ui-outline as the "surface" variant (bg 1, border 7). */
const alertBase: CssRuleObject = {
  "background-color": "var(--ui-c-soft)",
  color: "var(--ui-c-soft-fg)",
  "border-color": "transparent",
};

export default defineAdapter({
  name: "spike",
  tokens: {
    ...scaleTokens("light"),
    ...uiMap,
    "--rt-overlay": "rgb(0 0 0 / 0.45)",
    "--rt-overlay-soft": "rgb(255 255 255 / 0.7)",
    "--ui-radius": "0.375rem", // Radix "medium" radius ≈ 6px
    "--ui-text-sm": "0.75rem",
    "--ui-text-md": "0.875rem",
    "--ui-text-lg": "0.9375rem",
  },
  darkTokens: {
    ...scaleTokens("dark"),
    ...uiMap, // aliases re-resolve against the dark scales
    "--rt-overlay": "rgb(0 0 0 / 0.6)",
    "--rt-overlay-soft": "rgb(0 0 0 / 0.5)",
  },
  components: {
    button: {
      base: {
        ...neutralVars,
        height: "2rem",
        padding: "0 0.75rem",
        "font-weight": "500",
        transition:
          "background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease",
        "&:focus-visible": {
          outline: "2px solid var(--ui-ring)",
          "outline-offset": "1px",
        },
      },
      intents: intents(),
      styles: {
        /* Radix "outline": step-8 border, fills step-3 on hover (never the
           solid step-9 the default theme jumps to). */
        outline: {
          "background-color": "transparent",
          color: "var(--ui-c-text)",
          "border-color": "var(--ui-c-border)",
          "&:hover": {
            "background-color": "var(--ui-c-soft)",
            "border-color": "var(--ui-c-border)",
            color: "var(--ui-c-soft-fg)",
          },
        },
        ghost: {
          "background-color": "transparent",
          "border-color": "transparent",
          color: "var(--ui-c-text)",
          "&:hover": { "background-color": "var(--ui-c-soft)", color: "var(--ui-c-soft-fg)" },
        },
        /* Radix "soft": step-3 bg / step-11 text, hover only deepens to
           step-4 — solid fill on hover is the default theme's habit. */
        soft: {
          "background-color": "var(--ui-c-soft)",
          "border-color": "transparent",
          color: "var(--ui-c-soft-fg)",
          "&:hover": {
            "background-color": "var(--ui-c-soft-hover)",
            "border-color": "transparent",
            color: "var(--ui-c-soft-fg)",
          },
        },
      },
      sizes: {
        sm: { height: "1.5rem", padding: "0 0.5rem", "font-size": "0.75rem" },
        lg: { height: "2.5rem", padding: "0 1rem", "font-size": "0.9375rem" },
      },
      states: {
        /* Radix disabled flattens to a gray box regardless of variant. */
        disabled: {
          opacity: "1",
          "background-color": "var(--rt-gray-3)",
          "border-color": "transparent",
          color: "var(--rt-gray-8)",
        },
        loading: {},
        /* Radix has no pressed-inset idiom: keep it a shade deeper. */
        active: {
          "box-shadow": "inset 0 0 0 2px color-mix(in oklab, var(--ui-c) 45%, transparent)",
        },
      },
    },

    input: {
      base: { ...field, ...fieldHeights.base },
      intents: fieldIntents,
      styles: {
        outline: {},
        ghost: {},
        soft: fieldSoft,
      },
      sizes: fieldHeights.sizes,
      states: {
        disabled: fieldDisabled,
        loading: {},
        active: {},
      },
    },

    textarea: {
      base: { ...field },
      intents: fieldIntents,
      styles: {
        outline: {},
        ghost: {},
        soft: fieldSoft,
      },
      sizes: {
        sm: { "font-size": "0.75rem" },
        lg: { "font-size": "0.9375rem" },
      },
      states: {
        disabled: fieldDisabled,
        loading: {},
        active: {},
      },
    },

    select: {
      base: { ...field, ...fieldHeights.base },
      intents: fieldIntents,
      styles: {
        outline: {},
        ghost: {},
        soft: fieldSoft,
      },
      sizes: fieldHeights.sizes,
      states: {
        disabled: fieldDisabled,
        loading: {},
        active: {},
      },
    },

    checkbox: {
      base: {
        ...neutralVars,
        "--ui-check-size": "1.125rem",
        "background-color": "var(--rt-gray-1)",
        "border-color": "var(--rt-gray-8)",
        "border-radius": "calc(var(--ui-radius) * 0.5)",
      },
      intents: intents(),
      styles: {
        outline: {},
        ghost: {},
        soft: {},
      },
      sizes: {
        sm: { "--ui-check-size": "0.875rem" },
        lg: { "--ui-check-size": "1.375rem" },
      },
      states: {
        disabled: { opacity: "0.4", cursor: "not-allowed" },
        loading: {},
        active: {},
      },
    },

    card: {
      base: {
        "background-color": "var(--rt-gray-1)",
        "border-color": "var(--ui-card-border, var(--rt-gray-6))",
        "border-radius": "calc(var(--ui-radius) * 2)",
        "box-shadow": "0 1px 2px rgb(0 0 0 / 0.06)",
      },
      intents: intents((i) => ({ "--ui-card-border": `var(--rt-${HUE[i]}-7)` })),
      styles: {
        outline: { "box-shadow": "none", "border-color": "var(--ui-c-border)" },
        ghost: {},
        soft: {},
      },
      sizes: {
        sm: { "--ui-card-pad": "0.75rem" },
        lg: { "--ui-card-pad": "2rem" },
      },
      states: {
        disabled: {},
        loading: {},
        active: {},
      },
    },
    "card-header": {
      base: { "border-bottom-color": "var(--rt-gray-6)", "font-weight": "500" },
    },
    "card-body": { base: {} },
    "card-footer": {
      base: {
        "border-top-color": "var(--rt-gray-6)",
        "background-color": "var(--rt-gray-2)",
      },
    },

    badge: {
      /* Radix Badge is soft (step-3 bg / step-11 text) even in its default
         variant — the "solid" look of the default theme is repainted. */
      base: {
        ...neutralVars,
        "border-radius": "9999px",
        padding: "0.125rem 0.5rem",
        "font-weight": "500",
        "background-color": "var(--ui-c-soft)",
        "border-color": "transparent",
        color: "var(--ui-c-soft-fg)",
      },
      intents: intents(),
      styles: {
        outline: {
          "background-color": "transparent",
          "border-color": "var(--ui-c-border)",
          color: "var(--ui-c-text)",
        },
        ghost: {
          "background-color": "transparent",
          "border-color": "transparent",
          color: "var(--ui-c-text)",
        },
        soft: {},
      },
      sizes: {
        sm: { "font-size": "0.6875rem", padding: "0.0625rem 0.375rem" },
        lg: { "font-size": "0.8125rem", padding: "0.1875rem 0.625rem" },
      },
      states: {
        disabled: { opacity: "0.5" },
        loading: {},
        active: { "box-shadow": "inset 0 0 0 1px var(--ui-c-border)" },
      },
    },

    alert: {
      base: { ...neutralVars, ...alertBase },
      intents: intents(),
      styles: {
        /* Radix "surface" callout ≈ panel bg + step-7 border */
        outline: {
          "background-color": "var(--rt-gray-1)",
          "border-color": "var(--ui-c-border)",
          color: "var(--ui-c-soft-fg)",
        },
        ghost: {
          "background-color": "transparent",
          "border-color": "transparent",
          color: "var(--ui-c-text)",
        },
        soft: alertBase,
      },
      sizes: {
        sm: { "font-size": "0.75rem" },
        lg: { "font-size": "0.9375rem" },
      },
      states: {
        disabled: { opacity: "0.5" },
        loading: {},
        active: {},
      },
    },

    modal: {
      base: {
        "background-color": "var(--rt-overlay)",
      },
      styles: {
        ghost: { "background-color": "transparent" },
        soft: {
          "background-color": "var(--rt-overlay-soft)",
          "backdrop-filter": "blur(4px)",
        },
      },
      sizes: {
        /* Radix dialog widths come from its own scale, not rem widths. */
        sm: { "--ui-modal-w": "22rem" },
        lg: { "--ui-modal-w": "44rem" },
      },
      states: {
        active: {}, // inherit the show/hide mechanism, only the look differs
      },
    },

    "modal-box": {
      base: {
        "background-color": "var(--rt-gray-1)",
        "border-radius": "calc(var(--ui-radius) * 2)",
        "border-top-width": "4px",
        "box-shadow": "0 12px 32px -16px rgb(0 0 0 / 0.35), 0 4px 12px -8px rgb(0 0 0 / 0.2)",
      },
      intents: intents(),
      sizes: {
        sm: { padding: "1rem" },
        lg: { padding: "2rem" },
      },
    },

    tabs: {
      base: {
        ...neutralVars,
        "border-bottom": "0",
        "box-shadow": "inset 0 -1px 0 0 var(--rt-gray-6)",
        "--ui-tab-hover-bg": "var(--rt-gray-3)",
        /* Radix active tabs keep gray-12 text — the accent lives on the
           underline, not the label. */
        "--ui-tab-active-fg": "var(--rt-gray-12)",
        "--ui-tab-active-line": "var(--ui-c)",
      },
      intents: intents(),
      styles: {
        outline: {
          "--ui-tab-active-line": "transparent",
          "--ui-tab-active-shadow": "inset 0 0 0 1px var(--ui-c-border)",
          "--ui-tab-radius": "var(--ui-radius)",
        },
        ghost: {
          "--ui-tab-active-line": "transparent",
          "--ui-tab-radius": "var(--ui-radius)",
        },
        soft: {
          "--ui-tab-active-line": "transparent",
          "--ui-tab-active-bg": "var(--ui-c-soft)",
          "--ui-tab-active-fg": "var(--ui-c-soft-fg)",
          "--ui-tab-radius": "var(--ui-radius)",
        },
      },
      sizes: {
        sm: { "--ui-tab-fs": "0.75rem", "--ui-tab-px": "0.75rem", "--ui-tab-py": "0.25rem" },
        lg: { "--ui-tab-fs": "0.9375rem", "--ui-tab-px": "1.25rem", "--ui-tab-py": "0.625rem" },
      },
    },

    tab: {
      base: {
        color: "var(--rt-gray-11)",
        "&:hover": { color: "var(--rt-gray-12)" },
      },
      intents: intents(),
      sizes: {
        sm: { "font-size": "0.75rem" },
        lg: { "font-size": "0.9375rem" },
      },
      states: {
        disabled: { opacity: "0.4", cursor: "not-allowed" },
        loading: {},
        active: {}, // look set via --ui-tab-* on the container
      },
    },
  },
});
