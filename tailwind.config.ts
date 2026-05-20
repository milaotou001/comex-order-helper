import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111318",
        panel: "#181b22",
        line: "#2b303a",
        gold: "#d6ad55",
        silver: "#d4d8dd",
        amber: "#f2b84b",
        danger: "#ef6461"
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
