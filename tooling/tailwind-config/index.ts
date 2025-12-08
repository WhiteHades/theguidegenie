import variablesPlugin from "@mertasan/tailwindcss-variables";
import colorVariable from "@mertasan/tailwindcss-variables/colorVariable";
import containerQueryPlugin from "@tailwindcss/container-queries";
import formsPlugin from "@tailwindcss/forms";
import typographyPlugin from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";
// european color palette - deep blues, warm golds, elegant neutrals
export const lightVariables = {
  colors: {
    border: "#e2e0dc",
    input: "#d4d2ce",
    ring: "#1e3a5f",
    background: "#faf9f7",
    foreground: "#1a1a1a",
    primary: "#1e3a5f",
    "primary-foreground": "#ffffff",
    secondary: "#2d2d2d",
    "secondary-foreground": "#ffffff",
    destructive: "#c53030",
    "destructive-foreground": "#ffffff",
    success: "#2f855a",
    "success-foreground": "#ffffff",
    muted: "#f5f4f2",
    "muted-foreground": "#6b6b6b",
    accent: "#d4a574",
    "accent-foreground": "#1a1a1a",
    popover: "#ffffff",
    "popover-foreground": "#1a1a1a",
    card: "#ffffff",
    "card-foreground": "#1a1a1a",
    highlight: "#d4a574",
    "highlight-foreground": "#1a1a1a",
  },
};

// dark theme - rich navy, warm gold accents
export const darkVariables = {
  colors: {
    border: "#2a3441",
    input: "#374151",
    ring: "#7c9ec9",
    background: "#0f1419",
    foreground: "#f5f5f5",
    primary: "#7c9ec9",
    "primary-foreground": "#0f1419",
    secondary: "#f5f5f5",
    "secondary-foreground": "#0f1419",
    destructive: "#f56565",
    "destructive-foreground": "#ffffff",
    success: "#48bb78",
    "success-foreground": "#ffffff",
    muted: "#1a2332",
    "muted-foreground": "#9ca3af",
    accent: "#d4a574",
    "accent-foreground": "#0f1419",
    popover: "#151b23",
    "popover-foreground": "#f5f5f5",
    card: "#151b23",
    "card-foreground": "#f5f5f5",
    highlight: "#d4a574",
    "highlight-foreground": "#0f1419",
  },
};

export default {
  content: [],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      boxShadow: {
        sm: "0 2px 8px 0 rgb(0, 0, 0, 0.025), 0 0 1px rgba(0,0,0,0.1)",
        DEFAULT: "0 4px 16px 0 rgb(0, 0, 0, 0.05), 0 0 1px rgba(0,0,0,0.1)",
        md: "0 6px 24px 0 rgb(0, 0, 0, 0.075), 0 0 1px rgba(0,0,0,0.1)",
        lg: "0 8px 32px 0 rgb(0, 0, 0, 0.1), 0 0 1px rgba(0,0,0,0.1)",
        xl: "0 12px 48px 0 rgb(0, 0, 0, 0.125), 0 0 1px rgba(0,0,0,0.1)",
        "2xl": "0 16px 64px 0 rgb(0, 0, 0, 0.15), 0 0 1px rgba(0,0,0,0.1)",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // bouncy spring animations
        "bounce-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-bounce": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "fade-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-in": "bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "scale-bounce": "scale-bounce 0.3s ease-in-out",
        "fade-up": "fade-up 0.5s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 3s ease-in-out infinite",
      },
      colors: {
        border: colorVariable("--colors-border"),
        input: colorVariable("--colors-input"),
        ring: colorVariable("--colors-ring"),
        background: colorVariable("--colors-background"),
        foreground: colorVariable("--colors-foreground"),
        primary: {
          DEFAULT: colorVariable("--colors-primary"),
          foreground: colorVariable("--colors-primary-foreground"),
        },
        secondary: {
          DEFAULT: colorVariable("--colors-secondary"),
          foreground: colorVariable("--colors-secondary-foreground"),
        },
        destructive: {
          DEFAULT: colorVariable("--colors-destructive"),
          foreground: colorVariable("--colors-destructive-foreground"),
        },
        success: {
          DEFAULT: colorVariable("--colors-success"),
          foreground: colorVariable("--colors-success-foreground"),
        },
        muted: {
          DEFAULT: colorVariable("--colors-muted"),
          foreground: colorVariable("--colors-muted-foreground"),
        },
        accent: {
          DEFAULT: colorVariable("--colors-accent"),
          foreground: colorVariable("--colors-accent-foreground"),
        },
        popover: {
          DEFAULT: colorVariable("--colors-popover"),
          foreground: colorVariable("--colors-popover-foreground"),
        },
        card: {
          DEFAULT: colorVariable("--colors-card"),
          foreground: colorVariable("--colors-card-foreground"),
        },
        highlight: {
          DEFAULT: colorVariable("--colors-highlight"),
          foreground: colorVariable("--colors-highlight-foreground"),
        },
      },
    },
    variables: {
      DEFAULT: lightVariables,
    },
    darkVariables: {
      DEFAULT: darkVariables,
    },
  },
  plugins: [
    formsPlugin({
      strategy: "base",
    }),
    typographyPlugin,
    animatePlugin,
    containerQueryPlugin,
    variablesPlugin({
      colorVariables: true,
    }),
  ],
} satisfies Config;
