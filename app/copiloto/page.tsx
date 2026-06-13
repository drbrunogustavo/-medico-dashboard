"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { Toast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  Search, Loader2, X, User, Phone,
  FileText, Stethoscope, BookOpen, MessageCircle, Sparkles, ClipboardList,
  Copy, Check, Bot, RefreshCw, Plus,
  AlertCircle, ChevronDown, ChevronUp, Send,
  Clock, Trash2, FlaskConical,
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
  const [sendingMedx, setSendingMedx] = useState(false)

  // History
  const [historico,        setHistorico]        = useState<HistoricoEntry[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [showHistorico,    setShowHistorico]    = useState(false)
  const [deletingId,       setDeletingId]       = useState<string | null>(null)

  // Toast
  const [toast,     setToast]     = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const toastTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  async function deleteHistorico(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/copiloto?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setHistorico(prev => prev.filter(e => e.id !== id))
      showToast("Consulta removida do histórico")
    } catch {
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
      } catch { /* non-critical */ }
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

  const selectPatient = (p: Paciente) => {
    setPatient(p); setQuery(getPacNome(p)); setShowDrop(false); setResults([])
  }
  const clearPatient = () => {
    setPatient(null); setQuery(""); setResults([]); setShowDrop(false)
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
      fetchHistorico() // refresh history after save
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e))
      setPhase("idle")
    }
  }

  // ── Send prontuário to MedX ──────────────────────────────────────────────────

  const enviarMedx = async () => {
    if (!result?.prontuario) return
    const idPaciente = patient ? getPacId(patient) : ""
    if (!idPaciente) { showToast("Selecione um paciente para enviar ao MedX.", "error"); return }
    setSendingMedx(true)
    try {
      const res  = await fetch("/api/copiloto?action=prontuario", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prontuario: result.prontuario, idPaciente }),
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
    setRelato(""); setDados(""); setTipoConsulta("Primeira consulta")
    setResult(null); setGenError(""); setPhase("idle")
    setEditedResumo(""); setEditedPlano(""); setEditedOrientacoes("")
    setCheckedExames(new Set()); setSendingWA({ d1: false, d7: false, d30: false })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Copiloto de Consulta"
        subtitle="ALA CLÍNICA · ASSISTÊNCIA IA"
        actions={
          <div className="flex items-center gap-2">
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

      {/* History panel — full-width strip below TopBar */}
      {showHistorico && (
        <div className="border-b border-border bg-surface">
          {loadingHistorico ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
            </div>
          ) : historico.length === 0 ? (
            <div className="px-6 py-5 text-[12px] text-text-muted text-center">
              Nenhuma consulta salva ainda. Gere a primeira!
            </div>
          ) : (
            <div className="divide-y divide-border max-h-56 overflow-y-auto">
              {historico.map(entry => (
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
                    className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5"
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
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                Relato da Consulta *
              </label>
              <textarea
                value={relato}
                onChange={e => setRelato(e.target.value)}
                rows={6}
                placeholder="Descreva as queixas do paciente, exame físico, hipóteses diagnósticas, conduta discutida..."
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors leading-relaxed"
              />
            </div>

            {/* Dados objetivos */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Dados Objetivos</label>
              <textarea
                value={dados}
                onChange={e => setDados(e.target.value)}
                rows={4}
                placeholder="Sinais vitais, resultados de exames, medicamentos atuais, alergias, peso/altura..."
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors leading-relaxed"
              />
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
        <div className="p-5 md:p-8 md:overflow-y-auto">
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

              {/* 7. Prontuário */}
              {result.prontuario && (
                <SectionCard
                  title="Prontuário Gerado"
                  icon={ClipboardList}
                  iconColor="text-blue-400"
                  extra={
                    <div className="flex gap-2 flex-wrap">
                      <CopyBtn text={result.prontuario} />
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
                  <textarea
                    readOnly
                    value={result.prontuario}
                    rows={14}
                    onClick={e => (e.target as HTMLTextAreaElement).select()}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-[11px] text-text-secondary leading-relaxed font-mono resize-y outline-none cursor-text"
                  />
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

      {toast && <Toast message={toast.msg} type={toast.type} />}
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
