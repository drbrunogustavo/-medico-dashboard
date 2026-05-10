// Salvar em: components/MobileNav.tsx
"use client"
import { usePathname } from "next/navigation"
import { Menu, Activity } from "lucide-react"
import { useMenu } from "@/components/MobileMenuProvider"

const ROUTE_LABELS: Record<string, string> = {
  "/radar":      "Radar de Tendências",
  "/imagens":    "Gerador de Imagens",
  "/roteiros":   "Gerador de Roteiros",
  "/legendas":   "Gerador de Legendas",
  "/titulos":    "Gerador de Títulos",
  "/hashtags":   "Análise de Hashtags",
  "/ganchos":    "Biblioteca de Ganchos",
  "/pautas":     "Banco de Pautas",
  "/referencias":"Monitor de Referências",
  "/analise":    "Análise de Concorrentes",
  "/":           "Dashboard",
}

export function MobileNav() {
  const pathname = usePathname()
  const { openMenu } = useMenu()
  const label = ROUTE_LABELS[pathname] ?? "MedContent"

  return (
    // Visível apenas no mobile — sticky no topo
    <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-border sticky top-0 z-40">
      {/* Hamburger */}
      <button
        onClick={openMenu}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent-dim transition-colors border border-transparent hover:border-accent-border"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="w-px h-5 bg-border" />

      {/* Ícone + título da rota */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Activity className="w-3.5 h-3.5 text-accent flex-shrink-0" />
        <span className="text-[13px] font-semibold text-text-primary truncate">{label}</span>
      </div>
    </div>
  )
}
