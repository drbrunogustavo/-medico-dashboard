// Salvar em: components/MobileNav.tsx
"use client"
import { usePathname, useRouter } from "next/navigation"
import { Activity } from "lucide-react"

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
}

export function MobileNav() {
  const pathname = usePathname()
  const router   = useRouter()

  // Só mostra em rotas que não sejam a home
  if (pathname === "/") return null

  const label = ROUTE_LABELS[pathname] ?? "Dashboard"

  return (
    <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-border sticky top-0 z-40">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary hover:text-accent transition-colors"
      >
        <span className="text-lg leading-none">←</span>
        <span>Menu</span>
      </button>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Activity className="w-3.5 h-3.5 text-accent flex-shrink-0" />
        <span className="text-[12px] font-semibold text-text-primary truncate">{label}</span>
      </div>
    </div>
  )
}
