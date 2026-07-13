"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard, X,
  Megaphone, Stethoscope, BarChart3, Sparkles, GraduationCap,
  Target, Play, Smartphone, LayoutGrid, CalendarDays, Radio, Users2,
  Video, FileText, Zap, MousePointerClick, Repeat2, Microscope, ScanFace,
  TrendingUp, Heart, Calendar, Bot, Users, Star, UserPlus,
  MessageSquare, ShieldQuestion, ClipboardList, CircleDollarSign,
  Tag, Activity, Lightbulb, Layers, Layers2,
  LogOut, CreditCard, Settings, ShieldCheck,
  RefreshCw, Map, BarChart2, Rocket,
  Instagram, Calculator, FileBarChart,
  FlaskConical, FileHeart, Pill, Gauge,
  BookOpen, Wand2, Store, Brain, FileSpreadsheet,
  Download, Receipt, Gift, Command,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMenu } from "@/components/MobileMenuProvider"
import { useAppContext } from "@/components/AppProvider"
import type { Plano } from "@/lib/app-types"
import { PraxisLogo } from "@/components/PraxisLogo"

// ─── Types ────────────────────────────────────────────────────────────────────

type AlaId   = "social" | "consultorio" | "executivo" | "ia" | "academy"
type NavItem = { label: string; href: string; icon: React.ElementType; badge?: string | null }

// ─── Ala definitions ──────────────────────────────────────────────────────────

const ALAS: Record<AlaId, {
  label:           string
  short:           string
  icon:            React.ElementType
  activeTxt:       string
  activeBg:        string
  activeBorder:    string
  activeIndicator: string
}> = {
  social:      {
    label: "Atrair Pacientes",        short: "Social",   icon: Megaphone,
    activeTxt: "text-accent",    activeBg: "bg-accent-dim",       activeBorder: "border-accent-border",     activeIndicator: "bg-accent",
  },
  consultorio: {
    label: "Atender Melhor",          short: "Consult.", icon: Stethoscope,
    activeTxt: "text-blue-400",  activeBg: "bg-blue-500/10",      activeBorder: "border-blue-500/25",       activeIndicator: "bg-blue-400",
  },
  executivo:   {
    label: "Gerir e Escalar",         short: "Exec.",    icon: BarChart3,
    activeTxt: "text-purple-400",activeBg: "bg-purple-500/10",    activeBorder: "border-purple-500/25",     activeIndicator: "bg-purple-400",
  },
  ia:          {
    label: "Inteligência Estratégica",short: "IA",       icon: Sparkles,
    activeTxt: "text-amber-400", activeBg: "bg-amber-500/10",     activeBorder: "border-amber-500/25",      activeIndicator: "bg-amber-400",
  },
  academy:     {
    label: "Aprender e Crescer",      short: "Academy",  icon: GraduationCap,
    activeTxt: "text-pink-400",  activeBg: "bg-pink-500/10",      activeBorder: "border-pink-500/25",       activeIndicator: "bg-pink-400",
  },
}

// ─── Nav items per ala ────────────────────────────────────────────────────────

const NAV: Record<AlaId, NavItem[]> = {
  social: [
    { label: "Estratégia de Conteúdo", href: "/posicionamento",   icon: Target            },
    { label: "Reels e Vídeos",         href: "/reels",            icon: Play              },
    { label: "Stories",                href: "/stories",          icon: Smartphone        },
    { label: "Carrosséis",             href: "/carrossel",        icon: LayoutGrid        },
    { label: "Calendário Editorial",   href: "/calendario",       icon: CalendarDays      },
    { label: "Radar de Tendências",    href: "/radar",            icon: Radio,   badge: "LIVE" },
    { label: "Análise de Concorrentes",href: "/concorrentes",     icon: Users2            },
    { label: "Copiloto de Conteúdo",   href: "/copiloto-conteudo",icon: Wand2, badge: "IA" },
    { label: "Gerador de Legendas",    href: "/legendas",         icon: Sparkles          },
    { label: "Gerador de Roteiros",    href: "/roteiros",         icon: Video             },
    { label: "Instagram Analytics",     href: "/instagram",        icon: Instagram         },
    { label: "Banco de Pautas",        href: "/pautas",           icon: FileText          },
    { label: "Biblioteca de Ganchos",  href: "/ganchos",          icon: Zap               },
    { label: "Gerador de CTAs",        href: "/cta",              icon: MousePointerClick },
    { label: "Repurposing",            href: "/repurposing",      icon: Repeat2           },
    { label: "Lab. de Títulos",        href: "/titulos",          icon: Microscope        },
    { label: "Raio-X de Pacientes",    href: "/raio-x",           icon: ScanFace          },
  ],
  consultorio: [
    { label: "CRM de Leads",            href: "/crm",              icon: Users2        },
    { label: "Nutrição de Leads",       href: "/nutricao-leads",   icon: TrendingUp    },
    { label: "Régua de Relacionamento", href: "/regua",            icon: Heart         },
    { label: "Agenda Inteligente",      href: "/agenda",           icon: Calendar      },
    { label: "Copiloto de Consulta",    href: "/copiloto",         icon: Bot,           badge: "MAIS USADO" },
    { label: "Conversa Clínica",        href: "/conversa",         icon: MessageSquare, badge: "NOVO" },
    { label: "Gestão de Pacientes",     href: "/pacientes",        icon: Users         },
    { label: "Radar da Clínica",        href: "/radar-clinica",    icon: Gauge, badge: "NOVO" },
    { label: "Importar Pacientes",      href: "/importar",         icon: FileSpreadsheet, badge: "MIGRAÇÃO" },
    { label: "Exportar Dados",          href: "/exportar",         icon: Download },
    { label: "Pesquisa NPS",            href: "/nps",              icon: Star          },
    { label: "Programa de Indicações",  href: "/indicacoes",       icon: UserPlus      },
    { label: "Scripts de Atendimento",  href: "/scripts",          icon: MessageSquare },
    { label: "Central de Objeções",     href: "/objecoes",         icon: ShieldQuestion},
    { label: "SOPs da Clínica",         href: "/sops",             icon: ClipboardList },
    { label: "Calculadoras Clínicas",   href: "/calculadoras",     icon: Calculator    },
    { label: "Reativação de Pacientes", href: "/reativacao",          icon: RefreshCw    },
    { label: "Jornada do Paciente",     href: "/jornada",             icon: Map          },
    { label: "Interpretação de Exames", href: "/interpretacao-exames",icon: FlaskConical },
    { label: "Relatório para Paciente", href: "/relatorio-paciente",  icon: FileHeart    },
    { label: "Prescrição Assistida",       href: "/prescricao",    icon: Pill         },
  ],
  executivo: [
    { label: "Painel Executivo",       href: "/executivo",    icon: BarChart3        },
    { label: "Financeiro",             href: "/financeiro",   icon: CircleDollarSign },
    { label: "Precificação",           href: "/precificacao", icon: Tag              },
    { label: "Indicadores da Clínica", href: "/indicadores",  icon: BarChart2        },
    { label: "Consultor Estratégico",  href: "/consultor",    icon: Lightbulb        },
    { label: "Diagnóstico 360°",       href: "/diagnostico",  icon: Activity         },
    { label: "Metas e Planejamento",   href: "/metas",        icon: Target           },
    { label: "Relatório Mensal",        href: "/relatorio",    icon: FileBarChart     },
    { label: "Mapa de Objeções",       href: "/objecoes",     icon: ShieldQuestion   },
    { label: "Notas Fiscais",          href: "/notas-fiscais", icon: Receipt,    badge: "BETA"      },
    { label: "Programa de Afiliados",  href: "/afiliados",    icon: Gift,       badge: "Ganhe 20%" },
  ],
  ia: [
    { label: "Posicionamento Médico",     href: "/posicionamento",    icon: Target  },
    { label: "Diretor Criativo",          href: "/diretor-criativo",  icon: Layers  },
    { label: "Agente Executivo",          href: "/agente-executivo",  icon: Bot,   badge: "PRO" },
    { label: "Nutrição de Leads Clínica", href: "/nutricao-pacientes",icon: Layers2  },
    { label: "Memória Clínica",            href: "/memoria",           icon: Brain,   badge: "NOVO" },
    { label: "Banco de Estudos",          href: "/estudos",           icon: BookOpen },
    { label: "Inteligência de Mercado",   href: "/mercado",           icon: TrendingUp },
  ],
  academy: [
    { label: "PRAXIS Academy",    href: "/academy",  icon: GraduationCap                   },
    { label: "Comunidade",        href: "/comunidade", icon: MessageSquare, badge: "NOVO"  },
    { label: "Trilha Marketing",  href: "/academy",  icon: Megaphone,  badge: "EM BREVE"   },
    { label: "Trilha Gestão",     href: "/academy",  icon: BarChart3,  badge: "EM BREVE"   },
    { label: "Trilha Comercial",  href: "/academy",  icon: TrendingUp, badge: "EM BREVE"   },
    { label: "Trilha Escala",     href: "/academy",  icon: Rocket,     badge: "EM BREVE"   },
    { label: "Marketplace",       href: "/marketplace", icon: Store                         },
  ],
}

// ─── Badge styles ─────────────────────────────────────────────────────────────

const BADGE_STYLE: Record<string, string> = {
  "ELITE":      "bg-[rgba(212,175,55,0.08)] text-[#d4af37] border border-[rgba(212,175,55,0.25)]",
  "PRO":        "bg-accent-dim text-accent border border-accent-border",
  "LIVE":       "bg-red-500/10 text-red-400 border border-red-500/30",
  "EM BREVE":   "bg-surface-2 text-text-muted border border-border",
  "IA":         "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  "MAIS USADO": "bg-[rgba(212,175,55,0.08)] text-[#d4af37] border border-[rgba(212,175,55,0.25)]",
  "NOVO":       "bg-accent-dim text-accent border border-accent-border",
  "MIGRAÇÃO":   "bg-blue-500/10 text-blue-400 border border-blue-500/25",
  "BETA":       "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  "Ganhe 20%":  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
}

const PLAN_UI = {
  trial: {
    label:   "TRIAL",
    textCls: "text-amber-400",
    bg:      "bg-amber-500/10",
    border:  "border-amber-500/25 hover:border-amber-500/40",
    iconCls: "text-amber-400",
  },
  starter: {
    label:  "STARTER",
    textCls: "text-text-muted",
    bg:      "bg-surface-2",
    border:  "border-border hover:border-border-hover",
    iconCls: "text-text-muted",
  },
  pro: {
    label:   "PRO",
    textCls: "text-accent",
    bg:      "bg-accent-dim",
    border:  "border-accent-border hover:border-accent/40",
    iconCls: "text-accent",
  },
  elite: {
    label:   "ELITE",
    textCls: "text-[#d4af37]",
    bg:      "bg-[rgba(212,175,55,0.06)]",
    border:  "border-[rgba(212,175,55,0.15)] hover:border-[rgba(212,175,55,0.3)]",
    iconCls: "text-[#d4af37]",
  },
} as const

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent() {
  const pathname      = usePathname()
  const { closeMenu } = useMenu()
  const ctx     = useAppContext()
  const user    = ctx?.user    ?? null
  const perfil  = ctx?.perfil  ?? null
  const plano   = (ctx?.plano  ?? "trial") as Plano
  const signOut = ctx?.signOut ?? (async () => {})

  const doctorId    = process.env.NEXT_PUBLIC_DOCTOR_USER_ID
  const isAdminUser = !!user?.id && !!doctorId && user.id === doctorId

  const [ala, setAla] = useState<AlaId>("social")
  const [leadsNaoLidos, setLeadsNaoLidos] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem("praxis_ala_v2") as AlaId | null
    const valid: AlaId[] = ["social","consultorio","executivo","ia","academy"]
    if (saved && valid.includes(saved)) setAla(saved)
  }, [])

  useEffect(() => {
    const check = () => {
      if (document.hidden) return
      fetch("/api/crm/nao-lidos")
        .then(r => r.ok ? r.json() as Promise<{ count: number }> : { count: 0 })
        .then(d => setLeadsNaoLidos(d.count ?? 0))
        .catch(() => {})
    }
    check()
    const id = setInterval(check, 30_000)
    document.addEventListener("visibilitychange", check)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", check)
    }
  }, [])

  const switchAla = (next: AlaId) => {
    setAla(next)
    localStorage.setItem("praxis_ala_v2", next)
  }

  const alaConfig = ALAS[ala]
  const navItems  = NAV[ala]

  return (
    <aside className="h-full w-60 flex flex-col bg-surface border-r border-border">

      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <Link href="/dashboard" onClick={closeMenu}>
          <PraxisLogo />
        </Link>
        <button
          onClick={closeMenu}
          className="md:hidden w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors flex-shrink-0"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Ala selector — 5 icon pills ── */}
      <div className="flex items-center gap-1 px-2 pt-2 pb-1 border-b border-border">
        {(Object.entries(ALAS) as [AlaId, typeof ALAS[AlaId]][]).map(([id, cfg]) => {
          const AlaIcon = cfg.icon
          const isActive = ala === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchAla(id)}
              title={cfg.label}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg text-[7.5px] font-bold gap-0.5 transition-colors leading-none",
                isActive
                  ? `${cfg.activeBg} border ${cfg.activeBorder} ${cfg.activeTxt}`
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
              )}
            >
              <AlaIcon className="w-3.5 h-3.5" />
              <span className="truncate max-w-[34px] text-center">{cfg.short}</span>
            </button>
          )
        })}
      </div>

      {/* ── Active ala label ── */}
      <div className="px-4 pt-2.5 pb-1.5">
        <span className={cn("text-[9px] font-mono font-semibold tracking-[2px] uppercase", alaConfig.activeTxt)}>
          {alaConfig.label}
        </span>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 pb-3 overflow-y-auto scrollbar-none">
        <div className="space-y-0.5">
          {navItems.map(item => {
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
                    ? `${alaConfig.activeBg} ${alaConfig.activeTxt}`
                    : "text-text-muted hover:text-text-primary hover:bg-surface-2"
                )}
              >
                {isActive && (
                  <span className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[60%] rounded-r-full",
                    alaConfig.activeIndicator
                  )} />
                )}
                <Icon className={cn(
                  "w-3.5 h-3.5 flex-shrink-0 transition-colors",
                  isActive ? alaConfig.activeTxt : "text-text-muted group-hover:text-text-secondary"
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
                {item.href === "/crm" && leadsNaoLidos > 0 && (
                  <span className="min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full px-1 flex-shrink-0">
                    {leadsNaoLidos > 99 ? "99+" : leadsNaoLidos}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-border">
        {/* Admin link — only rendered for DOCTOR_USER_ID, not present in HTML for others */}
        {isAdminUser && (
          <Link
            href="/admin/depoimentos"
            onClick={closeMenu}
            className={cn(
              "flex items-center gap-2 mx-3 mt-2 px-3 py-1.5 rounded-lg text-[11px] transition-colors",
              pathname.startsWith("/admin")
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Painel Admin</span>
          </Link>
        )}

        {/* Dashboard quick link */}
        <Link
          href="/dashboard"
          onClick={closeMenu}
          className={cn(
            "flex items-center gap-2 mx-3 mt-2 mb-1 px-3 py-1.5 rounded-lg text-[11px] transition-colors",
            pathname === "/dashboard"
              ? "bg-surface-2 text-text-primary font-medium"
              : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
          )}
        >
          <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Dashboard</span>
        </Link>

        {/* Plan badge */}
        <div className="px-4 pb-1">
          <Link
            href="/planos"
            onClick={closeMenu}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors group",
              PLAN_UI[plano].bg,
              PLAN_UI[plano].border,
            )}
          >
            <CreditCard className={cn("w-3 h-3 flex-shrink-0", PLAN_UI[plano].iconCls)} />
            <span className={cn("text-[10px] font-mono font-semibold tracking-wider flex-1", PLAN_UI[plano].textCls)}>
              {PLAN_UI[plano].label}
            </span>
            <span className="text-[9px] text-text-muted group-hover:text-text-secondary">Ver planos →</span>
          </Link>
        </div>

        {/* User row */}
        <Link
          href="/perfil"
          onClick={closeMenu}
          className="flex items-center gap-2.5 px-4 pt-2 pb-2 hover:bg-surface-2 transition-colors rounded-lg mx-1 group"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(184,151,106,0.3), rgba(184,151,106,0.1))", border: "1px solid rgba(184,151,106,0.25)" }}
          >
            <span className="text-[11px] font-bold text-accent">
              {perfil?.nome
                ? perfil.nome
                    .replace(/^Dr\.?\s*/i, "")
                    .trim()
                    .split(" ")
                    .filter(Boolean)
                    .map(n => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : user?.email?.slice(0, 2).toUpperCase() ?? "??"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-text-primary truncate leading-none group-hover:text-accent transition-colors">
              {perfil?.nome ?? user?.email?.split("@")[0] ?? "Meu perfil"}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5 leading-none">
              {perfil?.especialidade ?? user?.email ?? ""}
            </div>
          </div>
        </Link>

        {/* Copilot hint */}
        <div className="px-3 pb-1">
          <button
            onClick={() => document.dispatchEvent(new CustomEvent("praxis:cmd-open"))}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-text-muted hover:text-text-secondary hover:bg-surface transition-colors"
          >
            <Command className="w-3 h-3 flex-shrink-0" />
            <span>K</span>
            <span className="text-text-muted/50 mx-0.5">·</span>
            <span>Acesso rápido</span>
          </button>
        </div>

        {/* Depoimento CTA */}
        <div className="px-3 pb-2">
          <Link
            href="/depoimento"
            onClick={closeMenu}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all hover:opacity-80"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>
            <Star className="w-3 h-3 flex-shrink-0" />
            Deixar depoimento
          </Link>
        </div>

        {/* Settings + Sign out */}
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
          <Link
            href="/configuracoes/membros"
            onClick={closeMenu}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
              pathname === "/configuracoes/membros"
                ? "bg-accent-dim text-accent border border-accent-border"
                : "text-text-muted hover:text-text-primary hover:bg-surface-2"
            )}
            title="Membros da Equipe"
            aria-label="Membros da Equipe"
          >
            <Users2 className="w-3.5 h-3.5" />
          </Link>
          <div className="flex-1" />
          <button
            onClick={signOut}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
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
