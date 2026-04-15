import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
      },
      animation: {
        "rank-up": "rankUp 0.6s ease-out",
        "rank-down": "rankDown 0.6s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        ticker: "ticker 30s linear infinite",
      },
      keyframes: {
        rankUp: {
          "0%": { backgroundColor: "rgba(34,197,94,0.3)" },
          "100%": { backgroundColor: "transparent" },
        },
        rankDown: {
          "0%": { backgroundColor: "rgba(239,68,68,0.3)" },
          "100%": { backgroundColor: "transparent" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
