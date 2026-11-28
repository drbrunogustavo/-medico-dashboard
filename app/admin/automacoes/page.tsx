"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { Panel, PxButton, Segmented, Tag, PageHeader } from "@/components/px"

interface AutomacaoLog {
  id:         string
  tipo:       string
  status:     "ok" | "parcial" | "erro"
  detalhes:   Record<string, unknown> | null
  created_at: string
}

const STATUS: Record<AutomacaoLog["status"], { label: string; tone: "ok" | "warn" | "danger" }> = {
  ok:      { label: "Concluída", tone: "ok" },
  parcial: { label: "Parcial",   tone: "warn" },
  erro:    { label: "Com erro",  tone: "danger" },
}

const TIPO_LABELS: Record<string, string> = {
  diario:    "Automação diária",
  nurturing: "Nutrição de leads",
}

const FILTROS = [
  { value: "todos",     label: "Todas" },
  { value: "diario",    label: TIPO_LABELS.diario },
  { value: "nurturing", label: TIPO_LABELS.nurturing },
]

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
    " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function LogRow({ log }: { log: AutomacaoLog }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS[log.status] ?? STATUS.parcial
  const nome = TIPO_LABELS[log.tipo] ?? log.tipo
  const painel = "log-" + log.id

  return (
    <Panel className="p-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={!log.detalhes}
        aria-expanded={log.detalhes ? open : undefined}
        aria-controls={log.detalhes ? painel : undefined}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-px-panel px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 disabled:cursor-default"
      >
        <span className="min-w-0 flex-1 text-[14px] font-medium text-px-ink">{nome}</span>
        <Tag tone={cfg.tone}>{cfg.label}</Tag>
        <span className="text-[12.5px] tabular-nums text-px-muted">{fmtDate(log.created_at)}</span>
        {log.detalhes
          ? (open ? <ChevronUp className="h-4 w-4 text-px-muted" aria-hidden /> : <ChevronDown className="h-4 w-4 text-px-muted" aria-hidden />)
          : <span className="w-4" aria-hidden />}
      </button>
      {open && log.detalhes && (
        <div id={painel} className="border-t border-px-line px-4 pb-4">
          <p className="mt-3 text-[12px] text-px-muted">Registro bruto da execução.</p>
          <pre className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap break-all font-mono text-[12px] leading-relaxed text-px-ink">
            {JSON.stringify(log.detalhes, null, 2)}
          </pre>
        </div>
      )}
    </Panel>
  )
}

export default function AdminAutomacoesPage() {
  const [logs,    setLogs]    = useState<AutomacaoLog[]>([])
  const [loading, setLoading] = useState(true)
  const [erro,    setErro]    = useState("")
  const [filtro,  setFiltro]  = useState("todos")

  const carregar = useCallback(async () => {
    setLoading(true); setErro("")
    try {
      const q = filtro !== "todos" ? "?tipo=" + encodeURIComponent(filtro) : ""
      const res = await fetch("/api/admin/automacoes-log" + q)
      if (res.status === 403) { setErro("Esta área é restrita ao administrador."); setLogs([]); return }
      const data = await res.json().catch(() => null) as { logs?: AutomacaoLog[] } | null
      if (!res.ok || !Array.isArray(data?.logs)) throw new Error("HTTP " + res.status)
      setLogs(data.logs)
    } catch (e) {
      console.error("[admin/automacoes] erro ao carregar:", e)
      setErro("Não foi possível carregar o registro das automações."); setLogs([])
    } finally { setLoading(false) }
  }, [filtro])

  useEffect(() => { carregar() }, [carregar])

  const n = (s: AutomacaoLog["status"]) => logs.filter(l => l.status === s).length

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Automações"
        caption="O que as tarefas agendadas fizeram nas últimas execuções"
        actions={<PxButton variant="secondary" size="sm" leftIcon={RefreshCw} onClick={carregar} loading={loading}>Atualizar</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Segmented label="Tipo de automação" value={filtro} onChange={setFiltro} options={FILTROS} />

        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}

        {loading && !erro ? <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando registros</p>
          : !erro && logs.length === 0 ? (
            <Panel className="space-y-1 py-12 text-center">
              <p className="text-[14px] text-px-ink">Nenhuma execução registrada ainda.</p>
              <p className="text-[13px] text-px-muted">As próximas execuções agendadas aparecem aqui.</p>
            </Panel>
          ) : !erro && (
            <>
              <p className="text-[13px] text-px-muted">
                Nas {logs.length} execuções mais recentes listadas: {n("ok")} concluídas, {n("parcial")} parciais, {n("erro")} com erro.
              </p>
              <ul className="space-y-2">
                {logs.map(log => <li key={log.id}><LogRow log={log} /></li>)}
              </ul>
            </>
          )}
      </div>
    </div>
  )
}
