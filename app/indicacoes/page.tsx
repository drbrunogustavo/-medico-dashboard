"use client"

import { useState, useEffect, useCallback } from "react"
import { Panel, PxButton, Tag, Field, PxInput, PxModal, PageHeader } from "@/components/px"
import { Toast, type ToastType } from "@/components/Toast"
import { Plus, Check, Gift, Phone, ChevronDown, ChevronUp } from "lucide-react"

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

type Tone = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"

const STATUS_TAG: Record<string, { label: string; tone: Tone }> = {
  pendente:        { label: "Pendente",           tone: "neutral" },
  cortesia_gerada: { label: "Cortesia gerada",    tone: "warn" },
  cortesia_usada:  { label: "Cortesia utilizada", tone: "ok" },
}

function fmtDate(s: string) { return s ? new Date(s).toLocaleDateString("pt-BR") : "Sem data" }
function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d; if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

// ── Modal: nova indicação ─────────────────────────────────────────────────────

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
    <PxModal open onClose={onClose} title="Nova indicação" className="max-w-md">
      <form onSubmit={submit} className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="mb-2 text-[13px] font-semibold text-px-ink">Quem indicou</legend>
          <Field label="Nome do paciente indicador" htmlFor="ind-r-nome">
            <PxInput id="ind-r-nome" value={form.indicador_nome} onChange={e => set("indicador_nome", e.target.value)} required />
          </Field>
          <Field label="WhatsApp do indicador" htmlFor="ind-r-tel">
            <PxInput id="ind-r-tel" inputMode="tel" value={form.indicador_telefone} onChange={e => set("indicador_telefone", fmtPhone(e.target.value))} required />
          </Field>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-2 text-[13px] font-semibold text-px-ink">Quem foi indicado</legend>
          <Field label="Nome do indicado" htmlFor="ind-d-nome">
            <PxInput id="ind-d-nome" value={form.indicado_nome} onChange={e => set("indicado_nome", e.target.value)} required />
          </Field>
          <Field label="WhatsApp do indicado" htmlFor="ind-d-tel">
            <PxInput id="ind-d-tel" inputMode="tel" value={form.indicado_telefone} onChange={e => set("indicado_telefone", fmtPhone(e.target.value))} required />
          </Field>
        </fieldset>
        <div className="flex gap-2 pt-1">
          <PxButton variant="secondary" fullWidth onClick={onClose}>Cancelar</PxButton>
          <PxButton type="submit" fullWidth leftIcon={Check} loading={saving} disabled={saving || !valid}>Registrar</PxButton>
        </div>
      </form>
    </PxModal>
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
  const st = STATUS_TAG[ind.status] ?? STATUS_TAG.pendente
  const busy = updating === ind.id
  const etapas = [
    { done: true,                             label: "Indicação registrada" },
    { done: ind.consulta_indicado_realizada,  label: "Indicado consultou" },
    { done: ind.cortesia_gerada,              label: "Cortesia gerada" },
    { done: ind.cortesia_usada,               label: "Cortesia usada" },
  ]

  return (
    <Panel tone="light" className="p-0 overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14px] font-semibold text-px-ink">{ind.indicador_nome}</span>
            <span className="text-[12px] text-px-muted">indicou</span>
            <span className="text-[14px] text-px-ink">{ind.indicado_nome}</span>
            <Tag tone={st.tone}>{st.label}</Tag>
          </div>
          <p className="mt-0.5 text-[12px] text-px-muted">{fmtDate(ind.created_at)}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-px-muted" aria-hidden /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-px-muted" aria-hidden />}
      </button>

      {open && (
        <div className="space-y-4 border-t border-px-line p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { titulo: "Indicador", nome: ind.indicador_nome, tel: ind.indicador_telefone },
              { titulo: "Indicado",  nome: ind.indicado_nome,  tel: ind.indicado_telefone },
            ].map(p => (
              <div key={p.titulo} className="rounded-px-card border border-px-line bg-white/50 p-3">
                <p className="mb-1 text-[12px] text-px-muted">{p.titulo}</p>
                <p className="text-[13px] font-semibold text-px-ink">{p.nome}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-px-muted"><Phone className="h-3 w-3" aria-hidden />{p.tel}</p>
              </div>
            ))}
          </div>

          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {etapas.map(step => (
              <li key={step.label} className="flex items-center gap-1.5">
                <span aria-hidden className={step.done ? "h-2.5 w-2.5 rounded-full bg-px-ink" : "h-2.5 w-2.5 rounded-full border border-px-muted"} />
                <span className={step.done ? "text-[12px] font-medium text-px-ink" : "text-[12px] text-px-muted"}>
                  {step.label}
                  <span className="sr-only">{step.done ? ", concluída" : ", pendente"}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2">
            {!ind.consulta_indicado_realizada && (
              <PxButton size="sm" leftIcon={Check} loading={busy} disabled={busy} onClick={() => onConfirmarConsulta(ind.id)}>
                Confirmar consulta do indicado
              </PxButton>
            )}
            {ind.cortesia_gerada && !ind.cortesia_usada && (
              <PxButton size="sm" variant="secondary" leftIcon={Gift} loading={busy} disabled={busy} onClick={() => onConfirmarCortesia(ind.id)}>
                Marcar cortesia usada
              </PxButton>
            )}
          </div>
        </div>
      )}
    </Panel>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function IndicacoesPage() {
  const [items,    setItems]    = useState<Indicacao[]>([])
  const [loading,  setLoading]  = useState(true)
  const [loadErr,  setLoadErr]  = useState(false)
  const [showAdd,  setShowAdd]  = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)
  const [toastType, setToastType] = useState<ToastType>("success")

  function showToast(msg: string, type: ToastType = "success") {
    setToastType(type); setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  const fetch_ = useCallback(async () => {
    setLoading(true); setLoadErr(false)
    try {
      const r = await fetch("/api/indicacoes")
      if (r.ok) setItems(await r.json()); else setLoadErr(true)
    } catch { setLoadErr(true) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function add(form: Record<string, string>) {
    try {
      const r = await fetch("/api/indicacoes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      })
      if (r.ok) { showToast("Indicação registrada"); setShowAdd(false); await fetch_() }
      else showToast("Erro ao registrar indicação", "error")
    } catch { showToast("Erro ao registrar indicação", "error") }
  }

  async function patch(id: string, body: object) {
    setUpdating(id)
    try {
      const r = await fetch(`/api/indicacoes/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      })
      if (r.ok) {
        const updated = await r.json() as Indicacao
        setItems(prev => prev.map(i => i.id === id ? updated : i))
        showToast("Atualizado")
      } else showToast("Erro ao atualizar", "error")
    } catch { showToast("Erro ao atualizar", "error") }
    finally { setUpdating(null) }
  }

  const total           = items.length
  const convertidas     = items.filter(i => i.consulta_indicado_realizada).length
  const cortesiasAtivas = items.filter(i => i.cortesia_gerada && !i.cortesia_usada).length
  const taxa            = total > 0 ? Math.round((convertidas / total) * 100) : 0

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Indicações"
        caption="Pacientes que trazem pacientes"
        actions={<PxButton leftIcon={Plus} onClick={() => setShowAdd(true)}>Nova indicação</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel tone="dark">
          <dl className="grid grid-cols-2 gap-4 text-white md:grid-cols-4">
            <div>
              <dt className="text-[12px] text-white/80">Indicações</dt>
              <dd className="mt-1 text-[32px] font-semibold leading-none tabular-nums">{total}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-white/80">Indicados que consultaram</dt>
              <dd className="mt-1 text-[32px] font-semibold leading-none tabular-nums">{convertidas}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-white/80">Taxa de conversão</dt>
              <dd className="mt-1 text-[32px] font-semibold leading-none tabular-nums">{taxa}%</dd>
            </div>
            <div>
              <dt className="text-[12px] text-white/80">Cortesias a usar</dt>
              <dd className="mt-1 text-[32px] font-semibold leading-none tabular-nums">{cortesiasAtivas}</dd>
            </div>
          </dl>
        </Panel>

        <Panel tone="light">
          <p className="text-[13px] leading-relaxed text-px-ink">
            Quando um paciente indica alguém e o indicado realiza a consulta, a próxima consulta de quem indicou passa a ser uma <strong className="font-semibold">cortesia administrativa</strong>. A cortesia só é gerada depois que a consulta do indicado é confirmada aqui.
          </p>
        </Panel>

        {loading ? (
          <div className="space-y-3" aria-busy="true">{[1, 2, 3].map(i => <div key={i} className="px-glass h-[68px] animate-pulse rounded-px-panel" />)}</div>
        ) : loadErr ? (
          <Panel tone="light" className="py-12 text-center">
            <p role="alert" className="text-[14px] text-px-danger">Não foi possível carregar as indicações.</p>
            <div className="mt-4 flex justify-center"><PxButton variant="secondary" onClick={fetch_}>Tentar de novo</PxButton></div>
          </Panel>
        ) : items.length === 0 ? (
          <Panel tone="light" className="py-14 text-center">
            <p className="text-[14px] text-px-ink">Nenhuma indicação registrada ainda.</p>
            <div className="mt-4 flex justify-center"><PxButton leftIcon={Plus} onClick={() => setShowAdd(true)}>Registrar a primeira</PxButton></div>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {items.map(ind => (
              <li key={ind.id}>
                <IndicacaoCard
                  ind={ind}
                  onConfirmarConsulta={id => patch(id, { consulta_indicado_realizada: true })}
                  onConfirmarCortesia={id => patch(id, { cortesia_usada: true })}
                  updating={updating}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAdd && <AddModal onSave={add} onClose={() => setShowAdd(false)} />}
      <Toast message={toast} type={toastType} />
    </div>
  )
}
