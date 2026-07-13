"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Menu, Bell, Check, ExternalLink } from "lucide-react"
import { useMenu } from "@/components/MobileMenuProvider"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notificacao {
  id:         string
  titulo:     string
  mensagem:   string
  tipo:       string
  lida:       boolean
  link:       string | null
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return "agora"
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24)  return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const TIPO_COLOR: Record<string, string> = {
  info:    "var(--accent)",
  alerta:  "#f59e0b",
  erro:    "#ef4444",
  sucesso: "#10b981",
}

// ─── Bell Dropdown ────────────────────────────────────────────────────────────

function BellMenu() {
  const [open,      setOpen]      = useState(false)
  const [items,     setItems]     = useState<Notificacao[]>([])
  const [naoLidas,  setNaoLidas]  = useState(0)
  const [marking,   setMarking]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    if (document.hidden) return
    try {
      const res = await fetch("/api/notificacoes?limit=5")
      if (!res.ok) return
      const data = await res.json() as Notificacao[]
      setItems(data)
      setNaoLidas(data.filter(n => !n.lida).length)
    } catch {
      // silent — non-critical
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

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const markAllRead = async () => {
    setMarking(true)
    try {
      await fetch("/api/notificacoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todas: true }),
      })
      setItems(prev => prev.map(n => ({ ...n, lida: true })))
      setNaoLidas(0)
    } finally {
      setMarking(false)
    }
  }

  const markRead = async (id: string) => {
    await fetch("/api/notificacoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setItems(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    setNaoLidas(prev => Math.max(0, prev - 1))
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs() }}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
        aria-label="Notificações">
        <Bell className="w-4 h-4" />
        {naoLidas > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white px-1"
            style={{ background: "var(--accent)", lineHeight: 1 }}>
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-11 w-80 rounded-xl border border-border shadow-xl z-50 overflow-hidden"
          style={{ background: "var(--surface)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Notificações
            </span>
            {naoLidas > 0 && (
              <button
                onClick={markAllRead}
                disabled={marking}
                className="text-[10px] font-mono flex items-center gap-1 transition-colors"
                style={{ color: "var(--accent)" }}>
                <Check className="w-3 h-3" />
                {marking ? "Marcando..." : "Marcar todas"}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Nenhuma notificação</p>
              </div>
            ) : (
              items.map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.lida) markRead(n.id) }}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors cursor-default",
                    !n.lida && "bg-[rgba(0,0,0,0.02)]"
                  )}>
                  {/* Dot indicator */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: n.lida ? "transparent" : (TIPO_COLOR[n.tipo] ?? TIPO_COLOR.info), border: n.lida ? "1px solid var(--border)" : "none" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold truncate" style={{ color: n.lida ? "var(--text-secondary)" : "var(--text-primary)" }}>
                        {n.titulo}
                      </p>
                      <span className="text-[9px] font-mono flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{n.mensagem}</p>
                    {n.link && (
                      <a
                        href={n.link}
                        className="flex items-center gap-1 text-[10px] mt-1 hover:underline"
                        style={{ color: "var(--accent)" }}>
                        <ExternalLink className="w-2.5 h-2.5" /> Ver
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border">
            <Link
              href="/notificacoes"
              onClick={() => setOpen(false)}
              className="text-[11px] font-mono transition-colors"
              style={{ color: "var(--text-muted)" }}>
              Ver todas as notificações →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  title:     string
  subtitle?: string
  tagline?:  string
  actions?:  React.ReactNode
}

export function TopBar({ title, subtitle, tagline, actions }: TopBarProps) {
  const { openMenu } = useMenu()

  return (
    <header
      className="flex items-center gap-3 px-4 md:px-8 border-b border-border sticky top-0 z-30"
      style={{
        height:              60,
        background:          "var(--topbar-bg)",
        backdropFilter:      "blur(20px) saturate(180%)",
        WebkitBackdropFilter:"blur(20px) saturate(180%)",
      }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={openMenu}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all flex-shrink-0"
        aria-label="Abrir menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[16px] md:text-[17px] font-semibold text-text-primary tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="hidden md:block text-[10px] font-mono text-text-muted mt-0.5 tracking-[2px] uppercase truncate">
            {subtitle}
          </p>
        )}
        {tagline && (
          <p className="hidden md:block text-[11px] text-text-secondary mt-0.5 leading-tight truncate">
            {tagline}
          </p>
        )}
      </div>

      {/* Actions + Bell */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        <BellMenu />
      </div>
    </header>
  )
}
