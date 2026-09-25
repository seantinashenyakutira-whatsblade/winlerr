import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--bg)",
        "surface-tint": "var(--bg-tint)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        brand: {
          400: "var(--blue-400)",
          500: "var(--blue-500)",
          600: "var(--blue-600)",
        },
        accent: {
          400: "var(--orange-400)",
          500: "var(--orange-500)",
        },
        border: "var(--border)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
