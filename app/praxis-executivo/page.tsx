import type { Metadata } from "next"
import {
  ModulePageShell, ModuleHero, ModuleScreenshot,
  FeatureGrid, ModuleFinalCTA, ModuleFAQ, type FeatureItem, type FAQItem,
} from "@/components/modules/shared"

export const metadata: Metadata = {
  title: "PRAXIS Executivo: indicadores e Consultor Estratégico da clínica",
  description: "Painel Executivo, indicadores da clínica, Diagnóstico 360, precificação e Consultor Estratégico com IA a partir dos dados lançados na plataforma.",
  keywords: ["gestão de clínica", "indicadores clínica médica", "painel executivo médico", "consultor estratégico IA", "precificação consulta médica", "PRAXIS Executivo"],
  alternates: { canonical: "/praxis-executivo" },
  openGraph: {
    title: "PRAXIS Executivo",
    description: "Indicadores e análise estratégica a partir dos dados da sua clínica.",
    url: "/praxis-executivo",
    type: "website",
  },
}

const FEATURES: FeatureItem[] = [
  { title: "Painel Executivo", desc: "Leads, consultas, NPS, seguidores e receita dos últimos 6 meses, com análise do mês por IA." },
  { title: "Indicadores da clínica", desc: "Financeiro, marketing, comercial e clínico em um só lugar." },
  { title: "Consultor Estratégico", desc: "Análise com IA a partir dos dados da sua clínica, com sugestões para você avaliar." },
  { title: "Diagnóstico 360", desc: "Perguntas em 5 dimensões, com score, classificação e plano de ação de 90 dias." },
  { title: "Precificação", desc: "Preço ideal da consulta, com base nos seus custos e no mercado da sua cidade." },
  { title: "Metas e planejamento", desc: "Defina as metas do ano e acompanhe o mês." },
]

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "Preciso entender de finanças para usar?",
    a: "Não. Cada indicador vem com uma explicação, e o Consultor Estratégico descreve os números em linguagem simples.",
  },
  {
    q: "De onde vêm os números dos indicadores?",
    a: "Dos registros feitos na própria plataforma: lançamentos financeiros, leads do CRM, NPS e agenda. Se algo não foi registrado, não aparece nos indicadores.",
  },
  {
    q: "O Consultor Estratégico substitui uma consultoria?",
    a: "Não. Ele organiza os números da clínica e sugere caminhos para você avaliar. Decisões de maior risco, como investimento ou mudança societária, pedem um profissional especializado.",
  },
]

export default function PraxisExecutivoPage() {
  return (
    <ModulePageShell active="/praxis-executivo">
      <ModuleHero
        title="PRAXIS Executivo"
        subtitle="Veja os números da clínica em um só lugar e use a IA para analisá-los."
      />

      <ModuleScreenshot
        src="/screenshots/indicadores.png"
        alt="Indicadores da clínica"
        caption="Indicadores financeiros, de marketing, comerciais e clínicos."
      />

      <FeatureGrid items={FEATURES} title="O que o módulo reúne" />

      <ModuleScreenshot
        src="/screenshots/consultor.png"
        alt="Consultor Estratégico"
        caption="Consultor Estratégico."
      />

      <ModuleFAQ items={FAQ_ITEMS} />

      <ModuleFinalCTA title="Quer ver os indicadores com os dados da sua clínica?" />
    </ModulePageShell>
  )
}
