/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        photon: {
          bg: "#080B10",
          "bg-elevated": "#0D121A",
          surface: "#111925",
          "surface-raised": "#16212E",
          border: "rgba(167, 190, 216, 0.13)",
          "border-strong": "rgba(167, 190, 216, 0.24)",
          text: "#F0F5FB",
          "text-secondary": "#9BAABD",
          "text-muted": "#66768B",
          blue: "#53B8FF",
          cyan: "#63F0E0",
          positive: "#54D6A0",
          negative: "#FF737D",
          warning: "#F5BE69",
          purple: "#7B61FF",
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Fira Code"', "monospace"],
      },
      backgroundImage: {
        "gradient-photon": "linear-gradient(135deg, #53B8FF 0%, #63F0E0 100%)",
        "gradient-glow": "radial-gradient(ellipse at 50% 0%, rgba(83, 184, 255, 0.08) 0%, transparent 60%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "fade-up": "fadeUp 0.5s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "glow": "glowPulse 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};
