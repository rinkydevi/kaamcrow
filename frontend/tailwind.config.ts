import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        crow: {
          // CSS-variable-backed — support opacity modifiers (/10, /20, etc.)
          void:    "rgb(var(--crow-bg) / <alpha-value>)",
          abyss:   "rgb(var(--crow-surface) / <alpha-value>)",
          shadow:  "rgb(var(--crow-surface2) / <alpha-value>)",
          border:  "rgb(var(--crow-border) / <alpha-value>)",
          muted:   "rgb(var(--crow-muted) / <alpha-value>)",
          text:    "rgb(var(--crow-text) / <alpha-value>)",
          feather: "rgb(var(--crow-accent) / <alpha-value>)",
          shimmer: "rgb(var(--crow-accent) / <alpha-value>)",
          wing:    "rgb(var(--crow-accent) / <alpha-value>)",
          // Static
          gold:    "#fbbf24",
          mint:    "#34d399",
        },
      },
      animation: {
        "float":      "float 4s ease-in-out infinite",
        "crow-bob":   "crow-bob 3s ease-in-out infinite",
        "spin-slow":  "spin 3s linear infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
