import type { Config } from "tailwindcss";

export default {
  darkMode: 'class', // Usamos la clase "dark" en la etiqueta <html>
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#FAD700",
        "background-light": "#f8f7f5",
        "background-dark": "#0A0A0A",
        "card-dark": "#1A1A1A",
      },
      fontFamily: {
        "display": ["var(--font-inter)", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries')
  ],
} satisfies Config;
