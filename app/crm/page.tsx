"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { Toast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus, X, Loader2, Users2, TrendingUp, DollarSign,
  Sparkles, Phone, Instagram, CalendarDays, MessageSquare,
  Edit2, Trash2, GripVertical, ChevronDown, Check,
  Link2, ExternalLink, Zap, CheckCircle, Clock, Edit3,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lead {
  id:              string
  nome:            string
  telefone?:       string | null
  instagram?:      string | null
  origem:          string
  estagio:         string
  motivo_perda?:   string | null
  observacoes?:    string | null
  valor_potencial: number
  created_at:      string
  updated_at:      string
}

interface NurturingSeq {
  id:           string
  dia:          number
  mensagem:     string
  status:       string
  agendado_para: string
  enviado_em:   string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS: {
  id: string
  emoji: string
  label: string
  color: string
  bg: string
  border: string
  header: string
}[] = [
  {
    id:     "novo",
    emoji:  "🆕",
    label:  "Novo Lead",
    color:  "text-blue-400",
    bg:     "bg-blue-500/5",
    border: "border-blue-500/20",
    header: "bg-blue-500/10",
  },
  {
    id:     "contato",
    emoji:  "📞",
    label:  "Contato Feito",
    color:  "text-amber-400",
    bg:     "bg-amber-500/5",
    border: "border-amber-500/20",
    header: "bg-amber-500/10",
  },
  {
    id:     "agendado",
    emoji:  "📅",
    label:  "Consulta Agendada",
    color:  "text-purple-400",
    bg:     "bg-purple-500/5",
    border: "border-purple-500/20",
    header: "bg-purple-500/10",
  },
  {
    id:     "ativo",
    emoji:  "✅",
    label:  "Paciente Ativo",
    color:  "text-emerald-400",
    bg:     "bg-emerald-500/5",
    border: "border-emerald-500/20",
    header: "bg-emerald-500/10",
  },
  {
    id:     "perdido",
    emoji:  "❌",
    label:  "Perdido",
    color:  "text-red-400",
    bg:     "bg-red-500/5",
    border: "border-red-500/20",
    header: "bg-red-500/10",
  },
]

const ORIGENS = ["Instagram", "Indicação", "Site", "WhatsApp", "Outro"] as const
type Origem = typeof ORIGENS[number]

const ORIGEM_BADGE: Record<string, string> = {
  "Instagram": "bg-pink-500/10   text-pink-400   border-pink-500/25",
  "Indicação": "bg-amber-500/10  text-amber-400  border-amber-500/25",
  "Site":      "bg-blue-500/10   text-blue-400   border-blue-500/25",
  "WhatsApp":  "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  "Outro":     "bg-surface-2     text-text-muted  border-border",
}

const EMPTY_FORM = {
  nome:            "",
  telefone:        "",
  instagram:       "",
  origem:          "Instagram" as Origem,
  observacoes:     "",
  valor_potencial: "",
}

function fmtDate(s: string) {
  if (!s) return "—"
  return s.slice(0, 10).split("-").reverse().join("/")
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

// ── Lead Card (draggable) ─────────────────────────────────────────────────────

function LeadCard({
  lead,
  onExpand,
  isDragOverlay = false,
  hasNurturing  = false,
}: {
  lead: Lead
  onExpand: (l: Lead) => void
  isDragOverlay?: boolean
  hasNurturing?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })

  const style = isDragOverlay
    ? { transform: CSS.Translate.toString(transform) }
    : { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-background border rounded-lg p-3 cursor-default select-none transition-all",
        isDragging || isDragOverlay
          ? "border-accent/50 shadow-lg shadow-accent/10 rotate-[1deg]"
          : "border-border hover:border-accent/30"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          aria-label="Arrastar"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onExpand(lead)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[13px] font-semibold text-text-primary leading-tight truncate">
              {lead.nome}
            </span>
            <span className={cn(
              "text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap flex-shrink-0",
              ORIGEM_BADGE[lead.origem] ?? ORIGEM_BADGE["Outro"]
            )}>
              {lead.origem}
            </span>
          </div>

          <div className="space-y-1">
            {lead.telefone && (
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{lead.telefone}</span>
              </div>
            )}
            {lead.instagram && (
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <Instagram className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{lead.instagram.startsWith("@") ? lead.instagram : `@${lead.instagram}`}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-text-muted">{fmtDate(lead.created_at)}</span>
              {hasNurturing && (
                <span className="flex items-center gap-0.5 text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-accent-dim border border-accent-border text-accent">
                  <Zap className="w-2.5 h-2.5" /> NUR
                </span>
              )}
            </div>
            {lead.valor_potencial > 0 && (
              <span className="text-[10px] font-mono text-emerald-400">
                {fmtCurrency(lead.valor_potencial)}
              </span>
            )}
          </div>

          {lead.estagio === "perdido" && lead.motivo_perda && (
            <div className="mt-2 text-[10px] text-red-400/80 italic truncate">
              {lead.motivo_perda}
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Kanban Column (droppable) ─────────────────────────────────────────────────

function KanbanColumn({
  col,
  leads,
  onExpand,
  onAddLead,
  nurturingMap,
}: {
  col: typeof COLUMNS[number]
  leads: Lead[]
  onExpand: (l: Lead) => void
  onAddLead: (estagio: string) => void
  nurturingMap: Record<string, boolean>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div className={cn(
      "flex flex-col rounded-xl border transition-all flex-shrink-0",
      "w-[260px] md:w-auto md:flex-1 min-h-[300px] md:min-h-[480px] max-h-[calc(100vh-220px)]",
      col.bg, col.border,
      isOver && "ring-2 ring-accent/40 border-accent/40"
    )}>
      {/* Column header */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-t-xl border-b",
        col.header, col.border
      )}>
        <div className="flex items-center gap-2">
          <span className="text-[14px]">{col.emoji}</span>
          <span className={cn("text-[12px] font-semibold", col.color)}>{col.label}</span>
          <span className="text-[10px] font-mono text-text-muted bg-background/60 px-1.5 py-0.5 rounded-full border border-border">
            {leads.length}
          </span>
        </div>
        <button
          onClick={() => onAddLead(col.id)}
          className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-background/60 transition-colors"
          aria-label="Adicionar lead"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-none"
      >
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 text-[11px] text-text-muted gap-1">
            <span>Arraste um lead aqui</span>
          </div>
        )}
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onExpand={onExpand} hasNurturing={nurturingMap[lead.id] === true} />
        ))}
      </div>
    </div>
  )
}

// ── New / Edit Lead Modal ─────────────────────────────────────────────────────

function LeadModal({
  initial,
  defaultEstagio,
  onSave,
  onClose,
  saving,
}: {
  initial?: Lead
  defaultEstagio?: string
  onSave: (data: Partial<Lead>) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({
    nome:            initial?.nome            ?? "",
    telefone:        initial?.telefone        ?? "",
    instagram:       initial?.instagram       ?? "",
    origem:          (initial?.origem         ?? "Instagram") as Origem,
    observacoes:     initial?.observacoes     ?? "",
    valor_potencial: initial?.valor_potencial ? String(initial.valor_potencial) : "",
    estagio:         initial?.estagio         ?? defaultEstagio ?? "novo",
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    onSave({
      nome:            form.nome.trim(),
      telefone:        form.telefone.trim() || null,
      instagram:       form.instagram.trim() || null,
      origem:          form.origem,
      observacoes:     form.observacoes.trim() || null,
      valor_potencial: parseFloat(form.valor_potencial.replace(",", ".")) || 0,
      estagio:         form.estagio,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-[15px] font-semibold text-text-primary">
            {initial ? "Editar Lead" : "Novo Lead"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {/* Nome */}
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1.5 tracking-wider uppercase">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              value={form.nome}
              onChange={e => set("nome", e.target.value)}
              placeholder="Nome completo do lead"
              required
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Telefone + Instagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1.5 tracking-wider uppercase">Telefone</label>
              <input
                value={form.telefone}
                onChange={e => set("telefone", fmtPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1.5 tracking-wider uppercase">Instagram</label>
              <input
                value={form.instagram}
                onChange={e => set("instagram", e.target.value)}
                placeholder="@handle"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Origem + Estágio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1.5 tracking-wider uppercase">Origem</label>
              <select
                value={form.origem}
                onChange={e => set("origem", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              >
                {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1.5 tracking-wider uppercase">Estágio</label>
              <select
                value={form.estagio}
                onChange={e => set("estagio", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              >
                {COLUMNS.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Valor potencial */}
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1.5 tracking-wider uppercase">Valor Potencial (R$)</label>
            <input
              value={form.valor_potencial}
              onChange={e => set("valor_potencial", e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="0,00"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[11px] font-mono text-text-muted mb-1.5 tracking-wider uppercase">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={e => set("observacoes", e.target.value)}
              placeholder="Notas sobre o lead..."
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-[13px] text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !form.nome.trim()}
              className="flex-1 py-2 rounded-lg bg-accent text-[13px] font-semibold text-background hover:bg-accent/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {initial ? "Salvar" : "Criar Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Lead Detail Modal ─────────────────────────────────────────────────────────

function LeadDetailModal({
  lead,
  onEdit,
  onDelete,
  onClose,
  onNurturing,
  deleting,
  hasNurturing,
}: {
  lead: Lead
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  onNurturing: () => void
  deleting: boolean
  hasNurturing: boolean
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const col = COLUMNS.find(c => c.id === lead.estagio)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold text-text-primary truncate">{lead.nome}</h2>
            {col && (
              <span className={cn("text-[10px] font-mono", col.color)}>
                {col.emoji} {col.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-1">Origem</div>
              <span className={cn(
                "text-[10px] font-mono font-semibold px-2 py-0.5 rounded border",
                ORIGEM_BADGE[lead.origem] ?? ORIGEM_BADGE["Outro"]
              )}>
                {lead.origem}
              </span>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-1">Valor Potencial</div>
              <div className="text-[14px] font-bold text-emerald-400">{fmtCurrency(lead.valor_potencial)}</div>
            </div>
          </div>

          {(lead.telefone || lead.instagram) && (
            <div className="space-y-2">
              {lead.telefone && (
                <a
                  href={`tel:${lead.telefone.replace(/\D/g, "")}`}
                  className="flex items-center gap-2.5 p-2.5 bg-background border border-border rounded-lg hover:border-accent/30 transition-colors group"
                >
                  <Phone className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
                  <span className="text-[13px] text-text-primary">{lead.telefone}</span>
                  <ExternalLink className="w-3 h-3 text-text-muted ml-auto" />
                </a>
              )}
              {lead.instagram && (
                <a
                  href={`https://instagram.com/${lead.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-background border border-border rounded-lg hover:border-pink-500/30 transition-colors group"
                >
                  <Instagram className="w-3.5 h-3.5 text-text-muted group-hover:text-pink-400 transition-colors" />
                  <span className="text-[13px] text-text-primary">
                    {lead.instagram.startsWith("@") ? lead.instagram : `@${lead.instagram}`}
                  </span>
                  <ExternalLink className="w-3 h-3 text-text-muted ml-auto" />
                </a>
              )}
            </div>
          )}

          {lead.observacoes && (
            <div>
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-1.5">Observações</div>
              <p className="text-[12px] text-text-secondary leading-relaxed bg-background border border-border rounded-lg p-3">
                {lead.observacoes}
              </p>
            </div>
          )}

          {lead.estagio === "perdido" && lead.motivo_perda && (
            <div>
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-1.5">Motivo da Perda</div>
              <p className="text-[12px] text-red-400 leading-relaxed bg-red-50 border border-red-200 rounded-lg p-3">
                {lead.motivo_perda}
              </p>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            {lead.telefone && (
              <a
                href={`https://wa.me/55${lead.telefone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[12px] font-medium hover:bg-emerald-500/15 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}
            <a
              href="/agenda"
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[12px] font-medium hover:bg-blue-500/15 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Agendar
            </a>
            <a
              href={`/nutricao-leads?lead_id=${lead.id}`}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-400 text-[12px] font-medium hover:bg-purple-500/15 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Nutrição
            </a>
            <button
              onClick={onNurturing}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[12px] font-medium transition-colors",
                hasNurturing
                  ? "bg-accent-dim border-accent-border text-accent hover:bg-accent/15"
                  : "bg-surface-2 border-border text-text-muted hover:text-text-primary"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              Nurturing
            </button>
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface-2 border border-border text-text-secondary text-[12px] font-medium hover:text-text-primary transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar
            </button>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 items-center text-[10px] font-mono text-text-muted pt-1 border-t border-border">
            <span>Criado em {fmtDate(lead.created_at)}</span>
            <span>Atualizado em {fmtDate(lead.updated_at)}</span>
          </div>

          {/* Delete */}
          <div className="pt-1">
            {confirmDel ? (
              <div className="flex gap-2">
                <button
                  onClick={onDelete}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[12px] font-semibold hover:bg-red-500/15 transition-colors flex items-center justify-center gap-1.5"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirmar exclusão
                </button>
                <button
                  onClick={() => setConfirmDel(false)}
                  className="px-4 py-2 rounded-lg border border-border text-text-muted text-[12px] hover:text-text-primary transition-colors"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDel(true)}
                className="w-full py-2 rounded-lg border border-border text-text-muted text-[12px] hover:text-red-400 hover:border-red-500/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir lead
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Motivo Perda Modal ────────────────────────────────────────────────────────

function MotivoModal({
  onConfirm,
  onCancel,
  saving,
}: {
  onConfirm: (motivo: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [motivo, setMotivo] = useState("")
  const MOTIVOS = ["Sem resposta", "Preço alto", "Escolheu outro médico", "Não era o momento", "Problema pessoal", "Outro"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-[15px] font-semibold text-text-primary">❌ Motivo da perda</h2>
          <p className="text-[12px] text-text-muted mt-0.5">Por que este lead foi perdido?</p>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {MOTIVOS.map(m => (
              <button
                key={m}
                onClick={() => setMotivo(m)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full border transition-all",
                  motivo === m
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Descreva o motivo..."
            rows={2}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-red-500/40 transition-colors resize-none"
          />

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-lg border border-border text-[13px] text-text-muted hover:text-text-primary transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(motivo)}
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px] font-semibold hover:bg-red-100 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Nurturing Modal ───────────────────────────────────────────────────────────

function NurturingModal({
  leadId,
  leadNome,
  onClose,
}: {
  leadId:   string
  leadNome: string
  onClose:  () => void
}) {
  const [seqs,       setSeqs]       = useState<NurturingSeq[]>([])
  const [loading,    setLoading]    = useState(true)
  const [editId,     setEditId]     = useState<string | null>(null)
  const [editTxt,    setEditTxt]    = useState("")
  const [saving,     setSaving]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/nurturing?lead_id=${leadId}`)
      .then(r => r.ok ? r.json() as Promise<NurturingSeq[]> : [])
      .then(data => setSeqs(data))
      .catch(() => setSeqs([]))
      .finally(() => setLoading(false))
  }, [leadId])

  async function gerarSequencia() {
    setGenerating(true)
    setGenError(null)
    try {
      const r = await fetch("/api/nurturing/gerar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? "Erro ao gerar sequência")
      }
      // Reload sequences after generation
      const data = await fetch(`/api/nurturing?lead_id=${leadId}`)
        .then(res => res.ok ? res.json() as Promise<NurturingSeq[]> : [])
        .catch(() => [])
      setSeqs(data)
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Erro ao gerar sequência")
    } finally {
      setGenerating(false)
    }
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const r = await fetch(`/api/nurturing/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: editTxt }),
    })
    if (r.ok) {
      setSeqs(prev => prev.map(s => s.id === id ? { ...s, mensagem: editTxt } : s))
      setEditId(null)
    }
    setSaving(false)
  }

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" /> Nurturing — {leadNome}
            </h2>
            <p className="text-[11px] text-text-muted mt-0.5">Sequência automática de 4 mensagens</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
          ) : seqs.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Zap className="w-8 h-8 text-text-muted/30 mx-auto" />
              <p className="text-[13px] text-text-muted">Nenhuma sequência gerada ainda.</p>
              {genError && (
                <p className="text-[11px] text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">{genError}</p>
              )}
              <button
                onClick={gerarSequencia}
                disabled={generating}
                className="inline-flex items-center gap-2 text-[12px] font-medium px-4 py-2 rounded-lg border border-accent-border bg-accent-dim text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {generating ? "Gerando sequência…" : "Gerar Sequência Agora"}
              </button>
            </div>
          ) : (
            seqs.map(s => (
              <div key={s.id} className="bg-background border border-border rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-accent bg-accent-dim border border-accent-border px-1.5 py-0.5 rounded">DIA {s.dia}</span>
                    <span className="text-[10px] text-text-muted">{fmtDate(s.agendado_para)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === "enviado" ? (
                      <CheckCircle className="w-4 h-4 text-accent" />
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-text-muted">
                        <Clock className="w-3 h-3" /> Pendente
                      </div>
                    )}
                    {s.status !== "enviado" && (
                      <button
                        onClick={() => { setEditId(s.id === editId ? null : s.id); setEditTxt(s.mensagem) }}
                        className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent-dim transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {editId === s.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editTxt}
                      onChange={e => setEditTxt(e.target.value)}
                      rows={4}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary resize-none focus:outline-none focus:border-accent/50"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setEditId(null)} className="flex-1 py-1.5 rounded-lg border border-border text-[11px] text-text-muted">Cancelar</button>
                      <button onClick={() => saveEdit(s.id)} disabled={saving} className="flex-1 py-1.5 rounded-lg bg-accent text-[11px] font-semibold text-background disabled:opacity-60 flex items-center justify-center gap-1">
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-3">{s.mensagem}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [leads, setLeads]         = useState<Lead[]>([])
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "error">("success")

  // Modals
  const [showNew, setShowNew]           = useState(false)
  const [newEstagio, setNewEstagio]     = useState("novo")
  const [saving, setSaving]             = useState(false)
  const [expanded, setExpanded]         = useState<Lead | null>(null)
  const [editing, setEditing]           = useState<Lead | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // Nurturing
  const [nurturingMap,    setNurturingMap]    = useState<Record<string, boolean>>({})
  const [showNurturing,   setShowNurturing]   = useState<string | null>(null)
  const nurturingLeadNome = leads.find(l => l.id === showNurturing)?.nome ?? ""

  // DnD
  const [activeId, setActiveId]         = useState<string | null>(null)
  const [pendingMove, setPendingMove]   = useState<{ id: string; estagio: string } | null>(null)
  const [movingSaving, setMovingSaving] = useState(false)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    setToastType(type)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/crm")
      if (!res.ok) throw new Error("Erro ao buscar leads")
      setLeads(await res.json())
    } catch (e) {
      console.error("[crm] erro ao carregar leads:", e)
      showToast("Erro ao carregar leads", "error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    fetch("/api/crm/nao-lidos", { method: "PATCH" }).catch(() => {})
    fetch("/api/nurturing")
      .then(r => r.ok ? r.json() as Promise<{ lead_id: string }[]> : [])
      .then(data => {
        const map: Record<string, boolean> = {}
        data.forEach(d => { map[d.lead_id] = true })
        setNurturingMap(map)
      })
      .catch(e => console.error("[crm] erro ao carregar mapa de nurturing:", e))
  }, [fetchLeads])

  // ── CRUD ────────────────────────────────────────────────────────────────────

  async function createLead(data: Partial<Lead>) {
    setSaving(true)
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const novo = await res.json() as Lead
      setLeads(prev => [novo, ...prev])
      setShowNew(false)
      showToast("Lead criado com sucesso")
      // Mark nurturing as active optimistically (backend generates it async)
      if (novo?.id) setNurturingMap(m => ({ ...m, [novo.id]: true }))
    } catch (e) {
      console.error("[crm] erro ao criar lead:", e)
      showToast("Erro ao criar lead", "error")
    } finally {
      setSaving(false)
    }
  }

  async function updateLead(id: string, data: Partial<Lead>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/crm/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json() as Lead
      setLeads(prev => prev.map(l => l.id === id ? updated : l))
      setEditing(null)
      setExpanded(null)
      showToast("Lead atualizado")
    } catch (e) {
      console.error("[crm] erro ao atualizar lead:", e)
      showToast("Erro ao atualizar lead", "error")
    } finally {
      setSaving(false)
    }
  }

  async function moveLeadToEstagio(id: string, estagio: string, motivo_perda?: string) {
    setMovingSaving(true)
    try {
      const body: Partial<Lead> = { estagio }
      if (estagio === "perdido") body.motivo_perda = motivo_perda ?? null
      else body.motivo_perda = null

      const res = await fetch(`/api/crm/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json() as Lead
      setLeads(prev => prev.map(l => l.id === id ? updated : l))
      showToast("Estágio atualizado")
    } catch (e) {
      console.error("[crm] erro ao mover lead de estágio:", e)
      showToast("Erro ao mover lead", "error")
      await fetchLeads()
    } finally {
      setMovingSaving(false)
      setPendingMove(null)
    }
  }

  async function deleteLead(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/crm/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setLeads(prev => prev.filter(l => l.id !== id))
      setExpanded(null)
      showToast("Lead excluído")
    } catch (e) {
      console.error("[crm] erro ao excluir lead:", e)
      showToast("Erro ao excluir lead", "error")
    } finally {
      setDeleting(false)
    }
  }

  // ── DnD ─────────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const lead      = leads.find(l => l.id === active.id)
    const newEstagio = String(over.id)
    if (!lead || lead.estagio === newEstagio) return

    if (newEstagio === "perdido") {
      setPendingMove({ id: lead.id, estagio: "perdido" })
    } else {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, estagio: newEstagio } : l))
      moveLeadToEstagio(lead.id, newEstagio)
    }
  }

  // ── Metrics ─────────────────────────────────────────────────────────────────

  const total        = leads.length
  const ativos       = leads.filter(l => l.estagio === "ativo").length
  const conversion   = total > 0 ? Math.round((ativos / total) * 100) : 0
  const valorTotal   = leads.filter(l => l.estagio !== "perdido").reduce((s, l) => s + (l.valor_potencial ?? 0), 0)

  const oneWeekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const novosSemanais = leads.filter(l => l.created_at >= oneWeekAgo).length

  const activeLead = leads.find(l => l.id === activeId) ?? null

  return (
    <div className="animate-fade-in flex flex-col min-h-screen">
      <TopBar
        title="CRM de Leads"
        subtitle="FUNIL DE PACIENTES · KANBAN"
        tagline="Acompanhe e organize seus leads do primeiro contato até se tornarem pacientes ativos."
        actions={
          <button
            onClick={() => { setNewEstagio("novo"); setShowNew(true) }}
            className="flex items-center gap-1.5 px-5 py-3 bg-accent text-background text-[14px] font-semibold rounded-lg hover:bg-accent/90 transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6 flex-1 overflow-hidden">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-blue-400 opacity-60" />
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-2">Total de Leads</div>
            <div className="text-3xl font-bold text-blue-400">{total}</div>
            <div className="text-[10px] text-text-muted mt-1">no funil</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-accent opacity-60" />
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-2">Conversão</div>
            <div className="text-3xl font-bold text-accent">{conversion}%</div>
            <div className="text-[10px] text-text-muted mt-1">{ativos} pacientes ativos</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-emerald-400 opacity-60" />
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-2">Valor Potencial</div>
            <div className="text-2xl font-bold text-emerald-400 truncate">{fmtCurrency(valorTotal)}</div>
            <div className="text-[10px] text-text-muted mt-1">funil ativo</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-amber-400 opacity-60" />
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-2">Novos esta semana</div>
            <div className="text-3xl font-bold text-amber-400">{novosSemanais}</div>
            <div className="text-[10px] text-text-muted mt-1">últimos 7 dias</div>
          </div>
        </div>

        {/* Kanban */}
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {COLUMNS.map(col => (
              <div key={col.id} className={cn("rounded-xl border flex-shrink-0 w-[280px] md:flex-1 h-[320px] animate-pulse", col.bg, col.border)} />
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  leads={leads.filter(l => l.estagio === col.id)}
                  onExpand={setExpanded}
                  onAddLead={stage => { setNewEstagio(stage); setShowNew(true) }}
                  nurturingMap={nurturingMap}
                />
              ))}
            </div>

            <DragOverlay>
              {activeLead ? (
                <div className="w-[260px]">
                  <LeadCard lead={activeLead} onExpand={() => {}} isDragOverlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* New Lead Modal */}
      {showNew && (
        <LeadModal
          defaultEstagio={newEstagio}
          onSave={createLead}
          onClose={() => setShowNew(false)}
          saving={saving}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <LeadModal
          initial={editing}
          onSave={data => updateLead(editing.id, data)}
          onClose={() => setEditing(null)}
          saving={saving}
        />
      )}

      {/* Detail Modal */}
      {expanded && !editing && (
        <LeadDetailModal
          lead={expanded}
          onEdit={() => { setEditing(expanded); setExpanded(null) }}
          onDelete={() => deleteLead(expanded.id)}
          onClose={() => setExpanded(null)}
          onNurturing={() => { setShowNurturing(expanded.id); setExpanded(null) }}
          deleting={deleting}
          hasNurturing={nurturingMap[expanded.id] === true}
        />
      )}

      {/* Motivo Perda Modal */}
      {pendingMove && (
        <MotivoModal
          onConfirm={motivo => {
            setLeads(prev => prev.map(l => l.id === pendingMove.id ? { ...l, estagio: "perdido", motivo_perda: motivo } : l))
            moveLeadToEstagio(pendingMove.id, "perdido", motivo)
          }}
          onCancel={() => setPendingMove(null)}
          saving={movingSaving}
        />
      )}

      {/* Nurturing Modal */}
      {showNurturing && (
        <NurturingModal
          leadId={showNurturing}
          leadNome={nurturingLeadNome}
          onClose={() => setShowNurturing(null)}
        />
      )}

      <Toast message={toast} type={toastType} />
    </div>
  )
}
