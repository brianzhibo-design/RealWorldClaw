/** Tailwind CSS 配置 — 赛博朋克深色主题 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan: "#00ffe0",
          dark: "#0a0e1a",
          card: "#111827",
          border: "#1e293b",
        },
      },
      boxShadow: {
        glow: "0 0 15px rgba(0, 255, 224, 0.15)",
        "glow-lg": "0 0 30px rgba(0, 255, 224, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
