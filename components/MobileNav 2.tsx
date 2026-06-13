"use client"
import { usePathname } from "next/navigation"
import { Activity, Menu } from "lucide-react"
import { useMenu } from "@/components/MobileMenuProvider"

const ROUTE_LABELS: Record<string, string> = {
  "/":            "Dashboard",
  "/radar":       "Radar de Tendências",
  "/imagens":     "Gerador de Imagens",
  "/roteiros":    "Gerador de Roteiros",
  "/legendas":    "Gerador de Legendas",
  "/titulos":     "Gerador de Títulos",
  "/hashtags":    "Análise de Hashtags",
  "/ganchos":     "Biblioteca de Ganchos",
  "/pautas":      "Banco de Pautas",
  "/referencias": "Monitor de Referências",
  "/whatsapp":    "Agente WhatsApp",
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
