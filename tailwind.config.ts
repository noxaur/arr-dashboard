import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "oklch(18% 0.01 175)",
          elevated: "oklch(22% 0.01 175)",
          overlay: "oklch(28% 0.01 175)",
        },
        border: {
          DEFAULT: "oklch(30% 0.015 175)",
          strong: "oklch(38% 0.02 175)",
        },
        text: {
          primary: "oklch(88% 0.01 175)",
          secondary: "oklch(65% 0.01 175)",
          muted: "oklch(48% 0.008 175)",
        },
        accent: {
          DEFAULT: "oklch(62% 0.14 175)",
          hover: "oklch(68% 0.15 175)",
          active: "oklch(56% 0.13 175)",
          subtle: "oklch(62% 0.14 175 / 0.12)",
        },
        status: {
          healthy: "oklch(72% 0.16 145)",
          warning: "oklch(78% 0.16 85)",
          error: "oklch(62% 0.22 25)",
          info: "oklch(68% 0.14 230)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "Monaco",
          "Inconsolata",
          "Roboto Mono",
          "monospace",
        ],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.75rem", { lineHeight: "2.25rem" }],
      },
      spacing: {
        "4xs": "0.125rem",
        "3xs": "0.25rem",
        "2xs": "0.375rem",
        xs: "0.5rem",
        sm: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
        "3xl": "3.5rem",
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 250ms ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
