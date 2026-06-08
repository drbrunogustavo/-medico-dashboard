"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { Check, X, Zap, Star, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Feature {
  text:    string
  starter: boolean
  pro:     boolean
  elite:   boolean
}

// ─── Features list ────────────────────────────────────────────────────────────

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
    id:          "starter",
    name:        "Starter",
    price:       97,
    badge:       null as string | null,
    icon:        Zap,
    color:       "text-text-secondary",
    border:      "border-border",
    borderHover: "hover:border-border-hover",
    cardBg:      "bg-surface",
    ctaBg:       "bg-white/[0.06] hover:bg-white/[0.10]",
    ctaText:     "text-text-secondary",
    limits:      "30 gerações/mês",
    support:     "Suporte por email",
  },
  {
    id:          "pro",
    name:        "Pro",
    price:       197,
    badge:       "RECOMENDADO",
    icon:        Star,
    color:       "text-accent",
    border:      "border-accent-border",
    borderHover: "hover:border-accent/40",
    cardBg:      "bg-surface",
    ctaBg:       "bg-accent hover:opacity-90",
    ctaText:     "text-background font-bold",
    limits:      "200 gerações/mês",
    support:     "Suporte por WhatsApp",
  },
  {
    id:          "elite",
    name:        "Elite",
    price:       397,
    badge:       "ELITE",
    icon:        Crown,
    color:       "text-[#d4af37]",
    border:      "border-[rgba(212,175,55,0.25)]",
    borderHover: "hover:border-[rgba(212,175,55,0.45)]",
    cardBg:      "bg-surface",
    ctaBg:       "bg-[#d4af37] hover:bg-[#e0bc40]",
    ctaText:     "text-[#080808] font-bold",
    limits:      "Gerações ilimitadas",
    support:     "WhatsApp prioritário + onboarding 1:1",
  },
]

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-surface shadow-2xl animate-fade-in"
      style={{ minWidth: 320 }}
    >
      <span className="text-[13px] text-text-primary">{msg}</span>
      <button onClick={onClose} className="ml-auto text-text-muted hover:text-text-primary transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanosPage() {
  const [toast, setToast] = useState<string | null>(null)

  const showToast = () => {
    setToast("Em breve — entre em contato pelo WhatsApp para assinar.")
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Planos PRAXIS" subtitle="ESCOLHA SEU NÍVEL DE ACESSO" />

      <div className="p-4 md:p-8 space-y-8">

        {/* Header */}
        <div className="text-center max-w-xl mx-auto">
          <h2
            className="text-[24px] md:text-[30px] font-semibold text-text-primary mb-3"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Invista na sua presença digital.
          </h2>
          <p className="text-[14px] text-text-secondary leading-relaxed">
            Escolha o plano ideal para seu momento. Cancele quando quiser — sem fidelidade, sem burocracia.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl border transition-all duration-200",
                  plan.cardBg,
                  plan.border,
                  plan.borderHover,
                  plan.id === "pro" && "shadow-lg shadow-accent/5"
                )}
              >
                {/* Recommended badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={cn(
                      "text-[9px] font-mono font-bold px-3 py-1 rounded-full border tracking-widest",
                      plan.id === "pro"
                        ? "bg-accent text-background border-accent"
                        : "bg-[#d4af37] text-[#080808] border-[#d4af37]"
                    )}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center border",
                      plan.id === "starter" ? "border-border bg-white/[0.04]"
                        : plan.id === "pro"    ? "border-accent-border bg-accent-dim"
                        : "bg-[rgba(212,175,55,0.08)] border-[rgba(212,175,55,0.2)]"
                    )}>
                      <Icon className={cn("w-4 h-4", plan.color)} />
                    </div>
                    <div>
                      <div className={cn("text-[16px] font-semibold", plan.color)}>{plan.name}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[11px] text-text-muted font-mono">R$</span>
                      <span className={cn("text-[36px] font-bold leading-none", plan.color)}>{plan.price}</span>
                      <span className="text-[12px] text-text-muted">/mês</span>
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="mb-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-accent" />
                      <span className="text-[12px] text-text-secondary">{plan.limits}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-accent" />
                      <span className="text-[12px] text-text-secondary">{plan.support}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border mb-4" />

                  {/* Features */}
                  <div className="flex-1 space-y-2 mb-6">
                    {FEATURES.map((f, i) => {
                      const included = plan.id === "starter" ? f.starter
                                     : plan.id === "pro"     ? f.pro
                                     : f.elite
                      return (
                        <div key={i} className="flex items-center gap-2.5">
                          {included
                            ? <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                            : <X     className="w-3.5 h-3.5 text-text-muted/40 flex-shrink-0" />}
                          <span className={cn(
                            "text-[12px] leading-snug",
                            included ? "text-text-secondary" : "text-text-muted/50"
                          )}>
                            {f.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={showToast}
                    className={cn(
                      "w-full py-3 rounded-lg text-[13px] transition-all active:scale-[0.98] min-h-[48px]",
                      plan.ctaBg,
                      plan.ctaText
                    )}
                  >
                    Assinar {plan.name}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Comparison note */}
        <p className="text-center text-[11px] text-text-muted max-w-md mx-auto">
          Todos os planos incluem acesso imediato após confirmação do pagamento.
          Suporte disponível em português. Dados seguros e privados.
        </p>

      </div>

      {/* Toast */}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
