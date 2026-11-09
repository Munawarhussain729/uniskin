import { defineAdapter } from "uniskin/adapter";

/* shadcn text fields: h-9, shadow-xs, 3px ring at 50% on focus */
const field = {
  padding: "0.25rem 0.75rem",
  "font-size": "0.875rem",
  "border-color": "var(--ui-field-c, hsl(var(--input)))",
  "border-radius": "calc(var(--radius) - 2px)",
  "background-color": "transparent",
  "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  "&:hover": { "border-color": "var(--ui-field-c, hsl(var(--input)))" },
  "&:focus-visible": {
    "border-color": "var(--ui-field-c, hsl(var(--ring)))",
    "box-shadow": "0 0 0 3px hsl(var(--ring) / 0.5)",
  },
};
const fieldHeights = {
  base: { height: "2.25rem" },
  sizes: {
    sm: { height: "2rem", "font-size": "0.8125rem" },
    lg: { height: "2.5rem", "font-size": "0.9375rem" },
  },
};

/* shadcn alert: card-like by default; intents keep their own border color */
const alertIntent = { "border-color": "var(--ui-c)" };

/* Map Uniskin tokens onto the shadcn variables. These are var() aliases, so they
   are repeated inside the dark scope to re-resolve against the dark palette. */
const uiMap = {
  "--ui-primary": "hsl(var(--primary))",
  "--ui-primary-fg": "hsl(var(--primary-foreground))",
  "--ui-secondary": "hsl(var(--secondary))",
  "--ui-secondary-fg": "hsl(var(--secondary-foreground))",
  "--ui-danger": "hsl(var(--destructive))",
  "--ui-danger-fg": "hsl(var(--destructive-foreground))",
  /* shadcn has no success/warning tokens — those stay on Uniskin's
     defaults (documented fallback behaviour) */
  "--ui-neutral": "hsl(var(--primary))",
  "--ui-neutral-fg": "hsl(var(--primary-foreground))",
  "--ui-neutral-soft": "hsl(var(--accent))",
  "--ui-neutral-soft-fg": "hsl(var(--accent-foreground))",
  "--ui-surface": "hsl(var(--card))",
  "--ui-surface-fg": "hsl(var(--card-foreground))",
  "--ui-surface-muted": "hsl(var(--muted))",
  "--ui-border": "hsl(var(--border))",
  "--ui-ring": "hsl(var(--ring))",
  "--ui-radius": "var(--radius)",
  /* shadcn's secondary is already a soft tint: use it (and its foreground)
     as the soft look so ui-secondary ui-soft stays above WCAG AA */
  "--ui-secondary-soft": "hsl(var(--secondary))",
  "--ui-secondary-soft-fg": "hsl(var(--secondary-foreground))",
  /* shadcn's destructive is ~3.6:1 as text on white: error messages and
     invalid borders use a deeper red (>= 4.5:1; dark mode pins a lighter one) */
  "--ui-danger-text": "hsl(0 72% 42%)",
};

/**
 * shadcn/ui visual style for Uniskin — pure CSS, no React, no Radix.
 *
 * Emits shadcn's own CSS variables (`--primary`, `--radius`, `--ring`…)
 * on :root in their classic HSL-channel form, then maps Uniskin's tokens
 * onto them. Users can re-theme by overriding the shadcn variables they
 * already know.
 */
export default defineAdapter({
  name: "shadcn",
  darkTokens: {
    /* shadcn/ui canonical dark theme (HSL channels) */
    "--background": "222.2 84% 4.9%",
    "--foreground": "210 40% 98%",
    "--card": "222.2 84% 4.9%",
    "--card-foreground": "210 40% 98%",
    "--primary": "210 40% 98%",
    "--primary-foreground": "222.2 47.4% 11.2%",
    "--secondary": "217.2 32.6% 17.5%",
    "--secondary-foreground": "210 40% 98%",
    "--muted": "217.2 32.6% 17.5%",
    "--muted-foreground": "215 20.2% 65.1%",
    "--accent": "217.2 32.6% 17.5%",
    "--accent-foreground": "210 40% 98%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "210 40% 98%",
    "--border": "217.2 32.6% 17.5%",
    "--input": "217.2 32.6% 17.5%",
    "--ring": "212.7 26.8% 83.9%",
    /* success/warning aren't shadcn tokens — dark values of Uniskin's defaults */
    "--ui-success": "oklch(0.72 0.15 163)",
    "--ui-success-fg": "oklch(0.15 0.03 163)",
    "--ui-warning": "oklch(0.82 0.15 85)",
    "--ui-warning-fg": "oklch(0.2 0.04 90)",
    /* shadcn's dark destructive is deliberately deep (30% lightness) — too dark
       to read as soft text, so pin a lighter red pair for ui-danger ui-soft */
    "--ui-danger-soft": "color-mix(in oklab, hsl(0 72% 51%) 22%, hsl(var(--card)))",
    "--ui-danger-soft-fg": "hsl(0 90% 78%)",
    ...uiMap,
    /* shadcn dark destructive (30.6% lightness) is only ~1.8:1 against the page as a
       border or indicator: lift ui-danger to >= 3.4:1 on any surface (the light label stays >= 6:1) */
    "--ui-danger": "hsl(0 62.8% 48%)",
    "--ui-danger-text": "hsl(0 90% 72%)",
  },
  tokens: {
    /* shadcn/ui canonical variables (light theme, HSL channels) */
    "--background": "0 0% 100%",
    "--foreground": "222.2 84% 4.9%",
    "--card": "0 0% 100%",
    "--card-foreground": "222.2 84% 4.9%",
    "--primary": "222.2 47.4% 11.2%",
    "--primary-foreground": "210 40% 98%",
    "--secondary": "210 40% 96.1%",
    "--secondary-foreground": "222.2 47.4% 11.2%",
    "--muted": "210 40% 96.1%",
    "--muted-foreground": "215.4 16.3% 46.9%",
    "--accent": "210 40% 96.1%",
    "--accent-foreground": "222.2 47.4% 11.2%",
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "210 40% 98%",
    "--border": "214.3 31.8% 91.4%",
    "--input": "214.3 31.8% 91.4%",
    "--ring": "222.2 84% 4.9%",
    "--radius": "0.5rem",

    ...uiMap,
  },
  components: {
    input: {
      base: { ...field, ...fieldHeights.base },
      sizes: fieldHeights.sizes,
    },
    textarea: { base: { ...field, "min-height": "4rem" } },
    select: {
      base: { ...field, ...fieldHeights.base },
      sizes: fieldHeights.sizes,
    },
    checkbox: {
      base: {
        "--ui-check-size": "1rem",
        "border-radius": "4px",
        "border-color": "hsl(var(--primary))",
        "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "&:focus-visible": {
          outline: "none",
          "box-shadow": "0 0 0 3px hsl(var(--ring) / 0.5)",
        },
      },
    },
    radio: {
      base: {
        "--ui-radio-size": "1rem",
        "--ui-radio-dot-size": "0.5em",
        "--ui-radio-dot": "var(--ui-c-text)",
        "border-color": "hsl(var(--primary))",
        /* shadcn: ring stays transparent, a primary dot marks the choice */
        '&:checked, &[aria-checked="true"]': { "background-color": "transparent" },
        "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "&:focus-visible": {
          outline: "none",
          "box-shadow": "0 0 0 3px hsl(var(--ring) / 0.5)",
        },
      },
    },
    switch: {
      base: {
        "--ui-switch-size": "1.25rem",
        "--ui-switch-pad": "2px",
        /* shadcn Switch: primary when on. The off track is deliberately
           stronger than upstream's very light --input so it keeps 3:1. */
        "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "&::after": { "box-shadow": "0 1px 3px 0 rgb(0 0 0 / 0.25)" },
        "&:focus-visible": {
          outline: "none",
          "box-shadow": "0 0 0 3px hsl(var(--ring) / 0.5)",
        },
      },
      states: {
        /* the default active halo would otherwise out-rank the focus ring */
        active: {
          "&:focus-visible": { "box-shadow": "0 0 0 3px hsl(var(--ring) / 0.5)" },
        },
      },
    },
    field: { base: { "--ui-field-gap": "0.5rem" } },
    "field-hint": { base: { "--ui-field-hint": "hsl(var(--muted-foreground))" } },
    card: {
      base: {
        "border-radius": "calc(var(--radius) + 4px)",
        "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
    },
    "card-header": { base: { padding: "1.5rem", "border-bottom": "0" } },
    "card-body": { base: { padding: "0 1.5rem 1.5rem" } },
    "card-footer": {
      base: {
        padding: "0 1.5rem 1.5rem",
        "border-top": "0",
        "background-color": "transparent",
      },
    },
    badge: {
      base: {
        "border-radius": "calc(var(--radius) - 2px)",
        padding: "0.125rem 0.5rem",
        "font-size": "0.75rem",
      },
      styles: {
        outline: {
          color: "hsl(var(--foreground))",
          "border-color": "hsl(var(--border))",
        },
        /* shadcn's secondary is near-white — keep ghost text readable */
        ghost: { color: "hsl(var(--foreground))" },
      },
    },
    alert: {
      base: {
        "--ui-c": "hsl(var(--card))",
        "--ui-on-c": "hsl(var(--card-foreground))",
        "border-radius": "calc(var(--radius) + 2px)",
        "border-color": "hsl(var(--border))",
        "font-size": "0.875rem",
      },
      intents: {
        primary: alertIntent,
        secondary: alertIntent,
        success: alertIntent,
        warning: alertIntent,
        danger: alertIntent,
      },
      styles: { ghost: { color: "hsl(var(--foreground))" } },
    },
    "modal-box": {
      base: {
        "border-radius": "calc(var(--radius) + 2px)",
        border: "1px solid hsl(var(--border))",
        "border-top-width": "1px",
        "box-shadow": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      },
    },
    tabs: {
      base: {
        display: "inline-flex",
        gap: "0",
        padding: "3px",
        "border-bottom": "0",
        "border-radius": "calc(var(--radius) + 2px)",
        "background-color": "hsl(var(--muted))",
        "--ui-tab-active-bg": "hsl(var(--background))",
        "--ui-tab-active-fg": "hsl(var(--foreground))",
        "--ui-tab-active-line": "transparent",
        "--ui-tab-active-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "--ui-tab-radius": "calc(var(--radius) - 2px)",
      },
    },
    tab: {
      base: {
        margin: "0",
        padding: "0.25rem 0.75rem",
        "font-size": "0.875rem",
        color: "hsl(var(--muted-foreground))",
        "&:hover": { color: "hsl(var(--foreground))" },
      },
    },
    button: {
      base: {
        /* shadcn button: h-9 px-4, font-medium, shadow-xs */
        height: "2.25rem",
        padding: "0 1rem",
        "font-size": "0.875rem",
        "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "&:focus-visible": {
          outline: "none",
          "box-shadow":
            "0 0 0 1px hsl(var(--background)), 0 0 0 4px hsl(var(--ring) / 0.5)",
        },
      },
      intents: {
        /* shadcn hover = bg-<intent>/90 (opacity, not a darker shade) */
        primary: { "--ui-c-hover": "hsl(var(--primary) / 0.9)" },
        danger: { "--ui-c-hover": "hsl(var(--destructive) / 0.9)" },
      },
      styles: {
        /* shadcn outline: neutral border + accent hover — intent colors
           intentionally don't tint it (faithful to shadcn) */
        outline: {
          "background-color": "hsl(var(--background))",
          "border-color": "hsl(var(--border))",
          color: "hsl(var(--foreground))",
          "&:hover": {
            "background-color": "hsl(var(--accent))",
            "border-color": "hsl(var(--border))",
            color: "hsl(var(--accent-foreground))",
          },
        },
        ghost: {
          color: "hsl(var(--foreground))",
          "&:hover": {
            "background-color": "hsl(var(--accent))",
            color: "hsl(var(--accent-foreground))",
          },
        },
      },
      states: {
        /* the default pressed look is an inset shadow, which would replace the
           ring while the button is focused — keep both */
        active: {
          "&:focus-visible": {
            "box-shadow":
              "inset 0 2px 4px rgb(0 0 0 / 0.2), 0 0 0 1px hsl(var(--background)), 0 0 0 4px hsl(var(--ring) / 0.5)",
          },
        },
      },
      sizes: {
        sm: { height: "2rem", padding: "0 0.75rem", "font-size": "0.75rem" },
        lg: { height: "2.5rem", padding: "0 2rem" },
      },
    },
  },
});
