"use client"
import { usePathname } from "next/navigation"
import { Activity, Menu } from "lucide-react"
import { useMenu } from "@/components/MobileMenuProvider"

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":          "Dashboard",
  // PRAXIS Social
  "/posicionamento":     "Estratégia de Conteúdo",
  "/reels":              "Reels e Vídeos",
  "/stories":            "Stories",
  "/carrossel":          "Carrosséis",
  "/calendario":         "Calendário Editorial",
  "/radar":              "Radar de Tendências",
  "/concorrentes":       "Análise de Concorrentes",
  "/legendas":           "Gerador de Legendas",
  "/roteiros":           "Gerador de Roteiros",
  "/pautas":             "Banco de Pautas",
  "/ganchos":            "Biblioteca de Ganchos",
  "/cta":                "Gerador de CTAs",
  "/repurposing":        "Repurposing",
  "/titulos":            "Lab. de Títulos",
  "/raio-x":             "Raio-X de Pacientes",
  // PRAXIS Consultório
  "/crm":                "CRM de Leads",
  "/nutricao-leads":     "Nutrição de Leads",
  "/regua":              "Régua de Relacionamento",
  "/agenda":             "Agenda Inteligente",
  "/copiloto":           "Copiloto de Consulta",
  "/pacientes":          "Gestão de Pacientes",
  "/nps":                "Pesquisa NPS",
  "/indicacoes":         "Programa de Indicações",
  "/scripts":            "Scripts de Atendimento",
  "/objecoes":           "Central de Objeções",
  "/sops":               "SOPs da Clínica",
  // PRAXIS Executivo
  "/executivo":          "Painel Executivo",
  "/financeiro":         "Financeiro",
  "/precificacao":       "Precificação",
  "/indicadores":        "Indicadores da Clínica",
  "/consultor":          "Consultor Estratégico",
  "/diagnostico":        "Diagnóstico 360°",
  "/metas":              "Metas e Planejamento",
  "/reativacao":         "Reativação de Pacientes",
  "/jornada":            "Jornada do Paciente",
  // PRAXIS IA
  "/diretor-criativo":   "Diretor Criativo",
  "/agente-executivo":   "Agente Executivo",
  "/nutricao-pacientes": "Nutrição de Leads Clínica",
  // PRAXIS Academy
  "/academy":            "PRAXIS Academy",
  // Others
  "/imagens":            "Diretor Criativo",
  "/agente":             "Agente Executivo",
  "/oportunidades":      "Detector de Oportunidades",
  "/referencias":        "Monitor de Referências",
  "/editor":             "Editor de Vídeo",
  "/polemicas":          "Gerador de Polêmicas",
  "/ofertas":            "Gerador de Ofertas",
  "/whatsapp":           "Agente WhatsApp",
  "/perfil":             "Perfil",
  "/configuracoes":      "Configurações",
  "/planos":             "Planos",
}

export function MobileNav() {
  const pathname  = usePathname()
  const { openMenu } = useMenu()
  const label = ROUTE_LABELS[pathname] ?? "PRAXIS"

  return (
    <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-border sticky top-0 z-40">
      <button
        onClick={openMenu}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-accent hover:bg-white/[0.06] transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Activity className="w-3.5 h-3.5 text-accent flex-shrink-0" />
        <span className="text-[12px] font-semibold text-text-primary truncate">{label}</span>
      </div>
    </div>
  )
}
