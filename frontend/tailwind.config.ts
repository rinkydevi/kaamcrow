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
          void:    "#0d0a1e",
          abyss:   "#150d2a",
          shadow:  "#1c1238",
          border:  "#2a1956",
          muted:   "#9284c4",
          text:    "#ece8ff",
          feather: "#c084fc",
          shimmer: "#f472b6",
          wing:    "#818cf8",
          gold:    "#fbbf24",
          mint:    "#34d399",
        },
      },
      backgroundImage: {
        "crow-gradient": "linear-gradient(135deg, #f472b6 0%, #a855f7 50%, #818cf8 100%)",
      },
      boxShadow: {
        "crow-glow":    "0 0 24px rgba(192, 132, 252, 0.55)",
        "shimmer-glow": "0 0 24px rgba(244, 114, 182, 0.55)",
        "wing-glow":    "0 0 24px rgba(129, 140, 248, 0.45)",
      },
      animation: {
        "float":        "float 4s ease-in-out infinite",
        "shimmer":      "shimmer 2s linear infinite",
        "pulse-glow":   "pulse-glow 2.5s ease-in-out infinite",
        "crow-bob":     "crow-bob 3s ease-in-out infinite",
        "feather-fall": "feather-fall 3s ease-in forwards",
        "spin-slow":    "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
