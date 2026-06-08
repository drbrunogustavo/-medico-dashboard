"use client"

import { useEffect, useState, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { cn } from "@/lib/utils"
import {
  ChevronLeft, ChevronRight, Calendar, Users,
  Clock, RefreshCw, Filter, User,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Appointment {
  id?:           string | number
  idAgendamento?: string | number
  paciente?:     string
  nomePaciente?: string
  nomeContato?:  string
  profissional?: string
  nomeUsuario?:  string
  data?:         string
  dataAgendamento?: string
  hora?:         string
  horaInicio?:   string
  status?:       string
  nomeStatus?:   string
  procedimento?: string
  nomeProcedimento?: string
  [key: string]: unknown
}

// ── Constants ──────────────────────────────────────────────────────────────────

const USUARIOS = [
  { id: "all",          label: "Todos",        initials: "T"  },
  { id: "-823416293",   label: "Aline Toledo",  initials: "AT" },
  { id: "1",            label: "Bruno Gustavo", initials: "BG" },
  { id: "305612369",    label: "Sheila",        initials: "SH" },
]

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

const STATUS_COLOR: Record<string, string> = {
  confirmado:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  agendado:     "bg-blue-500/15    text-blue-400    border-blue-500/30",
  aguardando:   "bg-amber-500/15   text-amber-400   border-amber-500/30",
  atendido:     "bg-accent-dim     text-accent      border-accent-border",
  cancelado:    "bg-red-500/15     text-red-400     border-red-500/30",
  falta:        "bg-red-500/15     text-red-400     border-red-500/30",
}

function statusColor(s: string = "") {
  const key = s.toLowerCase().replace(/\s+/g, "")
  for (const k of Object.keys(STATUS_COLOR)) {
    if (key.includes(k)) return STATUS_COLOR[k]
  }
  return "bg-surface-2 text-text-muted border-border"
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function toISO(d: Date) {
  return d.toISOString().split("T")[0]
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function getApptDate(a: Appointment): string {
  return (a.data ?? a.dataAgendamento ?? "").split("T")[0]
}

function getApptHora(a: Appointment): string {
  return a.hora ?? a.horaInicio ?? ""
}

function getApptNome(a: Appointment): string {
  return a.paciente ?? a.nomePaciente ?? a.nomeContato ?? "—"
}

function getApptStatus(a: Appointment): string {
  return a.status ?? a.nomeStatus ?? ""
}

function getApptProc(a: Appointment): string {
  return a.procedimento ?? a.nomeProcedimento ?? ""
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [usuarioFiltro, setUsuarioFiltro] = useState("all")
  const [selected, setSelected] = useState<Appointment | null>(null)

  const dias = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchAgenda = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const inicio = toISO(weekStart)
      const fim    = toISO(addDays(weekStart, 6))

      let url = `/api/agenda?inicio=${inicio}&fim=${fim}`
      if (usuarioFiltro !== "all") {
        url = `/api/agenda?action=agenda-usuario&inicio=${inicio}&fim=${fim}&idUsuario=${usuarioFiltro}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setAgendamentos(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [weekStart, usuarioFiltro])

  useEffect(() => { fetchAgenda() }, [fetchAgenda])

  const byDay = (dia: Date) => {
    const key = toISO(dia)
    return agendamentos.filter(a => getApptDate(a) === key)
      .sort((a, b) => getApptHora(a).localeCompare(getApptHora(b)))
  }

  const totalSemana = agendamentos.length
  const totalHoje   = byDay(new Date()).length
  const confirmados = agendamentos.filter(a =>
    getApptStatus(a).toLowerCase().includes("confirm") ||
    getApptStatus(a).toLowerCase().includes("agend")
  ).length

  const mesAno = `${MESES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
  const weekEnd = addDays(weekStart, 6)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Agenda Inteligente"
        subtitle="ALA CLÍNICA · MEDX"
        actions={
          <button
            onClick={fetchAgenda}
            disabled={loading}
            className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Atualizar
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Semana"     value={totalSemana} sub="agendamentos" icon={Calendar} accent="green" />
          <StatCard label="Hoje"       value={totalHoje}   sub="consultas"    icon={Clock}    accent="blue"  />
          <StatCard label="Confirmados" value={confirmados} sub="esta semana" icon={Users}    accent="green" />
          <StatCard label="Profissionais" value={3}        sub="na equipe"    icon={User}     accent="amber" />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Week navigation */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-[12px] font-medium text-text-primary whitespace-nowrap">
              {toISO(weekStart).slice(5).replace("-","/")} – {toISO(weekEnd).slice(5).replace("-","/")}
              <span className="ml-1.5 text-text-muted">{mesAno}</span>
            </div>
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Ir para hoje */}
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
          >
            Hoje
          </button>

          {/* Filtro por usuário */}
          <div className="flex items-center gap-1 ml-auto">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <div className="flex gap-1">
              {USUARIOS.map(u => (
                <button
                  key={u.id}
                  onClick={() => setUsuarioFiltro(u.id)}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full border transition-all",
                    usuarioFiltro === u.id
                      ? "bg-accent-dim border-accent-border text-accent font-medium"
                      : "border-border text-text-muted hover:text-text-secondary"
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
            {error}
          </div>
        )}

        {/* Grid semanal */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {/* Header dias */}
          <div className="grid grid-cols-7 border-b border-border">
            {dias.map((dia, i) => {
              const isHoje = toISO(dia) === toISO(new Date())
              const count  = byDay(dia).length
              return (
                <div
                  key={i}
                  className={cn(
                    "px-2 py-3 text-center border-r border-border last:border-r-0",
                    isHoje && "bg-accent-dim"
                  )}
                >
                  <div className={cn(
                    "text-[9px] font-mono uppercase tracking-widest",
                    isHoje ? "text-accent" : "text-text-muted"
                  )}>
                    {DIAS_SEMANA[dia.getDay()]}
                  </div>
                  <div className={cn(
                    "text-[18px] font-semibold mt-0.5",
                    isHoje ? "text-accent" : "text-text-primary"
                  )}>
                    {dia.getDate()}
                  </div>
                  {count > 0 && (
                    <div className="text-[9px] text-text-muted mt-0.5">
                      {count} {count === 1 ? "consulta" : "consultas"}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Body */}
          {loading ? (
            <div className="grid grid-cols-7 divide-x divide-border min-h-[320px]">
              {dias.map((_, i) => (
                <div key={i} className="p-2 space-y-2">
                  {[1, 2].map(j => (
                    <div key={j} className="h-16 rounded-lg bg-surface-2 animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 divide-x divide-border min-h-[320px]">
              {dias.map((dia, i) => {
                const items = byDay(dia)
                return (
                  <div key={i} className="p-2 space-y-1.5">
                    {items.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-[9px] text-text-muted">—</span>
                      </div>
                    ) : items.map((apt, j) => (
                      <button
                        key={j}
                        onClick={() => setSelected(apt)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg border text-[10px] transition-all hover:scale-[1.02]",
                          statusColor(getApptStatus(apt))
                        )}
                      >
                        {getApptHora(apt) && (
                          <div className="font-mono font-semibold mb-0.5 text-[9px]">
                            {getApptHora(apt).slice(0, 5)}
                          </div>
                        )}
                        <div className="font-medium leading-snug line-clamp-2">
                          {getApptNome(apt)}
                        </div>
                        {getApptProc(apt) && (
                          <div className="text-[8px] opacity-70 mt-0.5 truncate">
                            {getApptProc(apt)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Legenda de status */}
        <div className="flex flex-wrap gap-2">
          {Object.entries({ Confirmado: "confirmado", Agendado: "agendado", Aguardando: "aguardando", Atendido: "atendido", Cancelado: "cancelado" }).map(([label, key]) => (
            <div key={key} className={cn("flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border", STATUS_COLOR[key])}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              {label}
            </div>
          ))}
        </div>

      </div>

      {/* Modal de detalhes */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[16px] font-semibold text-text-primary">{getApptNome(selected)}</div>
                <div className="text-[12px] text-text-muted mt-0.5">
                  {getApptDate(selected)} {getApptHora(selected) && `· ${getApptHora(selected).slice(0,5)}`}
                </div>
              </div>
              <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border", statusColor(getApptStatus(selected)))}>
                {getApptStatus(selected) || "—"}
              </span>
            </div>
            <div className="space-y-2 text-[12px]">
              {getApptProc(selected) && (
                <div className="flex gap-2 text-text-secondary">
                  <span className="text-text-muted w-24 flex-shrink-0">Procedimento</span>
                  <span>{getApptProc(selected)}</span>
                </div>
              )}
              {selected.profissional || selected.nomeUsuario ? (
                <div className="flex gap-2 text-text-secondary">
                  <span className="text-text-muted w-24 flex-shrink-0">Profissional</span>
                  <span>{selected.profissional ?? selected.nomeUsuario}</span>
                </div>
              ) : null}
              {Object.entries(selected).filter(([k]) =>
                !["id","idAgendamento","paciente","nomePaciente","nomeContato","data","dataAgendamento","hora","horaInicio","status","nomeStatus","procedimento","nomeProcedimento","profissional","nomeUsuario"].includes(k)
              ).slice(0, 6).map(([k, v]) => v != null && v !== "" && (
                <div key={k} className="flex gap-2 text-text-secondary">
                  <span className="text-text-muted w-24 flex-shrink-0 truncate">{k}</span>
                  <span className="truncate">{String(v)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full text-[12px] border border-border text-text-secondary rounded-xl py-2.5 hover:border-border-hover transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
