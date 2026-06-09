"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Star, Plus, X, Loader2, Check, Send, Copy, CheckCircle,
  MessageSquare, TrendingUp, Users,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface NPS {
  id: string; paciente_nome: string; paciente_telefone: string
  token: string; nota: number | null; comentario: string | null
  status: string; agendado_para: string; respondido_em: string | null
  created_at: string
}

interface Depoimento { instagram: string; google: string }

const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"

function notaBadge(nota: number | null) {
  if (nota === null) return "bg-surface-2 text-text-muted border-border"
  if (nota >= 9) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
  if (nota >= 7) return "bg-amber-500/10 text-amber-400 border-amber-500/25"
  return "bg-red-500/10 text-red-400 border-red-500/25"
}

function notaLabel(nota: number | null) {
  if (nota === null) return "Aguardando"
  if (nota >= 9) return "Promotor"
  if (nota >= 7) return "Neutro"
  return "Detrator"
}

function fmtDate(s: string) {
  if (!s) return "—"
  return new Date(s).toLocaleDateString("pt-BR")
}

// ── Add NPS Modal ─────────────────────────────────────────────────────────────

function AddModal({ onSave, onClose }: { onSave: (nome: string, tel: string) => Promise<void>; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState("")
  const [tel,  setTel]  = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !tel.trim()) return
    setSaving(true)
    await onSave(nome, tel)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold text-text-primary">Nova Pesquisa NPS</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Nome do Paciente</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Nome completo" className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">WhatsApp</label>
            <input value={tel} onChange={e => setTel(e.target.value)} required placeholder="(11) 99999-9999" className={inputCls} />
          </div>
          <p className="text-[10px] text-text-muted">O link NPS será enviado via WhatsApp em 24h automaticamente.</p>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-[13px] text-text-muted">Cancelar</button>
            <button type="submit" disabled={saving || !nome.trim() || !tel.trim()} className="flex-1 py-2 rounded-lg bg-accent text-[13px] font-semibold text-background disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Depoimento Modal ──────────────────────────────────────────────────────────

function DepoimentoModal({ nps, onClose }: { nps: NPS; onClose: () => void }) {
  const [form, setForm] = useState({
    resultado: "", tempo_paciente: "", transformacao: "", usar_nome_completo: true, telefone: nps.paciente_telefone,
  })
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState<Depoimento | null>(null)
  const [copied,     setCopied]     = useState<string | null>(null)
  const [sending,    setSending]    = useState(false)
  const [sendOk,     setSendOk]     = useState(false)

  async function gerar() {
    setLoading(true)
    try {
      const r = await fetch("/api/depoimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gerar",
          paciente_nome: nps.paciente_nome,
          nota: nps.nota,
          comentario: nps.comentario,
          ...form,
        }),
      })
      if (!r.ok) throw new Error()
      setResult(await r.json())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function enviarAprovacao() {
    setSending(true)
    try {
      const r = await fetch("/api/depoimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enviar_aprovacao",
          paciente_nome: nps.paciente_nome,
          paciente_telefone: form.telefone,
          comentario: result?.instagram ?? "",
        }),
      })
      if (r.ok) setSendOk(true)
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
          <h2 className="text-[15px] font-semibold text-text-primary">Gerar Depoimento — {nps.paciente_nome}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Base info */}
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="text-[11px] font-mono text-text-muted mb-1">Avaliação original</div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border", notaBadge(nps.nota))}>
                {nps.nota}/10 — {notaLabel(nps.nota)}
              </span>
            </div>
            {nps.comentario && <p className="text-[12px] text-text-secondary italic">"{nps.comentario}"</p>}
          </div>

          {/* Extra fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Resultado obtido</label>
              <input value={form.resultado} onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))} placeholder="Ex: Perdeu 8kg em 3 meses" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Tempo como paciente</label>
                <input value={form.tempo_paciente} onChange={e => setForm(f => ({ ...f, tempo_paciente: e.target.value }))} placeholder="Ex: 6 meses" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Principal transformação</label>
                <input value={form.transformacao} onChange={e => setForm(f => ({ ...f, transformacao: e.target.value }))} placeholder="Ex: Mais energia e disposição" className={inputCls} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.usar_nome_completo} onChange={e => setForm(f => ({ ...f, usar_nome_completo: e.target.checked }))} className="rounded" />
              <span className="text-[12px] text-text-secondary">Usar nome completo no depoimento</span>
            </label>
          </div>

          <button
            onClick={gerar}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent text-background text-[13px] font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando com IA...</> : <><Star className="w-3.5 h-3.5" /> Gerar com IA</>}
          </button>

          {result && (
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { key: "instagram", label: "Instagram", icon: "📸" },
                { key: "google",    label: "Google",    icon: "🔍" },
              ].map(({ key, label, icon }) => (
                <div key={key} className="bg-background border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">{icon} {label}</span>
                    <button
                      onClick={() => copy(result[key as keyof Depoimento], key)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-surface-2 border border-border text-[10px] text-text-muted hover:text-accent transition-colors"
                    >
                      {copied === key ? <><CheckCircle className="w-3 h-3 text-accent" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                    </button>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">{result[key as keyof Depoimento]}</p>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <input
                value={form.telefone}
                onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                placeholder="Telefone para aprovação"
                className={cn(inputCls, "flex-1")}
              />
              <button
                onClick={enviarAprovacao}
                disabled={sending || sendOk}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[12px] font-semibold disabled:opacity-60 flex-shrink-0 transition-all"
              >
                {sendOk ? <><CheckCircle className="w-3.5 h-3.5" /> Enviado!</> : sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Enviar para aprovação</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NPSPage() {
  const [items,   setItems]   = useState<NPS[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [depoimento, setDepoimento] = useState<NPS | null>(null)
  const [toast,   setToast]   = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/nps")
      if (r.ok) setItems(await r.json())
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function createNPS(nome: string, tel: string) {
    const r = await fetch("/api/nps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paciente_nome: nome, paciente_telefone: tel }),
    })
    if (r.ok) { showToast("Pesquisa criada! Será enviada em 24h."); setShowAdd(false); await fetch_() }
    else showToast("Erro ao criar pesquisa")
  }

  async function enviarAgora(id: string) {
    setSending(id)
    const r = await fetch("/api/nps/processar", {
      method: "GET",
      headers: {},
    })
    setSending(null)
    if (r.ok) { showToast("Enviando..."); await fetch_() }
  }

  // NPS Score calc
  const respondidas = items.filter(i => i.nota !== null)
  const promotores  = respondidas.filter(i => (i.nota ?? 0) >= 9).length
  const detratores  = respondidas.filter(i => (i.nota ?? 0) <= 6).length
  const score       = respondidas.length
    ? Math.round(((promotores - detratores) / respondidas.length) * 100)
    : 0
  const scoreColor  = score >= 50 ? "text-emerald-400" : score >= 0 ? "text-amber-400" : "text-red-400"

  return (
    <div className="animate-fade-in">
      <TopBar
        title="NPS & Satisfação"
        subtitle="ALA CLÍNICA · PACIENTES"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-background text-[12px] font-semibold rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Pesquisa
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Score header */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="text-center">
            <div className={cn("text-6xl font-bold tabular-nums", scoreColor)}>{score}</div>
            <div className="text-[11px] font-mono text-text-muted uppercase tracking-widest mt-1">Score NPS</div>
          </div>
          <div className="w-px h-16 bg-border hidden md:block" />
          <div className="grid grid-cols-3 gap-6 flex-1">
            {[
              { label: "Promotores",  value: promotores, cls: "text-emerald-400", sub: "nota 9-10" },
              { label: "Neutros",     value: respondidas.length - promotores - detratores, cls: "text-amber-400", sub: "nota 7-8" },
              { label: "Detratores",  value: detratores,  cls: "text-red-400",    sub: "nota 0-6" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={cn("text-2xl font-bold", s.cls)}>{s.value}</div>
                <div className="text-[11px] text-text-muted">{s.label}</div>
                <div className="text-[9px] font-mono text-text-muted/60">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="w-px h-16 bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{respondidas.length}</div>
            <div className="text-[11px] text-text-muted">Respostas</div>
            <div className="text-[9px] font-mono text-text-muted/60">de {items.length} enviadas</div>
          </div>
        </div>

        {/* Responses list */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-surface rounded-xl border border-border animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Star className="w-10 h-10 text-text-muted/30" />
            <p className="text-text-muted text-[13px]">Nenhuma pesquisa criada ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(nps => (
              <div key={nps.id} className="bg-surface border border-border rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[13px] font-semibold text-text-primary">{nps.paciente_nome}</span>
                    {nps.nota !== null && (
                      <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded border", notaBadge(nps.nota))}>
                        {nps.nota}/10 — {notaLabel(nps.nota)}
                      </span>
                    )}
                    <span className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                      nps.status === "respondido" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                        : nps.status === "enviado" ? "bg-blue-500/10 border-blue-500/25 text-blue-400"
                        : "bg-surface-2 border-border text-text-muted"
                    )}>
                      {nps.status === "respondido" ? "RESPONDIDO" : nps.status === "enviado" ? "ENVIADO" : "PENDENTE"}
                    </span>
                  </div>
                  {nps.comentario && <p className="text-[12px] text-text-secondary italic line-clamp-2">"{nps.comentario}"</p>}
                  <div className="text-[10px] font-mono text-text-muted mt-1">
                    {nps.respondido_em ? `Respondido em ${fmtDate(nps.respondido_em)}` : `Agendado para ${fmtDate(nps.agendado_para)}`}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {nps.nota !== null && nps.nota >= 9 && (
                    <button
                      onClick={() => setDepoimento(nps)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-dim border border-accent-border text-accent text-[11px] font-semibold hover:bg-accent/15 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" /> Depoimento
                    </button>
                  )}
                  {nps.status === "pendente" && (
                    <button
                      onClick={() => enviarAgora(nps.id)}
                      disabled={sending === nps.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-text-muted text-[11px] hover:text-accent hover:border-accent/30 transition-colors"
                    >
                      {sending === nps.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Enviar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd  && <AddModal onSave={createNPS} onClose={() => setShowAdd(false)} />}
      {depoimento && <DepoimentoModal nps={depoimento} onClose={() => setDepoimento(null)} />}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-surface border border-border rounded-xl shadow-xl text-[13px] text-text-primary">
          {toast}
        </div>
      )}
    </div>
  )
}
