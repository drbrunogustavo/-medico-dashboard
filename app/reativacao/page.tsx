"use client"

import { useEffect, useState } from "react"
import { RefreshCw, MessageCircle, Plus, Loader2, Copy, Check, Users, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Paciente {
  id:              string
  nome:            string
  telefone:        string
  ultimo_contato?: string
  motivo_saida?:   string
  status:          string
  mensagem_gerada?: string
}

interface MsgCampanha {
  numero:    number
  titulo:    string
  intervalo: string
  texto:     string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function diasInativos(ultimo?: string) {
  if (!ultimo) return 999
  return Math.floor((Date.now() - new Date(ultimo).getTime()) / 86400000)
}

function urgenciaBadge(dias: number) {
  if (dias >= 90) return { label: "+90 dias", cls: "bg-neutral-800 border-neutral-600 text-neutral-400" }
  if (dias >= 60) return { label: "60-90 dias", cls: "bg-red-500/10 border-red-500/30 text-red-400" }
  return           { label: "30-60 dias", cls: "bg-amber-500/10 border-amber-500/30 text-amber-400" }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border border-[--border] text-text-muted hover:text-accent hover:border-accent/30 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  )
}

// ─── Add Paciente Modal ───────────────────────────────────────────────────────

function AddModal({ onAdd, onClose }: { onAdd: (p: Omit<Paciente, "id" | "status">) => void; onClose: () => void }) {
  const [nome,        setNome]        = useState("")
  const [telefone,    setTelefone]    = useState("")
  const [ultimo,      setUltimo]      = useState("")
  const [motivo,      setMotivo]      = useState("")
  const [saving,      setSaving]      = useState(false)

  async function salvar() {
    if (!nome.trim() || !telefone.trim()) return
    setSaving(true)
    await fetch("/api/reativacao", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, telefone, ultimo_contato: ultimo || null, motivo_saida: motivo }),
    })
    onAdd({ nome, telefone, ultimo_contato: ultimo || undefined, motivo_saida: motivo || undefined })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[--card] border border-[--border] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-text-primary">Adicionar Paciente Inativo</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          {[
            { label: "Nome *",            val: nome,     set: setNome,     ph: "Nome do paciente",        type: "text" },
            { label: "Telefone *",        val: telefone, set: setTelefone, ph: "(11) 99999-9999",         type: "tel"  },
            { label: "Último contato",    val: ultimo,   set: setUltimo,   ph: "",                        type: "date" },
            { label: "Motivo provável",   val: motivo,   set: setMotivo,   ph: "Ex: preço, esqueceu...",  type: "text" },
          ].map(f => (
            <div key={f.label} className="space-y-1">
              <label className="text-[11px] font-mono text-text-muted uppercase">{f.label}</label>
              <input
                type={f.type}
                value={f.val}
                onChange={e => f.set(e.target.value)}
                placeholder={f.ph}
                className="w-full bg-[--surface] border border-[--border] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted"
              />
            </div>
          ))}
        </div>
        <button
          onClick={salvar}
          disabled={saving || !nome.trim() || !telefone.trim()}
          className="w-full mt-5 py-2.5 rounded-xl bg-accent text-[--background] text-sm font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Adicionar
        </button>
      </div>
    </div>
  )
}

// ─── Campanha Modal ───────────────────────────────────────────────────────────

function CampanhaModal({
  pacientes, onClose,
}: { pacientes: Paciente[]; onClose: () => void }) {
  const [loading,     setLoading]     = useState(false)
  const [msgs,        setMsgs]        = useState<MsgCampanha[]>([])
  const [error,       setError]       = useState("")

  async function gerar() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/reativacao/campanha", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacientes: pacientes.map(p => ({
            nome: p.nome,
            motivo_saida: p.motivo_saida,
            dias_inativo: diasInativos(p.ultimo_contato),
          })),
          nome_medico:   "[seu nome]",
          especialidade: "[especialidade]",
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? "Erro"); return }
      setMsgs(data.mensagens ?? [])
    } catch {
      setError("Erro de conexão.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { gerar() }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[--card] border border-[--border] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="text-base font-semibold text-text-primary">Campanha de Reativação</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <p className="text-sm text-text-muted">Gerando sequência de mensagens...</p>
            </div>
          )}
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          {msgs.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">Para {pacientes.length} paciente(s). Substitua [NOME] pelo nome de cada um.</p>
              {msgs.map(m => (
                <div key={m.numero} className="rounded-xl border border-[--border] bg-[--surface] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-mono font-semibold text-accent">Mensagem {m.numero} — {m.titulo}</span>
                      <span className="text-[10px] text-text-muted ml-2 font-mono">{m.intervalo}</span>
                    </div>
                    <CopyBtn text={m.texto} />
                  </div>
                  <pre className="text-sm text-text-secondary font-sans whitespace-pre-wrap leading-relaxed">{m.texto}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReativacaoPage() {
  const [pacientes,   setPacientes]   = useState<Paciente[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showAdd,     setShowAdd]     = useState(false)
  const [selecionados,setSelecionados] = useState<string[]>([])
  const [gerandoMsg,  setGerandoMsg]  = useState<string | null>(null)
  const [showCampanha,setShowCampanha] = useState(false)

  useEffect(() => {
    fetch("/api/reativacao").then(r => r.json()).then(d => {
      setPacientes(Array.isArray(d) ? d : [])
    }).finally(() => setLoading(false))
  }, [])

  async function gerarMensagem(p: Paciente) {
    setGerandoMsg(p.id)
    try {
      const res = await fetch("/api/reativacao", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "gerar_mensagem", id: p.id, nome: p.nome, ultimo_contato: p.ultimo_contato, motivo_saida: p.motivo_saida }),
      })
      const data = await res.json()
      if (data.texto) {
        setPacientes(prev => prev.map(x => x.id === p.id ? { ...x, mensagem_gerada: data.texto } : x))
      }
    } finally {
      setGerandoMsg(null)
    }
  }

  const pacSelecionados = pacientes.filter(p => selecionados.includes(p.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-5 h-5 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {showAdd && (
        <AddModal
          onAdd={p => {
            setPacientes(prev => [{ ...p, id: Date.now().toString(), status: "inativo" }, ...prev])
            setShowAdd(false)
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
      {showCampanha && (
        <CampanhaModal pacientes={pacSelecionados} onClose={() => setShowCampanha(false)} />
      )}

      <div className="flex items-center justify-between p-8 pb-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reativação de Pacientes</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">CONSULTÓRIO · RECUPERAR PACIENTES PERDIDOS</p>
        </div>
        <div className="flex gap-2">
          {selecionados.length > 0 && (
            <button
              onClick={() => setShowCampanha(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-accent/10 border border-accent/30 text-accent px-3 py-2 rounded-lg hover:bg-accent/15 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Campanha ({selecionados.length})
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-semibold border border-[--border] text-text-muted px-3 py-2 rounded-lg hover:text-text-secondary hover:border-[--border-hover] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>
      </div>

      <div className="p-8 space-y-4">
        {pacientes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-xl bg-[--surface] border border-[--border] flex items-center justify-center">
              <Users className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted text-center">
              Nenhum paciente inativo cadastrado.<br />Adicione manualmente ou importe do CRM.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs font-semibold text-accent border border-accent/30 px-4 py-2 rounded-lg hover:bg-accent/5 transition-colors"
            >
              + Adicionar Paciente
            </button>
          </div>
        )}

        {/* Stats */}
        {pacientes.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "+90 dias",  count: pacientes.filter(p => diasInativos(p.ultimo_contato) >= 90).length, color: "text-neutral-400" },
              { label: "60-90 dias",count: pacientes.filter(p => { const d = diasInativos(p.ultimo_contato); return d >= 60 && d < 90 }).length, color: "text-red-400" },
              { label: "30-60 dias",count: pacientes.filter(p => { const d = diasInativos(p.ultimo_contato); return d >= 30 && d < 60 }).length, color: "text-amber-400" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-[--border] bg-[--surface] p-4 text-center">
                <p className={cn("text-xl font-bold", s.color)}>{s.count}</p>
                <p className="text-[10px] text-text-muted font-mono mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Seleção */}
        {pacientes.length > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selecionados.length === pacientes.length}
              onChange={e => setSelecionados(e.target.checked ? pacientes.map(p => p.id) : [])}
              className="accent-accent"
            />
            <span className="text-xs text-text-muted">
              {selecionados.length > 0 ? `${selecionados.length} selecionados` : "Selecionar todos para campanha"}
            </span>
          </div>
        )}

        {/* List */}
        {pacientes.map(p => {
          const dias  = diasInativos(p.ultimo_contato)
          const badge = urgenciaBadge(dias)
          const selecionado = selecionados.includes(p.id)
          return (
            <div key={p.id} className={cn(
              "rounded-xl border bg-[--surface] p-5 transition-all",
              selecionado ? "border-accent/30 bg-accent/3" : "border-[--border]"
            )}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selecionado}
                  onChange={e => setSelecionados(prev => e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id))}
                  className="mt-1 accent-accent"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{p.nome}</p>
                      <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border", badge.cls)}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => gerarMensagem(p)}
                        disabled={gerandoMsg === p.id}
                        className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
                      >
                        {gerandoMsg === p.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Sparkles className="w-3 h-3" />}
                        Gerar mensagem
                      </button>
                      <a
                        href={`https://wa.me/55${p.telefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-1.5 flex-wrap">
                    <span className="text-[11px] text-text-muted font-mono">{p.telefone}</span>
                    {p.ultimo_contato && (
                      <span className="text-[11px] text-text-muted font-mono">
                        Último contato: {new Date(p.ultimo_contato).toLocaleDateString("pt-BR")} ({dias} dias)
                      </span>
                    )}
                    {p.motivo_saida && (
                      <span className="text-[11px] text-text-muted">Motivo: {p.motivo_saida}</span>
                    )}
                  </div>

                  {p.mensagem_gerada && (
                    <div className="mt-3 rounded-lg border border-accent/15 bg-accent/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-accent uppercase">Mensagem gerada</span>
                        <CopyBtn text={p.mensagem_gerada} />
                      </div>
                      <pre className="text-xs text-text-secondary font-sans whitespace-pre-wrap leading-relaxed">{p.mensagem_gerada}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
