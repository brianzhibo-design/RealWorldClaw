/** Tailwind CSS 配置 — 赛博朋克深色主题 + 霓虹蓝紫 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Noto Sans SC", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        cyber: {
          cyan: "#00ffe0",
          dark: "#0a0e1a",
          card: "#111827",
          border: "#1e293b",
        },
        neon: {
          blue: "#60a5fa",
          purple: "#a78bfa",
          pink: "#f472b6",
          cyan: "#22d3ee",
        },
      },
      boxShadow: {
        glow: "0 0 15px rgba(96, 165, 250, 0.15)",
        "glow-lg": "0 0 30px rgba(96, 165, 250, 0.25)",
        "glow-purple": "0 0 20px rgba(167, 139, 250, 0.2)",
        "glow-neon": "0 0 40px rgba(96, 165, 250, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(96, 165, 250, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(96, 165, 250, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
