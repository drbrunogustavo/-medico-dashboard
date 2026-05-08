"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Radio,
  FileText,
  Users,
  LayoutDashboard,
  ChevronRight,
  Activity,
  Sparkles,
  Layers,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Radar de Tendências",
    href: "/radar",
    icon: Radio,
    badge: "LIVE",
  },
  {
    label: "Gerador de Imagens",
    href: "/imagens",
    icon: Layers,
    badge: "NEW",
  },
  {
    label: "Gerador de Legendas",
    href: "/legendas",
    icon: Sparkles,
    badge: null,
  },
  {
    label: "Banco de Pautas",
    href: "/pautas",
    icon: FileText,
    badge: null,
  },
  {
    label: "Monitor de Referências",
    href: "/referencias",
    icon: Users,
    badge: null,
  },
]
export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-full w-60 flex flex-col bg-surface border-r border-border z-40">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="relative w-8 h-8 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-accent-text" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-blink" />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-text-primary leading-none">MedContent</div>
          <div className="text-[10px] text-text-muted mt-0.5 font-mono">Dr. Bruno Gustavo</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase px-2 mb-3">
          Módulos
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group",
                isActive
                  ? "bg-accent-dim text-accent-text border border-accent-border"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-accent-dim text-accent border border-accent-border tracking-wider">
                  {item.badge}
                </span>
              )}
              {isActive && !item.badge && (
                <ChevronRight className="w-3 h-3 text-accent opacity-60" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" />
          <span className="text-[10px] font-mono text-text-muted">Sistema operacional</span>
        </div>
        <div className="text-[10px] text-text-muted mt-1 font-mono">
          {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
        </div>
      </div>
    </aside>
  )
}
