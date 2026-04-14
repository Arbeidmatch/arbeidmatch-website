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
        "text-secondary": "#5A6472",
        border: "#E2E5EA",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
      maxWidth: { content: "1140px" },
    },
  },
  plugins: [],
};

export default config;
