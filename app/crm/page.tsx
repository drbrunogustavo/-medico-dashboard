"use client"

import Link from "next/link"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Toast } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  DndContext, DragOverlay, PointerSensor, closestCenter,
  useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus, X, Loader2, Phone, Instagram, CalendarDays, MessageSquare, MessageCircle,
  Edit2, Trash2, GripVertical, ChevronDown, Check,
  ExternalLink, Zap, CheckCircle, Clock, Edit3, Sparkles,
} from "lucide-react"
import { ErrorState } from "@/components/ErrorState"
import { Panel, PxButton, Tag, Field, PxInput, PxSelect, PxModal, PageHeader, Ring } from "@/components/px"

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

type TagTone = "neutral" | "accent" | "danger" | "ok" | "warn"

const COLUMNS: { id: string; label: string; short: string; tone: TagTone }[] = [
  { id: "novo",     label: "Novo lead",         short: "Novo",     tone: "neutral" },
  { id: "contato",  label: "Contato feito",     short: "Contato",  tone: "warn"    },
  { id: "agendado", label: "Consulta agendada", short: "Agendado", tone: "accent"  },
  { id: "ativo",    label: "Paciente ativo",    short: "Ativo",    tone: "ok"      },
  { id: "perdido",  label: "Perdido",           short: "Perdido",  tone: "danger"  },
]

const ORIGENS = ["Instagram", "Indicação", "Site", "WhatsApp", "Outro"] as const
type Origem = typeof ORIGENS[number]

const linkBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-px-ctl border border-px-line bg-white/60 px-4 text-[13.5px] font-semibold text-px-ink hover:bg-white/90"
const areaTexto =
  "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-3 text-[13.5px] text-px-ink placeholder:text-px-muted"

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

// ── Cartão do lead (visual puro, sem hooks: serve também ao DragOverlay) ───────

function LeadCardContent({
  lead, onExpand, onMoveStage, isDragOverlay = false, isDragging = false, hasNurturing = false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragListeners,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragAttributes,
}: {
  lead: Lead
  onExpand: (l: Lead) => void
  onMoveStage?: (leadId: string, newEstagio: string) => void
  isDragOverlay?: boolean
  isDragging?: boolean
  hasNurturing?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragListeners?: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragAttributes?: Record<string, any>
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const otherCols = COLUMNS.filter(c => c.id !== lead.estagio)
  const isActive  = isDragging || isDragOverlay

  return (
    <div className={cn(
      "select-none rounded-px-card p-3 transition-shadow",
      isActive ? "rotate-[1deg] bg-white shadow-[0_12px_28px_rgba(20,20,20,0.25)] ring-1 ring-px-ink/40" : "bg-white/85 hover:bg-white"
    )}>
      <div className="flex items-start gap-1.5">
        <button
          {...(dragListeners ?? {})}
          {...(dragAttributes ?? {})}
          className="-ml-1 flex h-8 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-px-muted hover:text-px-ink active:cursor-grabbing"
          aria-label={`Arrastar ${lead.nome}`}
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => onExpand(lead)} className="w-full text-left">
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <span className="truncate text-[14px] font-semibold leading-tight text-px-ink">{lead.nome}</span>
              <Tag className="shrink-0">{lead.origem}</Tag>
            </div>

            <div className="space-y-1 text-[12.5px] text-px-muted">
              {lead.telefone && (
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{lead.telefone}</span></div>
              )}
              {lead.instagram && (
                <div className="flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{lead.instagram.startsWith("@") ? lead.instagram : `@${lead.instagram}`}</span></div>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-px-line pt-2">
              <span className="flex items-center gap-1.5 text-[12px] tabular-nums text-px-muted">
                {fmtDate(lead.created_at)}
                {hasNurturing && <Tag tone="accent"><Zap className="mr-1 h-3 w-3" aria-hidden="true" />Nurturing</Tag>}
              </span>
              {lead.valor_potencial > 0 && <span className="text-[12.5px] font-semibold tabular-nums text-px-ok">{fmtCurrency(lead.valor_potencial)}</span>}
            </div>

            {lead.estagio === "perdido" && lead.motivo_perda && (
              <p className="mt-2 truncate text-[12.5px] text-px-danger">{lead.motivo_perda}</p>
            )}
          </button>

          {lead.telefone && (
            <a
              href={`https://wa.me/55${lead.telefone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="mt-2 flex w-fit items-center gap-1 text-[12.5px] font-semibold text-px-ok underline-offset-4 hover:underline"
              aria-label={`Abrir WhatsApp de ${lead.nome}`}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              WhatsApp
            </a>
          )}

          {onMoveStage && !isDragOverlay && (
            <div>
              {!showMoveMenu ? (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setShowMoveMenu(true) }}
                  className="mt-1.5 flex items-center gap-1 text-[12.5px] font-medium text-px-muted hover:text-px-ink"
                >
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> Mover para
                </button>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {otherCols.map(col => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={e => { e.stopPropagation(); onMoveStage(lead.id, col.id); setShowMoveMenu(false) }}
                      className="rounded-full bg-px-ink/[0.08] px-2.5 py-1 text-[12px] font-medium text-px-ink hover:bg-px-ink/15"
                    >
                      {col.short}
                    </button>
                  ))}
                  <button type="button" onClick={() => setShowMoveMenu(false)} aria-label="Fechar" className="flex h-7 w-7 items-center justify-center rounded-full text-px-muted hover:bg-px-ink/10">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Cartão arrastável ─────────────────────────────────────────────────────────

function LeadCard({
  lead, onExpand, onMoveStage, hasNurturing = false,
}: {
  lead: Lead
  onExpand: (l: Lead) => void
  onMoveStage?: (leadId: string, newEstagio: string) => void
  hasNurturing?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCardContent lead={lead} onExpand={onExpand} onMoveStage={onMoveStage} isDragging={isDragging} hasNurturing={hasNurturing} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  )
}

// ── Coluna do kanban (área de soltar) ─────────────────────────────────────────

function KanbanColumn({
  col, leads, onExpand, onAddLead, nurturingMap, onMoveStage, quickAddNode,
}: {
  col: typeof COLUMNS[number]
  leads: Lead[]
  onExpand: (l: Lead) => void
  onAddLead: (estagio: string) => void
  nurturingMap: Record<string, boolean>
  onMoveStage: (leadId: string, newEstagio: string) => void
  quickAddNode?: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "px-glass flex w-[272px] shrink-0 flex-col rounded-px-panel md:w-auto md:min-w-[230px] md:flex-1",
        "min-h-[300px] max-h-[calc(100vh-260px)] md:min-h-[480px]",
        isOver && "ring-2 ring-px-ink"
      )}
    >
      <div className="flex items-center justify-between border-b border-px-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Tag tone={col.tone}>{col.label}</Tag>
          <span className="text-[13px] font-semibold tabular-nums text-px-ink" aria-label={`${leads.length} leads`}>{leads.length}</span>
        </div>
        <button
          type="button"
          onClick={() => onAddLead(col.id)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-px-ink/[0.08] text-px-ink hover:bg-px-ink/15"
          aria-label={`Adicionar lead em ${col.label}`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2.5 scrollbar-none">
        {quickAddNode}
        {leads.length === 0 && (
          <p className="px-2 py-6 text-center text-[13px] text-px-muted">
            Nenhum lead nesta etapa.{col.id === "novo" ? " Use o campo acima para adicionar rápido." : ""}
          </p>
        )}
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onExpand={onExpand} onMoveStage={onMoveStage} hasNurturing={nurturingMap[lead.id] === true} />
        ))}
      </div>
    </div>
  )
}

// ── Novo lead / editar lead ───────────────────────────────────────────────────

function LeadModal({
  initial, defaultEstagio, onSave, onClose, saving,
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
    <PxModal open onClose={onClose} title={initial ? "Editar lead" : "Novo lead"} className="max-w-[460px]">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-0.5">
        <Field label="Nome *" htmlFor="lead-nome">
          <PxInput id="lead-nome" value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo do lead" required />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Telefone" htmlFor="lead-tel">
            <PxInput id="lead-tel" value={form.telefone} onChange={e => set("telefone", fmtPhone(e.target.value))} placeholder="(11) 99999-9999" />
          </Field>
          <Field label="Instagram" htmlFor="lead-ig">
            <PxInput id="lead-ig" value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="@perfil" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Origem" htmlFor="lead-origem">
            <PxSelect id="lead-origem" value={form.origem} onChange={e => set("origem", e.target.value)}>
              {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
            </PxSelect>
          </Field>
          <Field label="Etapa" htmlFor="lead-etapa">
            <PxSelect id="lead-etapa" value={form.estagio} onChange={e => set("estagio", e.target.value)}>
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </PxSelect>
          </Field>
        </div>
        {initial && (
          <Field label="Valor potencial (R$)" htmlFor="lead-valor">
            <PxInput id="lead-valor" inputMode="decimal" value={form.valor_potencial} onChange={e => set("valor_potencial", e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="0,00" />
          </Field>
        )}
        {initial && (
          <Field label="Observações" htmlFor="lead-obs">
            <textarea id="lead-obs" value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Notas sobre o lead" rows={3} className={areaTexto} />
          </Field>
        )}
        <div className="flex gap-2 pt-1">
          <PxButton variant="secondary" onClick={onClose}>Cancelar</PxButton>
          <PxButton type="submit" fullWidth leftIcon={Check} loading={saving} disabled={!form.nome.trim()}>{initial ? "Salvar" : "Criar lead"}</PxButton>
        </div>
      </form>
    </PxModal>
  )
}

// ── Detalhe do lead ───────────────────────────────────────────────────────────

function LeadDetailModal({
  lead, onEdit, onDelete, onClose, onNurturing, deleting, hasNurturing,
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
    <PxModal open onClose={onClose} title={lead.nome} className="max-w-[460px]">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {col && <Tag tone={col.tone}>{col.label}</Tag>}
          <Tag>{lead.origem}</Tag>
          <span className="ml-auto text-[14px] font-semibold tabular-nums text-px-ok">{fmtCurrency(lead.valor_potencial)}</span>
        </div>

        {(lead.telefone || lead.instagram) && (
          <div className="space-y-2">
            {lead.telefone && (
              <a href={`tel:${lead.telefone.replace(/\D/g, "")}`} className={cn(linkBtn, "w-full justify-start")}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">{lead.telefone}</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-px-muted" aria-hidden="true" />
              </a>
            )}
            {lead.instagram && (
              <a href={`https://instagram.com/${lead.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className={cn(linkBtn, "w-full justify-start")}>
                <Instagram className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">{lead.instagram.startsWith("@") ? lead.instagram : `@${lead.instagram}`}</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-px-muted" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        {lead.observacoes && (
          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold text-px-ink">Observações</h3>
            <p className="rounded-px-ctl bg-white/70 p-3 text-[13.5px] leading-relaxed text-px-ink">{lead.observacoes}</p>
          </div>
        )}

        {lead.estagio === "perdido" && lead.motivo_perda && (
          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold text-px-danger">Motivo da perda</h3>
            <p className="rounded-px-ctl bg-px-danger-soft p-3 text-[13.5px] leading-relaxed text-px-danger">{lead.motivo_perda}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {lead.telefone && (
            <a href={`https://wa.me/55${lead.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className={linkBtn}>
              <MessageSquare className="h-4 w-4" aria-hidden="true" />WhatsApp
            </a>
          )}
          <PxButton variant="secondary" href="/agenda" leftIcon={CalendarDays}>Agendar</PxButton>
          <PxButton variant="secondary" href={`/nutricao-leads?lead_id=${lead.id}`} leftIcon={Sparkles}>Nutrição</PxButton>
          <PxButton variant={hasNurturing ? "primary" : "secondary"} leftIcon={Zap} onClick={onNurturing}>Nurturing</PxButton>
          <PxButton variant="secondary" leftIcon={Edit2} onClick={onEdit}>Editar</PxButton>
        </div>

        <p className="flex flex-wrap gap-x-3 border-t border-px-line pt-3 text-[12.5px] tabular-nums text-px-muted">
          <span>Criado em {fmtDate(lead.created_at)}</span>
          <span>Atualizado em {fmtDate(lead.updated_at)}</span>
        </p>

        {confirmDel ? (
          <div className="flex gap-2">
            <PxButton variant="danger" fullWidth leftIcon={Trash2} loading={deleting} onClick={onDelete}>Confirmar exclusão</PxButton>
            <PxButton variant="secondary" onClick={() => setConfirmDel(false)}>Não</PxButton>
          </div>
        ) : (
          <PxButton variant="quiet" fullWidth leftIcon={Trash2} onClick={() => setConfirmDel(true)}>Excluir lead</PxButton>
        )}
      </div>
    </PxModal>
  )
}

// ── Motivo da perda ───────────────────────────────────────────────────────────

const MOTIVOS = ["Sem resposta", "Preço alto", "Escolheu outro médico", "Não era o momento", "Problema pessoal", "Outro"]

function MotivoModal({
  onConfirm, onCancel, saving,
}: {
  onConfirm: (motivo: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [motivo, setMotivo] = useState("")

  return (
    <PxModal open onClose={onCancel} title="Por que este lead foi perdido?">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Motivos comuns">
          {MOTIVOS.map(m => (
            <button
              key={m}
              type="button"
              aria-pressed={motivo === m}
              onClick={() => setMotivo(m)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12.5px] transition-colors",
                motivo === m ? "bg-px-ink font-semibold text-white" : "bg-px-ink/[0.08] font-medium text-px-ink hover:bg-px-ink/15"
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Descreva o motivo" aria-label="Motivo da perda" rows={2} className={areaTexto} />
        <div className="flex gap-2">
          <PxButton variant="secondary" onClick={onCancel}>Cancelar</PxButton>
          <PxButton fullWidth loading={saving} onClick={() => onConfirm(motivo)}>Confirmar</PxButton>
        </div>
      </div>
    </PxModal>
  )
}

// ── Nurturing ─────────────────────────────────────────────────────────────────

function NurturingModal({
  leadId, leadNome, onClose,
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

  function fmtDia(s: string) {
    return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  return (
    <PxModal open onClose={onClose} title={`Nurturing de ${leadNome}`} className="max-w-[520px]">
      <p className="-mt-2 mb-3 text-[13px] text-px-muted">Sequência automática de 4 mensagens.</p>
      <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-0.5">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-px-ink" aria-label="Carregando" /></div>
        ) : seqs.length === 0 ? (
          <div className="space-y-3 py-8 text-center">
            <p className="text-[14px] text-px-ink">Nenhuma sequência gerada ainda.</p>
            {genError && <p role="alert" className="text-[13px] text-px-danger">{genError}</p>}
            <div className="flex justify-center">
              <PxButton leftIcon={Zap} loading={generating} onClick={gerarSequencia}>{generating ? "Gerando sequência" : "Gerar sequência agora"}</PxButton>
            </div>
          </div>
        ) : (
          seqs.map(s => (
            <div key={s.id} className="space-y-2 rounded-px-card bg-white/70 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tag tone="accent">Dia {s.dia}</Tag>
                  <span className="text-[12.5px] text-px-muted">{fmtDia(s.agendado_para)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === "enviado" ? (
                    <span className="flex items-center gap-1 text-[12.5px] font-medium text-px-ok"><CheckCircle className="h-4 w-4" aria-hidden="true" />Enviado</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[12.5px] text-px-muted"><Clock className="h-3.5 w-3.5" aria-hidden="true" />Pendente</span>
                  )}
                  {s.status !== "enviado" && (
                    <button
                      type="button"
                      onClick={() => { setEditId(s.id === editId ? null : s.id); setEditTxt(s.mensagem) }}
                      aria-label={`Editar mensagem do dia ${s.dia}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-px-ink hover:bg-px-ink/10"
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {editId === s.id ? (
                <div className="space-y-2">
                  <textarea value={editTxt} onChange={e => setEditTxt(e.target.value)} rows={4} aria-label={`Mensagem do dia ${s.dia}`} className={areaTexto} />
                  <div className="flex gap-2">
                    <PxButton size="sm" variant="secondary" fullWidth onClick={() => setEditId(null)}>Cancelar</PxButton>
                    <PxButton size="sm" fullWidth leftIcon={Check} loading={saving} onClick={() => saveEdit(s.id)}>Salvar</PxButton>
                  </div>
                </div>
              ) : (
                <p className="line-clamp-3 text-[13.5px] leading-relaxed text-px-ink">{s.mensagem}</p>
              )}
            </div>
          ))
        )}
      </div>
    </PxModal>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [leads, setLeads]         = useState<Lead[]>([])
  const [loading, setLoading]     = useState(true)
  const [erro,    setErro]        = useState<string | null>(null)
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

  // Quick-add
  const [quickNome,   setQuickNome]   = useState("")
  const [quickTel,    setQuickTel]    = useState("")
  const [quickSaving, setQuickSaving] = useState(false)
  const quickNomeRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, type: "success" | "error" = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    setToastType(type)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch("/api/crm")
      if (!res.ok) throw new Error("Erro ao buscar leads")
      setLeads(await res.json())
    } catch {
      setErro("Falha ao carregar leads. Tente novamente.")
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

  const handleQuickAdd = useCallback(async () => {
    if (!quickNome.trim() || quickSaving) return
    setQuickSaving(true)
    await createLead({
      nome:     quickNome.trim(),
      telefone: quickTel || null,
      origem:   "Instagram",
      estagio:  "novo",
    })
    setQuickNome("")
    setQuickTel("")
    setQuickSaving(false)
    quickNomeRef.current?.focus()
  }, [quickNome, quickTel, quickSaving, createLead])

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

  function handleMoveStage(leadId: string, newEstagio: string) {
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.estagio === newEstagio) return
    if (newEstagio === "perdido") {
      setPendingMove({ id: leadId, estagio: "perdido" })
    } else {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, estagio: newEstagio } : l))
      moveLeadToEstagio(leadId, newEstagio)
    }
  }

  // ── Metrics ─────────────────────────────────────────────────────────────────

  const { total, ativos, conversion, valorTotal, novosSemanais } = useMemo(() => {
    const total        = leads.length
    const ativos       = leads.filter(l => l.estagio === "ativo").length
    const conversion   = total > 0 ? Math.round((ativos / total) * 100) : 0
    const valorTotal   = leads.filter(l => l.estagio !== "perdido").reduce((s, l) => s + (l.valor_potencial ?? 0), 0)
    const oneWeekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const novosSemanais = leads.filter(l => l.created_at >= oneWeekAgo).length
    return { total, ativos, conversion, valorTotal, novosSemanais }
  }, [leads])

  const leadsByEstagio = useMemo(() =>
    leads.reduce<Record<string, typeof leads>>((acc, l) => {
      if (!acc[l.estagio]) acc[l.estagio] = []
      acc[l.estagio].push(l)
      return acc
    }, {}),
  [leads])

  const activeLead = useMemo(() => leads.find(l => l.id === activeId) ?? null, [leads, activeId])

  return (
    <div className="px px-ambient flex min-h-screen animate-fade-in flex-col">
      <PageHeader
        title="CRM"
        caption="Funil de pacientes"
        actions={<PxButton leftIcon={Plus} onClick={() => { setNewEstagio("novo"); setShowNew(true) }}>Novo lead</PxButton>}
      />

      <div className="flex-1 space-y-4 overflow-hidden px-4 pb-10 pt-4 md:px-10">
        {/* Quantos leads, quantos viraram pacientes, quanto vale o funil */}
        <Panel tone="dark" aria-label="Resumo do funil">
          <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <Ring value={conversion} label={`${ativos} de ${total} viraram pacientes`} dark size={104} />
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-[13px] text-white">Leads no funil</dt>
                <dd className="mt-1 text-[34px] font-medium leading-none tracking-[-0.02em] tabular-nums text-white">{total}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-white">Valor potencial</dt>
                <dd className="mt-1 truncate text-[34px] font-medium leading-none tracking-[-0.02em] tabular-nums text-white">{fmtCurrency(valorTotal)}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-white">Novos nos últimos 7 dias</dt>
                <dd className="mt-1 text-[34px] font-medium leading-none tracking-[-0.02em] tabular-nums text-white">{novosSemanais}</dd>
              </div>
            </dl>
          </div>
        </Panel>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {COLUMNS.map(col => (
              <div key={col.id} className="px-glass w-[272px] shrink-0 space-y-2 rounded-px-panel p-3 md:w-auto md:flex-1">
                <div className="h-6 w-28 rounded-full bg-px-ink/10 shimmer" />
                {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-px-card bg-white/60 shimmer" />)}
              </div>
            ))}
          </div>
        ) : erro ? (
          <ErrorState message={erro} onRetry={fetchLeads} className="py-12" />
        ) : leads.length === 0 ? (
          <Panel tone="light" className="py-10 text-center">
            <p className="text-[16px] font-semibold text-px-ink">Nenhum lead ainda</p>
            <p className="mx-auto mt-1 max-w-sm text-[14px] text-px-muted">Adicione o primeiro lead para acompanhar o funil de pacientes.</p>
            <div className="mt-4 flex justify-center">
              <PxButton leftIcon={Plus} onClick={() => { setNewEstagio("novo"); setShowNew(true) }}>Adicionar lead</PxButton>
            </div>
          </Panel>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  leads={leadsByEstagio[col.id] ?? []}
                  onExpand={setExpanded}
                  onAddLead={stage => { setNewEstagio(stage); setShowNew(true) }}
                  nurturingMap={nurturingMap}
                  onMoveStage={handleMoveStage}
                  quickAddNode={col.id === "novo" ? (
                    <div className="mb-2 flex gap-1.5">
                      <PxInput
                        ref={quickNomeRef}
                        placeholder="Nome"
                        aria-label="Nome do novo lead"
                        value={quickNome}
                        onChange={e => setQuickNome(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
                        disabled={quickSaving}
                        className="h-10 min-w-0 flex-1 px-3 text-[13px]"
                      />
                      <PxInput
                        placeholder="Telefone"
                        aria-label="Telefone do novo lead"
                        value={quickTel}
                        onChange={e => setQuickTel(fmtPhone(e.target.value))}
                        onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
                        disabled={quickSaving}
                        className="h-10 w-[104px] px-3 text-[13px]"
                      />
                    </div>
                  ) : undefined}
                />
              ))}
            </div>

            <DragOverlay>
              {activeLead ? (
                <div className="w-[260px]">
                  <LeadCardContent lead={activeLead} onExpand={() => {}} isDragOverlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {showNew && <LeadModal defaultEstagio={newEstagio} onSave={createLead} onClose={() => setShowNew(false)} saving={saving} />}

      {editing && <LeadModal initial={editing} onSave={data => updateLead(editing.id, data)} onClose={() => setEditing(null)} saving={saving} />}

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

      {showNurturing && <NurturingModal leadId={showNurturing} leadNome={nurturingLeadNome} onClose={() => setShowNurturing(null)} />}

      <Toast message={toast} type={toastType} />
    </div>
  )
}
