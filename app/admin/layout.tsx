"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { MessageSquare, Users, CreditCard, Share2, Megaphone, Activity, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/admin/depoimentos", label: "Depoimentos",  icon: MessageSquare },
  { href: "/admin/assinantes",  label: "Assinantes",   icon: Users         },
  { href: "/admin/financeiro",  label: "Financeiro",   icon: CreditCard    },
  { href: "/admin/afiliados",   label: "Afiliados",    icon: Share2        },
  { href: "/admin/anuncios",    label: "Anúncios",     icon: Megaphone     },
  { href: "/admin/automacoes",  label: "Automações",   icon: Activity      },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = (
    <nav className="p-2 space-y-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-all",
              active
                ? "bg-accent-dim text-accent font-semibold border border-accent-border"
                : "text-text-muted hover:text-text-primary hover:bg-card"
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-44 border-r border-border bg-surface flex-shrink-0 flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-[9px] font-mono font-bold text-accent tracking-[3px] uppercase">Admin</span>
        </div>
        {navLinks}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border flex items-center justify-between px-4 py-3">
        <span className="text-[9px] font-mono font-bold text-accent tracking-[3px] uppercase">Admin</span>
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-card transition-colors"
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed top-[49px] left-0 right-0 z-40 bg-surface border-b border-border shadow-lg">
            {navLinks}
          </div>
        </>
      )}

      <div className="flex-1 min-w-0 md:pt-0 pt-[49px]">{children}</div>
    </div>
  )
}
