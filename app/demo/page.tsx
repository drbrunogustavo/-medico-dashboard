"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  X, ArrowRight, Users, TrendingUp, MessageSquare,
  Star, Calendar, Sparkles, FileText, Activity,
  ChevronRight, Loader2, Send, BookOpen, DollarSign,
  Instagram, Phone, Clock, CheckCircle2, BarChart3,
} from "lucide-react"

// ─── Demo banner ──────────────────────────────────────────────────────────────

function DemoBanner() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2.5"
      style={{ background: "#0D1B2A", borderBottom: "1px solid rgba(184,151,106,0.25)" }}>
      <div className="flex items-center gap-2">
        <span className="text-[14px]">📊</span>
        <span className="text-[12px] font-medium" style={{ color: "#e8ddd0" }}>
          <strong style={{ color: "#b8976a" }}>Dados demonstrativos</strong> para fins ilustrativos — não representam dados reais de nenhum usuário.
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link href="/planos"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all hover:opacity-90"
          style={{ background: "#b8976a", color: "#0D1B2A" }}>
          Criar minha conta <ArrowRight className="w-3 h-3" />
        </Link>
        <button onClick={() => setVisible(false)} style={{ color: "#9a8a7a" }}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_MEDICO = {
  nome: "Dr. João Silva",
  especialidade: "Endocrinologista",
  crm: "CRM-SP 123456",
  instagram: "@drjoaosilva.endocrino",
}

const DEMO_METRICAS = [
  { label: "Leads no CRM",    value: "47",   sub: "total de leads",      color: "#b8976a",  icon: Users       },
  { label: "Consultas/mês",   value: "28",   sub: "mês atual",           color: "#10b981",  icon: Calendar    },
  { label: "NPS Score",       value: "8.4",  sub: "satisfação pacientes", color: "#3b7fff",  icon: Star        },
  { label: "Pautas salvas",   value: "12",   sub: "banco de ideias",     color: "#f472b6",  icon: FileText    },
]

const DEMO_LEADS = [
  { nome: "Maria Costa",      origem: "Instagram",  status: "Novo",         tel: "(11) 99123-4567", especialidade: "Diabetes T2",         tempo: "há 2h"     },
  { nome: "Carlos Fernandes", origem: "WhatsApp",   status: "Contatado",    tel: "(11) 98765-4321", especialidade: "Tireóide",            tempo: "há 5h"     },
  { nome: "Ana Oliveira",     origem: "Indicação",  status: "Agendado",     tel: "(11) 91234-5678", especialidade: "Obesidade",           tempo: "há 1 dia"  },
  { nome: "Pedro Santos",     origem: "Google",     status: "Em negociação",tel: "(11) 97654-3210", especialidade: "Resistência insulina", tempo: "há 2 dias" },
  { nome: "Lucia Mendes",     origem: "Instagram",  status: "Fechado",      tel: "(11) 96543-2109", especialidade: "SOP",                 tempo: "há 3 dias" },
]

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Novo":            { bg: "rgba(59,127,255,0.1)",  border: "rgba(59,127,255,0.25)",  text: "#3b7fff" },
  "Contatado":       { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)",  text: "#f59e0b" },
  "Agendado":        { bg: "rgba(0,192,127,0.1)",  border: "rgba(0,192,127,0.25)",   text: "#00c07f" },
  "Em negociação":   { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)",  text: "#8b5cf6" },
  "Fechado":         { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)",  text: "#10b981" },
}

const DEMO_PAUTAS = [
  { titulo: "5 sinais que indicam problema na tireoide",  categoria: "Educacional",  stage: "Pronto",      emoji: "🦋" },
  { titulo: "Por que o cortisol alto engorda a barriga",  categoria: "Saúde",        stage: "Em produção", emoji: "⚡" },
  { titulo: "Diabetes e resistência à insulina: diferença", categoria: "Clínico",   stage: "Ideia",       emoji: "🩺" },
]

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Ideia":        { bg: "rgba(107,114,128,0.1)", text: "#6b7280", border: "rgba(107,114,128,0.2)" },
  "Em produção":  { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", border: "rgba(245,158,11,0.2)"  },
  "Pronto":       { bg: "rgba(0,192,127,0.1)",  text: "#00c07f", border: "rgba(0,192,127,0.2)"   },
}

// ─── Copiloto demo (real API) ─────────────────────────────────────────────────

function CopiloToDemo() {
  const [input,    setInput]    = useState("")
  const [response, setResponse] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)

  const SUGESTOES = [
    "Como abordar a resistência à insulina em consulta?",
    "Roteiro para Reel sobre diabetes tipo 2",
    "Como falar de preço sem desvalorizar?",
  ]

  const send = async (q?: string) => {
    const pergunta = q ?? input.trim()
    if (!pergunta) return
    setSent(true)
    setLoading(true)
    setResponse("")
    try {
      const res = await fetch("/api/copiloto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: pergunta,
          contexto: "demo",
          especialidade: "Endocrinologia",
        }),
      })
      if (res.ok) {
        const data = await res.json() as { resposta?: string; message?: string }
        setResponse(data.resposta ?? data.message ?? "Resposta recebida!")
      } else {
        setResponse("Copiloto disponível na sua conta PRAXIS. Crie sua conta para usar.")
      }
    } catch (e) {
      console.error("[demo] erro ao chamar copiloto:", e)
      setResponse("Copiloto disponível na sua conta PRAXIS. Crie sua conta para usar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
          PRAXIS Copiloto — IA Médica
        </span>
        <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>
          AO VIVO
        </span>
      </div>

      <div className="p-5 space-y-4">
        {!sent && (
          <div className="space-y-2">
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              Experimente perguntar ao Copiloto (funciona de verdade):
            </p>
            {SUGESTOES.map(s => (
              <button key={s} onClick={() => { setInput(s); send(s) }}
                className="w-full text-left px-3 py-2.5 rounded-lg border text-[12px] transition-all hover:border-accent-border"
                style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {sent && (
          <div className="space-y-3">
            <div className="px-3 py-2.5 rounded-lg text-[12px]"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--text-secondary)" }}>
              {input}
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent)" }} />
                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Copiloto pensando...</span>
              </div>
            ) : response && (
              <div className="px-4 py-3 rounded-lg border text-[12px] leading-relaxed"
                style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                {response}
              </div>
            )}
            <button onClick={() => { setSent(false); setInput(""); setResponse("") }}
              className="text-[11px] font-mono transition-colors" style={{ color: "var(--text-muted)" }}>
              ← Nova pergunta
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ou escreva sua pergunta aqui..."
            className="flex-1 px-3 py-2 rounded-lg border text-[12px] bg-transparent outline-none transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
          <button onClick={() => send()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-all disabled:opacity-40"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
            <Send className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  return (
    <>
      <DemoBanner />

      <div className="animate-fade-in" style={{ paddingTop: 52 }}>
        {/* Header */}
        <div className="border-b sticky z-30"
          style={{
            background: "var(--topbar-bg)",
            borderColor: "var(--border)",
            backdropFilter: "blur(20px)",
            height: 60,
          }}>
          <div className="flex items-center justify-between h-full px-4 md:px-8">
            <div>
              <h1 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Command Center
              </h1>
              <p className="hidden md:block text-[10px] font-mono tracking-[2px] uppercase"
                style={{ color: "var(--text-muted)" }}>
                DEMO · {DEMO_MEDICO.nome} · {DEMO_MEDICO.especialidade}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                <Sparkles className="w-3 h-3" /> MODO DEMO
              </span>
              <Link href="/planos"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all hover:opacity-90"
                style={{ background: "#b8976a", color: "#0D1B2A" }}>
                Criar conta <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-6">

          {/* Greeting */}
          <div className="rounded-xl border px-6 py-5 relative overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(184,151,106,0.06)" }} />
            <p className="text-[11px] font-mono tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
            <h2 className="text-[22px] md:text-[28px] font-semibold mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Bom dia, {DEMO_MEDICO.nome}.
            </h2>
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              <span className="font-mono text-[11px] uppercase tracking-wider mr-2" style={{ color: "var(--text-muted)" }}>
                {DEMO_MEDICO.especialidade} ·
              </span>
              Você tem 12 pautas salvas e 36+ módulos prontos para criar.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#f59e0b" }} />
              <span className="text-[10px] font-mono tracking-widest" style={{ color: "#f59e0b" }}>MODO DEMONSTRAÇÃO</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DEMO_METRICAS.map(m => {
              const Icon = m.icon
              return (
                <div key={m.label}
                  className="rounded-xl border p-4 transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4" style={{ color: m.color }} />
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
                  </div>
                  <div className="text-[28px] font-bold leading-none mb-1" style={{ color: m.color }}>
                    {m.value}
                  </div>
                  <div className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{m.label}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{m.sub}</div>
                  <div className="text-[9px] font-mono mt-1.5 px-1.5 py-0.5 rounded inline-block" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>dado ilustrativo</div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* CRM Leads */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>CRM de Leads</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)", color: "#6b7280" }}>
                  DEMO
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {DEMO_LEADS.map((lead, i) => {
                  const sc = STATUS_COLORS[lead.status] ?? STATUS_COLORS["Novo"]
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                        style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>
                        {lead.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{lead.nome}</p>
                        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                          {lead.origem} · {lead.especialidade}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                          {lead.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{lead.tempo}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Banco de Pautas */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" style={{ color: "#f472b6" }} />
                  <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Banco de Pautas</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)", color: "#6b7280" }}>
                  DEMO
                </span>
              </div>
              <div className="p-5 space-y-3">
                {DEMO_PAUTAS.map((p, i) => {
                  const sc = STAGE_COLORS[p.stage] ?? STAGE_COLORS["Ideia"]
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border transition-all hover:border-opacity-70"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <span className="text-[18px] flex-shrink-0">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium leading-snug mb-1" style={{ color: "var(--text-primary)" }}>{p.titulo}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                            {p.categoria}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                            {p.stage.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div className="pt-1">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed text-[11px]"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                    <span>+ Adicionar nova pauta</span>
                    <span className="text-[10px] ml-auto">disponível na sua conta</span>
                  </div>
                </div>
              </div>

              {/* Mini Atividade */}
              <div className="px-5 pb-5 space-y-2">
                <p className="text-[10px] font-mono tracking-[2px] uppercase mb-2" style={{ color: "var(--text-muted)" }}>Atividade recente</p>
                {[
                  { icon: CheckCircle2, color: "#10b981", text: "Pauta 'Tireóide' marcada como Pronta",        time: "há 30min" },
                  { icon: Users,        color: "var(--accent)", text: "Lead Maria Costa entrou pelo Instagram", time: "há 2h"    },
                  { icon: Activity,     color: "#3b7fff",  text: "Sessão registrada",                           time: "hoje"     },
                ].map((ev, i) => {
                  const Icon = ev.icon
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: ev.color }} />
                      <p className="text-[11px] flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{ev.text}</p>
                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "var(--text-muted)" }}>{ev.time}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Copiloto real */}
          <CopiloToDemo />

          {/* Módulos preview */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[9px] font-mono tracking-[3px] uppercase" style={{ color: "var(--text-muted)" }}>
                Módulos disponíveis
              </span>
              <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { label: "Radar de Tendências",  emoji: "📡", href: "/radar",            desc: "Tendências médicas com IA"        },
                { label: "Gerador de Roteiros",  emoji: "🎬", href: "/roteiros",         desc: "Roteiros para Reels em 2 minutos" },
                { label: "Agenda Inteligente",   emoji: "📅", href: "/agenda",           desc: "Gestão de consultas e lembretes"  },
                { label: "Financeiro",           emoji: "💰", href: "/financeiro",       desc: "Receitas, despesas e DRE"         },
                { label: "Protocolos Clínicos",  emoji: "🩺", href: "/protocolos",       desc: "38 protocolos por especialidade"  },
                { label: "PRAXIS Academy",       emoji: "🎓", href: "/academy",          desc: "38 aulas de marketing médico"     },
                { label: "NPS & Fidelização",    emoji: "⭐", href: "/nps",              desc: "Avaliação de satisfação"          },
                { label: "Diretor Criativo IA",  emoji: "🎨", href: "/diretor-criativo", desc: "Imagens com identidade visual"    },
              ].map(m => (
                <div key={m.label}
                  className="flex flex-col gap-2 p-4 rounded-xl border transition-all hover:-translate-y-0.5 group"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <span className="text-[22px]">{m.emoji}</span>
                  <div>
                    <p className="text-[12px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{m.label}</p>
                    <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{m.desc}</p>
                  </div>
                  <div className="mt-auto pt-1">
                    <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      Disponível na conta <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(135deg, rgba(184,151,106,0.08) 0%, rgba(184,151,106,0.04) 100%)", border: "1px solid rgba(184,151,106,0.2)" }}>
            <p className="text-[11px] font-mono tracking-[3px] uppercase mb-3" style={{ color: "#b8976a" }}>
              Pronto para começar?
            </p>
            <h2 className="text-[22px] md:text-[28px] font-bold mb-3" style={{ color: "var(--text-primary)", fontFamily: "Georgia, serif" }}>
              Transforme sua clínica com o PRAXIS
            </h2>
            <p className="text-[14px] mb-8 mx-auto max-w-lg" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Tudo que você viu aqui — CRM, IA, pautas, protocolos, agenda — disponível para você em minutos.
              Sem cartão de crédito, cancele quando quiser.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/planos"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[14px] transition-all hover:opacity-90"
                style={{ background: "#b8976a", color: "#0D1B2A" }}>
                Começar 7 dias grátis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/captacao"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-[13px] transition-all"
                style={{ border: "1px solid rgba(184,151,106,0.3)", color: "#b8976a" }}>
                Falar com um especialista
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
