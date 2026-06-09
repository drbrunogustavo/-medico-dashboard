"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  Repeat2, Copy, Check, Loader2, AlertTriangle,
  RefreshCw, LayoutGrid, MessageCircle, Instagram,
  Mail, Twitter,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CarrosselRepurposed { titulo: string; slides: string[]; cta: string }
interface StoryRepurposed     { slides: string[] }

interface RepurposingResult {
  carrossel?: CarrosselRepurposed
  story?:     StoryRepurposed
  legenda?:   string
  whatsapp?:  string
  tweet?:     string
  email?:     string
}

type Formato = "carrossel" | "story" | "legenda" | "whatsapp" | "tweet" | "email"

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMATOS: { id: Formato; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "carrossel", label: "Carrossel",  icon: LayoutGrid,    desc: "Slides para Instagram"    },
  { id: "story",     label: "Stories",   icon: Instagram,     desc: "Sequência de stories"     },
  { id: "legenda",   label: "Legenda",   icon: MessageCircle, desc: "Post para feed"           },
  { id: "whatsapp",  label: "WhatsApp",  icon: MessageCircle, desc: "Mensagem informal"        },
  { id: "tweet",     label: "Tweet/X",   icon: Twitter,       desc: "Post para X/Twitter"      },
  { id: "email",     label: "E-mail",    icon: Mail,          desc: "Newsletter ou lista"      },
]

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

export default function RepurposingPage() {
  const [conteudo,  setConteudo]  = useState("")
  const [formatos,  setFormatos]  = useState<Formato[]>(["carrossel", "story", "legenda", "whatsapp"])
  const [loading,   setLoading]   = useState(false)
  const [resultado, setResultado] = useState<RepurposingResult | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [toast,     setToast]     = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000)
  }

  const toggleFormato = (id: Formato) => {
    setFormatos(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  const gerar = async () => {
    if (!conteudo.trim()) { setError("Cole o conteúdo original acima."); return }
    if (formatos.length === 0) { setError("Selecione ao menos um formato."); return }
    setError(null); setLoading(true); setResultado(null)
    try {
      const res = await fetch("/api/repurposing", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ conteudo, formatos }),
      })
      const data = await res.json() as RepurposingResult & { error?: string }
      if (data.error) throw new Error(data.error)
      setResultado(data)
      showToast("Conteúdo repurposado com sucesso!")
    } catch (e) {
      setError("Erro ao repurposar: " + String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Repurposing de Conteúdo"
        subtitle="ADAPTAR · REUTILIZAR · MULTIPLICAR ALCANCE"
        actions={
          loading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Repurposando conteúdo...
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
                <Repeat2 className="w-4 h-4 text-text-muted" />
                <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Conteúdo Original</span>
              </div>
              <textarea
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
                placeholder="Cole aqui seu roteiro, legenda, artigo, transcrição de vídeo ou qualquer conteúdo que deseja adaptar para outros formatos..."
                rows={10}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none"
              />
              {conteudo.trim() && (
                <div className="text-[10px] font-mono text-text-muted mt-2 text-right">
                  {conteudo.length} caracteres
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">
                Formatos de Saída
              </div>
              <div className="space-y-2">
                {FORMATOS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFormato(f.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                      formatos.includes(f.id)
                        ? "bg-accent-dim border-accent-border"
                        : "border-border hover:border-border-hover hover:bg-white/[0.02]",
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      formatos.includes(f.id) ? "bg-accent border-accent" : "border-border")}>
                      {formatos.includes(f.id) && <Check className="w-3 h-3 text-background" />}
                    </div>
                    <f.icon className={cn("w-4 h-4 flex-shrink-0", formatos.includes(f.id) ? "text-accent" : "text-text-muted")} />
                    <div>
                      <div className={cn("text-[12px] font-semibold", formatos.includes(f.id) ? "text-accent" : "text-text-primary")}>
                        {f.label}
                      </div>
                      <div className="text-[10px] text-text-muted">{f.desc}</div>
                    </div>
                  </button>
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
              disabled={loading || !conteudo.trim() || formatos.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Repurposando...</>
                : <><Repeat2 className="w-4 h-4" /> Repurposar Conteúdo</>
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
              <EmptyState icon={Repeat2} title="Cole seu conteúdo e escolha os formatos" subtitle="Cole um roteiro, legenda ou artigo. Selecione os formatos desejados e Claude irá adaptar o conteúdo para cada plataforma." />
            )}

            {loading && (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <div className="h-4 bg-border rounded w-1/3 mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-border rounded w-full" />
                      <div className="h-3 bg-border rounded w-5/6" />
                      <div className="h-3 bg-border rounded w-4/6" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resultado && !loading && (
              <div className="space-y-4">
                {resultado.carrossel && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-accent" />
                        <span className="text-[13px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>Carrossel</span>
                      </div>
                      <CopyBtn text={`${resultado.carrossel.titulo}\n\n${resultado.carrossel.slides.join("\n\n")}\n\nCTA: ${resultado.carrossel.cta}`} />
                    </div>
                    <div className="font-semibold text-text-primary text-[13px] mb-2">{resultado.carrossel.titulo}</div>
                    <div className="space-y-1.5 mb-3">
                      {resultado.carrossel.slides.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-[12px] text-text-secondary">
                          <span className="text-[9px] font-mono font-bold text-accent flex-shrink-0 mt-0.5 w-6">{i + 1}.</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] font-mono text-accent border-t border-border pt-2">
                      CTA: {resultado.carrossel.cta}
                    </div>
                  </div>
                )}

                {resultado.story && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-accent" />
                        <span className="text-[13px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>Stories</span>
                      </div>
                      <CopyBtn text={resultado.story.slides.join("\n\n---\n\n")} />
                    </div>
                    <div className="space-y-2">
                      {resultado.story.slides.map((s, i) => (
                        <div key={i} className="bg-background border border-border rounded-lg p-3">
                          <div className="text-[9px] font-mono text-text-muted mb-1">STORY {i + 1}</div>
                          <p className="text-[12px] text-text-primary">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resultado.legenda && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>Legenda (Feed)</span>
                      <CopyBtn text={resultado.legenda} />
                    </div>
                    <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{resultado.legenda}</p>
                  </div>
                )}

                {resultado.whatsapp && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-accent" />
                        <span className="text-[13px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>WhatsApp</span>
                      </div>
                      <CopyBtn text={resultado.whatsapp} />
                    </div>
                    <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{resultado.whatsapp}</p>
                  </div>
                )}

                {resultado.tweet && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-accent" />
                        <span className="text-[13px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>Tweet / X</span>
                      </div>
                      <CopyBtn text={resultado.tweet} />
                    </div>
                    <p className="text-[12px] text-text-secondary leading-relaxed">{resultado.tweet}</p>
                    <div className="text-[10px] font-mono text-text-muted mt-2 text-right">{resultado.tweet.length}/280</div>
                  </div>
                )}

                {resultado.email && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-accent" />
                        <span className="text-[13px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>E-mail</span>
                      </div>
                      <CopyBtn text={resultado.email} />
                    </div>
                    <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{resultado.email}</p>
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
