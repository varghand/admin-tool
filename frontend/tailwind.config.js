/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // adjust as needed
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: {
            DEFAULT: "#875B9E",   // Primary purple
            dark: "#6C3688",      // Darker purple
          },
          teal: {
            DEFAULT: "#7BB5B1",   // Complement
            dark: "#007582",      // Button teal
          },
          gray: {
            light: "#F0F0F0",     // Primary background
            medium: "#CECFCF",    // Complement gray
          },
          white: "#FFFFFF",
          black: "#000000",
        },
      },
    },
  },
  plugins: [],
};
