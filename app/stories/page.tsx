"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  Instagram, Copy, Check, Loader2, AlertTriangle,
  RefreshCw, Hash, Smartphone,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Story {
  numero:      number
  texto:       string
  tipo:        string
  dica_visual: string
  sticker?:    string
}

interface StoriesResult {
  sequencia_titulo: string
  stories:          Story[]
  hashtags:         string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TONS    = ["Educativo", "Motivacional", "Casual", "Científico", "Polêmico"]
const N_SLIDES = [3, 5, 7, 10]

const TIPO_STYLE: Record<string, string> = {
  "Gancho":    "bg-red-950/60 border-red-500/40 text-red-400",
  "Conteúdo":  "bg-blue-950/60 border-blue-500/40 text-blue-400",
  "Revelação": "bg-amber-950/60 border-amber-500/40 text-amber-400",
  "CTA":       "bg-accent-dim border-accent-border text-accent",
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

export default function StoriesPage() {
  const [tema,     setTema]     = useState("")
  const [slides,   setSlides]   = useState(5)
  const [tom,      setTom]      = useState("Educativo")
  const [loading,  setLoading]  = useState(false)
  const [resultado, setResultado] = useState<StoriesResult | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [toast,    setToast]    = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000)
  }

  const gerar = async () => {
    if (!tema.trim()) { setError("Informe o tema dos stories."); return }
    setError(null); setLoading(true); setResultado(null)
    try {
      const res = await fetch("/api/stories", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tema, slides, tom }),
      })
      const data = await res.json() as StoriesResult & { error?: string }
      if (data.error) throw new Error(data.error)
      setResultado(data)
      showToast("Sequência de stories gerada!")
    } catch (e) {
      setError("Erro ao gerar stories: " + String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Gerador de Stories"
        subtitle="SEQUÊNCIA · GANCHO · STICKERS · CTA"
        actions={
          loading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Gerando stories...
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
                <Instagram className="w-4 h-4 text-text-muted" />
                <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Configuração</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Tema *</label>
                  <input
                    value={tema}
                    onChange={e => setTema(e.target.value)}
                    placeholder="ex: Resistência à insulina — sinais que você ignora"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">Nº de Stories</div>
              <div className="flex gap-2">
                {N_SLIDES.map(n => (
                  <button key={n} type="button" onClick={() => setSlides(n)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-[12px] font-semibold transition-all",
                      slides === n
                        ? "bg-accent-dim border-accent-border text-accent"
                        : "border-border text-text-muted hover:border-border-hover",
                    )}>{n}</button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">Tom</div>
              <div className="flex flex-wrap gap-2">
                {TONS.map(t => (
                  <button key={t} type="button" onClick={() => setTom(t)}
                    className={cn(
                      "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                      tom === t
                        ? "bg-accent-dim border-accent-border text-accent font-medium"
                        : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover",
                    )}>{t}</button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            <button
              type="button" onClick={gerar}
              disabled={loading || !tema.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
                : <><Smartphone className="w-4 h-4" /> Gerar Stories</>
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
              <EmptyState icon={Instagram} title="Configure e gere sua sequência" subtitle="Informe o tema, escolha o número de stories e o tom. Claude vai criar uma sequência com gancho irresistível, conteúdo e CTA." />
            )}

            {loading && (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-border flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-border rounded w-4/5" />
                        <div className="h-3 bg-border rounded w-2/5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resultado && !loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
                    {resultado.sequencia_titulo}
                  </h3>
                  <CopyBtn text={resultado.stories.map(s => `Story ${s.numero}: ${s.texto}`).join("\n\n")} />
                </div>

                <div className="space-y-2.5">
                  {resultado.stories.map(story => (
                    <div key={story.numero} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center">
                          <span className="text-[11px] font-bold text-accent">{story.numero}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={cn(
                              "text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border",
                              TIPO_STYLE[story.tipo] ?? "bg-border text-text-muted border-border",
                            )}>{story.tipo}</span>
                          </div>
                          <p className="text-[13px] text-text-primary leading-relaxed mb-2">{story.texto}</p>
                          <div className="space-y-1">
                            <div className="flex items-start gap-1.5">
                              <span className="text-[9px] font-mono text-text-muted flex-shrink-0">VISUAL:</span>
                              <span className="text-[10px] text-text-muted italic">{story.dica_visual}</span>
                            </div>
                            {story.sticker && (
                              <div className="flex items-start gap-1.5">
                                <span className="text-[9px] font-mono text-accent flex-shrink-0">STICKER:</span>
                                <span className="text-[10px] text-text-secondary">{story.sticker}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <CopyBtn text={story.texto} />
                      </div>
                    </div>
                  ))}
                </div>

                {resultado.hashtags.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="w-4 h-4 text-text-muted" />
                      <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Hashtags</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {resultado.hashtags.map(h => (
                        <span key={h} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">
                          #{h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast?.message ?? null} type={toast?.type} />
    </div>
  )
}
