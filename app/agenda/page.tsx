"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { cn } from "@/lib/utils"
import {
  ChevronLeft, ChevronRight, Calendar, Users,
  Clock, RefreshCw, Filter, User, Plus,
  Search, Loader2, X, Check,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Appointment {
  id?:               string | number
  idAgendamento?:    string | number
  paciente?:         string
  nomePaciente?:     string
  nomeContato?:      string
  profissional?:     string
  nomeUsuario?:      string
  data?:             string
  dataAgendamento?:  string
  hora?:             string
  horaInicio?:       string
  status?:           string
  nomeStatus?:       string
  procedimento?:     string
  nomeProcedimento?: string
  [key: string]:     unknown
}

interface PacienteResult {
  Id?:           string | number
  id?:           string | number
  Nome?:         string
  nome?:         string
  nomeCompleto?: string
  [key: string]: unknown
}

// ── Constants ──────────────────────────────────────────────────────────────────

const USUARIOS = [
  { id: "all",         label: "Todos",         initials: "T"  },
  { id: "-823416293",  label: "Aline Toledo",  initials: "AT" },
  { id: "1",           label: "Bruno Gustavo", initials: "BG" },
  { id: "305612369",   label: "Sheila",        initials: "SH" },
]

const MEDICOS = USUARIOS.filter(u => u.id !== "all")

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MESES       = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

const STATUS_COLOR: Record<string, string> = {
  confirmado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  agendado:   "bg-blue-500/15    text-blue-400    border-blue-500/30",
  aguardando: "bg-amber-500/15   text-amber-400   border-amber-500/30",
  atendido:   "bg-accent-dim     text-accent      border-accent-border",
  cancelado:  "bg-red-500/15     text-red-400     border-red-500/30",
  falta:      "bg-red-500/15     text-red-400     border-red-500/30",
}

const TIPOS_CONSULTA = [
  "Consulta de Endocrinologia",
  "Consulta de Nutrologia",
  "Consulta de Longevidade",
  "Retorno",
  "Bioimpedância",
  "Exames",
  "Outro",
]

function statusColor(s: string = "") {
  const key = s.toLowerCase().replace(/\s+/g, "")
  for (const k of Object.keys(STATUS_COLOR)) {
    if (key.includes(k)) return STATUS_COLOR[k]
  }
  return "bg-surface text-text-muted border-border"
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

function getPacNome(p: PacienteResult): string {
  return p.Nome ?? p.nome ?? p.nomeCompleto ?? "—"
}

function getPacId(p: PacienteResult): string {
  return String(p.Id ?? p.id ?? "")
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
  const [weekStart,     setWeekStart]     = useState<Date>(() => startOfWeek(new Date()))
  const [agendamentos,  setAgendamentos]  = useState<Appointment[]>([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState("")
  const [usuarioFiltro, setUsuarioFiltro] = useState("all")
  const [selected,      setSelected]      = useState<Appointment | null>(null)

  // New appointment modal
  const [novoOpen,    setNovoOpen]    = useState(false)
  const [novoPacQ,    setNovoPacQ]    = useState("")
  const [novoPacRes,  setNovoPacRes]  = useState<PacienteResult[]>([])
  const [novoPacSel,  setNovoPacSel]  = useState<PacienteResult | null>(null)
  const [novoPacLoad, setNovoPacLoad] = useState(false)
  const [novoForm,    setNovoForm]    = useState({
    data:         toISO(new Date()),
    hora:         "08:00",
    idUsuario:    "1",
    procedimento: "Consulta de Endocrinologia",
  })
  const [novoSaving, setNovoSaving] = useState(false)
  const [novoError,  setNovoError]  = useState("")
  const [novoOk,     setNovoOk]    = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dias    = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)
  const mesAno  = `${MESES[weekStart.getMonth()]} ${weekStart.getFullYear()}`

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
      const res  = await fetch(url)
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

  const buscarPaciente = (q: string) => {
    setNovoPacQ(q)
    setNovoPacSel(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setNovoPacRes([]); return }
    debounceRef.current = setTimeout(async () => {
      setNovoPacLoad(true)
      try {
        const res  = await fetch(`/api/pacientes?action=search&nome=${encodeURIComponent(q)}`)
        const data = await res.json()
        setNovoPacRes(Array.isArray(data) ? data.slice(0, 6) : [])
      } catch { /* ignore */ }
      finally { setNovoPacLoad(false) }
    }, 400)
  }

  const openNovo = (dataInicial?: string) => {
    setNovoOpen(true)
    setNovoError("")
    setNovoOk(false)
    setNovoPacSel(null)
    setNovoPacQ("")
    setNovoPacRes([])
    if (dataInicial) setNovoForm(f => ({ ...f, data: dataInicial }))
  }

  const salvarAgendamento = async () => {
    if (!novoPacSel) { setNovoError("Selecione um paciente."); return }
    setNovoSaving(true)
    setNovoError("")
    try {
      const body = {
        IdContato:        getPacId(novoPacSel),
        DataAgendamento:  novoForm.data,
        HoraInicio:       novoForm.hora,
        IdUsuario:        novoForm.idUsuario,
        NomeProcedimento: novoForm.procedimento,
      }
      const res = await fetch("/api/agenda", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      setNovoOk(true)
      setTimeout(() => {
        setNovoOpen(false)
        setNovoOk(false)
        fetchAgenda()
      }, 1500)
    } catch (e) {
      setNovoError(e instanceof Error ? e.message : String(e))
    } finally {
      setNovoSaving(false)
    }
  }

  const byDay = (dia: Date) => {
    const key = toISO(dia)
    return agendamentos
      .filter(a => getApptDate(a) === key)
      .sort((a, b) => getApptHora(a).localeCompare(getApptHora(b)))
  }

  const totalSemana = agendamentos.length
  const totalHoje   = byDay(new Date()).length
  const confirmados = agendamentos.filter(a =>
    getApptStatus(a).toLowerCase().includes("confirm") ||
    getApptStatus(a).toLowerCase().includes("agend")
  ).length

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Agenda Inteligente"
        subtitle="ALA CLÍNICA · MEDX"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => openNovo()}
              className="flex items-center gap-1.5 text-[11px] bg-accent text-background font-semibold rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Agendamento
            </button>
            <button
              onClick={fetchAgenda}
              disabled={loading}
              className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Atualizar
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Semana"        value={totalSemana} sub="agendamentos" icon={Calendar} accent="green" />
          <StatCard label="Hoje"          value={totalHoje}   sub="consultas"    icon={Clock}    accent="blue"  />
          <StatCard label="Confirmados"   value={confirmados} sub="esta semana"  icon={Users}    accent="green" />
          <StatCard label="Profissionais" value={3}           sub="na equipe"    icon={User}     accent="amber" />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
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

          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
          >
            Hoje
          </button>

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
          {/* Header */}
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
                  <div className={cn("text-[9px] font-mono uppercase tracking-widest", isHoje ? "text-accent" : "text-text-muted")}>
                    {DIAS_SEMANA[dia.getDay()]}
                  </div>
                  <div className={cn("text-[18px] font-semibold mt-0.5", isHoje ? "text-accent" : "text-text-primary")}>
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
                  {[1, 2].map(j => <div key={j} className="h-16 rounded-lg bg-surface animate-pulse" />)}
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
                      <button
                        onClick={() => openNovo(toISO(dia))}
                        className="w-full h-full min-h-[60px] flex items-center justify-center rounded-lg border border-dashed border-border hover:border-accent/40 hover:bg-accent-dim/30 transition-all group"
                      >
                        <Plus className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
                      </button>
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
                          <div className="font-mono font-semibold mb-0.5 text-[9px]">{getApptHora(apt).slice(0, 5)}</div>
                        )}
                        <div className="font-medium leading-snug line-clamp-2">{getApptNome(apt)}</div>
                        {getApptProc(apt) && (
                          <div className="text-[8px] opacity-70 mt-0.5 truncate">{getApptProc(apt)}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-2">
          {Object.entries({
            Confirmado: "confirmado", Agendado: "agendado",
            Aguardando: "aguardando", Atendido: "atendido", Cancelado: "cancelado",
          }).map(([label, key]) => (
            <div key={key} className={cn("flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border", STATUS_COLOR[key])}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              {label}
            </div>
          ))}
        </div>

      </div>

      {/* Detail modal */}
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
              {(selected.profissional || selected.nomeUsuario) && (
                <div className="flex gap-2 text-text-secondary">
                  <span className="text-text-muted w-24 flex-shrink-0">Profissional</span>
                  <span>{String(selected.profissional ?? selected.nomeUsuario)}</span>
                </div>
              )}
              {Object.entries(selected).filter(([k]) =>
                !["id","idAgendamento","paciente","nomePaciente","nomeContato","data","dataAgendamento",
                  "hora","horaInicio","status","nomeStatus","procedimento","nomeProcedimento","profissional","nomeUsuario"].includes(k)
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

      {/* Novo Agendamento modal */}
      {novoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setNovoOpen(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="text-[15px] font-semibold text-text-primary">Novo Agendamento</div>
              <button onClick={() => setNovoOpen(false)}>
                <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
              </button>
            </div>

            <div className="p-6 space-y-4">

              {/* Patient search */}
              <div className="relative">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Paciente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                  {novoPacLoad && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted animate-spin" />}
                  <input
                    value={novoPacSel ? getPacNome(novoPacSel) : novoPacQ}
                    onChange={e => {
                      if (novoPacSel) { setNovoPacSel(null); setNovoPacRes([]) }
                      buscarPaciente(e.target.value)
                    }}
                    placeholder="Digite o nome do paciente..."
                    className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-9 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none"
                  />
                  {novoPacSel && (
                    <button
                      onClick={() => { setNovoPacSel(null); setNovoPacQ(""); setNovoPacRes([]) }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {novoPacRes.length > 0 && !novoPacSel && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-surface border border-border rounded-xl mt-1 shadow-xl overflow-hidden">
                    {novoPacRes.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { setNovoPacSel(p); setNovoPacRes([]) }}
                        className="w-full text-left px-4 py-2.5 text-[12px] text-text-secondary hover:bg-surface-2 transition-colors border-b border-border last:border-b-0"
                      >
                        <span className="font-medium">{getPacNome(p)}</span>
                        {getPacId(p) && <span className="ml-2 text-[10px] text-text-muted font-mono">#{getPacId(p)}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Data</label>
                  <input
                    type="date"
                    value={novoForm.data}
                    onChange={e => setNovoForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary outline-none focus:border-accent/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Horário</label>
                  <input
                    type="time"
                    value={novoForm.hora}
                    onChange={e => setNovoForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary outline-none focus:border-accent/40"
                  />
                </div>
              </div>

              {/* Doctor pills */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Profissional</label>
                <div className="flex gap-2 flex-wrap">
                  {MEDICOS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setNovoForm(f => ({ ...f, idUsuario: m.id }))}
                      className={cn(
                        "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                        novoForm.idUsuario === m.id
                          ? "bg-accent-dim border-accent-border text-accent font-medium"
                          : "border-border text-text-muted hover:text-text-secondary"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Procedure */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Tipo</label>
                <select
                  value={novoForm.procedimento}
                  onChange={e => setNovoForm(f => ({ ...f, procedimento: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary outline-none focus:border-accent/40"
                >
                  {TIPOS_CONSULTA.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {novoError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-[12px]">
                  {novoError}
                </div>
              )}

              <button
                onClick={salvarAgendamento}
                disabled={novoSaving || novoOk || !novoPacSel}
                className={cn(
                  "w-full flex items-center justify-center gap-2 text-[12px] font-semibold rounded-xl py-2.5 transition-all",
                  novoOk
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-accent text-background hover:opacity-90 disabled:opacity-40"
                )}
              >
                {novoSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : novoOk ? (
                  <><Check className="w-3.5 h-3.5" /> Agendamento criado!</>
                ) : (
                  <><Calendar className="w-3.5 h-3.5" /> Confirmar Agendamento</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
