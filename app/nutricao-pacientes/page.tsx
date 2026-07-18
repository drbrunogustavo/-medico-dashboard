"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  MessageSquare, Sparkles, Loader2, Check, Copy,
  Search, X, ChevronDown, ChevronUp, RefreshCw, Save,
  CheckCircle2, AlertCircle, Calendar, Clock, Apple,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface PacienteResult {
  Id?:           string | number
  id?:           string | number
  Nome?:         string
  nome?:         string
  nomeCompleto?: string
  [key: string]: unknown
}

interface Mensagem { timing: string; titulo: string; texto: string }
interface Trilha {
  id:                string
  nome_paciente:     string
  id_paciente_medx?: string
  tipo_trilha:       "pre_consulta" | "pos_consulta"
  mensagens:         Mensagem[]
  status:            string
  criado_em?:        string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  pre_consulta: "Pré-Consulta",
  pos_consulta: "Pós-Consulta",
}

const TIPO_DESC: Record<string, string> = {
  pre_consulta: "D-1 · D-0",
  pos_consulta: "H+2 · D+1 · D+15 · D-15",
}

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  ativa:     { label: "Ativa",     badge: "bg-emerald-500/12 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  pausada:   { label: "Pausada",   badge: "bg-amber-500/12   text-amber-400   border-amber-500/30",   dot: "bg-amber-400"   },
  concluida: { label: "Concluída", badge: "bg-blue-500/12    text-blue-400    border-blue-500/30",    dot: "bg-blue-400"    },
  cancelada: { label: "Cancelada", badge: "bg-red-500/12     text-red-400     border-red-500/30",     dot: "bg-red-400"     },
}

const STATUS_OPTIONS = ["ativa", "pausada", "concluida", "cancelada"]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPacNome(p: PacienteResult): string {
  return String(p.Nome ?? p.nome ?? p.nomeCompleto ?? "")
}
function getPacId(p: PacienteResult): string {
  return String(p.Id ?? p.id ?? "")
}
function fmtDate(s?: string): string {
  if (!s) return ""
  return s.slice(0, 10).split("-").reverse().join("/")
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function TimingBadge({ timing }: { timing: string }) {
  return (
    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 flex-shrink-0">
      {timing}
    </span>
  )
}

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800) }}
      className={cn(
        "flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all flex-shrink-0",
        done
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "border-border text-text-muted hover:border-blue-500/30 hover:text-blue-400",
        className,
      )}
    >
      {done ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {done ? "Copiado" : "Copiar"}
    </button>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NutricaoPacientesPage() {

  // List
  const [trilhas,     setTrilhas]     = useState<Trilha[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [updatingId,  setUpdatingId]  = useState<string | null>(null)

  // Form
  const [nomePaciente, setNomePaciente] = useState("")
  const [idMedx,       setIdMedx]       = useState("")
  const [tipoTrilha,   setTipoTrilha]   = useState<"pre_consulta" | "pos_consulta">("pos_consulta")
  const [contexto,     setContexto]     = useState("")
  const [linkAnamnese, setLinkAnamnese] = useState("")

  // Patient search
  const [searchResults, setSearchResults] = useState<PacienteResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Generation
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState("")
  const [mensagens,  setMensagens]  = useState<Mensagem[] | null>(null)

  // Save
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState<{ msg: string; type: "success" | "error" } | null>(null)

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch trilhas ─────────────────────────────────────────────────────────────

  const fetchTrilhas = useCallback(async () => {
    setLoadingList(true)
    try {
      const res  = await fetch("/api/nutricao-pacientes")
      const data = await res.json()
      setTrilhas(Array.isArray(data) ? data : [])
    } catch (e) { console.error("[nutricao-pacientes] erro ao carregar trilhas:", e) }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { fetchTrilhas() }, [fetchTrilhas])

  // ── Patient search ────────────────────────────────────────────────────────────

  const buscarPaciente = (q: string) => {
    setNomePaciente(q)
    setIdMedx("")
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setSearchResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res  = await fetch(`/api/pacientes?action=search&nome=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSearchResults(Array.isArray(data) ? data.slice(0, 5) : [])
      } catch (e) { console.error("[nutricao-pacientes] erro na busca de pacientes:", e) }
      finally { setSearchLoading(false) }
    }, 400)
  }

  const selecionarPaciente = (p: PacienteResult) => {
    setNomePaciente(getPacNome(p))
    setIdMedx(getPacId(p))
    setSearchResults([])
  }

  // ── Generate ──────────────────────────────────────────────────────────────────

  const gerar = async () => {
    if (!nomePaciente.trim()) return
    setGenerating(true)
    setGenError("")
    setMensagens(null)
    try {
      const res  = await fetch("/api/nutricao-pacientes?action=gerar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nomePaciente,
          idPacienteMedx:  idMedx        || undefined,
          tipoTrilha,
          contexto:        contexto      || undefined,
          linkAnamnese:    linkAnamnese  || undefined,
        }),
      })
      const data = await res.json() as { mensagens?: Mensagem[]; error?: string }
      if (data.error) throw new Error(data.error)
      setMensagens(data.mensagens ?? [])
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  const salvar = async () => {
    if (!mensagens) return
    setSaving(true)
    try {
      const res = await fetch("/api/nutricao-pacientes?action=salvar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nomePaciente,
          idPacienteMedx: idMedx || undefined,
          tipoTrilha,
          trilha:         mensagens,
        }),
      })
      const data = await res.json() as { error?: string }
      if (data.error) throw new Error(data.error)
      showToast("Trilha salva! Paciente ativo.")
      setMensagens(null)
      setNomePaciente(""); setIdMedx(""); setContexto(""); setLinkAnamnese("")
      fetchTrilhas()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao salvar", "error")
    } finally {
      setSaving(false)
    }
  }

  // ── Update status ─────────────────────────────────────────────────────────────

  const atualizarStatus = async (trilha: Trilha, novoStatus: string) => {
    if (novoStatus === trilha.status) return
    setUpdatingId(trilha.id)
    try {
      await fetch("/api/nutricao-pacientes?action=status", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: trilha.id, status: novoStatus }),
      })
      setTrilhas(prev => prev.map(t => t.id === trilha.id ? { ...t, status: novoStatus } : t))
    } catch (e) { console.error("[nutricao-pacientes] erro ao atualizar status da trilha:", e) }
    finally { setUpdatingId(null) }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const ativas = trilhas.filter(t => t.status === "ativa").length
  const pre    = trilhas.filter(t => t.tipo_trilha === "pre_consulta").length
  const pos    = trilhas.filter(t => t.tipo_trilha === "pos_consulta").length

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Nutrição de Pacientes"
        subtitle="ALA CLÍNICA · TRILHAS DE MENSAGENS"
        actions={
          <button
            onClick={fetchTrilhas}
            disabled={loadingList}
            className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loadingList && "animate-spin")} />
            Atualizar
          </button>
        }
      />

      <div className="p-4 md:p-6 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Trilhas"  value={trilhas.length} sub="cadastradas"       icon={Apple}        accent="blue"  />
          <StatCard label="Ativas"         value={ativas}         sub="em acompanhamento" icon={CheckCircle2} accent="green" />
          <StatCard label="Pré-Consulta"   value={pre}            sub="preparatórias"     icon={Calendar}     accent="blue"  />
          <StatCard label="Pós-Consulta"   value={pos}            sub="de seguimento"     icon={Clock}        accent="amber" />
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 items-start">

          {/* ── LEFT: Criar Trilha ────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div>
              <h2
                className="text-[15px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Criar Trilha
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                Selecione o paciente, o tipo e gere as mensagens automaticamente.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">

              {/* Patient search */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  Paciente *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                  {searchLoading && (
                    <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted animate-spin" />
                  )}
                  <input
                    value={nomePaciente}
                    onChange={e => buscarPaciente(e.target.value)}
                    placeholder="Nome do paciente ou busca MedX..."
                    className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-8 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
                  />
                  {nomePaciente && (
                    <button
                      onClick={() => { setNomePaciente(""); setIdMedx(""); setSearchResults([]) }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-surface border border-border rounded-xl mt-1 shadow-xl overflow-hidden">
                      {searchResults.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => selecionarPaciente(p)}
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
                {idMedx && (
                  <div className="text-[10px] text-text-muted mt-1 font-mono">
                    MedX <span className="text-blue-400">#{idMedx}</span>
                  </div>
                )}
              </div>

              {/* Tipo de trilha */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  Tipo de Trilha
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pre_consulta", "pos_consulta"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTipoTrilha(t)}
                      className={cn(
                        "py-3 px-3 rounded-xl border text-left transition-all",
                        tipoTrilha === t
                          ? "bg-blue-500/12 border-blue-500/30"
                          : "border-border hover:border-border-hover"
                      )}
                    >
                      <div className={cn(
                        "text-[12px] font-semibold mb-0.5",
                        tipoTrilha === t ? "text-blue-400" : "text-text-primary"
                      )}>
                        {TIPO_LABELS[t]}
                      </div>
                      <div className="text-[9px] text-text-muted font-mono">{TIPO_DESC[t]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Link Anamnese — pré-consulta only */}
              {tipoTrilha === "pre_consulta" && (
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                    Link de Anamnese{" "}
                    <span className="normal-case font-sans text-text-muted">(MedX, opcional)</span>
                  </label>
                  <input
                    value={linkAnamnese}
                    onChange={e => setLinkAnamnese(e.target.value)}
                    placeholder="https://app.medx.com.br/..."
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
                  />
                </div>
              )}

              {/* Contexto */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  Contexto Clínico{" "}
                  <span className="normal-case font-sans text-text-muted">(opcional)</span>
                </label>
                <textarea
                  value={contexto}
                  onChange={e => setContexto(e.target.value)}
                  rows={3}
                  placeholder="Ex: Hipotireoidismo, reposição hormonal, objetivo de emagrecimento..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors leading-relaxed"
                />
              </div>

              {genError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{genError}</span>
                </div>
              )}

              <button
                onClick={gerar}
                disabled={generating || !nomePaciente.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 text-[12px] font-semibold rounded-xl py-3 transition-all",
                  generating
                    ? "bg-blue-500/10 border border-blue-500/30 text-blue-400 cursor-wait"
                    : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
                )}
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando mensagens...</>
                  : <><Sparkles className="w-4 h-4" /> Gerar Trilha</>
                }
              </button>
            </div>

            {/* Generated preview */}
            {mensagens && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className="text-[13px] font-semibold text-text-primary"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      Preview da Trilha
                    </span>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {mensagens.length} mensagens · {TIPO_LABELS[tipoTrilha]}
                    </p>
                  </div>
                  <button
                    onClick={salvar}
                    disabled={saving}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-3 py-1.5 transition-all",
                      saving
                        ? "bg-blue-500/10 border border-blue-500/30 text-blue-400 cursor-wait"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    )}
                  >
                    {saving
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Save className="w-3.5 h-3.5" />}
                    {saving ? "Salvando…" : "Salvar Trilha"}
                  </button>
                </div>

                <div className="space-y-2">
                  {mensagens.map((m, i) => (
                    <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <TimingBadge timing={m.timing} />
                          <span className="text-[11px] font-semibold text-text-primary">{m.titulo}</span>
                        </div>
                        <CopyBtn text={m.texto} />
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {m.texto}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Trilhas Cadastradas ─────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className="text-[15px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Trilhas Cadastradas
              </h2>
              <span className="text-[10px] font-mono text-text-muted">
                {trilhas.length} {trilhas.length === 1 ? "trilha" : "trilhas"}
              </span>
            </div>

            {loadingList ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[76px] rounded-xl bg-surface border border-border shimmer" />
                ))}
              </div>
            ) : trilhas.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Nenhuma trilha cadastrada"
                subtitle="Crie a primeira trilha de nutrição no painel ao lado."
              />
            ) : (
              <div className="space-y-2">
                {trilhas.map(trilha => {
                  const isExpanded = expandedId === trilha.id
                  const msgs       = Array.isArray(trilha.mensagens) ? trilha.mensagens : []

                  return (
                    <div
                      key={trilha.id}
                      className="bg-surface border border-border rounded-xl overflow-hidden transition-all hover:border-blue-500/20"
                    >
                      {/* Card header */}
                      <div className="px-4 py-3.5 flex items-center gap-3">

                        {/* Icon */}
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        </div>

                        {/* Info */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : trilha.id)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="text-[12px] font-medium text-text-primary truncate">
                            {trilha.nome_paciente}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-text-muted">{TIPO_LABELS[trilha.tipo_trilha]}</span>
                            {trilha.criado_em && (
                              <>
                                <span className="text-[10px] text-text-muted">·</span>
                                <span className="text-[10px] text-text-muted font-mono">{fmtDate(trilha.criado_em)}</span>
                              </>
                            )}
                          </div>
                        </button>

                        {/* Status + expand */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {updatingId === trilha.id ? (
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                          ) : (
                            <select
                              value={STATUS_OPTIONS.includes(trilha.status) ? trilha.status : "ativa"}
                              onChange={e => atualizarStatus(trilha, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className={cn(
                                "appearance-none text-badge font-mono font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer",
                                (STATUS_META[trilha.status] ?? STATUS_META.ativa).badge
                              )}
                              style={{ background: "transparent" }}
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{STATUS_META[s]?.label ?? s}</option>
                              ))}
                            </select>
                          )}

                          {msgs.length > 0 && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : trilha.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
                            >
                              {isExpanded
                                ? <ChevronUp   className="w-3.5 h-3.5" />
                                : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded messages */}
                      {isExpanded && msgs.length > 0 && (
                        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2 bg-surface-2">
                          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
                            Mensagens · {msgs.length}
                          </div>
                          {msgs.map((m, i) => (
                            <div key={i} className="bg-surface border border-border rounded-lg p-3 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <TimingBadge timing={m.timing} />
                                  <span className="text-[11px] font-medium text-text-primary truncate">{m.titulo}</span>
                                </div>
                                <CopyBtn text={m.texto} />
                              </div>
                              <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-3">
                                {m.texto}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
