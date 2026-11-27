import type { PillNavGroup } from "@/components/px"

/**
 * Estrutura de navegação da Praxis: fonte única para a pílula inferior.
 * Selos: só os que informam estado real (Beta, Em breve, Pro, Elite).
 */
export const NAV_GROUPS: PillNavGroup[] = [
  { id: "inicio", label: "Início", href: "/dashboard", items: [] },
  {
    id: "atender", label: "Atender",
    items: [
      { label: "CRM de Leads", href: "/crm" },
      { label: "Nutrição de Leads", href: "/nutricao-leads" },
      { label: "Régua de Relacionamento", href: "/regua" },
      { label: "Agenda Inteligente", href: "/agenda" },
      { label: "Copiloto de Consulta", href: "/copiloto" },
      { label: "Conversa Clínica", href: "/conversa" },
      { label: "Gestão de Pacientes", href: "/pacientes" },
      { label: "Radar da Clínica", href: "/radar-clinica" },
      { label: "Importar Pacientes", href: "/importar" },
      { label: "Exportar Dados", href: "/exportar" },
      { label: "Pesquisa NPS", href: "/nps" },
      { label: "Programa de Indicações", href: "/indicacoes" },
      { label: "Scripts de Atendimento", href: "/scripts" },
      { label: "Central de Objeções", href: "/objecoes" },
      { label: "SOPs da Clínica", href: "/sops" },
      { label: "Calculadoras Clínicas", href: "/calculadoras" },
      { label: "Reativação de Pacientes", href: "/reativacao" },
      { label: "Jornada do Paciente", href: "/jornada" },
      { label: "Interpretação de Exames", href: "/interpretacao-exames" },
      { label: "Relatório para Paciente", href: "/relatorio-paciente" },
      { label: "Prescrição Assistida", href: "/prescricao" },
    ],
  },
  {
    id: "atrair", label: "Atrair",
    items: [
      { label: "Estratégia de Conteúdo", href: "/posicionamento" },
      { label: "Reels e Vídeos", href: "/reels" },
      { label: "Stories", href: "/stories" },
      { label: "Carrosséis", href: "/carrossel" },
      { label: "Calendário Editorial", href: "/calendario" },
      { label: "Radar de Tendências", href: "/radar" },
      { label: "Análise de Concorrentes", href: "/concorrentes" },
      { label: "Copiloto de Conteúdo", href: "/copiloto-conteudo" },
      { label: "Gerador de Legendas", href: "/legendas" },
      { label: "Gerador de Roteiros", href: "/roteiros" },
      { label: "Instagram Analytics", href: "/instagram" },
      { label: "Banco de Pautas", href: "/pautas" },
      { label: "Biblioteca de Ganchos", href: "/ganchos" },
      { label: "Gerador de CTAs", href: "/cta" },
      { label: "Repurposing", href: "/repurposing" },
      { label: "Lab. de Títulos", href: "/titulos" },
      { label: "Raio-X de Pacientes", href: "/raio-x" },
    ],
  },
  {
    id: "gerir", label: "Gerir",
    items: [
      { label: "Painel Executivo", href: "/executivo" },
      { label: "Financeiro", href: "/financeiro" },
      { label: "Precificação", href: "/precificacao" },
      { label: "Indicadores da Clínica", href: "/indicadores" },
      { label: "Consultor Estratégico", href: "/consultor" },
      { label: "Diagnóstico 360°", href: "/diagnostico" },
      { label: "Metas e Planejamento", href: "/metas" },
      { label: "Relatório Mensal", href: "/relatorio" },
      { label: "Mapa de Objeções", href: "/objecoes" },
      { label: "Notas Fiscais", href: "/notas-fiscais", tag: "Beta" },
      { label: "Programa de Afiliados", href: "/afiliados" },
    ],
  },
  {
    id: "inteligencia", label: "Inteligência",
    items: [
      { label: "Posicionamento Médico", href: "/posicionamento" },
      { label: "Diretor Criativo", href: "/diretor-criativo" },
      { label: "Agente Executivo", href: "/agente-executivo", tag: "Pro" },
      { label: "Nutrição de Leads Clínica", href: "/nutricao-pacientes" },
      { label: "Memória Clínica", href: "/memoria" },
      { label: "Banco de Estudos", href: "/estudos" },
      { label: "Inteligência de Mercado", href: "/mercado" },
    ],
  },
  {
    id: "aprender", label: "Aprender",
    items: [
      { label: "PRAXIS Academy", href: "/academy" },
      { label: "Comunidade", href: "/comunidade" },
      { label: "Trilha Marketing", href: "/academy", tag: "Em breve" },
      { label: "Trilha Gestão", href: "/academy", tag: "Em breve" },
      { label: "Trilha Comercial", href: "/academy", tag: "Em breve" },
      { label: "Trilha Escala", href: "/academy", tag: "Em breve" },
      { label: "Marketplace", href: "/marketplace" },
    ],
  },
]

/** Grupo ao qual um caminho pertence (para marcar a pílula ativa). */
export function groupIdForPath(pathname: string): string | undefined {
  if (pathname === "/dashboard") return "inicio"
  for (const g of NAV_GROUPS) {
    if (g.items.some(i => i.href === pathname || (i.href !== "/" && pathname.startsWith(i.href + "/")))) return g.id
  }
  return undefined
}
