import type { Metadata } from "next"
import {
  LayoutDashboard, BarChart3, Bot, Compass, DollarSign, Target, FileText,
} from "lucide-react"
import {
  ModulePageShell, ModuleHero, ModuleScreenshot,
  FeatureGrid, ModuleFinalCTA, type FeatureItem,
} from "@/components/modules/shared"

const ACCENT = "#16a34a"

export const metadata: Metadata = {
  title: "PRAXIS Executivo — Gerencie sua clínica como um empresário",
  description:
    "Painel Executivo, Indicadores da Clínica e Consultor Estratégico IA — transforme dados da sua clínica em decisões e crescimento previsível.",
  keywords: [
    "gestão de clínica", "indicadores clínica médica", "painel executivo médico",
    "consultor estratégico IA", "diagnóstico de clínica", "precificação consulta médica",
    "PRAXIS Executivo",
  ],
  alternates: { canonical: "/praxis-executivo" },
  openGraph: {
    title: "PRAXIS Executivo — Gerencie sua clínica como um empresário",
    description: "Indicadores + IA Estratégica para decisões baseadas em dados reais da sua clínica.",
    url: "/praxis-executivo",
    type: "website",
  },
}

const FEATURES: FeatureItem[] = [
  { icon: LayoutDashboard, title: "Painel Executivo",         desc: "Todas as métricas em um único lugar." },
  { icon: BarChart3,       title: "Indicadores da Clínica",   desc: "Financeiro, marketing, comercial e clínico." },
  { icon: Bot,              title: "Consultor Estratégico IA", desc: "Análise e direcionamento 24h." },
  { icon: Compass,          title: "Diagnóstico 360°",         desc: "Avalie sua clínica em 5 dimensões." },
  { icon: DollarSign,       title: "Precificação Inteligente", desc: "Descubra o valor ideal da sua consulta." },
  { icon: Target,           title: "Metas e Planejamento",     desc: "Transforme objetivos em planos executáveis." },
  { icon: FileText,         title: "Relatório Mensal",          desc: "PDF automático com análise da IA." },
]

export default function PraxisExecutivoPage() {
  return (
    <ModulePageShell active="PRAXIS Executivo">
      <ModuleHero
        badge="Indicadores + IA Estratégica"
        title="PRAXIS Executivo"
        accent={ACCENT}
        subtitle="Gerencie sua clínica como um empresário — indicadores em tempo real e um consultor estratégico de IA disponível 24h."
      />

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <ModuleScreenshot
          src="/screenshots/indicadores.png"
          alt="PRAXIS Executivo — indicadores da clínica em tempo real"
          caption="Financeiro, marketing, comercial e clínico — todos os indicadores em um único painel."
          color={ACCENT}
          ctaLabel="Explorar os Indicadores"
          ctaHref="/cadastro"
        />
      </section>

      <FeatureGrid
        items={FEATURES}
        color={ACCENT}
        title="Decisões baseadas em dados, não em intuição"
      />

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <ModuleScreenshot
          src="/screenshots/consultor.png"
          alt="PRAXIS Executivo — Consultor Estratégico com dados da clínica"
          caption="Consultor estratégico com dados reais da sua clínica"
          color={ACCENT}
          ctaLabel="Explorar o Consultor IA"
          ctaHref="/cadastro"
        />
      </section>

      <ModuleFinalCTA
        title="Pronto para gerenciar sua clínica com dados?"
        subtitle="Teste grátis por 7 dias. Nenhum cartão necessário."
        ctaLabel="Teste grátis por 7 dias"
        ctaHref="/cadastro"
      />
    </ModulePageShell>
  )
}
