"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Users, CreditCard, Share2, Megaphone, Activity } from "lucide-react"
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

  return (
    <div className="flex min-h-screen">
      <aside className="w-44 border-r border-border bg-surface flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-[9px] font-mono font-bold text-accent tracking-[3px] uppercase">
            Admin
          </span>
        </div>
        <nav className="p-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
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
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
