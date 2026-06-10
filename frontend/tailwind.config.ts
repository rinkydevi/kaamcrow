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
          void:    "#07070f",
          abyss:   "#0d0d1f",
          shadow:  "#12122a",
          border:  "#1e1e3f",
          muted:   "#6b6b9a",
          text:    "#c9c9e8",
          feather: "#8b5cf6",
          shimmer: "#06b6d4",
          wing:    "#3b82f6",
          gold:    "#f59e0b",
        },
      },
      backgroundImage: {
        "crow-gradient": "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%)",
      },
      boxShadow: {
        "crow-glow":    "0 0 20px rgba(139, 92, 246, 0.4)",
        "shimmer-glow": "0 0 20px rgba(6, 182, 212, 0.4)",
        "wing-glow":    "0 0 20px rgba(59, 130, 246, 0.4)",
      },
      animation: {
        "float":       "float 4s ease-in-out infinite",
        "shimmer":     "shimmer 2s linear infinite",
        "pulse-glow":  "pulse-glow 2.5s ease-in-out infinite",
        "crow-bob":    "crow-bob 3s ease-in-out infinite",
        "feather-fall":"feather-fall 3s ease-in forwards",
        "spin-slow":   "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
