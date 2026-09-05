import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Design System Semantic Palette
        stitch: {
          primary: "#1A1A1A",
          accent: "#005F61",
          secondaryText: "#757575",
          "secondary-text": "#757575",
          base: "#FFFFFF",
          "surface-base": "#FFFFFF",
          muted: "#F9F9F9",
          "surface-muted": "#F9F9F9",
          container: "#EEEEEE",
          "surface-container": "#EEEEEE",
          border: "#EDEDED",
          error: "#BA1A1A",
          dim: "#DADADA",
          "surface-dim": "#DADADA",
          bright: "#F9F9F9",
          "surface-bright": "#F9F9F9",
          containerLow: "#F3F3F3",
          "surface-container-low": "#F3F3F3",
          containerHigh: "#E8E8E8",
          "surface-container-high": "#E8E8E8",
          containerHighest: "#E2E2E2",
          "surface-container-highest": "#E2E2E2",
        },
        // Backwards-compatible legacy palette
        brand: {
          50: "#f8f8f8",
          100: "#f0f0f0",
          200: "#e4e4e4",
          300: "#d1d1d1",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        accent: {
          DEFAULT: "#005F61",
          dark: "#111827",
          hover: "#004b4c",
          red: "#BA1A1A",
          green: "#16a34a",
          amber: "#d97706",
        },
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        full: "9999px",
      },
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
        gutter: "24px",
        "margin-desktop": "64px",
        "margin-mobile": "16px",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "var(--font-sans)", "system-ui", "sans-serif"],
        geist: ["var(--font-geist)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
