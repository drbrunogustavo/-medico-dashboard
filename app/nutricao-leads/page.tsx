"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { cn } from "@/lib/utils"
import {
  GitBranch, Plus, MessageSquare, Video, LayoutGrid,
  BookOpen, CheckCircle2, Clock, Loader2,
  ChevronDown, X, Copy, Check, Bookmark,
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
  trilha:       ItemTrilha[]
  criado_em?:   string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_OPS = ["aquecendo", "consultou", "nao-respondeu", "desqualificado"]
const STATUS_COLOR: Record<string, string> = {
  "aquecendo":       "bg-amber-500/10   text-amber-400   border-amber-500/25",
  "consultou":       "bg-accent-dim     text-accent      border-accent-border",
  "nao-respondeu":   "bg-red-500/10     text-red-400     border-red-500/25",
  "desqualificado":  "bg-surface-2      text-text-muted  border-border",
}
const STATUS_LABEL: Record<string, string> = {
  "aquecendo":      "Aquecendo",
  "consultou":      "Consultou",
  "nao-respondeu":  "Não respondeu",
  "desqualificado": "Desqualificado",
}

const TIPO_ICON: Record<string, React.ElementType> = {
  Story:     LayoutGrid,
  Vídeo:     Video,
  Carrossel: BookOpen,
  Mensagem:  MessageSquare,
}

const TIPO_COLOR: Record<string, string> = {
  Story:     "bg-amber-500/10   text-amber-400   border-amber-500/25",
  Vídeo:     "bg-purple-500/10  text-purple-400  border-purple-500/25",
  Carrossel: "bg-blue-500/10    text-blue-400    border-blue-500/25",
  Mensagem:  "bg-accent-dim     text-accent      border-accent-border",
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000) }}
      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
    >
      {done ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NutricaoLeadsPage() {
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [loadingList, setLoadingList] = useState(true)

  // Form
  const [perfil,       setPerfil]       = useState("")
  const [interesse,    setInteresse]    = useState("")
  const [duracao,      setDuracao]      = useState(15)
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState("")
  const [gerado,       setGerado]       = useState<ItemTrilha[] | null>(null)
  const [formOpen,     setFormOpen]     = useState(true)
  const [savedOk,      setSavedOk]      = useState(false)
  const [viewLead,     setViewLead]     = useState<Lead | null>(null)
  const [updatingId,   setUpdatingId]   = useState<string | null>(null)

  useEffect(() => { fetchLeads() }, [])

  const fetchLeads = async () => {
    setLoadingList(true)
    try {
      const res  = await fetch("/api/nutricao-leads")
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    finally { setLoadingList(false) }
  }

  const gerar = async () => {
    if (!perfil.trim() || !interesse.trim()) return
    setLoading(true)
    setError("")
    setGerado(null)
    try {
      const res  = await fetch("/api/nutricao-leads?action=gerar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ perfil, interesse, duracaoDias: duracao }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGerado(data.trilha as ItemTrilha[])
      setFormOpen(false)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  const salvar = async () => {
    if (!gerado) return
    setSaving(true)
    try {
      await fetch("/api/nutricao-leads?action=salvar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ perfil, interesse, duracaoDias: duracao, trilha: gerado }),
      })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
      setGerado(null)
      setFormOpen(true)
      setPerfil("")
      setInteresse("")
      fetchLeads()
    } catch (e) { setError(String(e)) }
    finally { setSaving(false) }
  }

  const atualizarStatus = async (lead: Lead, novoStatus: string) => {
    setUpdatingId(lead.id)
    try {
      await fetch("/api/nutricao-leads?action=status", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: lead.id, status: novoStatus }),
      })
      fetchLeads()
    } catch (e) { setError(String(e)) }
    finally { setUpdatingId(null) }
  }

  // Stats
  const aquecendo   = leads.filter(l => l.status === "aquecendo").length
  const consultaram = leads.filter(l => l.status === "consultou").length

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Nutrição de Leads"
        subtitle="ALA CLÍNICA · TRILHAS DE CONTEÚDO"
        actions={
          <button
            onClick={() => { setFormOpen(true); setGerado(null) }}
            className="flex items-center gap-1.5 text-[11px] bg-accent text-background font-semibold rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Lead
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Leads"  value={leads.length}  sub="cadastrados"  icon={GitBranch}  accent="green" />
          <StatCard label="Aquecendo"    value={aquecendo}      sub="em nutrição"  icon={Clock}       accent="amber" />
          <StatCard label="Consultaram"  value={consultaram}    sub="convertidos"  icon={CheckCircle2} accent="blue"  />
          <StatCard label="Taxa"         value={leads.length ? `${Math.round((consultaram/leads.length)*100)}%` : "—"} sub="conversão" icon={GitBranch} accent="green" />
        </div>

        {savedOk && (
          <div className="bg-accent-dim border border-accent-border text-accent rounded-xl px-4 py-2.5 text-[12px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5" /> Lead salvo com trilha ativa!
          </div>
        )}

        {/* Form */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setFormOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-accent" />
              <span className="text-[13px] font-medium text-text-primary">Gerar Trilha de Nutrição</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", formOpen && "rotate-180")} />
          </button>

          {formOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Perfil do Lead</label>
                  <textarea
                    value={perfil}
                    onChange={e => setPerfil(e.target.value)}
                    rows={3}
                    placeholder="Ex: Mulher, 42 anos, executiva, interessada em longevidade, acompanha conteúdo sobre hormônios e bem-estar..."
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Interesse Demonstrado</label>
                  <textarea
                    value={interesse}
                    onChange={e => setInteresse(e.target.value)}
                    rows={3}
                    placeholder="Ex: Comentou no reel sobre fadiga crônica, perguntou sobre exames de tireoide, demonstrou interesse em consulta..."
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Duração da Trilha</label>
                <div className="flex gap-2">
                  {[7, 15, 30].map(d => (
                    <button
                      key={d}
                      onClick={() => setDuracao(d)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[11px] font-medium border transition-all",
                        duracao === d
                          ? "bg-accent-dim border-accent-border text-accent"
                          : "border-border text-text-muted hover:border-border-hover"
                      )}
                    >
                      {d} dias
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 text-[10px] text-text-muted px-1">
                  {duracao === 7  && "D1 → D7: Story, Vídeo, Carrossel, Story"}
                  {duracao === 15 && "D1 → D15: 5 conteúdos + 2 mensagens"}
                  {duracao === 30 && "D1 → D30: 5 conteúdos + 3 mensagens de follow-up"}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">{error}</div>
              )}

              <button
                onClick={gerar}
                disabled={loading || !perfil.trim() || !interesse.trim()}
                className="flex items-center gap-2 bg-accent text-background text-[12px] font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
                {loading ? "Gerando trilha..." : "Gerar Trilha"}
              </button>
            </div>
          )}
        </div>

        {/* Generated trilha */}
        {gerado && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                Trilha Gerada · {duracao} dias
              </div>
              <button
                onClick={salvar}
                disabled={saving}
                className="flex items-center gap-1.5 text-[11px] bg-accent text-background font-semibold rounded-lg px-3 py-1.5 hover:opacity-90"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
                Salvar Lead
              </button>
            </div>
            <div className="space-y-2">
              {gerado.map((item, i) => {
                const Icon = TIPO_ICON[item.tipo] ?? MessageSquare
                return (
                  <div key={i} className="bg-surface border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-muted">DIA {item.dia}</span>
                        <span className={cn("flex items-center gap-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", TIPO_COLOR[item.tipo] ?? TIPO_COLOR.Mensagem)}>
                          <Icon className="w-2.5 h-2.5" />
                          {item.tipo.toUpperCase()}
                        </span>
                      </div>
                      {item.ehMensagem && <CopyBtn text={item.texto} />}
                    </div>
                    <div className="text-[12px] font-medium text-text-primary mb-1">{item.titulo}</div>
                    <p className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">{item.texto}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lead list */}
        {loadingList ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-surface border border-border rounded-xl animate-pulse" />)}
          </div>
        ) : leads.length > 0 && (
          <div>
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-3">
              Leads Ativos ({leads.length})
            </div>
            <div className="space-y-2">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  className="bg-surface border border-border hover:border-border-hover rounded-xl px-4 py-3.5 flex items-center gap-3 transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,192,127,0.08)", border: "1px solid rgba(0,192,127,0.2)" }}
                  >
                    <GitBranch className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <button
                    onClick={() => setViewLead(lead)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="text-[12px] font-medium text-text-primary truncate">{lead.perfil.slice(0, 60)}{lead.perfil.length > 60 ? "…" : ""}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {lead.duracao_dias} dias
                      {lead.criado_em && ` · ${lead.criado_em.slice(0,10).split("-").reverse().join("/")}`}
                    </div>
                  </button>
                  {/* Status selector */}
                  <div className="relative flex-shrink-0">
                    {updatingId === lead.id ? (
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    ) : (
                      <select
                        value={lead.status}
                        onChange={e => atualizarStatus(lead, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className={cn(
                          "appearance-none text-[9px] font-mono font-semibold px-2 py-1 rounded-full border outline-none cursor-pointer pr-5",
                          STATUS_COLOR[lead.status] ?? STATUS_COLOR.aquecendo
                        )}
                        style={{ background: "transparent" }}
                      >
                        {STATUS_OPS.map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View lead modal */}
      {viewLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setViewLead(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div>
                <div className="text-[14px] font-semibold text-text-primary">Trilha do Lead</div>
                <div className="text-[11px] text-text-muted mt-0.5">{viewLead.duracao_dias} dias · {viewLead.interesse.slice(0,60)}{viewLead.interesse.length > 60 ? "…" : ""}</div>
              </div>
              <button onClick={() => setViewLead(null)}>
                <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-3 flex-1">
              {(Array.isArray(viewLead.trilha) ? viewLead.trilha : []).map((item, i) => {
                const Icon = TIPO_ICON[item.tipo] ?? MessageSquare
                return (
                  <div key={i} className="bg-surface-2 border border-border rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-muted">DIA {item.dia}</span>
                        <span className={cn("flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full border", TIPO_COLOR[item.tipo] ?? TIPO_COLOR.Mensagem)}>
                          <Icon className="w-2.5 h-2.5" /> {item.tipo}
                        </span>
                      </div>
                      {item.ehMensagem && <CopyBtn text={item.texto} />}
                    </div>
                    <div className="text-[11px] font-medium text-text-primary mb-1">{item.titulo}</div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{item.texto}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
