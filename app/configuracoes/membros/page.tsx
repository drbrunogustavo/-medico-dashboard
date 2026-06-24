"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users2, Plus, X, Check, Loader2, AlertTriangle,
  Trash2, Pencil, ToggleLeft, ToggleRight, Shield,
  Mail, Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Membro {
  id:         string
  nome:       string
  email:      string
  cargo:      string
  perfil:     string
  ativo:      boolean
  created_at: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PERFIS = [
  { value: "secretaria",   label: "Secretária",      desc: "Agenda, pacientes, CRM, financeiro básico" },
  { value: "enfermeira",   label: "Enfermeira",       desc: "Pacientes, copiloto, calculadoras, protocolos" },
  { value: "gestor",       label: "Gestor",           desc: "Financeiro completo, indicadores, executivo" },
  { value: "marketing",    label: "Marketing",        desc: "Toda ala social, calendário, pautas" },
  { value: "visualizador", label: "Visualizador",     desc: "Apenas leitura em tudo" },
]

const PERFIL_COLOR: Record<string, string> = {
  secretaria:   "bg-blue-50 border-blue-200 text-blue-700",
  enfermeira:   "bg-green-50 border-green-200 text-green-700",
  gestor:       "bg-purple-50 border-purple-200 text-purple-700",
  marketing:    "bg-pink-50 border-pink-200 text-pink-700",
  visualizador: "bg-gray-100 border-gray-200 text-gray-600",
  medico:       "bg-amber-50 border-amber-200 text-amber-700",
}

const PERFIL_LABEL: Record<string, string> = {
  secretaria:   "Secretária",
  enfermeira:   "Enfermeira",
  gestor:       "Gestor",
  marketing:    "Marketing",
  visualizador: "Visualizador",
  medico:       "Médico (Dono)",
}

// ─── Modal de convite ─────────────────────────────────────────────────────────

interface InviteModalProps {
  onClose: () => void
  onSaved: (m: Membro) => void
}

function InviteModal({ onClose, onSaved }: InviteModalProps) {
  const [form, setForm] = useState({ nome: "", email: "", cargo: "", perfil: "secretaria" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim() || !form.email.trim() || !form.cargo.trim()) {
      setError("Preencha todos os campos obrigatórios.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json() as Membro & { error?: string }
      if (!res.ok) { setError(data.error ?? "Erro ao convidar membro."); return }
      onSaved(data)
      onClose()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-accent" />
            <h2 className="text-[15px] font-semibold text-text-primary">Convidar membro</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Nome completo *</label>
            <input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: Ana Paula" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">E-mail *</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@clinica.com" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Cargo *</label>
            <input value={form.cargo} onChange={e => set("cargo", e.target.value)} placeholder="Ex: Recepcionista, Enfermeira..." className={inputCls} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Perfil de acesso *</label>
            <div className="space-y-2">
              {PERFIS.map(p => (
                <label key={p.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    form.perfil === p.value
                      ? "border-accent/50 bg-accent-dim"
                      : "border-border hover:border-border-hover"
                  )}
                >
                  <input type="radio" name="perfil" value={p.value}
                    checked={form.perfil === p.value}
                    onChange={e => set("perfil", e.target.value)}
                    className="mt-0.5 accent-accent"
                  />
                  <div>
                    <div className="text-[12px] font-semibold text-text-primary">{p.label}</div>
                    <div className="text-[11px] text-text-muted mt-0.5">{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700">{error}</p>
            </div>
          )}

          <div className="pt-1 bg-accent-dim border border-accent-border rounded-lg px-3 py-2.5">
            <p className="text-[11px] text-accent">
              <Mail className="w-3 h-3 inline mr-1" />
              Um convite será enviado para o e-mail informado. O membro precisará criar conta com esse e-mail.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-muted text-[13px] hover:border-border-hover transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</> : <><Check className="w-3.5 h-3.5" /> Convidar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal de edição ──────────────────────────────────────────────────────────

interface EditModalProps {
  membro: Membro
  onClose: () => void
  onSaved: (m: Membro) => void
}

function EditModal({ membro, onClose, onSaved }: EditModalProps) {
  const [cargo,   setCargo]   = useState(membro.cargo)
  const [perfil,  setPerfil]  = useState(membro.perfil)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  async function save() {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/membros/${membro.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cargo, perfil }),
      })
      const data = await res.json() as Membro & { error?: string }
      if (!res.ok) { setError(data.error ?? "Erro ao salvar."); return }
      onSaved(data)
      onClose()
    } catch {
      setError("Erro de conexão.")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[14px] font-semibold text-text-primary">Editar — {membro.nome}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Cargo</label>
            <input value={cargo} onChange={e => setCargo(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Perfil de acesso</label>
            <div className="space-y-1.5">
              {PERFIS.map(p => (
                <label key={p.value} className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                  perfil === p.value ? "border-accent/50 bg-accent-dim" : "border-border hover:border-border-hover"
                )}>
                  <input type="radio" name="edit_perfil" value={p.value}
                    checked={perfil === p.value} onChange={e => setPerfil(e.target.value)} className="accent-accent" />
                  <span className="text-[12px] font-medium text-text-primary">{p.label}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-text-muted text-[13px] hover:border-border-hover transition-colors">
              Cancelar
            </button>
            <button onClick={save} disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MembrosPage() {
  const [membros,    setMembros]    = useState<Membro[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [editTarget, setEditTarget] = useState<Membro | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error,      setError]      = useState("")

  const fetchMembros = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/membros")
      const data = await res.json() as Membro[]
      setMembros(Array.isArray(data) ? data : [])
    } catch {
      setError("Erro ao carregar membros.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMembros() }, [fetchMembros])

  async function toggleAtivo(m: Membro) {
    setTogglingId(m.id)
    try {
      const res = await fetch(`/api/membros/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !m.ativo }),
      })
      if (res.ok) {
        setMembros(prev => prev.map(x => x.id === m.id ? { ...x, ativo: !m.ativo } : x))
      }
    } finally {
      setTogglingId(null)
    }
  }

  async function deleteMembro(id: string) {
    if (!confirm("Remover este membro da equipe?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/membros/${id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setMembros(prev => prev.filter(m => m.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  const ativos   = membros.filter(m => m.ativo)
  const inativos = membros.filter(m => !m.ativo)

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Membros da Equipe" />
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users2 className="w-5 h-5 text-accent" />
              <h1 className="text-[22px] font-bold text-text-primary">Membros da Equipe</h1>
            </div>
            <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest">PERFIS DE ACESSO · CLÍNICA PRAXIS</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-all shadow-sm shadow-accent/20 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Convidar membro</span>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6">

        {/* Perfis de acesso info */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {PERFIS.map(p => (
            <div key={p.value} className="bg-surface border border-border rounded-xl p-3 space-y-1">
              <span className={cn("text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border", PERFIL_COLOR[p.value] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
                {p.label}
              </span>
              <p className="text-[10px] text-text-muted leading-snug pt-1">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5" />
            <p className="text-[12px] text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && membros.length === 0 && (
          <div className="text-center py-16 bg-surface border border-border rounded-2xl">
            <Users2 className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <h3 className="text-[15px] font-semibold text-text-primary mb-2">Nenhum membro ainda</h3>
            <p className="text-[12px] text-text-muted max-w-xs mx-auto mb-5">
              Convide sua equipe para colaborar na plataforma com perfis de acesso personalizados.
            </p>
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-all"
            >
              <Plus className="w-4 h-4" /> Convidar primeiro membro
            </button>
          </div>
        )}

        {/* Membros ativos */}
        {!loading && ativos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <h2 className="text-[12px] font-mono text-text-muted uppercase tracking-widest">Ativos — {ativos.length}</h2>
            </div>
            <div className="space-y-2">
              {ativos.map(m => (
                <MemberRow
                  key={m.id} membro={m}
                  toggling={togglingId === m.id}
                  deleting={deletingId === m.id}
                  onToggle={() => toggleAtivo(m)}
                  onEdit={() => setEditTarget(m)}
                  onDelete={() => deleteMembro(m.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Membros inativos */}
        {!loading && inativos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-text-muted" />
              <h2 className="text-[12px] font-mono text-text-muted uppercase tracking-widest">Inativos — {inativos.length}</h2>
            </div>
            <div className="space-y-2 opacity-60">
              {inativos.map(m => (
                <MemberRow
                  key={m.id} membro={m}
                  toggling={togglingId === m.id}
                  deleting={deletingId === m.id}
                  onToggle={() => toggleAtivo(m)}
                  onEdit={() => setEditTarget(m)}
                  onDelete={() => deleteMembro(m.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSaved={m => setMembros(prev => [...prev, m])}
        />
      )}

      {editTarget && (
        <EditModal
          membro={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={updated => setMembros(prev => prev.map(m => m.id === updated.id ? updated : m))}
        />
      )}
    </div>
  )
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({
  membro, toggling, deleting, onToggle, onEdit, onDelete,
}: {
  membro:   Membro
  toggling: boolean
  deleting: boolean
  onToggle: () => void
  onEdit:   () => void
  onDelete: () => void
}) {
  const initials = membro.nome.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-border-hover transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
        <span className="text-[11px] font-bold text-accent">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-text-primary truncate">{membro.nome}</span>
          <span className={cn("text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex-shrink-0", PERFIL_COLOR[membro.perfil] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
            {PERFIL_LABEL[membro.perfil] ?? membro.perfil}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-text-muted flex items-center gap-1 truncate">
            <Mail className="w-3 h-3 flex-shrink-0" /> {membro.email}
          </span>
          <span className="text-[11px] text-text-muted flex items-center gap-1 flex-shrink-0">
            <Briefcase className="w-3 h-3" /> {membro.cargo}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Toggle ativo */}
        <button onClick={onToggle} disabled={toggling} title={membro.ativo ? "Desativar" : "Ativar"}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors disabled:opacity-40">
          {toggling
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : membro.ativo
              ? <ToggleRight className="w-4 h-4 text-green-500" />
              : <ToggleLeft className="w-4 h-4" />
          }
        </button>

        {/* Editar */}
        <button onClick={onEdit} title="Editar perfil"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {/* Remover */}
        <button onClick={onDelete} disabled={deleting} title="Remover membro"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
          {deleting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />
          }
        </button>
      </div>
    </div>
  )
}
