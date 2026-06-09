"use client"

import { useState } from "react"
import { GraduationCap, Megaphone, BarChart3, TrendingUp, Rocket, Users, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Trilha {
  id:        string
  titulo:    string
  subtitulo: string
  icon:      React.ElementType
  color:     string
  bg:        string
  border:    string
  modulos:   string[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRILHAS: Trilha[] = [
  {
    id: "marketing", titulo: "Marketing Médico", subtitulo: "Do zero à autoridade digital",
    icon: Megaphone, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20",
    modulos: [
      "Como posicionar sua marca médica",
      "Instagram para médicos: do zero à autoridade",
      "Estratégia de conteúdo que atrai pacientes",
      "Reels e Stories que convertem",
      "Tráfego pago para clínicas",
    ],
  },
  {
    id: "gestao", titulo: "Gestão de Clínica", subtitulo: "Processos que escalam",
    icon: BarChart3, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20",
    modulos: [
      "Indicadores essenciais da clínica",
      "Gestão financeira para médicos",
      "Como montar SOPs eficientes",
      "Liderança e gestão de equipe",
      "Processos de atendimento premium",
    ],
  },
  {
    id: "comercial", titulo: "Comercial e Vendas", subtitulo: "Venda sem parecer vendedor",
    icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
    modulos: [
      "Como vender sem parecer vendedor",
      "Scripts de alta conversão",
      "Fechamento de protocolos premium",
      "Experiência do paciente",
      "Programa de indicações",
    ],
  },
  {
    id: "escala", titulo: "Escalabilidade", subtitulo: "Da clínica solo ao grupo médico",
    icon: Rocket, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20",
    modulos: [
      "Da clínica solo ao grupo médico",
      "Como abrir a segunda unidade",
      "Precificação premium",
      "Construindo ativos na medicina",
      "Planejamento de longo prazo",
    ],
  },
]

const LANCAMENTOS = [
  { data: "Ago/2025", titulo: "Trilha Marketing Médico — Módulo 1" },
  { data: "Set/2025", titulo: "Trilha Gestão — Indicadores Essenciais" },
  { data: "Out/2025", titulo: "Trilha Comercial — Scripts de Alta Conversão" },
  { data: "Nov/2025", titulo: "Comunidade PRAXIS — Lançamento Beta" },
  { data: "Jan/2026", titulo: "Trilha Escalabilidade — Módulo Completo" },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AcademyPage() {
  const [email,  setEmail]  = useState("")
  const [saved,  setSaved]  = useState(false)
  const [saving, setSaving] = useState(false)

  async function salvarEmail() {
    if (!email.trim()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaved(true)
    setSaving(false)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="p-8 pb-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">PRAXIS Academy</h1>
            <p className="text-sm text-text-muted font-mono">APRENDA A CONSTRUIR UMA CLÍNICA DE SUCESSO</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-pink-500/20 bg-pink-500/5 px-5 py-4 inline-flex items-center gap-2">
          <Clock className="w-4 h-4 text-pink-400" />
          <span className="text-sm text-pink-300 font-medium">Conteúdos chegando em breve. Cadastre seu e-mail para ser avisado.</span>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Trilhas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TRILHAS.map(t => {
            const Icon = t.icon
            return (
              <div key={t.id} className={cn("rounded-2xl border p-6", t.border, t.bg)}>
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", t.border)}>
                    <Icon className={cn("w-5 h-5", t.color)} />
                  </div>
                  <span className="text-[9px] font-mono px-2 py-1 rounded-full border border-[--border] text-text-muted bg-[--surface]">
                    EM BREVE
                  </span>
                </div>
                <h3 className={cn("text-base font-bold mb-0.5", t.color)}>{t.titulo}</h3>
                <p className="text-xs text-text-muted mb-4">{t.subtitulo}</p>
                <ul className="space-y-2">
                  {t.modulos.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                      <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                        t.color === "text-blue-400"   ? "bg-blue-400" :
                        t.color === "text-accent"     ? "bg-accent" :
                        t.color === "text-amber-400"  ? "bg-amber-400" : "bg-purple-400"
                      )} />
                      {m}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-[--border]/50">
                  <p className="text-[10px] text-text-muted font-mono">{t.modulos.length} módulos · Acesso vitalício</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Comunidade */}
        <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-text-primary">Comunidade PRAXIS</h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-pink-500/30 text-pink-400">EM BREVE</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                Conecte-se com médicos que estão construindo clínicas de sucesso. Benchmarking, desafios mensais e troca de experiências reais.
              </p>
              <div className="flex gap-3 items-center flex-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Seu melhor e-mail"
                  className="bg-[--surface] border border-[--border] rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-pink-500/40 transition-colors placeholder:text-text-muted w-64"
                />
                <button
                  onClick={salvarEmail}
                  disabled={saving || saved || !email.trim()}
                  className={cn(
                    "flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors",
                    saved
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                      : "bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/15"
                  )}
                >
                  {saved ? <><Check className="w-3.5 h-3.5" /> Cadastrado!</> : "Quero ser avisado"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Próximos Lançamentos</h3>
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-pink-500/40 to-transparent" />
            <div className="space-y-4">
              {LANCAMENTOS.map((l, i) => (
                <div key={i} className="relative pl-5">
                  <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-pink-500/40 bg-[--background]" />
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-pink-400 flex-shrink-0">{l.data}</span>
                    <p className="text-sm text-text-secondary">{l.titulo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
