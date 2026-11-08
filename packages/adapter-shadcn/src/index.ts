import { defineAdapter } from "uniskin/adapter";

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
