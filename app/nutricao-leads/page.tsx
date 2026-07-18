"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  GitBranch, Sparkles, Loader2, Check,
  Copy, MessageSquare, Video, LayoutGrid, BookOpen,
  ChevronDown, ChevronUp, RefreshCw, Save,
  Users, TrendingUp, CheckCircle2,
  AlertCircle, Smartphone, FileText, Send, Phone,
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

// ── Constants ──────────────────────────────────────────────────────────────────

const INTERESSES = ["Emagrecimento", "Estética", "Saúde geral", "Cirurgia", "Outro"] as const
type Interesse = typeof INTERESSES[number]

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  ativa:     { label: "Ativa",     badge: "bg-emerald-500/12 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  pausada:   { label: "Pausada",   badge: "bg-amber-500/12   text-amber-400   border-amber-500/30",   dot: "bg-amber-400"   },
  concluida: { label: "Concluída", badge: "bg-blue-500/12    text-blue-400    border-blue-500/30",    dot: "bg-blue-400"    },
  cancelada: { label: "Cancelada", badge: "bg-red-500/12     text-red-400     border-red-500/30",     dot: "bg-red-400"     },
  // backward-compat for older rows
  aquecendo:      { label: "Aquecendo",      badge: "bg-amber-500/12  text-amber-400  border-amber-500/30", dot: "bg-amber-400"   },
  consultou:      { label: "Consultou",      badge: "bg-blue-500/12   text-blue-400   border-blue-500/30",  dot: "bg-blue-400"    },
  "nao-respondeu":{ label: "Não respondeu",  badge: "bg-red-500/12    text-red-400    border-red-500/30",   dot: "bg-red-400"     },
  desqualificado: { label: "Desqualificado", badge: "bg-surface-2 text-text-muted border-border",          dot: "bg-text-muted"  },
}

const STATUS_OPTIONS = ["ativa", "pausada", "concluida", "cancelada"]

const TIPO_META: Record<string, { icon: React.ElementType; badge: string; canal: string }> = {
  Story:     { icon: LayoutGrid,    badge: "bg-amber-500/12  text-amber-400  border-amber-500/30",  canal: "Conteúdo"  },
  Vídeo:     { icon: Video,         badge: "bg-purple-500/12 text-purple-400 border-purple-500/30", canal: "Conteúdo"  },
  Carrossel: { icon: BookOpen,      badge: "bg-indigo-500/12 text-indigo-400 border-indigo-500/30", canal: "Conteúdo"  },
  Mensagem:  { icon: MessageSquare, badge: "bg-blue-500/12   text-blue-400   border-blue-500/30",   canal: "WhatsApp"  },
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

// ── Subcomponents ─────────────────────────────────────────────────────────────

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800) }}
      className={cn(
        "flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all",
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

function EnviarBtn({
  text, phone, sendKey, sendingKey, onSend, className,
}: {
  text: string; phone: string; sendKey: string
  sendingKey: string | null
  onSend: (phone: string, message: string, key: string) => void
  className?: string
}) {
  const isLoading = sendingKey === sendKey
  const hasPhone  = phone.trim().length > 0
  return (
    <button
      disabled={isLoading || !hasPhone}
      onClick={() => onSend(phone, text, sendKey)}
      title={!hasPhone ? "Informe o WhatsApp antes de enviar" : "Enviar via WhatsApp"}
      className={cn(
        "flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all",
        isLoading
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-wait"
          : !hasPhone
            ? "border-border text-text-muted/40 cursor-not-allowed"
            : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
        className,
      )}
    >
      {isLoading
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : <Send    className="w-3 h-3" />}
      {isLoading ? "Enviando…" : "Enviar"}
    </button>
  )
}

function DayBadge({ dia }: { dia: number }) {
  return (
    <span className="text-badge font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400">
      D{dia}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.ativa
  return (
    <span className={cn("flex items-center gap-1 text-badge font-mono font-semibold px-2 py-0.5 rounded-full border", m.badge)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", m.dot)} />
      {m.label}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
      showToast("✓ Mensagem enviada pelo WhatsApp!")
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
      <TopBar
        title="Nutrição de Leads"
        subtitle="ALA CLÍNICA · TRILHAS DE CONVERSÃO"
        tagline="Mantenha o relacionamento com futuros pacientes com trilhas de conteúdo personalizadas."
        actions={
          <button
            onClick={fetchLeads}
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
          <StatCard label="Total Leads"  value={leads.length} sub="cadastrados"   icon={Users}        accent="blue"  />
          <StatCard label="Ativas"       value={ativas}        sub="em nutrição"   icon={GitBranch}    accent="green" />
          <StatCard label="Concluídas"   value={concluidas}    sub="convertidas"   icon={CheckCircle2} accent="blue"  />
          <StatCard label="Taxa"         value={`${taxa}%`}    sub="de conversão"  icon={TrendingUp}   accent="amber" />
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 items-start">

          {/* ── LEFT: Criar Trilha ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div>
              <h2
                className="text-[15px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Criar Trilha
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                Preencha o perfil e gere uma sequência de conteúdo e mensagens.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">

              {/* Nome */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  Nome do Lead
                </label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Ana Souza"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  WhatsApp <span className="normal-case text-text-muted/60">(com DDI, ex: 5535999999999)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
                  <input
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    placeholder="5535999999999"
                    className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-emerald-500/40 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Interesse */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  Interesse Principal
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INTERESSES.map(i => (
                    <button
                      key={i}
                      onClick={() => setInteresse(i)}
                      className={cn(
                        "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                        interesse === i
                          ? "bg-blue-500/12 border-blue-500/30 text-blue-400 font-medium"
                          : "border-border text-text-muted hover:text-text-secondary"
                      )}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Perfil */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                    Perfil do Lead *
                  </label>
                  <button
                    type="button"
                    onClick={sugerirPerfil}
                    disabled={suggestingPerfil || !nome.trim()}
                    className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors"
                  >
                    {suggestingPerfil
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Sugerindo...</>
                      : <><Sparkles className="w-3 h-3" /> Sugerir com IA</>}
                  </button>
                </div>
                <textarea
                  value={perfil}
                  onChange={e => setPerfil(e.target.value)}
                  rows={4}
                  placeholder="Ex: Mulher, 42 anos, executiva, acompanha conteúdo sobre hormônios e bem-estar. Comentou no Reel sobre fadiga crônica e demonstrou interesse em consulta..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors leading-relaxed"
                />
              </div>

              {/* Duração */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  Duração da Trilha
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([7, 15, 30] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDuracao(d)}
                      className={cn(
                        "py-2.5 rounded-xl text-[11px] font-medium border transition-all",
                        duracao === d
                          ? "bg-blue-500/12 border-blue-500/30 text-blue-400"
                          : "border-border text-text-muted hover:border-border-hover"
                      )}
                    >
                      <div className="font-semibold">{d} dias</div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted mt-1.5 px-0.5">
                  {DURACAO_DESC[duracao]}
                </p>
              </div>

              {genError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{genError}</span>
                </div>
              )}

              <button
                onClick={gerar}
                disabled={generating || !perfil.trim()}
                className={cn(
                  "w-full flex items-center justify-center gap-2 text-[14px] font-semibold rounded-xl py-3 min-h-[44px] transition-all",
                  generating
                    ? "bg-blue-500/10 border border-blue-500/30 text-blue-400 cursor-wait"
                    : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
                )}
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando trilha...</>
                  : <><Sparkles className="w-4 h-4" /> Gerar Trilha</>
                }
              </button>
              {generating && (
                <p className="text-center text-[10px] text-text-muted mt-1.5">
                  A geração pode levar 30–60 segundos. Não feche a página.
                </p>
              )}
            </div>

            {/* Generated preview */}
            {trilha && (
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
                      {trilha.length} pontos · {duracao} dias
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
                  {trilha.map((item, i) => {
                    const meta  = getMeta(item.tipo)
                    const Icon  = meta.icon
                    const canal = meta.canal
                    return (
                      <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <DayBadge dia={item.dia} />
                            <span className={cn(
                              "flex items-center gap-1 text-badge font-mono font-semibold px-2 py-0.5 rounded-full border",
                              meta.badge
                            )}>
                              <Icon className="w-2.5 h-2.5" />
                              {item.tipo}
                            </span>
                            {/* Canal badge */}
                            <span className={cn(
                              "flex items-center gap-1 text-badge font-mono px-2 py-0.5 rounded-full border",
                              canal === "WhatsApp"
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                : "bg-surface-2 border-border text-text-muted"
                            )}>
                              {canal === "WhatsApp"
                                ? <Smartphone className="w-2.5 h-2.5" />
                                : <FileText    className="w-2.5 h-2.5" />}
                              {canal}
                            </span>
                          </div>
                          {item.ehMensagem && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <CopyBtn text={item.texto} />
                              <EnviarBtn
                                text={item.texto}
                                phone={telefone}
                                sendKey={`preview-${i}`}
                                sendingKey={sendingKey}
                                onSend={enviarMensagem}
                              />
                            </div>
                          )}
                        </div>
                        {/* Title */}
                        <div className="text-[11px] font-semibold text-text-primary">{item.titulo}</div>
                        {/* Body */}
                        <p className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                          {item.texto}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Leads Cadastrados ─────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className="text-[15px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Leads Cadastrados
              </h2>
              <span className="text-[10px] font-mono text-text-muted">
                {leads.length} {leads.length === 1 ? "lead" : "leads"}
              </span>
            </div>

            {loadingList ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-surface border border-border rounded-xl px-4 py-3.5 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-2 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-surface-2 rounded w-3/4" />
                        <div className="h-2.5 bg-surface-2 rounded w-1/2" />
                      </div>
                      <div className="h-5 w-12 bg-surface-2 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <EmptyState
                icon={GitBranch}
                title="Nenhum lead cadastrado"
                subtitle="Crie a primeira trilha de nutrição no painel ao lado."
              />
            ) : (
              <div className="space-y-2">
                {leads.map(lead => {
                  const isExpanded  = expandedId === lead.id
                  const nomeLead    = extractNome(lead.perfil)
                  const trilhaItems = Array.isArray(lead.trilha) ? lead.trilha : []

                  return (
                    <div
                      key={lead.id}
                      className="bg-surface border border-border rounded-xl overflow-hidden transition-all hover:border-blue-500/20"
                    >
                      {/* Card header */}
                      <div className="px-4 py-3.5 flex items-center gap-3">

                        {/* Icon */}
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                        </div>

                        {/* Info */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="text-[12px] font-medium text-text-primary truncate">
                            {nomeLead}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-text-muted">{lead.interesse}</span>
                            <span className="text-[10px] text-text-muted">·</span>
                            <span className="text-[10px] text-text-muted">{lead.duracao_dias}d</span>
                            {lead.criado_em && (
                              <>
                                <span className="text-[10px] text-text-muted">·</span>
                                <span className="text-[10px] text-text-muted font-mono">{fmtDate(lead.criado_em)}</span>
                              </>
                            )}
                          </div>
                        </button>

                        {/* Status select */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {updatingId === lead.id ? (
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                          ) : (
                            <select
                              value={STATUS_OPTIONS.includes(lead.status) ? lead.status : "ativa"}
                              onChange={e => atualizarStatus(lead, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className={cn(
                                "appearance-none text-badge font-mono font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer",
                                (STATUS_META[lead.status] ?? STATUS_META.ativa).badge
                              )}
                              style={{ background: "transparent" }}
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{STATUS_META[s]?.label ?? s}</option>
                              ))}
                            </select>
                          )}

                          {/* Expand toggle */}
                          {trilhaItems.length > 0 && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
                            >
                              {isExpanded
                                ? <ChevronUp   className="w-3.5 h-3.5" />
                                : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded trilha */}
                      {isExpanded && trilhaItems.length > 0 && (
                        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2 bg-surface-2">
                          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
                            Trilha · {trilhaItems.length} pontos
                          </div>

                          {/* Phone override — shown only when lead has no stored phone */}
                          {!lead.telefone && (
                            <div className="flex items-center gap-2 mb-3">
                              <Phone className="w-3 h-3 text-text-muted flex-shrink-0" />
                              <input
                                value={leadPhones[lead.id] ?? ""}
                                onChange={e => setLeadPhones(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                placeholder="WhatsApp para envio (5535999999999)"
                                className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:border-emerald-500/40 outline-none"
                              />
                            </div>
                          )}

                          {trilhaItems.map((item, i) => {
                            const meta  = getMeta(item.tipo)
                            const Icon  = meta.icon
                            const canal = meta.canal
                            const phone = lead.telefone || leadPhones[lead.id] || ""
                            return (
                              <div key={i} className="bg-surface border border-border rounded-lg p-3 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    <DayBadge dia={item.dia} />
                                    <span className={cn(
                                      "flex items-center gap-1 text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded-full border",
                                      meta.badge
                                    )}>
                                      <Icon className="w-2 h-2" />
                                      {item.tipo}
                                    </span>
                                    <span className={cn(
                                      "flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded-full border",
                                      canal === "WhatsApp"
                                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                        : "bg-surface-2 border-border text-text-muted"
                                    )}>
                                      {canal === "WhatsApp"
                                        ? <Smartphone className="w-2 h-2" />
                                        : <FileText    className="w-2 h-2" />}
                                      {canal}
                                    </span>
                                  </div>
                                  {item.ehMensagem && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <CopyBtn text={item.texto} />
                                      <EnviarBtn
                                        text={item.texto}
                                        phone={phone}
                                        sendKey={`lead-${lead.id}-${i}`}
                                        sendingKey={sendingKey}
                                        onSend={enviarMensagem}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="text-[11px] font-medium text-text-primary">{item.titulo}</div>
                                <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-3">
                                  {item.texto}
                                </p>
                              </div>
                            )
                          })}
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

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  )
}
