"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, ChevronRight, Activity, X, Menu,
  // Inteligência
  Radio, CircleDollarSign, BarChart, Users,
  // Criação
  Bot, Video, Layers, Clapperboard, Sparkles, Flame, Megaphone,
  // Estratégia
  ScanFace, ShieldQuestion, Microscope, Zap, FileText,
  // Produtividade
  MessageSquare,
  // Auth
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMenu } from "@/components/MobileMenuProvider"
import { useAuth } from "@/hooks/useAuth"

// ─── Nav definition ───────────────────────────────────────────────────────────

const NAV = [
  {
    category: null,
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard, badge: null },
    ],
  },
  {
    category: "Inteligência",
    items: [
      { label: "Radar de Tendências",       href: "/radar",          icon: Radio,            badge: "LIVE" },
      { label: "Detector de Oportunidades", href: "/oportunidades",  icon: CircleDollarSign, badge: null   },
      { label: "Análise de Concorrentes",   href: "/concorrentes",   icon: BarChart,         badge: null   },
      { label: "Monitor de Referências",    href: "/referencias",    icon: Users,            badge: null   },
    ],
  },
  {
    category: "Criação",
    items: [
      { label: "Agente Executivo",          href: "/agente",         icon: Bot,              badge: "PRO"  },
      { label: "Gerador de Roteiros",       href: "/roteiros",       icon: Video,            badge: null   },
      { label: "Diretor Criativo",          href: "/imagens",        icon: Layers,           badge: null   },
      { label: "Editor de Vídeo",           href: "/editor",         icon: Clapperboard,     badge: null   },
      { label: "Gerador de Legendas",       href: "/legendas",       icon: Sparkles,         badge: null   },
      { label: "Gerador de Polêmicas",      href: "/polemicas",      icon: Flame,            badge: null   },
      { label: "Gerador de Ofertas",         href: "/ofertas",        icon: Megaphone,        badge: null   },
    ],
  },
  {
    category: "Estratégia",
    items: [
      { label: "Raio-X de Pacientes",       href: "/raio-x",         icon: ScanFace,         badge: null   },
      { label: "Mapa de Objeções",          href: "/objecoes",       icon: ShieldQuestion,   badge: null   },
      { label: "Lab. de Viralização",       href: "/radar",          icon: Microscope,       badge: null   },
      { label: "Biblioteca de Ganchos",     href: "/ganchos",        icon: Zap,              badge: null   },
      { label: "Banco de Pautas",           href: "/pautas",         icon: FileText,         badge: null   },
    ],
  },
  {
    category: "Produtividade",
    items: [
      { label: "Agente WhatsApp",           href: "/whatsapp",       icon: MessageSquare,    badge: null   },
    ],
  },
]

const BADGE_STYLE: Record<string, string> = {
  "PRO":  "bg-amber-950/60 text-amber-400 border border-amber-500/40",
  "LIVE": "bg-red-500/10 text-red-400 border border-red-500/30",
  "NOVO": "bg-accent-dim text-accent border border-accent-border",
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent() {
  const pathname = usePathname()
  const { closeMenu } = useMenu()
  const { user, signOut } = useAuth()

  return (
    <aside className="h-full w-60 flex flex-col bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="relative w-8 h-8 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-accent" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-blink" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text-primary leading-none truncate">MedContent</div>
          <div className="text-[10px] text-text-muted mt-0.5 font-mono truncate">Dr. Bruno Gustavo</div>
        </div>
        <button
          onClick={closeMenu}
          className="md:hidden w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors flex-shrink-0"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-1" : ""}>
            {group.category && (
              <div className="flex items-center gap-2 px-2 py-1.5 mt-2 mb-0.5">
                <div className="text-[8.5px] font-mono text-text-muted tracking-[0.18em] uppercase flex-shrink-0">{group.category}</div>
                <div className="h-px flex-1 bg-border opacity-50" />
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon     = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 md:py-1.5 rounded-lg text-[12.5px] font-medium transition-all duration-150 group",
                      isActive
                        ? "bg-accent-dim text-accent-text border border-accent-border"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04] border border-transparent"
                    )}
                  >
                    <Icon className={cn(
                      "w-3.5 h-3.5 flex-shrink-0",
                      isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                    )} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider flex-shrink-0",
                        BADGE_STYLE[item.badge] ?? BADGE_STYLE["NOVO"]
                      )}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && !item.badge && (
                      <ChevronRight className="w-3 h-3 text-accent opacity-60 flex-shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border space-y-3">
        {/* User row */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-accent">BG</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-text-primary truncate leading-none">Dr. Bruno Gustavo</div>
            <div className="text-[10px] text-text-muted truncate mt-0.5 leading-none">
              {user?.email ?? "brunogustavosa@gmail.com"}
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-950/40 transition-colors flex-shrink-0"
            title="Sair"
            aria-label="Sair do dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Version */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink flex-shrink-0" />
          <span className="text-[10px] font-mono text-text-muted truncate">MedContent v2.0</span>
        </div>
      </div>
    </aside>
  )
}

// ─── Exported component ───────────────────────────────────────────────────────

export function Sidebar() {
  const { open, closeMenu } = useMenu()

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-60 z-40">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[85vw] h-full animate-slide-in-left">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
