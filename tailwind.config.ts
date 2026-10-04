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
        dark: {
          50: "#2a2a2a",
          100: "#222222",
          200: "#1e1e1e",
          300: "#181818",
          400: "#141414",
          500: "#111111",
          600: "#0d0d0d",
          700: "#0a0a0a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
