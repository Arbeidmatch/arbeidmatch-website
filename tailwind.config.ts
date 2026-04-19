import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0D1B2A",
        gold: "#C9A84C",
        "gold-hover": "#B8913A",
        surface: "#F5F6F8",
        "text-secondary": "#555555",
        border: "#E2E5EA",
        obsidian: "#0a0f14",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: { content: "1200px" },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "shine-sweep": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        "pulse-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 6px rgba(201,168,76,0.35))" },
          "50%": { filter: "drop-shadow(0 0 14px rgba(201,168,76,0.65))" },
        },
        "border-glow": {
          "0%, 100%": { boxShadow: "0 0 0 1px rgba(201,168,76,0.25), 0 0 20px rgba(201,168,76,0.08)" },
          "50%": { boxShadow: "0 0 0 1px rgba(201,168,76,0.45), 0 0 28px rgba(201,168,76,0.18)" },
        },
      },
      animation: {
        "shine-sweep": "shine-sweep 2.2s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.8s ease-in-out infinite",
        "border-glow": "border-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
