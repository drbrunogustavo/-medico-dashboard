"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Apple, Search, MessageSquare, Plus, Copy,
  Check, Loader2, ChevronDown, Bookmark, X,
  Clock, Send,
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
  id?:               string
  nome_paciente:     string
  id_paciente_medx?: string
  tipo_trilha:       "pre_consulta" | "pos_consulta"
  mensagens:         Mensagem[]
  status:            string
  criado_em?:        string
}

const TIPO_LABELS = {
  pre_consulta: "Pré-Consulta",
  pos_consulta: "Pós-Consulta",
}

const TIPO_DESC = {
  pre_consulta: "D-1 (antevéspera) + D-0 (manhã da consulta)",
  pos_consulta: "H+2 · D+1 · D+15 · D-15 (antes do retorno)",
}

const STATUS_COLOR: Record<string, string> = {
  ativa:     "bg-accent-dim   text-accent    border-accent-border",
  pausada:   "bg-amber-500/10 text-amber-400 border-amber-500/25",
  concluida: "bg-blue-500/10  text-blue-400  border-blue-500/25",
}

function getPacNome(p: PacienteResult): string {
  return p.Nome ?? p.nome ?? p.nomeCompleto ?? ""
}

function getPacId(p: PacienteResult): string {
  return String(p.Id ?? p.id ?? "")
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000) }}
      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
      title="Copiar mensagem"
    >
      {done ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NutricaoPacientesPage() {
  const [trilhasSalvas, setTrilhasSalvas] = useState<Trilha[]>([])
  const [loadingList,   setLoadingList]   = useState(true)

  // Form
  const [nomePaciente, setNomePaciente] = useState("")
  const [idMedx,       setIdMedx]       = useState("")
  const [tipoTrilha,   setTipoTrilha]   = useState<"pre_consulta" | "pos_consulta">("pos_consulta")
  const [contexto,     setContexto]     = useState("")
  const [linkAnamnese, setLinkAnamnese] = useState("")
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState("")
  const [gerado,       setGerado]       = useState<Mensagem[] | null>(null)
  const [formOpen,     setFormOpen]     = useState(true)
  const [viewTrilha,   setViewTrilha]   = useState<Trilha | null>(null)
  const [savedOk,      setSavedOk]      = useState(false)
  const [enviadas,     setEnviadas]     = useState<Set<number>>(new Set())

  // Patient search
  const [searchQ,       setSearchQ]       = useState("")
  const [searchResults, setSearchResults] = useState<PacienteResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => { fetchList() }, [])

  const fetchList = async () => {
    setLoadingList(true)
    try {
      const res  = await fetch("/api/nutricao-pacientes")
      const data = await res.json()
      setTrilhasSalvas(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    finally { setLoadingList(false) }
  }

  const buscarPaciente = async (q: string) => {
    setSearchQ(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const res  = await fetch(`/api/pacientes?action=search&nome=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(Array.isArray(data) ? data.slice(0, 5) : [])
    } catch { /* ignore */ }
    finally { setSearchLoading(false) }
  }

  const selecionarPaciente = (p: PacienteResult) => {
    setNomePaciente(getPacNome(p))
    setIdMedx(getPacId(p))
    setSearchQ("")
    setSearchResults([])
  }

  const gerar = async () => {
    if (!nomePaciente.trim()) return
    setLoading(true)
    setError("")
    setGerado(null)
    setEnviadas(new Set())
    try {
      const res  = await fetch("/api/nutricao-pacientes?action=gerar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nomePaciente, idPacienteMedx: idMedx, tipoTrilha, contexto, linkAnamnese }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGerado(data.mensagens as Mensagem[])
      setFormOpen(false)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  const salvar = async () => {
    if (!gerado) return
    setSaving(true)
    try {
      await fetch("/api/nutricao-pacientes?action=salvar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nomePaciente, idPacienteMedx: idMedx, tipoTrilha, trilha: gerado }),
      })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
      fetchList()
    } catch (e) { setError(String(e)) }
    finally { setSaving(false) }
  }

  const toggleEnviada = (i: number) => {
    setEnviadas(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Nutrição de Pacientes" subtitle="ALA CLÍNICA · TRILHAS DE MENSAGENS" />

      <div className="p-4 md:p-8 space-y-6 max-w-3xl">

        {savedOk && (
          <div className="bg-accent-dim border border-accent-border text-accent rounded-xl px-4 py-2.5 text-[12px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5" /> Trilha salva com sucesso!
          </div>
        )}

        {/* Formulário (accordion) */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setFormOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-accent" />
              <span className="text-[13px] font-medium text-text-primary">Nova Trilha</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", formOpen && "rotate-180")} />
          </button>

          {formOpen && (
            <div className="px-5 pb-5 space-y-5 border-t border-border pt-4">

              {/* Step 1: Busca de paciente */}
              <div>
                <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-accent-dim border border-accent-border text-accent text-[8px] flex items-center justify-center font-bold">1</span>
                  Paciente
                </div>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                    {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted animate-spin" />}
                    <input
                      value={nomePaciente || searchQ}
                      onChange={e => {
                        setNomePaciente(e.target.value)
                        buscarPaciente(e.target.value)
                      }}
                      placeholder="Nome ou busca MedX..."
                      className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-9 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none"
                    />
                    {nomePaciente && (
                      <button
                        onClick={() => { setNomePaciente(""); setIdMedx(""); setSearchResults([]) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-surface border border-border rounded-xl mt-1 shadow-xl overflow-hidden">
                      {searchResults.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => selecionarPaciente(p)}
                          className="w-full text-left px-4 py-2.5 text-[12px] text-text-secondary hover:bg-surface-2 transition-colors border-b border-border last:border-b-0"
                        >
                          <span className="font-medium">{getPacNome(p)}</span>
                          {getPacId(p) && <span className="ml-2 text-[10px] text-text-muted font-mono">#{getPacId(p)}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {idMedx && (
                  <div className="text-[10px] text-text-muted mt-1.5">
                    ID MedX: <span className="text-accent font-mono">{idMedx}</span>
                  </div>
                )}
              </div>

              {/* Step 2: Tipo de trilha */}
              <div>
                <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-accent-dim border border-accent-border text-accent text-[8px] flex items-center justify-center font-bold">2</span>
                  Trilha
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["pre_consulta", "pos_consulta"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTipoTrilha(t)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all",
                        tipoTrilha === t
                          ? "bg-accent-dim border-accent-border"
                          : "border-border hover:border-border-hover"
                      )}
                    >
                      <div className={cn(
                        "text-[12px] font-semibold mb-1",
                        tipoTrilha === t ? "text-accent" : "text-text-primary"
                      )}>
                        {TIPO_LABELS[t]}
                      </div>
                      <div className="text-[10px] text-text-muted leading-relaxed">{TIPO_DESC[t]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Link Anamnese — apenas pré-consulta */}
              {tipoTrilha === "pre_consulta" && (
                <div>
                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-accent-dim border border-accent-border text-accent text-[8px] flex items-center justify-center font-bold">3</span>
                    Link de Anamnese <span className="normal-case font-sans">(MedX)</span>
                  </div>
                  <input
                    value={linkAnamnese}
                    onChange={e => setLinkAnamnese(e.target.value)}
                    placeholder="Cole o link do MedX para anamnese (ex: https://app.medx.com.br/...)"
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none"
                  />
                  <div className="text-[10px] text-text-muted mt-1">
                    Se deixar em branco, será inserido &quot;[link gerado pelo MedX]&quot; como placeholder.
                  </div>
                </div>
              )}

              {/* Contexto */}
              <div>
                <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-accent-dim border border-accent-border text-accent text-[8px] flex items-center justify-center font-bold">
                    {tipoTrilha === "pre_consulta" ? "4" : "3"}
                  </span>
                  Contexto <span className="normal-case font-sans">(opcional)</span>
                </div>
                <textarea
                  value={contexto}
                  onChange={e => setContexto(e.target.value)}
                  rows={3}
                  placeholder="Ex: Paciente com hipotireoidismo, iniciando reposição hormonal, objetivo de emagrecimento..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">{error}</div>
              )}

              <button
                onClick={gerar}
                disabled={loading || !nomePaciente.trim()}
                className="flex items-center gap-2 bg-accent text-background text-[12px] font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                {loading ? "Gerando mensagens..." : "Gerar Trilha"}
              </button>
            </div>
          )}
        </div>

        {/* Generated messages */}
        {gerado && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                Trilha {TIPO_LABELS[tipoTrilha]} · {nomePaciente}
              </div>
              <button
                onClick={salvar}
                disabled={saving}
                className="flex items-center gap-1.5 text-[11px] bg-accent text-background font-semibold rounded-lg px-3 py-1.5 hover:opacity-90"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
                Salvar Trilha
              </button>
            </div>
            {gerado.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "bg-surface border rounded-xl p-4 transition-all",
                  enviadas.has(i)
                    ? "border-accent-border/40 opacity-70"
                    : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-semibold text-accent px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border">
                      {m.timing}
                    </span>
                    <span className="text-[12px] font-medium text-text-primary">{m.titulo}</span>
                    {enviadas.has(i) && (
                      <span className="text-[9px] font-mono text-accent bg-accent-dim px-1.5 py-0.5 rounded-full border border-accent-border flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Enviada
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <CopyBtn text={m.texto} />
                    <button
                      onClick={() => toggleEnviada(i)}
                      title={enviadas.has(i) ? "Desmarcar" : "Marcar como enviada"}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        enviadas.has(i)
                          ? "text-accent bg-accent-dim"
                          : "text-text-muted hover:text-accent hover:bg-accent-dim"
                      )}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">{m.texto}</p>
              </div>
            ))}
            <div className="text-[10px] text-text-muted text-center pt-1">
              {enviadas.size}/{gerado.length} mensagens marcadas como enviadas
            </div>
          </div>
        )}

        {/* Saved trilhas */}
        {loadingList ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 bg-surface border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : trilhasSalvas.length > 0 && (
          <div>
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-3">Trilhas Ativas</div>

            {/* Table header */}
            <div className="hidden md:grid grid-cols-4 px-4 pb-2 text-[9px] font-mono text-text-muted uppercase tracking-widest">
              <span>Paciente</span>
              <span>Trilha</span>
              <span>Próxima mensagem</span>
              <span>Status</span>
            </div>

            <div className="space-y-2">
              {trilhasSalvas.map((t, i) => {
                const msgs = Array.isArray(t.mensagens) ? t.mensagens : []
                const proxima = msgs[0]?.timing ?? "—"
                return (
                  <button
                    key={t.id ?? i}
                    onClick={() => setViewTrilha(t)}
                    className="w-full bg-surface border border-border hover:border-border-hover rounded-xl px-4 py-3.5 flex items-center gap-3 text-left transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(0,192,127,0.08)", border: "1px solid rgba(0,192,127,0.2)" }}
                    >
                      <Apple className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0 grid md:grid-cols-4 gap-1 md:gap-0 items-center">
                      <div className="text-[13px] font-medium text-text-primary truncate">{t.nome_paciente}</div>
                      <div className="text-[10px] text-text-muted">{TIPO_LABELS[t.tipo_trilha]}</div>
                      <div className="text-[10px] text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {proxima}
                      </div>
                      <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border w-fit", STATUS_COLOR[t.status] ?? STATUS_COLOR.ativa)}>
                        {t.status}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* View saved trilha modal */}
      {viewTrilha && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setViewTrilha(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div>
                <div className="text-[15px] font-semibold text-text-primary">{viewTrilha.nome_paciente}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{TIPO_LABELS[viewTrilha.tipo_trilha]}</div>
              </div>
              <button onClick={() => setViewTrilha(null)}>
                <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-3 flex-1">
              {(Array.isArray(viewTrilha.mensagens) ? viewTrilha.mensagens : []).map((m, i) => (
                <div key={i} className="bg-surface-2 border border-border rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-semibold text-accent px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border">
                      {m.timing}
                    </span>
                    <CopyBtn text={m.texto} />
                  </div>
                  <div className="text-[11px] font-medium text-text-primary mb-1">{m.titulo}</div>
                  <p className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
