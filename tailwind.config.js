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
        /* Base — PRAXIS dark premium */
        background:     "#080808",
        surface:        "#0f0f0f",
        "surface-2":    "#161616",
        card:           "#161616",
        border:         "#1f1f1f",
        "border-hover": "#2a2a2a",

        /* Text — Apple palette */
        "text-primary":   "#f5f5f7",
        "text-secondary": "#a1a1a6",
        "text-muted":     "#48484f",

        /* Accent — Emerald green */
        accent: {
          DEFAULT: "#00c07f",
          dim:     "rgba(0,192,127,0.08)",
          border:  "rgba(0,192,127,0.2)",
          text:    "#00d98f",
        },

        /* Gold — Elite tier */
        gold: {
          DEFAULT: "#d4af37",
          dim:     "rgba(212,175,55,0.08)",
          border:  "rgba(212,175,55,0.25)",
        },

        /* Blue alternate */
        blue: {
          DEFAULT: "#3b7fff",
          dim:     "rgba(59,127,255,0.10)",
          border:  "rgba(59,127,255,0.25)",
          text:    "#6fa3ff",
        },

        /* Status */
        danger:  { DEFAULT: "#ef4444", dim: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)" },
        warning: { DEFAULT: "#f59e0b", dim: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
        success: { DEFAULT: "#00c07f", dim: "rgba(0,192,127,0.10)", border: "rgba(0,192,127,0.25)" },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        mono:  ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        blink:      { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.2" } },
        "fade-in":  { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer:    { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        softPulse:  { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
        "slide-in-left": { from: { opacity: "0", transform: "translateX(-100%)" }, to: { opacity: "1", transform: "none" } },
        "counter":  { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        "particle": { "0%": { transform: "translateY(0) translateX(0)", opacity: "0" }, "10%": { opacity: "1" }, "90%": { opacity: "0.3" }, "100%": { transform: "translateY(-100vh) translateX(20px)", opacity: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        blink:            "blink 1.5s ease-in-out infinite",
        "fade-in":        "fade-in 400ms ease-out",
        shimmer:          "shimmer 2s linear infinite",
        "soft-pulse":     "softPulse 2s ease-in-out infinite",
        "slide-in-left":  "slide-in-left 250ms cubic-bezier(0.4,0,0.2,1)",
        counter:          "counter 500ms ease-out",
        particle:         "particle linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
