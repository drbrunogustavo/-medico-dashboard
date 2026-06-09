"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  GitBranch, Sparkles, Loader2, Check,
  Copy, MessageSquare, Video, LayoutGrid, BookOpen,
  ChevronDown, ChevronUp, RefreshCw, Save,
  Users, TrendingUp, CheckCircle2, Pause,
  AlertCircle, Smartphone, FileText,
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

function DayBadge({ dia }: { dia: number }) {
  return (
    <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400">
      D{dia}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.ativa
  return (
    <span className={cn("flex items-center gap-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", m.badge)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", m.dot)} />
      {m.label}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NutricaoLeadsPage() {

  // Leads list
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [updatingId,  setUpdatingId]  = useState<string | null>(null)

  // Form
  const [nome,      setNome]      = useState("")
  const [perfil,    setPerfil]    = useState("")
  const [interesse, setInteresse] = useState<Interesse>("Emagrecimento")
  const [duracao,   setDuracao]   = useState<7 | 15 | 30>(15)

  // Generation
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState("")
  const [trilha,     setTrilha]     = useState<ItemTrilha[] | null>(null)

  // Saving
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState<{ msg: string; type: "success" | "error" } | null>(null)

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
    } catch { /* ignore */ }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

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

  // ── Save trilha ───────────────────────────────────────────────────────────────

  const salvar = async () => {
    if (!trilha) return
    setSaving(true)
    try {
      const perfilCompleto = nome.trim() ? `${nome.trim()}\n\n${perfil.trim()}` : perfil.trim()
      const res = await fetch("/api/nutricao-leads?action=salvar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ perfil: perfilCompleto, interesse, duracaoDias: duracao, trilha }),
      })
      const data = await res.json() as { error?: string }
      if (data.error) throw new Error(data.error)
      showToast("Trilha salva com sucesso! Lead ativo.")
      setTrilha(null)
      setNome(""); setPerfil("")
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
    } catch { /* ignore */ }
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
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  Perfil do Lead *
                </label>
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
                  "w-full flex items-center justify-center gap-2 text-[12px] font-semibold rounded-xl py-3 transition-all",
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <DayBadge dia={item.dia} />
                            <span className={cn(
                              "flex items-center gap-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border",
                              meta.badge
                            )}>
                              <Icon className="w-2.5 h-2.5" />
                              {item.tipo}
                            </span>
                            {/* Canal badge */}
                            <span className={cn(
                              "flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border",
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
                          {item.ehMensagem && <CopyBtn text={item.texto} />}
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
                  <div key={i} className="h-[76px] rounded-xl bg-surface border border-border shimmer" />
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
                                "appearance-none text-[9px] font-mono font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer",
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
                          <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2">
                            Trilha · {trilhaItems.length} pontos
                          </div>
                          {trilhaItems.map((item, i) => {
                            const meta = getMeta(item.tipo)
                            const Icon = meta.icon
                            const canal = meta.canal
                            return (
                              <div key={i} className="bg-surface border border-border rounded-lg p-3 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
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
                                  {item.ehMensagem && <CopyBtn text={item.texto} />}
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
