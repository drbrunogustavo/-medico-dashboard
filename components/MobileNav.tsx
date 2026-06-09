"use client"
import { usePathname } from "next/navigation"
import { Activity, Menu } from "lucide-react"
import { useMenu } from "@/components/MobileMenuProvider"

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":          "Dashboard",
  "/radar":              "Radar de Tendências",
  "/oportunidades":      "Detector de Oportunidades",
  "/referencias":        "Monitor de Referências",
  "/agente":             "Agente Executivo",
  "/imagens":            "Diretor Criativo",
  "/editor":             "Editor de Vídeo",
  "/roteiros":           "Gerador de Roteiros",
  "/legendas":           "Gerador de Legendas",
  "/polemicas":          "Gerador de Polêmicas",
  "/ofertas":            "Gerador de Ofertas",
  "/raio-x":             "Raio-X de Pacientes",
  "/objecoes":           "Mapa de Objeções",
  "/titulos":            "Gerador de Títulos",
  "/hashtags":           "Análise de Hashtags",
  "/ganchos":            "Biblioteca de Ganchos",
  "/pautas":             "Banco de Pautas",
  "/crm":                "CRM de Leads",
  "/regua":              "Régua de Relacionamento",
  "/nps":                "NPS & Satisfação",
  "/indicacoes":         "Programa de Indicações",
  "/captacao":           "Captação de Leads",
  "/agenda":             "Agenda Inteligente",
  "/copiloto":           "Copiloto de Consulta",
  "/financeiro":         "Financeiro",
  "/nutricao-pacientes": "Nutrição de Pacientes",
  "/nutricao-leads":     "Nutrição de Leads",
  "/whatsapp":           "Agente WhatsApp",
  "/perfil":             "Perfil",
  "/configuracoes":      "Configurações",
  "/planos":             "Planos",
}

export function MobileNav() {
  const pathname  = usePathname()
  const { openMenu } = useMenu()
  const label = ROUTE_LABELS[pathname] ?? "Dashboard"

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
