"use client"

import Link from "next/link"
import { ArrowRight, BarChart2, Stethoscope, TrendingUp, Check } from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: BarChart2,
    title: "Marketing com IA",
    desc: "15 módulos alimentados por Claude IA. Roteiros, legendas, artes e calendário editorial completo — em minutos.",
    items: [
      "Gerador de Roteiros e Legendas para Reels",
      "Diretor Criativo com IA generativa",
      "Radar de Tendências em tempo real",
    ],
  },
  {
    icon: Stethoscope,
    title: "Gestão Clínica",
    desc: "Agenda inteligente, copiloto de consulta e nutrição de pacientes integrados ao seu fluxo de atendimento.",
    items: [
      "Agenda e copiloto integrados",
      "Nutrição de pacientes e leads",
      "Financeiro e metas da clínica",
    ],
  },
  {
    icon: TrendingUp,
    title: "Resultados Reais",
    desc: "Médicos que usam PRAXIS publicam com consistência, crescem no Instagram e convertem seguidores em pacientes.",
    items: [
      "Crescimento orgânico comprovado",
      "Conteúdo ético dentro das normas do CFM",
      "Comunidade exclusiva de médicos",
    ],
  },
]

// ─── Landing page — PUBLIC, not protected by middleware ───────────────────────

export default function LandingPage() {
  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto"
      style={{ background: "#0a0a0a" }}
    >

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{
          height: 64,
          background: "rgba(10,10,10,0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Logo — inline for dark theme (PraxisLogo uses light-theme CSS vars) */}
        <div className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-label="PRAXIS">
            <circle cx="16" cy="16" r="14" stroke="#00c07f" strokeWidth="1.5"
              strokeLinecap="round" strokeDasharray="70 18" strokeDashoffset="12" opacity="0.6" />
            <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke="#f5f5f7"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="18" y1="14" x2="23" y2="22" stroke="#00c07f"
              strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          </svg>
          <div>
            <div style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: 16, fontWeight: 600, letterSpacing: "4px",
              color: "#f0f0f0", lineHeight: 1,
            }}>
              PRAXIS
            </div>
            <div className="hidden sm:block" style={{
              fontSize: 7, letterSpacing: "2.5px", color: "#555",
              textTransform: "uppercase", marginTop: 3, lineHeight: 1,
            }}>
              Marketing Médico de Alto Padrão
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/planos"
            className="hidden sm:block text-[12px] font-medium transition-colors"
            style={{ color: "#888" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ccc")}
            onMouseLeave={e => (e.currentTarget.style.color = "#888")}
          >
            Planos
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#00c07f", color: "#080808" }}
          >
            Entrar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="animate-fade-in">
        <div className="max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 mb-8"
            style={{
              padding: "6px 16px", borderRadius: 999,
              border: "1px solid rgba(0,192,127,0.25)",
              background: "rgba(0,192,127,0.06)",
            }}
          >
            <span
              className="animate-blink"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#00c07f", flexShrink: 0 }}
            />
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#00c07f", letterSpacing: "2.5px", textTransform: "uppercase" }}>
              Plataforma exclusiva para médicos
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-6"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(28px, 5vw, 54px)",
              fontWeight: 600, lineHeight: 1.15,
              color: "#f0f0f0", letterSpacing: "-0.5px",
            }}
          >
            A plataforma de marketing e gestão clínica para{" "}
            <span style={{ color: "#00c07f" }}>médicos de alto desempenho</span>
          </h1>

          {/* Sub */}
          <p className="mx-auto mb-10" style={{ fontSize: 16, color: "#888", lineHeight: 1.75, maxWidth: 560 }}>
            15 módulos com IA Claude para criar conteúdo, crescer no Instagram
            e gerir a clínica — sem abrir mão do consultório.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-[15px] font-bold transition-all hover:opacity-95 active:scale-[0.98]"
              style={{ background: "#00c07f", color: "#080808", boxShadow: "0 0 40px rgba(0,192,127,0.2)" }}
            >
              Entrar na plataforma <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#bbb" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#f0f0f0" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#bbb" }}
            >
              Conhecer os planos
            </Link>
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon
            return (
              <div
                key={i}
                className="animate-fade-in h-full rounded-2xl p-7 flex flex-col gap-5"
                style={{
                  animationDelay: `${80 + i * 100}ms`,
                  animationFillMode: "both",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "rgba(0,192,127,0.10)",
                  border: "1px solid rgba(0,192,127,0.20)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon style={{ width: 20, height: 20, color: "#00c07f" }} />
                </div>

                {/* Text */}
                <div>
                  <h3 style={{
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    fontSize: 20, fontWeight: 600, color: "#f0f0f0", marginBottom: 10,
                  }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "#888", lineHeight: 1.75 }}>{b.desc}</p>
                </div>

                {/* Checklist */}
                <ul className="mt-auto space-y-2">
                  {b.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check style={{ width: 14, height: 14, color: "#00c07f", flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <p style={{ fontSize: 11, color: "#444", fontFamily: "monospace", letterSpacing: "1px" }}>
            © PRAXIS 2026 — Marketing Médico de Alto Padrão
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/planos"
              className="transition-colors"
              style={{ fontSize: 12, color: "#444" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#00c07f")}
              onMouseLeave={e => (e.currentTarget.style.color = "#444")}
            >
              Planos
            </Link>
            <Link
              href="/login"
              className="transition-colors"
              style={{ fontSize: 12, color: "#444" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#00c07f")}
              onMouseLeave={e => (e.currentTarget.style.color = "#444")}
            >
              Entrar
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
