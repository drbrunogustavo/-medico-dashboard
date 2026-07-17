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
        /* ── Core layout tokens → CSS custom properties (theme-aware) ──── */
        background:     "var(--background)",
        surface:        "var(--surface)",
        "surface-2":    "var(--surface-2)",
        card:           "var(--card)",
        border:         "var(--border)",
        "border-hover": "var(--border-hover)",

        /* ── Text tokens ─────────────────────────────────────────────── */
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted":     "var(--text-muted)",

        /* ── Accent — supports Tailwind opacity modifier (bg-accent/10) ─ */
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          dim:     "var(--accent-dim)",
          border:  "var(--accent-border)",
          text:    "var(--accent-text)",
        },

        /* ── Gold — Elite tier (intentionally theme-independent) ──────── */
        gold: {
          DEFAULT: "#d4af37",
          dim:     "rgba(212,175,55,0.08)",
          border:  "rgba(212,175,55,0.25)",
        },

        /* ── Blue accent (theme-independent) ─────────────────────────── */
        blue: {
          DEFAULT: "#3b7fff",
          dim:     "rgba(59,127,255,0.10)",
          border:  "rgba(59,127,255,0.25)",
          text:    "#6fa3ff",
        },

        /* ── Status (theme-independent) ──────────────────────────────── */
        danger:  { DEFAULT: "#ef4444", dim: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.25)"   },
        warning: { DEFAULT: "#f59e0b", dim: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.25)"  },
        success: { DEFAULT: "#00c07f", dim: "rgba(0,192,127,0.10)",   border: "rgba(0,192,127,0.25)"   },

        /* ── Bege — paleta quente usada em páginas público/demo/loading ─ */
        bege: {
          DEFAULT: "#b8976a",
          mid:     "#9a8a7a",
          dark:    "#6a5a4a",
          dim:     "rgba(184,151,106,0.10)",
          border:  "rgba(184,151,106,0.25)",
        },

        /* ── Dark / Cream — fundo escuro e claro das páginas públicas ── */
        dark:  { DEFAULT: "#0D1B2A" },
        cream: { DEFAULT: "#F5F0E8", border: "#e8ddd0" },
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
        blink:            { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.2" } },
        "fade-in":        { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer:          { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        softPulse:        { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
        "slide-in-left":  { from: { opacity: "0", transform: "translateX(-100%)" }, to: { opacity: "1", transform: "none" } },
        "theme-switch":   { "0%": { opacity: "0", transform: "rotate(-90deg) scale(0.7)" }, "100%": { opacity: "1", transform: "rotate(0deg) scale(1)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        blink:            "blink 1.5s ease-in-out infinite",
        "fade-in":        "fade-in 400ms ease-out",
        shimmer:          "shimmer 2s linear infinite",
        "soft-pulse":     "softPulse 2s ease-in-out infinite",
        "slide-in-left":  "slide-in-left 250ms cubic-bezier(0.4,0,0.2,1)",
        "theme-switch":   "theme-switch 300ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
