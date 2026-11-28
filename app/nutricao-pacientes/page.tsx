"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Toast } from "@/components/Toast"
import {
  MessageSquare, Sparkles, Check, Copy,
  Search, X, ChevronDown, ChevronUp, RefreshCw, Save,
} from "lucide-react"
import { Panel, PxButton, Segmented, Field, PxInput, PxSelect, Tag, PageHeader } from "@/components/px"

// ── Tipos ────────────────────────────────────────────────────────────────────

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

// ── Constantes ───────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  pre_consulta: "Pré-consulta",
  pos_consulta: "Pós-consulta",
}

const TIPO_DESC: Record<string, string> = {
  pre_consulta: "Envios em D-1 e D-0",
  pos_consulta: "Envios em H+2, D+1, D+15 e D-15",
}

type Tone = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  ativa:     { label: "Ativa",     tone: "ok" },
  pausada:   { label: "Pausada",   tone: "warn" },
  concluida: { label: "Concluída", tone: "neutral" },
  cancelada: { label: "Cancelada", tone: "danger" },
}

const STATUS_OPTIONS = ["ativa", "pausada", "concluida", "cancelada"]

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Subcomponentes ───────────────────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <PxButton
      size="sm"
      variant="secondary"
      leftIcon={done ? Check : Copy}
      aria-label={label}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1800)
        }).catch(() => { /* área de transferência indisponível */ })
      }}
    >
      {done ? "Copiado" : "Copiar"}
    </PxButton>
  )
}

function Numero({ label, value }: { label: string; value: number }) {
  return (
    <Panel as="div" className="p-4">
      <p className="text-[12.5px] text-px-muted">{label}</p>
      <p className="mt-1 text-[28px] font-medium leading-none tracking-[-0.02em] text-px-ink">{value}</p>
    </Panel>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function NutricaoPacientesPage() {

  // Lista
  const [trilhas,     setTrilhas]     = useState<Trilha[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError,   setListError]   = useState(false)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [updatingId,  setUpdatingId]  = useState<string | null>(null)

  // Formulário
  const [nomePaciente, setNomePaciente] = useState("")
  const [idMedx,       setIdMedx]       = useState("")
  const [tipoTrilha,   setTipoTrilha]   = useState<"pre_consulta" | "pos_consulta">("pos_consulta")
  const [contexto,     setContexto]     = useState("")
  const [linkAnamnese, setLinkAnamnese] = useState("")

  // Busca de paciente
  const [searchResults, setSearchResults] = useState<PacienteResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Geração
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState("")
  const [mensagens,  setMensagens]  = useState<Mensagem[] | null>(null)

  // Salvar
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState<{ msg: string; type: "success" | "error" } | null>(null)

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Trilhas ────────────────────────────────────────────────────────────────

  const fetchTrilhas = useCallback(async () => {
    setLoadingList(true)
    setListError(false)
    try {
      const res  = await fetch("/api/nutricao-pacientes")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTrilhas(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("[nutricao-pacientes] erro ao carregar trilhas:", e)
      setListError(true)
    }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { fetchTrilhas() }, [fetchTrilhas])

  // ── Busca de paciente ──────────────────────────────────────────────────────

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

  // ── Gerar ──────────────────────────────────────────────────────────────────

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
      const data = await res.json().catch(() => ({})) as { mensagens?: Mensagem[]; error?: string }
      if (data.error) throw new Error(data.error)
      if (!res.ok) throw new Error(`Erro do servidor (HTTP ${res.status}). Tente novamente.`)
      if (!Array.isArray(data.mensagens) || data.mensagens.length === 0) {
        throw new Error("A IA não devolveu mensagens. Tente gerar de novo.")
      }
      setMensagens(data.mensagens)
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  // ── Salvar ─────────────────────────────────────────────────────────────────

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
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (data.error) throw new Error(data.error)
      if (!res.ok) throw new Error(`Erro do servidor (HTTP ${res.status})`)
      showToast("Trilha salva. Paciente ativo.")
      setMensagens(null)
      setNomePaciente(""); setIdMedx(""); setContexto(""); setLinkAnamnese("")
      fetchTrilhas()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao salvar", "error")
    } finally {
      setSaving(false)
    }
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  const atualizarStatus = async (trilha: Trilha, novoStatus: string) => {
    if (novoStatus === trilha.status) return
    setUpdatingId(trilha.id)
    try {
      const res = await fetch("/api/nutricao-pacientes?action=status", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: trilha.id, status: novoStatus }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setTrilhas(prev => prev.map(t => t.id === trilha.id ? { ...t, status: novoStatus } : t))
    } catch (e) {
      console.error("[nutricao-pacientes] erro ao atualizar status da trilha:", e)
      showToast("Não foi possível atualizar o status. Tente novamente.", "error")
    }
    finally { setUpdatingId(null) }
  }

  // ── Números ────────────────────────────────────────────────────────────────

  const ativas = trilhas.filter(t => t.status === "ativa").length
  const pre    = trilhas.filter(t => t.tipo_trilha === "pre_consulta").length
  const pos    = trilhas.filter(t => t.tipo_trilha === "pos_consulta").length

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Nutrição de Pacientes"
        caption="Trilhas de mensagens antes e depois da consulta"
        actions={
          <PxButton size="sm" variant="secondary" leftIcon={RefreshCw} onClick={fetchTrilhas} loading={loadingList}>
            Atualizar
          </PxButton>
        }
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Numero label="Trilhas cadastradas" value={trilhas.length} />
          <Numero label="Ativas" value={ativas} />
          <Numero label="Pré-consulta" value={pre} />
          <Numero label="Pós-consulta" value={pos} />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[2fr_3fr]">

          {/* ── Criar trilha ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div>
              <h2 className="text-[16px] font-semibold text-px-ink">Criar trilha</h2>
              <p className="mt-0.5 text-[13px] text-px-muted">Escolha o paciente e o tipo, e gere as mensagens.</p>
            </div>

            <Panel className="space-y-4">

              <Field label="Paciente (obrigatório)" htmlFor="nut-paciente" hint={idMedx ? `MedX #${idMedx}` : undefined}>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-px-muted" aria-hidden="true" />
                  <PxInput
                    id="nut-paciente"
                    value={nomePaciente}
                    onChange={e => buscarPaciente(e.target.value)}
                    placeholder="Nome do paciente ou busca no MedX"
                    className="pl-10 pr-10"
                    autoComplete="off"
                  />
                  {nomePaciente && (
                    <button
                      type="button"
                      aria-label="Limpar paciente"
                      onClick={() => { setNomePaciente(""); setIdMedx(""); setSearchResults([]) }}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-px-ink hover:bg-px-ink/10"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                  {searchResults.length > 0 && (
                    <ul className="px-glass-strong absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-px-card shadow-[0_10px_30px_rgba(20,20,20,0.16)]">
                      {searchResults.map((p, i) => (
                        <li key={i} className="border-b border-px-ink/10 last:border-b-0">
                          <button
                            type="button"
                            onClick={() => selecionarPaciente(p)}
                            className="w-full px-4 py-2.5 text-left text-[13px] text-px-ink hover:bg-px-ink/[0.06]"
                          >
                            <span className="font-medium">{getPacNome(p)}</span>
                            {getPacId(p) && <span className="ml-2 text-[12px] text-px-muted">#{getPacId(p)}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {searchLoading && <p role="status" className="mt-1.5 text-[12px] text-px-muted">Buscando pacientes</p>}
              </Field>

              <div>
                <p className="mb-1.5 text-[12.5px] font-medium text-px-muted">Tipo de trilha</p>
                <Segmented
                  label="Tipo de trilha"
                  value={tipoTrilha}
                  onChange={setTipoTrilha}
                  options={[
                    { value: "pre_consulta", label: TIPO_LABELS.pre_consulta },
                    { value: "pos_consulta", label: TIPO_LABELS.pos_consulta },
                  ]}
                />
                <p className="mt-1.5 text-[12px] text-px-muted">{TIPO_DESC[tipoTrilha]}</p>
              </div>

              {tipoTrilha === "pre_consulta" && (
                <Field label="Link de anamnese (MedX, opcional)" htmlFor="nut-link">
                  <PxInput id="nut-link" value={linkAnamnese} onChange={e => setLinkAnamnese(e.target.value)} placeholder="https://app.medx.com.br/..." />
                </Field>
              )}

              <Field label="Contexto clínico (opcional)" htmlFor="nut-ctx">
                <textarea
                  id="nut-ctx"
                  value={contexto}
                  onChange={e => setContexto(e.target.value)}
                  rows={3}
                  placeholder="Ex.: hipotireoidismo, reposição hormonal, objetivo de emagrecimento"
                  className={areaCls}
                />
              </Field>

              {genError && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{genError}</p>}

              <PxButton fullWidth leftIcon={Sparkles} onClick={gerar} loading={generating} disabled={!nomePaciente.trim()}>
                {generating ? "Gerando mensagens" : "Gerar trilha"}
              </PxButton>
            </Panel>

            {mensagens && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-px-ink">Prévia da trilha</h2>
                    <p className="mt-0.5 text-[12.5px] text-px-muted">{mensagens.length} mensagens, {TIPO_LABELS[tipoTrilha].toLowerCase()}</p>
                  </div>
                  <PxButton size="sm" leftIcon={Save} onClick={salvar} loading={saving}>
                    {saving ? "Salvando" : "Salvar trilha"}
                  </PxButton>
                </div>

                <div className="space-y-2">
                  {mensagens.map((m, i) => (
                    <Panel key={i} as="article" className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Tag>{m.timing}</Tag>
                          <h3 className="text-[13px] font-semibold text-px-ink">{m.titulo}</h3>
                        </div>
                        <CopyBtn text={m.texto} label={`Copiar mensagem ${m.titulo}`} />
                      </div>
                      <p className="line-clamp-4 whitespace-pre-wrap text-[13px] leading-relaxed text-px-ink/75">{m.texto}</p>
                    </Panel>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Trilhas cadastradas ──────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[16px] font-semibold text-px-ink">Trilhas cadastradas</h2>
              <span className="text-[12.5px] text-px-muted">{trilhas.length} {trilhas.length === 1 ? "trilha" : "trilhas"}</span>
            </div>

            {loadingList ? (
              <div className="space-y-2" aria-busy="true" aria-label="Carregando trilhas">
                {[1, 2, 3].map(i => <div key={i} className="px-glass h-[76px] animate-pulse rounded-px-panel" />)}
              </div>
            ) : listError ? (
              <Panel className="py-10 text-center">
                <p className="mb-3 text-[14px] text-px-ink">Não foi possível carregar as trilhas.</p>
                <PxButton variant="secondary" onClick={fetchTrilhas}>Tentar de novo</PxButton>
              </Panel>
            ) : trilhas.length === 0 ? (
              <Panel className="py-12 text-center">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-px-muted" aria-hidden="true" />
                <p className="text-[14px] font-medium text-px-ink">Nenhuma trilha cadastrada</p>
                <p className="mt-1 text-[13px] text-px-muted">Crie a primeira trilha no painel ao lado.</p>
              </Panel>
            ) : (
              <div className="space-y-2">
                {trilhas.map(trilha => {
                  const isExpanded = expandedId === trilha.id
                  const msgs       = Array.isArray(trilha.mensagens) ? trilha.mensagens : []
                  const status     = STATUS_OPTIONS.includes(trilha.status) ? trilha.status : "ativa"

                  return (
                    <Panel key={trilha.id} as="article" className="overflow-hidden p-0">
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedId(isExpanded ? null : trilha.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block truncate text-[14px] font-semibold text-px-ink">{trilha.nome_paciente}</span>
                          <span className="mt-0.5 block text-[12.5px] text-px-muted">
                            {TIPO_LABELS[trilha.tipo_trilha]}{trilha.criado_em ? `, ${fmtDate(trilha.criado_em)}` : ""}
                          </span>
                        </button>

                        <div className="flex shrink-0 items-center gap-2">
                          <Tag tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Tag>
                          <PxSelect
                            aria-label={`Alterar status da trilha de ${trilha.nome_paciente}`}
                            value={status}
                            disabled={updatingId === trilha.id}
                            onChange={e => atualizarStatus(trilha, e.target.value)}
                            className="h-9 w-[7.5rem] text-[12.5px]"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{STATUS_META[s]?.label ?? s}</option>
                            ))}
                          </PxSelect>
                          {msgs.length > 0 && (
                            <button
                              type="button"
                              aria-label={isExpanded ? "Recolher mensagens" : "Ver mensagens"}
                              onClick={() => setExpandedId(isExpanded ? null : trilha.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-full text-px-ink hover:bg-px-ink/10"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && msgs.length > 0 && (
                        <div className="space-y-2 border-t border-px-ink/10 bg-px-ink/[0.03] px-4 pb-4 pt-3">
                          <p className="mb-2 text-[12.5px] font-medium text-px-muted">Mensagens ({msgs.length})</p>
                          {msgs.map((m, i) => (
                            <div key={i} className="space-y-1.5 rounded-px-card bg-white/70 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <Tag>{m.timing}</Tag>
                                  <span className="truncate text-[13px] font-medium text-px-ink">{m.titulo}</span>
                                </div>
                                <CopyBtn text={m.texto} label={`Copiar mensagem ${m.titulo}`} />
                              </div>
                              <p className="line-clamp-3 text-[12.5px] leading-relaxed text-px-ink/75">{m.texto}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Panel>
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
