import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        page: "#fafaf7",
        ink: "#1a1a18",
        panel: "#ffffff",
        line: "#e8e3da",
        gold: "#b8943e",
        silver: "#8a8a85",
        amber: "#c27830",
        danger: "#c04040"
      },
      fontFamily: {
        sans: ["Aptos", "Segoe UI", "sans-serif"],
        mono: ["Cascadia Mono", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        glow: "0 18px 60px rgba(0, 0, 0, 0.36)"
      }
    }
  },
  plugins: []
};

export default config;
