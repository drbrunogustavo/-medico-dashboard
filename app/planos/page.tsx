"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, X, Zap, Star, Crown } from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Feature {
  text:    string
  starter: boolean
  pro:     boolean
  elite:   boolean
}

const FEATURES: Feature[] = [
  { text: "Gerador de Roteiros",         starter: true,  pro: true,  elite: true  },
  { text: "Gerador de Legendas",         starter: true,  pro: true,  elite: true  },
  { text: "Biblioteca de Ganchos",       starter: true,  pro: true,  elite: true  },
  { text: "Banco de Pautas",             starter: true,  pro: true,  elite: true  },
  { text: "Radar de Tendências",         starter: false, pro: true,  elite: true  },
  { text: "Detector de Oportunidades",   starter: false, pro: true,  elite: true  },
  { text: "Raio-X de Pacientes",         starter: false, pro: true,  elite: true  },
  { text: "Mapa de Objeções",            starter: false, pro: true,  elite: true  },
  { text: "Diretor Criativo (Imagens)",  starter: false, pro: true,  elite: true  },
  { text: "Gerador de Polêmicas",        starter: false, pro: true,  elite: true  },
  { text: "Monitor de Referências",      starter: false, pro: true,  elite: true  },
  { text: "Gerador de Ofertas",          starter: false, pro: true,  elite: true  },
  { text: "Agente Executivo",            starter: false, pro: false, elite: true  },
  { text: "Lab. de Viralização",         starter: false, pro: false, elite: true  },
  { text: "Agente WhatsApp",             starter: false, pro: false, elite: true  },
]

const PLANS = [
  {
    id:      "starter",
    name:    "Starter",
    price:   97,
    badge:   null as string | null,
    icon:    Zap,
    color:   "#aaaaaa",
    border:  "rgba(255,255,255,0.10)",
    limits:  "30 gerações/mês",
    support: "Suporte por email",
  },
  {
    id:      "pro",
    name:    "Pro",
    price:   197,
    badge:   "RECOMENDADO",
    icon:    Star,
    color:   "#00c07f",
    border:  "rgba(0,192,127,0.30)",
    limits:  "200 gerações/mês",
    support: "Suporte por WhatsApp",
  },
  {
    id:      "elite",
    name:    "Elite",
    price:   397,
    badge:   "ELITE",
    icon:    Crown,
    color:   "#d4af37",
    border:  "rgba(212,175,55,0.25)",
    limits:  "Gerações ilimitadas",
    support: "WhatsApp prioritário + onboarding 1:1",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanosPage() {
  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto"
      style={{ background: "#0a0a0a" }}
    >
      {/* Gradient mesh */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(0,192,127,0.06) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.05) 0%, transparent 50%)
        `,
      }} />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{
          height: 64,
          background: "rgba(10,10,10,0.88)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="PRAXIS">
            <circle cx="16" cy="16" r="14" stroke="#00c07f" strokeWidth="1.5"
              strokeLinecap="round" strokeDasharray="70 18" strokeDashoffset="12" opacity="0.6" />
            <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke="#f5f5f7"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="18" y1="14" x2="23" y2="22" stroke="#00c07f"
              strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          </svg>
          <span style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: 15, fontWeight: 600, letterSpacing: "4px",
            color: "#f0f0f0",
          }}>
            PRAXIS
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-[12px] font-medium transition-colors"
            style={{ color: "#888" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ccc")}
            onMouseLeave={e => (e.currentTarget.style.color = "#888")}
          >
            Já tenho conta
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all hover:opacity-90"
            style={{ background: "#00c07f", color: "#080808" }}
          >
            Entrar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      <div className="relative max-w-5xl mx-auto px-4 md:px-8 pt-10 pb-20 space-y-14">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] transition-colors"
          style={{ color: "#555" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#888")}
          onMouseLeave={e => (e.currentTarget.style.color = "#555")}
        >
          <ArrowLeft className="w-3 h-3" />
          Voltar para o início
        </Link>

        {/* Page header */}
        <div className="text-center max-w-xl mx-auto">
          <div style={{
            fontSize: 10, fontFamily: "monospace", color: "#00c07f",
            letterSpacing: "3px", textTransform: "uppercase", marginBottom: 16,
          }}>
            PLANOS E PREÇOS
          </div>
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(24px, 4vw, 40px)",
            fontWeight: 600, color: "#f0f0f0", marginBottom: 16,
          }}>
            Invista na sua presença digital.
          </h1>
          <p style={{ fontSize: 14, color: "#888", lineHeight: 1.8 }}>
            Escolha o plano ideal para seu momento. Cancele quando quiser —
            sem fidelidade, sem burocracia.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${plan.border}`,
                  boxShadow: plan.id === "pro" ? "0 0 40px rgba(0,192,127,0.06)" : "none",
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span style={{
                      display: "block",
                      fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                      padding: "3px 14px", borderRadius: 999, letterSpacing: "2px",
                      background: plan.color, color: "#080808",
                    }}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${plan.color}18`,
                      border: `1px solid ${plan.color}35`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon style={{ width: 18, height: 18, color: plan.color }} />
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f0f0" }}>
                      {plan.name}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "#555" }}>R$</span>
                      <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: plan.color }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 12, color: "#555" }}>/mês</span>
                    </div>
                  </div>

                  {/* Limits + support */}
                  <div className="space-y-2 mb-5">
                    {[plan.limits, plan.support].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: plan.color, flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 12, color: "#aaa" }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />

                  {/* Features */}
                  <div className="flex-1 space-y-2 mb-7">
                    {FEATURES.map((f, i) => {
                      const included = plan.id === "starter" ? f.starter
                                     : plan.id === "pro"     ? f.pro
                                     : f.elite
                      return (
                        <div key={i} className="flex items-center gap-2.5">
                          {included
                            ? <Check style={{ width: 13, height: 13, color: plan.color, flexShrink: 0 }} />
                            : <X     style={{ width: 13, height: 13, color: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
                          }
                          <span style={{
                            fontSize: 12, lineHeight: 1.4,
                            color: included ? "#aaa" : "rgba(255,255,255,0.2)",
                          }}>
                            {f.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* CTA → /login only */}
                  <Link
                    href="/login"
                    className="block text-center py-3.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: plan.id === "pro" ? plan.color : `${plan.color}18`,
                      color: plan.id === "pro" ? "#080808" : plan.color,
                      border: plan.id === "pro" ? "none" : `1px solid ${plan.color}35`,
                    }}
                  >
                    Começar com {plan.name}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-center" style={{ fontSize: 12, color: "#444" }}>
          Acesso imediato após confirmação do pagamento. Processado com segurança pelo Stripe.
          Dados privados e protegidos.
        </p>
      </div>

      {/* Footer */}
      <footer className="relative px-6 py-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <p style={{ fontSize: 11, fontFamily: "monospace", color: "#333", letterSpacing: "1px" }}>
            © PRAXIS 2026 — Marketing Médico de Alto Padrão
          </p>
          <Link
            href="/"
            style={{ fontSize: 12, color: "#444" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#00c07f")}
            onMouseLeave={e => (e.currentTarget.style.color = "#444")}
          >
            ← Voltar para o início
          </Link>
        </div>
      </footer>
    </div>
  )
}
