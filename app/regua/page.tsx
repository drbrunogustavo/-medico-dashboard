"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Heart, Plus, X, Loader2, Check, ChevronDown, ChevronUp,
  Send, Pause, Play, Trash2, Clock, CheckCircle,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Regua {
  id:                 string
  paciente_nome:      string
  paciente_telefone:  string
  tipo:               string
  mensagem:           string
  status:             string
  pausado:            boolean
  agendado_para:      string
  enviado_em:         string | null
}

const TIPO_LABEL: Record<string, { label: string; color: string }> = {
  aniversario:    { label: "Aniversário",     color: "text-pink-400"    },
  retorno:        { label: "Lembrete retorno", color: "text-blue-400"    },
  dica_protocolo: { label: "Dica protocolo",  color: "text-amber-400"   },
  hidratacao:     { label: "Hidratação",       color: "text-cyan-400"    },
  sono:           { label: "Boas noites",      color: "text-purple-400"  },
}

const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"

function fmtDate(s: string) {
  if (!s) return "—"
  const d = new Date(s)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// ── Add Patient Modal ─────────────────────────────────────────────────────────

function AddModal({ onSave, onClose }: { onSave: (f: Record<string, string>) => Promise<void>; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    paciente_nome: "", paciente_telefone: "",
    data_nascimento: "", data_ultima_consulta: "", protocolo_ativo: "",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.paciente_nome.trim() || !form.paciente_telefone.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-[15px] font-semibold text-text-primary">Adicionar à Régua</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Nome *</label>
            <input value={form.paciente_nome} onChange={e => set("paciente_nome", e.target.value)} required placeholder="Nome do paciente" className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">WhatsApp *</label>
            <input value={form.paciente_telefone} onChange={e => set("paciente_telefone", fmtPhone(e.target.value))} required placeholder="(11) 99999-9999" className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Data de Nascimento</label>
              <input type="date" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Última Consulta</label>
              <input type="date" value={form.data_ultima_consulta} onChange={e => set("data_ultima_consulta", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Protocolo Ativo</label>
            <input value={form.protocolo_ativo} onChange={e => set("protocolo_ativo", e.target.value)} placeholder="Ex: Emagrecimento, longevidade, hormônios..." className={inputCls} />
          </div>
          <p className="text-[10px] text-text-muted">A IA irá gerar mensagens personalizadas automaticamente para cada tipo de contato.</p>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-[13px] text-text-muted hover:text-text-primary transition-all">Cancelar</button>
            <button type="submit" disabled={saving || !form.paciente_nome.trim() || !form.paciente_telefone.trim()} className="flex-1 py-2 rounded-lg bg-accent text-[13px] font-semibold text-background disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</> : <><Check className="w-3.5 h-3.5" /> Adicionar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Patient Group ─────────────────────────────────────────────────────────────

function PatientGroup({
  nome, msgs, onSend, onTogglePause, onRemove, sending,
}: {
  nome: string
  msgs: Regua[]
  onSend: (id: string) => void
  onTogglePause: (nome: string, pause: boolean) => void
  onRemove: (nome: string) => void
  sending: string | null
}) {
  const [open, setOpen] = useState(false)
  const isPaused = msgs.some(m => m.pausado)
  const pending  = msgs.filter(m => m.status === "pendente").length
  const sent     = msgs.filter(m => m.status === "enviado").length

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-accent">{nome.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="text-left min-w-0">
            <div className="text-[13px] font-semibold text-text-primary truncate">{nome}</div>
            <div className="text-[10px] text-text-muted">{msgs[0]?.paciente_telefone}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {isPaused && (
            <span className="text-badge font-mono bg-amber-500/10 border border-amber-500/25 text-amber-400 px-1.5 py-0.5 rounded">PAUSADO</span>
          )}
          <span className="text-[10px] font-mono text-text-muted">{sent}/{msgs.length}</span>
          {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Actions */}
          <div className="flex gap-2 px-4 py-3 border-b border-border">
            <button
              onClick={() => onTogglePause(nome, !isPaused)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                isPaused
                  ? "bg-accent-dim border-accent-border text-accent"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15"
              )}
            >
              {isPaused ? <><Play className="w-3 h-3" /> Retomar</> : <><Pause className="w-3 h-3" /> Pausar</>}
            </button>
            <button
              onClick={() => { if (confirm(`Remover ${nome} da régua?`)) onRemove(nome) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] text-text-muted hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Remover
            </button>
          </div>

          {/* Messages */}
          <div className="divide-y divide-border">
            {msgs.map(m => {
              const tipo = TIPO_LABEL[m.tipo] ?? { label: m.tipo, color: "text-text-muted" }
              return (
                <div key={m.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] font-mono font-semibold", tipo.color)}>{tipo.label}</span>
                      <span className="text-[10px] text-text-muted">· {fmtDate(m.agendado_para)}</span>
                    </div>
                    <p className="text-[12px] text-text-secondary line-clamp-2">{m.mensagem}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {m.status === "enviado" ? (
                      <CheckCircle className="w-4 h-4 text-accent" />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {!m.pausado && (
                          <button
                            onClick={() => onSend(m.id)}
                            disabled={sending === m.id}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-accent-dim border border-accent-border text-accent text-[10px] font-semibold hover:bg-accent/15 disabled:opacity-60 transition-all"
                          >
                            {sending === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Enviar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReguaPage() {
  const [items,    setItems]    = useState<Regua[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showAdd,  setShowAdd]  = useState(false)
  const [adding,   setAdding]   = useState(false)
  const [sending,  setSending]  = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/regua")
      if (r.ok) setItems(await r.json())
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  // Group by patient
  const grouped = items.reduce<Record<string, Regua[]>>((acc, m) => {
    acc[m.paciente_nome] = [...(acc[m.paciente_nome] ?? []), m]
    return acc
  }, {})

  async function addPaciente(form: Record<string, string>) {
    setAdding(true)
    try {
      const r = await fetch("/api/regua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
      showToast("Paciente adicionado à régua com sucesso!")
      setShowAdd(false)
      await fetch_()
    } catch (e) { showToast(`Erro: ${e instanceof Error ? e.message : String(e)}`) }
    finally { setAdding(false) }
  }

  async function sendNow(id: string) {
    setSending(id)
    try {
      const r = await fetch("/api/regua/processar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
      showToast("Mensagem enviada!")
      setItems(prev => prev.map(m => m.id === id ? { ...m, status: "enviado" } : m))
    } catch (e) { showToast(`Erro: ${e instanceof Error ? e.message : String(e)}`) }
    finally { setSending(null) }
  }

  async function togglePause(nome: string, pause: boolean) {
    const ids = items.filter(m => m.paciente_nome === nome).map(m => m.id)
    for (const id of ids) {
      await fetch("/api/regua", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pausado: pause }),
      })
    }
    setItems(prev => prev.map(m => m.paciente_nome === nome ? { ...m, pausado: pause } : m))
    showToast(pause ? "Régua pausada" : "Régua retomada")
  }

  async function removePaciente(nome: string) {
    await fetch(`/api/regua?paciente_nome=${encodeURIComponent(nome)}`, { method: "DELETE" })
    setItems(prev => prev.filter(m => m.paciente_nome !== nome))
    showToast("Paciente removido da régua")
  }

  const total   = Object.keys(grouped).length
  const pending = items.filter(m => m.status === "pendente" && !m.pausado).length
  const sent    = items.filter(m => m.status === "enviado").length

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Régua de Relacionamento"
        subtitle="ALA CLÍNICA · AUTOMAÇÃO"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-background text-[12px] font-semibold rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Adicionar Paciente</span>
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Pacientes na Régua", value: total,   color: "text-accent"     },
            { label: "Mensagens Agendadas", value: pending, color: "text-amber-400"  },
            { label: "Mensagens Enviadas",  value: sent,    color: "text-emerald-400"},
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-2">{s.label}</div>
              <div className={cn("text-3xl font-bold", s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Patient list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-surface rounded-xl border border-border animate-pulse" />)}
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Heart className="w-10 h-10 text-text-muted/30" />
            <p className="text-text-muted text-[13px]">Nenhum paciente na régua ainda</p>
            <button onClick={() => setShowAdd(true)} className="text-accent text-[12px] underline">Adicionar primeiro paciente</button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([nome, msgs]) => (
              <PatientGroup
                key={nome}
                nome={nome}
                msgs={msgs}
                onSend={sendNow}
                onTogglePause={togglePause}
                onRemove={removePaciente}
                sending={sending}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddModal onSave={addPaciente} onClose={() => { if (!adding) setShowAdd(false) }} />}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-surface border border-border rounded-xl shadow-xl text-[13px] text-text-primary">
          {toast}
        </div>
      )}
    </div>
  )
}
