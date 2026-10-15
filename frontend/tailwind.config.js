/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        dex: {
          black: "#000000",
          bg: "#0A0A0F",
          surface: "#111119",
          card: "#16161E",
          elevated: "#1C1C28",
          border: "#1E1E2E",
          "border-light": "#2A2A3C",
          blue: "#2F8AF5",
          "blue-hover": "#1A7AE6",
          purple: "#6966FF",
          green: "#3FB68B",
          red: "#FF5353",
          yellow: "#F0B90B",
          text: "#FFFFFF",
          muted: "#72768F",
          dimmed: "#3A3D5C",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-blue": "linear-gradient(135deg, #2F8AF5 0%, #6966FF 100%)",
      },
      animation: {
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
