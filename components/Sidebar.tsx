"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard, X, Stethoscope,
  Radio, CircleDollarSign, Users,
  Bot, Video, Layers, Clapperboard, Sparkles, Flame, Megaphone,
  ScanFace, ShieldQuestion, Microscope, FileText,
  Calendar, Heart, TrendingUp, MessageCircle,
  LogOut, CreditCard, Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMenu } from "@/components/MobileMenuProvider"
import { useAuth } from "@/hooks/useAuth"
import { PraxisLogo } from "@/components/PraxisLogo"
import { ThemeToggle } from "@/components/ThemeToggle"

// ─── Nav definition ───────────────────────────────────────────────────────────

type NavItem  = { label: string; href: string; icon: React.ElementType; badge?: string | null }
type NavGroup = { category: string | null; items: NavItem[] }

const NAV_SOCIAL: NavGroup[] = [
  {
    category: null,
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    category: "Inteligência",
    items: [
      { label: "Radar de Tendências",       href: "/radar",         icon: Radio,            badge: "LIVE" },
      { label: "Detector de Oportunidades", href: "/oportunidades", icon: CircleDollarSign               },
      { label: "Monitor de Referências",    href: "/referencias",   icon: Users                          },
    ],
  },
  {
    category: "Criação",
    items: [
      { label: "Agente Executivo",     href: "/agente",    icon: Bot,         badge: "PRO" },
      { label: "Diretor Criativo",     href: "/imagens",   icon: Layers                    },
      { label: "Editor de Vídeo",      href: "/editor",    icon: Clapperboard              },
      { label: "Gerador de Roteiros",  href: "/roteiros",  icon: Video                     },
      { label: "Gerador de Legendas",  href: "/legendas",  icon: Sparkles                  },
      { label: "Gerador de Polêmicas", href: "/polemicas", icon: Flame                     },
      { label: "Gerador de Ofertas",   href: "/ofertas",   icon: Megaphone                 },
    ],
  },
  {
    category: "Estratégia",
    items: [
      { label: "Raio-X de Pacientes",   href: "/raio-x",   icon: ScanFace      },
      { label: "Mapa de Objeções",      href: "/objecoes",  icon: ShieldQuestion },
      { label: "Lab. de Viralização",   href: "/radar",    icon: Microscope    },
      { label: "Biblioteca de Ganchos", href: "/ganchos",  icon: Sparkles      },
      { label: "Banco de Pautas",       href: "/pautas",   icon: FileText      },
    ],
  },
]

const NAV_CLINICA: NavGroup[] = [
  {
    category: null,
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    category: "Agenda",
    items: [
      { label: "Agenda Inteligente", href: "/agenda", icon: Calendar },
    ],
  },
  {
    category: "Pacientes",
    items: [
      { label: "Gestão de Pacientes",  href: "/pacientes", icon: Users },
      { label: "Copiloto de Consulta", href: "/copiloto",  icon: Bot   },
    ],
  },
  {
    category: "Financeiro",
    items: [
      { label: "Financeiro", href: "/financeiro", icon: CircleDollarSign },
    ],
  },
  {
    category: "Automação",
    items: [
      { label: "Nutrição de Pacientes", href: "/nutricao-pacientes", icon: Heart,          },
      { label: "Nutrição de Leads",     href: "/nutricao-leads",     icon: TrendingUp,     },
      { label: "Agente WhatsApp",       href: "/whatsapp",           icon: MessageCircle, badge: "EM BREVE" },
    ],
  },
]

const BADGE_STYLE: Record<string, string> = {
  "ELITE":    "bg-[rgba(212,175,55,0.08)] text-[#d4af37] border border-[rgba(212,175,55,0.25)]",
  "PRO":      "bg-accent-dim text-accent border border-accent-border",
  "LIVE":     "bg-red-500/10 text-red-400 border border-red-500/30",
  "EM BREVE": "bg-surface-2 text-text-muted border border-border",
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent() {
  const pathname = usePathname()
  const { closeMenu } = useMenu()
  const { user, signOut } = useAuth()

  const [ala, setAla] = useState<"social" | "clinica">("social")

  useEffect(() => {
    const saved = localStorage.getItem("praxis_ala") as "social" | "clinica" | null
    if (saved === "social" || saved === "clinica") setAla(saved)
  }, [])

  const switchAla = (next: "social" | "clinica") => {
    setAla(next)
    localStorage.setItem("praxis_ala", next)
  }

  const nav = ala === "social" ? NAV_SOCIAL : NAV_CLINICA

  return (
    <aside className="h-full w-60 flex flex-col bg-surface border-r border-border">

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <PraxisLogo />
        <button
          onClick={closeMenu}
          className="md:hidden w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors flex-shrink-0"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Ala toggle */}
      <div className="flex gap-1 px-3 py-2.5 border-b border-border">
        <button
          onClick={() => switchAla("social")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors",
            ala === "social"
              ? "bg-accent-dim border border-accent-border text-accent"
              : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
          )}
        >
          <Sparkles className="w-3 h-3" /> Social
        </button>
        <button
          onClick={() => switchAla("clinica")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors",
            ala === "clinica"
              ? "bg-blue-500/10 border border-blue-500/25 text-blue-400"
              : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
          )}
        >
          <Stethoscope className="w-3 h-3" /> Clínica
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5 scrollbar-none">
        {nav.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-1" : ""}>
            {group.category && (
              <div className="px-3 py-2 mt-3 mb-1">
                <span className="text-[9px] font-sans text-text-muted tracking-[3px] uppercase font-medium">
                  {group.category}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon     = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[12.5px] font-medium transition-colors group",
                      isActive
                        ? ala === "clinica"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-accent-dim text-accent"
                        : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                    )}
                  >
                    {isActive && (
                      <span className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[60%] rounded-r-full",
                        ala === "clinica" ? "bg-blue-400" : "bg-accent"
                      )} />
                    )}
                    <Icon className={cn(
                      "w-3.5 h-3.5 flex-shrink-0 transition-colors",
                      isActive
                        ? ala === "clinica" ? "text-blue-400" : "text-accent"
                        : "text-text-muted group-hover:text-text-secondary"
                    )} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider flex-shrink-0",
                        BADGE_STYLE[item.badge] ?? BADGE_STYLE["PRO"]
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border">
        {/* Plan badge */}
        <div className="px-4 pt-3 pb-1">
          <Link
            href="/planos"
            onClick={closeMenu}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.15)] hover:border-[rgba(212,175,55,0.3)] transition-colors group"
          >
            <CreditCard className="w-3 h-3 text-[#d4af37] flex-shrink-0" />
            <span className="text-[10px] font-mono font-semibold text-[#d4af37] tracking-wider flex-1">ELITE</span>
            <span className="text-[9px] text-text-muted group-hover:text-text-secondary">Ver planos →</span>
          </Link>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5 px-4 pt-2 pb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(0,192,127,0.3), rgba(0,192,127,0.1))", border: "1px solid rgba(0,192,127,0.2)" }}
          >
            <span className="text-[11px] font-bold text-accent">BG</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-text-primary truncate leading-none">Dr. Bruno Gustavo</div>
            <div className="text-[10px] text-text-muted truncate mt-0.5 leading-none">
              {user?.email ?? "brunogustavosa@gmail.com"}
            </div>
          </div>
        </div>

        {/* Settings + ThemeToggle + Sign out row */}
        <div className="flex items-center gap-1.5 px-4 pb-3">
          <Link
            href="/configuracoes"
            onClick={closeMenu}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors flex-shrink-0"
            title="Configurações"
            aria-label="Configurações"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
          <ThemeToggle size="sm" />
          <div className="flex-1" />
          <button
            onClick={signOut}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-950/30 transition-colors flex-shrink-0"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
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
      <div className="hidden md:block fixed left-0 top-0 h-full w-60 z-40">
        <SidebarContent />
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu PRAXIS">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
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
