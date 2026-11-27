import type { Metadata } from "next"
import {
  ModulePageShell, ModuleHero, FeatureGrid, ModuleFinalCTA, ModuleFAQ,
  type FeatureItem, type FAQItem,
} from "@/components/modules/shared"

export const metadata: Metadata = {
  title: "PRAXIS Social: ferramentas de conteúdo médico com IA",
  description: "Copiloto de Conteúdo, Calendário Editorial, Radar de Tendências, Banco de Pautas e geradores de Reels, Stories, carrossel e legendas para o Instagram do médico.",
  keywords: ["conteúdo médico", "marketing médico", "instagram para médicos", "copiloto de conteúdo", "calendário editorial médico", "roteiro reels medicina", "PRAXIS Social"],
  alternates: { canonical: "/praxis-social" },
  openGraph: {
    title: "PRAXIS Social",
    description: "Ferramentas de IA para planejar e produzir conteúdo médico.",
    url: "/praxis-social",
    type: "website",
  },
}

const FEATURES: FeatureItem[] = [
  { title: "Copiloto de Conteúdo", desc: "Posts, roteiros e legendas a partir de um tema, com a especialidade e o tom de voz do seu perfil." },
  { title: "Calendário Editorial", desc: "Planeje o mês de conteúdo e acompanhe o que já foi publicado." },
  { title: "Radar de Tendências", desc: "Temas de nutrologia, endocrinologia e longevidade em alta, buscados na web." },
  { title: "Central de Inteligência", desc: "Análise de concorrentes, benchmark da especialidade e plano de crescimento no Instagram." },
  { title: "Banco de Pautas", desc: "Repositório de ideias clínicas para virar conteúdo." },
  { title: "Roteiros e ideias para Reels", desc: "Roteiros prontos para gravar, com gancho, estrutura e duração." },
  { title: "Stories e carrosséis", desc: "Sequência de Stories e carrossel com capa, slides e chamada final." },
  { title: "Legendas e hashtags", desc: "Legendas para Instagram a partir de um tema ou de uma pauta." },
]

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "Preciso ter muitos seguidores?",
    a: "Não. As ferramentas ajudam a planejar e escrever o conteúdo, independentemente do tamanho do perfil.",
  },
  {
    q: "O texto vai soar como eu escrevo?",
    a: "A IA usa a especialidade, o nicho, o público e o tom de voz que você informa no perfil. O resultado é um rascunho: ajustar e aprovar continua sendo com você, e o conteúdo médico precisa respeitar as normas do CFM.",
  },
  {
    q: "Serve para outras redes além do Instagram?",
    a: "O foco é o Instagram: Reels, Stories, carrossel e legenda. Os textos podem ser adaptados por você para outras redes.",
  },
  {
    q: "Quantas gerações de IA posso fazer por mês?",
    a: "O limite mensal depende do plano. Os valores estão na página de Planos.",
  },
]

export default function PraxisSocialPage() {
  return (
    <ModulePageShell active="/praxis-social">
      <ModuleHero
        title="PRAXIS Social"
        subtitle="Planeje e produza o conteúdo do seu Instagram com ferramentas de IA que partem da sua especialidade."
      />

      <FeatureGrid items={FEATURES} title="O que o módulo reúne" />

      <ModuleFAQ items={FAQ_ITEMS} />

      <ModuleFinalCTA title="Quer montar o calendário do próximo mês?" />
    </ModulePageShell>
  )
}
