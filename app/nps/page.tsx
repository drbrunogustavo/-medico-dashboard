"use client"

import { useState, useEffect, useCallback } from "react"
import { Panel, PxButton, Tag, Field, PxInput, PxCheckbox, PxModal, PageHeader } from "@/components/px"
import { Toast, type ToastType } from "@/components/Toast"
import { Star, Plus, Send, Copy, Check, MessageSquare } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface NPS {
  id: string; paciente_nome: string; paciente_telefone: string
  token: string; nota: number | null; comentario: string | null
  status: string; agendado_para: string; respondido_em: string | null
  created_at: string
}

interface Depoimento { instagram: string; google: string }

type Tone = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"

function notaTone(nota: number | null): Tone {
  if (nota === null) return "neutral"
  if (nota >= 9) return "ok"
  if (nota >= 7) return "warn"
  return "danger"
}

function notaLabel(nota: number | null) {
  if (nota === null) return "Aguardando"
  if (nota >= 9) return "Promotor"
  if (nota >= 7) return "Neutro"
  return "Detrator"
}

function fmtDate(s: string) {
  if (!s) return "Sem data"
  return new Date(s).toLocaleDateString("pt-BR")
}

const STATUS_TAG: Record<string, { label: string; tone: Tone }> = {
  respondido: { label: "Respondido", tone: "ok" },
  enviado:    { label: "Enviado",    tone: "ink" },
}

// ── Modal: nova pesquisa ──────────────────────────────────────────────────────

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
    <PxModal open onClose={onClose} title="Nova pesquisa NPS" className="max-w-sm">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome do paciente" htmlFor="nps-nome">
          <PxInput id="nps-nome" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Nome completo" />
        </Field>
        <Field label="WhatsApp" htmlFor="nps-tel" hint="O link da pesquisa é enviado por WhatsApp em 24 horas.">
          <PxInput id="nps-tel" value={tel} onChange={e => setTel(e.target.value)} required placeholder="(11) 99999-9999" inputMode="tel" />
        </Field>
        <div className="flex gap-2 pt-1">
          <PxButton variant="secondary" fullWidth onClick={onClose}>Cancelar</PxButton>
          <PxButton type="submit" fullWidth loading={saving} disabled={saving || !nome.trim() || !tel.trim()} leftIcon={Check}>Criar</PxButton>
        </div>
      </form>
    </PxModal>
  )
}

// ── Modal: depoimento ─────────────────────────────────────────────────────────

function DepoimentoModal({ nps, onClose }: { nps: NPS; onClose: () => void }) {
  const [form, setForm] = useState({
    resultado: "", tempo_paciente: "", transformacao: "", usar_nome_completo: true, telefone: nps.paciente_telefone,
  })
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<Depoimento | null>(null)
  const [copied,  setCopied]  = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sendOk,  setSendOk]  = useState(false)
  const [erro,    setErro]    = useState("")

  async function gerar() {
    setLoading(true)
    setErro("")
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
    } catch (e) {
      console.error("[nps] erro ao gerar conteúdo IA:", e)
      setErro("Não foi possível gerar o depoimento. Tente de novo.")
    }
    finally { setLoading(false) }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function enviarAprovacao() {
    setSending(true)
    setErro("")
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
      else setErro("Não foi possível enviar para aprovação.")
    } catch (e) {
      console.error("[nps] erro ao enviar aprovação:", e)
      setErro("Não foi possível enviar para aprovação.")
    }
    finally { setSending(false) }
  }

  const campos: { key: keyof Depoimento; label: string }[] = [
    { key: "instagram", label: "Instagram" },
    { key: "google",    label: "Google" },
  ]

  return (
    <PxModal open onClose={onClose} title={`Depoimento de ${nps.paciente_nome}`} className="max-w-2xl">
      <div className="space-y-4">
        <div className="rounded-px-card border border-px-line bg-white/50 p-4">
          <p className="mb-1 text-[12px] text-px-muted">Avaliação original</p>
          <Tag tone={notaTone(nps.nota)}>{nps.nota}/10, {notaLabel(nps.nota)}</Tag>
          {nps.comentario && <p className="mt-2 text-[13px] italic text-px-ink">&ldquo;{nps.comentario}&rdquo;</p>}
        </div>

        <Field label="Resultado obtido" htmlFor="dp-res">
          <PxInput id="dp-res" value={form.resultado} onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))} placeholder="Ex: perdeu 8 kg em 3 meses" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tempo como paciente" htmlFor="dp-tempo">
            <PxInput id="dp-tempo" value={form.tempo_paciente} onChange={e => setForm(f => ({ ...f, tempo_paciente: e.target.value }))} placeholder="Ex: 6 meses" />
          </Field>
          <Field label="Principal transformação" htmlFor="dp-transf">
            <PxInput id="dp-transf" value={form.transformacao} onChange={e => setForm(f => ({ ...f, transformacao: e.target.value }))} placeholder="Ex: mais energia e disposição" />
          </Field>
        </div>
        <PxCheckbox label="Usar o nome completo no depoimento" checked={form.usar_nome_completo} onChange={e => setForm(f => ({ ...f, usar_nome_completo: e.target.checked }))} />

        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}

        <PxButton fullWidth leftIcon={Star} loading={loading} disabled={loading} onClick={gerar}>
          {loading ? "Gerando com IA" : "Gerar com IA"}
        </PxButton>

        {result && (
          <div className="grid gap-3 md:grid-cols-2">
            {campos.map(({ key, label }) => (
              <div key={key} className="space-y-2 rounded-px-card border border-px-line bg-white/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-px-ink">{label}</span>
                  <PxButton size="sm" variant="secondary" leftIcon={copied === key ? Check : Copy} aria-label={`Copiar texto do ${label}`} onClick={() => copy(result[key], key)}>
                    {copied === key ? "Copiado" : "Copiar"}
                  </PxButton>
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-px-ink">{result[key]}</p>
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className="flex flex-wrap gap-2 border-t border-px-line pt-3">
            <PxInput
              aria-label="Telefone para aprovação"
              value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
              placeholder="Telefone para aprovação"
              className="min-w-0 flex-1"
            />
            <PxButton variant="secondary" leftIcon={sendOk ? Check : Send} loading={sending} disabled={sending || sendOk} onClick={enviarAprovacao}>
              {sendOk ? "Enviado" : "Enviar para aprovação"}
            </PxButton>
          </div>
        )}
      </div>
    </PxModal>
  )
}

export default function NPSPage() {
  const [items,   setItems]   = useState<NPS[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [depoimento, setDepoimento] = useState<NPS | null>(null)
  const [toast,   setToast]   = useState<string | null>(null)
  const [toastType, setToastType] = useState<ToastType>("success")
  const [sending, setSending] = useState<string | null>(null)

  function showToast(msg: string, type: ToastType = "success") {
    setToastType(type); setToast(msg); setTimeout(() => setToast(null), 3000)
  }

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
    else showToast("Erro ao criar pesquisa", "error")
  }

  async function enviarAgora(id: string) {
    setSending(id)
    const r = await fetch(`/api/nps/processar?id=${encodeURIComponent(id)}`)
    setSending(null)
    if (!r.ok) { showToast("Não foi possível enviar agora", "error"); return }
    const d = (await r.json().catch(() => ({}))) as { enviados?: number }
    if (d.enviados) { showToast("Pesquisa enviada por WhatsApp"); await fetch_() }
    else showToast("Não foi possível enviar. Confira a integração de WhatsApp.", "error")
  }

  // Cálculo do NPS
  const respondidas = items.filter(i => i.nota !== null)
  const promotores  = respondidas.filter(i => (i.nota ?? 0) >= 9).length
  const detratores  = respondidas.filter(i => (i.nota ?? 0) <= 6).length
  const neutros     = respondidas.length - promotores - detratores
  const score       = respondidas.length
    ? Math.round(((promotores - detratores) / respondidas.length) * 100)
    : 0

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="NPS"
        caption="Satisfação dos pacientes"
        actions={<PxButton leftIcon={Plus} onClick={() => setShowAdd(true)}>Nova pesquisa</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel tone="dark">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-10 text-white">
            <div>
              <p className="text-[12px] text-white/80">Score NPS</p>
              <p className="mt-1 text-[56px] font-semibold leading-none tabular-nums">{score}</p>
              <p className="mt-1 text-[12px] text-white/80">{score >= 50 ? "Excelente" : score >= 0 ? "Bom, com espaço para melhorar" : "Crítico"}</p>
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-[12px] text-white/80">Promotores (9 a 10)</dt>
                <dd className="mt-1 text-[28px] font-semibold leading-none tabular-nums">{promotores}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-white/80">Neutros (7 a 8)</dt>
                <dd className="mt-1 text-[28px] font-semibold leading-none tabular-nums">{neutros}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-white/80">Detratores (0 a 6)</dt>
                <dd className="mt-1 text-[28px] font-semibold leading-none tabular-nums">{detratores}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-white/80">Respostas de {items.length}</dt>
                <dd className="mt-1 text-[28px] font-semibold leading-none tabular-nums">{respondidas.length}</dd>
              </div>
            </dl>
          </div>
        </Panel>

        {loading ? (
          <div className="space-y-3" aria-busy="true">{[1, 2, 3].map(i => <div key={i} className="px-glass h-[84px] animate-pulse rounded-px-panel" />)}</div>
        ) : items.length === 0 ? (
          <Panel tone="light" className="py-14 text-center">
            <p className="text-[14px] text-px-ink">Nenhuma pesquisa criada ainda.</p>
            <div className="mt-4 flex justify-center">
              <PxButton leftIcon={Plus} onClick={() => setShowAdd(true)}>Criar primeira pesquisa</PxButton>
            </div>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {items.map(nps => {
              const st = STATUS_TAG[nps.status] ?? { label: "Pendente", tone: "neutral" as Tone }
              return (
                <li key={nps.id}>
                  <Panel tone="light" className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-semibold text-px-ink">{nps.paciente_nome}</span>
                        {nps.nota !== null && <Tag tone={notaTone(nps.nota)}>{nps.nota}/10, {notaLabel(nps.nota)}</Tag>}
                        <Tag tone={st.tone}>{st.label}</Tag>
                      </div>
                      {nps.comentario && <p className="line-clamp-2 text-[13px] italic text-px-ink">&ldquo;{nps.comentario}&rdquo;</p>}
                      <p className="mt-1 text-[12px] text-px-muted">
                        {nps.respondido_em ? `Respondido em ${fmtDate(nps.respondido_em)}` : `Agendado para ${fmtDate(nps.agendado_para)}`}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col gap-1.5">
                      {nps.nota !== null && nps.nota >= 9 && (
                        <PxButton size="sm" variant="secondary" leftIcon={MessageSquare} onClick={() => setDepoimento(nps)}>Depoimento</PxButton>
                      )}
                      {nps.status === "pendente" && (
                        <PxButton size="sm" variant="secondary" leftIcon={Send} loading={sending === nps.id} disabled={sending === nps.id} onClick={() => enviarAgora(nps.id)}>Enviar</PxButton>
                      )}
                    </div>
                  </Panel>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {showAdd && <AddModal onSave={createNPS} onClose={() => setShowAdd(false)} />}
      {depoimento && <DepoimentoModal nps={depoimento} onClose={() => setDepoimento(null)} />}
      <Toast message={toast} type={toastType} />
    </div>
  )
}
