import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F6F1EB",
        cream: "#EFE8DF",
        sand: "#D4C4B0",
        clay: "#C47A5A",
        terracotta: "#A85A42",
        ink: "#1F1A17",
        muted: "#6B6158",
        card: "#FFFCF8",
        moss: "#5C7A5A",
        amber: "#B8860B",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        tray: "0 18px 50px -24px rgba(31, 26, 23, 0.28)",
        soft: "0 8px 24px -16px rgba(31, 26, 23, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
