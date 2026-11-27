"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus, Search, Loader2, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel, Tag, PxButton, PxInput, PxSelect, Field, PxModal, Segmented, PageHeader } from "@/components/px"

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

// ── Status ────────────────────────────────────────────────────────────────────
// A cor nunca fala sozinha: todo bloco leva o nome do status por escrito.

type TagTone = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"

function statusKey(s: string = ""): string {
  const k = s.toLowerCase().replace(/\s+/g, "")
  for (const key of ["confirmado", "agendado", "aguardando", "atendido", "cancelado", "falta"]) {
    if (k.includes(key)) return key
  }
  return ""
}

const STATUS_TAG: Record<string, TagTone> = {
  confirmado: "ok", agendado: "neutral", aguardando: "warn", atendido: "ink", cancelado: "danger", falta: "danger",
}

// Aparência do bloco no calendário
const STATUS_BLOCK: Record<string, string> = {
  confirmado: "bg-px-ink text-white border-px-ink",
  agendado:   "bg-white text-px-ink border-px-ink/40",
  aguardando: "bg-px-accent text-white border-px-accent",
  atendido:   "bg-px-slate text-white border-px-slate",
  cancelado:  "bg-px-danger-soft text-px-danger border-px-danger/40 line-through",
  falta:      "bg-px-danger-soft text-px-danger border-px-danger/40 line-through",
}

function statusTone(s: string): TagTone { return STATUS_TAG[statusKey(s)] ?? "neutral" }
function statusBlock(s: string): string { return STATUS_BLOCK[statusKey(s)] ?? "bg-white text-px-ink border-px-ink/40" }

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
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
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

// ── Overlap layout ────────────────────────────────────────────────────────────
// For each day column, assigns a horizontal sub-column index and total count
// so overlapping events are displayed side-by-side instead of stacked.

function computeColumns(items: Appointment[]) {
  if (!items.length) return []
  const evs = items.map(apt => {
    const s = horaToMinutes(getApptHora(apt))
    const e = apt.horaFim ? Math.max(s + 15, horaToMinutes(String(apt.horaFim))) : s + 45
    return { apt, s, e, col: 0, maxCols: 1 }
  }).sort((a, b) => a.s - b.s || b.e - a.e)
  const colEnds: number[] = []
  for (const ev of evs) {
    let c = colEnds.findIndex(end => end <= ev.s)
    if (c === -1) c = colEnds.length
    colEnds[c] = ev.e
    ev.col = c
  }
  for (let i = 0; i < evs.length; i++) {
    let maxCol = evs[i].col
    for (let j = 0; j < evs.length; j++) {
      if (i !== j && evs[j].s < evs[i].e && evs[j].e > evs[i].s)
        maxCol = Math.max(maxCol, evs[j].col)
    }
    evs[i].maxCols = maxCol + 1
  }
  return evs
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
  const [statusUpdateErro, setStatusUpdateErro] = useState("")

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

  // Pre-fill patient from ?pacienteId=&pacienteNome= (set by modal pós-consulta)
  useEffect(() => {
    const sp    = new URLSearchParams(window.location.search)
    const pacId = sp.get("pacienteId")
    const pacNm = sp.get("pacienteNome")
    if (pacId && pacNm) {
      setNovoPacSel({ id: pacId, nome: pacNm } as PacienteResult)
      setNovoPacQ(pacNm)
      setNovoOpen(true)
    }
  }, [])

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
    setStatusUpdateErro("")
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `Erro ${res.status}`)
      }
      setStatusUpdateOk(true)
      setTimeout(() => {
        setSelected(null)
        setStatusUpdateOk(false)
        fetchAgenda()
      }, 1600)
    } catch (e) {
      console.error("[agenda] erro ao atualizar status do agendamento:", e)
      setStatusUpdateErro(e instanceof Error ? e.message : "Não foi possível atualizar o status.")
    }
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
  const hojeISO = toISO(new Date())
  const foraDaGrade = agendamentos.filter(a => {
    const m = horaToMinutes(getApptHora(a))
    return m < CAL_START * 60 || m >= CAL_END * 60
  }).length

  const abrir = (apt: Appointment) => { setSelected(apt); setNewStatusId(""); setStatusUpdateErro(""); setStatusUpdateOk(false) }

  const itemLista = (apt: Appointment, i: number) => (
    <li key={i}>
      <button type="button" onClick={() => abrir(apt)} className="flex w-full items-center gap-4 rounded-px-card bg-white/70 px-4 py-3 text-left transition-colors hover:bg-white">
        <span className="w-12 shrink-0 text-[15px] font-semibold tabular-nums text-px-ink">{getApptHora(apt).slice(0, 5) || "—"}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-px-ink">{getApptNome(apt)}</span>
          {getApptProc(apt) && <span className="block truncate text-[12.5px] text-px-muted">{getApptProc(apt)}</span>}
        </span>
        {(apt.profissional ?? apt.nomeUsuario) && <span className="hidden shrink-0 text-[12.5px] text-px-muted md:block">{String(apt.profissional ?? apt.nomeUsuario)}</span>}
        <Tag tone={statusTone(getApptStatus(apt))}>{getApptStatus(apt) || "Sem status"}</Tag>
      </button>
    </li>
  )

  return (
    <div className="px px-ambient min-h-screen animate-fade-in">
      <PageHeader
        back
        title="Agenda"
        caption={`${fmtDateLong(weekStart)} a ${fmtDateLong(weekEnd)}, ${weekStart.getFullYear()}`}
        actions={
          <>
            <PxButton variant="secondary" size="sm" leftIcon={loadingResumo ? Loader2 : Sparkles} onClick={gerarBriefing} disabled={loadingResumo}>Briefing do dia</PxButton>
            <PxButton size="sm" leftIcon={Plus} onClick={() => openNovo()}>Novo agendamento</PxButton>
          </>
        }
      />

      <div className="space-y-4 px-5 pb-10 pt-4 md:px-10">

        {resumoDia !== null && (
          <Panel tone="strong" aria-label="Briefing do dia">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-px-ink">Briefing do dia</h2>
              <button type="button" onClick={() => setResumoDia(null)} aria-label="Fechar briefing" className="flex h-8 w-8 items-center justify-center rounded-full bg-px-ink/[0.08] text-px-ink hover:bg-px-ink/15"><X className="h-4 w-4" aria-hidden="true" /></button>
            </div>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-px-ink">{resumoDia || "Sem resumo para hoje."}</p>
          </Panel>
        )}

        {/* Controles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-white/70 p-1">
            <button type="button" onClick={() => setWeekStart(d => addDays(d, -7))} aria-label="Semana anterior" className="flex h-9 w-9 items-center justify-center rounded-full text-px-ink hover:bg-px-ink/10"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
            <span className="min-w-[96px] px-1 text-center text-[13px] font-semibold tabular-nums text-px-ink">{toISO(weekStart).slice(8)}/{toISO(weekStart).slice(5, 7)} a {toISO(weekEnd).slice(8)}/{toISO(weekEnd).slice(5, 7)}</span>
            <button type="button" onClick={() => setWeekStart(d => addDays(d, 7))} aria-label="Próxima semana" className="flex h-9 w-9 items-center justify-center rounded-full text-px-ink hover:bg-px-ink/10"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <PxButton variant="secondary" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</PxButton>
          <Segmented label="Modo de exibição" value={viewMode} onChange={setViewMode} options={[{ value: "calendario", label: "Calendário" }, { value: "lista", label: "Lista" }]} />
          {usuarios.length > 0 && (
            <Segmented
              label="Profissional"
              className="sm:ml-auto"
              value={usuarioFiltro}
              onChange={setUsuarioFiltro}
              options={[{ value: "all", label: "Todos" }, ...usuarios.map(u => ({ value: String(u.id), label: u.nome }))]}
            />
          )}
        </div>

        <p className="text-[13px] text-px-muted" aria-live="polite">
          {loading ? "Carregando a semana..." : <><span className="font-semibold text-px-ink tabular-nums">{totalHoje}</span> {totalHoje === 1 ? "consulta hoje" : "consultas hoje"}, <span className="font-semibold text-px-ink tabular-nums">{totalSemana}</span> na semana, <span className="font-semibold text-px-ink tabular-nums">{confirmados}</span> confirmadas ou agendadas.</>}
        </p>

        {error && (
          <Panel tone="strong" role="alert" className="border border-px-danger/30">
            <p className="text-[14px] text-px-danger">Não foi possível carregar a agenda ({error}).</p>
            <div className="mt-3"><PxButton variant="secondary" size="sm" onClick={fetchAgenda}>Tentar de novo</PxButton></div>
          </Panel>
        )}

        {viewMode === "calendario" && foraDaGrade > 0 && !loading && (
          <p className="text-[13px] text-px-muted">{foraDaGrade} {foraDaGrade === 1 ? "agendamento fora" : "agendamentos fora"} do intervalo de {CAL_START}h às {CAL_END}h não aparece no calendário. Veja na lista.</p>
        )}

        {/* LISTA */}
        {viewMode === "lista" && (
          <div className="space-y-5">
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-px-card bg-px-ink/10" />)}</div>
            ) : dias.map(dia => {
              const items = byDay(dia)
              const hoje = toISO(dia) === hojeISO
              return (
                <section key={toISO(dia)} aria-label={`${DIAS_SEMANA[dia.getDay()]} ${dia.getDate()}`}>
                  <div className="mb-2 flex items-baseline gap-3">
                    <h2 className="text-[15px] font-semibold text-px-ink">{DIAS_SEMANA[dia.getDay()]}, {fmtDateLong(dia)}</h2>
                    {hoje && <Tag tone="ink">Hoje</Tag>}
                    {items.length > 0 && <span className="ml-auto text-[12.5px] text-px-muted">{items.length} {items.length === 1 ? "consulta" : "consultas"}</span>}
                  </div>
                  {items.length === 0 ? (
                    <div className="flex items-center justify-between rounded-px-card border border-dashed border-px-ink/25 px-4 py-3 text-[13px] text-px-muted">
                      <span>Sem agendamentos</span>
                      <button type="button" onClick={() => openNovo(toISO(dia))} className="font-semibold text-px-accent underline-offset-4 hover:underline">Adicionar</button>
                    </div>
                  ) : <ul className="space-y-1.5">{items.map(itemLista)}</ul>}
                </section>
              )
            })}
          </div>
        )}

        {/* CALENDÁRIO */}
        {viewMode === "calendario" && (
          <Panel tone="light" className="overflow-hidden !p-0">
            {/* Celular: um dia por vez */}
            <div className="md:hidden">
              <div className="flex items-center justify-between border-b border-px-line px-3 py-2.5">
                <button type="button" onClick={() => setMobileCalIdx(i => Math.max(0, i - 1))} disabled={mobileCalIdx === 0} aria-label="Dia anterior" className="flex h-10 w-10 items-center justify-center rounded-full text-px-ink hover:bg-px-ink/10 disabled:opacity-30"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
                <div className="text-center text-[14px] font-semibold text-px-ink">
                  {DIAS_SEMANA[dias[mobileCalIdx].getDay()]}, {fmtDateLong(dias[mobileCalIdx])}
                  {toISO(dias[mobileCalIdx]) === hojeISO && <span className="ml-2 align-middle"><Tag tone="ink">Hoje</Tag></span>}
                </div>
                <button type="button" onClick={() => setMobileCalIdx(i => Math.min(6, i + 1))} disabled={mobileCalIdx === 6} aria-label="Próximo dia" className="flex h-10 w-10 items-center justify-center rounded-full text-px-ink hover:bg-px-ink/10 disabled:opacity-30"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
              </div>
              {loading ? (
                <div className="space-y-2 p-3">{[1, 2, 3].map(i => <div key={i} className="h-14 animate-pulse rounded-px-card bg-px-ink/10" />)}</div>
              ) : (() => {
                const doDia = byDay(dias[mobileCalIdx])
                return doDia.length === 0 ? (
                  <div className="flex items-center justify-between px-4 py-5 text-[13px] text-px-muted">
                    <span>Sem agendamentos</span>
                    <button type="button" onClick={() => openNovo(toISO(dias[mobileCalIdx]))} className="font-semibold text-px-accent underline-offset-4 hover:underline">Adicionar</button>
                  </div>
                ) : (
                  <div className="p-3">
                    <ul className="space-y-1.5">{doDia.map(itemLista)}</ul>
                    <div className="mt-3 flex justify-center"><PxButton variant="quiet" size="sm" leftIcon={Plus} onClick={() => openNovo(toISO(dias[mobileCalIdx]))}>Adicionar</PxButton></div>
                  </div>
                )
              })()}
            </div>

            {/* Computador: semana */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-px-line">
                <div />
                {dias.map((dia, i) => {
                  const hoje = toISO(dia) === hojeISO
                  const n = byDay(dia).length
                  return (
                    <div key={i} className="border-l border-px-line px-2 py-3 text-center">
                      <div className="text-[12px] text-px-muted">{DIAS_SEMANA[dia.getDay()]}</div>
                      <div className={cn("mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums", hoje ? "bg-px-ink text-white" : "text-px-ink")}>{dia.getDate()}</div>
                      <div className="mt-1 h-4 text-[11.5px] text-px-muted">{n > 0 ? `${n} ${n === 1 ? "consulta" : "consultas"}` : ""}</div>
                    </div>
                  )
                })}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 640 }}>
                {loading ? (
                  <div className="space-y-3 p-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-10 animate-pulse rounded-px-ctl bg-px-ink/10" />)}</div>
                ) : (
                  <div className="relative grid grid-cols-[48px_repeat(7,1fr)]" style={{ height: (CAL_END - CAL_START + 1) * SLOT_H }}>
                    {horasEixo.map(h => (
                      <div key={h} className="contents">
                        <div className="absolute left-0 flex w-12 justify-end pr-2 text-[11.5px] tabular-nums text-px-muted" style={{ top: (h - CAL_START) * SLOT_H - 7 }}>{String(h).padStart(2, "0")}h</div>
                        <div className="absolute left-12 right-0 border-t border-px-line" style={{ top: (h - CAL_START) * SLOT_H }} />
                      </div>
                    ))}
                    {dias.map((dia, colIdx) => {
                      const items = byDay(dia)
                      return (
                        <div key={colIdx} className={cn("relative border-l border-px-line", toISO(dia) === hojeISO && "bg-white/40")} style={{ gridColumn: colIdx + 2 }}>
                          <button type="button" onClick={() => openNovo(toISO(dia))} aria-label={`Novo agendamento em ${fmtDateLong(dia)}`} className="absolute inset-0 z-0 h-full w-full opacity-0 transition-opacity hover:bg-px-ink/[0.04] hover:opacity-100 focus-visible:opacity-100" />
                          {computeColumns(items).map(({ apt, col, maxCols }, j) => {
                            const hora = getApptHora(apt)
                            const mins = horaToMinutes(hora)
                            if (mins < CAL_START * 60 || mins >= CAL_END * 60) return null
                            const height = eventHeight(hora, apt.horaFim as string | undefined)
                            const st = getApptStatus(apt)
                            const wPct = 100 / maxCols
                            return (
                              <button
                                key={j}
                                type="button"
                                onClick={e => { e.stopPropagation(); abrir(apt) }}
                                aria-label={`${hora.slice(0, 5)} ${getApptNome(apt)}, ${st || "sem status"}`}
                                className={cn("absolute z-10 overflow-hidden rounded-px-ctl border px-2 py-1 text-left transition-shadow hover:z-20 hover:shadow-[0_4px_14px_rgba(20,20,20,0.25)]", statusBlock(st))}
                                style={{ top: eventTop(hora) + 2, height: Math.max(height - 4, 26), left: `calc(${col * wPct}% + 2px)`, width: `calc(${wPct}% - 4px)` }}
                              >
                                <span className="block truncate text-[11.5px] font-semibold leading-tight">{hora.slice(0, 5)} {getApptNome(apt)}</span>
                                {height > 44 && <span className="block truncate text-[11px] leading-tight opacity-90">{st || getApptProc(apt)}</span>}
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
          </Panel>
        )}

        {/* Legenda */}
        <div className="flex flex-wrap items-center gap-2" aria-label="Legenda dos status">
          {[["Confirmado", "confirmado"], ["Agendado", "agendado"], ["Aguardando", "aguardando"], ["Atendido", "atendido"], ["Cancelado", "cancelado"]].map(([label, key]) => (
            <span key={key} className={cn("inline-flex items-center rounded-px-ctl border px-2.5 py-1 text-[12px] font-medium", STATUS_BLOCK[key])}>{label}</span>
          ))}
        </div>
      </div>

      {/* Detalhe */}
      <PxModal open={selected !== null} onClose={() => setSelected(null)} title={selected ? getApptNome(selected) : ""}>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-px-muted">
              <span className="tabular-nums">{getApptDate(selected).split("-").reverse().join("/")}{getApptHora(selected) && `, ${getApptHora(selected).slice(0, 5)}`}{selected.horaFim ? ` às ${String(selected.horaFim).slice(0, 5)}` : ""}</span>
              <Tag tone={statusTone(getApptStatus(selected))}>{getApptStatus(selected) || "Sem status"}</Tag>
            </div>
            <dl className="space-y-2 text-[13.5px]">
              {getApptProc(selected) && <Row label="Procedimento" value={getApptProc(selected)} />}
              {(selected.profissional ?? selected.nomeUsuario) && <Row label="Profissional" value={String(selected.profissional ?? selected.nomeUsuario)} />}
              {selected.observacao && <Row label="Observação" value={String(selected.observacao)} />}
              {getApptPatientId(selected) && <Row label="Paciente" value={`#${getApptPatientId(selected)}`} />}
            </dl>

            {statusList.length > 0 && (
              <div>
                <Field label="Atualizar status" htmlFor="agenda-status" error={statusUpdateErro || undefined}>
                  <div className="flex gap-2">
                    <PxSelect id="agenda-status" value={newStatusId} onChange={e => setNewStatusId(e.target.value)}>
                      <option value="">Selecione</option>
                      {statusList.map(s => <option key={String(s.id)} value={String(s.id)}>{s.nome}</option>)}
                    </PxSelect>
                    <PxButton onClick={atualizarStatus} loading={updatingStatus} disabled={!newStatusId || statusUpdateOk}>{statusUpdateOk ? "Salvo" : "Salvar"}</PxButton>
                  </div>
                </Field>
                {statusUpdateOk && <p role="status" className="mt-2 text-[12.5px] font-medium text-px-ok">Status atualizado.</p>}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {getApptPatientId(selected) && <PxButton fullWidth variant="secondary" onClick={() => router.push(`/copiloto?pacienteId=${getApptPatientId(selected)}`)}>Abrir no Copiloto</PxButton>}
              <PxButton fullWidth variant="quiet" onClick={() => setSelected(null)}>Fechar</PxButton>
            </div>
          </div>
        )}
      </PxModal>

      {/* Novo agendamento */}
      <PxModal open={novoOpen} onClose={() => setNovoOpen(false)} title="Novo agendamento">
        <div className="space-y-4">
          <div className="relative">
            <Field label="Paciente" htmlFor="ag-pac">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-px-muted" aria-hidden="true" />
                <PxInput
                  id="ag-pac"
                  className="pl-10"
                  value={novoPacSel ? getPacNome(novoPacSel) : novoPacQ}
                  onChange={e => { if (novoPacSel) { setNovoPacSel(null); setNovoPacRes([]) } buscarPaciente(e.target.value) }}
                  placeholder="Digite o nome do paciente"
                  autoComplete="off"
                />
                {novoPacLoad && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-px-muted" aria-hidden="true" />}
              </div>
            </Field>
            {novoPacRes.length > 0 && !novoPacSel && (
              <ul className="px-glass-strong absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-px-card shadow-[0_10px_30px_rgba(20,20,20,0.18)]">
                {novoPacRes.map((p, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => { setNovoPacSel(p); setNovoPacRes([]) }} className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 text-left text-[13.5px] text-px-ink hover:bg-px-ink/10">
                      <span className="truncate font-medium">{getPacNome(p)}</span>
                      {getPacId(p) && <span className="shrink-0 text-[12px] tabular-nums text-px-muted">#{getPacId(p)}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Data" htmlFor="ag-data"><PxInput id="ag-data" type="date" className="px-2" value={novoForm.data} onChange={e => setNovoForm(f => ({ ...f, data: e.target.value }))} /></Field>
            <Field label="Início" htmlFor="ag-ini"><PxInput id="ag-ini" type="time" className="px-2" value={novoForm.hora} onChange={e => setNovoForm(f => ({ ...f, hora: e.target.value }))} /></Field>
            <Field label="Fim" htmlFor="ag-fim"><PxInput id="ag-fim" type="time" className="px-2" value={novoForm.horaFim} onChange={e => setNovoForm(f => ({ ...f, horaFim: e.target.value }))} /></Field>
          </div>

          {usuarios.length > 0 ? (
            <Field label="Profissional">
              <Segmented label="Profissional" value={novoForm.idUsuario} onChange={v => setNovoForm(f => ({ ...f, idUsuario: v }))} options={usuarios.map(u => ({ value: String(u.id), label: u.nome }))} />
            </Field>
          ) : (
            <Field label="Profissional" htmlFor="ag-prof"><PxInput id="ag-prof" value={novoForm.idUsuario} onChange={e => setNovoForm(f => ({ ...f, idUsuario: e.target.value }))} placeholder="ID do profissional" /></Field>
          )}

          <Field label="Tipo de consulta" htmlFor="ag-tipo">
            <PxSelect id="ag-tipo" value={novoForm.procedimento} onChange={e => setNovoForm(f => ({ ...f, procedimento: e.target.value }))}>
              {TIPOS_CONSULTA.map(t => <option key={t}>{t}</option>)}
            </PxSelect>
          </Field>

          <Field label="Observação" htmlFor="ag-obs"><PxInput id="ag-obs" value={novoForm.observacao} onChange={e => setNovoForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Opcional" /></Field>

          {novoError && <p role="alert" className="text-[13px] text-px-danger">{novoError}</p>}
          {novoOk && <p role="status" className="text-[13px] font-medium text-px-ok">Agendamento criado.</p>}

          <div className="flex gap-2 pt-1">
            <PxButton variant="quiet" onClick={() => setNovoOpen(false)}>Cancelar</PxButton>
            <PxButton fullWidth onClick={salvarAgendamento} loading={novoSaving} disabled={novoOk || !novoPacSel}>Confirmar agendamento</PxButton>
          </div>
        </div>
      </PxModal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-px-muted">{label}</dt>
      <dd className="text-px-ink">{value}</dd>
    </div>
  )
}
