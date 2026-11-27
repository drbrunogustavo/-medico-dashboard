import type { Metadata } from "next"
import Link from "next/link"
import { Panel } from "@/components/px"
import { ModulePageShell, ModuleHero, ModuleSection, ModuleFinalCTA } from "@/components/modules/shared"

export const metadata: Metadata = {
  title: "PRAXIS IA: ferramentas de IA para consultório, conteúdo e gestão",
  description: "As ferramentas com IA do PRAXIS organizadas por área: clínico, conteúdo e gestão. A IA gera rascunhos e análises que o médico revisa.",
  alternates: { canonical: "/praxis-ia" },
  openGraph: {
    title: "PRAXIS IA",
    description: "Ferramentas com IA para o consultório, o conteúdo e a gestão da clínica.",
    url: "/praxis-ia",
    type: "website",
  },
}

interface Ferramenta { titulo: string; desc: string; href: string }
interface Grupo { id: string; titulo: string; intro: string; itens: Ferramenta[] }

const GRUPOS: Grupo[] = [
  {
    id: "clinico",
    titulo: "Clínico",
    intro: "Apoio à documentação e à análise de casos. Todo resultado é rascunho para revisão médica.",
    itens: [
      { titulo: "Copiloto de Consulta", desc: "Prontuário estruturado a partir do relato, com gravação de voz mediante sua autorização.", href: "/copiloto" },
      { titulo: "Conversa clínica", desc: "Análise completa de um caso clínico.", href: "/conversa" },
      { titulo: "Interpretação de exames", desc: "Leitura de exames laboratoriais com apoio de IA.", href: "/interpretacao-exames" },
      { titulo: "Emagrecimento", desc: "Apoio à análise de casos de emagrecimento.", href: "/emagrecimento" },
      { titulo: "Prescrição assistida", desc: "Sugestões de medicamentos e protocolos para o médico revisar.", href: "/prescricao" },
      { titulo: "Relatório para paciente", desc: "Exames em linguagem simples.", href: "/relatorio-paciente" },
    ],
  },
  {
    id: "conteudo",
    titulo: "Conteúdo",
    intro: "Ferramentas para planejar e escrever o conteúdo do Instagram.",
    itens: [
      { titulo: "Copiloto de Conteúdo", desc: "Reel, carrossel, Stories e legenda a partir de um único tópico.", href: "/copiloto-conteudo" },
      { titulo: "Banco de Pautas", desc: "Repositório de ideias clínicas para virar conteúdo.", href: "/pautas" },
      { titulo: "Radar de Tendências", desc: "Temas em alta, buscados na web.", href: "/radar" },
      { titulo: "Posicionamento médico", desc: "Definição de nicho e diferencial.", href: "/posicionamento" },
      { titulo: "Biblioteca de ganchos", desc: "Aberturas para os primeiros segundos do vídeo.", href: "/ganchos" },
      { titulo: "Objeções", desc: "Dúvidas de pacientes viram conteúdo educativo.", href: "/objecoes" },
    ],
  },
  {
    id: "gestao",
    titulo: "Gestão e relacionamento",
    intro: "Análise da clínica e comunicação com leads e pacientes.",
    itens: [
      { titulo: "Painel Executivo", desc: "Números do mês com análise por IA.", href: "/executivo" },
      { titulo: "Diagnóstico 360", desc: "Perguntas em 5 dimensões, com score e plano de ação de 90 dias.", href: "/diagnostico" },
      { titulo: "Nutrição de leads", desc: "Trilhas de conteúdo e mensagens para futuros pacientes.", href: "/nutricao-leads" },
      { titulo: "Scripts", desc: "Roteiros de consulta, recepção e follow-up.", href: "/scripts" },
      { titulo: "NPS", desc: "Satisfação dos pacientes.", href: "/nps" },
    ],
  },
]

export default function PraxisIaPage() {
  return (
    <ModulePageShell active="/praxis-ia">
      <ModuleHero
        title="PRAXIS IA"
        subtitle="As ferramentas com inteligência artificial do PRAXIS, agrupadas por área. A IA gera rascunhos e análises; a decisão e a revisão são do médico."
      />

      <p className="-mt-6 text-[13.5px] text-px-muted">As ferramentas ficam dentro da conta. Os links abrem cada uma depois do login.</p>

      {GRUPOS.map(g => (
        <ModuleSection key={g.id} title={g.titulo} intro={g.intro}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.itens.map(f => (
              <li key={f.href}>
                <Link href={f.href} className="group block h-full rounded-px-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink">
                  <Panel as="div" className="h-full space-y-1.5 !py-5 transition-colors group-hover:bg-white/90">
                    <h3 className="text-[15px] font-semibold text-px-ink">{f.titulo}</h3>
                    <p className="text-[13.5px] leading-relaxed text-px-muted">{f.desc}</p>
                  </Panel>
                </Link>
              </li>
            ))}
          </ul>
        </ModuleSection>
      ))}

      <ModuleFinalCTA title="Quer testar as ferramentas com o seu consultório?" />
    </ModulePageShell>
  )
}
