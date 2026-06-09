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
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Paciente {
  Id?: string | number; id?: string | number
  IdContato?: string | number; idContato?: string | number
  Nome?: string; nome?: string; nomeCompleto?: string
  Celular?: string; celular?: string; Telefone?: string; telefone?: string
  [key: string]: unknown
}

interface CopilotoResult {
  resumo?:      string
  plano?:       string
  orientacoes?: string
  followup?:    string
  conteudo?:    string
  prontuario?:  string
  error?:       string
}

type Phase = "idle" | "loading" | "done"

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

const TIPOS = ["Primeira consulta", "Retorno", "Urgência", "Teleconsulta"]

// ── Section card ──────────────────────────────────────────────────────────────

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
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-2 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", iconColor)} />
          <span
            className="text-[13px] font-semibold text-text-primary"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {title}
          </span>
        </div>
        {open
          ? <ChevronUp   className="w-3.5 h-3.5 text-text-muted" />
          : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
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

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }}
      className={cn(
        "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border transition-all",
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {[200, 160, 140, 120].map((w, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded bg-surface-2 shimmer" />
            <div className={`h-4 rounded bg-surface-2 shimmer`} style={{ width: w }} />
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

// ── Empty state for right panel ───────────────────────────────────────────────

function RightPanelEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        <Bot className="w-8 h-8 text-blue-400" />
      </div>
      <div>
        <h3
          className="text-[16px] font-semibold text-text-primary"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Copiloto pronto
        </h3>
        <p className="text-[12px] text-text-muted mt-2 leading-relaxed max-w-xs">
          Preencha o briefing da consulta ao lado e clique em{" "}
          <span className="text-blue-400 font-medium">Gerar Copiloto</span>{" "}
          para receber o resumo clínico, plano terapêutico, orientações e prontuário.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {[
          "📋 Resumo Clínico",
          "🗺 Plano Terapêutico",
          "📝 Orientações ao Paciente",
          "💬 Mensagens de Follow-up",
          "📱 Sugestão de Conteúdo",
          "📄 Prontuário Gerado",
        ].map(s => (
          <div key={s} className="text-[11px] text-text-muted bg-surface border border-border rounded-lg px-3 py-2 text-left">
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main content (needs useSearchParams → Suspense wrapper) ───────────────────

function CopilotoContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const pacienteIdParam = searchParams.get("pacienteId") ?? ""

  // Patient state
  const [query,     setQuery]     = useState("")
  const [results,   setResults]   = useState<Paciente[]>([])
  const [searching, setSearching] = useState(false)
  const [patient,   setPatient]   = useState<Paciente | null>(null)
  const [showDrop,  setShowDrop]  = useState(false)
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form
  const [relato,        setRelato]        = useState("")
  const [dados,         setDados]         = useState("")
  const [tipoConsulta,  setTipoConsulta]  = useState("Primeira consulta")

  // Output
  const [phase,     setPhase]     = useState<Phase>("idle")
  const [result,    setResult]    = useState<CopilotoResult | null>(null)
  const [genError,  setGenError]  = useState("")

  // Prontuário → MedX
  const [sendingMedx, setSendingMedx] = useState(false)
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null)

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load patient from URL param ───────────────────────────────────────────

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

  // ── Patient search ────────────────────────────────────────────────────────

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
    setPatient(p)
    setQuery(getPacNome(p))
    setShowDrop(false)
    setResults([])
  }

  const clearPatient = () => {
    setPatient(null)
    setQuery("")
    setResults([])
    setShowDrop(false)
  }

  // ── Generate ──────────────────────────────────────────────────────────────

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
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e))
      setPhase("idle")
    }
  }

  // ── Send prontuário to MedX ───────────────────────────────────────────────

  const enviarMedx = async () => {
    if (!result?.prontuario) return
    const idPaciente = patient ? getPacId(patient) : ""
    if (!idPaciente) {
      showToast("Selecione um paciente para enviar ao MedX.", "error")
      return
    }
    setSendingMedx(true)
    try {
      const res = await fetch("/api/copiloto?action=prontuario", {
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
    } finally {
      setSendingMedx(false)
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  const novaConsulta = () => {
    setRelato("")
    setDados("")
    setTipoConsulta("Primeira consulta")
    setResult(null)
    setGenError("")
    setPhase("idle")
    // keep patient selected — common to do multiple consultations for same patient
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Copiloto de Consulta"
        subtitle="ALA CLÍNICA · ASSISTÊNCIA IA"
        actions={
          phase === "done" ? (
            <button
              onClick={novaConsulta}
              className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Consulta
            </button>
          ) : undefined
        }
      />

      {/* Two-panel layout */}
      <div className="flex flex-col md:grid md:grid-cols-[2fr_3fr] min-h-[calc(100vh-60px)]">

        {/* ── LEFT: Briefing ─────────────────────────────────────────────────── */}
        <div className="border-b md:border-b-0 md:border-r border-border p-5 md:p-8 space-y-5 md:overflow-y-auto md:sticky md:top-[60px] md:max-h-[calc(100vh-60px)]">

          <div>
            <h2
              className="text-[15px] font-semibold text-text-primary"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
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
                  ? <button
                      onClick={clearPatient}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
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
                            <Phone className="w-2.5 h-2.5" />
                            {getPacTel(p)}
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
                <span className="text-[12px] text-blue-400 font-medium truncate flex-1">
                  {getPacNome(patient)}
                </span>
                {getPacId(patient) && (
                  <span className="text-[9px] font-mono text-blue-400/60">#{getPacId(patient)}</span>
                )}
                <button
                  onClick={() => router.push(`/pacientes`)}
                  className="text-[10px] text-blue-400/70 hover:text-blue-400 transition-colors flex items-center gap-1"
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

          {/* Relato da consulta */}
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
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Dados Objetivos
            </label>
            <textarea
              value={dados}
              onChange={e => setDados(e.target.value)}
              rows={4}
              placeholder="Sinais vitais, resultados de exames laboratoriais, medicamentos atuais, alergias, peso/altura..."
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors leading-relaxed"
            />
          </div>

          {genError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{genError}</span>
            </div>
          )}

          {/* Submit */}
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
            {phase === "loading" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando com IA...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Gerar Copiloto</>
            )}
          </button>

          {phase === "done" && (
            <button
              onClick={novaConsulta}
              className="w-full flex items-center justify-center gap-2 text-[12px] text-text-muted border border-border rounded-xl py-2.5 hover:border-border-hover hover:text-text-secondary transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nova Consulta
            </button>
          )}
        </div>

        {/* ── RIGHT: Output ───────────────────────────────────────────────────── */}
        <div className="p-5 md:p-8 md:overflow-y-auto">

          {phase === "idle" && !result && <RightPanelEmpty />}

          {phase === "loading" && <Skeleton />}

          {phase === "done" && result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                  Documentação Gerada
                  {patient && ` · ${getPacNome(patient)}`}
                </span>
                <button
                  onClick={gerar}
                  className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-blue-400 border border-border hover:border-blue-500/30 rounded-lg px-2.5 py-1 transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-gerar
                </button>
              </div>

              {/* 1. Resumo Clínico */}
              {result.resumo && (
                <SectionCard
                  title="Resumo Clínico"
                  icon={FileText}
                  iconColor="text-blue-400"
                  extra={<CopyBtn text={result.resumo} />}
                >
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">
                    {result.resumo}
                  </p>
                </SectionCard>
              )}

              {/* 2. Plano Terapêutico */}
              {result.plano && (
                <SectionCard
                  title="Plano Terapêutico"
                  icon={Stethoscope}
                  iconColor="text-blue-400"
                  extra={<CopyBtn text={result.plano} />}
                >
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">
                    {result.plano}
                  </p>
                </SectionCard>
              )}

              {/* 3. Orientações ao Paciente */}
              {result.orientacoes && (
                <SectionCard
                  title="Orientações ao Paciente"
                  icon={BookOpen}
                  iconColor="text-emerald-400"
                  defaultOpen={false}
                  extra={<CopyBtn text={result.orientacoes} />}
                >
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">
                    {result.orientacoes}
                  </p>
                </SectionCard>
              )}

              {/* 4. Mensagens de Follow-up */}
              {result.followup && (
                <SectionCard
                  title="Mensagens de Follow-up"
                  icon={MessageCircle}
                  iconColor="text-amber-400"
                  defaultOpen={false}
                  extra={<CopyBtn text={result.followup} />}
                >
                  <div className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">
                    {result.followup}
                  </div>
                </SectionCard>
              )}

              {/* 5. Sugestão de Conteúdo */}
              {result.conteudo && (
                <SectionCard
                  title="Sugestão de Conteúdo"
                  icon={Sparkles}
                  iconColor="text-purple-400"
                  defaultOpen={false}
                  extra={<CopyBtn text={result.conteudo} />}
                >
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">
                    {result.conteudo}
                  </p>
                </SectionCard>
              )}

              {/* 6. Prontuário — destaque */}
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
                        {sendingMedx
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Send className="w-3 h-3" />}
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

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

// ── Default export with Suspense (required for useSearchParams) ───────────────

export default function CopilotoPage() {
  return (
    <Suspense fallback={
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 px-8 border-b border-border sticky top-0 z-30 h-[60px]"
          style={{ background: "var(--topbar-bg)" }}>
          <div className="h-4 w-48 rounded bg-surface-2 shimmer" />
        </div>
        <div className="p-8 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-surface border border-border shimmer" />)}
        </div>
      </div>
    }>
      <CopilotoContent />
    </Suspense>
  )
}
