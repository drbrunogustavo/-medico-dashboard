"use client"

import { useEffect, useState } from "react"
import { useAppContext } from "@/components/AppProvider"
import { Panel, PxButton, Field, PxInput, PxSelect, PageHeader } from "@/components/px"

const ESPECIALIDADES = [
  "Cardiologia", "Cirurgia Geral", "Cirurgia Plástica", "Clínica Geral",
  "Dermatologia", "Endocrinologia", "Gastroenterologia", "Ginecologia e Obstetrícia",
  "Hematologia", "Infectologia", "Medicina do Esporte", "Medicina Estética",
  "Nefrologia", "Neurologia", "Nutrologia", "Oftalmologia",
  "Oncologia", "Ortopedia", "Pediatria", "Pneumologia",
  "Psiquiatria", "Reumatologia", "Urologia", "Outra",
]

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

const MIN = 30
const MAX = 1200

export default function DepoimentoPage() {
  const appCtx = useAppContext()

  const [saving, setSaving] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState("")
  const [jaEnviou, setJaEnviou] = useState(false)

  const [form, setForm] = useState({
    nome: "", crm: "", especialidade: "", cidade: "", estado: "SP",
    depoimento: "", resultado_destaque: "", instagram: "", exibir_landing: false,
  })

  // Preenche com os dados do perfil quando ele carrega
  useEffect(() => {
    const p = appCtx?.perfil
    if (!p) return
    setForm(f => ({
      ...f,
      nome: p.nome ?? f.nome,
      especialidade: p.especialidade ?? f.especialidade,
      cidade: p.cidade ?? f.cidade,
      estado: p.estado ?? f.estado,
      instagram: p.instagram ?? f.instagram,
      crm: p.crm ?? f.crm,
    }))
  }, [appCtx?.perfil])

  useEffect(() => {
    fetch("/api/depoimentos-praxis")
      .then(r => (r.ok ? r.json() : []))
      .then((list: unknown) => { if (Array.isArray(list) && list.length > 0) setJaEnviou(true) })
      .catch(() => {})
  }, [])

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const tamanho = form.depoimento.trim().length

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!form.nome.trim() || !form.especialidade || !form.depoimento.trim()) {
      setErro("Preencha nome, especialidade e depoimento.")
      return
    }
    if (tamanho < MIN) {
      setErro(`O depoimento precisa ter pelo menos ${MIN} caracteres. Faltam ${MIN - tamanho}.`)
      return
    }
    setSaving(true); setErro("")
    try {
      const res = await fetch("/api/depoimentos-praxis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("falha")
      setEnviado(true)
    } catch {
      setErro("Não foi possível enviar o depoimento agora. O texto foi mantido, tente de novo.")
    } finally {
      setSaving(false)
    }
  }

  if (enviado) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Depoimento" caption="Compartilhe sua experiência" />
        <div className="px-4 pb-10 pt-4 md:px-10">
          <Panel as="section" className="mx-auto max-w-xl space-y-3 !p-7 text-center">
            <h2 className="text-[20px] font-semibold text-px-ink">Depoimento enviado</h2>
            <p role="status" className="text-[14px] leading-relaxed text-px-muted">
              A equipe do PRAXIS vai analisar o texto antes de qualquer publicação.
              {form.exibir_landing ? " Como você autorizou, ele poderá aparecer na página inicial depois de aprovado." : " Você não autorizou a exibição pública, então ele não será publicado."}
            </p>
            <div className="pt-2"><PxButton href="/dashboard">Voltar ao início</PxButton></div>
          </Panel>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Depoimento" caption="Compartilhe sua experiência com a plataforma" back />

      <div className="mx-auto max-w-xl space-y-4 px-4 pb-10 pt-4 md:px-10">
        {jaEnviou && (
          <p role="note" className="rounded-px-card bg-px-accent-soft px-3 py-2.5 text-[13.5px] text-px-accent">
            Você já enviou um depoimento antes. Pode enviar outro para atualizar sua experiência.
          </p>
        )}

        <form onSubmit={submit} noValidate>
          <Panel as="section" className="space-y-4 !p-6">
            <Field label="Nome completo" htmlFor="dp-nome">
              <PxInput id="dp-nome" value={form.nome} onChange={set("nome")} placeholder="Dr. João Silva" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="CRM (opcional)" htmlFor="dp-crm">
                <PxInput id="dp-crm" value={form.crm} onChange={set("crm")} placeholder="CRM/SP 123456" />
              </Field>
              <Field label="Instagram (opcional)" htmlFor="dp-ig">
                <PxInput id="dp-ig" value={form.instagram} onChange={set("instagram")} placeholder="@drjoao" />
              </Field>
            </div>
            <Field label="Especialidade" htmlFor="dp-esp">
              <PxSelect id="dp-esp" value={form.especialidade} onChange={set("especialidade")}>
                <option value="">Selecione</option>
                {ESPECIALIDADES.map(x => <option key={x} value={x}>{x}</option>)}
              </PxSelect>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cidade" htmlFor="dp-cid">
                <PxInput id="dp-cid" value={form.cidade} onChange={set("cidade")} placeholder="São Paulo" />
              </Field>
              <Field label="Estado" htmlFor="dp-uf">
                <PxSelect id="dp-uf" value={form.estado} onChange={set("estado")}>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </PxSelect>
              </Field>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dp-texto" className="block text-[13px] font-medium text-px-ink">Depoimento</label>
              <textarea
                id="dp-texto"
                value={form.depoimento}
                onChange={set("depoimento")}
                maxLength={MAX}
                rows={5}
                placeholder="O que mudou no seu dia a dia, qual módulo mais usou, o que percebeu na prática."
                className="w-full resize-y rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
              />
              <p className="text-right text-[12.5px] tabular-nums text-px-muted">{tamanho} de {MAX} caracteres (mínimo {MIN})</p>
            </div>

            <Field label="Resultado em destaque (opcional)" htmlFor="dp-res" hint="Informe só o que você mediu de fato.">
              <PxInput id="dp-res" value={form.resultado_destaque} onChange={set("resultado_destaque")} placeholder="Ex: tempo economizado por dia" />
            </Field>

            <label className={`flex cursor-pointer items-start gap-3 rounded-px-card border p-4 ${form.exibir_landing ? "border-px-ink bg-white" : "border-px-line bg-white/50"}`}>
              <input type="checkbox" checked={form.exibir_landing} onChange={e => setForm(f => ({ ...f, exibir_landing: e.target.checked }))} className="mt-0.5 h-4 w-4 flex-shrink-0 accent-px-ink" />
              <span>
                <span className="block text-[13.5px] font-semibold text-px-ink">Autorizo exibir na página inicial do PRAXIS</span>
                <span className="block text-[13px] text-px-muted">Nome, especialidade e depoimento poderão aparecer publicamente depois de aprovados pela equipe. Sem a autorização, nada é publicado.</span>
              </span>
            </label>

            {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}

            <div className="flex items-center justify-between gap-3 pt-1">
              <PxButton href="/dashboard" variant="quiet">Cancelar</PxButton>
              <PxButton type="submit" loading={saving}>{saving ? "Enviando" : "Enviar depoimento"}</PxButton>
            </div>
          </Panel>
        </form>

        <p className="text-center text-[12.5px] text-px-muted">Todo depoimento passa por moderação antes de ser publicado.</p>
      </div>
    </div>
  )
}
