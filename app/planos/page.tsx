"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, X, Zap, Star, Crown, Loader2, CalendarDays } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UserPlan {
  plano:     string
  status:    string
  hasStripe: boolean
}

interface PlanDef {
  id:           string
  name:         string
  priceDisplay: string
  priceSub:     string
  badge:        string | null
  highlight:    boolean
  icon:         React.ElementType
  color:        string
  border:       string
  limits:       string
  support:      string
  priceKey:     string
}

// ─── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  { text: "Gerador de Roteiros e Legendas",   starter: true,  pro: true,  elite: true  },
  { text: "Banco de Pautas e Ganchos",         starter: true,  pro: true,  elite: true  },
  { text: "Calendário Editorial",              starter: true,  pro: true,  elite: true  },
  { text: "CRM de Leads",                      starter: true,  pro: true,  elite: true  },
  { text: "Radar de Tendências (IA)",          starter: false, pro: true,  elite: true  },
  { text: "Diretor Criativo (Imagens IA)",     starter: false, pro: true,  elite: true  },
  { text: "Copiloto de Consulta",              starter: false, pro: true,  elite: true  },
  { text: "Pesquisa NPS",                      starter: false, pro: true,  elite: true  },
  { text: "Precificação Inteligente",          starter: false, pro: true,  elite: true  },
  { text: "Indicadores da Clínica",            starter: false, pro: true,  elite: true  },
  { text: "Metas e Planejamento",              starter: false, pro: true,  elite: true  },
  { text: "Calculadoras Clínicas",             starter: false, pro: true,  elite: true  },
  { text: "Painel Executivo",                  starter: false, pro: false, elite: true  },
  { text: "Consultor Estratégico IA",          starter: false, pro: false, elite: true  },
  { text: "Diagnóstico 360° da Clínica",       starter: false, pro: false, elite: true  },
  { text: "Expansão de Clínicas",              starter: false, pro: false, elite: true  },
  { text: "Predição de Crescimento",           starter: false, pro: false, elite: true  },
  { text: "Agente Executivo (WhatsApp)",        starter: false, pro: false, elite: true  },
]

const PLANS: PlanDef[] = [
  {
    id: "starter",      name: "Starter",
    priceDisplay: "R$ 97",   priceSub: "/mês",
    badge: null,  highlight: false,
    icon: Zap,   color: "#aaaaaa", border: "rgba(255,255,255,0.10)",
    limits:  "30 gerações/mês",
    support: "Suporte por email",
    priceKey: "starter",
  },
  {
    id: "pro",          name: "Pro",
    priceDisplay: "R$ 197",  priceSub: "/mês",
    badge: null,  highlight: false,
    icon: Star,  color: "#b8976a", border: "rgba(184,151,106,0.25)",
    limits:  "200 gerações/mês",
    support: "Suporte por WhatsApp",
    priceKey: "pro",
  },
  {
    id: "elite",        name: "Elite",
    priceDisplay: "R$ 397",  priceSub: "/mês",
    badge: "MAIS POPULAR", highlight: true,
    icon: Crown, color: "#d4af37", border: "rgba(212,175,55,0.30)",
    limits:  "Gerações ilimitadas",
    support: "WhatsApp prioritário + onboarding 1:1",
    priceKey: "elite_monthly",
  },
  {
    id: "elite_annual", name: "Elite Anual",
    priceDisplay: "R$ 2.997", priceSub: "/ano",
    badge: "ECONOMIZE 37%", highlight: false,
    icon: CalendarDays, color: "#a78bfa", border: "rgba(167,139,250,0.25)",
    limits:  "Gerações ilimitadas · 12 meses",
    support: "WhatsApp prioritário + onboarding 1:1",
    priceKey: "elite_annual",
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isPlanActive(plan: PlanDef, userPlan: UserPlan | null) {
  if (!userPlan) return false
  if (plan.id === "elite_annual") {
    return userPlan.plano === "elite" && userPlan.hasStripe
  }
  return userPlan.plano === plan.id && userPlan.status === "ativo"
}

// ─── Plan CTA ──────────────────────────────────────────────────────────────────
// authed: true  = logged in
// authed: false = not logged in
// authed: null  = still checking auth

function PlanCTA({
  plan, userPlan, authed, loading, onCheckout, onPortal,
}: {
  plan:      PlanDef
  userPlan:  UserPlan | null
  authed:    boolean | null
  loading:   string | null
  onCheckout: (key: string) => void
  onPortal:  () => void
}) {
  const isCurrent = isPlanActive(plan, userPlan)
  const isLoading = loading === plan.priceKey || (isCurrent && loading === "portal")

  // Still checking auth — show spinner
  if (authed === null) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: plan.color }} />
      </div>
    )
  }

  // Subscribed via Stripe — show portal button
  if (isCurrent && userPlan?.hasStripe) {
    return (
      <button onClick={onPortal} disabled={!!loading}
        className="block w-full text-center py-3.5 rounded-xl text-[13px] font-bold disabled:opacity-50 transition-all hover:opacity-90"
        style={{ background: `${plan.color}18`, color: plan.color, border: `1px solid ${plan.color}35` }}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Gerenciar Assinatura"}
      </button>
    )
  }

  // Active plan without Stripe (trial/manual)
  if (isCurrent) {
    return (
      <div className="block w-full text-center py-3.5 rounded-xl text-[13px] font-semibold"
        style={{ background: `${plan.color}10`, color: plan.color, border: `1px solid ${plan.color}25` }}>
        Plano Atual
      </div>
    )
  }

  // Not logged in — redirect to signup
  if (!authed) {
    return (
      <Link href="/cadastro"
        className="block text-center py-3.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
        style={{
          background: plan.highlight ? plan.color : `${plan.color}18`,
          color:      plan.highlight ? "#0D1B2A" : plan.color,
          border:     plan.highlight ? "none" : `1px solid ${plan.color}35`,
        }}>
        Começar 7 dias grátis
      </Link>
    )
  }

  // Logged in — call Stripe checkout
  return (
    <button
      onClick={() => onCheckout(plan.priceKey)}
      disabled={!!loading}
      className="block w-full text-center py-3.5 rounded-xl text-[13px] font-bold disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98]"
      style={{
        background: plan.highlight ? plan.color : `${plan.color}18`,
        color:      plan.highlight ? "#080808" : plan.color,
        border:     plan.highlight ? "none" : `1px solid ${plan.color}35`,
      }}>
      {isLoading
        ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        : "Começar 7 dias grátis"
      }
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PlanosPage() {
  const router = useRouter()

  // Auth state — independent of plan data
  const { user, loading: authLoading } = useAuth()

  const [userPlan,    setUserPlan]    = useState<UserPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [loading,     setLoading]     = useState<string | null>(null)
  const [stripeError, setStripeError] = useState<string | null>(null)

  const isSuccess = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).has("pagamento")
    : false

  // Derive authentication state from useAuth
  // null = still determining, true/false = resolved
  const authed: boolean | null = authLoading ? null : !!user

  // Only fetch plan details if authenticated
  useEffect(() => {
    if (!user) return
    setPlanLoading(true)
    fetch("/api/planos")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUserPlan(d) })
      .catch(() => {})
      .finally(() => setPlanLoading(false))
  }, [user])

  async function handleCheckout(priceKey: string) {
    console.log("[planos] handleCheckout chamado, priceKey:", priceKey)
    setStripeError(null)
    setLoading(priceKey)
    try {
      const res  = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: priceKey }),
      })
      const data = await res.json()
      console.log("[planos] resposta checkout:", res.status, data)
      if (data.url) {
        console.log("[planos] redirecionando para Stripe:", data.url.substring(0, 60))
        window.location.href = data.url
        return
      }
      setStripeError(data.error ?? "Erro ao iniciar pagamento. Tente novamente.")
    } catch (err) {
      console.error("[planos] erro handleCheckout:", err)
      setStripeError("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setStripeError(null)
    setLoading("portal")
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setStripeError(data.error ?? "Erro ao abrir portal.")
    } catch {
      setStripeError("Erro de conexão.")
    } finally {
      setLoading(null)
    }
  }

  // Show spinner on CTA while plan details are loading (but auth is known)
  const ctaAuthed: boolean | null = authed === null ? null
    : authed && planLoading ? null
    : authed

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: "#F5F0E8" }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(184,151,106,0.07) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 20%, rgba(200,163,85,0.04) 0%, transparent 50%)
        `,
      }} />

      {/* Nav */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{
          height: 64, background: "rgba(245,240,232,0.92)",
          borderBottom: "1px solid rgba(13,27,42,0.08)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        }}>
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#b8976a" strokeWidth="1.5"
              strokeLinecap="round" strokeDasharray="70 18" strokeDashoffset="12" opacity="0.7" />
            <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke="#0D1B2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="18" y1="14" x2="23" y2="22" stroke="#b8976a" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          </svg>
          <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 15, fontWeight: 600, letterSpacing: "4px", color: "#0D1B2A" }}>PRAXIS</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold"
              style={{ background: "#b8976a", color: "#0D1B2A" }}>
              Ir para o App <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <Link href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold"
              style={{ background: "#b8976a", color: "#0D1B2A" }}>
              Entrar <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </nav>

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-10 pb-20 space-y-12">
        <Link href={user ? "/dashboard" : "/"}
          className="inline-flex items-center gap-1.5 text-[11px]"
          style={{ color: "#6a5a4a" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#0D1B2A")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6a5a4a")}>
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>

        {/* Success banner */}
        {isSuccess && (
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: "rgba(184,151,106,0.08)", border: "1px solid rgba(184,151,106,0.30)" }}>
            <Check style={{ width: 16, height: 16, color: "#b8976a", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#b8976a", fontWeight: 600 }}>
              Assinatura ativada com sucesso! Aproveite seus 7 dias grátis.
            </p>
          </div>
        )}

        {/* Stripe error banner */}
        {stripeError && (
          <div className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <span style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0, marginTop: 1 }}>⚠</span>
            <div>
              <p style={{ fontSize: 13, color: "#f87171", fontWeight: 600 }}>Não foi possível abrir o checkout</p>
              <p style={{ fontSize: 12, color: "#f87171", opacity: 0.8, marginTop: 2 }}>{stripeError}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center max-w-xl mx-auto">
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#b8976a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 16 }}>
            PLANOS E PREÇOS
          </div>
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 600, color: "#0D1B2A", marginBottom: 16,
          }}>
            Invista na sua presença digital.
          </h1>
          <p style={{ fontSize: 14, color: "#6a5a4a", lineHeight: 1.8 }}>
            7 dias grátis em qualquer plano. Cancele quando quiser.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {PLANS.map(plan => {
            const Icon      = plan.icon
            const isCurrent = isPlanActive(plan, userPlan)

            return (
              <div key={plan.id} className="relative flex flex-col rounded-2xl"
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${isCurrent ? plan.color + "66" : plan.border}`,
                  boxShadow: plan.highlight ? `0 0 40px ${plan.color}18` : "none",
                }}>
                {(plan.badge || isCurrent) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span style={{
                      display: "block", fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                      padding: "3px 14px", borderRadius: 999, letterSpacing: "2px",
                      background: plan.color, color: "#0D1B2A", whiteSpace: "nowrap",
                    }}>
                      {isCurrent ? "PLANO ATUAL" : plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-5">
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${plan.color}18`, border: `1px solid ${plan.color}35`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon style={{ width: 18, height: 18, color: plan.color }} />
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#0D1B2A" }}>{plan.name}</div>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: plan.color }}>
                        {plan.priceDisplay}
                      </span>
                      <span style={{ fontSize: 12, color: "#8a7a6a" }}>{plan.priceSub}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {[plan.limits, plan.support].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: plan.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#aaa" }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 1, background: "rgba(13,27,42,0.07)", marginBottom: 16 }} />

                  <div className="flex-1 space-y-1.5 mb-6">
                    {FEATURES.map((f, i) => {
                      const included = plan.id === "starter" ? f.starter
                        : plan.id === "pro" ? f.pro : f.elite
                      return (
                        <div key={i} className="flex items-center gap-2">
                          {included
                            ? <Check style={{ width: 12, height: 12, color: plan.color, flexShrink: 0 }} />
                            : <X style={{ width: 12, height: 12, color: "rgba(13,27,42,0.20)", flexShrink: 0 }} />}
                          <span style={{ fontSize: 11, lineHeight: 1.4, color: included ? "#4A3728" : "rgba(13,27,42,0.30)" }}>
                            {f.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <PlanCTA
                    plan={plan}
                    userPlan={userPlan}
                    authed={ctaAuthed}
                    loading={loading}
                    onCheckout={handleCheckout}
                    onPortal={handlePortal}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center" style={{ fontSize: 12, color: "#6a5a4a" }}>
          Acesso imediato após confirmação. 7 dias grátis em qualquer plano. Processado com segurança pelo Stripe.
        </p>
      </div>

      <footer className="relative px-6 py-6" style={{ borderTop: "1px solid rgba(13,27,42,0.08)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <p style={{ fontSize: 11, fontFamily: "monospace", color: "#8a7a6a", letterSpacing: "1px" }}>
            © PRAXIS 2026 — Marketing Médico de Alto Padrão
          </p>
          <Link href={user ? "/dashboard" : "/"} style={{ fontSize: 12, color: "#6a5a4a" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#b8976a")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6a5a4a")}>
            ← Voltar
          </Link>
        </div>
      </footer>
    </div>
  )
}
