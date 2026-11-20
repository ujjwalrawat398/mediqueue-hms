/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Calm clinical teal + warm neutral -- trustworthy, not sterile-cold
        teal: {
          50: "#eefbf9",
          100: "#d3f3ee",
          500: "#0f7d72",
          600: "#0b655c",
          700: "#0a5049",
        },
        sand: "#faf8f4",
        ink: "#1c2624",
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
