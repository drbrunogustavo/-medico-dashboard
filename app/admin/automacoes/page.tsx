"use client"

import { useState, useCallback, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

interface AutomacaoLog {
  id:         string
  tipo:       string
  status:     "ok" | "parcial" | "erro"
  detalhes:   Record<string, unknown> | null
  created_at: string
}

const STATUS_CFG = {
  ok:      { icon: CheckCircle2,  cls: "text-green-400",  bg: "bg-green-500/10 border-green-500/25",  label: "OK"      },
  parcial: { icon: AlertTriangle, cls: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/25",  label: "Parcial" },
  erro:    { icon: XCircle,       cls: "text-red-400",    bg: "bg-red-500/10 border-red-500/25",      label: "Erro"    },
}

const TIPO_LABELS: Record<string, string> = {
  diario:    "Automação Diária",
  nurturing: "Nutrição de Leads",
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function LogRow({ log }: { log: AutomacaoLog }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CFG[log.status] ?? STATUS_CFG.parcial
  const Icon = cfg.icon

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <Icon className={cn("w-4 h-4 flex-shrink-0", cfg.cls)} />
        <span className="flex-1 text-[12px] font-semibold text-text-primary">
          {TIPO_LABELS[log.tipo] ?? log.tipo}
        </span>
        <span className={cn("text-badge font-mono font-semibold px-2 py-0.5 rounded-full border", cfg.bg, cfg.cls)}>
          {cfg.label}
        </span>
        <span className="text-[10px] font-mono text-text-muted">{fmtDate(log.created_at)}</span>
        {log.detalhes
          ? open ? <ChevronUp className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                 : <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          : <span className="w-3.5" />
        }
      </button>

      {open && log.detalhes && (
        <div className="px-4 pb-4 border-t border-border bg-surface/40">
          <pre className="text-[10px] font-mono text-text-secondary mt-3 whitespace-pre-wrap break-all leading-relaxed max-h-64 overflow-y-auto">
            {JSON.stringify(log.detalhes, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

const TIPOS = ["todos", "diario", "nurturing"]

export default function AdminAutomacoesPage() {
  const [logs,    setLogs]    = useState<AutomacaoLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro,  setFiltro]  = useState("todos")

  const fetch_logs = useCallback(async (tipo: string) => {
    setLoading(true)
    try {
      const q   = tipo !== "todos" ? `?tipo=${tipo}` : ""
      const res = await fetch(`/api/admin/automacoes-log${q}`)
      const data = await res.json() as { logs?: AutomacaoLog[] }
      setLogs(data.logs ?? [])
    } catch { setLogs([]) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { fetch_logs(filtro) }, [filtro, fetch_logs])

  const stats = {
    ok:      logs.filter(l => l.status === "ok").length,
    parcial: logs.filter(l => l.status === "parcial").length,
    erro:    logs.filter(l => l.status === "erro").length,
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Log de Automações"
        subtitle="ADMIN · CRONS E TAREFAS AUTOMÁTICAS"
        actions={
          <button
            onClick={() => fetch_logs(filtro)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[12px] text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { label: "Sucesso",  count: stats.ok,      cls: "text-green-400 bg-green-500/10 border-green-500/20" },
            { label: "Parcial",  count: stats.parcial,  cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
            { label: "Erro",     count: stats.erro,     cls: "text-red-400 bg-red-500/10 border-red-500/20" },
          ].map(s => (
            <div key={s.label} className={cn("rounded-xl border px-4 py-3 text-center", s.cls)}>
              <p className="text-[22px] font-bold">{s.count}</p>
              <p className="text-[10px] font-mono mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {TIPOS.map(t => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className={cn(
                "text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all",
                filtro === t
                  ? "bg-accent-dim border-accent-border text-accent font-medium"
                  : "border-border text-text-muted hover:text-text-secondary"
              )}
            >
              {t === "todos" ? "Todos" : TIPO_LABELS[t] ?? t}
            </button>
          ))}
        </div>

        {/* Log list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[12px]">Carregando logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[13px] text-text-secondary">Nenhuma execução registrada ainda.</p>
            <p className="text-[11px] text-text-muted mt-1">Os crons registrarão aqui após a próxima execução.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => <LogRow key={log.id} log={log} />)}
          </div>
        )}
      </div>
    </div>
  )
}
