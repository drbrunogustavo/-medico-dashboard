"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/admin/depoimentos", label: "Depoimentos" },
  { href: "/admin/assinantes",  label: "Assinantes"  },
  { href: "/admin/financeiro",  label: "Financeiro"  },
  { href: "/admin/afiliados",   label: "Afiliados"   },
  { href: "/admin/anuncios",    label: "Anúncios"    },
  { href: "/admin/automacoes",  label: "Automações"  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div>
      <nav aria-label="Administração" className="overflow-x-auto px-4 pt-4 md:px-10">
        <ul className="inline-flex gap-1 rounded-full bg-px-ink/[0.06] p-1">
          {NAV.map(({ href, label }) => {
            const ativo = pathname === href || pathname.startsWith(href + "/")
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40",
                    ativo ? "bg-px-ink text-white" : "text-px-ink hover:bg-px-ink/10"
                  )}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      {children}
    </div>
  )
}
