/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 1inch-inspired dark theme
        photon: {
          bg: "#0E0E16",
          card: "#1B1B2F",
          cardHover: "#232340",
          border: "#2A2A45",
          blue: "#2F8AF5",
          purple: "#6C5CE7",
          green: "#00B894",
          red: "#FF6B6B",
          yellow: "#FDCB6E",
          text: "#FFFFFF",
          muted: "#8B8CA7",
          dim: "#5A5B75",
        },
      },
      backgroundImage: {
        "gradient-photon": "linear-gradient(135deg, #2F8AF5, #6C5CE7)",
        "gradient-green": "linear-gradient(135deg, #00B894, #00CEC9)",
        "gradient-red": "linear-gradient(135deg, #FF6B6B, #E17055)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(47, 138, 245, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(47, 138, 245, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
