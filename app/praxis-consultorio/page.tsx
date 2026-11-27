import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Panel } from "@/components/px"
import {
  ModulePageShell, ModuleHero, ModuleScreenshot, ModuleSection,
  FeatureGrid, ModuleFinalCTA, ModuleFAQ, type FeatureItem, type FAQItem,
} from "@/components/modules/shared"

export const metadata: Metadata = {
  title: "PRAXIS Consultório: CRM de leads e Copiloto de Consulta",
  description: "CRM de leads, mensagens de acompanhamento por WhatsApp e Copiloto de Consulta para organizar o relato da consulta em prontuário estruturado.",
  keywords: ["CRM médico", "CRM para clínicas", "copiloto de consulta", "prontuário com IA", "calculadoras clínicas", "PRAXIS Consultório"],
  alternates: { canonical: "/praxis-consultorio" },
  openGraph: {
    title: "PRAXIS Consultório",
    description: "CRM de leads e Copiloto de Consulta para o dia a dia do consultório.",
    url: "/praxis-consultorio",
    type: "website",
  },
}

const FEATURES: FeatureItem[] = [
  { title: "CRM de Leads", desc: "Funil visual do primeiro contato ao paciente ativo." },
  { title: "Mensagens por WhatsApp", desc: "Sequências agendadas, enviadas pela integração Z-API configurada na sua conta." },
  { title: "Copiloto de Consulta", desc: "Transforma o relato da consulta em resumo SOAP, plano e mensagens de acompanhamento." },
  { title: "Calculadoras clínicas", desc: "32 calculadoras em 6 áreas, de IMC e HOMA-IR a escores de risco." },
  { title: "Prescrição assistida", desc: "Sugestões de medicamentos para você revisar. A decisão é sempre do médico." },
  { title: "Pesquisa NPS", desc: "Pesquisa de satisfação enviada após a consulta." },
]

const COPILOTO_SAIDAS = [
  "Resumo clínico estruturado (SOAP)",
  "Plano terapêutico com condutas",
  "Orientações ao paciente em linguagem acessível",
  "Mensagens de acompanhamento para D+1, D+7 e D+30",
]

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "O Copiloto substitui o prontuário eletrônico?",
    a: "Não. Ele gera um rascunho estruturado para você revisar e levar ao sistema de prontuário que já usa. O que muda é o tempo de digitação.",
  },
  {
    q: "Funciona para qualquer especialidade?",
    a: "A IA recebe a especialidade cadastrada no seu perfil e adapta o texto a ela. Sem especialidade informada, usa Clínica Geral. O conteúdo gerado sempre precisa de revisão médica.",
  },
  {
    q: "O que acontece com os dados do relato?",
    a: "O texto do relato é enviado ao modelo de IA para gerar o rascunho. Como os dados são tratados e armazenados está descrito na Política de Privacidade.",
  },
  {
    q: "O CRM envia as mensagens sozinho?",
    a: "Sim, desde que a integração Z-API esteja configurada na sua conta. As mensagens agendadas saem pelo seu número, e o andamento de cada lead fica registrado no CRM.",
  },
]

export default function PraxisConsultorioPage() {
  return (
    <ModulePageShell active="/praxis-consultorio">
      <ModuleHero
        title="PRAXIS Consultório"
        subtitle="Acompanhe cada lead até virar paciente e documente a consulta a partir do seu relato."
      />

      <ModuleScreenshot
        src="/screenshots/crm.png"
        alt="Funil Kanban do CRM de Leads"
        caption="CRM de Leads em formato Kanban."
      />

      <FeatureGrid items={FEATURES} title="O que o módulo reúne" />

      <ModuleSection title="Copiloto de Consulta" intro="Depois da consulta, você descreve o caso em texto livre e o PRAXIS organiza o conteúdo em um rascunho para revisão.">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
          <Panel as="div" className="space-y-4">
            <ul className="space-y-2 text-[14.5px] text-px-ink">
              {COPILOTO_SAIDAS.map(s => <li key={s} className="border-b border-px-line pb-2 last:border-0 last:pb-0">{s}</li>)}
            </ul>
            <p className="text-[13px] text-px-muted">O texto é um rascunho. A revisão e a assinatura são do médico. <Link href="/tour" className="text-px-accent underline underline-offset-2">Ver o tour</Link></p>
          </Panel>
          <figure className="space-y-2">
            <Panel as="div" className="overflow-hidden !p-0">
              <Image src="/screenshots/copiloto.png" alt="Ilustração do Copiloto de Consulta, com dados de exemplo" width={1600} height={1000} className="block h-auto w-full" unoptimized />
            </Panel>
            <figcaption className="text-[13px] text-px-muted">Ilustração com dados fictícios.</figcaption>
          </figure>
        </div>
      </ModuleSection>

      <ModuleFAQ items={FAQ_ITEMS} />

      <ModuleFinalCTA title="Quer ver o Consultório funcionando com os seus leads?" />
    </ModulePageShell>
  )
}
