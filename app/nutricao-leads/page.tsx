"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Panel, PxButton, Tag, Field, PxInput, PxSelect, Segmented, PageHeader } from "@/components/px"
import { Toast } from "@/components/Toast"
import {
  Sparkles, Check, Copy, MessageSquare, Video, LayoutGrid, BookOpen,
  ChevronDown, ChevronUp, RefreshCw, Save, Send, GitBranch,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ItemTrilha {
  dia:         number
  tipo:        string
  titulo:      string
  texto:       string
  ehMensagem?: boolean
}

interface Lead {
  id:           string
  perfil:       string
  interesse:    string
  duracao_dias: number
  telefone?:    string | null
  status:       string
  trilha:       ItemTrilha[] | null
  criado_em?:   string
}

// ── Constantes ────────────────────────────────────────────────────────────────

const INTERESSES = ["Emagrecimento", "Estética", "Saúde geral", "Cirurgia", "Outro"] as const
type Interesse = typeof INTERESSES[number]

type Tone = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  ativa:     { label: "Ativa",     tone: "ok"      },
  pausada:   { label: "Pausada",   tone: "warn"    },
  concluida: { label: "Concluída", tone: "ink"     },
  cancelada: { label: "Cancelada", tone: "danger"  },
  // linhas antigas
  aquecendo:        { label: "Aquecendo",      tone: "warn"    },
  consultou:        { label: "Consultou",      tone: "ink"     },
  "nao-respondeu":  { label: "Não respondeu",  tone: "danger"  },
  desqualificado:   { label: "Desqualificado", tone: "neutral" },
}

const STATUS_OPTIONS = ["ativa", "pausada", "concluida", "cancelada"]

const TIPO_META: Record<string, { icon: React.ElementType; canal: string }> = {
  Story:     { icon: LayoutGrid,    canal: "Conteúdo" },
  Vídeo:     { icon: Video,         canal: "Conteúdo" },
  Carrossel: { icon: BookOpen,      canal: "Conteúdo" },
  Mensagem:  { icon: MessageSquare, canal: "WhatsApp" },
}

function getMeta(tipo: string) {
  return TIPO_META[tipo] ?? TIPO_META.Mensagem
}

function extractNome(perfil: string): string {
  const first = perfil.split("\n")[0].trim()
  return first.length > 60 ? first.slice(0, 57) + "…" : first || "—"
}

function fmtDate(s?: string): string {
  if (!s) return ""
  return s.slice(0, 10).split("-").reverse().join("/")
}

const DURACOES = [
  { value: "7",  label: "7 dias"  },
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
]

// ── Subcomponentes ────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <PxButton
      size="sm"
      variant="secondary"
      leftIcon={done ? Check : Copy}
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800) }}
    >
      {done ? "Copiado" : "Copiar"}
    </PxButton>
  )
}

function EnviarBtn({
  text, phone, sendKey, sendingKey, onSend,
}: {
  text: string; phone: string; sendKey: string
  sendingKey: string | null
  onSend: (phone: string, message: string, key: string) => void
}) {
  const isLoading = sendingKey === sendKey
  const hasPhone  = phone.trim().length > 0
  return (
    <PxButton
      size="sm"
      variant="secondary"
      leftIcon={Send}
      loading={isLoading}
      disabled={isLoading || !hasPhone}
      onClick={() => onSend(phone, text, sendKey)}
      aria-label={hasPhone ? "Enviar pelo WhatsApp" : "Informe o WhatsApp para enviar"}
    >
      {isLoading ? "Enviando" : "Enviar"}
    </PxButton>
  )
}

function ItemTrilhaCard({ item, phone, sendKey, sendingKey, onSend }: {
  item: ItemTrilha; phone: string; sendKey: string
  sendingKey: string | null
  onSend: (phone: string, message: string, key: string) => void
}) {
  const meta = getMeta(item.tipo)
  const Icon = meta.icon
  return (
    <li className="rounded-px-card border border-px-line bg-white/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag tone="ink">D{item.dia}</Tag>
          <Tag><Icon className="mr-1 h-3 w-3" aria-hidden />{item.tipo}</Tag>
          <span className="text-[12px] text-px-muted">{meta.canal}</span>
        </div>
        {item.ehMensagem && (
          <div className="flex shrink-0 items-center gap-1.5">
            <CopyBtn text={item.texto} />
            <EnviarBtn text={item.texto} phone={phone} sendKey={sendKey} sendingKey={sendingKey} onSend={onSend} />
          </div>
        )}
      </div>
      <p className="mt-2.5 text-[13.5px] font-semibold text-px-ink">{item.titulo}</p>
      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-px-ink/80">{item.texto}</p>
    </li>
  )
}

export default function NutricaoLeadsPage() {
  const searchParams = useSearchParams()
  const prefillDone  = useRef(false)

  // Leads list
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [updatingId,  setUpdatingId]  = useState<string | null>(null)

  // Form
  const [nome,      setNome]      = useState("")
  const [perfil,    setPerfil]    = useState("")
  const [telefone,  setTelefone]  = useState("")
  const [interesse, setInteresse] = useState<Interesse>("Emagrecimento")
  const [duracao,   setDuracao]   = useState<7 | 15 | 30>(15)

  // Generation
  const [generating,      setGenerating]      = useState(false)
  const [genError,        setGenError]        = useState("")
  const [trilha,          setTrilha]          = useState<ItemTrilha[] | null>(null)
  const [suggestingPerfil, setSuggestingPerfil] = useState(false)

  // Pre-fill form from CRM lead via ?lead_id=
  useEffect(() => {
    const leadId = searchParams.get("lead_id")
    if (!leadId || prefillDone.current) return
    prefillDone.current = true
    fetch(`/api/crm/${leadId}`)
      .then(r => r.ok ? r.json() : null)
      .then((lead: { nome?: string; telefone?: string | null; observacoes?: string | null } | null) => {
        if (!lead) return
        if (lead.nome)       setNome(lead.nome)
        if (lead.telefone)   setTelefone(lead.telefone)
        if (lead.observacoes) setPerfil(lead.observacoes)
      })
      .catch(e => console.error("[nutricao-leads] erro ao carregar dados do lead:", e))
  }, [searchParams])

  // Saving
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState<{ msg: string; type: "success" | "error" } | null>(null)

  // WhatsApp send
  const [sendingKey,  setSendingKey]  = useState<string | null>(null)
  const [leadPhones,  setLeadPhones]  = useState<Record<string, string>>({}) // phone overrides per lead

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch leads ──────────────────────────────────────────────────────────────

  const fetchLeads = useCallback(async () => {
    setLoadingList(true)
    try {
      const res  = await fetch("/api/nutricao-leads")
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch (e) { console.error("[nutricao-leads] erro ao carregar leads:", e) }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // ── Sugerir perfil com IA ─────────────────────────────────────────────────────

  const sugerirPerfil = async () => {
    if (!nome.trim()) return
    setSuggestingPerfil(true)
    try {
      const r = await fetch("/api/nutricao-leads?action=sugerir-perfil", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nome, interesse }),
      })
      const d = await r.json() as { sugestao?: string }
      if (d.sugestao) setPerfil(d.sugestao)
    } finally {
      setSuggestingPerfil(false)
    }
  }

  // ── Generate trilha ───────────────────────────────────────────────────────────

  const gerar = async () => {
    if (!perfil.trim()) return
    setGenerating(true)
    setGenError("")
    setTrilha(null)
    try {
      const perfilCompleto = nome.trim() ? `${nome.trim()}\n\n${perfil.trim()}` : perfil.trim()
      const res  = await fetch("/api/nutricao-leads?action=gerar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ perfil: perfilCompleto, interesse, duracaoDias: duracao }),
      })
      const data = await res.json() as { trilha?: ItemTrilha[]; error?: string }
      if (data.error) throw new Error(data.error)
      setTrilha(data.trilha ?? [])
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e))
    } finally {
      setGenerating(false)
    }
  }

  // ── Enviar mensagem via Z-API ─────────────────────────────────────────────────

  const enviarMensagem = async (phone: string, message: string, key: string) => {
    const phoneClean = phone.replace(/\D/g, "")
    if (!phoneClean) {
      showToast("Informe o número do WhatsApp (com DDI, ex: 5535999999999).", "error")
      return
    }
    setSendingKey(key)
    try {
      const res = await fetch("/api/zapi/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: phoneClean, message }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (data.error) throw new Error(data.error)
      showToast("Mensagem enviada pelo WhatsApp!")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao enviar", "error")
    } finally {
      setSendingKey(null)
    }
  }

  // ── Save trilha ───────────────────────────────────────────────────────────────

  const salvar = async () => {
    if (!trilha) return
    setSaving(true)
    try {
      const perfilCompleto = nome.trim() ? `${nome.trim()}\n\n${perfil.trim()}` : perfil.trim()
      const res = await fetch("/api/nutricao-leads?action=salvar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ perfil: perfilCompleto, interesse, duracaoDias: duracao, telefone: telefone.trim() || null, trilha }),
      })
      const data = await res.json() as { error?: string }
      if (data.error) throw new Error(data.error)
      showToast("Trilha salva com sucesso! Lead ativo.")
      setTrilha(null)
      setNome(""); setPerfil(""); setTelefone("")
      fetchLeads()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao salvar", "error")
    } finally {
      setSaving(false)
    }
  }

  // ── Update status ─────────────────────────────────────────────────────────────

  const atualizarStatus = async (lead: Lead, novoStatus: string) => {
    if (novoStatus === lead.status) return
    setUpdatingId(lead.id)
    try {
      await fetch("/api/nutricao-leads?action=status", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: lead.id, status: novoStatus }),
      })
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: novoStatus } : l))
    } catch (e) { console.error("[nutricao-leads] erro ao atualizar status do lead:", e) }
    finally { setUpdatingId(null) }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const ativas     = leads.filter(l => l.status === "ativa"     || l.status === "aquecendo").length
  const concluidas = leads.filter(l => l.status === "concluida" || l.status === "consultou").length
  const taxa       = leads.length > 0 ? Math.round((concluidas / leads.length) * 100) : 0

  const DURACAO_DESC: Record<number, string> = {
    7:  "D1 · D3 · D5 · D7",
    15: "D1 · D3 · D5 · D7 · D10 · D14",
    30: "D1 · D3 · D5 · D7 · D10 · D14 · D21 · D30",
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Nutrição"
        caption="Trilhas de conteúdo e mensagens para futuros pacientes"
        actions={
          <PxButton variant="secondary" leftIcon={RefreshCw} loading={loadingList} onClick={fetchLeads}>
            Atualizar
          </PxButton>
        }
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel tone="dark">
          <dl className="grid grid-cols-2 gap-4 text-white md:grid-cols-4">
            <div>
              <dt className="text-[12px] text-white/80">Leads cadastrados</dt>
              <dd className="mt-1 text-[34px] font-semibold leading-none tabular-nums">{leads.length}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-white/80">Em nutrição</dt>
              <dd className="mt-1 text-[34px] font-semibold leading-none tabular-nums">{ativas}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-white/80">Concluídas</dt>
              <dd className="mt-1 text-[34px] font-semibold leading-none tabular-nums">{concluidas}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-white/80">Taxa de conclusão</dt>
              <dd className="mt-1 text-[34px] font-semibold leading-none tabular-nums">{taxa}%</dd>
            </div>
          </dl>
        </Panel>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[2fr_3fr]">

          {/* Criar trilha */}
          <div className="space-y-4">
            <Panel tone="light">
              <h2 className="text-[16px] font-semibold text-px-ink">Criar trilha</h2>
              <p className="mb-4 mt-0.5 text-[13px] text-px-muted">Descreva o perfil e gere a sequência de conteúdo e mensagens.</p>

              <div className="space-y-4">
                <Field label="Nome do lead" htmlFor="nl-nome">
                  <PxInput id="nl-nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Ana Souza" />
                </Field>

                <Field label="WhatsApp" htmlFor="nl-tel" hint="Com DDI, por exemplo 5535999999999">
                  <PxInput id="nl-tel" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="5535999999999" inputMode="tel" />
                </Field>

                <div>
                  <span className="mb-1.5 block text-[12.5px] font-medium text-px-muted">Interesse principal</span>
                  <Segmented
                    label="Interesse principal"
                    value={interesse}
                    onChange={v => setInteresse(v as Interesse)}
                    options={INTERESSES.map(i => ({ value: i, label: i }))}
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="nl-perfil" className="text-[12.5px] font-medium text-px-muted">Perfil do lead *</label>
                    <PxButton size="sm" variant="quiet" leftIcon={Sparkles} loading={suggestingPerfil} disabled={suggestingPerfil || !nome.trim()} onClick={sugerirPerfil}>
                      {suggestingPerfil ? "Sugerindo" : "Sugerir com IA"}
                    </PxButton>
                  </div>
                  <textarea
                    id="nl-perfil"
                    value={perfil}
                    onChange={e => setPerfil(e.target.value)}
                    rows={4}
                    placeholder="Ex: mulher, 42 anos, executiva, comentou no Reel sobre fadiga crônica e demonstrou interesse em consulta."
                    className="w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-px-ink placeholder:text-px-muted"
                  />
                </div>

                <div>
                  <span className="mb-1.5 block text-[12.5px] font-medium text-px-muted">Duração da trilha</span>
                  <Segmented
                    label="Duração da trilha"
                    value={String(duracao)}
                    onChange={v => setDuracao(Number(v) as 7 | 15 | 30)}
                    options={DURACOES}
                  />
                  <p className="mt-1.5 text-[12px] text-px-muted">Pontos de contato: {DURACAO_DESC[duracao]}</p>
                </div>

                {genError && (
                  <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{genError}</p>
                )}

                <PxButton fullWidth leftIcon={Sparkles} loading={generating} disabled={generating || !perfil.trim()} onClick={gerar}>
                  {generating ? "Gerando trilha" : "Gerar trilha"}
                </PxButton>
                {generating && (
                  <p className="text-center text-[12px] text-px-muted">A geração leva de 30 a 60 segundos. Não feche a página.</p>
                )}
              </div>
            </Panel>

            {trilha && (
              <Panel tone="light">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-semibold text-px-ink">Prévia da trilha</h2>
                    <p className="text-[12px] text-px-muted">{trilha.length} pontos em {duracao} dias</p>
                  </div>
                  <PxButton leftIcon={Save} loading={saving} disabled={saving} onClick={salvar}>
                    {saving ? "Salvando" : "Salvar trilha"}
                  </PxButton>
                </div>
                <ul className="space-y-2">
                  {trilha.map((item, i) => (
                    <ItemTrilhaCard key={i} item={item} phone={telefone} sendKey={`preview-${i}`} sendingKey={sendingKey} onSend={enviarMensagem} />
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          {/* Leads cadastrados */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-[16px] font-semibold text-px-ink">Leads cadastrados</h2>
              <span className="text-[12px] text-px-muted">{leads.length} {leads.length === 1 ? "lead" : "leads"}</span>
            </div>

            {loadingList ? (
              <div className="space-y-3" aria-busy="true">
                {[1, 2, 3].map(i => <div key={i} className="px-glass h-[72px] animate-pulse rounded-px-panel" />)}
              </div>
            ) : leads.length === 0 ? (
              <Panel tone="light" className="py-12 text-center">
                <p className="text-[14px] text-px-ink">Nenhum lead cadastrado.</p>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-px-muted">Crie a primeira trilha no painel ao lado.</p>
              </Panel>
            ) : (
              <ul className="space-y-3">
                {leads.map(lead => {
                  const isExpanded  = expandedId === lead.id
                  const nomeLead    = extractNome(lead.perfil)
                  const trilhaItems = Array.isArray(lead.trilha) ? lead.trilha : []
                  const st          = STATUS_META[lead.status] ?? STATUS_META.ativa

                  return (
                    <li key={lead.id}>
                      <Panel tone="light" className="overflow-hidden p-0">
                        <div className="flex items-center gap-3 px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                            aria-expanded={isExpanded}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="block truncate text-[14px] font-semibold text-px-ink">{nomeLead}</span>
                            <span className="mt-0.5 block text-[12px] text-px-muted">
                              {lead.interesse} · {lead.duracao_dias} dias{lead.criado_em ? ` · ${fmtDate(lead.criado_em)}` : ""}
                            </span>
                          </button>

                          <div className="flex flex-shrink-0 items-center gap-2">
                            <Tag tone={st.tone}>{st.label}</Tag>
                            <PxSelect
                              aria-label={`Status de ${nomeLead}`}
                              value={STATUS_OPTIONS.includes(lead.status) ? lead.status : "ativa"}
                              disabled={updatingId === lead.id}
                              onChange={e => atualizarStatus(lead, e.target.value)}
                              className="h-9 w-[128px] text-[12.5px]"
                            >
                              {STATUS_OPTIONS.map(o => (
                                <option key={o} value={o}>{STATUS_META[o]?.label ?? o}</option>
                              ))}
                            </PxSelect>
                            {trilhaItems.length > 0 && (
                              <button
                                type="button"
                                aria-label={isExpanded ? "Recolher trilha" : "Ver trilha"}
                                onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-px-muted hover:bg-px-ink/10 hover:text-px-ink"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
                              </button>
                            )}
                          </div>
                        </div>

                        {isExpanded && trilhaItems.length > 0 && (
                          <div className="space-y-3 border-t border-px-line px-5 pb-5 pt-4">
                            <p className="text-[12px] text-px-muted">Trilha com {trilhaItems.length} pontos</p>

                            {!lead.telefone && (
                              <Field label="WhatsApp para envio" htmlFor={`nl-ph-${lead.id}`} hint="Este lead não tem telefone salvo. Informe para habilitar o envio.">
                                <PxInput
                                  id={`nl-ph-${lead.id}`}
                                  value={leadPhones[lead.id] ?? ""}
                                  onChange={e => setLeadPhones(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                  placeholder="5535999999999"
                                  inputMode="tel"
                                />
                              </Field>
                            )}

                            <ul className="space-y-2">
                              {trilhaItems.map((item, i) => (
                                <ItemTrilhaCard
                                  key={i}
                                  item={item}
                                  phone={lead.telefone || leadPhones[lead.id] || ""}
                                  sendKey={`lead-${lead.id}-${i}`}
                                  sendingKey={sendingKey}
                                  onSend={enviarMensagem}
                                />
                              ))}
                            </ul>
                          </div>
                        )}
                      </Panel>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast ? toast.msg : null} type={toast?.type} />
    </div>
  )
}
