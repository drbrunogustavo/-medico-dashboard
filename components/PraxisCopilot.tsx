"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sparkles, Loader2, ArrowRight, X, Command } from "lucide-react"
import { cn } from "@/lib/utils"

interface CopilotResult {
  action:  "navigate" | "suggest"
  route?:  string
  message: string
}

// Sugestões rápidas por rota atual
const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  "/agenda":             ["Briefing do dia com IA", "Abrir pacientes", "Ver financeiro"],
  "/pacientes":          ["Buscar paciente por diagnóstico", "Ideias de conteúdo", "Ir para Copiloto"],
  "/pautas":             ["Ideias do consultório", "Radar de tendências", "Abrir calendário"],
  "/executivo":          ["Analisar mês", "Ver leads no CRM", "Ir para diagnóstico"],
  "/copiloto":           ["Ver histórico de pacientes", "Abrir agenda", "Ir para prescrição"],
  "/crm":                ["Ver leads novos", "NPS dos pacientes", "Nutrir leads"],
  "/financeiro":         ["Painel executivo", "Relatório do mês", "Ver consultas"],
  "/interpretacao-exames":["Abrir prontuário", "Ver protocolos", "Prescrição assistida"],
}

const DEFAULT_SUGGESTIONS = [
  "Abrir agenda de hoje",
  "Ver lista de pacientes",
  "Gerar ideias de conteúdo",
  "Analisar mês no executivo",
]

export function PraxisCopilot() {
  const router   = useRouter()
  const pathname = usePathname()

  const [open,     setOpen]     = useState(false)
  const [query,    setQuery]    = useState("")
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<CopilotResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = ROUTE_SUGGESTIONS[pathname] ?? DEFAULT_SUGGESTIONS

  const openCopilot  = useCallback(() => { setOpen(true); setQuery(""); setResult(null) }, [])
  const closeCopilot = useCallback(() => { setOpen(false); setQuery(""); setResult(null); setLoading(false) }, [])

  const dismissHint = useCallback(() => {
    setShowHint(false)
    if (typeof window !== "undefined") localStorage.setItem("copilot_hint_shown", "1")
  }, [])

  // Onboarding hint — show once after 2 s if never seen
  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem("copilot_hint_shown")) return
    const t = setTimeout(() => setShowHint(true), 2000)
    return () => clearTimeout(t)
  }, [])

  // Keyboard shortcuts + custom event from sidebar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (open) closeCopilot()
        else openCopilot()
      }
      if (e.key === "Escape" && open) closeCopilot()
    }
    function onOpenEvent() { openCopilot(); dismissHint() }
    window.addEventListener("keydown", onKey)
    window.addEventListener("open-copilot", onOpenEvent)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("open-copilot", onOpenEvent)
    }
  }, [open, openCopilot, closeCopilot, dismissHint])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  const submit = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res  = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, currentPath: pathname }),
      })
      const data = await res.json() as CopilotResult
      setResult(data)
      if (data.action === "navigate" && data.route) {
        setTimeout(() => {
          router.push(data.route!)
          closeCopilot()
        }, 600)
      }
    } catch (e) {
      console.error("[copilot]", e)
      setResult({ action: "suggest", message: "Erro ao processar. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Onboarding hint tooltip */}
      {showHint && (
        <div className="fixed bottom-20 right-4 z-50 animate-fade-in pointer-events-none">
          <div className="relative bg-card border border-accent-border rounded-xl shadow-2xl px-4 py-3 max-w-[230px] pointer-events-auto">
            {/* Arrow pointing down-right toward the FAB */}
            <div className="absolute bottom-[-7px] right-[22px] w-3.5 h-3.5 rotate-45 bg-card border-r border-b border-accent-border" />
            <p className="text-[12px] text-text-primary leading-relaxed">
              Pressione{" "}
              <span className="font-mono text-accent bg-accent-dim border border-accent-border rounded px-1 py-0.5 text-[10px]">⌘K</span>
              {" "}ou clique no botão para acessar qualquer funcionalidade rapidamente.
            </p>
            <button
              onClick={dismissHint}
              className="mt-2.5 text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
            >
              Entendi <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* FAB trigger */}
      <button
        onClick={() => { dismissHint(); openCopilot() }}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-card border border-accent-border shadow-xl flex items-center justify-center hover:bg-accent-dim transition-all group"
        title="Praxis Copilot (⌘K)"
      >
        <Sparkles className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          onClick={closeCopilot}
        >
          {/* Modal */}
          <div
            className="w-full max-w-xl mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-fade-in overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              {loading
                ? <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
                : <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") submit(query) }}
                placeholder="Para onde ir ou o que fazer..."
                className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-text-muted border border-border rounded px-1.5 py-0.5">
                  <Command className="w-2.5 h-2.5" /> K
                </span>
                <button onClick={closeCopilot} className="text-text-muted hover:text-text-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className={cn(
                "px-4 py-3 border-b border-border text-[13px] flex items-center gap-2",
                result.action === "navigate" ? "text-accent" : "text-text-secondary"
              )}>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                {result.message}
              </div>
            )}

            {/* Quick suggestions */}
            {!result && !loading && (
              <div className="p-3 space-y-1">
                <p className="text-[9px] font-mono text-text-muted tracking-widest uppercase px-1 mb-2">Sugestões para esta página</p>
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); submit(s) }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-text-secondary hover:bg-white/[0.05] hover:text-text-primary transition-colors"
                  >
                    <ArrowRight className="w-3 h-3 text-text-muted flex-shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted">Powered by Claude</span>
              <span className="text-[10px] font-mono text-text-muted">esc para fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
