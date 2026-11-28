"use client"

import { useEffect, useRef, useState, useCallback, useId } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
// Importa direto do arquivo: o índice de px carrega o PageHeader, que usa este componente.
import { Tag } from "@/components/px/Tag"

interface Notificacao {
  id:         string
  titulo:     string
  mensagem:   string
  tipo:       string
  lida:       boolean
  link:       string | null
  created_at: string
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ""
  const min = Math.floor((Date.now() - t) / 60_000)
  if (min < 1)  return "agora"
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)  return `${h} h`
  return `${Math.floor(h / 24)} d`
}

const TIPO_TAG: Record<string, { label: string; tone: "danger" | "warn" | "ok" }> = {
  erro:    { label: "Erro",    tone: "danger" },
  alerta:  { label: "Alerta",  tone: "warn" },
  sucesso: { label: "Sucesso", tone: "ok" },
}

/** Só aceita endereço interno ou https: o texto vem do banco e não deve virar javascript: nem outro esquema. */
function linkSeguro(link: string | null): string | null {
  if (!link) return null
  if (link.startsWith("/") && !link.startsWith("//")) return link
  if (/^https:\/\//i.test(link)) return link
  return null
}

export function BellMenu({ square = false }: { square?: boolean }) {
  const [open,     setOpen]     = useState(false)
  const [items,    setItems]    = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [marking,  setMarking]  = useState(false)
  const [erro,     setErro]     = useState("")
  const [erroAcao, setErroAcao] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const botaoRef = useRef<HTMLButtonElement>(null)
  const painelId = useId()

  const fetchNotifs = useCallback(async () => {
    if (document.hidden) return
    try {
      const res = await fetch("/api/notificacoes?limit=5")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Notificacao[]
      if (!Array.isArray(data)) throw new Error("resposta inesperada")
      setItems(data)
      setNaoLidas(data.filter(n => !n.lida).length)
      setErro("")
    } catch {
      setErro("Não foi possível carregar as notificações.")
    }
  }, [])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60_000)
    document.addEventListener("visibilitychange", fetchNotifs)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", fetchNotifs)
    }
  }, [fetchNotifs])

  // Fecha com clique fora ou Esc; Esc devolve o foco ao botão.
  useEffect(() => {
    if (!open) return
    function fora(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    function tecla(e: KeyboardEvent) { if (e.key === "Escape") { setOpen(false); botaoRef.current?.focus() } }
    document.addEventListener("mousedown", fora)
    document.addEventListener("keydown", tecla)
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", tecla) }
  }, [open])

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetch("/api/notificacoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setErroAcao("")
      return true
    } catch {
      setErroAcao("Não foi possível atualizar a notificação.")
      return false
    }
  }

  const markAllRead = async () => {
    setMarking(true)
    if (await patch({ todas: true })) {
      setItems(prev => prev.map(n => ({ ...n, lida: true })))
      setNaoLidas(0)
    }
    setMarking(false)
  }

  const markRead = async (id: string) => {
    if (await patch({ id })) {
      setItems(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
      setNaoLidas(prev => Math.max(0, prev - 1))
    }
  }

  const rotulo = naoLidas > 0 ? `Notificações, ${naoLidas} não lida${naoLidas !== 1 ? "s" : ""}` : "Notificações"

  return (
    <div ref={ref} className="relative">
      <button
        ref={botaoRef}
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs() }}
        aria-label={rotulo}
        aria-expanded={open}
        aria-controls={open ? painelId : undefined}
        className={cn(
          "relative flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40",
          square ? "px-square h-12 w-12 rounded-[18px] md:h-14 md:w-14 md:rounded-[20px]" : "h-10 w-10 rounded-full border border-px-line bg-white text-px-ink hover:bg-px-ink/5"
        )}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {naoLidas > 0 && (
          <span aria-hidden className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-px-ink px-1 text-[10px] font-bold leading-none text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div id={painelId} role="region" aria-label="Notificações recentes" className="px-glass-strong absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-px-card shadow-[0_10px_30px_rgba(20,20,20,0.16)]">
          <div className="flex items-center justify-between gap-2 border-b border-px-line px-4 py-3">
            <span className="text-[13px] font-semibold text-px-ink">Notificações</span>
            {naoLidas > 0 && (
              <button type="button" onClick={markAllRead} disabled={marking} className="rounded px-1 text-[12.5px] font-medium text-px-accent underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 disabled:opacity-60">
                {marking ? "Marcando" : "Marcar todas como lidas"}
              </button>
            )}
          </div>

          {(erroAcao || erro) && <p role="alert" className="border-b border-px-line bg-px-danger-soft px-4 py-2 text-[12.5px] text-px-danger">{erroAcao || erro}</p>}

          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-[13px] text-px-muted">{erro ? "Tente abrir de novo em instantes." : "Nenhuma notificação."}</li>
            ) : items.map(n => {
              const href = linkSeguro(n.link)
              const tag = TIPO_TAG[n.tipo]
              return (
                <li key={n.id} className={cn("space-y-1 border-b border-px-line/60 px-4 py-3 last:border-b-0", !n.lida && "bg-px-ink/[0.04]")}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("min-w-0 text-[13px] text-px-ink", !n.lida && "font-semibold")}>
                      {!n.lida && <span className="sr-only">Não lida. </span>}{n.titulo}
                    </p>
                    <span className="shrink-0 text-[11.5px] text-px-muted">{timeAgo(n.created_at)}</span>
                  </div>
                  {tag && <Tag tone={tag.tone}>{tag.label}</Tag>}
                  <p className="line-clamp-2 text-[12.5px] leading-relaxed text-px-muted">{n.mensagem}</p>
                  <div className="flex flex-wrap gap-3 pt-0.5">
                    {href && (href.startsWith("/")
                      ? <Link href={href} onClick={() => setOpen(false)} className="text-[12.5px] font-medium text-px-accent underline underline-offset-2">Abrir</Link>
                      : <a href={href} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-medium text-px-accent underline underline-offset-2">Abrir</a>)}
                    {!n.lida && <button type="button" onClick={() => markRead(n.id)} className="rounded text-[12.5px] font-medium text-px-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">Marcar como lida</button>}
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="border-t border-px-line px-4 py-2.5">
            <Link href="/notificacoes" onClick={() => setOpen(false)} className="text-[12.5px] font-medium text-px-ink underline underline-offset-2">Ver todas as notificações</Link>
          </div>
        </div>
      )}
    </div>
  )
}
