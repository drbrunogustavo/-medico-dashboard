"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { cn } from "@/lib/utils"
import {
  ArrowLeft, ChevronLeft, ChevronRight, Calendar, List,
  Clock, RefreshCw, Filter, User, Plus,
  Search, Loader2, X, Check, Bot, Stethoscope,
  AlertCircle, Sparkles,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Appointment {
  id?:               string | number
  idAgendamento?:    string | number
  idContato?:        string | number
  paciente?:         string
  nomePaciente?:     string
  nomeContato?:      string
  profissional?:     string
  nomeUsuario?:      string
  idUsuario?:        string | number
  data?:             string
  dataAgendamento?:  string
  hora?:             string
  horaInicio?:       string
  horaFim?:          string
  status?:           string
  idStatus?:         string | number
  nomeStatus?:       string
  procedimento?:     string
  nomeProcedimento?: string
  observacao?:       string
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

interface Usuario {
  id:   string | number
  nome: string
  [key: string]: unknown
}

interface StatusItem {
  id:   string | number
  nome: string
  [key: string]: unknown
}

type ViewMode = "lista" | "calendario"

// ── Constants ──────────────────────────────────────────────────────────────────

const DIAS_SEMANA  = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MESES        = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
const MESES_LONG   = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

const TIPOS_CONSULTA = [
  "Primeira Consulta",
  "Retorno",
  "Nova Consulta - Paciente Antigo",
  "Procedimento",
  "Administração EV/IM",
  "Bioimpedância",
  "Outro",
]

// Hour range for calendar view
const CAL_START = 7   // 07:00
const CAL_END   = 20  // 20:00
const SLOT_H    = 52  // px per hour

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  confirmado: "bg-emerald-500/12 text-emerald-400 border-emerald-500/30",
  agendado:   "bg-blue-500/12    text-blue-400    border-blue-500/30",
  aguardando: "bg-amber-500/12   text-amber-400   border-amber-500/30",
  atendido:   "bg-blue-500/12    text-blue-400    border-blue-500/30",
  cancelado:  "bg-red-500/12     text-red-400     border-red-500/30",
  falta:      "bg-red-500/12     text-red-400     border-red-500/30",
}

const STATUS_BAR: Record<string, string> = {
  confirmado: "#34d399",
  agendado:   "#60a5fa",
  aguardando: "#fbbf24",
  atendido:   "#60a5fa",
  cancelado:  "#f87171",
  falta:      "#f87171",
}

function statusKey(s: string = ""): string {
  return s.toLowerCase().replace(/\s+/g, "")
}

function statusStyle(s: string = ""): string {
  const k = statusKey(s)
  for (const key of Object.keys(STATUS_STYLES)) {
    if (k.includes(key)) return STATUS_STYLES[key]
  }
  return "bg-surface text-text-muted border-border"
}

function statusBarColor(s: string = ""): string {
  const k = statusKey(s)
  for (const key of Object.keys(STATUS_BAR)) {
    if (k.includes(key)) return STATUS_BAR[key]
  }
  return "var(--border)"
}

// ── Appointment field accessors ───────────────────────────────────────────────

function getApptId(a: Appointment): string {
  return String(a.idAgendamento ?? a.id ?? "")
}

function getApptPatientId(a: Appointment): string {
  return String(a.idContato ?? "")
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
  return a.nomeStatus ?? a.status ?? ""
}

function getApptProc(a: Appointment): string {
  return a.procedimento ?? a.nomeProcedimento ?? ""
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0]
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function fmtDateLong(d: Date): string {
  return `${d.getDate()} de ${MESES_LONG[d.getMonth()]}`
}

function getPacNome(p: PacienteResult): string {
  return p.Nome ?? p.nome ?? p.nomeCompleto ?? "—"
}

function getPacId(p: PacienteResult): string {
  return String(p.Id ?? p.id ?? "")
}

// Calendar positioning helpers
function horaToMinutes(hora: string): number {
  if (!hora) return 0
  const [h, m] = hora.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

function eventTop(hora: string): number {
  const mins = horaToMinutes(hora)
  return Math.max(0, (mins - CAL_START * 60) / 60) * SLOT_H
}

function eventHeight(horaInicio: string, horaFim?: string): number {
  if (horaFim) {
    const dur = horaToMinutes(horaFim) - horaToMinutes(horaInicio)
    return Math.max(28, (dur / 60) * SLOT_H)
  }
  return SLOT_H * 0.75 // default 45min
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const router = useRouter()

  const [weekStart,     setWeekStart]     = useState<Date>(() => startOfWeek(new Date()))
  const [viewMode,      setViewMode]      = useState<ViewMode>("calendario")
  const [agendamentos,  setAgendamentos]  = useState<Appointment[]>([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState("")

  // Usuarios and status from API
  const [usuarios,      setUsuarios]      = useState<Usuario[]>([])
  const [statusList,    setStatusList]    = useState<StatusItem[]>([])
  const [usuarioFiltro, setUsuarioFiltro] = useState("all")

  // Detail modal
  const [selected,       setSelected]       = useState<Appointment | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatusId,    setNewStatusId]    = useState("")
  const [statusUpdateOk, setStatusUpdateOk] = useState(false)

  // New appointment modal
  const [novoOpen,    setNovoOpen]    = useState(false)
  const [novoPacQ,    setNovoPacQ]    = useState("")
  const [novoPacRes,  setNovoPacRes]  = useState<PacienteResult[]>([])
  const [novoPacSel,  setNovoPacSel]  = useState<PacienteResult | null>(null)
  const [novoPacLoad, setNovoPacLoad] = useState(false)
  const [novoForm,    setNovoForm]    = useState({
    data:         toISO(new Date()),
    hora:         "08:00",
    horaFim:      "09:00",
    idUsuario:    "",
    procedimento: "Consulta de Endocrinologia",
    observacao:   "",
  })
  const [novoSaving, setNovoSaving] = useState(false)

  const [resumoDia,     setResumoDia]     = useState<string | null>(null)
  const [loadingResumo, setLoadingResumo] = useState(false)
  const [novoError,  setNovoError]  = useState("")
  const [novoOk,     setNovoOk]     = useState(false)
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mobileCalIdx, setMobileCalIdx] = useState(0)

  const dias    = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])
  const mesAno  = `${MESES[weekStart.getMonth()]} ${weekStart.getFullYear()}`

  // Fetch metadata once
  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, sRes] = await Promise.all([
          fetch("/api/agenda?action=usuarios"),
          fetch("/api/agenda?action=status"),
        ])
        if (uRes.ok) {
          const u = await uRes.json()
          if (Array.isArray(u)) {
            setUsuarios(u.map((x: Record<string, unknown>) => ({
              id:   String(x.Id ?? x.id ?? x.IdUsuario ?? x.idUsuario ?? ""),
              nome: String(x.Nome ?? x.nome ?? x.nomeUsuario ?? x.NomeUsuario ?? x.id ?? ""),
              ...x,
            })))
          }
        }
        if (sRes.ok) {
          const s = await sRes.json()
          if (Array.isArray(s)) {
            setStatusList(s.map((x: Record<string, unknown>) => ({
              id:   String(x.Id ?? x.id ?? x.IdStatus ?? x.idStatus ?? ""),
              nome: String(x.Nome ?? x.nome ?? x.nomeStatus ?? x.NomeStatus ?? ""),
              ...x,
            })))
          }
        }
      } catch (e) { console.error("[agenda] erro ao carregar usuários da clínica:", e) }
    }
    load()
  }, [])

  // Set default idUsuario once usuarios load
  useEffect(() => {
    if (usuarios.length > 0 && !novoForm.idUsuario) {
      setNovoForm(f => ({ ...f, idUsuario: String(usuarios[0].id) }))
    }
  }, [usuarios, novoForm.idUsuario])

  const fetchAgenda = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const inicio = toISO(weekStart)
      const fim    = toISO(weekEnd)
      const url    = usuarioFiltro !== "all"
        ? `/api/agenda?action=agenda-usuario&inicio=${inicio}&fim=${fim}&idUsuario=${usuarioFiltro}`
        : `/api/agenda?action=agenda&inicio=${inicio}&fim=${fim}`
      const res  = await fetch(url)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setAgendamentos(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd, usuarioFiltro])

  useEffect(() => { fetchAgenda() }, [fetchAgenda])

  // Sync mobile day index to today when the week changes
  useEffect(() => {
    const todayISO = toISO(new Date())
    const idx = dias.findIndex(d => toISO(d) === todayISO)
    setMobileCalIdx(idx >= 0 ? idx : 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  // Patient search
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
      } catch (e) { console.error("[agenda] erro na busca de pacientes:", e) }
      finally { setNovoPacLoad(false) }
    }, 400)
  }

  const gerarBriefing = async () => {
    setLoadingResumo(true)
    try {
      const res  = await fetch("/api/agenda/resumo-dia", { method: "POST" })
      const data = await res.json() as { resumo?: string }
      setResumoDia(data.resumo ?? "")
    } catch (e) { console.error("[agenda] gerarBriefing:", e) }
    finally { setLoadingResumo(false) }
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
        HoraFim:          novoForm.horaFim,
        IdUsuario:        novoForm.idUsuario,
        NomeProcedimento: novoForm.procedimento,
        Observacao:       novoForm.observacao,
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
      setTimeout(() => { setNovoOpen(false); setNovoOk(false); fetchAgenda() }, 1500)
    } catch (e) {
      setNovoError(e instanceof Error ? e.message : String(e))
    } finally {
      setNovoSaving(false)
    }
  }

  const atualizarStatus = async () => {
    if (!selected || !newStatusId) return
    setUpdatingStatus(true)
    try {
      const body = {
        IdAgendamento: getApptId(selected),
        IdStatus:      newStatusId,
      }
      const res = await fetch("/api/agenda", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setStatusUpdateOk(true)
      setTimeout(() => {
        setSelected(null)
        setStatusUpdateOk(false)
        fetchAgenda()
      }, 1200)
    } catch (e) { console.error("[agenda] erro ao atualizar status do agendamento:", e) }
    finally { setUpdatingStatus(false) }
  }

  const byDay = (dia: Date): Appointment[] => {
    const key = toISO(dia)
    return agendamentos
      .filter(a => getApptDate(a) === key)
      .sort((a, b) => getApptHora(a).localeCompare(getApptHora(b)))
  }

  const totalSemana = agendamentos.length
  const totalHoje   = byDay(new Date()).length
  const confirmados = agendamentos.filter(a => {
    const s = getApptStatus(a).toLowerCase()
    return s.includes("confirm") || s.includes("agend")
  }).length

  const horasEixo = Array.from({ length: CAL_END - CAL_START + 1 }, (_, i) => CAL_START + i)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Agenda Inteligente"
        subtitle="ALA CLÍNICA · MEDX"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-[11px] border border-border text-text-muted rounded-lg px-2.5 py-1.5 hover:border-border-hover hover:text-text-secondary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <button
              onClick={gerarBriefing}
              disabled={loadingResumo}
              className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-accent-border hover:text-accent transition-colors disabled:opacity-50"
            >
              {loadingResumo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-accent" />}
              <span className="hidden sm:inline">Briefing do dia</span>
            </button>
            {/* View toggle */}
            <div className="flex gap-0.5 bg-surface border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("lista")}
                className={cn(
                  "w-8 h-7 rounded flex items-center justify-center transition-all",
                  viewMode === "lista"
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-text-muted hover:text-text-secondary"
                )}
                title="Vista lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("calendario")}
                className={cn(
                  "w-8 h-7 rounded flex items-center justify-center transition-all",
                  viewMode === "calendario"
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-text-muted hover:text-text-secondary"
                )}
                title="Vista calendário"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => openNovo()}
              className="flex items-center gap-1.5 text-[14px] bg-blue-500 text-white font-semibold rounded-lg px-5 py-3 hover:bg-blue-600 transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Agendamento</span>
            </button>

            <button
              onClick={fetchAgenda}
              disabled={loading}
              className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-5">

        {resumoDia !== null && (
          <div className="bg-card border border-accent-border rounded-lg p-5 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-[11px] font-mono text-accent tracking-widest uppercase">Briefing do dia</span>
              </div>
              <button onClick={() => setResumoDia(null)} className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-[13px] text-text-primary leading-relaxed">{resumoDia}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Esta Semana"    value={totalSemana} sub="agendamentos"  icon={Calendar}    accent="blue"  />
          <StatCard label="Hoje"           value={totalHoje}   sub="consultas"     icon={Clock}       accent="blue"  />
          <StatCard label="Confirmados"    value={confirmados} sub="esta semana"   icon={Stethoscope} accent="green" />
          <StatCard label="Profissionais"  value={usuarios.length || "—"} sub="na equipe" icon={User} accent="amber" />
        </div>

        {/* Week nav + filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Week navigator */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-[12px] font-medium text-text-primary whitespace-nowrap">
              {toISO(weekStart).slice(5).replace("-","/")}
              {" – "}
              {toISO(weekEnd).slice(5).replace("-","/")}
              <span className="ml-1.5 text-text-muted text-[11px]">{mesAno}</span>
            </span>
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
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

          {/* Médico filter */}
          {usuarios.length > 0 && (
            <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
              <button
                onClick={() => setUsuarioFiltro("all")}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full border transition-all",
                  usuarioFiltro === "all"
                    ? "bg-blue-500/12 border-blue-500/30 text-blue-400 font-medium"
                    : "border-border text-text-muted hover:text-text-secondary"
                )}
              >
                Todos
              </button>
              {usuarios.map(u => (
                <button
                  key={String(u.id)}
                  onClick={() => setUsuarioFiltro(String(u.id))}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full border transition-all",
                    usuarioFiltro === String(u.id)
                      ? "bg-blue-500/12 border-blue-500/30 text-blue-400 font-medium"
                      : "border-border text-text-muted hover:text-text-secondary"
                  )}
                >
                  {u.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── LISTA VIEW ───────────────────────────────────────────────────── */}
        {viewMode === "lista" && (
          <div className="space-y-5">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-surface border border-border animate-pulse" />)}
              </div>
            ) : (
              dias.map(dia => {
                const items = byDay(dia)
                const isHoje = toISO(dia) === toISO(new Date())
                return (
                  <div key={toISO(dia)}>
                    {/* Day header */}
                    <div className={cn(
                      "flex items-center gap-3 mb-2",
                    )}>
                      <div className={cn(
                        "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest font-mono",
                        isHoje ? "text-blue-400" : "text-text-muted"
                      )}>
                        <span>{DIAS_SEMANA[dia.getDay()]}</span>
                        <span className={cn(
                          "text-[16px] font-bold leading-none",
                          isHoje ? "text-blue-400" : "text-text-secondary"
                        )}>
                          {dia.getDate()}
                        </span>
                        <span className="text-[10px] font-normal">{fmtDateLong(dia)}</span>
                      </div>
                      {isHoje && (
                        <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/12 border border-blue-500/30 text-blue-400">
                          HOJE
                        </span>
                      )}
                      {items.length > 0 && (
                        <span className="text-[10px] text-text-muted ml-auto">
                          {items.length} {items.length === 1 ? "consulta" : "consultas"}
                        </span>
                      )}
                    </div>

                    {items.length === 0 ? (
                      <div className="border border-dashed border-border rounded-xl px-5 py-4 text-[12px] text-text-muted flex items-center justify-between">
                        <span>Sem agendamentos</span>
                        <button
                          onClick={() => openNovo(toISO(dia))}
                          className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {items.map((apt, i) => (
                          <button
                            key={i}
                            onClick={() => { setSelected(apt); setNewStatusId("") }}
                            className="w-full text-left bg-surface border border-border rounded-xl px-4 py-3 hover:border-blue-500/30 hover:bg-blue-500/[0.03] transition-all group flex items-center gap-4"
                          >
                            {/* Status bar */}
                            <div
                              className="w-1 self-stretch rounded-full flex-shrink-0"
                              style={{ background: statusBarColor(getApptStatus(apt)) }}
                            />
                            {/* Time */}
                            <div className="flex-shrink-0 w-12 text-center">
                              <div className="text-[13px] font-mono font-bold text-text-primary">
                                {getApptHora(apt).slice(0, 5) || "—"}
                              </div>
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium text-text-primary truncate">
                                {getApptNome(apt)}
                              </div>
                              {getApptProc(apt) && (
                                <div className="text-[11px] text-text-muted truncate mt-0.5">
                                  {getApptProc(apt)}
                                </div>
                              )}
                            </div>
                            {/* Profissional */}
                            {(apt.profissional ?? apt.nomeUsuario) && (
                              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-text-muted flex-shrink-0">
                                <User className="w-3 h-3" />
                                {String(apt.profissional ?? apt.nomeUsuario)}
                              </div>
                            )}
                            {/* Status badge */}
                            <span className={cn(
                              "text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border flex-shrink-0",
                              statusStyle(getApptStatus(apt))
                            )}>
                              {getApptStatus(apt) || "—"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── CALENDÁRIO VIEW ──────────────────────────────────────────────── */}
        {viewMode === "calendario" && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Mobile: single-day navigation */}
            <div className="md:hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <button
                  onClick={() => setMobileCalIdx(i => Math.max(0, i - 1))}
                  disabled={mobileCalIdx === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 hover:bg-surface-2 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center flex-1">
                  <div className={cn(
                    "text-[12px] font-semibold",
                    toISO(dias[mobileCalIdx]) === toISO(new Date()) ? "text-blue-400" : "text-text-primary"
                  )}>
                    {DIAS_SEMANA[dias[mobileCalIdx].getDay()]}, {fmtDateLong(dias[mobileCalIdx])}
                  </div>
                  {toISO(dias[mobileCalIdx]) === toISO(new Date()) && (
                    <span className="text-[9px] font-mono text-blue-400 tracking-widest">HOJE</span>
                  )}
                </div>
                <button
                  onClick={() => setMobileCalIdx(i => Math.min(6, i + 1))}
                  disabled={mobileCalIdx === 6}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 hover:bg-surface-2 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-xl bg-surface border border-border animate-pulse" />
                  ))}
                </div>
              ) : (() => {
                const mobileItems = byDay(dias[mobileCalIdx])
                return mobileItems.length === 0 ? (
                  <div className="flex items-center justify-between px-4 py-5 text-[12px] text-text-muted">
                    <span>Sem agendamentos</span>
                    <button
                      onClick={() => openNovo(toISO(dias[mobileCalIdx]))}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {mobileItems.map((apt, j) => (
                      <button
                        key={j}
                        onClick={() => { setSelected(apt); setNewStatusId("") }}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors"
                      >
                        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: statusBarColor(getApptStatus(apt)) }} />
                        <div className="w-12 text-center flex-shrink-0">
                          <div className="text-[13px] font-mono font-bold text-text-primary">
                            {getApptHora(apt).slice(0, 5) || "—"}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-text-primary truncate">{getApptNome(apt)}</div>
                          {getApptProc(apt) && (
                            <div className="text-[11px] text-text-muted truncate">{getApptProc(apt)}</div>
                          )}
                        </div>
                        <span className={cn(
                          "text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border flex-shrink-0",
                          statusStyle(getApptStatus(apt))
                        )}>
                          {getApptStatus(apt) || "—"}
                        </span>
                      </button>
                    ))}
                    <div className="flex justify-center p-2 border-t border-border">
                      <button
                        onClick={() => openNovo(toISO(dias[mobileCalIdx]))}
                        className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 px-3 py-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Day headers — desktop */}
            <div className="hidden md:grid grid-cols-[48px_repeat(7,1fr)] border-b border-border">
              <div /> {/* spacer for time axis */}
              {dias.map((dia, i) => {
                const isHoje = toISO(dia) === toISO(new Date())
                const count  = byDay(dia).length
                return (
                  <div
                    key={i}
                    className={cn(
                      "px-2 py-3 text-center border-l border-border",
                      isHoje && "bg-blue-500/[0.06]"
                    )}
                  >
                    <div className={cn(
                      "text-[9px] font-mono uppercase tracking-widest",
                      isHoje ? "text-blue-400" : "text-text-muted"
                    )}>
                      {DIAS_SEMANA[dia.getDay()]}
                    </div>
                    <div className={cn(
                      "text-[18px] font-semibold mt-0.5",
                      isHoje ? "text-blue-400" : "text-text-primary"
                    )}>
                      {dia.getDate()}
                    </div>
                    {count > 0 && (
                      <div className="text-[9px] text-text-muted">
                        {count} {count === 1 ? "consulta" : "consultas"}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Scrollable time grid — desktop only */}
            <div className="hidden md:block overflow-y-auto" style={{ maxHeight: 640 }}>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse flex gap-3 items-start">
                      <div className="w-10 h-3 rounded bg-surface flex-shrink-0 mt-1" />
                      {[...Array(7)].map((_, j) => (
                        <div key={j} className="flex-1 h-10 rounded-lg bg-surface" style={{ opacity: Math.random() > 0.7 ? 1 : 0.3 }} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="grid grid-cols-[48px_repeat(7,1fr)] relative"
                  style={{ height: (CAL_END - CAL_START + 1) * SLOT_H }}
                >
                  {/* Time axis + hour lines */}
                  {horasEixo.map(h => (
                    <div
                      key={h}
                      className="contents"
                    >
                      {/* Hour label */}
                      <div
                        className="absolute left-0 w-12 flex items-start justify-end pr-2 text-[9px] font-mono text-text-muted"
                        style={{ top: (h - CAL_START) * SLOT_H - 6 }}
                      >
                        {String(h).padStart(2,"0")}h
                      </div>
                      {/* Horizontal line */}
                      <div
                        className="absolute left-12 right-0 border-t border-border"
                        style={{ top: (h - CAL_START) * SLOT_H }}
                      />
                    </div>
                  ))}

                  {/* Day columns with events */}
                  {dias.map((dia, colIdx) => {
                    const items  = byDay(dia)
                    const isHoje = toISO(dia) === toISO(new Date())
                    return (
                      <div
                        key={colIdx}
                        className={cn(
                          "relative border-l border-border",
                          isHoje && "bg-blue-500/[0.02]"
                        )}
                        style={{ gridColumn: colIdx + 2 }}
                      >
                        {/* "Add" click target */}
                        <button
                          onClick={() => openNovo(toISO(dia))}
                          className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 hover:bg-blue-500/[0.04] transition-opacity z-0"
                        />
                        {items.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                            <Plus className="w-4 h-4 text-blue-400/50" />
                          </div>
                        )}
                        {/* Events */}
                        {items.map((apt, j) => {
                          const hora   = getApptHora(apt)
                          const mins   = horaToMinutes(hora)
                          if (mins < CAL_START * 60 || mins >= CAL_END * 60) return null
                          const top    = eventTop(hora)
                          const height = eventHeight(hora, apt.horaFim as string | undefined)
                          const sColor = statusBarColor(getApptStatus(apt))
                          return (
                            <button
                              key={j}
                              onClick={e => { e.stopPropagation(); setSelected(apt); setNewStatusId("") }}
                              className="absolute left-1 right-1 z-10 rounded-lg border text-left overflow-hidden hover:z-20 hover:scale-[1.02] transition-transform"
                              style={{
                                top:              top + 2,
                                height:           Math.max(height - 4, 24),
                                borderColor:      `${sColor}55`,
                                backgroundColor:  `${sColor}18`,
                              }}
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-full"
                                style={{ background: sColor }}
                              />
                              <div className="pl-2 pr-1 py-0.5">
                                <div className="text-[9px] font-mono font-semibold text-text-secondary leading-none">
                                  {hora.slice(0, 5)}
                                </div>
                                <div className="text-[10px] font-medium text-text-primary leading-snug line-clamp-2 mt-0.5">
                                  {getApptNome(apt)}
                                </div>
                                {height > 40 && getApptProc(apt) && (
                                  <div className="text-[8px] text-text-muted truncate mt-0.5">
                                    {getApptProc(apt)}
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries({
            Confirmado: "confirmado",
            Agendado:   "agendado",
            Aguardando: "aguardando",
            Atendido:   "atendido",
            Cancelado:  "cancelado",
          }).map(([label, key]) => (
            <div key={key} className={cn(
              "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border",
              STATUS_STYLES[key]
            )}>
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
              {label}
            </div>
          ))}
        </div>

      </div>

      {/* ── DETAIL MODAL ─────────────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-3">
              <div>
                <div
                  className="text-[17px] font-semibold text-text-primary"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {getApptNome(selected)}
                </div>
                <div className="text-[12px] text-text-muted mt-0.5 font-mono">
                  {getApptDate(selected).split("-").reverse().join("/")}
                  {getApptHora(selected) && ` · ${getApptHora(selected).slice(0,5)}`}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn(
                  "text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border",
                  statusStyle(getApptStatus(selected))
                )}>
                  {getApptStatus(selected) || "—"}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-2.5 text-[12px]">
              {getApptProc(selected) && (
                <Row label="Procedimento" value={getApptProc(selected)} />
              )}
              {(selected.profissional ?? selected.nomeUsuario) && (
                <Row label="Profissional" value={String(selected.profissional ?? selected.nomeUsuario)} />
              )}
              {selected.horaFim && (
                <Row label="Horário" value={`${getApptHora(selected).slice(0,5)} – ${String(selected.horaFim).slice(0,5)}`} />
              )}
              {selected.observacao && (
                <Row label="Observação" value={String(selected.observacao)} />
              )}
              {getApptPatientId(selected) && (
                <Row label="ID Paciente" value={`#${getApptPatientId(selected)}`} mono />
              )}
            </div>

            {/* Update status */}
            {statusList.length > 0 && (
              <div className="px-6 pb-4 space-y-2">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block">
                  Atualizar Status
                </label>
                <div className="flex gap-2">
                  <select
                    value={newStatusId}
                    onChange={e => setNewStatusId(e.target.value)}
                    className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-blue-500/40 transition-colors"
                  >
                    <option value="">Selecionar status...</option>
                    {statusList.map(s => (
                      <option key={String(s.id)} value={String(s.id)}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={atualizarStatus}
                    disabled={!newStatusId || updatingStatus || statusUpdateOk}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all",
                      statusUpdateOk
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
                    )}
                  >
                    {updatingStatus  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     : statusUpdateOk ? <Check   className="w-3.5 h-3.5" />
                     : <Check className="w-3.5 h-3.5" />}
                    {statusUpdateOk ? "Salvo!" : "Salvar"}
                  </button>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="px-6 pb-5 pt-2 flex gap-2">
              {getApptPatientId(selected) && (
                <button
                  onClick={() => router.push(`/copiloto?pacienteId=${getApptPatientId(selected)}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500/12 border border-blue-500/30 text-blue-400 text-[12px] font-semibold rounded-xl py-2.5 hover:bg-blue-500/20 transition-all"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Abrir no Copiloto
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className={cn(
                  "text-[12px] border border-border text-text-secondary rounded-xl py-2.5 hover:border-border-hover transition-colors",
                  getApptPatientId(selected) ? "px-4" : "flex-1"
                )}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOVO AGENDAMENTO MODAL ─────────────────────────────────────────── */}
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
              <div
                className="text-[15px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Novo Agendamento
              </div>
              <button
                onClick={() => setNovoOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Patient search */}
              <div className="relative">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  Paciente
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                  {novoPacLoad && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted animate-spin" />
                  )}
                  <input
                    value={novoPacSel ? getPacNome(novoPacSel) : novoPacQ}
                    onChange={e => {
                      if (novoPacSel) { setNovoPacSel(null); setNovoPacRes([]) }
                      buscarPaciente(e.target.value)
                    }}
                    placeholder="Digite o nome do paciente..."
                    className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-9 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
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
                        {getPacId(p) && (
                          <span className="ml-2 text-[10px] text-text-muted font-mono">#{getPacId(p)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date + Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Data</label>
                  <input
                    type="date"
                    value={novoForm.data}
                    onChange={e => setNovoForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-2 py-2.5 text-[11px] text-text-primary outline-none focus:border-blue-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Início</label>
                  <input
                    type="time"
                    value={novoForm.hora}
                    onChange={e => setNovoForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-2 py-2.5 text-[11px] text-text-primary outline-none focus:border-blue-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Fim</label>
                  <input
                    type="time"
                    value={novoForm.horaFim}
                    onChange={e => setNovoForm(f => ({ ...f, horaFim: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-2 py-2.5 text-[11px] text-text-primary outline-none focus:border-blue-500/40 transition-colors"
                  />
                </div>
              </div>

              {/* Doctor */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Profissional</label>
                {usuarios.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {usuarios.map(u => (
                      <button
                        key={String(u.id)}
                        onClick={() => setNovoForm(f => ({ ...f, idUsuario: String(u.id) }))}
                        className={cn(
                          "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                          novoForm.idUsuario === String(u.id)
                            ? "bg-blue-500/12 border-blue-500/30 text-blue-400 font-medium"
                            : "border-border text-text-muted hover:text-text-secondary"
                        )}
                      >
                        {u.nome}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    value={novoForm.idUsuario}
                    onChange={e => setNovoForm(f => ({ ...f, idUsuario: e.target.value }))}
                    placeholder="ID do profissional"
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-blue-500/40"
                  />
                )}
              </div>

              {/* Procedure */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Tipo de Consulta</label>
                <select
                  value={novoForm.procedimento}
                  onChange={e => setNovoForm(f => ({ ...f, procedimento: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary outline-none focus:border-blue-500/40 transition-colors truncate"
                >
                  {TIPOS_CONSULTA.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Observação */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Observação</label>
                <input
                  value={novoForm.observacao}
                  onChange={e => setNovoForm(f => ({ ...f, observacao: e.target.value }))}
                  placeholder="Opcional"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
                />
              </div>

              {novoError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-[12px]">
                  {novoError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => setNovoOpen(false)}
                className="px-4 py-2.5 rounded-xl text-[12px] text-text-muted border border-border hover:border-border-hover transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarAgendamento}
                disabled={novoSaving || novoOk || !novoPacSel}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 text-[12px] font-semibold rounded-xl py-2.5 transition-all",
                  novoOk
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
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

// ── Small helper component ────────────────────────────────────────────────────

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3 text-[12px]">
      <span className="text-text-muted w-24 flex-shrink-0">{label}</span>
      <span className={cn("text-text-secondary", mono && "font-mono")}>{value}</span>
    </div>
  )
}
