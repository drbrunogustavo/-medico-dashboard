"use client"

import { useState, useEffect, useRef, useCallback, useId } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Bot } from "lucide-react"
import { PxButton } from "@/components/px/Button"

interface CopilotResult {
  action:  "navigate" | "suggest"
  route?:  string
  message: string
}

// Sugestões por rota. Cada uma é um pedido que a API de navegação sabe resolver.
const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  "/agenda":              ["Abrir a lista de pacientes", "Abrir o financeiro"],
  "/pacientes":           ["Abrir o Copiloto de Consulta", "Abrir o banco de pautas"],
  "/pautas":              ["Abrir o radar de tendências", "Abrir o calendário editorial"],
  "/executivo":           ["Abrir o CRM de leads", "Abrir o financeiro"],
  "/copiloto":            ["Abrir a agenda", "Abrir a prescrição"],
  "/crm":                 ["Abrir o NPS", "Abrir a lista de pacientes"],
  "/financeiro":          ["Abrir o painel executivo", "Abrir a agenda"],
  "/interpretacao-exames":["Abrir a lista de pacientes", "Abrir os protocolos"],
}

const DEFAULT_SUGGESTIONS = [
  "Abrir a agenda",
  "Abrir a lista de pacientes",
  "Abrir o banco de pautas",
  "Abrir o painel executivo",
]

/** Só navega para rota interna simples; ignora qualquer outra coisa que venha da resposta. */
function rotaSegura(r: unknown): string | null {
  return typeof r === "string" && /^\/[a-z0-9-]+(\?busca=[^&#]{1,100})?$/i.test(r) ? r : null
}

export function PraxisCopilot() {
  const router   = useRouter()
  const pathname = usePathname()

  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState("")
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<CopilotResult | null>(null)
  const [erro,    setErro]    = useState("")
  const inputRef   = useRef<HTMLInputElement>(null)
  const dialogRef  = useRef<HTMLDivElement>(null)
  const botaoRef   = useRef<HTMLButtonElement>(null)
  const navTimer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pedidoRef  = useRef(0)
  const tituloId = useId()

  const suggestions = ROUTE_SUGGESTIONS[pathname] ?? DEFAULT_SUGGESTIONS

  const fechar = useCallback(() => {
    pedidoRef.current++            // descarta resposta que ainda esteja a caminho
    if (navTimer.current) clearTimeout(navTimer.current)
    setOpen(false); setQuery(""); setResult(null); setErro(""); setLoading(false)
    botaoRef.current?.focus()
  }, [])

  useEffect(() => {
    const abrir = () => { setOpen(true); setQuery(""); setResult(null); setErro("") }
    window.addEventListener("open-copilot", abrir)
    return () => window.removeEventListener("open-copilot", abrir)
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") fechar() }
    window.addEventListener("keydown", onKey)
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey) }
  }, [open, fechar])

  useEffect(() => () => { if (navTimer.current) clearTimeout(navTimer.current) }, [])

  // Fecha ao mudar de página por outro caminho.
  useEffect(() => { setOpen(false) }, [pathname])

  async function enviar(q: string) {
    const texto = q.trim()
    if (!texto || loading) return
    const meu = ++pedidoRef.current
    setLoading(true); setResult(null); setErro("")
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: texto, currentPath: pathname }),
      })
      const data = await res.json().catch(() => null) as (CopilotResult & { error?: string }) | null
      if (meu !== pedidoRef.current) return
      if (!res.ok || !data) { setErro(data?.error ?? "Não foi possível processar o pedido. Tente de novo."); return }
      setResult(data)
      const rota = data.action === "navigate" ? rotaSegura(data.route) : null
      if (rota) {
        navTimer.current = setTimeout(() => { router.push(rota); fechar() }, 700)
      }
    } catch {
      if (meu === pedidoRef.current) setErro("Sem conexão com o servidor. Tente de novo.")
    } finally {
      if (meu === pedidoRef.current) setLoading(false)
    }
  }

  // Tab fica preso dentro do diálogo.
  const onDialogKey = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return
    const foco = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("input, button:not([disabled])"))
    if (foco.length === 0) return
    const a = foco[0], z = foco[foco.length - 1]
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
  }

  return (
    <>
      <div className="px">
        <button
          ref={botaoRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir assistente de navegação"
          aria-haspopup="dialog"
          className="px-square fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-[18px] transition-colors hover:bg-px-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 print:hidden lg:bottom-6 lg:right-6"
        >
          <Bot className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {open && (
        <div className="px fixed inset-0 z-50">
          <div className="absolute inset-0 bg-px-ink/40" onClick={fechar} aria-hidden />
          <div className="relative flex items-start justify-center px-4 pt-[14vh]">
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={tituloId}
              onKeyDown={onDialogKey}
              className="px-glass-strong w-full max-w-xl overflow-hidden rounded-px-card shadow-[0_16px_48px_rgba(20,20,20,0.22)]"
            >
              <div className="border-b border-px-line px-4 pb-3 pt-4">
                <h2 id={tituloId} className="text-[14px] font-semibold text-px-ink">Assistente de navegação</h2>
                <p className="mt-0.5 text-[12.5px] text-px-muted">Diga para onde quer ir. Ele abre a página, ele não altera dados.</p>
              </div>

              <form onSubmit={e => { e.preventDefault(); enviar(query) }} className="flex items-center gap-2 border-b border-px-line px-4 py-3">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  maxLength={300}
                  aria-label="Para onde você quer ir"
                  placeholder="Ex.: abrir o financeiro"
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-px-ink placeholder:text-px-muted focus:outline-none"
                />
                <PxButton type="submit" size="sm" loading={loading} disabled={!query.trim()}>Ir</PxButton>
              </form>

              <div aria-live="polite">
                {erro && <p role="alert" className="mx-4 mt-3 rounded-px-ctl bg-px-danger-soft px-3 py-2 text-[12.5px] text-px-danger">{erro}</p>}
                {result && <p className="px-4 py-3 text-[13.5px] text-px-ink">{result.message}</p>}
              </div>

              {!result && !loading && (
                <ul className="p-2">
                  {suggestions.map(s => (
                    <li key={s}>
                      <button type="button" onClick={() => { setQuery(s); enviar(s) }} className="w-full rounded-px-ctl px-3 py-2 text-left text-[13.5px] text-px-ink hover:bg-px-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">{s}</button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between border-t border-px-line px-4 py-2 text-[12px] text-px-muted">
                <span>Respostas geradas por IA</span>
                <button type="button" onClick={fechar} className="rounded px-1 font-medium text-px-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
