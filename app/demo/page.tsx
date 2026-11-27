import Link from "next/link"
import { Panel, PxButton, Tag } from "@/components/px"

export const metadata = {
  title: "Demonstração do PRAXIS",
  description: "Veja como ficam o CRM, o banco de pautas e os módulos do PRAXIS, com dados de exemplo.",
  alternates: { canonical: "/demo" },
}

// Todos os dados abaixo são de exemplo e não representam pessoas ou resultados reais
const DEMO_MEDICO = { nome: "Dr. João Silva", especialidade: "Endocrinologia" }

const METRICAS = [
  { label: "Leads no CRM", value: "47" },
  { label: "Consultas no mês", value: "28" },
  { label: "NPS", value: "8,4" },
  { label: "Pautas salvas", value: "12" },
]

type Tone = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"
const LEADS: { nome: string; origem: string; assunto: string; status: string; tom: Tone; tempo: string }[] = [
  { nome: "Maria Costa", origem: "Instagram", assunto: "Diabetes tipo 2", status: "Novo", tom: "neutral", tempo: "há 2 h" },
  { nome: "Carlos Fernandes", origem: "WhatsApp", assunto: "Tireoide", status: "Contatado", tom: "warn", tempo: "há 5 h" },
  { nome: "Ana Oliveira", origem: "Indicação", assunto: "Obesidade", status: "Agendado", tom: "ok", tempo: "há 1 dia" },
  { nome: "Pedro Santos", origem: "Google", assunto: "Resistência à insulina", status: "Em negociação", tom: "accent", tempo: "há 2 dias" },
  { nome: "Lucia Mendes", origem: "Instagram", assunto: "SOP", status: "Fechado", tom: "ink", tempo: "há 3 dias" },
]

const PAUTAS: { titulo: string; categoria: string; estagio: string; tom: Tone }[] = [
  { titulo: "5 sinais que indicam problema na tireoide", categoria: "Educacional", estagio: "Pronto", tom: "ok" },
  { titulo: "Por que o cortisol alto está associado a gordura abdominal", categoria: "Saúde", estagio: "Em produção", tom: "warn" },
  { titulo: "Diabetes e resistência à insulina: qual a diferença", categoria: "Clínico", estagio: "Ideia", tom: "neutral" },
]

const MODULOS = [
  { label: "Radar de Tendências", desc: "Tendências médicas com apoio de IA" },
  { label: "Gerador de Roteiros", desc: "Roteiros para Reels a partir de um tema" },
  { label: "Agenda", desc: "Consultas e lembretes" },
  { label: "Financeiro", desc: "Receitas, despesas e DRE" },
  { label: "Protocolos Clínicos", desc: "Protocolos por especialidade" },
  { label: "Academy", desc: "Aulas de marketing médico" },
  { label: "NPS", desc: "Avaliação de satisfação dos pacientes" },
  { label: "Diretor Criativo", desc: "Imagens com a identidade visual da clínica" },
]

export default function DemoPage() {
  return (
    <div className="px relative min-h-screen">
      <div className="px-stage" aria-hidden="true" />
      <header className="px-glass sticky top-0 z-10 flex h-16 items-center justify-between px-6 md:px-12">
        <Link href="/" className="text-[15px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</Link>
        <PxButton size="sm" href="/cadastro">Criar conta</PxButton>
      </header>

      <main className="relative mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-8 md:px-10">
        <p role="note" className="rounded-px-card bg-px-warn-soft px-4 py-3 text-[13.5px] text-px-warn">
          Demonstração com dados de exemplo. Nada aqui representa pessoas ou resultados reais, e nenhuma ação desta página é executada.
        </p>

        <div>
          <h1 className="text-[clamp(24px,4vw,34px)] font-semibold text-px-ink">{DEMO_MEDICO.nome}</h1>
          <p className="text-[14px] text-px-muted">{DEMO_MEDICO.especialidade}</p>
        </div>

        <section aria-label="Indicadores de exemplo">
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {METRICAS.map(m => (
              <Panel as="div" key={m.label} className="!py-4">
                <dd className="text-[28px] font-semibold leading-none text-px-ink">{m.value}</dd>
                <dt className="mt-1 text-[13px] text-px-muted">{m.label}</dt>
              </Panel>
            ))}
          </dl>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel as="section" className="space-y-3">
            <h2 className="text-[15px] font-semibold text-px-ink">CRM de Leads</h2>
            <ul className="divide-y divide-px-line">
              {LEADS.map(l => (
                <li key={l.nome} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-px-ink">{l.nome}</p>
                    <p className="text-[12.5px] text-px-muted">{l.origem}, {l.assunto}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1"><Tag tone={l.tom}>{l.status}</Tag><span className="text-[12px] text-px-muted">{l.tempo}</span></div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel as="section" className="space-y-3">
            <h2 className="text-[15px] font-semibold text-px-ink">Banco de Pautas</h2>
            <ul className="space-y-2">
              {PAUTAS.map(p => (
                <li key={p.titulo} className="rounded-px-card border border-px-line bg-white/60 p-3">
                  <p className="text-[14px] font-medium leading-snug text-px-ink">{p.titulo}</p>
                  <div className="mt-1.5 flex items-center gap-2"><span className="text-[12.5px] text-px-muted">{p.categoria}</span><Tag tone={p.tom}>{p.estagio}</Tag></div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel as="section" className="space-y-2">
          <h2 className="text-[15px] font-semibold text-px-ink">Copiloto de Consulta</h2>
          <p className="text-[14px] leading-relaxed text-px-muted">O Copiloto organiza o relato de uma consulta em resumo SOAP, plano e orientações para você revisar. Ele só funciona dentro da conta, com seus dados, e por isso não é executado nesta demonstração.</p>
        </Panel>

        <section aria-labelledby="mods" className="space-y-3">
          <h2 id="mods" className="text-[15px] font-semibold text-px-ink">Módulos disponíveis na conta</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {MODULOS.map(m => (
              <li key={m.label}><Panel as="article" className="h-full space-y-1 !py-4">
                <p className="text-[14px] font-semibold text-px-ink">{m.label}</p>
                <p className="text-[12.5px] leading-relaxed text-px-muted">{m.desc}</p>
              </Panel></li>
            ))}
          </ul>
        </section>

        <Panel tone="dark" as="section" className="space-y-4 text-center !p-8">
          <h2 className="text-[clamp(20px,3vw,28px)] font-semibold">Quer ver com os dados da sua clínica?</h2>
          <p className="mx-auto max-w-lg text-[14px] opacity-80">As condições do período de teste e os valores estão na página de planos.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <PxButton variant="inverse" href="/planos">Ver planos</PxButton>
            <PxButton variant="quiet" href="/captacao" className="!text-white">Falar com um especialista</PxButton>
          </div>
        </Panel>
      </main>
    </div>
  )
}
