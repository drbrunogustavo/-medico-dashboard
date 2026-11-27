"use client"

import { useState, useEffect, useCallback } from "react"
import { Panel, PxButton, Tag, Field, PxInput, PxModal, PageHeader } from "@/components/px"
import { Toast, type ToastType } from "@/components/Toast"
import { ChevronDown, ChevronUp, Send, Pause, Play, Trash2, Plus, Check } from "lucide-react"

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

const TIPO_LABEL: Record<string, string> = {
  aniversario:    "Aniversário",
  retorno:        "Lembrete de retorno",
  dica_protocolo: "Dica do protocolo",
  hidratacao:     "Hidratação",
  sono:           "Boa noite",
}

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

// ── Modal: adicionar paciente ─────────────────────────────────────────────────

function AddModal({ onSave, onClose }: { onSave: (f: Record<string, string>) => Promise<void>; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    paciente_nome: "", paciente_telefone: "",
    data_nascimento: "", data_ultima_consulta: "", protocolo_ativo: "",
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const invalido = !form.paciente_nome.trim() || !form.paciente_telefone.trim()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (invalido) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <PxModal open onClose={onClose} title="Adicionar à régua" className="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome *" htmlFor="rg-nome">
          <PxInput id="rg-nome" value={form.paciente_nome} onChange={e => set("paciente_nome", e.target.value)} required placeholder="Nome do paciente" />
        </Field>
        <Field label="WhatsApp *" htmlFor="rg-tel">
          <PxInput id="rg-tel" value={form.paciente_telefone} onChange={e => set("paciente_telefone", fmtPhone(e.target.value))} required placeholder="(11) 99999-9999" inputMode="tel" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Data de nascimento" htmlFor="rg-nasc" hint="Gera a mensagem de aniversário">
            <PxInput id="rg-nasc" type="date" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} />
          </Field>
          <Field label="Última consulta" htmlFor="rg-ult" hint="Base do lembrete de retorno">
            <PxInput id="rg-ult" type="date" value={form.data_ultima_consulta} onChange={e => set("data_ultima_consulta", e.target.value)} />
          </Field>
        </div>
        <Field label="Protocolo ativo" htmlFor="rg-prot" hint="A IA escreve as mensagens com base nele">
          <PxInput id="rg-prot" value={form.protocolo_ativo} onChange={e => set("protocolo_ativo", e.target.value)} placeholder="Ex: emagrecimento, hormônios" />
        </Field>
        <div className="flex gap-2 pt-1">
          <PxButton variant="secondary" fullWidth onClick={onClose}>Cancelar</PxButton>
          <PxButton type="submit" fullWidth loading={saving} disabled={invalido} leftIcon={Check}>
            {saving ? "Gerando mensagens" : "Adicionar"}
          </PxButton>
        </div>
      </form>
    </PxModal>
  )
}

// ── Grupo por paciente ────────────────────────────────────────────────────────

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
  const [confirmando, setConfirmando] = useState(false)
  const isPaused = msgs.some(m => m.pausado)
  const sent     = msgs.filter(m => m.status === "enviado").length
  const painel   = `regua-${nome.replace(/\s+/g, "-")}`

  return (
    <Panel tone="light" className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={painel}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/40"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-px-ink/10 text-[12px] font-semibold text-px-ink">
            {nome.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold text-px-ink">{nome}</span>
            <span className="block text-[12px] text-px-muted">{msgs[0]?.paciente_telefone}</span>
          </span>
        </span>
        <span className="ml-2 flex flex-shrink-0 items-center gap-3">
          {isPaused && <Tag tone="warn">Pausada</Tag>}
          <span className="text-[12px] text-px-muted">{sent} de {msgs.length} enviadas</span>
          {open ? <ChevronUp className="h-4 w-4 text-px-muted" aria-hidden /> : <ChevronDown className="h-4 w-4 text-px-muted" aria-hidden />}
        </span>
      </button>

      {open && (
        <div id={painel} className="border-t border-px-line">
          <div className="flex flex-wrap gap-2 px-5 py-3">
            <PxButton size="sm" variant="secondary" leftIcon={isPaused ? Play : Pause} onClick={() => onTogglePause(nome, !isPaused)}>
              {isPaused ? "Retomar" : "Pausar"}
            </PxButton>
            <PxButton size="sm" variant="danger" leftIcon={Trash2} onClick={() => setConfirmando(true)}>Remover</PxButton>
          </div>

          <ul className="divide-y divide-px-line border-t border-px-line">
            {msgs.map(m => (
              <li key={m.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[12px] text-px-muted">
                    <span className="font-semibold text-px-ink">{TIPO_LABEL[m.tipo] ?? m.tipo}</span>
                    <span> para {fmtDate(m.agendado_para)}</span>
                  </p>
                  <p className="line-clamp-2 text-[13px] text-px-ink">{m.mensagem}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {m.status === "enviado" ? (
                    <Tag tone="ok">Enviada</Tag>
                  ) : m.pausado ? (
                    <Tag tone="warn">Pausada</Tag>
                  ) : (
                    <>
                      <Tag>Agendada</Tag>
                      <PxButton size="sm" variant="secondary" leftIcon={Send} loading={sending === m.id} disabled={sending === m.id} onClick={() => onSend(m.id)}>
                        Enviar agora
                      </PxButton>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PxModal open={confirmando} onClose={() => setConfirmando(false)} title={`Remover ${nome} da régua?`} className="max-w-sm">
        <p className="mb-4 text-[13.5px] text-px-ink">As {msgs.length} mensagens deste paciente serão apagadas. Esta ação não pode ser desfeita.</p>
        <div className="flex gap-2">
          <PxButton variant="secondary" fullWidth onClick={() => setConfirmando(false)}>Cancelar</PxButton>
          <PxButton variant="danger" fullWidth onClick={() => { setConfirmando(false); onRemove(nome) }}>Remover</PxButton>
        </div>
      </PxModal>
    </Panel>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ReguaPage() {
  const [items,     setItems]     = useState<Regua[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showAdd,   setShowAdd]   = useState(false)
  const [adding,    setAdding]    = useState(false)
  const [sending,   setSending]   = useState<string | null>(null)
  const [toast,     setToast]     = useState<string | null>(null)
  const [toastType, setToastType] = useState<ToastType>("success")

  function showToast(msg: string, type: ToastType = "success") {
    setToastType(type); setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/regua")
      if (r.ok) setItems(await r.json())
    } catch { /* silencioso */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

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
      showToast("Paciente adicionado à régua")
      setShowAdd(false)
      await fetch_()
    } catch (e) { showToast(`Erro: ${e instanceof Error ? e.message : String(e)}`, "error") }
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
      showToast("Mensagem enviada")
      setItems(prev => prev.map(m => m.id === id ? { ...m, status: "enviado" } : m))
    } catch (e) { showToast(`Erro: ${e instanceof Error ? e.message : String(e)}`, "error") }
    finally { setSending(null) }
  }

  async function togglePause(nome: string, pause: boolean) {
    const ids = items.filter(m => m.paciente_nome === nome).map(m => m.id)
    try {
      for (const id of ids) {
        const r = await fetch("/api/regua", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, pausado: pause }),
        })
        if (!r.ok) throw new Error("Não foi possível atualizar a régua")
      }
      setItems(prev => prev.map(m => m.paciente_nome === nome ? { ...m, pausado: pause } : m))
      showToast(pause ? "Régua pausada" : "Régua retomada")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erro ao atualizar", "error")
      await fetch_()
    }
  }

  async function removePaciente(nome: string) {
    try {
      const r = await fetch(`/api/regua?paciente_nome=${encodeURIComponent(nome)}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Não foi possível remover")
      setItems(prev => prev.filter(m => m.paciente_nome !== nome))
      showToast("Paciente removido da régua")
    } catch (e) { showToast(e instanceof Error ? e.message : "Erro ao remover", "error") }
  }

  const total   = Object.keys(grouped).length
  const pending = items.filter(m => m.status === "pendente" && !m.pausado).length
  const sent    = items.filter(m => m.status === "enviado").length

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Régua"
        caption="Mensagens automáticas de relacionamento"
        actions={<PxButton leftIcon={Plus} onClick={() => setShowAdd(true)}>Adicionar paciente</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel tone="dark">
          <dl className="grid grid-cols-3 gap-4 text-white">
            <div>
              <dt className="text-[12px] text-white/80">Pacientes na régua</dt>
              <dd className="mt-1 text-[34px] font-semibold leading-none tabular-nums">{total}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-white/80">Mensagens a enviar</dt>
              <dd className="mt-1 text-[34px] font-semibold leading-none tabular-nums">{pending}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-white/80">Já enviadas</dt>
              <dd className="mt-1 text-[34px] font-semibold leading-none tabular-nums">{sent}</dd>
            </div>
          </dl>
        </Panel>

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3].map(i => <div key={i} className="px-glass h-[72px] animate-pulse rounded-px-panel" />)}
          </div>
        ) : total === 0 ? (
          <Panel tone="light" className="py-14 text-center">
            <p className="text-[14px] text-px-ink">Nenhum paciente na régua ainda.</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-px-muted">Ao adicionar um paciente, a IA escreve as mensagens de aniversário, retorno e acompanhamento do protocolo.</p>
            <div className="mt-5 flex justify-center">
              <PxButton leftIcon={Plus} onClick={() => setShowAdd(true)}>Adicionar primeiro paciente</PxButton>
            </div>
          </Panel>
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
      <Toast message={toast} type={toastType} />
    </div>
  )
}
