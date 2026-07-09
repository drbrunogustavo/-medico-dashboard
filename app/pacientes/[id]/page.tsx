"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  ArrowLeft, Bot, Phone, Mail, Calendar, Loader2, Plus, X,
  AlertCircle, ClipboardList, Clock, FlaskConical, Pill, Camera,
  TrendingUp, TrendingDown, Minus, Check, Trash2, ChevronUp, ChevronDown,
  Edit3, FileUp, Sparkles, Zap,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface PacienteLocal {
  id:                 string
  nome:               string
  telefone?:          string | null
  email?:             string | null
  data_nascimento?:   string | null
  observacao?:        string | null
  foto_url?:          string | null
  peso?:              number | null
  altura?:            number | null
  circunferencia_ab?: number | null
  medicamentos?:      string[] | null
  pendencias?:        string | null
  protocolo_ativo?:   string | null
  sexo?:              string | null
}

interface Exame {
  id:          string
  nome:        string
  valor:       string
  unidade?:    string | null
  referencia?: string | null
  tendencia?:  string | null
  data_coleta?: string | null
  criado_em:   string
}

interface HistoricoEntry {
  id:             string
  tipo_consulta?: string | null
  relato:         string
  resultado?:     { resumo?: string; plano?: string; exames_solicitados?: string[] } | null
  created_at:     string
}

type TimelineEvent =
  | { kind: "consulta"; id: string; date: string; entry: HistoricoEntry }
  | { kind: "exame";    id: string; date: string; exame: Exame }

interface AlertaIA {
  tipo:      string
  titulo:    string
  descricao: string
  urgencia:  "alta" | "media" | "baixa"
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcIdade(s: string): string {
  if (!s) return ""
  const d = new Date(s)
  if (isNaN(d.getTime())) return ""
  return `${Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))} anos`
}

function calcIMC(peso?: number | null, altura?: number | null): string {
  if (!peso || !altura || altura < 1) return "—"
  return (peso / ((altura / 100) ** 2)).toFixed(1)
}

function fmtDateLong(s: string): string {
  if (!s) return "—"
  const d      = new Date(s)
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function fmtDateISO(s: string): string {
  if (!s) return "—"
  return s.split("T")[0].split("-").reverse().join("/")
}

const AVATAR_COLORS: string[] = [
  "bg-blue-500/20  text-blue-400",
  "bg-purple-500/20 text-purple-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20  text-amber-400",
  "bg-pink-500/20   text-pink-400",
  "bg-cyan-500/20   text-cyan-400",
  "bg-orange-500/20 text-orange-400",
]

function avatarColor(nome: string): string {
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function initials(nome: string): string {
  const p = nome.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function getMetricValue(pac: PacienteLocal, field: string): string {
  if (field === "imc") return calcIMC(pac.peso, pac.altura)
  const v = (pac as unknown as Record<string, unknown>)[field]
  return typeof v === "number" ? String(v) : "—"
}

// ── EvolucaoChart ─────────────────────────────────────────────────────────────

interface PesoPoint { data: string; peso: number }

function EvolucaoChart({ exames, pacPeso }: { exames: Exame[]; pacPeso?: number | null }) {
  const pontos = useMemo((): PesoPoint[] => {
    const fromExames: PesoPoint[] = exames
      .filter(e => /^peso$/i.test(e.nome.trim()) && !isNaN(parseFloat(e.valor)))
      .map(e => ({
        data: (e.data_coleta ?? e.criado_em).split("T")[0],
        peso: parseFloat(e.valor),
      }))

    // Inclui o peso atual do perfil como ponto "hoje" se não houver entrada nos últimos 7 dias
    if (pacPeso) {
      const hoje   = new Date()
      const cutoff = new Date(hoje.getTime() - 7 * 86_400_000).toISOString().split("T")[0]
      const temRecente = fromExames.some(p => p.data >= cutoff)
      if (!temRecente) {
        fromExames.push({ data: hoje.toISOString().split("T")[0], peso: pacPeso })
      }
    }

    return fromExames.sort((a, b) => a.data.localeCompare(b.data))
  }, [exames, pacPeso])

  if (pontos.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <TrendingUp className="w-6 h-6 text-text-muted/30" />
        <p className="text-[12px] text-text-muted">
          Adicione mais consultas para ver a evolução de peso.
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={pontos} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="data"
          tick={{ fontSize: 9, fill: "var(--text-muted)" }}
          tickFormatter={fmtDateISO}
        />
        <YAxis
          tick={{ fontSize: 9, fill: "var(--text-muted)" }}
          domain={["auto", "auto"]}
          unit=" kg"
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 11,
            color: "var(--text-primary)",
          }}
          formatter={(v) => [`${v} kg`, "Peso"]}
          labelFormatter={(l) => fmtDateISO(String(l))}
        />
        <Line
          type="monotone"
          dataKey="peso"
          stroke="#00c07f"
          strokeWidth={2}
          dot={{ fill: "#00c07f", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#00c07f" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── SectionCard ───────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, iconColor = "text-blue-400", children, extra, defaultOpen = true }: {
  title:        string
  icon:         React.ElementType
  iconColor?:   string
  children:     React.ReactNode
  extra?:       React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-2/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={cn("w-4 h-4 flex-shrink-0", iconColor)} />
          <span className="text-[12px] font-semibold text-text-primary">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {extra}
          {open
            ? <ChevronUp   className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            : <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />}
        </div>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ── PendenciaEditor ───────────────────────────────────────────────────────────

function PendenciaEditor({ value, onSave, placeholder }: {
  value:       string
  onSave:      (v: string) => Promise<void>
  placeholder: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => { setDraft(value) }, [value])

  const save = async () => {
    setSaving(true)
    try { await onSave(draft) } finally { setSaving(false); setEditing(false) }
  }

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="min-h-[52px] text-[12px] leading-relaxed cursor-pointer transition-colors mt-1"
      >
        {value ? (
          <p className="whitespace-pre-wrap text-text-secondary">{value}</p>
        ) : (
          <span className="flex items-center gap-1.5 text-text-muted italic">
            <Edit3 className="w-3 h-3" />
            {placeholder}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2 mt-1">
      <textarea
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-surface border border-blue-500/30 rounded-xl px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted outline-none resize-none leading-relaxed"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 text-[11px] bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold rounded-lg px-3 py-1.5 hover:bg-blue-500/20 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Salvar
        </button>
        <button
          onClick={() => { setEditing(false); setDraft(value) }}
          className="text-[11px] border border-border text-text-muted rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const METRICAS = [
  { field: "peso",              label: "Peso",          unit: "kg",    readOnly: false },
  { field: "altura",            label: "Altura",        unit: "cm",    readOnly: false },
  { field: "imc",               label: "IMC",           unit: "kg/m²", readOnly: true  },
  { field: "circunferencia_ab", label: "Circ. Abdominal", unit: "cm", readOnly: false },
] as const

export default function PacienteDashboard() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState("")
  const [pac,           setPac]           = useState<PacienteLocal | null>(null)
  const [exames,        setExames]        = useState<Exame[]>([])
  const [historico,     setHistorico]     = useState<HistoricoEntry[]>([])
  const [alertas,       setAlertas]       = useState<AlertaIA[]>([])
  const [loadingAlertas, setLoadingAlertas] = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [editMetrica,   setEditMetrica]   = useState<string | null>(null)
  const [editValue,     setEditValue]     = useState("")
  const [addingMed,     setAddingMed]     = useState(false)
  const [novoMed,       setNovoMed]       = useState("")
  const [showAddExame,  setShowAddExame]  = useState(false)
  const [savingExame,   setSavingExame]   = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [uploadingPDF,  setUploadingPDF]  = useState(false)
  const [exameForm,     setExameForm]     = useState({
    nome: "", valor: "", unidade: "", referencia: "", tendencia: "stable", data_coleta: "",
  })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const editRef   = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const res  = await fetch(`/api/pacientes/${id}`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setPac(data.paciente)
      setExames(data.exames ?? [])
      setHistorico(data.historico ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }, [id])

  const loadAlertas = useCallback(async () => {
    setLoadingAlertas(true)
    try {
      const res  = await fetch(`/api/pacientes/${id}/alertas-ia`)
      const data = await res.json() as { alertas?: AlertaIA[] }
      setAlertas(data.alertas ?? [])
    } catch { /* non-blocking */ }
    finally { setLoadingAlertas(false) }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (!loading && pac) { loadAlertas() } }, [loading, pac, loadAlertas])
  useEffect(() => { if (editMetrica && editRef.current) editRef.current.focus() }, [editMetrica])

  const patch = async (updates: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/pacientes/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setPac(data)
    } catch (e) { console.error("[paciente dash] patch:", e) }
    finally { setSaving(false) }
  }

  const saveMetrica = async () => {
    if (!editMetrica) return
    const val = parseFloat(editValue.replace(",", "."))
    if (!isNaN(val) && val > 0) await patch({ [editMetrica]: val })
    setEditMetrica(null); setEditValue("")
  }

  const addMedicamento = async () => {
    if (!novoMed.trim() || !pac) return
    const meds = [...(pac.medicamentos ?? []), novoMed.trim()]
    await patch({ medicamentos: meds })
    setNovoMed(""); setAddingMed(false)
  }

  const removeMedicamento = async (idx: number) => {
    if (!pac) return
    const meds = (pac.medicamentos ?? []).filter((_, i) => i !== idx)
    await patch({ medicamentos: meds })
  }

  const addExame = async () => {
    if (!exameForm.nome.trim() || !exameForm.valor.trim()) return
    setSavingExame(true)
    try {
      const res = await fetch(`/api/pacientes/${id}/exames`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exameForm),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const novo = await res.json()
      setExames(prev => [novo, ...prev])
      setShowAddExame(false)
      setExameForm({ nome: "", valor: "", unidade: "", referencia: "", tendencia: "stable", data_coleta: "" })
    } catch (e) { console.error("[paciente dash] addExame:", e) }
    finally { setSavingExame(false) }
  }

  const deleteExame = async (exameId: string) => {
    try {
      await fetch(`/api/pacientes/${id}/exames?exameId=${exameId}`, { method: "DELETE" })
      setExames(prev => prev.filter(e => e.id !== exameId))
    } catch (e) { console.error("[paciente dash] deleteExame:", e) }
  }

  const uploadFoto = async (file: File) => {
    setUploadingFoto(true)
    try {
      const form = new FormData(); form.append("file", file)
      const res  = await fetch(`/api/pacientes/${id}/foto`, { method: "POST", body: form })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const { foto_url } = await res.json()
      setPac(p => p ? { ...p, foto_url } : p)
    } catch (e) { console.error("[paciente dash] uploadFoto:", e) }
    finally { setUploadingFoto(false) }
  }

  const importarPDF = useCallback(async (file: File) => {
    setUploadingPDF(true)
    try {
      const form = new FormData(); form.append("file", file)
      const res  = await fetch("/api/exames/upload", { method: "POST", body: form })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const { exames: extraidos } = await res.json() as {
        exames: Array<{ nome: string; valor: string; unidade?: string; referencia?: string; tendencia?: string }>
      }
      for (const ex of extraidos) {
        await fetch(`/api/pacientes/${id}/exames`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ex),
        })
      }
      const r = await fetch(`/api/pacientes/${id}`)
      if (r.ok) { const d = await r.json(); setExames(d.exames ?? []) }
    } catch (e) { console.error("[paciente dash] importarPDF:", e) }
    finally {
      setUploadingPDF(false)
      if (pdfInputRef.current) pdfInputRef.current.value = ""
    }
  }, [id])

  const examesAlterados = exames.filter(e => e.tendencia === "up" || e.tendencia === "down")

  const URGENCIA_ORDER: Record<string, number> = { alta: 0, media: 1, baixa: 2 }
  const topAlerta: AlertaIA | null = (!loadingAlertas && alertas.length > 0)
    ? ([...alertas].sort((a, b) => (URGENCIA_ORDER[a.urgencia] ?? 3) - (URGENCIA_ORDER[b.urgencia] ?? 3))[0] ?? null)
    : null

  const timelineEvents = useMemo((): TimelineEvent[] => {
    const consultas: TimelineEvent[] = historico.map(e => ({
      kind: "consulta", id: e.id, date: e.created_at, entry: e,
    }))
    const exameEvs: TimelineEvent[] = exames.map(e => ({
      kind: "exame", id: e.id, date: e.data_coleta ?? e.criado_em, exame: e,
    }))
    return [...consultas, ...exameEvs].sort((a, b) => b.date.localeCompare(a.date))
  }, [historico, exames])

  const byMonth = useMemo((): { monthLabel: string; events: TimelineEvent[] }[] => {
    const groups: { monthLabel: string; events: TimelineEvent[] }[] = []
    for (const ev of timelineEvents) {
      const d     = new Date(ev.date)
      const raw   = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      const label = raw.charAt(0).toUpperCase() + raw.slice(1)
      const last  = groups[groups.length - 1]
      if (!last || last.monthLabel !== label) groups.push({ monthLabel: label, events: [ev] })
      else last.events.push(ev)
    }
    return groups
  }, [timelineEvents])

  return (
    <div className="animate-fade-in">
      <TopBar
        title={loading ? "Paciente" : (pac?.nome ?? "Paciente")}
        subtitle="DASHBOARD · ALA CLÍNICA"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <Link
              href={`/copiloto?pacienteId=${id}`}
              className="flex items-center gap-1.5 text-[11px] bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold rounded-lg px-3 py-1.5 hover:bg-blue-500/20 transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copiloto</span>
            </Link>
            <Link
              href={`/prescricao?pacienteId=${id}`}
              className="flex items-center gap-1.5 text-[11px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold rounded-lg px-3 py-1.5 hover:bg-emerald-500/20 transition-all"
            >
              <Pill className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prescrever</span>
            </Link>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-5">

        {/* Skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="h-[110px] rounded-2xl bg-card border border-border shimmer" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0,1,2,3].map(i => <div key={i} className="h-[72px] rounded-xl bg-card border border-border shimmer" />)}
            </div>
            <div className="h-32 rounded-2xl bg-card border border-border shimmer" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {pac && (
          <>
            {/* ── SEÇÃO 1: Cabeçalho do paciente ──────────────────────────── */}
            <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
              <div className="flex items-start gap-4 md:gap-5">

                {/* Avatar / foto upload */}
                <div className="relative flex-shrink-0">
                  {pac.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pac.foto_url}
                      alt={pac.nome}
                      className="w-20 h-20 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center text-[22px] font-bold",
                      avatarColor(pac.nome)
                    )}>
                      {initials(pac.nome)}
                    </div>
                  )}
                  <label className={cn(
                    "absolute bottom-0 right-0 w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors",
                    uploadingFoto && "opacity-60 cursor-wait"
                  )}>
                    {uploadingFoto
                      ? <Loader2 className="w-3 h-3 text-text-muted animate-spin" />
                      : <Camera  className="w-3 h-3 text-text-muted" />}
                    <input
                      type="file" accept="image/*" className="hidden"
                      disabled={uploadingFoto}
                      onChange={e => e.target.files?.[0] && uploadFoto(e.target.files[0])}
                    />
                  </label>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-[20px] md:text-[24px] font-semibold text-text-primary leading-tight truncate"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {pac.nome}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                    {pac.telefone && (
                      <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                        <Phone className="w-3 h-3 text-text-muted flex-shrink-0" />
                        {pac.telefone}
                      </span>
                    )}
                    {pac.email && (
                      <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                        <Mail className="w-3 h-3 text-text-muted flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{pac.email}</span>
                      </span>
                    )}
                    {pac.data_nascimento && (
                      <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                        <Calendar className="w-3 h-3 text-text-muted flex-shrink-0" />
                        {calcIdade(pac.data_nascimento)}
                        <span className="text-text-muted">
                          ({fmtDateISO(pac.data_nascimento)})
                        </span>
                      </span>
                    )}
                  </div>
                  {pac.observacao && (
                    <p className="text-[11px] text-text-muted mt-2 leading-relaxed line-clamp-2">{pac.observacao}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Visão Clínica Rápida ─────────────────────────────────────── */}
            <SectionCard title="Visão Clínica Rápida" icon={Sparkles} iconColor="text-accent" defaultOpen={true}>
              <div className="space-y-3 mt-1">

                {/* Peso · IMC · Protocolo */}
                {(pac.peso || pac.protocolo_ativo) && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                    {pac.peso && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Peso</span>
                        <span className="text-[13px] font-semibold text-text-primary">{pac.peso} kg</span>
                      </span>
                    )}
                    {calcIMC(pac.peso, pac.altura) !== "—" && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">IMC</span>
                        <span className="text-[13px] font-semibold text-text-primary">{calcIMC(pac.peso, pac.altura)}</span>
                      </span>
                    )}
                    {pac.protocolo_ativo && (
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest flex-shrink-0">Protocolo</span>
                        <span className="text-[12px] text-text-secondary truncate max-w-[220px]">{pac.protocolo_ativo}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Medicamentos */}
                <div className="flex items-start gap-2">
                  <Pill className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    {(pac.medicamentos ?? []).length > 0
                      ? (pac.medicamentos ?? []).join(" · ")
                      : <span className="text-text-muted italic">Nenhum medicamento registrado.</span>
                    }
                  </p>
                </div>

                {/* Exames alterados */}
                <div className="flex items-start gap-2">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                  {examesAlterados.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {examesAlterados.map(ex => (
                        <span
                          key={ex.id}
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border",
                            ex.tendencia === "up"
                              ? "bg-red-500/10 border-red-500/30 text-red-400"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          )}
                        >
                          {ex.tendencia === "up"
                            ? <TrendingUp   className="w-3 h-3 flex-shrink-0" />
                            : <TrendingDown className="w-3 h-3 flex-shrink-0" />
                          }
                          {ex.nome}{ex.valor ? ` ${ex.valor}${ex.unidade ? ` ${ex.unidade}` : ""}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-text-muted italic">Nenhuma alteração recente.</p>
                  )}
                </div>

                {/* Alerta de maior urgência */}
                {topAlerta && (
                  <div className={cn(
                    "flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border",
                    topAlerta.urgencia === "alta"  && "bg-red-500/5 border-red-500/30",
                    topAlerta.urgencia === "media" && "bg-amber-500/5 border-amber-500/30",
                    topAlerta.urgencia === "baixa" && "bg-blue-500/5 border-blue-500/20",
                  )}>
                    <Zap className={cn("w-3.5 h-3.5 flex-shrink-0 mt-0.5",
                      topAlerta.urgencia === "alta"  && "text-red-400",
                      topAlerta.urgencia === "media" && "text-amber-400",
                      topAlerta.urgencia === "baixa" && "text-blue-400",
                    )} />
                    <div className="min-w-0 text-[12px]">
                      <span className={cn("font-semibold",
                        topAlerta.urgencia === "alta"  && "text-red-400",
                        topAlerta.urgencia === "media" && "text-amber-400",
                        topAlerta.urgencia === "baixa" && "text-text-secondary",
                      )}>
                        {topAlerta.titulo}
                      </span>
                      {topAlerta.descricao && (
                        <span className="text-text-muted"> — {topAlerta.descricao}</span>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </SectionCard>

            {/* ── Alertas IA ──────────────────────────────────────────────── */}
            {(loadingAlertas || alertas.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest">Insights IA</span>
                </div>

                {loadingAlertas ? (
                  <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3">
                    <Loader2 className="w-3.5 h-3.5 text-accent animate-spin flex-shrink-0" />
                    <span className="text-[12px] text-text-muted">Analisando dados do paciente...</span>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {alertas.map((a, i) => {
                      const uCls = {
                        alta:  { ring: "border-red-500/40 bg-red-500/5",    icon: "text-red-400",    badge: "bg-red-500/15 text-red-400 border-red-500/30"    },
                        media: { ring: "border-amber-500/40 bg-amber-500/5", icon: "text-amber-400",  badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
                        baixa: { ring: "border-blue-500/30 bg-blue-500/5",  icon: "text-blue-400",   badge: "bg-blue-500/15 text-blue-400 border-blue-500/30"   },
                      }[a.urgencia]
                      return (
                        <div key={i} className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", uCls.ring)}>
                          <Zap className={cn("w-3.5 h-3.5 flex-shrink-0 mt-0.5", uCls.icon)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[12px] font-semibold text-text-primary">{a.titulo}</span>
                              <span className={cn("text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full border", uCls.badge)}>
                                {a.urgencia === "alta" ? "URGENTE" : a.urgencia === "media" ? "ATENÇÃO" : "INFO"}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{a.descricao}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── SEÇÃO 2: Métricas rápidas ────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {METRICAS.map(m => {
                const isEditing = editMetrica === m.field
                const raw       = getMetricValue(pac, m.field)

                return (
                  <div
                    key={m.field}
                    onClick={() => {
                      if (m.readOnly) return
                      setEditMetrica(m.field)
                      setEditValue(raw !== "—" ? raw : "")
                    }}
                    className={cn(
                      "bg-card border rounded-xl p-4 transition-all",
                      !m.readOnly && "cursor-pointer hover:border-blue-500/30 hover:bg-blue-500/[0.02]",
                      isEditing ? "border-blue-500/40" : "border-border"
                    )}
                  >
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2">
                      {m.label}
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={editRef}
                          type="number" step="0.1"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={saveMetrica}
                          onKeyDown={e => {
                            if (e.key === "Enter")  saveMetrica()
                            if (e.key === "Escape") { setEditMetrica(null); setEditValue("") }
                          }}
                          className="w-full bg-transparent border-none outline-none text-[22px] font-bold text-text-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        {saving && <Loader2 className="w-3 h-3 text-text-muted animate-spin flex-shrink-0" />}
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-[22px] font-bold", raw === "—" ? "text-text-muted" : "text-text-primary")}>
                          {raw}
                        </span>
                        {raw !== "—" && <span className="text-[10px] text-text-muted">{m.unit}</span>}
                      </div>
                    )}
                    {!m.readOnly && !isEditing && (
                      <div className="flex items-center gap-1 text-[9px] text-text-muted mt-1">
                        <Edit3 className="w-2.5 h-2.5" />
                        clique para editar
                      </div>
                    )}
                    {m.readOnly && (
                      <div className="text-[9px] text-text-muted mt-1">calculado</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Sexo — pill selector */}
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Sexo Biológico</span>
              <div className="flex items-center gap-1.5">
                {(["M","F","outro"] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={async () => { if (pac.sexo !== opt) await patch({ sexo: opt }) }}
                    className={cn(
                      "text-[10px] font-semibold px-3 py-1 rounded-lg border transition-all",
                      pac.sexo === opt
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                        : "border-border text-text-muted hover:border-border-hover hover:text-text-secondary"
                    )}
                  >
                    {opt === "M" ? "Masculino" : opt === "F" ? "Feminino" : "Outro"}
                  </button>
                ))}
                {pac.sexo && (
                  <button
                    onClick={async () => await patch({ sexo: null })}
                    className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* ── SEÇÃO 3: Medicamentos ────────────────────────────────────── */}
            <SectionCard title="Medicamentos em Uso" icon={Pill} iconColor="text-emerald-400">
              <div className="space-y-2 mt-1">
                {(pac.medicamentos ?? []).length === 0 && !addingMed && (
                  <p className="text-[12px] text-text-muted">Nenhum medicamento cadastrado.</p>
                )}
                {(pac.medicamentos ?? []).map((med, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 group bg-surface border border-border rounded-lg px-3 py-2">
                    <span className="text-[12px] text-text-secondary">{med}</span>
                    <button
                      onClick={() => removeMedicamento(i)}
                      className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {addingMed && (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={novoMed}
                      onChange={e => setNovoMed(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter")  addMedicamento()
                        if (e.key === "Escape") { setAddingMed(false); setNovoMed("") }
                      }}
                      placeholder="Ex: Metformina 850mg 1x/dia..."
                      className="flex-1 bg-surface border border-blue-500/30 rounded-lg px-3 py-1.5 text-[12px] text-text-primary placeholder:text-text-muted outline-none"
                    />
                    <button
                      onClick={addMedicamento}
                      className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold rounded-lg px-3 py-1.5 hover:bg-emerald-500/20 transition-all"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => { setAddingMed(false); setNovoMed("") }}
                      className="w-7 h-7 flex items-center justify-center border border-border text-text-muted rounded-lg hover:border-border-hover transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {!addingMed && (
                  <button
                    onClick={() => setAddingMed(true)}
                    className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary transition-colors mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar medicamento
                  </button>
                )}
              </div>
            </SectionCard>

            {/* ── SEÇÃO 4: Exames recentes ─────────────────────────────────── */}
            <SectionCard title="Exames Recentes" icon={FlaskConical} iconColor="text-purple-400">
              <div className="mt-1">
                {exames.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden mb-3">
                    <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_90px_32px] gap-3 px-4 py-2 border-b border-border">
                      {["Exame","Valor","Referência","Tendência","Data",""].map(h => (
                        <span key={h} className="text-[9px] font-mono text-text-muted uppercase tracking-widest">{h}</span>
                      ))}
                    </div>
                    <div className="divide-y divide-border">
                      {exames.map(ex => (
                        <div
                          key={ex.id}
                          className="group flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2/50 transition-colors md:grid md:grid-cols-[2fr_1fr_1fr_1fr_90px_32px]"
                        >
                          <span className="text-[12px] font-medium text-text-primary">{ex.nome}</span>
                          <span className="text-[12px] text-text-primary font-mono tabular-nums">
                            {ex.valor}{ex.unidade ? ` ${ex.unidade}` : ""}
                          </span>
                          <span className="hidden md:block text-[11px] text-text-muted">{ex.referencia ?? "—"}</span>
                          <div className="hidden md:flex items-center gap-1.5">
                            {ex.tendencia === "up"     && <TrendingUp   className="w-3.5 h-3.5 text-red-400"    />}
                            {ex.tendencia === "down"   && <TrendingDown  className="w-3.5 h-3.5 text-emerald-400"/>}
                            {ex.tendencia === "stable" && <Minus         className="w-3.5 h-3.5 text-text-muted" />}
                            {!ex.tendencia             && <Minus         className="w-3.5 h-3.5 text-text-muted" />}
                            <span className={cn("text-[10px]",
                              ex.tendencia === "up"     && "text-red-400",
                              ex.tendencia === "down"   && "text-emerald-400",
                              (!ex.tendencia || ex.tendencia === "stable") && "text-text-muted"
                            )}>
                              {ex.tendencia === "up" ? "Aumentou" : ex.tendencia === "down" ? "Diminuiu" : "Estável"}
                            </span>
                          </div>
                          <span className="hidden md:block text-[10px] font-mono text-text-muted">
                            {ex.data_coleta ? fmtDateISO(ex.data_coleta) : "—"}
                          </span>
                          <button
                            onClick={() => deleteExame(ex.id)}
                            className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showAddExame && (
                  <div className="bg-surface border border-blue-500/20 rounded-xl p-4 mb-3 space-y-3">
                    <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Novo Exame</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: "nome",        label: "Nome",        placeholder: "HbA1c, TSH…",  type: "text" },
                        { key: "valor",       label: "Valor",       placeholder: "6.2",          type: "text" },
                        { key: "unidade",     label: "Unidade",     placeholder: "%",            type: "text" },
                        { key: "referencia",  label: "Referência",  placeholder: "< 7%",         type: "text" },
                        { key: "data_coleta", label: "Data coleta", placeholder: "",             type: "date" },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">{f.label}</label>
                          <input
                            type={f.type}
                            value={exameForm[f.key as keyof typeof exameForm]}
                            onChange={e => setExameForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-[12px] text-text-primary placeholder:text-text-muted outline-none focus:border-blue-500/40 transition-colors"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">Tendência</label>
                        <select
                          value={exameForm.tendencia}
                          onChange={e => setExameForm(prev => ({ ...prev, tendencia: e.target.value }))}
                          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-[12px] text-text-secondary outline-none focus:border-blue-500/40 transition-colors"
                        >
                          <option value="stable">→ Estável</option>
                          <option value="up">↑ Aumentou</option>
                          <option value="down">↓ Diminuiu</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={addExame}
                        disabled={savingExame || !exameForm.nome.trim() || !exameForm.valor.trim()}
                        className="flex items-center gap-1.5 text-[11px] bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold rounded-lg px-4 py-2 hover:bg-blue-500/20 disabled:opacity-50 transition-all"
                      >
                        {savingExame ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Salvar Exame
                      </button>
                      <button
                        onClick={() => setShowAddExame(false)}
                        className="text-[11px] border border-border text-text-muted rounded-lg px-3 py-2 hover:border-border-hover transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {!showAddExame && (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowAddExame(true)}
                      className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar exame
                    </button>
                    <button
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={uploadingPDF}
                      className="flex items-center gap-1.5 text-[11px] text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                    >
                      {uploadingPDF
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <FileUp className="w-3.5 h-3.5" />}
                      {uploadingPDF ? "Extraindo…" : "Importar PDF"}
                    </button>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && importarPDF(e.target.files[0])}
                    />
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ── SEÇÃO 5: Evolução de peso ────────────────────────────────── */}
            <SectionCard title="Evolução de Peso" icon={TrendingUp} iconColor="text-accent">
              <div className="mt-2">
                <EvolucaoChart exames={exames} pacPeso={pac?.peso} />
              </div>
            </SectionCard>

            {/* ── SEÇÃO 6: Timeline Clínica ────────────────────────────────── */}
            <SectionCard
              title="Timeline Clínica"
              icon={Clock}
              iconColor="text-blue-400"
              extra={
                timelineEvents.length > 0
                  ? <span className="text-[9px] font-mono text-text-muted mr-1">{timelineEvents.length} evento{timelineEvents.length !== 1 ? "s" : ""}</span>
                  : undefined
              }
            >
              <div className="mt-1">
                {timelineEvents.length === 0 ? (
                  <p className="text-[12px] text-text-muted">
                    Nenhuma consulta ou exame registrado para este paciente.
                  </p>
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-0 bottom-0 w-px bg-border pointer-events-none" />
                    {byMonth.map(({ monthLabel, events }, mIdx) => (
                      <div key={monthLabel}>
                        {/* Month separator */}
                        <div className={cn("flex items-center gap-3 -ml-6 mb-3", mIdx > 0 ? "mt-5" : "mt-0")}>
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest whitespace-nowrap px-1">
                            {monthLabel}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="space-y-3">
                          {events.map(ev => {
                            if (ev.kind === "consulta") {
                              const entry    = ev.entry
                              const expanded = expandedIds.has(ev.id)
                              const temPlano  = !!entry.resultado?.plano
                              const temExames = (entry.resultado?.exames_solicitados?.length ?? 0) > 0
                              const hasExtra  = temPlano || temExames
                              return (
                                <div key={ev.id} className="relative">
                                  <div className="absolute -left-[18px] top-3 w-2.5 h-2.5 rounded-full bg-blue-500/30 border-2 border-blue-500/60" />
                                  <div
                                    className={cn(
                                      "rounded-xl border border-border overflow-hidden",
                                      hasExtra && "cursor-pointer hover:border-blue-500/30 transition-colors"
                                    )}
                                    onClick={hasExtra ? () => setExpandedIds(prev => {
                                      const next = new Set(prev)
                                      next.has(ev.id) ? next.delete(ev.id) : next.add(ev.id)
                                      return next
                                    }) : undefined}
                                  >
                                    <div className="flex items-start justify-between gap-2 px-4 py-2.5">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                          <span className="text-[12px] font-semibold text-text-primary">
                                            {fmtDateLong(entry.created_at)}
                                          </span>
                                          {entry.tipo_consulta && (
                                            <span className="text-[9px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                                              {entry.tipo_consulta}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
                                          {(entry.resultado?.resumo ?? entry.relato ?? "").slice(0, 220)}
                                        </p>
                                      </div>
                                      {hasExtra && (
                                        expanded
                                          ? <ChevronUp   className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                                          : <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
                                      )}
                                    </div>
                                    {expanded && (
                                      <div className="border-t border-border px-4 py-3 space-y-2.5 bg-surface/50">
                                        {temPlano && (
                                          <div>
                                            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">Conduta</p>
                                            <p className="text-[11px] text-text-secondary leading-relaxed">{entry.resultado!.plano}</p>
                                          </div>
                                        )}
                                        {temExames && (
                                          <div>
                                            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1.5">Exames solicitados</p>
                                            <div className="flex flex-wrap gap-1.5">
                                              {(entry.resultado?.exames_solicitados ?? []).map((ex, i) => (
                                                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                                  {ex}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        <Link
                                          href={`/copiloto?pacienteId=${id}`}
                                          className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-400 hover:text-blue-300 transition-colors"
                                          onClick={e => e.stopPropagation()}
                                        >
                                          Abrir no Copiloto →
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            }

                            // Exame node
                            const ex = ev.exame
                            return (
                              <div key={ev.id} className="relative">
                                <div className="absolute -left-[18px] top-2.5 w-2.5 h-2.5 rounded-full border-2 border-purple-500/50 bg-card" />
                                <div className="flex items-center gap-2 py-1.5 min-w-0">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                                      <span className="text-[11px] font-medium text-text-secondary">{ex.nome}</span>
                                      <span className="text-[12px] font-mono font-semibold text-text-primary">
                                        {ex.valor}{ex.unidade ? ` ${ex.unidade}` : ""}
                                      </span>
                                      {ex.referencia && (
                                        <span className="text-[10px] text-text-muted">ref: {ex.referencia}</span>
                                      )}
                                      {ex.tendencia === "up"     && <TrendingUp   className="w-3 h-3 text-red-400"     />}
                                      {ex.tendencia === "down"   && <TrendingDown  className="w-3 h-3 text-emerald-400" />}
                                      {ex.tendencia === "stable" && <Minus         className="w-3 h-3 text-text-muted"  />}
                                    </div>
                                    <p className="text-[10px] font-mono text-text-muted mt-0.5">
                                      {fmtDateISO(ex.data_coleta ?? ex.criado_em)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ── SEÇÃO 6: Pendências + Protocolo ─────────────────────────── */}
            <div className="grid md:grid-cols-2 gap-4">
              <SectionCard title="Pendências" icon={AlertCircle} iconColor="text-amber-400">
                <PendenciaEditor
                  value={pac.pendencias ?? ""}
                  onSave={async v => { await patch({ pendencias: v }) }}
                  placeholder="Exames pendentes, encaminhamentos, retorno..."
                />
              </SectionCard>
              <SectionCard title="Protocolo Ativo" icon={ClipboardList} iconColor="text-emerald-400">
                <PendenciaEditor
                  value={pac.protocolo_ativo ?? ""}
                  onSave={async v => { await patch({ protocolo_ativo: v }) }}
                  placeholder="Protocolo de tratamento em andamento..."
                />
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
