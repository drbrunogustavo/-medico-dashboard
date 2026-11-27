"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Panel, PxButton, PxInput, PxSelect, PxCheckbox, Field } from "@/components/px"

const ESPECIALIDADES = [
  "Cardiologia", "Cirurgia Geral", "Cirurgia Plástica", "Clínica Geral",
  "Dermatologia", "Endocrinologia", "Gastroenterologia", "Ginecologia e Obstetrícia",
  "Hematologia", "Infectologia", "Medicina do Esporte", "Medicina Estética",
  "Nefrologia", "Neurologia", "Nutrologia", "Oftalmologia",
  "Oncologia", "Ortopedia", "Pediatria", "Pneumologia",
  "Psiquiatria", "Reumatologia", "Urologia", "Outra",
]

const PROBLEMAS = [
  { id: "pacientes", label: "Preciso de mais pacientes" },
  { id: "faturamento", label: "Quero aumentar meu faturamento" },
  { id: "burocracia", label: "Perco tempo com burocracia" },
  { id: "financeiro", label: "Não tenho controle financeiro" },
  { id: "crescer", label: "Quero escalar e crescer" },
]

type ModItem = { title: string; desc: string; href: string }

const MODULE_MAP: Record<string, ModItem[]> = {
  pacientes: [
    { title: "CRM de Leads", desc: "Funil visual e mensagens de acompanhamento dos leads", href: "/crm" },
    { title: "Nurturing por WhatsApp", desc: "Sequência de mensagens para leads que ainda não agendaram", href: "/crm" },
  ],
  faturamento: [
    { title: "Painel Executivo", desc: "Indicadores e faturamento da clínica", href: "/executivo" },
    { title: "Precificação", desc: "Referência para definir o valor da consulta", href: "/posicionamento" },
  ],
  burocracia: [
    { title: "Copiloto de Consulta", desc: "Gera o prontuário a partir da consulta, para você revisar", href: "/copiloto" },
    { title: "SOPs da Clínica", desc: "Processos operacionais documentados", href: "/academy" },
  ],
  financeiro: [
    { title: "Financeiro", desc: "Controle de caixa, receitas e despesas", href: "/financeiro" },
    { title: "Indicadores", desc: "Indicadores clínicos e financeiros", href: "/indicadores" },
  ],
  crescer: [
    { title: "Consultor Estratégico", desc: "Análise e recomendações a partir dos dados da clínica", href: "/posicionamento" },
    { title: "Diagnóstico da clínica", desc: "Avaliação completa do negócio", href: "/posicionamento" },
  ],
}

const ETAPAS = ["Início", "Perfil", "Prioridade", "Módulos", "Final"]
const erroBox = "rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [erroMsg, setErroMsg] = useState("")
  const [nome, setNome] = useState("")
  const [espec, setEspec] = useState("Clínica Geral")
  const [cidade, setCidade] = useState("")
  const [problema, setProblema] = useState("")
  const [vozConsent, setVozConsent] = useState(false)

  async function patch(extra?: Record<string, unknown>) {
    const r = await fetch("/api/perfil", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: nome.trim(), especialidade: espec, cidade: cidade.trim(), ...extra }) })
    return r.ok
  }

  // Salva e só avança se a gravação deu certo; antes, falhas eram ignoradas e a pessoa seguia sem perfil salvo
  async function avancar(extra?: Record<string, unknown>) {
    setSaving(true); setErroMsg("")
    try {
      if (!(await patch(extra))) throw new Error("falha")
      setStep(s => s + 1)
    } catch (e) {
      console.error("[onboarding] erro ao salvar etapa:", e)
      setErroMsg("Não foi possível salvar. Tente novamente.")
    } finally { setSaving(false) }
  }

  // Grava o perfil e marca o onboarding como concluído. Devolve true se ambas as gravações deram certo.
  async function concluir() {
    const r1 = await patch({ onboarding_completo: true, voz_gravacao_autorizada: vozConsent })
    const r2 = await fetch("/api/perfil/onboarding", { method: "POST" })
    return r1 && r2.ok
  }

  async function ir(href: string) {
    setSaving(true); setErroMsg("")
    try {
      if (!(await concluir())) throw new Error("falha")
      router.push(href)
    } catch (e) {
      console.error("[onboarding] erro ao concluir:", e)
      setErroMsg("Não foi possível salvar suas configurações. Tente novamente.")
      setSaving(false)
    }
  }

  async function finalizar() {
    setSaving(true); setErroMsg("")
    try {
      if (!(await concluir())) throw new Error("falha")
      const me = await fetch("/api/me").then(r => (r.ok ? r.json() : null)).catch(() => null) as { plano?: string } | null
      router.push(me?.plano && me.plano !== "trial" ? "/dashboard" : "/planos")
    } catch (e) {
      console.error("[onboarding] erro ao finalizar:", e)
      setErroMsg("Erro ao salvar configurações. Tente novamente.")
      setSaving(false)
    }
  }

  const modulos = MODULE_MAP[problema] ?? []

  return (
    <div className="px relative min-h-screen px-4 py-10">
      <div className="px-stage" aria-hidden="true" />
      <main className="relative mx-auto w-full max-w-xl space-y-6">
        <h1 className="text-center text-[22px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</h1>

        <ol className="flex items-center justify-between gap-1" aria-label="Etapas do onboarding">
          {ETAPAS.map((l, i) => {
            const n = i + 1
            return (
              <li key={l} aria-current={n === step ? "step" : undefined} className="flex flex-1 flex-col items-center gap-1">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-semibold ${n < step ? "border-px-ink bg-px-ink text-white" : n === step ? "border-px-ink text-px-ink" : "border-px-ink/20 text-px-muted"}`}>{n < step ? "✓" : n}</span>
                <span className={`text-[11px] ${n === step ? "font-medium text-px-ink" : "text-px-muted"}`}>{l}</span>
              </li>
            )
          })}
        </ol>

        {erroMsg && <p role="alert" className={erroBox}>{erroMsg}</p>}

        {step === 1 && (
          <Panel as="section" className="space-y-5 text-center">
            <h2 className="text-[26px] font-semibold text-px-ink">Bem-vindo ao PRAXIS</h2>
            <p className="mx-auto max-w-sm text-[14px] leading-relaxed text-px-muted">Vamos configurar o básico: seu perfil, sua prioridade na clínica e por onde começar.</p>
            <div><PxButton onClick={() => setStep(2)}>Começar</PxButton></div>
          </Panel>
        )}

        {step === 2 && (
          <Panel as="section" className="space-y-5">
            <div>
              <h2 className="text-[22px] font-semibold text-px-ink">Perfil profissional</h2>
              <p className="text-[13px] text-px-muted">Só o essencial para personalizar a plataforma.</p>
            </div>
            <Field label="Nome completo" htmlFor="o-nome"><PxInput id="o-nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Dr. João Silva" autoComplete="name" /></Field>
            <Field label="Especialidade principal" htmlFor="o-esp"><PxSelect id="o-esp" value={espec} onChange={e => setEspec(e.target.value)}>{ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}</PxSelect></Field>
            <Field label="Cidade" htmlFor="o-cidade"><PxInput id="o-cidade" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="São Paulo" /></Field>
            <div className="flex justify-between">
              <PxButton variant="quiet" onClick={() => setStep(1)}>Voltar</PxButton>
              <PxButton loading={saving} onClick={() => avancar()}>Próximo</PxButton>
            </div>
          </Panel>
        )}

        {step === 3 && (
          <Panel as="section" className="space-y-5">
            <div>
              <h2 className="text-[22px] font-semibold text-px-ink">O que mais pesa na clínica agora?</h2>
              <p className="text-[13px] text-px-muted">Mostramos primeiro os módulos ligados a isso.</p>
            </div>
            <div role="group" aria-label="Prioridade" className="space-y-2">
              {PROBLEMAS.map(p => (
                <button key={p.id} type="button" aria-pressed={problema === p.id} onClick={() => setProblema(p.id)}
                  className={`w-full rounded-px-card border px-4 py-3 text-left text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${problema === p.id ? "border-px-ink bg-px-ink font-medium text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>{p.label}</button>
              ))}
            </div>
            <div className="flex justify-between">
              <PxButton variant="quiet" onClick={() => setStep(2)}>Voltar</PxButton>
              <PxButton loading={saving} disabled={!problema} onClick={() => avancar({ problema })}>Ver recomendação</PxButton>
            </div>
          </Panel>
        )}

        {step === 4 && (
          <Panel as="section" className="space-y-5">
            <div>
              <h2 className="text-[22px] font-semibold text-px-ink">Comece por aqui</h2>
              <p className="text-[13px] text-px-muted">Módulos ligados à prioridade que você escolheu. Abrir um deles conclui o onboarding.</p>
            </div>
            <ul className="space-y-2">
              {modulos.map(m => (
                <li key={m.title}>
                  <button type="button" disabled={saving} onClick={() => ir(m.href)} className="w-full rounded-px-card border border-px-ink/15 bg-white px-4 py-3 text-left transition-colors hover:border-px-ink/40 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">
                    <span className="block text-[14px] font-semibold text-px-ink">{m.title}</span>
                    <span className="block text-[13px] text-px-muted">{m.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-between">
              <PxButton variant="quiet" onClick={() => setStep(3)}>Mudar prioridade</PxButton>
              <PxButton variant="secondary" onClick={() => setStep(5)}>Continuar</PxButton>
            </div>
          </Panel>
        )}

        {step === 5 && (
          <Panel as="section" className="space-y-5">
            <div className="text-center">
              <h2 className="text-[24px] font-semibold text-px-ink">Configuração concluída</h2>
              <p className="mx-auto mt-1 max-w-sm text-[14px] text-px-muted">Escolha seu plano para começar a usar a plataforma.</p>
            </div>
            <div className="space-y-1">
              <PxCheckbox label="Autorizar gravação de voz (LGPD)" checked={vozConsent} onChange={e => setVozConsent(e.target.checked)} />
              <p className="pl-[26px] text-[12.5px] text-px-muted">Permite a transcrição de áudio no Copiloto. Se você não marcar, a autorização será pedida quando usar o recurso.</p>
            </div>
            <PxButton fullWidth loading={saving} onClick={finalizar}>Escolher meu plano</PxButton>
            <p className="text-center text-[13px]"><Link href="/tour" className="text-px-muted underline underline-offset-2">Explorar o tour primeiro</Link></p>
          </Panel>
        )}
      </main>
    </div>
  )
}
