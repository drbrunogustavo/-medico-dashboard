"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check, ChevronDown, Zap, Star, Crown } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

// ─── Intersection Observer animation ─────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref  = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect() }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    inView ? 1 : 0,
        transform:  inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SOCIAL_FEATURES = [
  "Gerador de roteiros para Reels",
  "Legendas que convertem seguidores em pacientes",
  "Calendário editorial inteligente com IA",
  "Análise de concorrentes da sua especialidade",
]

const CLINICA_FEATURES = [
  "Agenda inteligente integrada ao MedX",
  "Copiloto de consulta com IA",
  "Nutrição automática de leads e pacientes",
  "Controle financeiro por unidade",
]

const METRICS = [
  {
    value: "10x",
    label: "mais rápido",
    sub: "para criar conteúdo médico de qualidade profissional",
  },
  {
    value: "15",
    label: "módulos de IA",
    sub: "trabalhando para você 24 horas por dia, 7 dias por semana",
  },
  {
    value: "1",
    label: "plataforma",
    sub: "para marketing e gestão clínica completos e integrados",
  },
]

const PLANS = [
  {
    id:       "starter",
    icon:     Zap,
    name:     "Starter",
    price:    "R$ 97",
    color:    "#8a7a6a",
    border:   "rgba(13,27,42,0.15)",
    badge:    null as string | null,
    features: [
      "30 gerações/mês",
      "Gerador de Roteiros e Legendas",
      "Banco de Pautas",
    ],
  },
  {
    id:       "pro",
    icon:     Star,
    name:     "Pro",
    price:    "R$ 197",
    color:    "#b8976a",
    border:   "rgba(184,151,106,0.35)",
    badge:    "RECOMENDADO",
    features: [
      "200 gerações/mês",
      "Todos os módulos de criação de conteúdo",
      "Radar de Tendências e Oportunidades",
    ],
  },
  {
    id:       "elite",
    icon:     Crown,
    name:     "Elite",
    price:    "R$ 397",
    color:    "#c8a355",
    border:   "rgba(200,163,85,0.30)",
    badge:    "ELITE",
    features: [
      "Gerações ilimitadas",
      "Agente Executivo + Lab. de Viralização",
      "Onboarding 1:1 com especialista",
    ],
  },
]

// ─── Inline logo ──────────────────────────────────────────────────────────────

function LogoLight({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="PRAXIS">
        <circle cx="16" cy="16" r="14" stroke="#b8976a" strokeWidth="1.5"
          strokeLinecap="round" strokeDasharray="70 18" strokeDashoffset="12" opacity="0.7" />
        <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke="#0D1B2A"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="14" x2="23" y2="22" stroke="#b8976a"
          strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </svg>
      <div>
        <div style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontSize: size === 24 ? 13 : 15,
          fontWeight: 600,
          letterSpacing: "4px",
          color: "#0D1B2A",
          lineHeight: 1,
        }}>
          PRAXIS
        </div>
        <div className="hidden sm:block" style={{
          fontSize: 7, letterSpacing: "2px", color: "#8a7a6a",
          textTransform: "uppercase", marginTop: 3,
        }}>
          Marketing Médico de Alto Padrão
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user } = useAuth()
  const ctaHref = user ? "/dashboard" : "/planos"

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: "#F5F0E8" }}>

      {/* Gradient mesh — fixed so it doesn't scroll */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 15% 40%, rgba(184,151,106,0.08) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 15%, rgba(59,130,246,0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 55% 85%, rgba(184,151,106,0.06) 0%, transparent 45%)
        `,
      }} />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{
          height: 64,
          background: "rgba(245,240,232,0.92)",
          borderBottom: "1px solid rgba(13,27,42,0.08)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <LogoLight />

        <div className="flex items-center gap-5">
          <a
            href="#como-funciona"
            className="hidden md:block text-[12px] transition-colors"
            style={{ color: "#6a5a4a" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0D1B2A")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6a5a4a")}
          >
            Como funciona
          </a>
          <Link
            href="/planos"
            className="hidden md:block text-[12px] transition-colors"
            style={{ color: "#6a5a4a" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0D1B2A")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6a5a4a")}
          >
            Planos
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#b8976a", color: "#0D1B2A" }}
          >
            Entrar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28 text-center">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 mb-10"
          style={{
            padding: "6px 18px",
            borderRadius: 999,
            border: "1px solid rgba(184,151,106,0.35)",
            background: "rgba(184,151,106,0.08)",
          }}
        >
          <span
            className="animate-blink"
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#b8976a", flexShrink: 0 }}
          />
          <span style={{
            fontSize: 10, fontFamily: "monospace",
            color: "#b8976a", letterSpacing: "2.5px",
            textTransform: "uppercase",
          }}>
            Plataforma exclusiva para médicos
          </span>
        </div>

        {/* H1 */}
        <h1
          className="mb-8"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(27px, 5vw, 60px)",
            fontWeight: 600,
            lineHeight: 1.1,
            color: "#0D1B2A",
            letterSpacing: "-0.5px",
          }}
        >
          Você passou anos se tornando{" "}
          <span style={{ color: "#b8976a" }}>o melhor médico.</span>
          <br />
          Agora é hora de se tornar{" "}
          <em style={{ fontStyle: "italic" }}>o médico mais conhecido.</em>
        </h1>

        {/* Subheadline */}
        <p
          className="mx-auto mb-12"
          style={{
            fontSize: "clamp(14px, 2vw, 17px)",
            color: "#6a5a4a",
            lineHeight: 1.85,
            maxWidth: 620,
          }}
        >
          PRAXIS é a primeira plataforma de inteligência artificial criada exclusivamente
          para médicos que querem crescer com autoridade, sem abrir mão do consultório.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-95 active:scale-[0.98]"
            style={{
              padding: "16px 36px",
              fontSize: "clamp(14px, 2vw, 15px)",
              background: "#b8976a",
              color: "#0D1B2A",
              boxShadow: "0 0 52px rgba(184,151,106,0.25)",
              minWidth: 210,
              justifyContent: "center",
            }}
          >
            Começar agora <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-xl font-semibold transition-all"
            style={{
              padding: "16px 36px",
              fontSize: "clamp(14px, 2vw, 15px)",
              border: "1px solid rgba(13,27,42,0.15)",
              color: "#6a5a4a",
              minWidth: 210,
              justifyContent: "center",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(13,27,42,0.30)"
              e.currentTarget.style.color = "#0D1B2A"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(13,27,42,0.15)"
              e.currentTarget.style.color = "#6a5a4a"
            }}
          >
            Ver como funciona <ChevronDown className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────────────────────── */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 pb-28">

        <FadeUp className="text-center mb-14">
          <div style={{
            fontSize: 10, fontFamily: "monospace", color: "#b8976a",
            letterSpacing: "3px", textTransform: "uppercase", marginBottom: 16,
          }}>
            COMO FUNCIONA
          </div>
          <h2 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(22px, 4vw, 42px)",
            fontWeight: 600, color: "#0D1B2A", lineHeight: 1.15,
          }}>
            Uma plataforma. Cinco frentes de crescimento.
          </h2>
          <p style={{ fontSize: 15, color: "#6a5a4a", marginTop: 16, maxWidth: 560, margin: "16px auto 0" }}>
            Do conteúdo ao consultório, do financeiro à estratégia — tudo em um único lugar.
          </p>
        </FadeUp>

        {/* Row 1: Social + Consultório */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {[
            {
              emoji: "📱", color: "#b8976a", bg: "rgba(184,151,106,0.04)", border: "rgba(184,151,106,0.18)",
              iconBg: "rgba(184,151,106,0.10)", iconBorder: "rgba(184,151,106,0.25)",
              name: "PRAXIS Social", sub: "Atraia mais pacientes com conteúdo estratégico",
              features: SOCIAL_FEATURES, delay: 80,
            },
            {
              emoji: "🏥", color: "#3b82f6", bg: "rgba(59,130,246,0.04)", border: "rgba(59,130,246,0.15)",
              iconBg: "rgba(59,130,246,0.10)", iconBorder: "rgba(59,130,246,0.22)",
              name: "PRAXIS Consultório", sub: "Converta leads em pacientes fiéis",
              features: CLINICA_FEATURES, delay: 180,
            },
          ].map((m, i) => (
            <FadeUp key={i} delay={m.delay}>
              <div className="h-full rounded-2xl p-8" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                <div className="flex items-center gap-3 mb-7">
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: m.iconBg, border: `1px solid ${m.iconBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  }}>{m.emoji}</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 18, fontWeight: 700, color: "#0D1B2A" }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 12, color: m.color, marginTop: 2 }}>{m.sub}</div>
                  </div>
                </div>
                <ul className="space-y-3.5">
                  {m.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check style={{ width: 15, height: 15, color: m.color, flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 14, color: "#5a4a3a", lineHeight: 1.6 }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Row 2: Executivo + IA + Academy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              emoji: "📊", color: "#7c5cbf", bg: "rgba(124,92,191,0.04)", border: "rgba(124,92,191,0.15)",
              iconBg: "rgba(124,92,191,0.10)", iconBorder: "rgba(124,92,191,0.22)",
              name: "PRAXIS Executivo", sub: "Gerencie e escale sua clínica",
              features: ["Painel financeiro com métricas", "Precificação inteligente de consultas", "KPIs e indicadores da clínica"],
              delay: 100,
            },
            {
              emoji: "✨", color: "#c8931a", bg: "rgba(200,147,26,0.04)", border: "rgba(200,147,26,0.15)",
              iconBg: "rgba(200,147,26,0.10)", iconBorder: "rgba(200,147,26,0.22)",
              name: "PRAXIS IA", sub: "Inteligência estratégica para crescer mais rápido",
              features: ["Posicionamento médico com IA", "Diretor criativo automatizado", "Agente executivo multimodal"],
              delay: 200,
            },
            {
              emoji: "🎓", color: "#c0507a", bg: "rgba(192,80,122,0.04)", border: "rgba(192,80,122,0.15)",
              iconBg: "rgba(192,80,122,0.10)", iconBorder: "rgba(192,80,122,0.22)",
              name: "PRAXIS Academy", sub: "Aprenda a construir uma clínica de sucesso",
              features: ["Conteúdo exclusivo para médicos", "Estratégias de crescimento clínico", "Comunidade de médicos de alto padrão"],
              delay: 300,
            },
          ].map((m, i) => (
            <FadeUp key={i} delay={m.delay}>
              <div className="h-full rounded-2xl p-6" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                <div className="flex items-center gap-3 mb-5">
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: m.iconBg, border: `1px solid ${m.iconBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>{m.emoji}</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 15, fontWeight: 700, color: "#0D1B2A" }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 11, color: m.color, marginTop: 2 }}>{m.sub}</div>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {m.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check style={{ width: 13, height: 13, color: m.color, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 12, color: "#5a4a3a", lineHeight: 1.6 }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Resultados reais ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-28">

        <FadeUp className="text-center mb-14">
          <div style={{
            fontSize: 10, fontFamily: "monospace", color: "#b8976a",
            letterSpacing: "3px", textTransform: "uppercase", marginBottom: 16,
          }}>
            RESULTADOS REAIS
          </div>
          <h2 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(22px, 4vw, 42px)",
            fontWeight: 600, color: "#0D1B2A",
          }}>
            Números que falam por si
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {METRICS.map((m, i) => (
            <FadeUp key={i} delay={i * 90}>
              <div className="text-center rounded-2xl p-10" style={{
                background: "#FFFFFF",
                border: "1px solid rgba(13,27,42,0.10)",
              }}>
                <div style={{
                  fontFamily: "var(--font-playfair), Georgia, serif",
                  fontSize: "clamp(48px, 6vw, 72px)",
                  fontWeight: 700, color: "#b8976a", lineHeight: 1,
                }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#0D1B2A", marginTop: 10 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 12, color: "#6a5a4a", marginTop: 8, lineHeight: 1.7 }}>
                  {m.sub}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Urgência ─────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-28">
        <FadeUp>
          <div
            className="text-center rounded-2xl px-8 py-16 md:px-16 md:py-20"
            style={{
              background: "rgba(184,151,106,0.06)",
              border: "1px solid rgba(184,151,106,0.18)",
            }}
          >
            <div style={{
              fontSize: 10, fontFamily: "monospace", color: "#b8976a",
              letterSpacing: "3px", textTransform: "uppercase", marginBottom: 24,
            }}>
              PARA MÉDICOS QUE NÃO TÊM TEMPO A PERDER
            </div>
            <h2
              className="mb-6"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontSize: "clamp(20px, 3.5vw, 38px)",
                fontWeight: 600, color: "#0D1B2A", lineHeight: 1.25,
              }}
            >
              Enquanto você lê isso, outros médicos<br className="hidden md:block" />
              da sua especialidade estão construindo{" "}
              <span style={{ color: "#b8976a" }}>autoridade digital.</span>
            </h2>
            <p
              className="mx-auto mb-10"
              style={{
                fontSize: 15, color: "#6a5a4a", lineHeight: 1.85, maxWidth: 520,
              }}
            >
              O PRAXIS nivela o campo de jogo — e te coloca à frente.
              Não precisa de agência, não precisa de equipe.
              Apenas a plataforma certa e a sua expertise.
            </p>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-95 active:scale-[0.98]"
              style={{
                padding: "16px 40px",
                fontSize: 15,
                background: "#b8976a",
                color: "#0D1B2A",
                boxShadow: "0 0 40px rgba(184,151,106,0.25)",
              }}
            >
              Quero começar agora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── Planos preview ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-28">

        <FadeUp className="text-center mb-14">
          <div style={{
            fontSize: 10, fontFamily: "monospace", color: "#b8976a",
            letterSpacing: "3px", textTransform: "uppercase", marginBottom: 16,
          }}>
            PLANOS
          </div>
          <h2
            className="mb-4"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(22px, 4vw, 42px)",
              fontWeight: 600, color: "#0D1B2A",
            }}
          >
            Investimento sob medida para cada momento
          </h2>
          <p style={{ fontSize: 14, color: "#6a5a4a" }}>
            Sem fidelidade. Cancele quando quiser.{" "}
            <Link
              href="/planos"
              style={{ color: "#b8976a" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Ver comparativo completo →
            </Link>
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon
            return (
              <FadeUp key={plan.id} delay={i * 80}>
                <div
                  className="relative flex flex-col rounded-2xl h-full"
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${plan.border}`,
                    boxShadow: plan.id === "pro" ? "0 0 40px rgba(184,151,106,0.10)" : "none",
                  }}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span style={{
                        display: "block",
                        fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                        padding: "3px 14px", borderRadius: 999, letterSpacing: "2px",
                        background: plan.color, color: "#0D1B2A",
                      }}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-7 flex flex-col flex-1 gap-5">
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: `${plan.color}18`,
                        border: `1px solid ${plan.color}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon style={{ width: 18, height: 18, color: plan.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0D1B2A" }}>
                          {plan.name}
                        </div>
                        <div style={{ fontSize: 19, fontWeight: 800, color: plan.color, lineHeight: 1.1 }}>
                          {plan.price}
                          <span style={{ fontSize: 11, fontWeight: 400, color: "#8a7a6a" }}>/mês</span>
                        </div>
                      </div>
                    </div>

                    <ul className="flex-1 space-y-2.5">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <Check style={{ width: 13, height: 13, color: plan.color, flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 12, color: "#5a4a3a", lineHeight: 1.5 }}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={ctaHref}
                      className="block text-center py-3.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{
                        background: plan.id === "pro" ? plan.color : `${plan.color}18`,
                        color: plan.id === "pro" ? "#0D1B2A" : plan.color,
                        border: plan.id === "pro" ? "none" : `1px solid ${plan.color}40`,
                      }}
                    >
                      Começar com {plan.name}
                    </Link>
                  </div>
                </div>
              </FadeUp>
            )
          })}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        className="px-6 pb-8 pt-10"
        style={{ borderTop: "1px solid rgba(13,27,42,0.08)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">

            {/* Logo + tagline */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <LogoLight size={24} />
              <p style={{ fontSize: 12, color: "#8a7a6a", textAlign: "center" }}>
                Feito para médicos. Por quem entende de resultado.
              </p>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-7">
              {[
                { label: "Como funciona", href: "#como-funciona", anchor: true },
                { label: "Planos",        href: "/planos",        anchor: false },
                { label: "Entrar",        href: "/login",         anchor: false },
              ].map(item => (
                item.anchor
                  ? (
                    <a key={item.label} href={item.href} style={{ fontSize: 12, color: "#8a7a6a" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#b8976a")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#8a7a6a")}>
                      {item.label}
                    </a>
                  ) : (
                    <Link key={item.label} href={item.href} style={{ fontSize: 12, color: "#8a7a6a" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#b8976a")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#8a7a6a")}>
                      {item.label}
                    </Link>
                  )
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(13,27,42,0.06)", marginBottom: 24 }} />

          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#8a7a6a", letterSpacing: "1px" }}>
              © 2026 PRAXIS. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacidade" style={{ fontSize: 11, color: "#8a7a6a", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#b8976a")}
                onMouseLeave={e => (e.currentTarget.style.color = "#8a7a6a")}>
                Privacidade
              </Link>
              <Link href="/termos" style={{ fontSize: 11, color: "#8a7a6a", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#b8976a")}
                onMouseLeave={e => (e.currentTarget.style.color = "#8a7a6a")}>
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
