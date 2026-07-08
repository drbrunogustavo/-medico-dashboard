"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import { PautasPickerModal } from "@/components/PautasPickerModal"
import { cn } from "@/lib/utils"
import {
  LayoutGrid, Copy, Check, Loader2, AlertTriangle,
  ChevronRight, RefreshCw, Hash, Layers, FileText,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slide {
  numero:      number
  titulo:      string
  conteudo:    string
  dica_visual: string
}

interface CarrosselResult {
  titulo:    string
  subtitulo: string
  slides:    Slide[]
  cta:       string
  hashtags:  string[]
  legenda:   string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OBJETIVOS = ["Educativo", "Autoridade", "Vendas", "Engajamento", "Inspirador"]
const TONS      = ["Profissional", "Próximo", "Científico", "Motivacional", "Didático"]

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

export default function CarrosselPage() {
  const [tema,        setTema]        = useState("")
  const [slides,      setSlides]      = useState(7)
  const [objetivo,    setObjetivo]    = useState("Educativo")
  const [tom,         setTom]         = useState("Profissional")
  const [showPautas,  setShowPautas]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [resultado, setResultado] = useState<CarrosselResult | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [toast,    setToast]    = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000)
  }

  const gerar = async () => {
    if (!tema.trim()) { setError("Informe o tema do carrossel."); return }
    setError(null); setLoading(true); setResultado(null)
    try {
      const res = await fetch("/api/carrossel", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tema, slides, objetivo, tom }),
      })
      const data = await res.json() as CarrosselResult & { error?: string }
      if (data.error) throw new Error(data.error)
      setResultado(data)
      showToast("Carrossel gerado com sucesso!")
    } catch (e) {
      setError("Erro ao gerar carrossel: " + String(e))
    } finally {
      setLoading(false)
    }
  }

  const [exportFmt, setExportFmt] = useState<"canva" | "briefing">("canva")

  const toCanva = (r: CarrosselResult) =>
    `CARROSSEL — ${r.titulo}\n${r.subtitulo}\n\n` +
    r.slides.map(s => `SLIDE ${s.numero} • ${s.titulo}\n${s.conteudo}`).join("\n\n") +
    `\n\n——————————\nCTA: ${r.cta}\nHASHTAGS: ${r.hashtags.map(h => "#" + h.replace(/^#/, "")).join(" ")}\n\nLEGENDA:\n${r.legenda}`

  const toBriefing = (r: CarrosselResult) => {
    const n = r.slides.length
    const slideBlocks = r.slides.map(s => {
      const lines = [`═══ SLIDE ${s.numero} DE ${n} ═══`, `[TÍTULO] ${s.titulo}`, `[CORPO] ${s.conteudo}`]
      if (s.dica_visual?.trim()) lines.push(`[VISUAL] ${s.dica_visual}`)
      return lines.join("\n")
    })
    return slideBlocks.join("\n\n") +
      `\n\n[CTA] ${r.cta}\n[HASHTAGS] ${r.hashtags.map(h => "#" + h.replace(/^#/, "")).join(" ")}\n[LEGENDA] ${r.legenda}`
  }

  const toFullText = (r: CarrosselResult) => exportFmt === "canva" ? toCanva(r) : toBriefing(r)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Gerador de Carrossel"
        subtitle="SLIDES · CAPA · CTA · LEGENDA"
        actions={
          loading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Gerando carrossel...
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
                <LayoutGrid className="w-4 h-4 text-text-muted" />
                <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Configuração</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Tema *</label>
                  <div className="flex gap-2">
                    <input
                      value={tema}
                      onChange={e => setTema(e.target.value)}
                      placeholder="ex: Como emagrecer sem passar fome"
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
                    Nº de Slides: <span className="text-accent">{slides}</span>
                  </label>
                  <input
                    type="range" min={3} max={12} value={slides}
                    onChange={e => setSlides(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
                    <span>3</span><span>12</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">Objetivo</div>
              <div className="flex flex-wrap gap-2">
                {OBJETIVOS.map(o => (
                  <button key={o} type="button" onClick={() => setObjetivo(o)}
                    className={cn(
                      "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                      objetivo === o
                        ? "bg-accent-dim border-accent-border text-accent font-medium"
                        : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover",
                    )}>{o}</button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">Tom de Voz</div>
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
                : <><LayoutGrid className="w-4 h-4" /> Gerar Carrossel</>
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
              <EmptyState icon={LayoutGrid} title="Configure e gere seu carrossel" subtitle="Informe o tema, ajuste o número de slides e escolha o objetivo. Claude irá criar todos os slides com textos prontos para usar." />
            )}

            {loading && (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <div className="h-4 bg-border rounded w-2/5 mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-border rounded w-full" />
                      <div className="h-3 bg-border rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resultado && !loading && (
              <div className="space-y-4">
                {/* Capa */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center">
                        <Layers className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
                        Capa do Carrossel
                      </h3>
                    </div>
                    <CopyBtn text={`${resultado.titulo}\n${resultado.subtitulo}`} />
                  </div>
                  <div className="bg-background border border-border rounded-lg p-4">
                    <div className="text-[16px] font-bold text-text-primary mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
                      {resultado.titulo}
                    </div>
                    <div className="text-[12px] text-text-secondary">{resultado.subtitulo}</div>
                  </div>
                </div>

                {/* Slides */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center">
                        <LayoutGrid className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
                        Slides ({resultado.slides.length})
                      </h3>
                    </div>
                    <CopyBtn text={resultado.slides.map(s => `SLIDE ${s.numero}: ${s.titulo}\n${s.conteudo}`).join("\n\n")} />
                  </div>
                  <div className="space-y-3">
                    {resultado.slides.map(slide => (
                      <div key={slide.numero} className="bg-background border border-border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center">
                            <span className="text-[11px] font-bold text-accent">{slide.numero}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-text-primary mb-1">{slide.titulo}</div>
                            <p className="text-[12px] text-text-secondary leading-relaxed mb-2">{slide.conteudo}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono text-text-muted">VISUAL:</span>
                              <span className="text-[10px] text-text-muted italic">{slide.dica_visual}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-accent" />
                      <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">CTA Final</span>
                    </div>
                    <CopyBtn text={resultado.cta} />
                  </div>
                  <p className="text-[13px] text-text-primary font-medium">{resultado.cta}</p>
                </div>

                {/* Hashtags */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-text-muted" />
                      <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Hashtags</span>
                    </div>
                    <CopyBtn text={resultado.hashtags.map(h => "#" + h).join(" ")} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resultado.hashtags.map(h => (
                      <span key={h} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Legenda */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Legenda Completa</span>
                    <CopyBtn text={resultado.legenda} />
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{resultado.legenda}</p>
                </div>

                {/* Copiar tudo */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-mono flex-shrink-0">
                    <button type="button"
                      onClick={() => setExportFmt("canva")}
                      className={cn("px-2.5 py-1.5 transition-all", exportFmt === "canva" ? "bg-accent text-background font-semibold" : "text-text-muted hover:text-text-secondary")}
                    >CANVA</button>
                    <button type="button"
                      onClick={() => setExportFmt("briefing")}
                      className={cn("px-2.5 py-1.5 transition-all border-l border-border", exportFmt === "briefing" ? "bg-accent text-background font-semibold" : "text-text-muted hover:text-text-secondary")}
                    >BRIEFING</button>
                  </div>
                  <button type="button"
                    onClick={() => { navigator.clipboard.writeText(toFullText(resultado!)); showToast("Carrossel completo copiado!") }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-accent-border text-accent text-[13px] font-medium hover:bg-accent-dim transition-all"
                  >
                    <Copy className="w-4 h-4" /> Copiar Carrossel Completo
                  </button>
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
