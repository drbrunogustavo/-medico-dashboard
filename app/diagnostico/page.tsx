"use client"

import { useState } from "react"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { Activity, ChevronRight, Check, Loader2, Zap, Target, Calendar, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pergunta { id: string; texto: string }
interface Dimensao  { id: string; titulo: string; perguntas: Pergunta[] }

interface PlanoResult {
  classificacao:       string
  resumo_diagnostico:  string
  top3_prioridades:    { prioridade: number; titulo: string; descricao: string; impacto: string }[]
  plano_90_dias: {
    mes1: { semana: string; acao: string }[]
    mes2: { semana: string; acao: string }[]
    mes3: { semana: string; acao: string }[]
  }
  quick_wins: string[]
}

// ─── Questions ────────────────────────────────────────────────────────────────

const DIMENSOES: Dimensao[] = [
  {
    id: "marketing", titulo: "Marketing",
    perguntas: [
      { id: "mkt1", texto: "Você produz conteúdo regularmente?" },
      { id: "mkt2", texto: "Tem estratégia de captação de leads?" },
      { id: "mkt3", texto: "Usa WhatsApp para nurturing de leads?" },
      { id: "mkt4", texto: "Tem página de captura ou link bio otimizado?" },
      { id: "mkt5", texto: "Analisa métricas do Instagram regularmente?" },
      { id: "mkt6", texto: "Tem calendário editorial definido?" },
      { id: "mkt7", texto: "Investe em tráfego pago?" },
      { id: "mkt8", texto: "Tem posicionamento de marca definido?" },
    ],
  },
  {
    id: "comercial", titulo: "Comercial",
    perguntas: [
      { id: "com1", texto: "Sua recepção tem script de atendimento?" },
      { id: "com2", texto: "Você acompanha taxa de conversão de leads?" },
      { id: "com3", texto: "Tem processo de follow-up de leads?" },
      { id: "com4", texto: "Oferece protocolos de tratamento premium?" },
      { id: "com5", texto: "Tem programa de indicações estruturado?" },
      { id: "com6", texto: "Acompanha taxa de faltas e faz recuperação?" },
    ],
  },
  {
    id: "financeiro", titulo: "Financeiro",
    perguntas: [
      { id: "fin1", texto: "Conhece seu ticket médio atual?" },
      { id: "fin2", texto: "Acompanha faturamento mensalmente?" },
      { id: "fin3", texto: "Tem metas financeiras definidas?" },
      { id: "fin4", texto: "Calcula custo por paciente adquirido?" },
      { id: "fin5", texto: "Tem reserva de emergência do consultório?" },
      { id: "fin6", texto: "Planeja investimentos anualmente?" },
    ],
  },
  {
    id: "experiencia", titulo: "Experiência",
    perguntas: [
      { id: "exp1", texto: "Tem processo de boas-vindas para novos pacientes?" },
      { id: "exp2", texto: "Envia lembretes de consulta automaticamente?" },
      { id: "exp3", texto: "Faz pesquisa de satisfação (NPS)?" },
      { id: "exp4", texto: "Tem régua de relacionamento pós-consulta?" },
      { id: "exp5", texto: "Oferece experiência premium no consultório?" },
      { id: "exp6", texto: "Tem programa de fidelização de pacientes?" },
    ],
  },
  {
    id: "gestao", titulo: "Gestão",
    perguntas: [
      { id: "ges1", texto: "Tem SOPs documentados para os processos principais?" },
      { id: "ges2", texto: "Usa sistema de CRM para gerenciar pacientes?" },
      { id: "ges3", texto: "Tem indicadores de desempenho (KPIs)?" },
      { id: "ges4", texto: "Avalia sua equipe periodicamente?" },
      { id: "ges5", texto: "Tem plano de expansão definido?" },
      { id: "ges6", texto: "Delega tarefas operacionais da clínica?" },
    ],
  },
]

const SCORE_LABELS: Record<number, string> = { 1: "Não", 2: "Raramente", 3: "Às vezes", 4: "Frequentemente", 5: "Sim, sempre" }
const CLASSIF_COLOR: Record<string, string> = {
  "Clínica Iniciante": "text-red-400",
  "Em Crescimento":    "text-amber-400",
  "Estruturada":       "text-blue-400",
  "Premium":           "text-purple-400",
  "Referência":        "text-accent",
}
const CLASSIF_SCORE: Record<string, string> = {
  "Clínica Iniciante": "0-30",
  "Em Crescimento":    "31-55",
  "Estruturada":       "56-75",
  "Premium":           "76-89",
  "Referência":        "90-100",
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiagnosticoPage() {
  const [step,         setStep]         = useState(0) // 0=intro, 1-5=dimensão, 6=loading, 7=result
  const [respostas,    setRespostas]    = useState<Record<string, number>>({})
  const [result,       setResult]       = useState<PlanoResult | null>(null)
  const [error,        setError]        = useState("")
  const [loadPhrase,   setLoadPhrase]   = useState(0)

  const LOAD_PHRASES = [
    "Analisando dimensões da clínica...",
    "Calculando pontuações...",
    "Identificando prioridades...",
    "Gerando plano de 90 dias...",
    "Finalizando diagnóstico...",
  ]

  const dimIdx      = step - 1
  const dimAtual    = step >= 1 && step <= 5 ? DIMENSOES[dimIdx] : null
  const totalPergs  = DIMENSOES.reduce((s, d) => s + d.perguntas.length, 0)
  const respondidas = Object.keys(respostas).length

  function scoreFor(dimId: string) {
    const dim = DIMENSOES.find(d => d.id === dimId)!
    const vals = dim.perguntas.map(p => respostas[p.id] ?? 0).filter(v => v > 0)
    if (!vals.length) return 0
    return Math.round((vals.reduce((s, v) => s + v, 0) / (vals.length * 5)) * 100)
  }

  function canAdvance() {
    if (!dimAtual) return false
    return dimAtual.perguntas.every(p => respostas[p.id] !== undefined)
  }

  async function finalizar() {
    const scores = Object.fromEntries(DIMENSOES.map(d => [d.titulo, scoreFor(d.id)]))
    const score_geral = Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / DIMENSOES.length)
    setStep(6)

    const interval = setInterval(() => setLoadPhrase(i => (i + 1) % LOAD_PHRASES.length), 1800)
    try {
      const res = await fetch("/api/diagnostico", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas, scores, score_geral }),
      })
      const data = await res.json()
      clearInterval(interval)
      if (!res.ok || data.error) { setError(data.error ?? "Erro"); setStep(5); return }
      setResult({ ...data, _scores: scores, _scoreGeral: score_geral } as PlanoResult & { _scores: Record<string, number>; _scoreGeral: number })
      setStep(7)
    } catch (e) {
      console.error("[diagnostico] erro ao gerar diagnóstico:", e)
      clearInterval(interval)
      setError("Erro de conexão.")
      setStep(5)
    }
  }

  // Radar data
  const radarData = DIMENSOES.map(d => ({ dimensao: d.titulo, score: scoreFor(d.id) }))
  const scoreGeral = result
    ? Math.round(radarData.reduce((s, r) => s + r.score, 0) / radarData.length)
    : 0

  // ── Intro ──
  if (step === 0) {
    return (
      <div className="animate-fade-in">
        <div className="p-4 md:p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Diagnóstico 360°</h1>
              <p className="text-sm text-text-muted font-mono">PRAXIS IA · ANÁLISE COMPLETA</p>
              <p className="text-[12px] text-text-secondary mt-1.5">Responda um questionário rápido e receba um diagnóstico completo da sua clínica com plano de ação.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Descubra onde sua clínica está</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Responda {totalPergs} perguntas em 5 dimensões e receba um diagnóstico completo com seu score, classificação e um plano de ação de 90 dias gerado por IA.
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {DIMENSOES.map((d, i) => (
                <div key={d.id} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-1">
                    <span className="text-xs font-mono font-bold text-accent">{i + 1}</span>
                  </div>
                  <p className="text-[10px] text-text-muted">{d.titulo}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-2 bg-accent text-[--background] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors"
          >
            Iniciar Diagnóstico
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── Loading ──
  if (step === 6) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Activity className="w-8 h-8 text-accent animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-text-primary">Analisando sua clínica...</h2>
          <p className="text-sm text-text-muted font-mono mt-1">{LOAD_PHRASES[loadPhrase]}</p>
        </div>
        <Loader2 className="w-5 h-5 text-accent animate-spin" />
      </div>
    )
  }

  // ── Results ──
  if (step === 7 && result) {
    const r = result as PlanoResult & { _scores?: Record<string, number>; _scoreGeral?: number }
    const sg = r._scoreGeral ?? scoreGeral

    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between p-8 pb-0">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Diagnóstico 360°</h1>
            <p className={cn("text-sm font-semibold mt-1", CLASSIF_COLOR[result.classificacao] ?? "text-text-primary")}>
              {result.classificacao} · Score {sg}/100
            </p>
          </div>
          <button
            onClick={() => { setStep(0); setRespostas({}); setResult(null) }}
            className="text-xs font-mono border border-[--border] px-3 py-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:border-accent/30 transition-colors"
          >
            Refazer
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6 max-w-3xl">
          {/* Radar + score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">Radar de Maturidade</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1c1d2a" />
                  <PolarAngleAxis dataKey="dimensao" tick={{ fill: "#7c85a0", fontSize: 11 }} />
                  <Radar dataKey="score" stroke="#00c07f" fill="#00c07f" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {DIMENSOES.map(d => {
                const s = r._scores?.[d.titulo] ?? scoreFor(d.id)
                const color = s >= 75 ? "bg-accent" : s >= 50 ? "bg-blue-400" : s >= 30 ? "bg-amber-400" : "bg-red-400"
                return (
                  <div key={d.id} className="rounded-lg border border-[--border] bg-[--surface] p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-text-primary">{d.titulo}</span>
                      <span className="text-xs font-mono font-semibold text-text-secondary">{s}/100</span>
                    </div>
                    <div className="h-1.5 bg-[--border] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${s}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resumo */}
          <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
            <p className="text-sm text-text-secondary leading-relaxed">{result.resumo_diagnostico}</p>
          </div>

          {/* Quick wins */}
          {result.quick_wins?.length > 0 && (
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-mono text-accent uppercase tracking-widest">Quick Wins — Esta Semana</h3>
              </div>
              <ul className="space-y-2">
                {result.quick_wins.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top 3 prioridades */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-text-muted" />
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Top 3 Prioridades</h3>
            </div>
            {result.top3_prioridades.map(p => (
              <div key={p.prioridade} className="rounded-xl border border-[--border] bg-[--surface] p-4 flex gap-3">
                <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-mono font-bold text-accent flex-shrink-0">
                  {p.prioridade}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{p.titulo}</p>
                    <span className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded-full border",
                      p.impacto === "Alto"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    )}>
                      {p.impacto}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{p.descricao}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plano 90 dias */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted" />
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Plano de Ação — 90 Dias</h3>
            </div>
            {(["mes1","mes2","mes3"] as const).map((m, i) => (
              <div key={m} className="rounded-xl border border-[--border] bg-[--surface] p-4">
                <p className="text-xs font-mono text-text-muted uppercase mb-3">Mês {i + 1}</p>
                <div className="space-y-2">
                  {(result.plano_90_dias[m] ?? []).map((a, j) => (
                    <div key={j} className="flex gap-3">
                      <span className="text-[10px] font-mono text-accent flex-shrink-0 mt-0.5">{a.semana}</span>
                      <p className="text-sm text-text-secondary">{a.acao}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Consultor */}
          <Link
            href="/consultor"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold hover:bg-purple-500/15 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver análise completa no Consultor Estratégico
          </Link>
        </div>
      </div>
    )
  }

  // ── Question Step ──
  if (!dimAtual) return null
  const progresso = ((step - 1) / DIMENSOES.length) * 100

  return (
    <div className="animate-fade-in">
      <div className="p-4 md:p-8 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-text-muted">Dimensão {step}/5 — {dimAtual.titulo}</span>
              <span className="text-xs font-mono text-text-muted">{respondidas}/{totalPergs}</span>
            </div>
            <div className="h-1 bg-[--border] rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        </div>
        <h2 className="text-xl font-bold text-text-primary">{dimAtual.titulo}</h2>
      </div>

      <div className="p-4 md:p-8 space-y-4 max-w-2xl">
        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        {dimAtual.perguntas.map(p => (
          <div key={p.id} className="rounded-xl border border-[--border] bg-[--surface] p-4">
            <p className="text-sm font-medium text-text-primary mb-3">{p.texto}</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(v => (
                <button
                  key={v}
                  onClick={() => setRespostas(prev => ({ ...prev, [p.id]: v }))}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-xs font-mono transition-all",
                    respostas[p.id] === v
                      ? "bg-accent/10 border-accent/40 text-accent font-semibold"
                      : "border-[--border] text-text-muted hover:border-[--border-hover] hover:text-text-secondary"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-text-muted font-mono">Não</span>
              <span className="text-[9px] text-text-muted font-mono">Sempre</span>
            </div>
            {respostas[p.id] !== undefined && (
              <p className="text-[10px] text-accent font-mono mt-1">{SCORE_LABELS[respostas[p.id]]}</p>
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1 as typeof step)}
              className="flex-1 py-3 rounded-xl border border-[--border] text-text-muted text-sm font-semibold hover:text-text-secondary transition-colors"
            >
              Voltar
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={() => setStep(s => s + 1 as typeof step)}
              disabled={!canAdvance()}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2",
                canAdvance()
                  ? "bg-accent text-[--background] hover:bg-accent/90"
                  : "bg-[--surface] border border-[--border] text-text-muted cursor-not-allowed"
              )}
            >
              Próxima dimensão
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finalizar}
              disabled={!canAdvance()}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2",
                canAdvance()
                  ? "bg-accent text-[--background] hover:bg-accent/90"
                  : "bg-[--surface] border border-[--border] text-text-muted cursor-not-allowed"
              )}
            >
              <Activity className="w-4 h-4" />
              Gerar Diagnóstico
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
