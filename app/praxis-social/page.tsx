import type { Metadata } from "next"
import {
  Sparkles, Calendar, Radar, Search, FileText, Video, Images, MessageSquare,
} from "lucide-react"
import {
  ModulePageShell, ModuleHero, ProblemBlock, ModuleScreenshot,
  FeatureGrid, ResultBanner, ModuleFinalCTA, type FeatureItem,
} from "@/components/modules/shared"

const ACCENT = "#3b7fff"

export const metadata: Metadata = {
  title: "PRAXIS Social — Conteúdo estratégico que atrai pacientes particulares",
  description:
    "Copiloto de Conteúdo, Calendário Editorial, Radar de Tendências e mais 5 ferramentas de IA para médicos que querem publicar com estratégia e atrair pacientes particulares.",
  keywords: [
    "conteúdo médico", "marketing médico", "instagram para médicos",
    "copiloto de conteúdo", "calendário editorial médico", "IA para médicos",
    "roteiro reels medicina", "PRAXIS Social",
  ],
  alternates: { canonical: "/praxis-social" },
  openGraph: {
    title: "PRAXIS Social — Conteúdo estratégico que atrai pacientes particulares",
    description: "15+ ferramentas de IA para criar conteúdo médico que converte seguidores em pacientes.",
    url: "/praxis-social",
    type: "website",
  },
}

const FEATURES: FeatureItem[] = [
  { icon: Sparkles,     title: "Copiloto de Conteúdo",      desc: "Roteiro + legenda + hashtags em 2 minutos." },
  { icon: Calendar,     title: "Calendário Editorial",       desc: "30 dias de conteúdo gerados automaticamente." },
  { icon: Radar,        title: "Radar de Tendências",        desc: "Temas em alta antes de todo mundo." },
  { icon: Search,       title: "Análise de Concorrentes",    desc: "Veja o que funciona na sua especialidade." },
  { icon: FileText,     title: "Banco de Pautas",             desc: "Nunca fique sem ideia para postar." },
  { icon: Video,        title: "Gerador de Reels",            desc: "Roteiros prontos para gravar." },
  { icon: Images,       title: "Stories e Carrosséis",        desc: "Formatos que engajam." },
  { icon: MessageSquare,title: "Gerador de Legendas",         desc: "Textos que convertem." },
]

export default function PraxisSocialPage() {
  return (
    <ModulePageShell active="PRAXIS Social">
      <ModuleHero
        badge="15+ ferramentas de conteúdo"
        title="PRAXIS Social"
        accent={ACCENT}
        subtitle="Conteúdo estratégico que atrai pacientes particulares — gerado por IA, adaptado à sua especialidade."
      />

      <ProblemBlock color={ACCENT}>
        Médicos perdem horas criando conteúdo genérico que não converte seguidores em pacientes.
      </ProblemBlock>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <ModuleScreenshot
          src="/screenshots/crm.png"
          alt="PRAXIS Social — visão do funil de conteúdo e captação"
          caption="Conteúdo e captação conectados — cada post alimenta o funil de leads automaticamente."
          color={ACCENT}
          ctaLabel="Explorar PRAXIS Social"
          ctaHref="/cadastro"
        />
      </section>

      <FeatureGrid
        items={FEATURES}
        color={ACCENT}
        title="Tudo que você precisa para publicar com estratégia"
      />

      <ResultBanner color={ACCENT}>
        Médicos que usam o PRAXIS Social publicam consistentemente e com estratégia.
      </ResultBanner>

      <ModuleFinalCTA
        title="Pronto para parar de improvisar o conteúdo?"
        subtitle="Teste grátis por 7 dias. Nenhum cartão necessário."
        ctaLabel="Teste grátis por 7 dias"
        ctaHref="/cadastro"
      />
    </ModulePageShell>
  )
}
