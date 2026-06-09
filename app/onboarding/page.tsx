"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PraxisLogo } from "@/components/PraxisLogo"
import { cn } from "@/lib/utils"
import {
  ArrowRight, Zap, Star, Crown, Check, X,
  User, MapPin, Stethoscope, Hash, AtSign,
  Users, Sparkles, Loader2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  nome:          string
  especialidade: string
  crm:           string
  cidade:        string
  instagram:     string
  publico_alvo:  string
  diferencial:   string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ESPECIALIDADES = [
  "Clínica Geral", "Endocrinologia", "Nutrologia", "Cardiologia",
  "Dermatologia", "Ginecologia e Obstetrícia", "Ortopedia", "Neurologia",
  "Psiquiatria", "Pediatria", "Oftalmologia", "Urologia",
  "Oncologia", "Reumatologia", "Nefrologia", "Pneumologia",
  "Gastroenterologia", "Hematologia", "Infectologia", "Medicina do Esporte",
  "Medicina Estética", "Cirurgia Plástica", "Cirurgia Geral", "Outra",
]

const FEATURES = [
  { text: "Gerador de Roteiros",        starter: true,  pro: true,  elite: true  },
  { text: "Gerador de Legendas",        starter: true,  pro: true,  elite: true  },
  { text: "Biblioteca de Ganchos",      starter: true,  pro: true,  elite: true  },
  { text: "Banco de Pautas",            starter: true,  pro: true,  elite: true  },
  { text: "Radar de Tendências",        starter: false, pro: true,  elite: true  },
  { text: "Detector de Oportunidades",  starter: false, pro: true,  elite: true  },
  { text: "Diretor Criativo (Imagens)", starter: false, pro: true,  elite: true  },
  { text: "Análise de Concorrentes",    starter: false, pro: true,  elite: true  },
  { text: "Raio-X de Pacientes",        starter: false, pro: true,  elite: true  },
  { text: "Agente Executivo",           starter: false, pro: false, elite: true  },
  { text: "Ala Clínica Completa",       starter: false, pro: false, elite: true  },
]

const PLANS = [
  {
    id:     "starter",
    name:   "Starter",
    price:  97,
    icon:   Zap,
    color:  "text-text-secondary",
    border: "border-border hover:border-border-hover",
    ctaCls: "bg-white/[0.06] hover:bg-white/[0.10] text-text-secondary",
    limits: "30 gerações/mês",
  },
  {
    id:     "pro",
    name:   "Pro",
    price:  197,
    icon:   Star,
    color:  "text-accent",
    border: "border-accent-border",
    ctaCls: "bg-accent hover:opacity-90 text-background font-bold",
    badge:  "RECOMENDADO",
    limits: "200 gerações/mês",
  },
  {
    id:     "elite",
    name:   "Elite",
    price:  397,
    icon:   Crown,
    color:  "text-[#d4af37]",
    border: "border-[rgba(212,175,55,0.25)] hover:border-[rgba(212,175,55,0.45)]",
    ctaCls: "bg-[#d4af37] hover:bg-[#e0bc40] text-[#080808] font-bold",
    limits: "Gerações ilimitadas",
  },
]

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ n, current }: { n: number; current: number }) {
  const done   = n < current
  const active = n === current
  return (
    <div className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border",
      done   ? "bg-accent border-accent text-background"
             : active ? "bg-accent-dim border-accent text-accent"
             : "bg-surface-2 border-border text-text-muted"
    )}>
      {done ? <Check className="w-3.5 h-3.5" /> : n}
    </div>
  )
}

function ProgressBar({ step }: { step: number }) {
  const labels = ["Início", "Perfil", "Presença", "Plano"]
  return (
    <div className="flex items-center gap-0 mb-10">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <StepDot n={i + 1} current={step} />
            <span className={cn(
              "text-[9px] font-mono tracking-wider whitespace-nowrap",
              step === i + 1 ? "text-accent" : "text-text-muted"
            )}>
              {label.toUpperCase()}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className={cn(
              "h-px w-16 sm:w-24 mx-2 mb-4 transition-all",
              step > i + 1 ? "bg-accent" : "bg-border"
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

function Field({ label, icon: Icon, children }: {
  label: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted tracking-widest uppercase">
        <Icon className="w-3 h-3" /> {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-background border border-border rounded-lg px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router  = useRouter()
  const [step,  setStep]  = useState(1)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<FormData>({
    nome: "", especialidade: "", crm: "", cidade: "",
    instagram: "", publico_alvo: "", diferencial: "",
  })

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const patch = async (extra?: Record<string, unknown>) => {
    setSaving(true)
    try {
      await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...extra }),
      })
    } finally {
      setSaving(false)
    }
  }

  const next = async (extra?: Record<string, unknown>) => {
    await patch(extra)
    setStep(s => s + 1)
  }

  const finish = async (planId: string) => {
    if (planId !== "starter") {
      await patch({ onboarding_completo: true })
      router.push("/planos")
      return
    }
    await patch({ onboarding_completo: true })
    router.push("/")
  }

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto py-8">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <PraxisLogo />
        </div>

        <ProgressBar step={step} />

        {/* ── STEP 1: Boas-vindas ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="text-center animate-fade-in space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-accent" />
              </div>
              <h1
                className="text-[32px] sm:text-[40px] font-semibold text-text-primary leading-tight"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Bem-vindo ao PRAXIS
              </h1>
              <p className="text-[15px] text-text-secondary max-w-md mx-auto leading-relaxed">
                A plataforma de marketing e gestão clínica mais completa para médicos.
                Vamos configurar seu perfil em 3 minutos.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[
                { label: "15 módulos",  sub: "de conteúdo" },
                { label: "IA Claude",   sub: "Sonnet 4" },
                { label: "Multi-spec",  sub: "personalizado" },
              ].map((item, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-4 text-center">
                  <div className="text-[15px] font-bold text-accent">{item.label}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-background text-[14px] font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20"
            >
              Começar configuração <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Perfil Profissional ─────────────────────────────────── */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2
                className="text-[26px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Perfil Profissional
              </h2>
              <p className="text-[13px] text-text-secondary">
                Esses dados personalizam os prompts de IA em todo o sistema.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <Field label="Nome completo" icon={User}>
                <input
                  value={form.nome}
                  onChange={set("nome")}
                  placeholder="Dr. Bruno Gustavo"
                  className={inputCls}
                />
              </Field>

              <Field label="Especialidade" icon={Stethoscope}>
                <select value={form.especialidade} onChange={set("especialidade")} className={inputCls}>
                  <option value="">Selecione a especialidade principal</option>
                  {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="CRM" icon={Hash}>
                  <input
                    value={form.crm}
                    onChange={set("crm")}
                    placeholder="CRM/SP 123456"
                    className={inputCls}
                  />
                </Field>
                <Field label="Cidade" icon={MapPin}>
                  <input
                    value={form.cidade}
                    onChange={set("cidade")}
                    placeholder="São Paulo, SP"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => next()}
                disabled={saving}
                className="text-[12px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
              >
                Pular por agora →
              </button>
              <button
                onClick={() => next()}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-background text-[13px] font-bold hover:opacity-90 transition-all disabled:opacity-50 min-w-[140px] justify-center"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Próximo <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Presença Digital ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2
                className="text-[26px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Presença Digital
              </h2>
              <p className="text-[13px] text-text-secondary">
                Usados pelo Radar, Análise de Concorrentes e Agente Executivo.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <Field label="Instagram" icon={AtSign}>
                <input
                  value={form.instagram}
                  onChange={set("instagram")}
                  placeholder="@drbruno"
                  className={inputCls}
                />
              </Field>

              <Field label="Público-alvo principal" icon={Users}>
                <textarea
                  value={form.publico_alvo}
                  onChange={set("publico_alvo")}
                  placeholder="Ex: Mulheres 35-55 anos com queixas hormonais e interesse em longevidade..."
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                />
              </Field>

              <Field label="Diferencial competitivo" icon={Sparkles}>
                <textarea
                  value={form.diferencial}
                  onChange={set("diferencial")}
                  placeholder="Ex: Abordagem integrativa de endocrinologia com foco em longevidade saudável..."
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => next()}
                disabled={saving}
                className="text-[12px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
              >
                Pular por agora →
              </button>
              <button
                onClick={() => next()}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-background text-[13px] font-bold hover:opacity-90 transition-all disabled:opacity-50 min-w-[140px] justify-center"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Próximo <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Plano ────────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2
                className="text-[26px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Escolha seu plano
              </h2>
              <p className="text-[13px] text-text-secondary">
                Você pode mudar a qualquer momento. Sem fidelidade.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map(plan => {
                const Icon = plan.icon
                return (
                  <div key={plan.id} className={cn(
                    "relative bg-surface border rounded-xl p-5 flex flex-col gap-4 transition-all hover:-translate-y-0.5",
                    plan.border
                  )}>
                    {"badge" in plan && plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="text-[9px] font-mono font-bold px-3 py-1 rounded-full bg-accent text-background border border-accent tracking-widest">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("w-5 h-5 flex-shrink-0", plan.color)} />
                      <span className={cn("text-[15px] font-semibold", plan.color)}>{plan.name}</span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[11px] text-text-muted font-mono">R$</span>
                        <span className={cn("text-[28px] font-bold leading-none", plan.color)}>{plan.price}</span>
                        <span className="text-[11px] text-text-muted">/mês</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-1">{plan.limits}</p>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      {FEATURES.map((f, i) => {
                        const incl = plan.id === "starter" ? f.starter : plan.id === "pro" ? f.pro : f.elite
                        return (
                          <div key={i} className="flex items-center gap-2">
                            {incl
                              ? <Check className="w-3 h-3 text-accent flex-shrink-0" />
                              : <X     className="w-3 h-3 text-text-muted/40 flex-shrink-0" />}
                            <span className={cn("text-[11px] leading-snug", incl ? "text-text-secondary" : "text-text-muted/50")}>
                              {f.text}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => finish(plan.id)}
                      disabled={saving}
                      className={cn(
                        "w-full py-2.5 rounded-lg text-[12px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]",
                        plan.ctaCls
                      )}
                    >
                      {saving
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : plan.id === "starter"
                          ? "Continuar grátis"
                          : `Assinar ${plan.name}`
                      }
                    </button>
                  </div>
                )
              })}
            </div>

            <p className="text-center text-[11px] text-text-muted">
              Pagamento seguro via Stripe. Cancele quando quiser.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
