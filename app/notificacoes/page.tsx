"use client"

import { useEffect, useState, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import { Bell, Check, Trash2, ExternalLink, Loader2 } from "lucide-react"

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
  if (min < 60) return `${min} min atrás`
  const h = Math.floor(min / 60)
  if (h < 24)   return `${h}h atrás`
  const d = Math.floor(h / 24)
  return d === 1 ? "ontem" : `${d} dias atrás`
}

const TIPO_LABEL: Record<string, string> = {
  info:    "Info",
  alerta:  "Alerta",
  erro:    "Erro",
  sucesso: "Sucesso",
}
const TIPO_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  info:    { color: "var(--accent)",  bg: "var(--accent-dim)",     border: "var(--accent-border)" },
  alerta:  { color: "#f59e0b",        bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)" },
  erro:    { color: "#ef4444",        bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.22)"  },
  sucesso: { color: "#10b981",        bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.22)" },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Filtro = "todas" | "nao_lidas"

export default function NotificacoesPage() {
  const [items,   setItems]   = useState<Notificacao[]>([])
  const [filtro,  setFiltro]  = useState<Filtro>("todas")
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notificacoes?limit=100")
      if (res.ok) setItems(await res.json() as Notificacao[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const markRead = async (id: string) => {
    await fetch("/api/notificacoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setItems(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  const markAll = async () => {
    setMarking(true)
    try {
      await fetch("/api/notificacoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todas: true }),
      })
      setItems(prev => prev.map(n => ({ ...n, lida: true })))
    } finally {
      setMarking(false)
    }
  }

  const deleteNotif = async (id: string) => {
    await fetch(`/api/notificacoes?id=${id}`, { method: "DELETE" })
    setItems(prev => prev.filter(n => n.id !== id))
  }

  const naoLidas = items.filter(n => !n.lida).length
  const displayed = filtro === "nao_lidas" ? items.filter(n => !n.lida) : items

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Notificações"
        subtitle={`${naoLidas} NÃO LIDAS · ${items.length} TOTAL`}
        actions={
          naoLidas > 0 ? (
            <button
              onClick={markAll}
              disabled={marking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>
              {marking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Marcar todas como lidas
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-4 max-w-2xl">

        {/* Filter */}
        <div className="flex gap-2">
          {(["todas", "nao_lidas"] as Filtro[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                "text-[11px] px-3 py-1.5 rounded-full border font-mono transition-all",
                filtro === f
                  ? "border-accent-border bg-accent-dim text-accent font-semibold"
                  : "border-border text-text-muted hover:text-text-secondary"
              )}>
              {f === "todas" ? "Todas" : `Não lidas (${naoLidas})`}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Bell className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {filtro === "nao_lidas" ? "Nenhuma notificação não lida" : "Nenhuma notificação"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(n => {
              const tc = TIPO_COLOR[n.tipo] ?? TIPO_COLOR.info
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border transition-all",
                    !n.lida ? "border-border-hover" : "border-border"
                  )}
                  style={{ background: n.lida ? "var(--surface)" : "var(--card)" }}>

                  {/* Tipo badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                      style={{ background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color }}>
                      {TIPO_LABEL[n.tipo] ?? n.tipo}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: n.lida ? "var(--text-secondary)" : "var(--text-primary)" }}>
                        {n.titulo}
                      </p>
                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {n.mensagem}
                    </p>
                    {n.link && (
                      <a
                        href={n.link}
                        className="inline-flex items-center gap-1 text-[11px] mt-1.5 hover:underline"
                        style={{ color: "var(--accent)" }}>
                        <ExternalLink className="w-3 h-3" /> Abrir
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.lida && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-accent-border transition-all"
                        title="Marcar como lida">
                        <Check className="w-3 h-3" style={{ color: "var(--accent)" }} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif(n.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-red-300 hover:text-red-400 transition-all"
                      title="Excluir"
                      style={{ color: "var(--text-muted)" }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
