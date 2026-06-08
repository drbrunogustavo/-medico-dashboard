"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Radio, FileText, Users, LayoutDashboard, ChevronRight, Activity, Sparkles, Layers, Video, Hash, Zap, Type, X, MessageSquare, Clapperboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMenu } from "@/components/MobileMenuProvider"

const NAV = [
  { category: null, items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard, badge: null }] },
  { category: "Redes Sociais", items: [
    { label: "Radar de Tendências",    href: "/radar",       icon: Radio,        badge: "LIVE" },
    { label: "Gerador de Imagens",     href: "/imagens",     icon: Layers,       badge: null   },
    { label: "Gerador de Roteiros",    href: "/roteiros",    icon: Video,        badge: null   },
    { label: "Editor de Vídeo",        href: "/editor",      icon: Clapperboard, badge: "NOVO" },
    { label: "Gerador de Legendas",    href: "/legendas",    icon: Sparkles,     badge: null   },
    { label: "Gerador de Títulos",     href: "/titulos",     icon: Type,         badge: null   },
    { label: "Análise de Hashtags",    href: "/hashtags",    icon: Hash,         badge: null   },
    { label: "Biblioteca de Ganchos",  href: "/ganchos",     icon: Zap,          badge: null   },
    { label: "Banco de Pautas",        href: "/pautas",      icon: FileText,     badge: null   },
    { label: "Monitor de Referências", href: "/referencias", icon: Users,        badge: null   },
  ]},
  { category: "Produtividade", items: [
    { label: "Agente WhatsApp", href: "/whatsapp", icon: MessageSquare, badge: "NOVO" },
  ]},
]

export function Sidebar() {
  const pathname = usePathname()
  const { open, closeMenu } = useMenu()

  const SidebarContent = () => (
    <aside className="h-full w-60 flex flex-col bg-surface border-r border-border">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="relative w-8 h-8 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-accent-text" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-blink" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text-primary leading-none truncate">MedContent</div>
          <div className="text-[10px] text-text-muted mt-0.5 font-mono truncate">Dr. Bruno Gustavo</div>
        </div>
        <button onClick={closeMenu} className="md:hidden w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "pt-2" : ""}>
            {group.category && (
              <div className="flex items-center gap-2 px-2 mb-1.5 mt-1">
                <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase flex-1">{group.category}</div>
                <div className="h-px flex-1 bg-border opacity-60" />
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={closeMenu}
                    className={cn(
                      "flex items-center gap-2.5 px-3 rounded-lg text-[12.5px] font-medium transition-all duration-150 group md:py-2 py-3",
                      isActive
                        ? "bg-accent-dim text-accent-text border border-accent-border"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                    )}>
                    <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider flex-shrink-0",
                        item.badge === "NOVO" ? "bg-accent-dim text-accent border border-accent-border" :
                        item.badge === "LIVE" ? "bg-red-500/10 text-red-400 border border-red-500/30" :
                        "bg-accent-dim text-accent border border-accent-border"
                      )}>{item.badge}</span>
                    )}
                    {isActive && !item.badge && <ChevronRight className="w-3 h-3 text-accent opacity-60 flex-shrink-0" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-5 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-blink flex-shrink-0" />
          <span className="text-[10px] font-mono text-text-muted truncate">Sistema operacional</span>
        </div>
        <div className="text-[10px] text-text-muted mt-0.5 font-mono">
          {new Date().toLocaleDateString("pt-BR", { weekday:"short", day:"2-digit", month:"short" })}
        </div>
      </div>
    </aside>
  )

  return (
    <>
      <div className="hidden md:block fixed left-0 top-0 h-full w-60 z-40"><SidebarContent /></div>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMenu} />
          <div className="relative w-64 max-w-[85vw] h-full animate-slide-in-left"><SidebarContent /></div>
        </div>
      )}
    </>
  )
}
