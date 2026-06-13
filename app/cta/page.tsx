"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  Zap, Copy, Check, Loader2, AlertTriangle,
  RefreshCw, MousePointerClick,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cta {
  texto: string
  tipo:  string
  canal: string
}

interface CtaResult {
  ctas: Cta[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OBJETIVOS = [
  { id: "agendar consulta",    label: "Agendar Consulta"    },
  { id: "seguir perfil",       label: "Seguir Perfil"       },
  { id: "comentar",            label: "Comentar"            },
  { id: "salvar post",         label: "Salvar Post"         },
  { id: "compartilhar",        label: "Compartilhar"        },
  { id: "ver link na bio",     label: "Ver Link na Bio"     },
  { id: "enviar mensagem",     label: "Enviar Mensagem"     },
]

const FORMATOS = ["Reel", "Carrossel", "Feed", "Stories", "Bio"]

const TIPO_STYLE: Record<string, string> = {
  "Imperativo": "bg-accent-dim border-accent-border text-accent",
  "Pergunta":   "bg-blue-50 border-blue-200 text-blue-700",
  "Benefício":  "bg-amber-50 border-amber-200 text-amber-700",
  "Urgência":   "bg-red-50 border-red-200 text-red-700",
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

export default function CtaPage() {
  const [tema,      setTema]      = useState("")
  const [objetivo,  setObjetivo]  = useState("agendar consulta")
  const [formato,   setFormato]   = useState("Reel")
  const [quantidade, setQuantidade] = useState(10)
  const [loading,   setLoading]   = useState(false)
  const [resultado, setResultado] = useState<CtaResult | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [toast,     setToast]     = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000)
  }

  const gerar = async () => {
    if (!tema.trim()) { setError("Informe o tema do conteúdo."); return }
    setError(null); setLoading(true); setResultado(null)
    try {
      const res = await fetch("/api/cta", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tema, objetivo, formato, quantidade }),
      })
      const data = await res.json() as CtaResult & { error?: string }
      if (data.error) throw new Error(data.error)
      setResultado(data)
      showToast(`${data.ctas?.length ?? 0} CTAs gerados!`)
    } catch (e) {
      setError("Erro ao gerar CTAs: " + String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Gerador de CTAs"
        subtitle="CALLS-TO-ACTION · CONVERSÃO · ENGAJAMENTO"
        actions={
          loading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Gerando CTAs...
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
                <MousePointerClick className="w-4 h-4 text-text-muted" />
                <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Configuração</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Tema do Conteúdo *</label>
                  <input
                    value={tema}
                    onChange={e => setTema(e.target.value)}
                    placeholder="ex: Como reduzir a insulina naturalmente"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">
                    Quantidade: <span className="text-accent">{quantidade}</span>
                  </label>
                  <input
                    type="range" min={5} max={20} value={quantidade}
                    onChange={e => setQuantidade(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
                    <span>5</span><span>20</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">Objetivo do CTA</div>
              <div className="space-y-1.5">
                {OBJETIVOS.map(o => (
                  <button key={o.id} type="button" onClick={() => setObjetivo(o.id)}
                    className={cn(
                      "w-full text-left text-[12px] px-3 py-2 rounded-lg border transition-all",
                      objetivo === o.id
                        ? "bg-accent-dim border-accent-border text-accent font-medium"
                        : "border-border text-text-secondary hover:border-border-hover hover:bg-white/[0.02]",
                    )}>{o.label}</button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">Formato</div>
              <div className="flex flex-wrap gap-2">
                {FORMATOS.map(f => (
                  <button key={f} type="button" onClick={() => setFormato(f)}
                    className={cn(
                      "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                      formato === f
                        ? "bg-accent-dim border-accent-border text-accent font-medium"
                        : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover",
                    )}>{f}</button>
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
                : <><Zap className="w-4 h-4" /> Gerar CTAs</>
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
              <EmptyState icon={Zap} title="Configure e gere seus CTAs" subtitle="Informe o tema do conteúdo, escolha o objetivo e o formato. Claude irá criar variações de CTAs para maximizar a conversão." />
            )}

            {loading && (
              <div className="space-y-2.5 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-4">
                    <div className="h-4 bg-border rounded w-3/4 mb-2" />
                    <div className="flex gap-2">
                      <div className="h-3 bg-border rounded w-16" />
                      <div className="h-3 bg-border rounded w-12" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resultado && !loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">
                    {resultado.ctas.length} CTAs Gerados
                  </span>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(resultado.ctas.map(c => c.texto).join("\n\n")); showToast("Todos os CTAs copiados!") }}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all"
                  >
                    <Copy className="w-3 h-3" /> Copiar Todos
                  </button>
                </div>

                <div className="space-y-2.5">
                  {resultado.ctas.map((cta, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 group">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] text-text-primary leading-relaxed flex-1">{cta.texto}</p>
                        <CopyBtn text={cta.texto} />
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className={cn(
                          "text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border",
                          TIPO_STYLE[cta.tipo] ?? "bg-border text-text-muted border-border",
                        )}>{cta.tipo}</span>
                        <span className="text-[9px] font-mono text-text-muted">{cta.canal}</span>
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
    </div>
  )
}
