"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Search, Mic, Square, Send, Copy, Check,
  ChevronDown, ChevronUp, Loader2, X,
  User, Phone, FileText, Stethoscope, ClipboardList, Sparkles,
} from "lucide-react"

// ── SpeechRecognition type shim ───────────────────────────────────────────────
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvt extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult:  ((e: SpeechRecognitionEvt) => void) | null
  onerror:   ((e: Event) => void) | null
  onend:     (() => void) | null
}

function getSpeechRec(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null
  const w = window as Window & {
    SpeechRecognition?:       new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Paciente {
  Id?: string | number; id?: string | number
  IdContato?: string | number; idContato?: string | number
  Nome?: string; nome?: string; nomeCompleto?: string
  Celular?: string; celular?: string; telefone?: string
  [key: string]: unknown
}

interface AnalysisResult {
  resumo?: {
    resumo?: string
    hipoteses?: string[]
    exames?: { exame: string; justificativa: string }[]
  }
  planoAlimentar?: {
    orientacoes?: string
    recomendados?: string[]
    restritos?: string[]
  }
  orientacoesPaciente?: {
    texto?: string
    pontosChave?: string[]
  }
  mensagensAdesao?: { dia: string; texto: string }[]
  prontuario?: string
  error?: string
}

type Phase = "idle" | "recording" | "analyzing" | "done"

function getId(p: Paciente): string {
  return String(p.Id ?? p.id ?? p.IdContato ?? p.idContato ?? "")
}
function getNome(p: Paciente): string {
  return String(p.Nome ?? p.nome ?? p.nomeCompleto ?? "—")
}
function getTel(p: Paciente): string {
  return String(p.Celular ?? p.celular ?? p.telefone ?? "")
}
function initials(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

// ── Timer hook ────────────────────────────────────────────────────────────────
function useTimer(active: boolean): string {
  const [secs, setSecs] = useState(0)
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (active) {
      setSecs(0)
      ivRef.current = setInterval(() => setSecs(s => s + 1), 1000)
    } else {
      if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null }
    }
    return () => { if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null } }
  }, [active])

  const mm = String(Math.floor(secs / 60)).padStart(2, "0")
  const ss = String(secs % 60).padStart(2, "0")
  return `${mm}:${ss}`
}

// ── Collapsible card ──────────────────────────────────────────────────────────
function Card({ title, icon: Icon, accent = false, defaultOpen = true, children }: {
  title: string
  icon: React.ElementType
  accent?: boolean
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn("bg-card border rounded-xl overflow-hidden", accent ? "border-accent-border" : "border-border")}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-2 transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", accent ? "text-accent" : "text-text-muted")} />
          <span className="text-[12.5px] font-semibold text-text-primary">{title}</span>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
          : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  )
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600) }}
      className={cn("flex items-center gap-1.5 text-[10px] text-text-muted hover:text-accent transition-colors px-2 py-1 rounded border border-border hover:border-accent-border", className)}>
      {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CopilotoPage() {
  // Patient search
  const [query, setQuery]         = useState("")
  const [results, setResults]     = useState<Paciente[]>([])
  const [searching, setSearching] = useState(false)
  const [patient, setPatient]     = useState<Paciente | null>(null)
  const [showDrop, setShowDrop]   = useState(false)
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Recording
  const [phase, setPhase]         = useState<Phase>("idle")
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim]     = useState("")
  const [micError, setMicError]   = useState("")
  const recogRef                  = useRef<SpeechRecognitionInstance | null>(null)
  // Refs avoid stale closures when finalizing mid-recognition
  const transcriptRef             = useRef("")
  const interimRef                = useRef("")
  const timer                     = useTimer(phase === "recording")

  // Analysis
  const [analysis, setAnalysis]   = useState<AnalysisResult | null>(null)
  const [analysisErr, setAnalysisErr] = useState("")

  // MedX send
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)

  // Keep refs in sync with state
  useEffect(() => { transcriptRef.current = transcript }, [transcript])
  useEffect(() => { interimRef.current    = interim    }, [interim])

  // ── Patient search ──────────────────────────────────────────────────────────
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
    setQuery(getNome(p))
    setShowDrop(false)
    setTranscript(""); transcriptRef.current = ""
    setInterim("");    interimRef.current    = ""
    setAnalysis(null); setPhase("idle"); setSent(false)
  }

  const clearPatient = () => {
    setQuery(""); setPatient(null); setResults([]); setShowDrop(false)
  }

  // ── Recording ───────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setMicError("")
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setMicError("Permissão de microfone negada. Libere o acesso nas configurações do navegador.")
      return
    }

    const SpeechRec = getSpeechRec()
    if (!SpeechRec) {
      setMicError("Seu navegador não suporta reconhecimento de voz. Use Google Chrome ou Microsoft Edge.")
      return
    }

    const recog = new SpeechRec()
    recog.continuous     = true
    recog.interimResults = true
    recog.lang           = "pt-BR"

    let finalAccum = ""

    recog.onresult = (e: SpeechRecognitionEvt) => {
      let interimChunk = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) {
          finalAccum += r[0].transcript + " "
          setTranscript(finalAccum)
          transcriptRef.current = finalAccum
          setInterim("")
          interimRef.current = ""
        } else {
          interimChunk += r[0].transcript
        }
      }
      if (interimChunk) {
        setInterim(interimChunk)
        interimRef.current = interimChunk
      }
    }

    recog.onerror = () => { /* minor errors — recognition auto-continues */ }

    recog.onend = () => {
      // Auto-restart only if still recording (ref not nulled)
      if (recogRef.current === recog) {
        try { recog.start() } catch { /* browser throttled */ }
      }
    }

    recog.start()
    recogRef.current = recog
    setPhase("recording")
    setTranscript(""); transcriptRef.current = ""
    setInterim("");    interimRef.current    = ""
    setAnalysis(null); setSent(false)
  }

  const stopRecognition = () => {
    if (recogRef.current) {
      const r = recogRef.current
      recogRef.current = null   // null first → prevents auto-restart in onend
      r.stop()
    }
    setInterim(""); interimRef.current = ""
  }

  // ── Analysis ─────────────────────────────────────────────────────────────────
  const runAnalysis = useCallback(async (text: string) => {
    if (!text.trim()) { setPhase("idle"); return }
    setPhase("analyzing")
    setAnalysisErr("")
    setAnalysis(null)
    setSent(false)

    try {
      const res = await fetch("/api/copiloto", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao:    text,
          nomePaciente: patient ? getNome(patient) : undefined,
          idCliente:    patient ? getId(patient)   : undefined,
        }),
      })
      const data = await res.json() as AnalysisResult
      if (data.error) throw new Error(data.error)
      setAnalysis(data)
      setPhase("done")
    } catch (e) {
      setAnalysisErr(e instanceof Error ? e.message : String(e))
      setPhase("idle")
    }
  }, [patient])

  const finalizarConsulta = () => {
    // Capture refs before stopping (avoids stale state closure)
    const finalText = (transcriptRef.current + " " + interimRef.current).trim()
    stopRecognition()
    if (finalText) {
      setTranscript(finalText)
      transcriptRef.current = finalText
    }
    runAnalysis(finalText)
  }

  // ── Send to MedX ─────────────────────────────────────────────────────────────
  const sendToMedx = async () => {
    if (!analysis?.prontuario || !patient) return
    setSending(true)
    try {
      const res = await fetch("/api/copiloto?action=prontuario", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: analysis.prontuario, idCliente: getId(patient) }),
      })
      if (res.ok) setSent(true)
    } catch { /* button remains enabled */ }
    setSending(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      <TopBar title="Copiloto de Consulta" subtitle="ALA CLÍNICA · GRAVAÇÃO + IA" />

      <div className="p-4 md:p-8 space-y-5 max-w-3xl">

        {/* ── Patient search ─────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Paciente</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            {searching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted animate-spin" />
            )}
            <input
              value={query}
              onChange={e => handleQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowDrop(true)}
              placeholder="Buscar paciente pelo nome..."
              disabled={phase === "recording" || phase === "analyzing"}
              className="w-full bg-surface border border-border rounded-xl pl-10 pr-10 py-3 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors disabled:opacity-50"
            />
            {query && phase === "idle" && (
              <button onClick={clearPatient}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {showDrop && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-56 overflow-y-auto">
                {results.map((p, i) => (
                  <button key={i} onClick={() => selectPatient(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left">
                    <div className="w-7 h-7 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center text-[10px] font-bold text-accent flex-shrink-0">
                      {initials(getNome(p))}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-text-primary truncate">{getNome(p)}</div>
                      {getTel(p) && (
                        <div className="text-[10px] text-text-muted flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" /> {getTel(p)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {patient && (
            <div className="flex items-center gap-2 px-3 py-2 bg-accent-dim border border-accent-border rounded-lg">
              <User className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="text-[12px] text-accent font-medium">{getNome(patient)}</span>
              {getTel(patient) && (
                <span className="text-[11px] text-text-muted flex items-center gap-1 ml-auto">
                  <Phone className="w-3 h-3" /> {getTel(patient)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Recording panel ────────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">

          {/* Controls row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {phase === "recording" ? (
                <>
                  <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="absolute w-full h-full rounded-full bg-red-400/40 animate-ping" />
                    <span className="relative w-4 h-4 rounded-full bg-red-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-red-400 tracking-widest">GRAVANDO</div>
                    <div className="text-[14px] font-mono text-text-secondary tabular-nums">{timer}</div>
                  </div>
                </>
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
                  <Mic className="w-4 h-4 text-text-muted" />
                </div>
              )}
              {phase !== "recording" && (
                <span className="text-[12px] text-text-muted">
                  {phase === "idle"      && (transcript ? "Consulta pronta para análise" : "Pronto para iniciar")}
                  {phase === "analyzing" && "Analisando com IA..."}
                  {phase === "done"      && "Análise concluída"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {phase === "idle" && (
                <button onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-[12px] font-semibold hover:bg-red-500/20 transition-colors">
                  <Mic className="w-3.5 h-3.5" /> Iniciar Consulta
                </button>
              )}
              {phase === "recording" && (
                <button onClick={finalizarConsulta}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-dim border border-accent-border text-accent rounded-lg text-[12px] font-semibold hover:bg-accent/20 transition-colors">
                  <Square className="w-3.5 h-3.5 fill-current" /> Finalizar Consulta
                </button>
              )}
              {phase === "analyzing" && (
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border text-text-muted rounded-lg text-[12px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando...
                </div>
              )}
              {phase === "done" && (
                <button onClick={startRecording}
                  className="flex items-center gap-2 px-3 py-1.5 border border-border text-text-muted rounded-lg text-[11px] hover:text-text-secondary hover:border-border-hover transition-colors">
                  <Mic className="w-3 h-3" /> Nova consulta
                </button>
              )}
            </div>
          </div>

          {micError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-[12px]">
              {micError}
            </div>
          )}

          {/* Live transcript during recording */}
          {phase === "recording" && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Transcrição em Tempo Real</span>
              <div className="bg-background border border-border rounded-lg p-4 min-h-[120px] max-h-56 overflow-y-auto text-[13px] leading-relaxed">
                <span className="text-text-primary">{transcript}</span>
                <span className="text-text-muted italic">{interim}</span>
                {!transcript && !interim && (
                  <span className="text-text-muted italic">Aguardando fala...</span>
                )}
              </div>
            </div>
          )}

          {/* Editable transcript when stopped */}
          {(phase === "idle" || phase === "done") && transcript && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Transcrição</span>
                <CopyBtn text={transcript} />
              </div>
              <textarea
                value={transcript}
                onChange={e => { setTranscript(e.target.value); transcriptRef.current = e.target.value }}
                rows={6}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-[13px] text-text-primary outline-none focus:border-accent/40 resize-y leading-relaxed"
              />
              {phase === "idle" && (
                <button onClick={() => runAnalysis(transcript)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-dim border border-accent-border text-accent rounded-lg text-[12px] font-semibold hover:bg-accent/20 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" /> Analisar com IA
                </button>
              )}
            </div>
          )}

          {analysisErr && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-[12px]">
              {analysisErr}
            </div>
          )}
        </div>

        {/* ── Analysis results ───────────────────────────────────────────────── */}
        {analysis && phase === "done" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Análise da Consulta</span>
              <button onClick={() => runAnalysis(transcript)}
                className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-accent border border-border hover:border-accent-border rounded-lg px-2.5 py-1 transition-colors">
                <Sparkles className="w-3 h-3" /> Re-analisar
              </button>
            </div>

            {/* Resumo clínico */}
            {analysis.resumo && (
              <Card title="Resumo Clínico e Hipóteses" icon={FileText} accent>
                {analysis.resumo.resumo && (
                  <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
                    {analysis.resumo.resumo}
                  </p>
                )}
                {(analysis.resumo.hipoteses ?? []).length > 0 && (
                  <div className="mb-4">
                    <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-2.5">Hipóteses Diagnósticas</div>
                    <ol className="space-y-1.5">
                      {(analysis.resumo.hipoteses ?? []).map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-text-secondary">
                          <span className="text-accent font-bold tabular-nums flex-shrink-0">{i + 1}.</span>
                          {h}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {(analysis.resumo.exames ?? []).length > 0 && (
                  <div>
                    <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-2.5">Exames Sugeridos</div>
                    <div className="space-y-2">
                      {(analysis.resumo.exames ?? []).map((ex, i) => (
                        <div key={i} className="bg-background border border-border rounded-lg px-3 py-2.5">
                          <div className="text-[12px] font-semibold text-text-primary">{ex.exame}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">{ex.justificativa}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Conduta */}
            {analysis.planoAlimentar && (
              <Card title="Conduta e Orientações Nutricionais" icon={Stethoscope} defaultOpen={false}>
                {analysis.planoAlimentar.orientacoes && (
                  <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
                    {analysis.planoAlimentar.orientacoes}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(analysis.planoAlimentar.recomendados ?? []).length > 0 && (
                    <div>
                      <div className="text-[9px] font-mono text-emerald-400 tracking-widest uppercase mb-2">Recomendados</div>
                      <ul className="space-y-1">
                        {(analysis.planoAlimentar.recomendados ?? []).map((r, i) => (
                          <li key={i} className="text-[11px] text-text-secondary flex items-start gap-1.5">
                            <span className="text-emerald-400 flex-shrink-0">+</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(analysis.planoAlimentar.restritos ?? []).length > 0 && (
                    <div>
                      <div className="text-[9px] font-mono text-red-400 tracking-widest uppercase mb-2">Restritos</div>
                      <ul className="space-y-1">
                        {(analysis.planoAlimentar.restritos ?? []).map((r, i) => (
                          <li key={i} className="text-[11px] text-text-secondary flex items-start gap-1.5">
                            <span className="text-red-400 flex-shrink-0">−</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Orientações ao paciente */}
            {analysis.orientacoesPaciente && (
              <Card title="Orientações ao Paciente" icon={User} defaultOpen={false}>
                {analysis.orientacoesPaciente.texto && (
                  <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
                    {analysis.orientacoesPaciente.texto}
                  </p>
                )}
                {(analysis.orientacoesPaciente.pontosChave ?? []).length > 0 && (
                  <ul className="space-y-2">
                    {(analysis.orientacoesPaciente.pontosChave ?? []).map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-text-secondary">
                        <span className="text-accent flex-shrink-0 font-bold">→</span> {p}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {/* Mensagens de adesão */}
            {(analysis.mensagensAdesao ?? []).length > 0 && (
              <Card title="Mensagens de Adesão (WhatsApp)" icon={Sparkles} defaultOpen={false}>
                <div className="space-y-3">
                  {(analysis.mensagensAdesao ?? []).map((m, i) => (
                    <div key={i} className="bg-background border border-border rounded-lg p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono text-accent tracking-widest uppercase">{m.dia}</span>
                        <CopyBtn text={m.texto} />
                      </div>
                      <p className="text-[12px] text-text-secondary leading-relaxed">{m.texto}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Prontuário MedX */}
            {analysis.prontuario && (
              <Card title="Texto para Prontuário MedX" icon={ClipboardList} accent>
                <div className="space-y-3">
                  <div className="flex items-center justify-end">
                    <CopyBtn text={analysis.prontuario} />
                  </div>
                  <div className="bg-background border border-border rounded-lg p-4 text-[12px] text-text-secondary leading-loose whitespace-pre-wrap font-mono max-h-72 overflow-y-auto">
                    {analysis.prontuario}
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={sendToMedx}
                      disabled={sending || sent || !patient}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-colors",
                        sent
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : "bg-accent-dim border border-accent-border text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      )}
                    >
                      {sending
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                        : sent
                          ? <><Check className="w-3.5 h-3.5" /> Enviado ao MedX</>
                          : <><Send className="w-3.5 h-3.5" /> Enviar para MedX</>}
                    </button>
                    {!patient && (
                      <span className="text-[11px] text-text-muted">Selecione um paciente para enviar</span>
                    )}
                    {sent && (
                      <span className="text-[11px] text-emerald-400">Prontuário registrado com sucesso.</span>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
