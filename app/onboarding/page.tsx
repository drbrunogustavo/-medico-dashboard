"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight, Check, Loader2, AlertCircle,
  Users, DollarSign, Sparkles, BarChart3, Bot,
  GraduationCap, Target, Zap,
} from "lucide-react"

// ─── Tokens ───────────────────────────────────────────────────────────────────

const BG      = "#F5F0E8"
const GOLD    = "#b8976a"
const DARK    = "#0D1B2A"
const TEXT2   = "#6a5a4a"
const CARD_BG = "#FFFFFF"
const BORDER  = "#e8ddd0"
const MUTED   = "#8a7a6a"

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESPECIALIDADES = [
  "Clínica Geral", "Endocrinologia", "Nutrologia", "Cardiologia",
  "Dermatologia", "Ginecologia e Obstetrícia", "Ortopedia", "Neurologia",
  "Psiquiatria", "Pediatria", "Oftalmologia", "Urologia",
  "Oncologia", "Reumatologia", "Nefrologia", "Pneumologia",
  "Gastroenterologia", "Hematologia", "Infectologia", "Medicina do Esporte",
  "Medicina Estética", "Cirurgia Plástica", "Cirurgia Geral", "Outra",
]

const PROBLEMAS = [
  { id: "pacientes",   emoji: "📱", label: "Preciso de mais pacientes" },
  { id: "faturamento", emoji: "💰", label: "Quero aumentar meu faturamento" },
  { id: "burocracia",  emoji: "📋", label: "Perco tempo com burocracia" },
  { id: "financeiro",  emoji: "📊", label: "Não tenho controle financeiro" },
  { id: "crescer",     emoji: "🚀", label: "Quero escalar e crescer" },
]

type ModItem = { icon: React.ElementType; color: string; title: string; desc: string; href: string }

const MODULE_MAP: Record<string, ModItem[]> = {
  pacientes: [
    { icon: Users,  color: "#3b82f6", title: "CRM de Leads",      desc: "Funil visual + nurturing automático D+1 a D+30",   href: "/crm"           },
    { icon: Zap,    color: "#10b981", title: "Nurturing WhatsApp", desc: "Lead respondido em minutos — sem você precisar",   href: "/crm"           },
  ],
  faturamento: [
    { icon: BarChart3,  color: "#8b5cf6", title: "Painel Executivo",        desc: "Indicadores e faturamento em tempo real",       href: "/executivo"     },
    { icon: DollarSign, color: "#f59e0b", title: "Precificação Inteligente", desc: "Descubra o valor ideal da sua consulta",        href: "/posicionamento" },
  ],
  burocracia: [
    { icon: Sparkles,      color: GOLD,      title: "Copiloto de Consulta", desc: "Prontuário SOAP em 30 segundos por IA",       href: "/copiloto"  },
    { icon: GraduationCap, color: "#ec4899", title: "SOPs da Clínica",      desc: "Processos operacionais documentados e prontos", href: "/academy"   },
  ],
  financeiro: [
    { icon: DollarSign, color: "#16a34a", title: "Financeiro",   desc: "Controle de caixa, receitas e despesas",          href: "/financeiro"  },
    { icon: BarChart3,  color: "#8b5cf6", title: "Indicadores",  desc: "KPIs clínicos e financeiros em tempo real",       href: "/indicadores" },
  ],
  crescer: [
    { icon: Bot,    color: "#f59e0b", title: "Consultor Estratégico IA", desc: "Análise e recomendações com dados reais",   href: "/posicionamento" },
    { icon: Target, color: "#3b82f6", title: "Diagnóstico 360°",         desc: "Avaliação completa da sua clínica",         href: "/posicionamento" },
  ],
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const LABELS = ["Início", "Perfil", "Prioridade", "Tour", "Pronto"]
  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between mb-3">
        {LABELS.map((label, i) => {
          const n      = i + 1
          const done   = n < step
          const active = n === step
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border"
                style={{
                  background:  done ? GOLD : active ? `${GOLD}22` : CARD_BG,
                  borderColor: done || active ? GOLD : BORDER,
                  color:       done ? "#fff" : active ? GOLD : TEXT2,
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
          style={{ width: `${((step - 1) / 4) * 100}%`, background: GOLD }}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()

  const [step,     setStep]     = useState(1)
  const [saving,   setSaving]   = useState(false)
  const [erroMsg,  setErroMsg]  = useState("")
  const [nome,     setNome]     = useState("")
  const [espec,    setEspec]    = useState("")
  const [cidade,   setCidade]   = useState("")
  const [problema, setProblema] = useState("")

  const inputStyle: React.CSSProperties = {
    background: CARD_BG, border: `1px solid ${BORDER}`, color: DARK,
    borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.8125rem", width: "100%", outline: "none",
  }

  const save = async (extra?: Record<string, unknown>) => {
    await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, especialidade: espec, cidade, ...extra }),
    }).catch(() => null)
  }

  const next = async (extra?: Record<string, unknown>) => {
    setSaving(true)
    await save(extra)
    setSaving(false)
    setStep(s => s + 1)
  }

  const finish = async () => {
    setSaving(true)
    setErroMsg("")
    try {
      await save({ onboarding_completo: true })
      await fetch("/api/perfil/onboarding", { method: "POST" }).catch(() => null)
      const meData = await fetch("/api/me").then(r => r.json()).catch(() => null) as { plano?: string } | null
      router.push(meData?.plano && meData.plano !== "trial" ? "/dashboard" : "/planos")
    } catch {
      setErroMsg("Erro de conexão. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const modules = MODULE_MAP[problema] ?? []

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto" style={{ background: BG }}>
      <div className="w-full max-w-2xl mx-auto px-4 py-8">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke={GOLD} strokeWidth="1.5" strokeDasharray="70 18" strokeDashoffset="12" opacity="0.7" />
              <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="18" y1="14" x2="23" y2="22" stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            </svg>
            <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 15, fontWeight: 600, letterSpacing: "4px", color: DARK }}>PRAXIS</span>
          </div>
        </div>

        <ProgressBar step={step} />

        {/* ── ETAPA 1 — Boas-vindas rápida ── */}
        {step === 1 && (
          <div className="text-center animate-fade-in space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}40` }}>
                <Sparkles className="w-10 h-10" style={{ color: GOLD }} />
              </div>
              <h1 className="text-[32px] sm:text-[38px] font-semibold leading-tight" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Bem-vindo ao PRAXIS!
              </h1>
              <p className="text-[15px] leading-relaxed max-w-sm mx-auto" style={{ color: TEXT2 }}>
                Vamos configurar tudo em <strong style={{ color: DARK }}>2 minutos</strong>.
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-2.5 text-left">
              {[
                { label: "Preencher perfil",        tempo: "30 segundos" },
                { label: "Escolher sua prioridade",  tempo: "10 segundos" },
                { label: "Explorar a plataforma",    tempo: "1 minuto"    },
              ].map(({ label, tempo }, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}40` }}>
                      <Check className="w-3 h-3" style={{ color: GOLD }} />
                    </div>
                    <span className="text-[13px] font-medium" style={{ color: DARK }}>{label}</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: MUTED }}>{tempo}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[14px] font-bold transition-all hover:opacity-90"
              style={{ background: GOLD, color: "#fff", boxShadow: `0 4px 20px ${GOLD}44` }}>
              Começar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ETAPA 2 — Perfil essencial ── */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-[26px] font-semibold" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Perfil Profissional
              </h2>
              <p className="text-[13px] mt-2" style={{ color: TEXT2 }}>Só o essencial para personalizar a plataforma.</p>
            </div>

            <div className="rounded-2xl p-6 space-y-5" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono tracking-widest uppercase" style={{ color: TEXT2 }}>Nome completo</label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Dr. João Silva"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono tracking-widest uppercase" style={{ color: TEXT2 }}>Especialidade principal</label>
                <select value={espec} onChange={e => setEspec(e.target.value)} style={inputStyle}>
                  <option value="">Selecione a especialidade</option>
                  {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono tracking-widest uppercase" style={{ color: TEXT2 }}>Cidade</label>
                <input
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  placeholder="São Paulo"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => next()} className="text-[12px] underline underline-offset-4" style={{ color: TEXT2 }}>
                Pular por agora
              </button>
              <button
                onClick={() => next()}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: GOLD, color: "#fff" }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Próximo <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── ETAPA 3 — Qual seu maior problema? ── */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-[24px] font-semibold leading-snug" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                O que mais te preocupa<br />na clínica agora?
              </h2>
              <p className="text-[13px] mt-3" style={{ color: TEXT2 }}>Vamos mostrar o módulo mais relevante primeiro.</p>
            </div>

            <div className="space-y-2">
              {PROBLEMAS.map(({ id, emoji, label }) => (
                <button
                  key={id}
                  onClick={() => setProblema(id)}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                  style={{
                    background:  problema === id ? `${GOLD}12` : CARD_BG,
                    border:      `2px solid ${problema === id ? GOLD : BORDER}`,
                  }}>
                  <span style={{ fontSize: 24 }}>{emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: problema === id ? 700 : 500, color: problema === id ? DARK : TEXT2, flex: 1 }}>
                    {label}
                  </span>
                  {problema === id && <Check className="w-5 h-5 flex-shrink-0" style={{ color: GOLD }} />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="text-[12px]" style={{ color: TEXT2 }}>← Voltar</button>
              <button
                onClick={() => next({ problema })}
                disabled={saving || !problema}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: GOLD, color: "#fff" }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Ver minha recomendação <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── ETAPA 4 — Tour rápido personalizado ── */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-8">
              <div className="text-[36px] mb-3">🎯</div>
              <h2 className="text-[26px] font-semibold" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Comece por aqui
              </h2>
              <p className="text-[13px] mt-2" style={{ color: TEXT2 }}>
                Esses módulos vão gerar o maior impacto para você.
              </p>
            </div>

            <div className="space-y-3">
              {modules.map(({ icon: Icon, color, title, desc, href }, i) => (
                <a key={i} href={href}
                  className="flex items-center gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                  style={{ background: CARD_BG, border: `1.5px solid ${color}35`, textDecoration: "none", display: "flex" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{title}</div>
                    <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{desc}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color, flexShrink: 0 }}>
                    Comece aqui <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => setStep(5)}
                className="w-full py-4 rounded-xl text-[14px] font-bold transition-all hover:opacity-90"
                style={{ background: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}35` }}>
                Ver todos os módulos →
              </button>
              <button onClick={() => setStep(3)} className="text-[12px] text-center" style={{ color: MUTED }}>
                ← Mudar minha prioridade
              </button>
            </div>
          </div>
        )}

        {/* ── ETAPA 5 — Pronto! ── */}
        {step === 5 && (
          <div className="text-center animate-fade-in space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-[36px]"
                style={{ background: `${GOLD}18`, border: `2px solid ${GOLD}40` }}>
                🎉
              </div>
              <h2 className="text-[30px] font-semibold" style={{ color: DARK, fontFamily: "var(--font-playfair), Georgia, serif" }}>
                Sua plataforma está configurada!
              </h2>
              <p className="text-[14px] max-w-sm mx-auto leading-relaxed" style={{ color: TEXT2 }}>
                Escolha seu plano e comece com <strong style={{ color: DARK }}>7 dias grátis</strong> — cancele quando quiser.
              </p>
            </div>

            {erroMsg && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-left" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-[12px] text-red-600">{erroMsg}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={finish}
                disabled={saving}
                className="w-full py-4 rounded-xl text-[15px] font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: GOLD, color: "#fff", boxShadow: `0 4px 20px ${GOLD}44` }}>
                {saving
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Aguarde...</span>
                  : "Escolher meu plano →"}
              </button>
              <Link href="/tour" className="block text-center text-[12px] underline underline-offset-4" style={{ color: MUTED }}>
                Explorar o tour primeiro →
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
