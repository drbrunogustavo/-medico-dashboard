"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  UserPlus, Plus, X, Loader2, Check, CheckCircle,
  Gift, Phone, ChevronDown, ChevronUp,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Indicacao {
  id: string; user_id: string
  indicador_nome: string; indicador_telefone: string
  indicado_nome: string;  indicado_telefone: string
  token_indicacao: string; status: string
  consulta_indicado_realizada: boolean
  cortesia_gerada: boolean; cortesia_usada: boolean
  created_at: string; updated_at: string
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pendente:        { label: "Pendente",           cls: "bg-surface-2 text-text-muted border-border" },
  cortesia_gerada: { label: "Cortesia gerada",    cls: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
  cortesia_usada:  { label: "Cortesia utilizada", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
}

const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"

function fmtDate(s: string) { return s ? new Date(s).toLocaleDateString("pt-BR") : "—" }
function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d; if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

// ── Add Modal ─────────────────────────────────────────────────────────────────

function AddModal({ onSave, onClose }: { onSave: (f: Record<string, string>) => Promise<void>; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ indicador_nome: "", indicador_telefone: "", indicado_nome: "", indicado_telefone: "" })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const valid = Object.values(form).every(v => v.trim())

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!valid) return
    setSaving(true); await onSave(form); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold text-text-primary">Nova Indicação</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <div className="text-[10px] font-mono text-accent uppercase tracking-widest mb-2">Quem indicou</div>
            <div className="space-y-2.5">
              <input value={form.indicador_nome} onChange={e => set("indicador_nome", e.target.value)} required placeholder="Nome do paciente indicador" className={inputCls} />
              <input value={form.indicador_telefone} onChange={e => set("indicador_telefone", fmtPhone(e.target.value))} required placeholder="WhatsApp do indicador" className={inputCls} />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-2">Quem foi indicado</div>
            <div className="space-y-2.5">
              <input value={form.indicado_nome} onChange={e => set("indicado_nome", e.target.value)} required placeholder="Nome do indicado" className={inputCls} />
              <input value={form.indicado_telefone} onChange={e => set("indicado_telefone", fmtPhone(e.target.value))} required placeholder="WhatsApp do indicado" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-[13px] text-text-muted">Cancelar</button>
            <button type="submit" disabled={saving || !valid} className="flex-1 py-2 rounded-lg bg-accent text-[13px] font-semibold text-background disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function IndicacaoCard({
  ind, onConfirmarConsulta, onConfirmarCortesia, updating,
}: {
  ind: Indicacao
  onConfirmarConsulta: (id: string) => void
  onConfirmarCortesia: (id: string) => void
  updating: string | null
}) {
  const [open, setOpen] = useState(false)
  const st = STATUS_STYLE[ind.status] ?? STATUS_STYLE.pendente

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-text-primary">{ind.indicador_nome}</span>
            <span className="text-[11px] text-text-muted">→</span>
            <span className="text-[13px] text-blue-400">{ind.indicado_nome}</span>
            <span className={cn("text-badge font-mono font-semibold px-1.5 py-0.5 rounded border", st.cls)}>{st.label}</span>
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">{fmtDate(ind.created_at)}</div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Indicador</div>
              <div className="text-[13px] font-semibold text-text-primary">{ind.indicador_nome}</div>
              <div className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{ind.indicador_telefone}</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Indicado</div>
              <div className="text-[13px] font-semibold text-blue-400">{ind.indicado_nome}</div>
              <div className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{ind.indicado_telefone}</div>
            </div>
          </div>

          {/* Pipeline status */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { done: true,                                label: "Indicação registrada" },
              { done: ind.consulta_indicado_realizada,    label: "Indicado consultou"    },
              { done: ind.cortesia_gerada,                label: "Cortesia gerada"       },
              { done: ind.cortesia_usada,                 label: "Cortesia usada"        },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", step.done ? "bg-accent-dim border border-accent-border" : "bg-surface-2 border border-border")}>
                  {step.done ? <CheckCircle className="w-3 h-3 text-accent" /> : <div className="w-1.5 h-1.5 rounded-full bg-text-muted/30" />}
                </div>
                <span className={cn("text-[10px]", step.done ? "text-text-secondary" : "text-text-muted")}>{step.label}</span>
                {i < 3 && <div className="w-4 h-px bg-border flex-shrink-0" />}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!ind.consulta_indicado_realizada && (
              <button
                onClick={() => onConfirmarConsulta(ind.id)}
                disabled={updating === ind.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[12px] font-semibold hover:bg-blue-500/15 disabled:opacity-60 transition-all"
              >
                {updating === ind.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirmar consulta do indicado
              </button>
            )}
            {ind.cortesia_gerada && !ind.cortesia_usada && (
              <button
                onClick={() => onConfirmarCortesia(ind.id)}
                disabled={updating === ind.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[12px] font-semibold hover:bg-amber-500/15 disabled:opacity-60 transition-all"
              >
                <Gift className="w-3.5 h-3.5" /> Marcar cortesia usada
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IndicacoesPage() {
  const [items,    setItems]    = useState<Indicacao[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showAdd,  setShowAdd]  = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try { const r = await fetch("/api/indicacoes"); if (r.ok) setItems(await r.json()) }
    catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function add(form: Record<string, string>) {
    const r = await fetch("/api/indicacoes", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    if (r.ok) { showToast("Indicação registrada!"); setShowAdd(false); await fetch_() }
    else showToast("Erro ao registrar indicação")
  }

  async function patch(id: string, body: object) {
    setUpdating(id)
    const r = await fetch(`/api/indicacoes/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })
    setUpdating(null)
    if (r.ok) {
      const updated = await r.json() as Indicacao
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      showToast("Atualizado com sucesso!")
    } else showToast("Erro ao atualizar")
  }

  const total     = items.length
  const convertidas = items.filter(i => i.consulta_indicado_realizada).length
  const cortesiasAtivas = items.filter(i => i.cortesia_gerada && !i.cortesia_usada).length
  const taxa = total > 0 ? Math.round((convertidas / total) * 100) : 0

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Programa de Indicações"
        subtitle="ALA CLÍNICA · MEMBER GET MEMBER"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-background text-[12px] font-semibold rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Indicação
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Program description */}
        <div className="bg-surface border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-text-secondary leading-relaxed">
              A confiança é a base do nosso trabalho. Quando um paciente indica alguém que também deseja cuidar da saúde conosco, valorizamos esse gesto. Como forma de agradecimento, após a realização da consulta do paciente indicado, a próxima consulta do paciente que fez a indicação será concedida como <span className="text-amber-400 font-semibold">cortesia administrativa</span>.
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total de Indicações",  value: total,          color: "text-blue-400"   },
            { label: "Taxa de Conversão",    value: `${taxa}%`,     color: "text-accent"     },
            { label: "Indicados Convertidos",value: convertidas,    color: "text-emerald-400"},
            { label: "Cortesias Ativas",     value: cortesiasAtivas, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">{s.label}</div>
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-surface rounded-xl border border-border animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <UserPlus className="w-10 h-10 text-text-muted/30" />
            <p className="text-text-muted text-[13px]">Nenhuma indicação registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(ind => (
              <IndicacaoCard
                key={ind.id}
                ind={ind}
                onConfirmarConsulta={id => patch(id, { consulta_indicado_realizada: true })}
                onConfirmarCortesia={id => patch(id, { cortesia_usada: true })}
                updating={updating}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddModal onSave={add} onClose={() => setShowAdd(false)} />}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-surface border border-border rounded-xl shadow-xl text-[13px] text-text-primary">{toast}</div>
      )}
    </div>
  )
}
