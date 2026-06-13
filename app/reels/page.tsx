"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import { PautasPickerModal } from "@/components/PautasPickerModal"
import { cn } from "@/lib/utils"
import {
  Play, Copy, Check, Loader2, AlertTriangle,
  RefreshCw, ChevronRight, TrendingUp, FileText,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdeiaReel {
  titulo:          string
  gancho:          string
  estrutura:       string[]
  duracao:         string
  formato:         string
  potencial_viral: "Alto" | "Médio" | "Baixo"
  razao_viral:     string
}

interface ReelsResult {
  ideias: IdeiaReel[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIAS = ["Educativo", "Autoridade", "Engajamento", "Vendas", "Motivacional", "Polêmico"]

const VIRAL_STYLE: Record<string, string> = {
  "Alto":  "bg-accent-dim border-accent-border text-accent",
  "Médio": "bg-amber-50 border-amber-200 text-amber-700",
  "Baixo": "bg-blue-50 border-blue-200 text-blue-700",
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

export default function ReelsPage() {
  const [tema,       setTema]       = useState("")
  const [categoria,  setCategoria]  = useState("Educativo")
  const [quantidade, setQuantidade] = useState(8)
  const [showPautas, setShowPautas] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [resultado,  setResultado]  = useState<ReelsResult | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [toast,      setToast]      = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000)
  }

  const gerar = async () => {
    if (!tema.trim()) { setError("Informe o tema dos reels."); return }
    setError(null); setLoading(true); setResultado(null)
    try {
      const res = await fetch("/api/reels", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tema, categoria, quantidade }),
      })
      const data = await res.json() as ReelsResult & { error?: string }
      if (data.error) throw new Error(data.error)
      setResultado(data)
      showToast(`${data.ideias?.length ?? 0} ideias de Reels geradas!`)
    } catch (e) {
      setError("Erro ao gerar ideias: " + String(e))
    } finally {
      setLoading(false)
    }
  }

  const ideiaToText = (ideia: IdeiaReel) =>
    `${ideia.titulo}\n\nGancho: ${ideia.gancho}\n\nEstrutura:\n${ideia.estrutura.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nDuração: ${ideia.duracao} | Formato: ${ideia.formato}\nPotencial viral: ${ideia.potencial_viral} — ${ideia.razao_viral}`

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Gerador de Ideias para Reels"
        subtitle="GANCHO · ESTRUTURA · POTENCIAL VIRAL"
        actions={
          loading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Gerando ideias...
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
                <Play className="w-4 h-4 text-text-muted" />
                <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Configuração</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Tema Geral *</label>
                  <div className="flex gap-2">
                    <input
                      value={tema}
                      onChange={e => setTema(e.target.value)}
                      placeholder="ex: Emagrecimento, longevidade, hormônios..."
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPautas(true)}
                      title="Usar pauta do banco"
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-colors flex-shrink-0 text-[11px] font-medium"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pautas</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">
                    Quantidade: <span className="text-accent">{quantidade}</span>
                  </label>
                  <input
                    type="range" min={4} max={15} value={quantidade}
                    onChange={e => setQuantidade(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
                    <span>4</span><span>15</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">Categoria</div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map(c => (
                  <button key={c} type="button" onClick={() => setCategoria(c)}
                    className={cn(
                      "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                      categoria === c
                        ? "bg-accent-dim border-accent-border text-accent font-medium"
                        : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover",
                    )}>{c}</button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-700">{error}</p>
              </div>
            )}

            <button
              type="button" onClick={gerar}
              disabled={loading || !tema.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
                : <><Play className="w-4 h-4" /> Gerar Ideias de Reels</>
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
              <EmptyState icon={Play} title="Configure e gere suas ideias" subtitle="Informe o tema e escolha a categoria. Claude vai criar ideias completas com gancho, estrutura e análise de potencial viral." />
            )}

            {loading && (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <div className="h-4 bg-border rounded w-2/3 mb-3" />
                    <div className="h-3 bg-border rounded w-full mb-2" />
                    <div className="space-y-1.5">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="h-2.5 bg-border rounded w-4/5" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resultado && !loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">
                    {resultado.ideias.length} Ideias Geradas
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
                    <TrendingUp className="w-3 h-3 text-accent" />
                    <span className="text-accent">{resultado.ideias.filter(i => i.potencial_viral === "Alto").length}</span> alto potencial
                  </div>
                </div>

                <div className="space-y-3">
                  {resultado.ideias.map((ideia, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-[14px] font-semibold text-text-primary leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>
                          {ideia.titulo}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", VIRAL_STYLE[ideia.potencial_viral])}>
                            {ideia.potencial_viral}
                          </span>
                          <CopyBtn text={ideiaToText(ideia)} />
                        </div>
                      </div>

                      <div className="mb-3 p-3 bg-background rounded-lg border border-border">
                        <div className="text-[9px] font-mono text-text-muted mb-1">GANCHO (3s)</div>
                        <p className="text-[12px] text-text-primary font-medium">{ideia.gancho}</p>
                      </div>

                      <div className="mb-3">
                        <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-2">Estrutura</div>
                        <div className="space-y-1">
                          {ideia.estrutura.map((ponto, j) => (
                            <div key={j} className="flex items-start gap-2 text-[12px] text-text-secondary">
                              <ChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                              <span>{ponto}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">{ideia.duracao}</span>
                        <span className="text-[10px] text-text-muted">{ideia.formato}</span>
                        <span className="text-[10px] text-text-muted flex-1 truncate">— {ideia.razao_viral}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast?.message ?? null} type={toast?.type} />
      {showPautas && (
        <PautasPickerModal
          onSelect={t => setTema(t)}
          onClose={() => setShowPautas(false)}
        />
      )}
    </div>
  )
}
