/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        /* Base */
        background:  "#08090e",
        surface:     "#0f1018",
        card:        "#13141d",
        border:      "#1c1d2a",
        "border-hover": "#2a2c3e",

        /* Text */
        "text-primary":   "#e8eaf2",
        "text-secondary": "#7c85a0",
        "text-muted":     "#474f66",

        /* Accent — Medical Green */
        accent: {
          DEFAULT: "#00c07f",
          dim:     "rgba(0,192,127,0.12)",
          border:  "rgba(0,192,127,0.3)",
          text:    "#00e893",
        },

        /* Blue alternate */
        blue: {
          DEFAULT: "#3b7fff",
          dim:     "rgba(59,127,255,0.12)",
          border:  "rgba(59,127,255,0.3)",
          text:    "#6fa3ff",
        },

        /* Status */
        danger:  { DEFAULT: "#ef4444", dim: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
        warning: { DEFAULT: "#f59e0b", dim: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
        success: { DEFAULT: "#00c07f", dim: "rgba(0,192,127,0.12)", border: "rgba(0,192,127,0.3)" },
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "monospace"],
        serif: ["Georgia", "serif"],
      },
      borderRadius: {
        lg: "10px",
        md: "7px",
        sm: "4px",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.2" } },
        "ring-pulse": { "0%,100%": { opacity: "0.15", transform: "scale(1)" }, "50%": { opacity: "0.5", transform: "scale(1.05)" } },
        spin: { to: { transform: "rotate(360deg)" } },
        "fade-in":        { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        "slide-in-left":  { from: { opacity: "0", transform: "translateX(-100%)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        blink:            "blink 1.5s ease-in-out infinite",
        "ring-pulse":     "ring-pulse 2.4s ease-in-out infinite",
        spin:             "spin 0.8s linear infinite",
        "fade-in":        "fade-in 0.25s ease",
        "slide-in-left":  "slide-in-left 0.22s ease",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
