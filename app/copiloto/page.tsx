"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAppContext } from "@/components/AppProvider"
import { TopBar } from "@/components/TopBar"
import { Toast } from "@/components/Toast"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import {
  Search, Loader2, X, User, Phone,
  FileText, Stethoscope, BookOpen, MessageCircle, Sparkles, ClipboardList,
  Copy, Check, Bot, RefreshCw, Plus, Tag,
  AlertCircle, ChevronDown, ChevronUp, Send,
  Clock, Trash2, FlaskConical, Mic, MicOff, ShieldCheck, Brain,
  Pill, CalendarDays, Mail, ArrowRight, Salad, Star, UserPlus,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Paciente {
  Id?: string | number; id?: string | number
  IdContato?: string | number; idContato?: string | number
  Nome?: string; nome?: string; nomeCompleto?: string
  Celular?: string; celular?: string; Telefone?: string; telefone?: string
  [key: string]: unknown
}

interface FollowupMessages {
  d1:  string
  d7:  string
  d30: string
}

interface CopilotoResult {
  resumo?:             string
  plano?:              string
  exames_solicitados?: string[]
  orientacoes?:        string
  followup?:           string | FollowupMessages
  conteudo?:           string
  prontuario?:         string
  error?:              string
}

interface HistoricoEntry {
  id:            string
  paciente_nome: string | null
  tipo_consulta: string | null
  relato:        string
  resultado:     CopilotoResult
  created_at:    string
}

type Phase = "idle" | "loading" | "done"

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPacId(p: Paciente): string {
  return String(p.Id ?? p.id ?? p.IdContato ?? p.idContato ?? "")
}
function getPacNome(p: Paciente): string {
  return String(p.Nome ?? p.nome ?? p.nomeCompleto ?? "—")
}
function getPacTel(p: Paciente): string {
  return String(p.Celular ?? p.celular ?? p.Telefone ?? p.telefone ?? "")
}
function initials(nome: string): string {
  return nome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase()
}
function fmtDate(s: string) {
  if (!s) return "—"
  const d = new Date(s)
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
}
function fmtDateLong(s: string) {
  if (!s) return "—"
  const d = new Date(s)
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function fmtTimer(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const mm = String(m).padStart(2, "0")
  const ss = String(s).padStart(2, "0")
  if (h > 0) return `${String(h).padStart(2, "0")}:${mm}:${ss}`
  return `${mm}:${ss}`
}

function parseFollowup(f?: string | FollowupMessages): FollowupMessages | null {
  if (!f) return null
  if (typeof f === "object" && "d1" in f) return f as FollowupMessages
  const s = String(f)
  // try to split old string format by D+1 / D+7 / D+30 markers
  const d1m  = s.match(/D\+1[^:]*[:：]?\s*([\s\S]+?)(?=\s*D\+7|\s*D\+30|$)/i)
  const d7m  = s.match(/D\+7[^:]*[:：]?\s*([\s\S]+?)(?=\s*D\+30|$)/i)
  const d30m = s.match(/D\+30[^:]*[:：]?\s*([\s\S]+?)$/i)
  if (d1m || d7m || d30m) {
    return { d1: d1m?.[1].trim() ?? "", d7: d7m?.[1].trim() ?? "", d30: d30m?.[1].trim() ?? "" }
  }
  return { d1: s, d7: "", d30: "" }
}

// ── Prontuário parser ─────────────────────────────────────────────────────────

interface ProntuarioBloco { key: string; label: string; content: string }

const PRONTUARIO_SECTIONS = [
  { key: "queixa",       label: "Queixa Principal",         iconColor: "text-blue-400",    patterns: ["QUEIXA PRINCIPAL"] },
  { key: "hda",          label: "História da Doença Atual", iconColor: "text-indigo-400",  patterns: ["HISTÓRIA DA DOENÇA ATUAL", "HISTORIA DA DOENÇA ATUAL", "HDA"] },
  { key: "antecedentes", label: "Antecedentes",             iconColor: "text-violet-400",  patterns: ["ANTECEDENTES"] },
  { key: "exame",        label: "Exame Físico",             iconColor: "text-cyan-400",    patterns: ["EXAME FÍSICO", "EXAME FISICO"] },
  { key: "hipoteses",    label: "Hipótese Diagnóstica",     iconColor: "text-purple-400",  patterns: ["HIPÓTESES DIAGNÓSTICAS", "HIPOTESES DIAGNOSTICAS", "HIPÓTESE DIAGNÓSTICA", "HIPOTESE DIAGNOSTICA"] },
  { key: "conduta",      label: "Plano / Conduta",          iconColor: "text-emerald-400", patterns: ["CONDUTA", "PLANO TERAPÊUTICO", "PLANO TERAPEUTICO", "PLANO"] },
  { key: "orientacoes",  label: "Orientações",              iconColor: "text-green-400",   patterns: ["ORIENTAÇÕES", "ORIENTACOES"] },
  { key: "retorno",      label: "Retorno",                  iconColor: "text-amber-400",   patterns: ["RETORNO"] },
]

function getProntuarioIcon(key: string): React.ElementType {
  switch (key) {
    case "queixa":       return MessageCircle
    case "hda":          return FileText
    case "antecedentes": return BookOpen
    case "exame":        return Stethoscope
    case "hipoteses":    return FlaskConical
    case "conduta":      return ClipboardList
    case "orientacoes":  return BookOpen
    case "retorno":      return Clock
    default:             return FileText
  }
}

function parseProntuario(text: string): ProntuarioBloco[] | null {
  if (!text?.trim()) return null
  const lines = text.split('\n')
  const found: Array<{ lineIdx: number; sectionKey: string; label: string }> = []

  for (let i = 0; i < lines.length; i++) {
    const clean = lines[i].replace(/:\s*$/, '').trim()
    const section = PRONTUARIO_SECTIONS.find(s =>
      s.patterns.some(p => p.toUpperCase() === clean.toUpperCase())
    )
    if (section) found.push({ lineIdx: i, sectionKey: section.key, label: section.label })
  }

  if (found.length < 3) return null

  return found.map((curr, i) => {
    const nextLine = i < found.length - 1 ? found[i + 1].lineIdx : lines.length
    const content  = lines.slice(curr.lineIdx + 1, nextLine).join('\n').trim()
    return { key: curr.sectionKey, label: curr.label, content }
  })
}

const TIPOS = ["Primeira consulta", "Retorno", "Urgência", "Teleconsulta"]

const FOLLOWUP_META = {
  d1:  { label: "D+1",  badge: "bg-blue-500/12 border-blue-500/30 text-blue-400",    bg: "bg-blue-500/5  border-blue-500/15"    },
  d7:  { label: "D+7",  badge: "bg-amber-500/12 border-amber-500/30 text-amber-400",  bg: "bg-amber-500/5  border-amber-500/15"  },
  d30: { label: "D+30", badge: "bg-emerald-500/12 border-emerald-500/30 text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/15" },
} as const

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title, icon: Icon, iconColor, children, defaultOpen = true, extra,
}: {
  title:        string
  icon:         React.ElementType
  iconColor:    string
  children:     React.ReactNode
  defaultOpen?: boolean
  extra?:       React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", iconColor)} />
          <span className="text-[13px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
            {title}
          </span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border space-y-3">
          {children}
          {extra}
        </div>
      )}
    </div>
  )
}

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600) }}
      className={cn(
        "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border transition-all flex-shrink-0",
        copied
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "border-border text-text-muted hover:border-blue-500/30 hover:text-blue-400",
        className,
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado!" : "Copiar"}
    </button>
  )
}

function AutoTextarea({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = el.scrollHeight + "px"
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        "w-full bg-transparent border-none outline-none resize-none overflow-hidden",
        "text-[12px] text-text-secondary leading-relaxed",
        className
      )}
    />
  )
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[200, 160, 140, 120].map((w, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded bg-surface-2 shimmer" />
            <div className="h-4 rounded bg-surface-2 shimmer" style={{ width: w }} />
          </div>
          <div className="px-5 pb-4 pt-1 border-t border-border space-y-2">
            <div className="h-3 rounded bg-surface-2 shimmer w-full" />
            <div className="h-3 rounded bg-surface-2 shimmer w-5/6" />
            <div className="h-3 rounded bg-surface-2 shimmer w-4/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

function RightPanelEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        <Bot className="w-8 h-8 text-blue-400" />
      </div>
      <div>
        <h3 className="text-[16px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
          Copiloto pronto
        </h3>
        <p className="text-[12px] text-text-muted mt-2 leading-relaxed max-w-xs">
          Preencha o briefing ao lado e clique em{" "}
          <span className="text-blue-400 font-medium">Gerar Copiloto</span>{" "}
          para receber o resumo clínico completo.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {["📋 Resumo Clínico", "🗺 Plano Terapêutico", "🧪 Exames Solicitados", "📝 Orientações ao Paciente",
          "💬 Follow-up D+1 / D+7 / D+30", "📱 Sugestão de Conteúdo", "📄 Prontuário"].map(s => (
          <div key={s} className="text-[11px] text-text-muted bg-surface border border-border rounded-lg px-3 py-2 text-left">
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main content ──────────────────────────────────────────────────────────────

function CopilotoContent() {
  const appCtx          = useAppContext()
  const searchParams    = useSearchParams()
  const router          = useRouter()
  const pacienteIdParam = searchParams.get("pacienteId") ?? ""

  // Patient
  const [query,     setQuery]     = useState("")
  const [results,   setResults]   = useState<Paciente[]>([])
  const [searching, setSearching] = useState(false)
  const [patient,   setPatient]   = useState<Paciente | null>(null)
  const [showDrop,  setShowDrop]  = useState(false)
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form
  const [relato,       setRelato]       = useState("")
  const [dados,        setDados]        = useState("")
  const [tipoConsulta, setTipoConsulta] = useState("Primeira consulta")

  // Output
  const [phase,    setPhase]    = useState<Phase>("idle")
  const [result,   setResult]   = useState<CopilotoResult | null>(null)
  const [genError, setGenError] = useState("")

  // Editable copies of generated text
  const [editedResumo,      setEditedResumo]      = useState("")
  const [editedPlano,       setEditedPlano]        = useState("")
  const [editedOrientacoes, setEditedOrientacoes]  = useState("")

  // Exames checkboxes
  const [checkedExames, setCheckedExames] = useState<Set<number>>(new Set())

  // WhatsApp send state
  const [sendingWA, setSendingWA] = useState({ d1: false, d7: false, d30: false })

  // MedX
  const [sendingMedx,        setSendingMedx]        = useState(false)
  const [prontuarioBlocos,   setProntuarioBlocos]   = useState<ProntuarioBloco[] | null>(null)
  const [editedProntuario,   setEditedProntuario]   = useState<Record<string, string>>({})

  // History
  const [historico,        setHistorico]        = useState<HistoricoEntry[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [showHistorico,    setShowHistorico]    = useState(false)
  const [deletingId,       setDeletingId]       = useState<string | null>(null)

  // Toast
  const [toast,     setToast]     = useState<{ msg: string; type: "success" | "error" } | null>(null)

  const [memoriaChips,    setMemoriaChips]    = useState<{ tipo: string; texto: string }[]>([])
  const [loadingMemoria,  setLoadingMemoria]  = useState(false)
  const [cids,            setCids]            = useState<{ codigo: string; descricao: string; justificativa: string }[]>([])
  const [loadingCids,     setLoadingCids]     = useState(false)
  const [copiedCid,       setCopiedCid]       = useState<string | null>(null)
  const [docModal,        setDocModal]        = useState<{ tipo: "carta" | "atestado"; texto: string; loading: boolean } | null>(null)
  const toastTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Voice
  // Protocol picker
  const [protocoloId,       setProtocoloId]       = useState<string | null>(null)
  const [protocolosList,    setProtocolosList]    = useState<{ id: string; titulo: string }[]>([])
  const [protocolosLoading, setProtocolosLoading] = useState(true)

  const [voiceConsent,     setVoiceConsent]     = useState<boolean | null>(null)
  const [showConsentModal, setShowConsentModal]  = useState(false)
  const [isRecording,      setIsRecording]       = useState(false)
  const [isTranscribing,   setIsTranscribing]    = useState(false)
  const [hasMediaRecorder, setHasMediaRecorder]  = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  const [isRecordingDados,    setIsRecordingDados]    = useState(false)
  const [isTranscribingDados, setIsTranscribingDados] = useState(false)
  const mediaRecorderDadosRef = useRef<MediaRecorder | null>(null)
  const audioChunksDadosRef   = useRef<Blob[]>([])

  // Focus mode
  const [focusMode,      setFocusMode]      = useState(false)
  const [timerSecs,      setTimerSecs]      = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pós-consulta modal
  const [showPostModal,  setShowPostModal]  = useState(false)
  const [consultDuration, setConsultDuration] = useState(0)

  function showToast(msg: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // Sync editable fields when result changes
  useEffect(() => {
    setEditedResumo(result?.resumo ?? "")
    setEditedPlano(result?.plano ?? "")
    setEditedOrientacoes(result?.orientacoes ?? "")
    setCheckedExames(new Set())
    if (result?.prontuario) {
      const blocos = parseProntuario(result.prontuario)
      setProntuarioBlocos(blocos)
      if (blocos) {
        const map: Record<string, string> = {}
        blocos.forEach(b => { map[b.key] = b.content })
        setEditedProntuario(map)
      } else { setEditedProntuario({}) }
    } else { setProntuarioBlocos(null); setEditedProntuario({}) }
  }, [result])

  // ── History ─────────────────────────────────────────────────────────────────

  const fetchHistorico = useCallback(async () => {
    setLoadingHistorico(true)
    try {
      const res = await fetch("/api/copiloto")
      if (!res.ok) return
      setHistorico(await res.json())
    } catch { /* non-critical */ } finally {
      setLoadingHistorico(false)
    }
  }, [])

  useEffect(() => { fetchHistorico() }, [fetchHistorico])

  useEffect(() => {
    fetch("/api/memoria?tipo=protocolo")
      .then(r => r.ok ? r.json() : [])
      .then((d: unknown) => setProtocolosList(Array.isArray(d) ? d as { id: string; titulo: string }[] : []))
      .catch(() => {})
      .finally(() => setProtocolosLoading(false))
  }, [])

  // ── Voice recording setup ────────────────────────────────────────────────────

  useEffect(() => {
    setHasMediaRecorder(
      typeof MediaRecorder !== "undefined" && !!navigator?.mediaDevices?.getUserMedia
    )
  }, [])

  useEffect(() => {
    setVoiceConsent(appCtx?.perfil?.voz_gravacao_autorizada ?? false)
  }, [appCtx?.perfil])

  // ── Focus mode: body class + consultation timer ────────────────────────────
  useEffect(() => {
    if (focusMode) {
      document.body.classList.add("consulta-focus")
      setTimerSecs(0)
      timerRef.current = setInterval(() => setTimerSecs(s => s + 1), 1000)
    } else {
      document.body.classList.remove("consulta-focus")
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      document.body.classList.remove("consulta-focus")
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [focusMode])

  // Abre modal automaticamente ao gerar relatório
  useEffect(() => {
    if (phase === "done" && result !== null && !showPostModal) {
      const t = setTimeout(() => setShowPostModal(true), 800)
      return () => clearTimeout(t)
    }
  }, [phase, result, showPostModal])

  async function aceitarConsentimento() {
    await fetch("/api/perfil", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ voz_gravacao_autorizada: true }),
    }).catch(() => {})
    appCtx?.refetchPerfil()
    setVoiceConsent(true)
    setShowConsentModal(false)
    iniciarGravacao()
  }

  function handleMicClick() {
    if (isRecording) { pararGravacao(); return }
    if (!voiceConsent) { setShowConsentModal(true); return }
    iniciarGravacao()
  }

  async function iniciarGravacao() {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : ""
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      audioChunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: rec.mimeType || "audio/webm" })
        await transcrever(blob)
      }
      rec.start()
      mediaRecorderRef.current = rec
      setIsRecording(true)
    } catch {
      showToast("Não foi possível acessar o microfone.", "error")
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  async function transcrever(blob: Blob) {
    setIsTranscribing(true)
    try {
      const mimeType = blob.type || "audio/webm"
      const ext      = mimeType.includes("mp4") ? "mp4" : "webm"
      const form     = new FormData()
      form.append("audio", blob, `gravacao.${ext}`)
      const res  = await fetch("/api/copiloto/transcricao", { method: "POST", body: form })
      const data = await res.json() as { text?: string; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro na transcrição")
      const texto = data.text?.trim() ?? ""
      if (texto) setRelato(prev => prev ? prev + "\n" + texto : texto)
      showToast("Transcrição concluída.")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Falha na transcrição.", "error")
    } finally {
      setIsTranscribing(false)
    }
  }

  function handleMicDadosClick() {
    if (isRecordingDados) { pararGravacaoDados(); return }
    if (!voiceConsent) { setShowConsentModal(true); return }
    iniciarGravacaoDados()
  }

  async function iniciarGravacaoDados() {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : ""
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      audioChunksDadosRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) audioChunksDadosRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksDadosRef.current, { type: rec.mimeType || "audio/webm" })
        await transcreverDados(blob)
      }
      rec.start()
      mediaRecorderDadosRef.current = rec
      setIsRecordingDados(true)
    } catch {
      showToast("Não foi possível acessar o microfone.", "error")
    }
  }

  function pararGravacaoDados() {
    mediaRecorderDadosRef.current?.stop()
    setIsRecordingDados(false)
  }

  async function transcreverDados(blob: Blob) {
    setIsTranscribingDados(true)
    try {
      const mimeType = blob.type || "audio/webm"
      const ext      = mimeType.includes("mp4") ? "mp4" : "webm"
      const form     = new FormData()
      form.append("audio", blob, `gravacao.${ext}`)
      const res  = await fetch("/api/copiloto/transcricao", { method: "POST", body: form })
      const data = await res.json() as { text?: string; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro na transcrição")
      const texto = data.text?.trim() ?? ""
      if (texto) setDados(prev => prev ? prev + "\n" + texto : texto)
      showToast("Transcrição concluída.")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Falha na transcrição.", "error")
    } finally {
      setIsTranscribingDados(false)
    }
  }

  async function deleteHistorico(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/copiloto?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setHistorico(prev => prev.filter(e => e.id !== id))
      showToast("Consulta removida do histórico")
    } catch (e) {
      console.error("[copiloto] erro ao remover do histórico:", e)
      showToast("Erro ao remover do histórico", "error")
    } finally {
      setDeletingId(null)
    }
  }

  function loadFromHistorico(entry: HistoricoEntry) {
    setResult(entry.resultado)
    setPhase("done")
    setRelato(entry.relato)
    if (entry.tipo_consulta) setTipoConsulta(entry.tipo_consulta)
    setQuery(entry.paciente_nome ?? "")
    setPatient(null)
    setShowHistorico(false)
    setSendingWA({ d1: false, d7: false, d30: false })
  }

  // ── Patient from URL param ───────────────────────────────────────────────────

  useEffect(() => {
    if (!pacienteIdParam) return
    ;(async () => {
      try {
        const res  = await fetch(`/api/pacientes?action=get&id=${pacienteIdParam}`)
        if (!res.ok) return
        const data = await res.json()
        if (data && typeof data === "object" && !Array.isArray(data)) {
          setPatient(data as Paciente)
          setQuery(getPacNome(data as Paciente))
        }
      } catch (e) { console.error("[copiloto] erro ao carregar paciente da URL:", e) }
    })()
  }, [pacienteIdParam])

  // ── Patient search ───────────────────────────────────────────────────────────

  const searchPatients = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDrop(false); return }
    setSearching(true)
    try {
      const res  = await fetch(`/api/pacientes?action=search&nome=${encodeURIComponent(q)}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setResults(list)
      setShowDrop(list.length > 0)
    } catch { setResults([]) }
    setSearching(false)
  }, [])

  const handleQuery = (v: string) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchPatients(v), 400)
  }

  const fetchMemoriaPadrao = useCallback(async (paciente_nome: string) => {
    setMemoriaChips([])
    setLoadingMemoria(true)
    try {
      const res  = await fetch("/api/copiloto/memoria-padrao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paciente_nome }),
      })
      const data = await res.json() as { chips?: { tipo: string; texto: string }[] }
      setMemoriaChips(data.chips ?? [])
    } catch (e) { console.error("[copiloto] memoria:", e) }
    finally { setLoadingMemoria(false) }
  }, [])

  const selectPatient = (p: Paciente) => {
    setPatient(p); setQuery(getPacNome(p)); setShowDrop(false); setResults([])
    fetchMemoriaPadrao(getPacNome(p))
  }
  const clearPatient = () => {
    setPatient(null); setQuery(""); setResults([]); setShowDrop(false)
    setMemoriaChips([]); setLoadingMemoria(false)
  }

  // ── Generate ─────────────────────────────────────────────────────────────────

  const gerar = async () => {
    if (!relato.trim()) return
    setPhase("loading")
    setGenError("")
    setResult(null)

    try {
      const res = await fetch("/api/copiloto?action=gerar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relato,
          dados:        dados || undefined,
          tipoConsulta,
          nomePaciente: patient ? getPacNome(patient) : undefined,
          protocoloId:  protocoloId ?? undefined,
        }),
      })

      const ct = res.headers.get("content-type") ?? ""
      if (!ct.includes("application/json")) {
        const txt = await res.text()
        throw new Error(`Resposta inesperada (${res.status}): ${txt.slice(0, 120)}`)
      }

      const data = await res.json() as CopilotoResult
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setResult(data)
      setPhase("done")
      fetchHistorico()
      // Fire-and-forget: fetch CID suggestions based on resumo
      if (data.resumo) {
        setCids([])
        setLoadingCids(true)
        fetch("/api/copiloto/sugerir-cid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumo: data.resumo, plano: data.plano }),
        })
          .then(r => r.json())
          .then((d: { cids?: { codigo: string; descricao: string; justificativa: string }[] }) => setCids(d.cids ?? []))
          .catch(() => {})
          .finally(() => setLoadingCids(false))
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e))
      setPhase("idle")
    }
  }

  // ── Send prontuário to MedX ──────────────────────────────────────────────────

  const enviarMedx = async () => {
    const prontuarioTexto = prontuarioBlocos && Object.keys(editedProntuario).length > 0
      ? prontuarioBlocos.map(b => `${b.label.toUpperCase()}:\n${editedProntuario[b.key] ?? b.content}`).join('\n\n')
      : result?.prontuario ?? ''
    if (!prontuarioTexto) return
    const idPaciente = patient ? getPacId(patient) : ""
    if (!idPaciente) { showToast("Selecione um paciente para enviar ao MedX.", "error"); return }
    setSendingMedx(true)
    try {
      const res  = await fetch("/api/copiloto?action=prontuario", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prontuario: prontuarioTexto, idPaciente }),
      })
      const data = await res.json()
      if (!res.ok || (data as { error?: string }).error)
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
      showToast("Prontuário enviado ao MedX com sucesso!")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao enviar para MedX", "error")
    } finally { setSendingMedx(false) }
  }

  // ── Send WhatsApp follow-up ──────────────────────────────────────────────────

  async function enviarWhatsApp(msg: string, dia: "d1" | "d7" | "d30") {
    const tel = patient ? getPacTel(patient) : ""
    if (!tel) { showToast("Selecione um paciente com telefone para enviar.", "error"); return }
    setSendingWA(prev => ({ ...prev, [dia]: true }))
    try {
      const res = await fetch("/api/zapi/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "55" + tel.replace(/\D/g, ""), message: msg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Erro ao enviar")
      showToast(`Mensagem ${dia.replace("d", "D+")} enviada via WhatsApp!`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao enviar", "error")
    } finally {
      setSendingWA(prev => ({ ...prev, [dia]: false }))
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  const novaConsulta = () => {
    setRelato(""); setDados(""); setTipoConsulta("Primeira consulta"); setProtocoloId(null)
    setResult(null); setGenError(""); setPhase("idle")
    setEditedResumo(""); setEditedPlano(""); setEditedOrientacoes("")
    setCheckedExames(new Set()); setSendingWA({ d1: false, d7: false, d30: false })
    setProntuarioBlocos(null); setEditedProntuario({})
    setCids([]); setLoadingCids(false)
  }

  // ── Document generator (carta / atestado) ───────────────────────────────────

  const openDocumento = async (tipo: "carta" | "atestado") => {
    if (!result?.resumo) return
    setDocModal({ tipo, texto: "", loading: true })
    try {
      const res  = await fetch("/api/copiloto/documento", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          tipo,
          resumo:       editedResumo || result.resumo,
          plano:        editedPlano  || result.plano,
          nomePaciente: patient ? getPacNome(patient) : undefined,
        }),
      })
      const data = await res.json() as { texto?: string; error?: string }
      setDocModal({ tipo, texto: data.texto ?? "", loading: false })
    } catch {
      setDocModal({ tipo, texto: "", loading: false })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const historicoFiltrado = patient
    ? historico.filter(e => e.paciente_nome === getPacNome(patient))
    : historico

  return (
    <div className="animate-fade-in">
      {focusMode ? (
        /* ── Mini-header em modo foco ────────────────────────────────────── */
        <header
          className="flex items-center gap-3 px-4 md:px-8 border-b border-border sticky top-0 z-30 backdrop-blur-sm"
          style={{ height: 60, background: "var(--topbar-bg)" }}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span
              className="w-2 h-2 rounded-full bg-accent flex-shrink-0 animate-pulse"
            />
            <span className="text-[14px] font-semibold text-text-primary truncate">
              {patient ? getPacNome(patient) : "Modo Consulta"}
            </span>
            <span className="hidden sm:block text-[9px] font-mono border border-accent-border text-accent px-2 py-0.5 rounded-full bg-accent-dim">
              EM ATENDIMENTO
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[16px] font-mono font-semibold text-accent tabular-nums">
              {fmtTimer(timerSecs)}
            </span>
            <button
              onClick={() => {
                if (result !== null) {
                  setConsultDuration(timerSecs)
                  setShowPostModal(true)
                }
                setFocusMode(false)
              }}
              className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair do Foco</span>
            </button>
          </div>
        </header>
      ) : (
        /* ── TopBar normal ───────────────────────────────────────────────── */
        <TopBar
          title="Copiloto de Consulta"
          subtitle="ALA CLÍNICA · ASSISTÊNCIA IA"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFocusMode(true)}
                className="flex items-center gap-1.5 text-[11px] bg-accent-dim border border-accent-border text-accent font-semibold rounded-lg px-3 py-1.5 hover:opacity-80 transition-all"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Iniciar Consulta</span>
              </button>
              <button
                onClick={() => setShowHistorico(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] border rounded-lg px-3 py-1.5 transition-colors",
                  showHistorico
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "border-border text-text-secondary hover:border-border-hover"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Histórico</span>
                {historico.length > 0 && (
                  <span className="text-[9px] font-mono bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                    {historico.length}
                  </span>
                )}
              </button>
              {phase === "done" && (
                <button
                  onClick={novaConsulta}
                  className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nova</span>
                </button>
              )}
            </div>
          }
        />
      )}

      {/* History panel — full-width strip below TopBar */}
      {showHistorico && (
        <div className="border-b border-border bg-surface">
          {loadingHistorico ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
            </div>
          ) : historicoFiltrado.length === 0 ? (
            <div className="px-6 py-5 text-[12px] text-text-muted text-center">
              {patient
                ? `Nenhuma consulta salva para ${getPacNome(patient)}.`
                : "Nenhuma consulta salva ainda. Gere a primeira!"}
            </div>
          ) : patient ? (
            /* Timeline view for selected patient */
            <div className="px-5 pt-3 pb-4 max-h-72 overflow-y-auto">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-3">
                Histórico · {getPacNome(patient)}
              </div>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-border pointer-events-none" />
                {historicoFiltrado.map(entry => (
                  <div key={entry.id} className="relative group">
                    <div className="absolute -left-[18px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500/30 border-2 border-blue-500/50" />
                    <div className="flex items-start gap-2">
                      <button onClick={() => loadFromHistorico(entry)} className="flex-1 text-left min-w-0">
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
                          {(entry.resultado?.resumo ?? entry.relato).slice(0, 180)}
                        </p>
                      </button>
                      <button
                        onClick={() => deleteHistorico(entry.id)}
                        disabled={deletingId === entry.id}
                        className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5"
                        aria-label="Excluir"
                      >
                        {deletingId === entry.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Flat list when no patient selected */
            <div className="divide-y divide-border max-h-56 overflow-y-auto">
              {historicoFiltrado.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3 hover:bg-surface-2 transition-colors group">
                  <button
                    onClick={() => loadFromHistorico(entry)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.paciente_nome && (
                        <span className="text-[12px] font-semibold text-text-primary truncate">
                          {entry.paciente_nome}
                        </span>
                      )}
                      {entry.tipo_consulta && (
                        <span className="text-[9px] font-mono text-text-muted bg-surface-2 border border-border px-1.5 py-0.5 rounded">
                          {entry.tipo_consulta}
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-text-muted ml-auto flex-shrink-0">
                        {fmtDate(entry.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {entry.relato.slice(0, 90)}{entry.relato.length > 90 ? "…" : ""}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteHistorico(entry.id)}
                    disabled={deletingId === entry.id}
                    className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5"
                    aria-label="Excluir"
                  >
                    {deletingId === entry.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex flex-col md:grid md:grid-cols-[2fr_3fr] min-h-[calc(100vh-60px)]">

        {/* ── LEFT: Briefing ────────────────────────────────────────────────── */}
        <div className="border-b md:border-b-0 md:border-r border-border p-5 md:p-8 md:overflow-y-auto md:sticky md:top-[60px] md:max-h-[calc(100vh-60px)]">
          <div className="pb-24 md:pb-0 space-y-5">

            <div>
              <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
                Briefing da Consulta
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                Preencha os dados para gerar a documentação clínica completa.
              </p>
            </div>

            {/* Patient search */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Paciente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                {searching
                  ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted animate-spin" />
                  : query
                    ? <button onClick={clearPatient} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    : null
                }
                <input
                  value={query}
                  onChange={e => handleQuery(e.target.value)}
                  onFocus={() => results.length > 0 && setShowDrop(true)}
                  placeholder="Buscar paciente pelo nome..."
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-9 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
                />
                {showDrop && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-52 overflow-y-auto">
                    {results.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => selectPatient(p)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors text-left border-b border-border last:border-b-0"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400 flex-shrink-0">
                          {initials(getPacNome(p))}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-text-primary truncate">{getPacNome(p)}</div>
                          {getPacTel(p) && (
                            <div className="text-[10px] text-text-muted flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />{getPacTel(p)}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {patient && (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-blue-500/10 border border-blue-500/25 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[9px] font-bold text-blue-400 flex-shrink-0">
                    {initials(getPacNome(patient))}
                  </div>
                  <span className="text-[12px] text-blue-400 font-medium truncate flex-1">{getPacNome(patient)}</span>
                  {getPacId(patient) && (
                    <span className="text-[9px] font-mono text-blue-400/60">#{getPacId(patient)}</span>
                  )}
                  <button
                    onClick={() => router.push("/pacientes")}
                    className="text-[10px] text-blue-400/70 hover:text-blue-400 transition-colors"
                  >
                    <User className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Tipo de consulta */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Tipo de Consulta</label>
              <div className="flex gap-1.5 flex-wrap">
                {TIPOS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTipoConsulta(t)}
                    className={cn(
                      "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                      tipoConsulta === t
                        ? "bg-blue-500/12 border-blue-500/30 text-blue-400 font-medium"
                        : "border-border text-text-muted hover:text-text-secondary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Relato */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                  Relato da Consulta *
                </label>
                <div className="flex items-center gap-2">
                  {isTranscribing && (
                    <span className="text-[10px] text-blue-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> transcrevendo...
                    </span>
                  )}
                  {hasMediaRecorder ? (
                    <button
                      type="button"
                      onClick={handleMicClick}
                      disabled={isTranscribing || isRecordingDados}
                      title={isRecording ? "Parar gravação" : "Gravar relato por voz"}
                      className={cn(
                        "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                        isRecording
                          ? "bg-red-500/15 border-red-500/40 text-red-400 animate-pulse"
                          : "border-border text-text-muted hover:border-blue-500/30 hover:text-blue-400 disabled:opacity-40"
                      )}
                    >
                      {isRecording
                        ? <><MicOff className="w-3 h-3" /> Parar</>
                        : <><Mic className="w-3 h-3" /> Gravar</>}
                    </button>
                  ) : voiceConsent !== null && (
                    <span
                      title="Gravação de voz não disponível neste navegador"
                      className="text-text-muted"
                    >
                      <MicOff className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
              <textarea
                value={relato}
                onChange={e => setRelato(e.target.value)}
                rows={6}
                placeholder="Descreva as queixas do paciente, exame físico, hipóteses diagnósticas, conduta discutida..."
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors leading-relaxed"
              />
            </div>

            {/* Protocolo */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Protocolo Clínico</label>
              <select
                value={protocoloId ?? ""}
                onChange={e => setProtocoloId(e.target.value || null)}
                disabled={protocolosLoading || protocolosList.length === 0}
                className="w-full rounded-xl px-3 py-2.5 text-[12px] text-text-primary bg-card border border-border outline-none focus:border-accent/40 transition-colors appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {protocolosLoading ? (
                  <option value="">Carregando protocolos…</option>
                ) : protocolosList.length === 0 ? (
                  <option value="">Nenhum protocolo cadastrado</option>
                ) : (
                  <>
                    <option value="">Nenhum — usar protocolos favoritos (padrão)</option>
                    {protocolosList.map(p => (
                      <option key={p.id} value={p.id}>{p.titulo}</option>
                    ))}
                  </>
                )}
              </select>
              {!protocolosLoading && protocolosList.length === 0 && (
                <a href="/memoria" className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                  Criar protocolos em Memória Clínica →
                </a>
              )}
            </div>

            {/* Dados objetivos */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Dados Objetivos</label>
                <div className="flex items-center gap-2">
                  {isTranscribingDados && (
                    <span className="text-[10px] text-blue-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> transcrevendo...
                    </span>
                  )}
                  {hasMediaRecorder ? (
                    <button
                      type="button"
                      onClick={handleMicDadosClick}
                      disabled={isTranscribingDados || isRecording}
                      title={isRecordingDados ? "Parar gravação" : "Gravar dados objetivos por voz"}
                      className={cn(
                        "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                        isRecordingDados
                          ? "bg-red-500/15 border-red-500/40 text-red-400 animate-pulse"
                          : "border-border text-text-muted hover:border-blue-500/30 hover:text-blue-400 disabled:opacity-40"
                      )}
                    >
                      {isRecordingDados
                        ? <><MicOff className="w-3 h-3" /> Parar</>
                        : <><Mic className="w-3 h-3" /> Gravar</>}
                    </button>
                  ) : voiceConsent !== null && (
                    <span title="Gravação de voz não disponível neste navegador" className="text-text-muted">
                      <MicOff className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
              <textarea
                value={dados}
                onChange={e => setDados(e.target.value)}
                rows={4}
                placeholder="Sinais vitais, resultados de exames, medicamentos atuais, alergias, peso/altura..."
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors leading-relaxed"
              />

              {/* Memória clínica proativa */}
              {(loadingMemoria || memoriaChips.length > 0) && (
                <div className="space-y-2 animate-fade-in mt-2">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-3 h-3 text-accent" />
                    <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">
                      {loadingMemoria ? "Buscando padrões..." : "Padrões dos atendimentos anteriores"}
                    </span>
                    {loadingMemoria && <Loader2 className="w-3 h-3 text-accent animate-spin" />}
                  </div>
                  {!loadingMemoria && (
                    <div className="flex flex-wrap gap-2">
                      {memoriaChips.map((chip, i) => {
                        const style = {
                          exame:       "bg-blue-500/10 border-blue-500/25 text-blue-400",
                          medicamento: "bg-green-500/10 border-green-500/25 text-green-400",
                          diagnostico: "bg-amber-500/10 border-amber-500/25 text-amber-400",
                        }[chip.tipo] ?? "bg-surface border-border text-text-secondary"
                        return (
                          <button key={i}
                            onClick={() => setDados(prev => prev ? prev + "\n" + chip.texto : chip.texto)}
                            className={cn("flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all hover:opacity-80", style)}
                          >
                            <Plus className="w-2.5 h-2.5 flex-shrink-0" />
                            {chip.texto}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {genError && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{genError}</span>
              </div>
            )}

            {/* Desktop submit */}
            <div className="hidden md:block space-y-2">
              <button
                onClick={gerar}
                disabled={phase === "loading" || !relato.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 text-[13px] font-semibold rounded-xl py-3 transition-all",
                  phase === "loading"
                    ? "bg-blue-500/10 border border-blue-500/30 text-blue-400 cursor-wait"
                    : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
                )}
              >
                {phase === "loading"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando com IA...</>
                  : <><Sparkles className="w-4 h-4" /> Gerar Copiloto</>}
              </button>
              {phase === "done" && (
                <button
                  onClick={novaConsulta}
                  className="w-full flex items-center justify-center gap-2 text-[12px] text-text-muted border border-border rounded-xl py-2.5 hover:border-border-hover hover:text-text-secondary transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Nova Consulta
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Output ─────────────────────────────────────────────────── */}
        <div className={cn("p-5 md:p-8 md:overflow-y-auto", phase === "done" && "pb-28 md:pb-8")}>
          {phase === "idle" && !result && <RightPanelEmpty />}
          {phase === "loading" && <Skeleton />}

          {phase === "done" && result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                  Documentação Gerada{patient && ` · ${getPacNome(patient)}`}
                </span>
                <button
                  onClick={gerar}
                  className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-blue-400 border border-border hover:border-blue-500/30 rounded-lg px-2.5 py-1 transition-all"
                >
                  <RefreshCw className="w-3 h-3" /> Re-gerar
                </button>
              </div>

              {/* 1. Resumo Clínico — editable */}
              {result.resumo && (
                <SectionCard
                  title="Resumo Clínico"
                  icon={FileText}
                  iconColor="text-blue-400"
                  extra={<CopyBtn text={editedResumo} />}
                >
                  <AutoTextarea value={editedResumo} onChange={setEditedResumo} />
                </SectionCard>
              )}

              {/* CIDs Sugeridos */}
              {(loadingCids || cids.length > 0) && (
                <div className="border border-border rounded-xl p-4 bg-surface/40 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest">CID-10 Sugeridos</span>
                    {loadingCids && <Loader2 className="w-3 h-3 animate-spin text-text-muted ml-1" />}
                  </div>
                  {cids.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cids.map((c, i) => (
                        <button
                          key={c.codigo}
                          title={c.justificativa}
                          onClick={() => {
                            navigator.clipboard.writeText(c.codigo).then(() => {
                              setCopiedCid(c.codigo)
                              setTimeout(() => setCopiedCid(null), 2000)
                            })
                          }}
                          className={cn(
                            "flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1.5 rounded-lg border transition-all",
                            i === 0 ? "bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20"
                                    : "bg-surface border-border text-text-secondary hover:border-border-hover"
                          )}
                        >
                          {copiedCid === c.codigo
                            ? <Check className="w-3 h-3 flex-shrink-0 text-accent" />
                            : <Copy className="w-3 h-3 flex-shrink-0 opacity-50" />}
                          <span>{c.codigo}</span>
                          <span className="text-[10px] font-sans font-normal opacity-75 hidden sm:inline">{c.descricao}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Plano Terapêutico — editable */}
              {result.plano && (
                <SectionCard
                  title="Plano Terapêutico"
                  icon={Stethoscope}
                  iconColor="text-blue-400"
                  extra={<CopyBtn text={editedPlano} />}
                >
                  <AutoTextarea value={editedPlano} onChange={setEditedPlano} />
                </SectionCard>
              )}

              {/* 3. Exames Solicitados — checklist */}
              {result.exames_solicitados && result.exames_solicitados.length > 0 && (
                <SectionCard
                  title="Exames Solicitados"
                  icon={FlaskConical}
                  iconColor="text-purple-400"
                  extra={<CopyBtn text={result.exames_solicitados.join("\n")} />}
                >
                  <div className="space-y-1.5">
                    {result.exames_solicitados.map((exame, i) => (
                      <label
                        key={i}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                          checkedExames.has(i)
                            ? "bg-surface-2 border-border opacity-50"
                            : "bg-background border-border hover:border-purple-500/30"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checkedExames.has(i)}
                          onChange={e => {
                            setCheckedExames(prev => {
                              const next = new Set(prev)
                              e.target.checked ? next.add(i) : next.delete(i)
                              return next
                            })
                          }}
                          className="w-3.5 h-3.5 accent-purple-500 flex-shrink-0"
                        />
                        <span className={cn(
                          "text-[12px] transition-colors",
                          checkedExames.has(i) ? "text-text-muted line-through" : "text-text-secondary"
                        )}>
                          {exame}
                        </span>
                      </label>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* 4. Orientações — editable */}
              {result.orientacoes && (
                <SectionCard
                  title="Orientações ao Paciente"
                  icon={BookOpen}
                  iconColor="text-emerald-400"
                  defaultOpen={false}
                  extra={<CopyBtn text={editedOrientacoes} />}
                >
                  <AutoTextarea value={editedOrientacoes} onChange={setEditedOrientacoes} />
                </SectionCard>
              )}

              {/* 5. Follow-up — 3 cards individuais */}
              {result.followup && (() => {
                const messages = parseFollowup(result.followup)
                if (!messages) return null
                return (
                  <SectionCard
                    title="Mensagens de Follow-up"
                    icon={MessageCircle}
                    iconColor="text-amber-400"
                    defaultOpen={false}
                  >
                    <div className="space-y-3">
                      {(["d1", "d7", "d30"] as const).map(dia => {
                        const msg  = messages[dia]
                        if (!msg) return null
                        const meta = FOLLOWUP_META[dia]
                        return (
                          <div key={dia} className={cn("rounded-xl border p-4 space-y-3", meta.bg)}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className={cn("text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border", meta.badge)}>
                                {meta.label}
                              </span>
                              <div className="flex gap-1.5">
                                <CopyBtn text={msg} />
                                <button
                                  onClick={() => enviarWhatsApp(msg, dia)}
                                  disabled={sendingWA[dia]}
                                  className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all disabled:opacity-60"
                                >
                                  {sendingWA[dia]
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Send className="w-3 h-3" />}
                                  WhatsApp
                                </button>
                              </div>
                            </div>
                            <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{msg}</p>
                          </div>
                        )
                      })}
                    </div>
                  </SectionCard>
                )
              })()}

              {/* 6. Sugestão de Conteúdo */}
              {result.conteudo && (
                <SectionCard
                  title="Sugestão de Conteúdo"
                  icon={Sparkles}
                  iconColor="text-purple-400"
                  defaultOpen={false}
                  extra={<CopyBtn text={result.conteudo} />}
                >
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{result.conteudo}</p>
                </SectionCard>
              )}

              {/* ── Ações rápidas pós-prontuário ──────────────────────── */}
              <div className="border border-border rounded-xl p-4 bg-surface/40 space-y-2">
                <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Próximos passos</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      icon: Pill, label: "Prescrever",
                      onClick: () => {
                        const id = patient ? getPacId(patient) : ""
                        router.push(id ? `/prescricao?pacienteId=${id}` : "/prescricao")
                      },
                      cls: "text-green-400 bg-green-500/10 border-green-500/25 hover:bg-green-500/20",
                    },
                    {
                      icon: FlaskConical, label: "Interpretar exames",
                      onClick: () => router.push("/interpretacao-exames"),
                      cls: "text-violet-400 bg-violet-500/10 border-violet-500/25 hover:bg-violet-500/20",
                    },
                    {
                      icon: Mail, label: "Gerar carta ao paciente",
                      onClick: () => {
                        const params = new URLSearchParams()
                        if (relato)            params.set("relato", relato.slice(0, 2000))
                        if (dados)             params.set("dados", dados.slice(0, 1000))
                        if (patient)           params.set("nomePaciente", getPacNome(patient))
                        if (tipoConsulta)      params.set("tipoConsulta", tipoConsulta)
                        router.push(`/conversa?${params.toString()}`)
                      },
                      cls: "text-accent bg-accent-dim border-accent-border hover:bg-accent/20",
                    },
                    {
                      icon: CalendarDays, label: "Agendar retorno",
                      onClick: () => router.push("/agenda"),
                      cls: "text-blue-400 bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/20",
                    },
                    {
                      icon: FileText, label: "Carta de encaminhamento",
                      onClick: () => openDocumento("carta"),
                      cls: "text-amber-400 bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/20",
                    },
                    {
                      icon: ClipboardList, label: "Gerar atestado",
                      onClick: () => openDocumento("atestado"),
                      cls: "text-text-secondary bg-surface border-border hover:border-border-hover",
                    },
                  ].map(a => (
                    <button key={a.label} onClick={a.onClick}
                      className={cn("flex items-center gap-1.5 text-[11px] font-semibold px-3 py-2.5 sm:py-1.5 rounded-lg border transition-all min-h-[44px] sm:min-h-0", a.cls)}>
                      <a.icon className="w-3 h-3 flex-shrink-0" />
                      {a.label}
                      <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Prontuário */}
              {result.prontuario && (
                <SectionCard
                  title="Prontuário Gerado"
                  icon={ClipboardList}
                  iconColor="text-blue-400"
                  extra={
                    <div className="flex gap-2 flex-wrap">
                      <CopyBtn text={
                        prontuarioBlocos && Object.keys(editedProntuario).length > 0
                          ? prontuarioBlocos.map(b => `${b.label.toUpperCase()}:\n${editedProntuario[b.key] ?? b.content}`).join('\n\n')
                          : result.prontuario
                      } />
                      <button
                        onClick={enviarMedx}
                        disabled={sendingMedx}
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                          sendingMedx
                            ? "border-blue-500/30 text-blue-400 bg-blue-500/10 cursor-wait"
                            : "border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
                        )}
                      >
                        {sendingMedx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        {sendingMedx ? "Enviando..." : "Enviar para MedX"}
                      </button>
                    </div>
                  }
                >
                  {prontuarioBlocos ? (
                    <div className="space-y-3">
                      {prontuarioBlocos.map(bloco => {
                        const Icon      = getProntuarioIcon(bloco.key)
                        const section   = PRONTUARIO_SECTIONS.find(s => s.key === bloco.key)
                        const iconColor = section?.iconColor ?? "text-blue-400"
                        return (
                          <div key={bloco.key} className="border border-border rounded-lg overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-surface-2 border-b border-border">
                              <Icon className={cn("w-3 h-3 flex-shrink-0", iconColor)} />
                              <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-widest">
                                {bloco.label}
                              </span>
                            </div>
                            <AutoTextarea
                              value={editedProntuario[bloco.key] ?? bloco.content}
                              onChange={v => setEditedProntuario(prev => ({ ...prev, [bloco.key]: v }))}
                              className="px-4 py-3"
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <textarea
                      readOnly
                      value={result.prontuario}
                      rows={14}
                      onClick={e => (e.target as HTMLTextAreaElement).select()}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-[11px] text-text-secondary leading-relaxed font-mono resize-y outline-none cursor-text"
                    />
                  )}
                </SectionCard>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky submit */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-sm border-t border-border px-4 py-3 space-y-2">
        <button
          onClick={gerar}
          disabled={phase === "loading" || !relato.trim()}
          className={cn(
            "w-full flex items-center justify-center gap-2 text-[13px] font-semibold rounded-xl py-3 transition-all",
            phase === "loading"
              ? "bg-blue-500/10 border border-blue-500/30 text-blue-400 cursor-wait"
              : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
          )}
        >
          {phase === "loading"
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando com IA...</>
            : <><Sparkles className="w-4 h-4" /> Gerar Copiloto</>}
        </button>
        {phase === "done" && (
          <button
            onClick={novaConsulta}
            className="w-full flex items-center justify-center gap-2 text-[12px] text-text-muted border border-border rounded-xl py-2 hover:border-border-hover transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Nova Consulta
          </button>
        )}
      </div>

      {/* Voice consent modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-text-primary">Autorizar gravação de voz</h3>
                <p className="text-[11px] text-text-muted">Consentimento LGPD — leia antes de prosseguir</p>
              </div>
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Sua fala será enviada ao serviço{" "}
              <strong className="text-text-primary">Groq Whisper</strong> para transcrição automática.
              O áudio <strong className="text-text-primary">não é armazenado</strong> — somente o texto
              transcrito é utilizado como relato da consulta.
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Você pode revogar este consentimento a qualquer momento nas Configurações do perfil.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 text-[12px] py-2 rounded-xl border border-border text-text-muted hover:border-border-hover transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={aceitarConsentimento}
                className="flex-1 text-[12px] py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
              >
                Autorizar e gravar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pós-consulta modal ─────────────────────────────────────────────── */}
      {showPostModal && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">

            {/* Header */}
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[15px] font-semibold text-text-primary">Consulta finalizada</h3>
                <Button variant="secondary" size="sm" onClick={() => setShowPostModal(false)} className="w-7 h-7 p-0 border-0 hover:bg-surface-2" aria-label="Fechar">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[11px] text-text-muted font-mono">
                {patient ? getPacNome(patient) : "Paciente"} · {fmtTimer(consultDuration)}
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">O que fazer agora?</p>

              {/* ① WhatsApp D+1 */}
              {(() => {
                const msgs = parseFollowup(result?.followup)
                if (!msgs?.d1) return null
                return (
                  <button
                    onClick={() => { enviarWhatsApp(msgs.d1, "d1"); setShowPostModal(false) }}
                    className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 transition-all"
                  >
                    <Send className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold">Enviar mensagem D+1</p>
                      <p className="text-[10px] text-emerald-400/70">WhatsApp automático de acompanhamento</p>
                    </div>
                  </button>
                )
              })()}

              {/* ② Gerar carta ao paciente */}
              <button
                onClick={() => {
                  const params = new URLSearchParams()
                  if (relato)       params.set("relato", relato.slice(0, 2000))
                  if (dados)        params.set("dados", dados.slice(0, 1000))
                  if (patient)      params.set("nomePaciente", getPacNome(patient))
                  if (tipoConsulta) params.set("tipoConsulta", tipoConsulta)
                  router.push(`/conversa?${params.toString()}`)
                  setShowPostModal(false)
                }}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-all"
              >
                <Mail className="w-4 h-4 flex-shrink-0 text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">Gerar carta ao paciente</p>
                  <p className="text-[10px] text-text-muted">Texto personalizado com resumo da consulta</p>
                </div>
              </button>

              {/* ③ Prescrever */}
              <button
                onClick={() => {
                  const id = patient ? getPacId(patient) : ""
                  router.push(id ? `/prescricao?pacienteId=${id}` : "/prescricao")
                  setShowPostModal(false)
                }}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-all"
              >
                <Pill className="w-4 h-4 flex-shrink-0 text-green-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">Prescrever</p>
                  <p className="text-[10px] text-text-muted">Abrir prescrição assistida</p>
                </div>
              </button>

              {/* ④ Criar carrossel */}
              <button
                onClick={() => {
                  router.push(`/carrossel?tema=${encodeURIComponent(tipoConsulta)}`)
                  setShowPostModal(false)
                }}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-all"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0 text-purple-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">Criar carrossel</p>
                  <p className="text-[10px] text-text-muted truncate">Tema: {tipoConsulta}</p>
                </div>
              </button>

              {/* ⑤ Agendar retorno */}
              <button
                onClick={() => {
                  const id   = patient ? getPacId(patient) : ""
                  const nome = patient ? encodeURIComponent(getPacNome(patient)) : ""
                  router.push(id ? `/agenda?pacienteId=${id}&pacienteNome=${nome}` : "/agenda")
                  setShowPostModal(false)
                }}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-all"
              >
                <CalendarDays className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">Agendar retorno</p>
                  <p className="text-[10px] text-text-muted">
                    {patient ? `${getPacNome(patient)} pré-preenchido` : "Abrir agenda"}
                  </p>
                </div>
              </button>

              {/* ⑥a Encaminhar para nutrição */}
              <button
                onClick={() => {
                  const id = patient ? getPacId(patient) : ""
                  router.push(id ? `/nutricao-pacientes?pacienteId=${id}` : "/nutricao-pacientes")
                  setShowPostModal(false)
                }}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-all"
              >
                <Salad className="w-4 h-4 flex-shrink-0 text-green-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">Encaminhar para nutrição</p>
                  <p className="text-[10px] text-text-muted">Abrir acompanhamento nutricional</p>
                </div>
              </button>

              {/* ⑥b Solicitar NPS */}
              <button
                onClick={() => { router.push("/nps"); setShowPostModal(false) }}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-all"
              >
                <Star className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">Solicitar avaliação</p>
                  <p className="text-[10px] text-text-muted">Enviar pesquisa de satisfação NPS</p>
                </div>
              </button>

              {/* ⑥c Programa de indicações */}
              <button
                onClick={() => { router.push("/indicacoes"); setShowPostModal(false) }}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-all"
              >
                <UserPlus className="w-4 h-4 flex-shrink-0 text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold">Programa de indicações</p>
                  <p className="text-[10px] text-text-muted">Convidar paciente a indicar amigos</p>
                </div>
              </button>

              {/* ⑦ Copiar lista de exames */}
              {result?.exames_solicitados && result.exames_solicitados.length > 0 && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result!.exames_solicitados!.join("\n"))
                    showToast("Lista de exames copiada!")
                    setShowPostModal(false)
                  }}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-all"
                >
                  <FlaskConical className="w-4 h-4 flex-shrink-0 text-violet-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold">Copiar exames solicitados</p>
                    <p className="text-[10px] text-text-muted">
                      {result.exames_solicitados.length} exame{result.exames_solicitados.length !== 1 ? "s" : ""} na lista
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-border">
              <button
                onClick={() => { setShowPostModal(false); router.push("/dashboard") }}
                className="w-full text-[12px] text-text-muted hover:text-text-secondary transition-colors py-1"
              >
                Fechar e ir ao início
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* ── Documento Modal (carta / atestado) ─────────────────────────────── */}
      {docModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-[14px] font-semibold text-text-primary">
                  {docModal.tipo === "carta" ? "Carta de Encaminhamento" : "Atestado Médico"}
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setDocModal(null)} className="w-7 h-7 p-0 border-0 hover:bg-surface-2" aria-label="Fechar">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {docModal.loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  <p className="text-[12px] text-text-muted">
                    {docModal.tipo === "carta" ? "Gerando carta de encaminhamento..." : "Gerando atestado..."}
                  </p>
                </div>
              ) : (
                <textarea
                  value={docModal.texto}
                  onChange={e => setDocModal(m => m ? { ...m, texto: e.target.value } : null)}
                  rows={20}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-[12px] text-text-primary leading-relaxed font-mono resize-y outline-none focus:border-blue-500/40 transition-colors"
                />
              )}
            </div>

            {!docModal.loading && docModal.texto && (
              <div className="flex items-center gap-2 px-5 py-4 border-t border-border flex-shrink-0">
                <Button variant="primary" size="sm" onClick={() => { navigator.clipboard.writeText(docModal.texto); showToast("Documento copiado!") }} leftIcon={Copy} className="py-2 px-4">
                  Copiar documento
                </Button>
                <Button variant="secondary-medium" size="sm" onClick={() => { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<html><head><title>${docModal.tipo === "carta" ? "Carta de Encaminhamento" : "Atestado"}</title><style>body{font-family:Arial,sans-serif;font-size:13px;line-height:1.7;margin:60px 80px;white-space:pre-wrap}</style></head><body>${docModal.texto}</body></html>`); w.document.close(); w.print() }} leftIcon={ArrowRight} className="px-4 py-2">
                  Imprimir
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Export with Suspense (required for useSearchParams) ───────────────────────

export default function CopilotoPage() {
  return (
    <Suspense fallback={
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 px-8 border-b border-border sticky top-0 z-30 h-[60px]"
          style={{ background: "var(--topbar-bg)" }}>
          <div className="h-4 w-48 rounded bg-surface-2 shimmer" />
        </div>
        <div className="p-4 md:p-8 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-surface border border-border shimmer" />)}
        </div>
      </div>
    }>
      <CopilotoContent />
    </Suspense>
  )
}
