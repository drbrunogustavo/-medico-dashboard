"use client"

import { useState } from "react"
import {
  TrendingUp, Sparkles, Loader2, AlertCircle, RefreshCw,
  Lightbulb, MessageCircle, Users, ChevronRight, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tendencia {
  topico:        string
  crescimento_pct: number
  descricao:     string
  urgencia:      string
  tipo:          string
}

interface OportunidadeConteudo {
  titulo:        string
  formato:       string
  pilar:         string
  justificativa: string
  potencial:     string
}

interface PerguntaPaciente {
  pergunta:         string
  volume_estimado:  string
  resposta_curta:   string
}

interface ConcorrenteDestaque {
  tipo:          string
  estrategia:    string
  oportunidade:  string
}

interface MercadoData {
  semana:                  string
  especialidade:           string
  tendencias:              Tendencia[]
  oportunidades_conteudo:  OportunidadeConteudo[]
  perguntas_pacientes:     PerguntaPaciente[]
  concorrentes_destaque:   ConcorrenteDestaque[]
  resumo_executivo:        string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ESPECIALIDADES = [
  "Endocrinologia e Nutrologia",
  "Cardiologia",
  "Dermatologia",
  "Ginecologia",
  "Ortopedia",
  "Pediatria",
  "Psiquiatria",
  "Neurologia",
  "Oncologia",
  "Medicina Geral",
]

const URGENCIA_STYLE: Record<string, string> = {
  Alta:  "bg-red-50 border-red-200 text-red-700",
  Média: "bg-amber-50 border-amber-200 text-amber-700",
  Baixa: "bg-green-50 border-green-200 text-green-700",
}

const TIPO_STYLE: Record<string, string> = {
  Científico:     "bg-blue-50 border-blue-200 text-blue-700",
  Comportamental: "bg-purple-50 border-purple-200 text-purple-700",
  Sazonal:        "bg-amber-50 border-amber-200 text-amber-700",
  Viral:          "bg-pink-50 border-pink-200 text-pink-700",
}

const POTENCIAL_STYLE: Record<string, string> = {
  Alto:  "bg-green-50 border-green-200 text-green-700",
  Médio: "bg-blue-50 border-blue-200 text-blue-700",
  Baixo: "bg-gray-50 border-gray-200 text-gray-700",
}

const VOLUME_STYLE: Record<string, string> = {
  Alto:  "bg-red-50 border-red-200 text-red-700",
  Médio: "bg-amber-50 border-amber-200 text-amber-700",
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border", className)}>
      {label}
    </span>
  )
}

function SectionHeader({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-accent" />
      </div>
      <h2 className="text-[14px] font-semibold text-text-primary">{title}</h2>
      {count !== undefined && (
        <span className="text-[10px] font-mono text-text-muted ml-auto">{count} item{count !== 1 ? "s" : ""}</span>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MercadoPage() {
  const [especialidade, setEspecialidade] = useState(ESPECIALIDADES[0])
  const [dados,   setDados]   = useState<MercadoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  async function analisar() {
    setLoading(true)
    setError("")
    try {
      const resp = await fetch("/api/mercado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ especialidade }),
      })
      if (!resp.ok) throw new Error(await resp.text())
      setDados(await resp.json() as MercadoData)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Inteligência de Mercado" />
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-border">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Inteligência de Mercado</h1>
        <p className="text-[11px] text-text-muted mt-1 font-mono uppercase tracking-widest">ANÁLISE SEMANAL COM IA · CACHE 7 DIAS</p>
        <p className="text-[12px] text-text-secondary mt-1.5">Acompanhe tendências do seu nicho e descubra oportunidades de conteúdo antes da concorrência.</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Config */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Especialidade</label>
              <input
                type="text"
                list="especialidades-list"
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                placeholder="Ex: Endocrinologia, Dermatologia..."
                className="w-full sm:w-72 bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              />
              <datalist id="especialidades-list">
                {ESPECIALIDADES.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>
            <button onClick={analisar} disabled={loading || !especialidade.trim()}
              className="flex items-center gap-2 bg-accent text-white font-semibold text-[13px] px-5 py-2.5 rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
                : <><Sparkles className="w-4 h-4" /> Analisar mercado</>
              }
            </button>
            {dados && !loading && (
              <button onClick={analisar}
                className="flex items-center gap-1.5 text-[12px] px-3 py-2.5 rounded-xl border border-border text-text-muted hover:text-text-primary transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar
              </button>
            )}
          </div>
          <p className="text-[11px] text-text-muted mt-3">
            A análise é cacheada por 7 dias para evitar chamadas repetidas à API.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-red-700 text-[13px]">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {dados && (
          <>
            {/* Resumo executivo */}
            <div className="rounded-xl border border-accent-border bg-accent-dim p-5">
              <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-2">Resumo da Semana</p>
              <p className="text-[14px] text-text-primary leading-relaxed">{dados.resumo_executivo}</p>
              <p className="text-[10px] font-mono text-text-muted mt-3">{dados.especialidade} · {dados.semana}</p>
            </div>

            {/* Tendências */}
            <section>
              <SectionHeader icon={TrendingUp} title="Tópicos em Alta" count={dados.tendencias?.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(dados.tendencias ?? []).map((t, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13px] font-semibold text-text-primary leading-snug">{t.topico}</h3>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[16px] font-bold font-mono text-accent">+{t.crescimento_pct}%</span>
                        <span className="text-[9px] text-text-muted font-mono">crescimento</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-text-secondary leading-relaxed">{t.descricao}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge label={t.urgencia} className={URGENCIA_STYLE[t.urgencia] ?? "bg-gray-50 border-gray-200 text-gray-700"} />
                      <Badge label={t.tipo}     className={TIPO_STYLE[t.tipo]         ?? "bg-gray-50 border-gray-200 text-gray-700"} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Oportunidades de conteúdo */}
            <section>
              <SectionHeader icon={Lightbulb} title="Oportunidades de Conteúdo" count={dados.oportunidades_conteudo?.length} />
              <div className="space-y-3">
                {(dados.oportunidades_conteudo ?? []).map((o, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h3 className="text-[13px] font-semibold text-text-primary">{o.titulo}</h3>
                        <p className="text-[12px] text-text-secondary leading-relaxed">{o.justificativa}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <Badge label={o.potencial} className={POTENCIAL_STYLE[o.potencial] ?? "bg-gray-50 border-gray-200 text-gray-700"} />
                        <Badge label={o.formato}   className="bg-gray-50 border-gray-200 text-gray-700" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Perguntas dos pacientes */}
            <section>
              <SectionHeader icon={MessageCircle} title="Perguntas Frequentes dos Pacientes" count={dados.perguntas_pacientes?.length} />
              <div className="space-y-3">
                {(dados.perguntas_pacientes ?? []).map((p, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold text-text-primary">{p.pergunta}</p>
                      <Badge label={`Volume ${p.volume_estimado}`} className={VOLUME_STYLE[p.volume_estimado] ?? "bg-gray-50 border-gray-200 text-gray-700"} />
                    </div>
                    <div className="rounded-lg bg-background border border-border px-3 py-2.5">
                      <p className="text-[10px] font-mono text-text-muted uppercase mb-1">Resposta sugerida</p>
                      <p className="text-[12px] text-text-secondary leading-relaxed">{p.resposta_curta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Concorrentes */}
            <section>
              <SectionHeader icon={Users} title="Análise Competitiva" count={dados.concorrentes_destaque?.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(dados.concorrentes_destaque ?? []).map((c, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                    <h3 className="text-[12px] font-semibold text-text-primary">{c.tipo}</h3>
                    <div>
                      <p className="text-[10px] font-mono text-text-muted uppercase mb-1">O que fazem bem</p>
                      <p className="text-[12px] text-text-secondary leading-relaxed">{c.estrategia}</p>
                    </div>
                    <div className="rounded-lg bg-accent-dim border border-accent-border px-3 py-2">
                      <p className="text-[10px] font-mono text-accent uppercase mb-1">Sua oportunidade</p>
                      <p className="text-[12px] text-text-primary leading-relaxed">{c.oportunidade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Empty state */}
        {!dados && !loading && !error && (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <TrendingUp className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <h3 className="text-[14px] font-semibold text-text-primary mb-2">Inteligência de Mercado</h3>
            <p className="text-[12px] text-text-muted max-w-sm mx-auto">
              Selecione sua especialidade e clique em &ldquo;Analisar mercado&rdquo; para obter tendências, oportunidades e insights desta semana.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
