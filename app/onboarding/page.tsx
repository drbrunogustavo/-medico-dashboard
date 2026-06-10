"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PraxisLogo } from "@/components/PraxisLogo"
import { cn } from "@/lib/utils"
import {
  ArrowRight, Zap, Star, Crown, Check, X,
  User, MapPin, Stethoscope, Hash, AtSign,
  Users, Sparkles, Loader2, AlertCircle, CalendarDays,
  Megaphone, BarChart3, GraduationCap, Target,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  nome:           string
  especialidade:  string
  crm:            string
  cidade:         string
  instagram:      string
  desafio:        string
  pacientes_mes:  number
  ticket_medio:   number
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

const DESAFIOS = [
  "Agenda vazia",
  "Ticket baixo",
  "Dependência de convênio",
  "Sem presença digital",
  "Quero escalar",
]

const FEATURES = [
  { text: "Gerador de Roteiros e Legendas", starter: true,  pro: true,  elite: true  },
  { text: "Banco de Pautas e Ganchos",       starter: true,  pro: true,  elite: true  },
  { text: "Calendário Editorial",             starter: true,  pro: true,  elite: true  },
  { text: "CRM de Leads",                     starter: true,  pro: true,  elite: true  },
  { text: "Radar de Tendências (IA)",         starter: false, pro: true,  elite: true  },
  { text: "Diretor Criativo + Imagens",       starter: false, pro: true,  elite: true  },
  { text: "Copiloto de Consulta",             starter: false, pro: true,  elite: true  },
  { text: "Painel Executivo + Consultor IA",  starter: false, pro: false, elite: true  },
  { text: "Diagnóstico 360° da Clínica",      starter: false, pro: false, elite: true  },
  { text: "Expansão de Clínicas + Predição",  starter: false, pro: false, elite: true  },
]

interface PlanDef {
  id:           string
  name:         string
  priceDisplay: string
  priceSub:     string
  badge:        string | null
  highlight:    boolean
  icon:         React.ElementType
  color:        string
  colorDark:    string
  border:       string
  limits:       string
  priceKey:     string
}

const PLANS: PlanDef[] = [
  {
    id: "starter",       name: "Starter",
    priceDisplay: "R$ 97",  priceSub: "/mês",
    badge: null,  highlight: false,
    icon: Zap, color: "text-text-secondary", colorDark: "#aaa",
    border: "border-border hover:border-border-hover",
    limits: "30 gerações/mês",
    priceKey: "starter",
  },
  {
    id: "pro",           name: "Pro",
    priceDisplay: "R$ 197", priceSub: "/mês",
    badge: null,  highlight: false,
    icon: Star, color: "text-accent", colorDark: "#00c07f",
    border: "border-accent-border",
    limits: "200 gerações/mês",
    priceKey: "pro",
  },
  {
    id: "elite",         name: "Elite",
    priceDisplay: "R$ 397", priceSub: "/mês",
    badge: "MAIS POPULAR", highlight: true,
    icon: Crown, color: "text-[#d4af37]", colorDark: "#d4af37",
    border: "border-[rgba(212,175,55,0.25)] hover:border-[rgba(212,175,55,0.45)]",
    limits: "Gerações ilimitadas",
    priceKey: "elite_monthly",
  },
  {
    id: "elite_annual",  name: "Elite Anual",
    priceDisplay: "R$ 2.997", priceSub: "/ano",
    badge: "ECONOMIZE 37%", highlight: false,
    icon: CalendarDays, color: "text-purple-400", colorDark: "#a78bfa",
    border: "border-purple-500/20 hover:border-purple-500/40",
    limits: "Ilimitado · 12 meses",
    priceKey: "elite_annual",
  },
]

const ALAS_TOUR = [
  {
    id: "social", icon: Megaphone, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20",
    title: "PRAXIS Social", desc: "Crie conteúdo que atrai pacientes todos os dias",
    href: "/roteiros", cta: "Ver Roteiros",
    highlight: ["Agenda vazia", "Sem presença digital"],
  },
  {
    id: "consultorio", icon: Stethoscope, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20",
    title: "PRAXIS Consultório", desc: "Converta leads em pacientes fiéis com automação",
    href: "/crm", cta: "Abrir CRM",
    highlight: ["Agenda vazia", "Ticket baixo"],
  },
  {
    id: "executivo", icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20",
    title: "PRAXIS Executivo", desc: "Gerencie finanças, indicadores e metas",
    href: "/executivo", cta: "Ver Painel",
    highlight: ["Ticket baixo", "Dependência de convênio"],
  },
  {
    id: "ia", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
    title: "PRAXIS IA", desc: "Estratégias e automações inteligentes para crescer",
    href: "/posicionamento", cta: "Ver Estratégia",
    highlight: ["Quero escalar", "Dependência de convênio"],
  },
  {
    id: "academy", icon: GraduationCap, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20",
    title: "PRAXIS Academy", desc: "Aprenda a construir uma clínica de alto padrão",
    href: "/academy", cta: "Ver Academy",
    highlight: ["Quero escalar"],
  },
]

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ n, current, total }: { n: number; current: number; total: number }) {
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
  const labels = ["Início", "Perfil", "Cenário", "Plano", "Tour"]
  const total = labels.length
  return (
    <div className="flex items-center gap-0 mb-10">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <StepDot n={i + 1} current={step} total={total} />
            <span className={cn(
              "text-[9px] font-mono tracking-wider whitespace-nowrap",
              step === i + 1 ? "text-accent" : "text-text-muted"
            )}>
              {label.toUpperCase()}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className={cn(
              "h-px w-12 sm:w-20 mx-2 mb-4 transition-all",
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
  label: string; icon: React.ElementType; children: React.ReactNode
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
  const router = useRouter()
  const [step,      setStep]      = useState(1)
  const [saving,    setSaving]    = useState(false)
  const [erroFinal, setErroFinal] = useState("")

  const [form, setForm] = useState<FormData>({
    nome: "", especialidade: "", crm: "", cidade: "",
    instagram: "", desafio: "", pacientes_mes: 50, ticket_medio: 500,
  })

  const set = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const saveProfile = async (extra?: Record<string, unknown>) => {
    await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ...extra }),
    }).catch(() => null)
  }

  const next = async (extra?: Record<string, unknown>) => {
    setSaving(true)
    await saveProfile(extra)
    setSaving(false)
    setStep(s => s + 1)
  }

  const goTrial = async () => {
    setSaving(true)
    setErroFinal("")
    try {
      await saveProfile()
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completo: true }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        setErroFinal(json.error ?? `Erro ${res.status}`)
        return
      }
      setStep(5)
    } catch {
      setErroFinal("Erro de conexão.")
    } finally {
      setSaving(false)
    }
  }

  const choosePlan = async (priceKey: string) => {
    setSaving(true)
    setErroFinal("")
    try {
      await saveProfile({ onboarding_completo: true })
      const res  = await fetch("/api/stripe/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: priceKey }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setErroFinal(data.error ?? "Erro ao gerar checkout.")
    } catch {
      setErroFinal("Erro de conexão com o Stripe.")
    } finally {
      setSaving(false)
    }
  }

  const finishTour = async () => {
    router.push("/dashboard")
  }

  const nome = form.nome ? `Dr. ${form.nome.replace(/^Dr\.?\s*/i, "")}` : "Doutor(a)"

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto py-8">

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
              <h1 className="text-[32px] sm:text-[38px] font-semibold text-text-primary leading-tight"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Bem-vindo ao PRAXIS
              </h1>
              <p className="text-[15px] text-text-secondary max-w-md mx-auto leading-relaxed">
                Vamos configurar sua plataforma em 3 minutos e personalizar cada módulo para sua realidade clínica.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[
                { label: "36+",         sub: "módulos de IA" },
                { label: "5 alas",      sub: "integradas"    },
                { label: "7 dias",      sub: "grátis"        },
              ].map((item, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-4 text-center">
                  <div className="text-[15px] font-bold text-accent">{item.label}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-background text-[14px] font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20">
              Começar configuração <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Perfil ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-[26px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Perfil Profissional
              </h2>
              <p className="text-[13px] text-text-secondary">
                Esses dados personalizam os prompts de IA em todo o sistema.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <Field label="Nome completo" icon={User}>
                <input value={form.nome} onChange={set("nome")} placeholder="Dr. Bruno Gustavo" className={inputCls} />
              </Field>
              <Field label="Especialidade" icon={Stethoscope}>
                <select value={form.especialidade} onChange={set("especialidade")} className={inputCls}>
                  <option value="">Selecione a especialidade principal</option>
                  {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="CRM" icon={Hash}>
                  <input value={form.crm} onChange={set("crm")} placeholder="CRM/SP 123456" className={inputCls} />
                </Field>
                <Field label="Cidade" icon={MapPin}>
                  <input value={form.cidade} onChange={set("cidade")} placeholder="São Paulo, SP" className={inputCls} />
                </Field>
              </div>
              <Field label="Instagram" icon={AtSign}>
                <input value={form.instagram} onChange={set("instagram")} placeholder="@drbruno" className={inputCls} />
              </Field>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => next()} disabled={saving}
                className="text-[12px] text-text-muted hover:text-text-secondary transition-colors">
                Pular por agora →
              </button>
              <button onClick={() => next()} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-background text-[13px] font-bold hover:opacity-90 disabled:opacity-50 min-w-[140px] justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Próximo <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Posicionamento ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-[26px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Seu cenário atual
              </h2>
              <p className="text-[13px] text-text-secondary">
                Isso nos ajuda a destacar os módulos mais relevantes para você.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
              {/* Desafio pills */}
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted tracking-widest uppercase">
                  <Target className="w-3 h-3" /> Qual seu maior desafio hoje?
                </label>
                <div className="flex flex-wrap gap-2">
                  {DESAFIOS.map(d => (
                    <button key={d} type="button"
                      onClick={() => setForm(f => ({ ...f, desafio: d }))}
                      className={cn(
                        "text-[12px] px-3 py-2 rounded-lg border transition-all",
                        form.desafio === d
                          ? "bg-accent-dim border-accent-border text-accent font-medium"
                          : "border-border text-text-muted hover:text-text-secondary"
                      )}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pacientes slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted tracking-widest uppercase">
                    <Users className="w-3 h-3" /> Pacientes por mês
                  </label>
                  <span className="text-[13px] font-semibold text-accent">{form.pacientes_mes}</span>
                </div>
                <input type="range" min={5} max={500} step={5}
                  value={form.pacientes_mes}
                  onChange={e => setForm(f => ({ ...f, pacientes_mes: Number(e.target.value) }))}
                  className="w-full accent-accent" />
                <div className="flex justify-between text-[10px] text-text-muted font-mono">
                  <span>5</span><span>500</span>
                </div>
              </div>

              {/* Ticket slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted tracking-widest uppercase">
                    <Zap className="w-3 h-3" /> Ticket médio atual (R$)
                  </label>
                  <span className="text-[13px] font-semibold text-accent">
                    R$ {form.ticket_medio.toLocaleString("pt-BR")}
                  </span>
                </div>
                <input type="range" min={100} max={5000} step={50}
                  value={form.ticket_medio}
                  onChange={e => setForm(f => ({ ...f, ticket_medio: Number(e.target.value) }))}
                  className="w-full accent-accent" />
                <div className="flex justify-between text-[10px] text-text-muted font-mono">
                  <span>R$ 100</span><span>R$ 5.000</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="text-[12px] text-text-muted hover:text-text-secondary transition-colors">
                ← Voltar
              </button>
              <button onClick={() => next()} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-background text-[13px] font-bold hover:opacity-90 disabled:opacity-50 min-w-[140px] justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Próximo <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Plano ────────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-[26px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Escolha seu plano
              </h2>
              <p className="text-[13px] text-text-secondary">
                7 dias grátis em qualquer plano. Sem fidelidade.
              </p>
            </div>

            {erroFinal && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-400">{erroFinal}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLANS.map(plan => {
                const Icon = plan.icon
                return (
                  <div key={plan.id} className={cn(
                    "relative bg-surface border rounded-xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5",
                    plan.border
                  )}>
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className={cn(
                          "text-[9px] font-mono font-bold px-3 py-1 rounded-full border tracking-widest",
                          plan.highlight
                            ? "bg-[#d4af37] text-background border-[#d4af37]"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        )}>
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
                        <span className={cn("text-[24px] font-bold leading-none", plan.color)}>{plan.priceDisplay}</span>
                        <span className="text-[11px] text-text-muted">{plan.priceSub}</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-1">{plan.limits}</p>
                    </div>

                    <div className="flex-1 space-y-1">
                      {FEATURES.map((f, i) => {
                        const incl = plan.id === "starter" ? f.starter
                          : plan.id === "pro" ? f.pro : f.elite
                        return (
                          <div key={i} className="flex items-center gap-2">
                            {incl
                              ? <Check className="w-3 h-3 text-accent flex-shrink-0" />
                              : <X className="w-3 h-3 text-text-muted/40 flex-shrink-0" />}
                            <span className={cn("text-[10px] leading-snug", incl ? "text-text-secondary" : "text-text-muted/50")}>
                              {f.text}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    <button onClick={() => choosePlan(plan.priceKey)} disabled={saving}
                      className={cn(
                        "w-full py-2.5 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]",
                        plan.highlight
                          ? "bg-[#d4af37] hover:bg-[#e0bc40] text-[#080808]"
                          : plan.id === "pro"
                            ? "bg-accent hover:opacity-90 text-background"
                            : plan.id === "elite_annual"
                              ? "bg-purple-500/10 hover:bg-purple-500/15 text-purple-400 border border-purple-500/20"
                              : "bg-white/[0.06] hover:bg-white/[0.10] text-text-secondary"
                      )}>
                      {saving
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : "Começar 7 dias grátis"}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col items-center gap-3">
              <button onClick={goTrial} disabled={saving}
                className="text-[12px] text-text-muted hover:text-text-secondary transition-colors underline underline-offset-4">
                Continuar no trial gratuito →
              </button>
              <p className="text-[10px] text-text-muted">Pagamento seguro via Stripe. Cancele quando quiser.</p>
            </div>
          </div>
        )}

        {/* ── STEP 5: Tour guiado ──────────────────────────────────────────── */}
        {step === 5 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-[26px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Tudo pronto, {nome}!
              </h2>
              <p className="text-[13px] text-text-secondary">
                Explore as alas do PRAXIS. Começamos pela sua maior prioridade.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALAS_TOUR.map(ala => {
                const Icon     = ala.icon
                const isHighlight = form.desafio && ala.highlight.includes(form.desafio)
                return (
                  <div key={ala.id} className={cn(
                    "rounded-xl border p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5",
                    isHighlight ? `${ala.bg} ${ala.border}` : "bg-surface border-border hover:border-border-hover"
                  )}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0", ala.bg, ala.border)}>
                        <Icon className={cn("w-4 h-4", ala.color)} />
                      </div>
                      <div>
                        <div className={cn("text-[12px] font-bold", isHighlight ? ala.color : "text-text-primary")}>
                          {ala.title}
                          {isHighlight && (
                            <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-accent-dim text-accent border border-accent-border">
                              RECOMENDADO
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted">{ala.desc}</p>
                      </div>
                    </div>
                    <a href={ala.href}
                      className={cn(
                        "text-center py-2 rounded-lg text-[11px] font-semibold transition-colors",
                        isHighlight
                          ? `${ala.bg} ${ala.color} border ${ala.border} hover:opacity-80`
                          : "bg-surface-2 text-text-muted hover:text-text-primary border border-border"
                      )}>
                      {ala.cta} →
                    </a>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-center mt-4">
              <button onClick={finishTour}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-background text-[14px] font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20">
                Entrar no PRAXIS <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
