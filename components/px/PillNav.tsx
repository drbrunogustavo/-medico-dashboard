"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PillNavItem { label: string; href: string; tag?: string; count?: number }
/** Com `href`, o grupo é um link direto; sem ele, abre o painel de `items`. */
export interface PillNavGroup { id: string; label: string; href?: string; items: PillNavItem[] }

interface PillNavProps {
  groups: PillNavGroup[]
  /** id do grupo da página atual */
  activeId?: string
  /** href da página atual, para marcar o item no painel */
  currentHref?: string
  action?: { label: string; onClick: () => void }
  /** Elemento extra dentro da pílula (por exemplo o botão da conta). */
  trailing?: React.ReactNode
  /** Painel extra aberto acima da pílula (por exemplo o menu da conta). */
  extraPanel?: React.ReactNode
  className?: string
}

/**
 * Navegação flutuante. Cada grupo abre um painel com seus itens, o que permite
 * cinco entradas na pílula e dezenas de destinos sem barra lateral.
 */
export function PillNav({ groups, activeId, currentHref, action, trailing, extraPanel, className }: PillNavProps) {
  const [openId, setOpenId] = React.useState<string | null>(null)
  const root = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    if (!openId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenId(null) }
    const onDown = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpenId(null) }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onDown)
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown) }
  }, [openId])

  const aberto = groups.find(g => g.id === openId)

  return (
    <nav ref={root} aria-label="Principal" className={cn("fixed inset-x-0 bottom-6 z-40 flex flex-col items-center gap-3 px-3", className)}>
      {extraPanel}
      {aberto ? (
        <div className="px-glass-strong w-full max-w-[560px] rounded-px-panel p-3 shadow-[0_10px_30px_rgba(20,20,20,0.16)]">
          <div className="px-3 pb-2 pt-1 text-[12px] font-semibold text-px-muted">{aberto.label}</div>
          <ul className="grid max-h-[50vh] grid-cols-1 gap-0.5 overflow-auto sm:grid-cols-2">
            {aberto.items.map(i => (
              <li key={i.href + i.label}>
                <Link
                  href={i.href}
                  onClick={() => setOpenId(null)}
                  aria-current={currentHref === i.href ? "page" : undefined}
                  className={cn(
                    "flex min-h-[40px] items-center justify-between gap-2 rounded-px-ctl px-3 text-[13px]",
                    currentHref === i.href ? "bg-px-ink font-semibold text-white" : "text-px-ink hover:bg-px-ink/10"
                  )}
                >
                  <span className="truncate">{i.label}</span>
                  {i.count ? <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-px-ink px-1.5 text-[10.5px] font-semibold text-white">{i.count > 99 ? "99+" : i.count}</span> : null}
                  {i.tag ? <span className="text-[10.5px] font-semibold opacity-80">{i.tag}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="px-pill flex items-center gap-1 rounded-full p-1.5">
        {groups.map(g => {
          const on = g.id === activeId
          const open = g.id === openId
          const cls = cn(
            "inline-flex h-11 items-center rounded-full px-4 text-[13px] transition-colors sm:px-5",
            on ? "bg-white font-semibold text-px-ink" : open ? "bg-white/25 font-semibold text-white" : "font-medium text-white hover:bg-white/15"
          )
          if (g.href) {
            return <Link key={g.id} href={g.href} onClick={() => setOpenId(null)} aria-current={on ? "page" : undefined} className={cls}>{g.label}</Link>
          }
          return (
            <button
              key={g.id}
              type="button"
              aria-expanded={open}
              aria-current={on ? "page" : undefined}
              onClick={() => setOpenId(open ? null : g.id)}
              className={cls}
            >
              {g.label}
            </button>
          )
        })}
        {trailing}
        {action ? (
          <button type="button" onClick={action.onClick} aria-label={action.label} className="ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-black text-white hover:bg-px-ink">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </nav>
  )
}
