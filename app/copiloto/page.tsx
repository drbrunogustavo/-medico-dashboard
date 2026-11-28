"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAppContext } from "@/components/AppProvider"
import { Toast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import { Check, Clock, Copy, Mic, Plus, Search, Send, Stethoscope } from "lucide-react"
import {
  CopyButton, Field, PageHeader, Panel, PxButton, PxCheckbox, PxInput, PxModal, PxSelect, Segmented, Tag,
} from "@/components/px"

/* ── Tipos ─────────────────────────────────────────────────────────────── */

interface Paciente {
  Id?: string | number; id?: string | number
  IdContato?: string | number; idContato?: string | number
  Nome?: string; nome?: string; nomeCompleto?: string
  Celular?: string; celular?: string; Telefone?: string; telefone?: string
  [key: string]: unknown
}

interface FollowupMessages { d1: string; d7: string; d30: string }

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

interface Cid { codigo: string; descricao: string; justificativa: string }
interface Chip { tipo: string; texto: string }

type Phase = "idle" | "loading" | "done"
type Dia = "d1" | "d7" | "d30"

/* ── Auxiliares ────────────────────────────────────────────────────────── */

function getPacId(p: Paciente): string { return String(p.Id ?? p.id ?? p.IdContato ?? p.idContato ?? "") }
function getPacNome(p: Paciente): string { return String(p.Nome ?? p.nome ?? p.nomeCompleto ?? "Sem nome") }
function getPacTel(p: Paciente): string { return String(p.Celular ?? p.celular ?? p.Telefone ?? p.telefone ?? "") }

function fmtDate(s: string) {
  if (!s) return "-"
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return "-"
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function fmtDateLong(s: string) {
  if (!s) return "-"
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return "-"
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
  return `${String(d.getDate()).padStart(2, "0")} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

function fmtTimer(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const mm = String(m).padStart(2, "0"), ss = String(s).padStart(2, "0")
  return h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`
}

function parseFollowup(f?: string | FollowupMessages): FollowupMessages | null {
  if (!f) return null
  if (typeof f === "object" && "d1" in f) return f as FollowupMessages
  const s = String(f)
  const d1m  = s.match(/D\+1[^:]*[:：]?\s*([\s\S]+?)(?=\s*D\+7|\s*D\+30|$)/i)
  const d7m  = s.match(/D\+7[^:]*[:：]?\s*([\s\S]+?)(?=\s*D\+30|$)/i)
  const d30m = s.match(/D\+30[^:]*[:：]?\s*([\s\S]+?)$/i)
  if (d1m || d7m || d30m) return { d1: d1m?.[1].trim() ?? "", d7: d7m?.[1].trim() ?? "", d30: d30m?.[1].trim() ?? "" }
  return { d1: s, d7: "", d30: "" }
}

/** Telefone para o envio: só dígitos, com o 55 do Brasil quando ele ainda não está lá. */
function foneParaEnvio(tel: string): string {
  const d = tel.replace(/\D/g, "")
  return d.length <= 11 ? "55" + d : d
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Erros 4xx trazem uma mensagem pensada para o usuário (limite do plano, campo faltando). O resto vira texto genérico. */
function msgDoServidor(status: number, data: unknown, padrao: string): string {
  const e = (data as { error?: unknown } | null)?.error
  return status >= 400 && status < 500 && typeof e === "string" && e.trim() ? e : padrao
}

/* ── Prontuário ────────────────────────────────────────────────────────── */

interface ProntuarioBloco { key: string; label: string; content: string }

const PRONTUARIO_SECTIONS = [
  { key: "queixa",       label: "Queixa principal",         patterns: ["QUEIXA PRINCIPAL"] },
  { key: "hda",          label: "História da doença atual", patterns: ["HISTÓRIA DA DOENÇA ATUAL", "HISTORIA DA DOENÇA ATUAL", "HDA"] },
  { key: "antecedentes", label: "Antecedentes",             patterns: ["ANTECEDENTES"] },
  { key: "exame",        label: "Exame físico",             patterns: ["EXAME FÍSICO", "EXAME FISICO"] },
  { key: "hipoteses",    label: "Hipótese diagnóstica",     patterns: ["HIPÓTESES DIAGNÓSTICAS", "HIPOTESES DIAGNOSTICAS", "HIPÓTESE DIAGNÓSTICA", "HIPOTESE DIAGNOSTICA"] },
  { key: "conduta",      label: "Plano e conduta",          patterns: ["CONDUTA", "PLANO TERAPÊUTICO", "PLANO TERAPEUTICO", "PLANO"] },
  { key: "orientacoes",  label: "Orientações",              patterns: ["ORIENTAÇÕES", "ORIENTACOES"] },
  { key: "retorno",      label: "Retorno",                  patterns: ["RETORNO"] },
]

function parseProntuario(text: string): ProntuarioBloco[] | null {
  if (!text?.trim()) return null
  const lines = text.split("\n")
  const found: Array<{ lineIdx: number; sectionKey: string; label: string }> = []
  for (let i = 0; i < lines.length; i++) {
    const clean = lines[i].replace(/:\s*$/, "").trim()
    const section = PRONTUARIO_SECTIONS.find(s => s.patterns.some(p => p.toUpperCase() === clean.toUpperCase()))
    if (section) found.push({ lineIdx: i, sectionKey: section.key, label: section.label })
  }
  if (found.length < 3) return null
  return found.map((curr, i) => {
    const nextLine = i < found.length - 1 ? found[i + 1].lineIdx : lines.length
    return { key: curr.sectionKey, label: curr.label, content: lines.slice(curr.lineIdx + 1, nextLine).join("\n").trim() }
  })
}

const TIPOS = ["Nova consulta", "Retorno", "Primeira consulta", "Urgência", "Teleconsulta"].map(t => ({ value: t, label: t }))

const textareaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
const erroBox = "rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger"

/* ── Gravação de voz ───────────────────────────────────────────────────── */

/** Grava pelo microfone, envia para transcrição e entrega o texto. Dois campos usam o mesmo mecanismo. */
function useGravador(onTexto: (t: string) => void, avisar: (msg: string, tipo?: "success" | "error") => void) {
  const [gravando, setGravando] = useState(false)
  const [transcrevendo, setTranscrevendo] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const onTextoRef = useRef(onTexto); onTextoRef.current = onTexto
  const avisarRef = useRef(avisar); avisarRef.current = avisar

  useEffect(() => {
    if (!gravando) { setSegundos(0); return }
    const t = setInterval(() => { if (document.visibilityState === "visible") setSegundos(s => s + 1) }, 1000)
    return () => clearInterval(t)
  }, [gravando])

  // Sair da página no meio da gravação desliga o microfone.
  useEffect(() => () => {
    const rec = recRef.current
    if (rec && rec.state !== "inactive") { rec.onstop = null; rec.stop(); rec.stream.getTracks().forEach(t => t.stop()) }
  }, [])

  async function transcrever(blob: Blob) {
    setTranscrevendo(true)
    try {
      const tipo = blob.type || "audio/webm"
      const form = new FormData()
      form.append("audio", blob, `gravacao.${tipo.includes("mp4") ? "mp4" : "webm"}`)
      const res = await fetch("/api/copiloto/transcricao", { method: "POST", body: form })
      const data = await res.json().catch(() => null) as { text?: string; error?: string } | null
      if (!res.ok || data?.error) throw new Error(msgDoServidor(res.status, data, "Falha na transcrição."))
      const texto = data?.text?.trim() ?? ""
      if (texto) onTextoRef.current(texto)
      avisarRef.current(texto ? "Transcrição concluída." : "Nenhuma fala foi reconhecida na gravação.")
    } catch (e) {
      avisarRef.current(e instanceof Error ? e.message : "Falha na transcrição.", "error")
    } finally { setTranscrevendo(false) }
  }

  async function iniciar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : ""
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        await transcrever(new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" }))
      }
      rec.start()
      recRef.current = rec
      setGravando(true)
    } catch {
      avisarRef.current("Não foi possível acessar o microfone.", "error")
    }
  }

  function parar() {
    recRef.current?.stop()
    setGravando(false)
  }

  return { gravando, transcrevendo, segundos, iniciar, parar }
}

/* ── Peças da página (fora do componente principal) ────────────────────── */

function Bloco({ titulo, aberto = true, extra, children }: { titulo: string; aberto?: boolean; extra?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(aberto)
  const id = "bloco-" + titulo.toLowerCase().replace(/\W+/g, "-")
  return (
    <Panel as="section" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(v => !v)} className="rounded text-left text-[15px] font-semibold text-px-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
          {titulo} <span className="ml-1 text-[12.5px] font-normal text-px-muted">{open ? "Recolher" : "Abrir"}</span>
        </button>
        {open ? extra : null}
      </div>
      {open && <div id={id} className="space-y-3">{children}</div>}
    </Panel>
  )
}

function AutoTextarea({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = el.scrollHeight + 2 + "px"
  }, [value])
  return <textarea ref={ref} aria-label={label} value={value} onChange={e => onChange(e.target.value)} rows={3} className={cn(textareaCls, "overflow-hidden")} />
}

function Esqueleto() {
  return (
    <div className="space-y-3" role="status" aria-label="Gerando a documentação">
      {[1, 2, 3].map(i => (
        <Panel key={i} className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-px-ink/10" />
          <div className="h-3 w-full animate-pulse rounded bg-px-ink/10" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-px-ink/10" />
        </Panel>
      ))}
    </div>
  )
}

function PainelVazio() {
  const itens = ["Resumo clínico", "Plano terapêutico", "Exames solicitados", "Orientações ao paciente", "Mensagens de acompanhamento em D+1, D+7 e D+30", "Sugestão de conteúdo", "Prontuário"]
  return (
    <div className="space-y-3 py-6">
      <h2 className="text-[16px] font-semibold text-px-ink">O que sai da geração</h2>
      <p className="max-w-md text-[13.5px] leading-relaxed text-px-muted">Preencha o relato ao lado e use Gerar documentação. O texto gerado é um rascunho para você revisar e editar antes de usar.</p>
      <ul className="list-inside list-disc space-y-1 text-[13.5px] text-px-ink">{itens.map(i => <li key={i}>{i}</li>)}</ul>
    </div>
  )
}

function ItemHistorico({ entry, mostrarPaciente, onAbrir, onExcluir }: {
  entry: HistoricoEntry; mostrarPaciente: boolean; onAbrir: () => void; onExcluir: () => Promise<void>
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const trecho = (entry.resultado?.resumo ?? entry.relato ?? "").slice(0, 160)
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded-px-card bg-white/70 px-4 py-3">
      <button type="button" onClick={onAbrir} className="min-w-0 flex-1 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-medium text-px-ink">{mostrarPaciente && entry.paciente_nome ? `${entry.paciente_nome}, ` : ""}{mostrarPaciente ? fmtDate(entry.created_at) : fmtDateLong(entry.created_at)}</span>
          {entry.tipo_consulta && <Tag tone="neutral">{entry.tipo_consulta}</Tag>}
        </span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-px-muted">{trecho}</span>
      </button>
      {confirmando ? (
        <span className="flex gap-2">
          <PxButton size="sm" variant="danger" loading={excluindo} onClick={async () => { setExcluindo(true); await onExcluir(); setExcluindo(false); setConfirmando(false) }}>Confirmar exclusão</PxButton>
          <PxButton size="sm" variant="quiet" disabled={excluindo} onClick={() => setConfirmando(false)}>Manter</PxButton>
        </span>
      ) : <PxButton size="sm" variant="quiet" aria-label={`Excluir consulta de ${fmtDateLong(entry.created_at)}`} onClick={() => setConfirmando(true)}>Excluir</PxButton>}
    </li>
  )
}

function CartaoFollowup({ dia, msg, podeEnviar, onEnviar }: { dia: Dia; msg: string; podeEnviar: boolean; onEnviar: () => Promise<boolean> }) {
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const rotulo = dia.replace("d", "D+")
  return (
    <div className="space-y-3 rounded-px-card bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tag tone="ink">{rotulo}</Tag>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={msg} />
          {confirmando ? (
            <>
              <PxButton size="sm" loading={enviando} leftIcon={Send} onClick={async () => { setEnviando(true); await onEnviar(); setEnviando(false); setConfirmando(false) }}>Confirmar envio</PxButton>
              <PxButton size="sm" variant="quiet" disabled={enviando} onClick={() => setConfirmando(false)}>Cancelar</PxButton>
            </>
          ) : <PxButton size="sm" variant="secondary" leftIcon={Send} disabled={!podeEnviar} onClick={() => setConfirmando(true)} aria-label={`Enviar ${rotulo} por WhatsApp`}>WhatsApp</PxButton>}
        </div>
      </div>
      <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink">{msg}</p>
      {!podeEnviar && <p className="text-[12px] text-px-muted">Para enviar, selecione um paciente com telefone cadastrado.</p>}
      {confirmando && <p className="text-[12px] text-px-muted">A mensagem será enviada agora ao paciente pelo WhatsApp.</p>}
    </div>
  )
}

function LinhaAcao({ titulo, detalhe, onClick }: { titulo: string; detalhe: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-px-card border border-px-line bg-white px-4 py-3 text-left transition-colors hover:bg-px-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
      <span className="block text-[13.5px] font-medium text-px-ink">{titulo}</span>
      <span className="block text-[12.5px] text-px-muted">{detalhe}</span>
    </button>
  )
}

/* ── Conteúdo ──────────────────────────────────────────────────────────── */

function CopilotoContent() {
  const appCtx          = useAppContext()
  const searchParams    = useSearchParams()
  const router          = useRouter()
  const pacienteIdParam = searchParams.get("pacienteId") ?? ""

  // Paciente
  const [query,     setQuery]     = useState("")
  const [results,   setResults]   = useState<Paciente[]>([])
  const [searching, setSearching] = useState(false)
  const [patient,   setPatient]   = useState<Paciente | null>(null)
  const [showDrop,  setShowDrop]  = useState(false)
  const [erroBusca, setErroBusca] = useState("")
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Formulário
  const [relato,       setRelato]       = useState("")
  const [dados,        setDados]        = useState("")
  const [tipoConsulta, setTipoConsulta] = useState("Primeira consulta")

  // Resultado
  const [phase,    setPhase]    = useState<Phase>("idle")
  const [result,   setResult]   = useState<CopilotoResult | null>(null)
  const [genError, setGenError] = useState("")

  const [editedResumo,      setEditedResumo]      = useState("")
  const [editedPlano,       setEditedPlano]       = useState("")
  const [editedOrientacoes, setEditedOrientacoes] = useState("")
  const [checkedExames,     setCheckedExames]     = useState<Set<number>>(new Set())

  // MedX
  const [sendingMedx,      setSendingMedx]      = useState(false)
  const [confirmandoMedx,  setConfirmandoMedx]  = useState(false)
  const [prontuarioBlocos, setProntuarioBlocos] = useState<ProntuarioBloco[] | null>(null)
  const [editedProntuario, setEditedProntuario] = useState<Record<string, string>>({})

  // Histórico
  const [historico,        setHistorico]        = useState<HistoricoEntry[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [erroHistorico,    setErroHistorico]    = useState("")
  const [showHistorico,    setShowHistorico]    = useState(false)

  // Aviso
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [memoriaChips,   setMemoriaChips]   = useState<Chip[]>([])
  const [loadingMemoria, setLoadingMemoria] = useState(false)
  const [cids,           setCids]           = useState<Cid[]>([])
  const [loadingCids,    setLoadingCids]    = useState(false)
  const [copiedCid,      setCopiedCid]      = useState<string | null>(null)
  const [docModal,       setDocModal]       = useState<{ tipo: "carta" | "atestado"; texto: string; loading: boolean; erro: string } | null>(null)

  // Protocolo
  const [protocoloId,       setProtocoloId]       = useState<string | null>(null)
  const [protocolosList,    setProtocolosList]    = useState<{ id: string; titulo: string }[]>([])
  const [protocolosLoading, setProtocolosLoading] = useState(true)

  // Voz
  const [voiceConsent,     setVoiceConsent]     = useState<boolean | null>(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [erroConsent,      setErroConsent]      = useState("")
  const [hasMediaRecorder, setHasMediaRecorder] = useState(false)
  // Qual campo recebeu o clique que abriu o aviso de consentimento: a gravação segue por ele.
  const campoPendenteRef = useRef<"relato" | "dados">("relato")

  // Modo consulta
  const [focusMode,       setFocusMode]       = useState(false)
  const [timerSecs,       setTimerSecs]       = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showPostModal,   setShowPostModal]   = useState(false)
  const [consultDuration, setConsultDuration] = useState(0)

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  const gravRelato = useGravador(t => setRelato(prev => prev ? prev + "\n" + t : t), showToast)
  const gravDados  = useGravador(t => setDados(prev => prev ? prev + "\n" + t : t), showToast)

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // Copia editável do texto gerado
  useEffect(() => {
    setEditedResumo(result?.resumo ?? "")
    setEditedPlano(result?.plano ?? "")
    setEditedOrientacoes(result?.orientacoes ?? "")
    setCheckedExames(new Set())
    setConfirmandoMedx(false)
    if (result?.prontuario) {
      const blocos = parseProntuario(result.prontuario)
      setProntuarioBlocos(blocos)
      if (blocos) {
        const map: Record<string, string> = {}
        blocos.forEach(b => { map[b.key] = b.content })
        setEditedProntuario(map)
      } else setEditedProntuario({})
    } else { setProntuarioBlocos(null); setEditedProntuario({}) }
  }, [result])

  const fetchHistorico = useCallback(async () => {
    setLoadingHistorico(true); setErroHistorico("")
    try {
      const res = await fetch("/api/copiloto")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setHistorico(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("[copiloto] histórico:", e)
      setErroHistorico("Não foi possível carregar o histórico.")
    } finally { setLoadingHistorico(false) }
  }, [])

  useEffect(() => { fetchHistorico() }, [fetchHistorico])

  useEffect(() => {
    fetch("/api/memoria?tipo=protocolo")
      .then(r => r.ok ? r.json() : [])
      .then((d: unknown) => setProtocolosList(Array.isArray(d) ? d as { id: string; titulo: string }[] : []))
      .catch(() => {})
      .finally(() => setProtocolosLoading(false))
  }, [])

  useEffect(() => {
    setHasMediaRecorder(typeof MediaRecorder !== "undefined" && !!navigator?.mediaDevices?.getUserMedia)
  }, [])

  useEffect(() => { setVoiceConsent(appCtx?.perfil?.voz_gravacao_autorizada ?? false) }, [appCtx?.perfil])

  // Modo consulta: esconde o menu e conta o tempo
  useEffect(() => {
    if (focusMode) {
      document.body.classList.add("consulta-focus")
      setTimerSecs(0)
      timerRef.current = setInterval(() => { if (document.visibilityState === "visible") setTimerSecs(s => s + 1) }, 1000)
    } else {
      document.body.classList.remove("consulta-focus")
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      document.body.classList.remove("consulta-focus")
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [focusMode])

  async function aceitarConsentimento() {
    setErroConsent("")
    const res = await fetch("/api/perfil", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voz_gravacao_autorizada: true }),
    }).catch(() => null)
    if (!res || !res.ok) { setErroConsent("Não foi possível registrar o consentimento. Tente de novo."); return }
    appCtx?.refetchPerfil()
    setVoiceConsent(true)
    setShowConsentModal(false)
    ;(campoPendenteRef.current === "dados" ? gravDados : gravRelato).iniciar()
  }

  function cliqueMic(campo: "relato" | "dados") {
    const g = campo === "dados" ? gravDados : gravRelato
    if (g.gravando) { g.parar(); return }
    if (!voiceConsent) { campoPendenteRef.current = campo; setErroConsent(""); setShowConsentModal(true); return }
    g.iniciar()
  }

  async function deleteHistorico(id: string) {
    try {
      const res = await fetch(`/api/copiloto?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setHistorico(prev => prev.filter(e => e.id !== id))
      showToast("Consulta removida do histórico.")
    } catch (e) {
      console.error("[copiloto] remover do histórico:", e)
      showToast("Não foi possível remover do histórico.", "error")
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
    setCids([])
  }

  // Paciente vindo pela URL
  useEffect(() => {
    if (!pacienteIdParam) return
    ;(async () => {
      try {
        const res = await fetch(`/api/pacientes?action=get&id=${encodeURIComponent(pacienteIdParam)}`)
        if (!res.ok) return
        const data = await res.json()
        if (data && typeof data === "object" && !Array.isArray(data)) {
          setPatient(data as Paciente)
          setQuery(getPacNome(data as Paciente))
        }
      } catch (e) { console.error("[copiloto] paciente da URL:", e) }
    })()
  }, [pacienteIdParam])

  const searchPatients = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDrop(false); setErroBusca(""); return }
    setSearching(true); setErroBusca("")
    try {
      const res = await fetch(`/api/pacientes?action=search&nome=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setResults(list)
      setShowDrop(true)
    } catch (e) {
      console.error("[copiloto] busca:", e)
      setResults([]); setShowDrop(false)
      setErroBusca("Não foi possível buscar pacientes agora.")
    } finally { setSearching(false) }
  }, [])

  const handleQuery = (v: string) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchPatients(v), 400)
  }

  const fetchMemoriaPadrao = useCallback(async (paciente_nome: string, paciente_id?: string) => {
    setMemoriaChips([]); setLoadingMemoria(true)
    try {
      const res = await fetch("/api/copiloto/memoria-padrao", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paciente_nome, paciente_id: paciente_id || undefined }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { chips?: Chip[] }
      setMemoriaChips(data.chips ?? [])
    } catch (e) { console.error("[copiloto] memória:", e) }
    finally { setLoadingMemoria(false) }
  }, [])

  const selectPatient = (p: Paciente) => {
    setPatient(p); setQuery(getPacNome(p)); setShowDrop(false); setResults([])
    fetchMemoriaPadrao(getPacNome(p), getPacId(p) || undefined)
  }
  const clearPatient = () => {
    setPatient(null); setQuery(""); setResults([]); setShowDrop(false); setErroBusca("")
    setMemoriaChips([]); setLoadingMemoria(false)
  }

  const gerar = async () => {
    if (!relato.trim()) return
    setPhase("loading"); setGenError(""); setResult(null)
    try {
      const res = await fetch("/api/copiloto?action=gerar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relato,
          dados:        dados || undefined,
          tipoConsulta,
          nomePaciente: patient ? getPacNome(patient) : undefined,
          pacienteId:   patient ? getPacId(patient)  : undefined,
          protocoloId:  protocoloId ?? undefined,
        }),
      })
      const data = await res.json().catch(() => null) as CopilotoResult | null
      if (!res.ok || !data || data.error) {
        setGenError(msgDoServidor(res.status, data, "Não foi possível gerar a documentação agora. Tente de novo em instantes."))
        setPhase("idle")
        return
      }
      setResult(data); setPhase("done"); setCids([])
      fetchHistorico()
      if (data.resumo) {
        setLoadingCids(true)
        fetch("/api/copiloto/sugerir-cid", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumo: data.resumo, plano: data.plano }),
        })
          .then(r => r.ok ? r.json() : { cids: [] })
          .then((d: { cids?: Cid[] }) => setCids(Array.isArray(d.cids) ? d.cids : []))
          .catch(() => {})
          .finally(() => setLoadingCids(false))
      }
    } catch (e) {
      console.error("[copiloto] gerar:", e)
      setGenError("Erro de conexão ao gerar. Tente de novo.")
      setPhase("idle")
    }
  }

  const textoProntuario = prontuarioBlocos && Object.keys(editedProntuario).length > 0
    ? prontuarioBlocos.map(b => `${b.label.toUpperCase()}:\n${editedProntuario[b.key] ?? b.content}`).join("\n\n")
    : result?.prontuario ?? ""

  const enviarMedx = async () => {
    if (!textoProntuario) return
    const idPaciente = patient ? getPacId(patient) : ""
    if (!idPaciente) { showToast("Selecione um paciente para enviar ao MedX.", "error"); return }
    setSendingMedx(true)
    try {
      const res = await fetch("/api/copiloto?action=prontuario", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prontuario: textoProntuario, idPaciente }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || (data as { error?: string } | null)?.error) throw new Error(msgDoServidor(res.status, data, "Não foi possível enviar ao MedX."))
      showToast("Prontuário enviado ao MedX.")
      setConfirmandoMedx(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Não foi possível enviar ao MedX.", "error")
    } finally { setSendingMedx(false) }
  }

  async function enviarWhatsApp(msg: string, dia: Dia): Promise<boolean> {
    const tel = patient ? getPacTel(patient) : ""
    if (!tel) { showToast("Selecione um paciente com telefone para enviar.", "error"); return false }
    try {
      const res = await fetch("/api/zapi/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: foneParaEnvio(tel), message: msg }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(msgDoServidor(res.status, data, "Não foi possível enviar a mensagem."))
      showToast(`Mensagem ${dia.replace("d", "D+")} enviada pelo WhatsApp.`)
      return true
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Não foi possível enviar a mensagem.", "error")
      return false
    }
  }

  const novaConsulta = () => {
    setRelato(""); setDados(""); setTipoConsulta("Primeira consulta"); setProtocoloId(null)
    setResult(null); setGenError(""); setPhase("idle")
    setEditedResumo(""); setEditedPlano(""); setEditedOrientacoes("")
    setCheckedExames(new Set())
    setProntuarioBlocos(null); setEditedProntuario({})
    setCids([]); setLoadingCids(false)
  }

  const openDocumento = async (tipo: "carta" | "atestado") => {
    if (!result?.resumo) return
    setDocModal({ tipo, texto: "", loading: true, erro: "" })
    try {
      const res = await fetch("/api/copiloto/documento", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          resumo:       editedResumo || result.resumo,
          plano:        editedPlano  || result.plano,
          nomePaciente: patient ? getPacNome(patient) : undefined,
        }),
      })
      const data = await res.json().catch(() => null) as { texto?: string; error?: string } | null
      if (!res.ok || !data?.texto) throw new Error(msgDoServidor(res.status, data, "Não foi possível gerar o documento."))
      setDocModal({ tipo, texto: data.texto, loading: false, erro: "" })
    } catch (e) {
      setDocModal({ tipo, texto: "", loading: false, erro: e instanceof Error ? e.message : "Não foi possível gerar o documento." })
    }
  }

  function imprimirDocumento() {
    if (!docModal?.texto) return
    const w = window.open("", "_blank")
    if (!w) { showToast("O navegador bloqueou a janela de impressão.", "error"); return }
    const titulo = docModal.tipo === "carta" ? "Carta de encaminhamento" : "Atestado médico"
    w.document.write(`<html><head><title>${titulo}</title><style>body{font-family:Arial,sans-serif;font-size:13px;line-height:1.7;margin:60px 80px;white-space:pre-wrap}</style></head><body>${escapeHtml(docModal.texto)}</body></html>`)
    w.document.close()
    w.print()
  }

  function copiarCid(codigo: string) {
    navigator.clipboard.writeText(codigo)
      .then(() => { setCopiedCid(codigo); setTimeout(() => setCopiedCid(null), 2000) })
      .catch(() => showToast("Não foi possível copiar.", "error"))
  }

  function cartaParaPaciente() {
    const params = new URLSearchParams()
    if (relato)       params.set("relato", relato.slice(0, 2000))
    if (dados)        params.set("dados", dados.slice(0, 1000))
    if (patient)      params.set("nomePaciente", getPacNome(patient))
    if (tipoConsulta) params.set("tipoConsulta", tipoConsulta)
    router.push(`/conversa?${params.toString()}`)
  }

  function irPrescrever() {
    const id = patient ? getPacId(patient) : ""
    router.push(id ? `/prescricao?pacienteId=${encodeURIComponent(id)}` : "/prescricao")
  }

  function irAgendar() {
    const id = patient ? getPacId(patient) : ""
    const nome = patient ? encodeURIComponent(getPacNome(patient)) : ""
    router.push(id ? `/agenda?pacienteId=${encodeURIComponent(id)}&pacienteNome=${nome}` : "/agenda")
  }

  function fecharModoFoco() {
    if (result !== null) { setConsultDuration(timerSecs); setShowPostModal(true) }
    setFocusMode(false)
  }

  const historicoFiltrado = patient ? historico.filter(e => e.paciente_nome === getPacNome(patient)) : historico
  const msgsFollowup = parseFollowup(result?.followup)
  const podeEnviarWA = !!(patient && getPacTel(patient))
  const gravandoAlgo = gravRelato.gravando || gravDados.gravando
  const ocupadoVoz = gravRelato.transcrevendo || gravDados.transcrevendo

  const gravacaoDados = hasMediaRecorder ? (
    <div className="flex items-center gap-2">
      {gravDados.transcrevendo && <span role="status" className="text-[12px] text-px-muted">Transcrevendo</span>}
      <PxButton size="sm" variant={gravDados.gravando ? "danger" : "secondary"} leftIcon={Mic} disabled={gravDados.transcrevendo || gravRelato.gravando || gravRelato.transcrevendo} onClick={() => cliqueMic("dados")}>
        {gravDados.gravando ? "Parar gravação" : "Gravar por voz"}
      </PxButton>
    </div>
  ) : null

  return (
    <div className="animate-fade-in">
      {focusMode ? (
        <header className="px-glass sticky top-3 z-30 mx-4 mt-4 flex items-center gap-3 rounded-px-panel px-5 py-3 md:mx-10">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="truncate text-[15px] font-semibold text-px-ink">{patient ? getPacNome(patient) : "Modo consulta"}</span>
            <Tag tone="ink">Em atendimento</Tag>
          </div>
          <span role="timer" aria-label="Tempo de consulta" className="text-[16px] font-semibold tabular-nums text-px-ink">{fmtTimer(timerSecs)}</span>
          <PxButton size="sm" variant="secondary" onClick={fecharModoFoco}>Sair do modo consulta</PxButton>
        </header>
      ) : (
        <PageHeader
          title="Copiloto de consulta"
          caption="Rascunho clínico gerado por IA para você revisar"
          actions={
            <>
              <PxButton size="sm" leftIcon={Stethoscope} onClick={() => setFocusMode(true)}>Iniciar consulta</PxButton>
              <PxButton size="sm" variant="secondary" leftIcon={Clock} aria-pressed={showHistorico} onClick={() => setShowHistorico(v => !v)}>
                Histórico{historico.length > 0 ? ` (${historico.length})` : ""}
              </PxButton>
              {phase === "done" && <PxButton size="sm" variant="secondary" leftIcon={Plus} onClick={novaConsulta}>Nova</PxButton>}
            </>
          }
        />
      )}

      <div className="space-y-4 px-4 pb-10 pt-4 md:px-10">
        {showHistorico && (
          <Panel as="section" className="space-y-3">
            <h2 className="text-[15px] font-semibold text-px-ink">{patient ? `Histórico de ${getPacNome(patient)}` : "Histórico de consultas"}</h2>
            {erroHistorico && <p role="alert" className={erroBox}>{erroHistorico}</p>}
            {loadingHistorico ? <p role="status" className="text-[13px] text-px-muted">Carregando</p>
              : historicoFiltrado.length === 0 && !erroHistorico ? (
                <p className="text-[13.5px] text-px-muted">{patient ? `Nenhuma consulta salva para ${getPacNome(patient)}.` : "Nenhuma consulta salva ainda."}</p>
              ) : (
                <ul className="max-h-80 space-y-2 overflow-y-auto">
                  {historicoFiltrado.map(entry => (
                    <ItemHistorico key={entry.id} entry={entry} mostrarPaciente={!patient} onAbrir={() => loadFromHistorico(entry)} onExcluir={() => deleteHistorico(entry.id)} />
                  ))}
                </ul>
              )}
          </Panel>
        )}

        <div className="flex flex-col gap-4 md:grid md:grid-cols-[2fr_3fr] md:items-start">
          {/* Entrada */}
          <Panel as="section" className="space-y-5">
            <div>
              <h2 className="text-[16px] font-semibold text-px-ink">Briefing da consulta</h2>
              <p className="mt-0.5 text-[13px] text-px-muted">O relato é obrigatório. O restante melhora a geração.</p>
            </div>

            <div className="space-y-2">
              <Field label="Paciente" htmlFor="cop-paciente" hint="O nome do paciente é enviado à IA junto do relato." error={erroBusca}>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-px-muted" aria-hidden />
                  <PxInput
                    id="cop-paciente" className="pl-10 pr-24" autoComplete="off" value={query}
                    onChange={e => handleQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDrop(true)}
                    onKeyDown={e => { if (e.key === "Escape") setShowDrop(false) }}
                    placeholder="Buscar pelo nome"
                  />
                  {searching ? <span role="status" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-px-muted">Buscando</span>
                    : query ? <button type="button" onClick={clearPatient} className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[12.5px] font-medium text-px-ink hover:bg-px-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">Limpar</button> : null}
                  {showDrop && (
                    <ul className="px-glass-strong absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-px-card shadow-[0_10px_30px_rgba(20,20,20,0.16)]">
                      {results.length === 0 ? <li className="px-4 py-3 text-[13px] text-px-muted">Nenhum paciente encontrado.</li> : results.map((p, i) => (
                        <li key={getPacId(p) || i}>
                          <button type="button" onClick={() => selectPatient(p)} className="w-full border-b border-px-line/60 px-4 py-2.5 text-left last:border-b-0 hover:bg-px-ink/5 focus:outline-none focus-visible:bg-px-ink/5">
                            <span className="block truncate text-[13.5px] font-medium text-px-ink">{getPacNome(p)}</span>
                            {getPacTel(p) && <span className="block text-[12px] text-px-muted">{getPacTel(p)}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Field>
              {patient && (
                <div className="flex items-center justify-between gap-2 rounded-px-card bg-white/70 px-3.5 py-2.5">
                  <span className="min-w-0 truncate text-[13.5px] font-medium text-px-ink">{getPacNome(patient)}</span>
                  <PxButton size="sm" variant="quiet" onClick={() => router.push(getPacId(patient) ? `/pacientes/${encodeURIComponent(getPacId(patient))}` : "/pacientes")}>Abrir ficha</PxButton>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="block text-[12.5px] font-medium text-px-muted">Tipo de consulta</span>
              <Segmented label="Tipo de consulta" options={TIPOS} value={tipoConsulta} onChange={setTipoConsulta} />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="cop-relato" className="text-[12.5px] font-medium text-px-muted">Relato da consulta (obrigatório)</label>
                {hasMediaRecorder ? (
                  <div className="flex items-center gap-2">
                    {gravRelato.gravando && <span role="timer" aria-label="Tempo de gravação" className="text-[12.5px] tabular-nums text-px-danger">{fmtTimer(gravRelato.segundos)}</span>}
                    {gravRelato.transcrevendo && <span role="status" className="text-[12px] text-px-muted">Transcrevendo</span>}
                    <PxButton size="sm" variant={gravRelato.gravando ? "danger" : "secondary"} leftIcon={Mic} disabled={gravRelato.transcrevendo || gravDados.gravando || gravDados.transcrevendo} onClick={() => cliqueMic("relato")}>
                      {gravRelato.gravando ? "Parar gravação" : "Gravar consulta"}
                    </PxButton>
                  </div>
                ) : <span className="text-[12px] text-px-muted">Gravação indisponível neste navegador. Use Chrome ou Edge.</span>}
              </div>
              <textarea id="cop-relato" value={relato} onChange={e => setRelato(e.target.value)} rows={7} placeholder="Queixas, exame físico, hipóteses e conduta discutida." className={textareaCls} />
            </div>

            <Field label="Protocolo clínico" htmlFor="cop-protocolo" hint={!protocolosLoading && protocolosList.length === 0 ? undefined : "Sem escolha, a IA usa os protocolos favoritos."}>
              <PxSelect id="cop-protocolo" value={protocoloId ?? ""} onChange={e => setProtocoloId(e.target.value || null)} disabled={protocolosLoading || protocolosList.length === 0}>
                {protocolosLoading ? <option value="">Carregando protocolos</option>
                  : protocolosList.length === 0 ? <option value="">Nenhum protocolo cadastrado</option>
                  : <>
                      <option value="">Protocolos favoritos (padrão)</option>
                      {protocolosList.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                    </>}
              </PxSelect>
              {!protocolosLoading && protocolosList.length === 0 && (
                <a href="/memoria" className="mt-1.5 inline-block text-[12.5px] font-medium text-px-accent underline underline-offset-2">Criar protocolos em Memória clínica</a>
              )}
            </Field>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="cop-dados" className="text-[12.5px] font-medium text-px-muted">Dados objetivos</label>
                {gravacaoDados}
              </div>
              {gravDados.gravando && <p role="timer" aria-label="Tempo de gravação" className="text-[12.5px] tabular-nums text-px-danger">Gravando {fmtTimer(gravDados.segundos)}</p>}
              <textarea id="cop-dados" value={dados} onChange={e => setDados(e.target.value)} rows={4} placeholder="Sinais vitais, exames, medicamentos em uso, alergias, peso e altura." className={textareaCls} />
              {(loadingMemoria || memoriaChips.length > 0) && (
                <div className="space-y-2">
                  <p className="text-[12.5px] text-px-muted">{loadingMemoria ? "Buscando padrões dos atendimentos anteriores" : "Padrões dos atendimentos anteriores. Toque para acrescentar aos dados."}</p>
                  {!loadingMemoria && (
                    <div className="flex flex-wrap gap-2">
                      {memoriaChips.map((chip, i) => (
                        <button key={i} type="button" onClick={() => setDados(prev => prev ? prev + "\n" + chip.texto : chip.texto)}
                          className="flex items-center gap-1.5 rounded-full border border-px-line bg-white px-3 py-1.5 text-left text-[12.5px] text-px-ink hover:bg-px-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
                          <Plus className="h-3 w-3 shrink-0" aria-hidden />
                          <span className="text-px-muted">{chip.tipo}:</span> {chip.texto}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {genError && <p role="alert" className={erroBox}>{genError}</p>}

            <div className="space-y-2">
              <PxButton fullWidth loading={phase === "loading"} disabled={!relato.trim() || gravandoAlgo || ocupadoVoz} onClick={gerar}>
                {phase === "loading" ? "Gerando" : phase === "done" ? "Gerar de novo" : "Gerar documentação"}
              </PxButton>
              {!relato.trim() && <p className="text-[12px] text-px-muted">Escreva ou grave o relato para liberar a geração.</p>}
              {phase === "done" && <PxButton fullWidth variant="secondary" onClick={novaConsulta}>Nova consulta</PxButton>}
            </div>
          </Panel>

          {/* Saída */}
          <div className="space-y-3">
            {phase === "idle" && !result && <Panel><PainelVazio /></Panel>}
            {phase === "loading" && <Esqueleto />}

            {phase === "done" && result && (
              <>
                <Panel className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13.5px] text-px-ink">
                    <span className="font-medium">Documentação gerada</span>{patient ? ` para ${getPacNome(patient)}` : ""}. Rascunho de IA: confira antes de usar.
                  </p>
                  <PxButton size="sm" variant="secondary" onClick={gerar}>Gerar de novo</PxButton>
                </Panel>

                {result.resumo && (
                  <Bloco titulo="Resumo clínico" extra={<CopyButton text={editedResumo} />}>
                    <AutoTextarea label="Resumo clínico" value={editedResumo} onChange={setEditedResumo} />
                  </Bloco>
                )}

                {(loadingCids || cids.length > 0) && (
                  <Panel as="section" className="space-y-2">
                    <h3 className="text-[15px] font-semibold text-px-ink">CID-10 sugeridos</h3>
                    <p className="text-[12.5px] text-px-muted">Sugestão da IA a partir do resumo. A escolha do código é sua.</p>
                    {loadingCids && <p role="status" className="text-[13px] text-px-muted">Buscando sugestões</p>}
                    <div className="flex flex-wrap gap-2">
                      {cids.map(c => (
                        <button key={c.codigo} type="button" title={c.justificativa} onClick={() => copiarCid(c.codigo)} aria-label={`Copiar CID ${c.codigo}, ${c.descricao}`}
                          className="flex items-center gap-1.5 rounded-full border border-px-line bg-white px-3 py-1.5 text-[12.5px] text-px-ink hover:bg-px-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
                          {copiedCid === c.codigo ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3 text-px-muted" aria-hidden />}
                          <span className="font-semibold">{c.codigo}</span>
                          <span className="hidden text-px-muted sm:inline">{c.descricao}</span>
                        </button>
                      ))}
                    </div>
                  </Panel>
                )}

                {result.plano && (
                  <Bloco titulo="Plano terapêutico" extra={<CopyButton text={editedPlano} />}>
                    <AutoTextarea label="Plano terapêutico" value={editedPlano} onChange={setEditedPlano} />
                  </Bloco>
                )}

                {result.exames_solicitados && result.exames_solicitados.length > 0 && (
                  <Bloco titulo="Exames solicitados" extra={<CopyButton text={result.exames_solicitados.join("\n")} />}>
                    <ul className="space-y-1.5">
                      {result.exames_solicitados.map((exame, i) => (
                        <li key={i} className={cn("rounded-px-card bg-white/70 px-3 py-2", checkedExames.has(i) && "opacity-60")}>
                          <PxCheckbox
                            label={exame}
                            checked={checkedExames.has(i)}
                            onChange={e => setCheckedExames(prev => { const next = new Set(prev); if (e.target.checked) next.add(i); else next.delete(i); return next })}
                          />
                        </li>
                      ))}
                    </ul>
                    <p className="text-[12px] text-px-muted">As marcações servem de conferência nesta tela e não são salvas.</p>
                  </Bloco>
                )}

                {result.orientacoes && (
                  <Bloco titulo="Orientações ao paciente" aberto={false} extra={<CopyButton text={editedOrientacoes} />}>
                    <AutoTextarea label="Orientações ao paciente" value={editedOrientacoes} onChange={setEditedOrientacoes} />
                  </Bloco>
                )}

                {msgsFollowup && (msgsFollowup.d1 || msgsFollowup.d7 || msgsFollowup.d30) && (
                  <Bloco titulo="Mensagens de acompanhamento" aberto={false}>
                    <div className="space-y-3">
                      {(["d1", "d7", "d30"] as const).map(dia => msgsFollowup[dia] ? (
                        <CartaoFollowup key={dia} dia={dia} msg={msgsFollowup[dia]} podeEnviar={podeEnviarWA} onEnviar={() => enviarWhatsApp(msgsFollowup[dia], dia)} />
                      ) : null)}
                    </div>
                  </Bloco>
                )}

                {result.conteudo && (
                  <Bloco titulo="Sugestão de conteúdo" aberto={false} extra={<CopyButton text={result.conteudo} />}>
                    <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink">{result.conteudo}</p>
                  </Bloco>
                )}

                <Panel as="section" className="space-y-3">
                  <h3 className="text-[15px] font-semibold text-px-ink">Próximos passos</h3>
                  <div className="flex flex-wrap gap-2">
                    <PxButton size="sm" variant="secondary" onClick={irPrescrever}>Prescrever</PxButton>
                    <PxButton size="sm" variant="secondary" onClick={() => router.push("/interpretacao-exames")}>Interpretar exames</PxButton>
                    <PxButton size="sm" variant="secondary" onClick={cartaParaPaciente}>Carta ao paciente</PxButton>
                    <PxButton size="sm" variant="secondary" onClick={irAgendar}>Agendar retorno</PxButton>
                    <PxButton size="sm" variant="secondary" onClick={() => openDocumento("carta")}>Carta de encaminhamento</PxButton>
                    <PxButton size="sm" variant="secondary" onClick={() => openDocumento("atestado")}>Atestado</PxButton>
                  </div>
                </Panel>

                {result.prontuario && (
                  <Bloco
                    titulo="Prontuário gerado"
                    extra={
                      <div className="flex flex-wrap items-center gap-2">
                        <CopyButton text={textoProntuario} />
                        {confirmandoMedx ? (
                          <>
                            <PxButton size="sm" loading={sendingMedx} leftIcon={Send} onClick={enviarMedx}>Confirmar envio</PxButton>
                            <PxButton size="sm" variant="quiet" disabled={sendingMedx} onClick={() => setConfirmandoMedx(false)}>Cancelar</PxButton>
                          </>
                        ) : <PxButton size="sm" variant="secondary" leftIcon={Send} onClick={() => setConfirmandoMedx(true)}>Enviar para o MedX</PxButton>}
                      </div>
                    }
                  >
                    {confirmandoMedx && <p className="text-[12.5px] text-px-muted">{patient ? `O prontuário será gravado no MedX de ${getPacNome(patient)}.` : "Selecione um paciente antes de enviar."}</p>}
                    {prontuarioBlocos ? (
                      <div className="space-y-3">
                        {prontuarioBlocos.map(bloco => (
                          <div key={bloco.key} className="space-y-1.5">
                            <p className="text-[12.5px] font-medium text-px-muted">{bloco.label}</p>
                            <AutoTextarea label={bloco.label} value={editedProntuario[bloco.key] ?? bloco.content} onChange={v => setEditedProntuario(prev => ({ ...prev, [bloco.key]: v }))} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <textarea readOnly aria-label="Prontuário gerado" value={result.prontuario} rows={14} onClick={e => (e.target as HTMLTextAreaElement).select()} className={cn(textareaCls, "resize-y font-mono text-[12.5px]")} />
                    )}
                  </Bloco>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <PxModal open={showConsentModal} onClose={() => setShowConsentModal(false)} title="Autorizar gravação de voz">
        <div className="space-y-3">
          <p className="text-[13.5px] leading-relaxed text-px-ink">
            O que você falar será enviado ao serviço Groq Whisper para virar texto. O áudio não é guardado: só o texto transcrito entra no relato.
          </p>
          <p className="text-[12.5px] text-px-muted">A autorização fica registrada no seu perfil.</p>
          {erroConsent && <p role="alert" className={erroBox}>{erroConsent}</p>}
          <div className="flex gap-2 pt-1">
            <PxButton variant="secondary" fullWidth onClick={() => setShowConsentModal(false)}>Cancelar</PxButton>
            <PxButton fullWidth onClick={aceitarConsentimento}>Autorizar e gravar</PxButton>
          </div>
        </div>
      </PxModal>

      <PxModal open={showPostModal} onClose={() => setShowPostModal(false)} title="Consulta finalizada">
        <div className="space-y-2">
          <p className="text-[13px] text-px-muted">{patient ? getPacNome(patient) : "Paciente"}, {fmtTimer(consultDuration)} de atendimento. O que fazer agora?</p>
          {msgsFollowup?.d1 && podeEnviarWA && (
            <LinhaAcao titulo="Enviar mensagem D+1" detalhe="Acompanhamento pelo WhatsApp, enviado na hora" onClick={() => { enviarWhatsApp(msgsFollowup.d1, "d1"); setShowPostModal(false) }} />
          )}
          <LinhaAcao titulo="Carta ao paciente" detalhe="Texto com o resumo da consulta" onClick={() => { cartaParaPaciente(); setShowPostModal(false) }} />
          <LinhaAcao titulo="Prescrever" detalhe="Abrir a prescrição assistida" onClick={() => { irPrescrever(); setShowPostModal(false) }} />
          <LinhaAcao titulo="Agendar retorno" detalhe={patient ? `${getPacNome(patient)} já preenchido` : "Abrir a agenda"} onClick={() => { irAgendar(); setShowPostModal(false) }} />
          <LinhaAcao titulo="Encaminhar para nutrição" detalhe="Abrir o acompanhamento nutricional" onClick={() => { const id = patient ? getPacId(patient) : ""; router.push(id ? `/nutricao-pacientes?pacienteId=${encodeURIComponent(id)}` : "/nutricao-pacientes"); setShowPostModal(false) }} />
          <LinhaAcao titulo="Solicitar avaliação" detalhe="Pesquisa de satisfação NPS" onClick={() => { router.push("/nps"); setShowPostModal(false) }} />
          <LinhaAcao titulo="Programa de indicações" detalhe="Convidar o paciente a indicar" onClick={() => { router.push("/indicacoes"); setShowPostModal(false) }} />
          {result?.exames_solicitados && result.exames_solicitados.length > 0 && (
            <LinhaAcao
              titulo="Copiar exames solicitados"
              detalhe={`${result.exames_solicitados.length} exame${result.exames_solicitados.length !== 1 ? "s" : ""} na lista`}
              onClick={() => { navigator.clipboard.writeText(result.exames_solicitados!.join("\n")).then(() => showToast("Lista de exames copiada.")).catch(() => showToast("Não foi possível copiar.", "error")); setShowPostModal(false) }}
            />
          )}
          <PxButton variant="quiet" fullWidth onClick={() => { setShowPostModal(false); router.push("/dashboard") }}>Fechar e ir ao início</PxButton>
        </div>
      </PxModal>

      <PxModal open={!!docModal} onClose={() => setDocModal(null)} title={docModal?.tipo === "carta" ? "Carta de encaminhamento" : "Atestado médico"} className="max-w-2xl">
        {docModal && (
          <div className="space-y-3">
            {docModal.loading ? <p role="status" className="py-10 text-center text-[13px] text-px-muted">{docModal.tipo === "carta" ? "Gerando a carta de encaminhamento" : "Gerando o atestado"}</p>
              : docModal.erro ? (
                <div className="space-y-3">
                  <p role="alert" className={erroBox}>{docModal.erro}</p>
                  <PxButton variant="secondary" onClick={() => openDocumento(docModal.tipo)}>Tentar de novo</PxButton>
                </div>
              ) : (
                <>
                  <p className="text-[12.5px] text-px-muted">Rascunho de IA. Revise e edite antes de entregar. Dados como CRM e assinatura precisam ser conferidos por você.</p>
                  <textarea aria-label="Texto do documento" value={docModal.texto} onChange={e => setDocModal(m => m ? { ...m, texto: e.target.value } : null)} rows={18} className={cn(textareaCls, "resize-y font-mono text-[12.5px]")} />
                  <div className="flex flex-wrap gap-2">
                    <CopyButton text={docModal.texto} label="Copiar documento" />
                    <PxButton variant="secondary" size="sm" onClick={imprimirDocumento}>Imprimir</PxButton>
                  </div>
                </>
              )}
          </div>
        )}
      </PxModal>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}

/* ── Exportação com Suspense (useSearchParams exige) ───────────────────── */

export default function CopilotoPage() {
  return (
    <Suspense fallback={
      <div className="animate-fade-in">
        <div className="px-glass mx-4 mt-4 flex h-[72px] items-center rounded-px-panel px-6 md:mx-10">
          <div className="h-4 w-48 animate-pulse rounded bg-px-ink/10" />
        </div>
        <div className="space-y-3 p-4 md:p-8">
          {[1, 2, 3].map(i => <div key={i} className="px-glass h-16 animate-pulse rounded-px-card" />)}
        </div>
      </div>
    }>
      <CopilotoContent />
    </Suspense>
  )
}
