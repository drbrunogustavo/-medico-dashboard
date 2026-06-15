"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { PraxisLogo } from "@/components/PraxisLogo"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  ArrowRight, Zap, Star, Crown, Check, X,
  User, MapPin, Stethoscope, Hash, AtSign,
  Users, Sparkles, Loader2, AlertCircle,
  Megaphone, BarChart3, GraduationCap, Target,
  Camera, TrendingUp, Calendar, DollarSign,
  Activity, Building, Smartphone,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  nome:                string
  especialidade:       string
  crm:                 string
  cidade:              string
  estado:              string
  instagram:           string
  anos_experiencia:    number
  desafios:            string[]
  pacientes_mes:       number
  ticket_medio:        number
  conteudo_frequencia: string
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

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
]

const DESAFIOS_LIST = [
  { id: "agenda",     label: "Agenda vazia ou pouco ocupada",         icon: "📅" },
  { id: "ticket",     label: "Ticket médio baixo",                    icon: "💰" },
  { id: "convenio",   label: "Dependência de convênios",              icon: "🏥" },
  { id: "digital",    label: "Sem presença digital",                  icon: "📱" },
  { id: "captacao",   label: "Dificuldade de captar novos pacientes", icon: "👥" },
  { id: "indicadores",label: "Não consigo acompanhar os indicadores", icon: "📊" },
  { id: "escalar",    label: "Quero escalar e abrir nova unidade",    icon: "🚀" },
]

const CONTEUDO_FREQUENCIA = [
  "Não produzo",
  "Às vezes",
  "1–2x/semana",
  "Todo dia",
]

const PLANOS = [
  {
    id: "starter", name: "Starter", price: "R$ 97", sub: "/mês",
    badge: "7 dias grátis", highlight: false,
    icon: Zap, color: "#64748b",
    limits: "30 gerações/mês",
    features: ["Roteiros e Legendas", "Banco de Pautas", "CRM básico"],
    priceKey: "starter",
  },
  {
    id: "pro", name: "Pro", price: "R$ 197", sub: "/mês",
    badge: "7 dias grátis", highlight: false,
    icon: Star, color: "#b8976a",
    limits: "200 gerações/mês",
    features: ["Tudo do Starter", "Radar de Tendências IA", "Diretor Criativo + Imagens", "Copiloto de Consulta"],
    priceKey: "pro",
  },
  {
    id: "elite", name: "Elite", price: "R$ 397", sub: "/mês",
    badge: "RECOMENDADO", highlight: true,
    icon: Crown, color: "#b8976a",
    limits: "Gerações ilimitadas",
    features: ["Tudo do Pro", "Painel Executivo", "Diagnóstico 360°", "Expansão e Predição IA"],
    priceKey: "elite_monthly",
  },
]

const ALAS_TOUR = [
  {
    id: "social", Icon: Megaphone, color: "#b8976a",
    title: "PRAXIS Social", desc: "Crie conteúdo que atrai pacientes todos os dias",
    href: "/roteiros", cta: "Ver Roteiros",
    triggers: ["agenda", "digital", "captacao"],
  },
  {
    id: "crm", Icon: Users, color: "#3b82f6",
    title: "PRAXIS CRM", desc: "Converta leads em pacientes com automação",
    href: "/crm", cta: "Abrir CRM",
    triggers: ["agenda", "captacao", "ticket"],
  },
  {
    id: "executivo", Icon: BarChart3, color: "#8b5cf6",
    title: "PRAXIS Executivo", desc: "Gerencie finanças, indicadores e metas",
    href: "/executivo", cta: "Ver Painel",
    triggers: ["ticket", "convenio", "indicadores"],
  },
  {
    id: "ia", Icon: Sparkles, color: "#f59e0b",
    title: "Consultor Estratégico IA", desc: "Estratégias e automações inteligentes",
    href: "/posicionamento", cta: "Ver Estratégia",
    triggers: ["escalar", "convenio"],
  },
  {
    id: "academy", Icon: GraduationCap, color: "#ec4899",
    title: "PRAXIS Academy", desc: "Construa uma clínica de alto padrão",
    href: "/academy", cta: "Ver Academy",
    triggers: ["escalar", "indicadores"],
  },
]

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG      = "#F5F0E8"
const GOLD    = "#b8976a"
const DARK    = "#0D1B2A"
const TEXT2   = "#6a5a4a"
const CARD_BG = "#FFFFFF"
const BORDER  = "#e8ddd0"

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const labels = ["Início", "Perfil", "Diagnóstico", "Plano", "Tour"]
  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between mb-3">
        {labels.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border"
                style={{
                  background: done ? GOLD : active ? `${GOLD}22` : CARD_BG,
                  borderColor: done || active ? GOLD : BORDER,
                  color: done ? "#fff" : active ? GOLD : TEXT2,
                }}>
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span className="text-[9px] font-mono tracking-wider" style={{ color: active ? GOLD : TEXT2 }}>
                {label.toUpperCase()}
              </span>
            </div>
          )
        })}
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: BORDER }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / (total - 1)) * 100}%`, background: GOLD }}
        />
      </div>
    </div>
  )
}

function GoldBtn({
  onClick, disabled, loading, children, full, secondary,
}: {
  onClick?: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; full?: boolean; secondary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all disabled:opacity-40",
        full ? "w-full" : "",
        secondary
          ? "text-sm underline underline-offset-4"
          : "hover:opacity-90 shadow-sm"
      )}
      style={secondary
        ? { color: TEXT2 }
        : { background: GOLD, color: "#fff" }
      }>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  )
}

function InputField({ label, icon: Icon, children }: {
  label: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest uppercase" style={{ color: TEXT2 }}>
        <Icon className="w-3 h-3" /> {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: CARD_BG,
  border: `1px solid ${BORDER}`,
  color: DARK,
  borderRadius: "0.5rem",
  padding: "0.75rem 1rem",
  fontSize: "0.8125rem",
  width: "100%",
  outline: "none",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step,      setStep]     = useState(1)
  const [saving,    setSaving]   = useState(false)
  const [erroMsg,   setErroMsg]  = useState("")
  const [terms,     setTerms]    = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    nome: "", especialidade: "", crm: "", cidade: "", estado: "SP",
    instagram: "", anos_experiencia: 5,
    desafios: [], pacientes_mes: 50, ticket_medio: 500,
    conteudo_frequencia: "",
  })

  const setF = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const toggleDesafio = (id: string) => {
    setForm(f => {
      const already = f.desafios.includes(id)
      if (already) return { ...f, desafios: f.desafios.filter(d => d !== id) }
      if (f.desafios.length >= 2) return f
      return { ...f, desafios: [...f.desafios, id] }
    })
  }

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarUrl(url)
  }

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

  const choosePlan = async (priceKey: string) => {
    setSaving(true)
    setErroMsg("")
    try {
      await saveProfile({ onboarding_completo: true, termos_aceitos: terms })
      // Fire welcome email before redirecting to Stripe
      const perfil = await fetch("/api/perfil").then(r => r.json()).catch(() => null) as { email?: string; nome?: string } | null
      if (perfil?.email && perfil?.nome) {
        fetch("/api/email/boas-vindas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: perfil.nome, email: perfil.email }),
        }).catch(() => null)
      }
      const res  = await fetch("/api/stripe/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: priceKey }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) { window.location.href = data.url; return }
      setErroMsg(data.error ?? "Erro ao gerar checkout.")
    } catch {
      setErroMsg("Erro de conexão com o Stripe.")
    } finally {
      setSaving(false)
    }
  }

  const goTrial = async () => {
    setSaving(true)
    setErroMsg("")
    try {
      await saveProfile({ onboarding_completo: true, termos_aceitos: terms })
      // Dispatch welcome email (fire-and-forget — don't block UX)
      const perfil = await fetch("/api/perfil").then(r => r.json()).catch(() => null) as { email?: string; nome?: string } | null
      if (perfil?.email && perfil?.nome) {
        fetch("/api/email/boas-vindas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: perfil.nome, email: perfil.email }),
        }).catch(() => null)
      }
      setStep(5)
    } catch {
      setErroMsg("Erro de conexão.")
    } finally {
      setSaving(false)
    }
  }

  const nome = form.nome ? `Dr. ${form.nome.replace(/^Dr\.?\s*/i, "")}` : "Doutor(a)"

  // Find most relevant ala based on desafios
  const topAla = ALAS_TOUR.find(a => a.triggers.some(t => form.desafios.includes(t))) ?? ALAS_TOUR[0]

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto" style={{ background: BG }}>
      <div className="w-full max-w-2xl mx-auto px-4 py-8">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <PraxisLogo />
        </div>

        {/* Progress */}
        <ProgressBar step={step} total={5} />

        {/* ── ETAPA 1 — Boas-vindas ───────────────────────────────────────── */}
        {step === 1 && (
          <div className="text-center animate-fade-in space-y-8">
            <div className="space-y-5">
              <div
                className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center"
                style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}40` }}>
                <Sparkles className="w-10 h-10" style={{ color: GOLD }} />
              </div>
              <div>
                <h1 className="text-[32px] sm:text-[40px] font-semibold leading-tight" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                  Bem-vindo ao PRAXIS!
                </h1>
                <p className="text-[15px] mt-3 max-w-md mx-auto leading-relaxed" style={{ color: TEXT2 }}>
                  Vamos configurar sua plataforma em 3 minutos e personalizar cada módulo para sua realidade clínica.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {[
                { label: "36+",    sub: "módulos de IA", icon: Sparkles   },
                { label: "5 alas", sub: "integradas",    icon: Building   },
                { label: "7 dias", sub: "grátis",        icon: Calendar   },
              ].map(({ label, sub, icon: Icon }, i) => (
                <div key={i} className="rounded-xl p-4 text-center" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                  <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: GOLD }} />
                  <div className="text-[15px] font-bold" style={{ color: GOLD }}>{label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: TEXT2 }}>{sub}</div>
                </div>
              ))}
            </div>

            <GoldBtn onClick={() => setStep(2)}>
              Começar configuração <ArrowRight className="w-4 h-4" />
            </GoldBtn>
          </div>
        )}

        {/* ── ETAPA 2 — Perfil ────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-[26px] font-semibold" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Perfil Profissional
              </h2>
              <p className="text-[13px]" style={{ color: TEXT2 }}>
                Esses dados personalizam toda a plataforma.
              </p>
            </div>

            <div className="rounded-2xl p-6 space-y-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>

              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden"
                  style={{ background: `${GOLD}12`, border: `2px dashed ${GOLD}50` }}
                  onClick={() => fileRef.current?.click()}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <Camera className="w-7 h-7" style={{ color: GOLD }} />
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                <button className="text-[11px]" style={{ color: TEXT2 }} onClick={() => fileRef.current?.click()}>
                  Foto de perfil (opcional)
                </button>
              </div>

              <InputField label="Nome completo" icon={User}>
                <input
                  value={form.nome}
                  onChange={setF("nome")}
                  placeholder="Dr. João Silva"
                  style={inputStyle}
                />
              </InputField>

              <InputField label="Especialidade principal" icon={Stethoscope}>
                <select value={form.especialidade} onChange={setF("especialidade")} style={inputStyle}>
                  <option value="">Selecione a especialidade</option>
                  {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </InputField>

              <InputField label="CRM" icon={Hash}>
                <input value={form.crm} onChange={setF("crm")} placeholder="CRM/SP 123456" style={inputStyle} />
              </InputField>

              <div className="grid grid-cols-2 gap-3">
                <InputField label="Cidade" icon={MapPin}>
                  <input value={form.cidade} onChange={setF("cidade")} placeholder="São Paulo" style={inputStyle} />
                </InputField>
                <InputField label="Estado" icon={MapPin}>
                  <select value={form.estado} onChange={setF("estado")} style={inputStyle}>
                    {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </InputField>
              </div>

              <InputField label="Instagram" icon={AtSign}>
                <input value={form.instagram} onChange={setF("instagram")} placeholder="@drbruno" style={inputStyle} />
              </InputField>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono tracking-widest uppercase" style={{ color: TEXT2 }}>
                    Anos de experiência
                  </label>
                  <span className="text-[15px] font-bold" style={{ color: GOLD }}>{form.anos_experiencia}</span>
                </div>
                <input
                  type="range" min={1} max={30} step={1}
                  value={form.anos_experiencia}
                  onChange={e => setForm(f => ({ ...f, anos_experiencia: Number(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: GOLD }}
                />
                <div className="flex justify-between text-[10px] font-mono" style={{ color: TEXT2 }}>
                  <span>1 ano</span><span>30 anos</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => next()} className="text-[12px] underline underline-offset-4" style={{ color: TEXT2 }}>
                Pular por agora
              </button>
              <GoldBtn onClick={() => next()} loading={saving}>
                Próximo <ArrowRight className="w-4 h-4" />
              </GoldBtn>
            </div>
          </div>
        )}

        {/* ── ETAPA 3 — Diagnóstico ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-[26px] font-semibold" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Conte-nos sobre sua clínica
              </h2>
              <p className="text-[13px]" style={{ color: TEXT2 }}>
                Isso personaliza os módulos mais relevantes para você.
              </p>
            </div>

            <div className="rounded-2xl p-6 space-y-6" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>

              {/* Multi-select desafios */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest uppercase" style={{ color: TEXT2 }}>
                    <Target className="w-3 h-3" /> Qual seu maior desafio hoje?
                  </label>
                  <span className="text-[10px] font-mono" style={{ color: GOLD }}>
                    {form.desafios.length}/2 escolhidos
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {DESAFIOS_LIST.map(d => {
                    const sel = form.desafios.includes(d.id)
                    const maxed = form.desafios.length >= 2 && !sel
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleDesafio(d.id)}
                        disabled={maxed}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-40"
                        style={{
                          background:   sel ? `${GOLD}12` : "#F8F5F0",
                          border:       `1px solid ${sel ? GOLD : BORDER}`,
                          color:        sel ? GOLD : DARK,
                        }}>
                        <span className="text-[16px]">{d.icon}</span>
                        <span className="text-[13px] font-medium flex-1">{d.label}</span>
                        {sel && <Check className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pacientes slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest uppercase" style={{ color: TEXT2 }}>
                    <Users className="w-3 h-3" /> Pacientes por mês
                  </label>
                  <span className="text-[15px] font-bold" style={{ color: GOLD }}>
                    {form.pacientes_mes >= 300 ? "300+" : form.pacientes_mes}
                  </span>
                </div>
                <input
                  type="range" min={0} max={300} step={5}
                  value={form.pacientes_mes}
                  onChange={e => setForm(f => ({ ...f, pacientes_mes: Number(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: GOLD }}
                />
                <div className="flex justify-between text-[10px] font-mono" style={{ color: TEXT2 }}>
                  <span>0</span><span>300+</span>
                </div>
              </div>

              {/* Ticket slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest uppercase" style={{ color: TEXT2 }}>
                    <DollarSign className="w-3 h-3" /> Ticket médio atual
                  </label>
                  <span className="text-[15px] font-bold" style={{ color: GOLD }}>
                    {form.ticket_medio >= 2000 ? "R$ 2.000+" : `R$ ${form.ticket_medio.toLocaleString("pt-BR")}`}
                  </span>
                </div>
                <input
                  type="range" min={0} max={2000} step={50}
                  value={form.ticket_medio}
                  onChange={e => setForm(f => ({ ...f, ticket_medio: Number(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: GOLD }}
                />
                <div className="flex justify-between text-[10px] font-mono" style={{ color: TEXT2 }}>
                  <span>R$ 0</span><span>R$ 2.000+</span>
                </div>
              </div>

              {/* Frequência de conteúdo */}
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest uppercase" style={{ color: TEXT2 }}>
                  <Smartphone className="w-3 h-3" /> Você produz conteúdo para redes sociais?
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTEUDO_FREQUENCIA.map(f => (
                    <button
                      key={f}
                      onClick={() => setForm(fm => ({ ...fm, conteudo_frequencia: f }))}
                      className="text-[12px] px-4 py-2 rounded-full border transition-all"
                      style={{
                        background: form.conteudo_frequencia === f ? `${GOLD}12` : "#F8F5F0",
                        borderColor: form.conteudo_frequencia === f ? GOLD : BORDER,
                        color:       form.conteudo_frequencia === f ? GOLD : TEXT2,
                        fontWeight:  form.conteudo_frequencia === f ? "600" : "400",
                      }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="text-[12px]" style={{ color: TEXT2 }}>
                ← Voltar
              </button>
              <GoldBtn onClick={() => next()} loading={saving}>
                Próximo <ArrowRight className="w-4 h-4" />
              </GoldBtn>
            </div>
          </div>
        )}

        {/* ── ETAPA 4 — Plano ─────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-[26px] font-semibold" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Escolha seu plano
              </h2>
              <p className="text-[13px]" style={{ color: TEXT2 }}>
                7 dias grátis em qualquer plano. Sem fidelidade.
              </p>
            </div>

            {erroMsg && (
              <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-600">{erroMsg}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANOS.map(plan => {
                const PIcon = plan.icon
                return (
                  <div
                    key={plan.id}
                    className="relative flex flex-col gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5"
                    style={{
                      background: CARD_BG,
                      border: plan.highlight ? `2px solid ${GOLD}` : `1px solid ${BORDER}`,
                      boxShadow: plan.highlight ? `0 4px 20px ${GOLD}22` : "none",
                    }}>

                    {/* Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className="text-[9px] font-mono font-bold px-3 py-1 rounded-full border tracking-widest whitespace-nowrap"
                        style={{
                          background:  plan.highlight ? GOLD : CARD_BG,
                          borderColor: GOLD,
                          color:       plan.highlight ? "#fff" : GOLD,
                        }}>
                        {plan.badge}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <PIcon className="w-5 h-5 flex-shrink-0" style={{ color: plan.color }} />
                      <span className="text-[15px] font-semibold" style={{ color: plan.highlight ? GOLD : DARK }}>{plan.name}</span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[24px] font-bold" style={{ color: DARK }}>{plan.price}</span>
                        <span className="text-[11px]" style={{ color: TEXT2 }}>{plan.sub}</span>
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: TEXT2 }}>{plan.limits}</p>
                    </div>

                    <ul className="flex-1 space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px]" style={{ color: TEXT2 }}>
                          <Check className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => choosePlan(plan.priceKey)}
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
                      style={{
                        background: plan.highlight ? GOLD : `${GOLD}15`,
                        color:      plan.highlight ? "#fff" : GOLD,
                      }}>
                      Escolher este plano
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Terms inline */}
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
                className="mt-1 w-4 h-4 cursor-pointer flex-shrink-0" style={{ accentColor: GOLD }} />
              <span className="text-[12px] leading-relaxed" style={{ color: TEXT2 }}>
                Li e concordo com os{" "}
                <Link href="/termos" target="_blank" className="underline" style={{ color: GOLD }}>Termos de Uso</Link>
                {" "}e a{" "}
                <Link href="/privacidade" target="_blank" className="underline" style={{ color: GOLD }}>Política de Privacidade</Link>
                {" "}do PRAXIS.
              </span>
            </label>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(3)} className="text-[12px]" style={{ color: TEXT2 }}>
                ← Voltar
              </button>
              <button
                onClick={goTrial}
                disabled={saving}
                className="text-[12px] underline underline-offset-4 disabled:opacity-40"
                style={{ color: TEXT2 }}>
                {saving ? "..." : "Continuar no trial gratuito →"}
              </button>
            </div>
          </div>
        )}

        {/* ── ETAPA 5 — Tour guiado ───────────────────────────────────────── */}
        {step === 5 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-3 mb-8">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-[32px]"
                style={{ background: `${GOLD}18`, border: `2px solid ${GOLD}40` }}>
                🎉
              </div>
              <h2 className="text-[28px] font-semibold" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Sua plataforma está pronta!
              </h2>
              <p className="text-[14px]" style={{ color: TEXT2 }}>
                Por onde começar, {nome}?
              </p>
            </div>

            {/* Highlight card for top recommendation */}
            <div
              className="rounded-2xl p-5 flex items-start gap-4"
              style={{ background: `${GOLD}10`, border: `1.5px solid ${GOLD}50` }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${GOLD}20` }}>
                <Activity className="w-5 h-5" style={{ color: GOLD }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-bold" style={{ color: GOLD }}>Recomendado para você</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold" style={{ background: GOLD, color: "#fff" }}>
                    PRIORIDADE
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: TEXT2 }}>
                  Baseado nos seus desafios, começar pelo <strong style={{ color: DARK }}>{topAla.title}</strong> vai gerar resultados mais rápidos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALAS_TOUR.map(ala => {
                const AIcon = ala.Icon
                const isTop = ala.id === topAla.id
                const isRel = form.desafios.some(d => ala.triggers.includes(d))
                return (
                  <div
                    key={ala.id}
                    className="rounded-xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
                    style={{
                      background:  isTop ? `${ala.color}08` : CARD_BG,
                      border:      `1px solid ${isTop ? ala.color + "55" : BORDER}`,
                    }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${ala.color}15` }}>
                        <AIcon className="w-4 h-4" style={{ color: ala.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold" style={{ color: DARK }}>{ala.title}</span>
                          {isTop && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}40` }}>
                              TOP
                            </span>
                          )}
                          {isRel && !isTop && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                              RELEVANTE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px]" style={{ color: TEXT2 }}>{ala.desc}</p>
                      </div>
                    </div>
                    <a
                      href={ala.href}
                      className="text-center py-2 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background:  isTop ? `${ala.color}15` : "#F8F5F0",
                        color:       isTop ? ala.color : TEXT2,
                        border:      `1px solid ${isTop ? ala.color + "30" : BORDER}`,
                      }}>
                      {ala.cta} →
                    </a>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-center mt-2 pt-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-[14px] font-bold transition-all hover:opacity-90 shadow-lg"
                style={{ background: GOLD, color: "#fff", boxShadow: `0 4px 20px ${GOLD}44` }}>
                Ir para o Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-[11px]"
                style={{ color: TEXT2 }}>
                Explorar depois
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
