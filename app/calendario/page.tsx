"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  CalendarDays, Copy, Check, Loader2, AlertTriangle,
  RefreshCw, ChevronRight, Lightbulb,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostCalendario {
  dia:       number
  dia_semana: string
  formato:   string
  pilar:     string
  tema:      string
  gancho:    string
  hashtags:  string[]
}

interface CalendarioResult {
  mes:                   string
  total_posts:           number
  posts:                 PostCalendario[]
  distribuicao_pilares:  Record<string, number>
  dica_estrategica:      string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

const PILARES_OPCOES = ["Educativo", "Autoridade", "Vendas", "Relacionamento", "Entretenimento"]

const FORMATO_STYLE: Record<string, string> = {
  "Reel":     "bg-red-950/60 border-red-500/40 text-red-400",
  "Carrossel":"bg-blue-950/60 border-blue-500/40 text-blue-400",
  "Feed":     "bg-amber-950/60 border-amber-500/40 text-amber-400",
  "Stories":  "bg-accent-dim border-accent-border text-accent",
}

const PILAR_STYLE: Record<string, string> = {
  "Educativo":     "bg-blue-950/60 border-blue-500/40 text-blue-400",
  "Autoridade":    "bg-purple-950/60 border-purple-500/40 text-purple-400",
  "Vendas":        "bg-green-950/60 border-green-500/40 text-green-400",
  "Relacionamento":"bg-pink-950/60 border-pink-500/40 text-pink-400",
  "Entretenimento":"bg-amber-950/60 border-amber-500/40 text-amber-400",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800) }}
      className={cn(
        "flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all flex-shrink-0",
        done
          ? "bg-accent-dim border-accent-border text-accent"
          : "border-border text-text-muted hover:border-accent-border hover:text-accent",
        className,
      )}
    >
      {done ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {done ? "Copiado" : "Copiar"}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const now = new Date()
  const [mes,       setMes]       = useState(now.getMonth() + 1)
  const [ano,       setAno]       = useState(now.getFullYear())
  const [pilares,   setPilares]   = useState<string[]>(["Educativo", "Autoridade", "Vendas", "Relacionamento"])
  const [frequencia, setFrequencia] = useState(5)
  const [temas,     setTemas]     = useState("")
  const [loading,   setLoading]   = useState(false)
  const [resultado, setResultado] = useState<CalendarioResult | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [toast,     setToast]     = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000)
  }

  const togglePilar = (p: string) => {
    setPilares(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const gerar = async () => {
    if (pilares.length === 0) { setError("Selecione ao menos um pilar."); return }
    setError(null); setLoading(true); setResultado(null)
    try {
      const temasList = temas.split(",").map(t => t.trim()).filter(Boolean)
      const res = await fetch("/api/calendario", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mes, ano, pilares, frequencia, temas: temasList }),
      })
      const data = await res.json() as CalendarioResult & { error?: string }
      if (data.error) throw new Error(data.error)
      setResultado(data)
      showToast(`Calendário de ${data.total_posts} posts gerado!`)
    } catch (e) {
      setError("Erro ao gerar calendário: " + String(e))
    } finally {
      setLoading(false)
    }
  }

  const toFullText = (r: CalendarioResult) =>
    `CALENDÁRIO EDITORIAL — ${r.mes}\nTotal: ${r.total_posts} posts\n\n` +
    r.posts.map(p => `${p.dia}/${String(mes).padStart(2,"0")} (${p.dia_semana}) | ${p.formato} | ${p.pilar}\n${p.tema}\nGancho: ${p.gancho}`).join("\n\n")

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Calendário Editorial"
        subtitle="PLANEJAMENTO · PILARES · FREQUÊNCIA"
        actions={
          loading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Gerando calendário...
            </div>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 items-start">

          {/* ── PAINEL ESQUERDO ─── */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-text-muted" />
                <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Período</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Mês</label>
                  <select
                    value={mes}
                    onChange={e => setMes(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent/40 transition-colors"
                  >
                    {MESES.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Ano</label>
                  <select
                    value={ano}
                    onChange={e => setAno(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent/40 transition-colors"
                  >
                    {[2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">
                  Frequência Semanal: <span className="text-accent">{frequencia}x/semana</span>
                </label>
                <input
                  type="range" min={1} max={7} value={frequencia}
                  onChange={e => setFrequencia(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
                  <span>1x</span><span>7x</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">Pilares de Conteúdo</div>
              <div className="space-y-2">
                {PILARES_OPCOES.map(p => (
                  <button key={p} type="button" onClick={() => togglePilar(p)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left",
                      pilares.includes(p)
                        ? "bg-accent-dim border-accent-border"
                        : "border-border hover:border-border-hover hover:bg-white/[0.02]",
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      pilares.includes(p) ? "bg-accent border-accent" : "border-border")}>
                      {pilares.includes(p) && <Check className="w-2.5 h-2.5 text-background" />}
                    </div>
                    <span className={cn("text-[12px] font-medium", pilares.includes(p) ? "text-accent" : "text-text-secondary")}>
                      {p}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <label className="block text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">
                Temas Prioritários
                <span className="normal-case font-normal tracking-normal ml-2 text-text-muted/60">(opcional)</span>
              </label>
              <input
                value={temas}
                onChange={e => setTemas(e.target.value)}
                placeholder="ex: insulina, longevidade, emagrecimento"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
              />
              <p className="text-[10px] text-text-muted mt-1.5">Separe por vírgula</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            <button
              type="button" onClick={gerar}
              disabled={loading || pilares.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
                : <><CalendarDays className="w-4 h-4" /> Gerar Calendário</>
              }
            </button>

            {resultado && (
              <button type="button" onClick={gerar} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-text-muted text-[12px] hover:border-accent-border hover:text-accent transition-all disabled:opacity-40">
                <RefreshCw className="w-3.5 h-3.5" /> Gerar Novamente
              </button>
            )}
          </div>

          {/* ── PAINEL DIREITO ─── */}
          <div>
            {!loading && !resultado && (
              <EmptyState icon={CalendarDays} title="Configure e gere seu calendário" subtitle="Escolha o mês, pilares de conteúdo e frequência de postagem. Claude irá criar uma grade completa com temas, formatos e ganchos." />
            )}

            {loading && (
              <div className="space-y-2 animate-pulse">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-border rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-border rounded w-3/4" />
                        <div className="h-2.5 bg-border rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resultado && !loading && (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[16px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
                        {resultado.mes}
                      </h3>
                      <p className="text-[11px] font-mono text-text-muted mt-0.5">{resultado.total_posts} posts planejados</p>
                    </div>
                    <CopyBtn text={toFullText(resultado)} />
                  </div>
                  {/* Distribuição */}
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(resultado.distribuicao_pilares).map(([pilar, pct]) => (
                      <div key={pilar} className="bg-background border border-border rounded-lg p-2.5">
                        <div className="text-[9px] font-mono text-text-muted mb-1">{pilar.toUpperCase()}</div>
                        <div className="text-[14px] font-bold text-text-primary">{pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dica estratégica */}
                {resultado.dica_estrategica && (
                  <div className="bg-card border border-accent-border rounded-xl p-4">
                    <div className="flex items-start gap-2.5">
                      <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[10px] font-mono text-accent uppercase tracking-wide mb-1">Dica Estratégica</div>
                        <p className="text-[12px] text-text-secondary leading-relaxed">{resultado.dica_estrategica}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Posts */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Grade de Posts</span>
                    <span className="text-[10px] font-mono text-accent">{resultado.posts.length} posts</span>
                  </div>
                  <div className="space-y-2">
                    {resultado.posts.map((post, i) => (
                      <div key={i} className="bg-background border border-border rounded-lg p-3 hover:border-border-hover transition-all">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-card border border-border flex flex-col items-center justify-center">
                            <span className="text-[14px] font-bold text-text-primary leading-none">{post.dia}</span>
                            <span className="text-[8px] font-mono text-text-muted">{post.dia_semana.slice(0, 3).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={cn("text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full border",
                                FORMATO_STYLE[post.formato] ?? "bg-border text-text-muted border-border"
                              )}>{post.formato}</span>
                              <span className={cn("text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full border",
                                PILAR_STYLE[post.pilar] ?? "bg-border text-text-muted border-border"
                              )}>{post.pilar}</span>
                            </div>
                            <div className="text-[12px] font-medium text-text-primary mb-1 leading-snug">{post.tema}</div>
                            <div className="flex items-start gap-1">
                              <ChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                              <span className="text-[11px] text-text-muted leading-snug">{post.gancho}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Copiar tudo */}
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(toFullText(resultado)); showToast("Calendário completo copiado!") }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-accent-border text-accent text-[13px] font-medium hover:bg-accent-dim transition-all"
                >
                  <Copy className="w-4 h-4" /> Copiar Calendário Completo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast?.message ?? null} type={toast?.type} />
    </div>
  )
}
