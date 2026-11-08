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

    /* map Uniskin tokens onto the shadcn variables */
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
      sizes: {
        sm: { height: "2rem", padding: "0 0.75rem", "font-size": "0.75rem" },
        lg: { height: "2.5rem", padding: "0 2rem" },
      },
    },
  },
});
