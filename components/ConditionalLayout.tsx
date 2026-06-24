"use client"

import { usePathname } from "next/navigation"
import { Sidebar }            from "@/components/Sidebar"
import { MobileNav }          from "@/components/MobileNav"
import { MobileMenuProvider } from "@/components/MobileMenuProvider"

// Routes that must NOT render the Sidebar or trigger any auth hooks.
const PUBLIC_PATHS = new Set(["/", "/login", "/cadastro", "/demo", "/planos", "/landing", "/onboarding", "/captacao", "/privacidade", "/deletar-dados", "/termos"])
const PUBLIC_PREFIXES = ["/nps/", "/indicar/"]

// Paths already migrated to MobileOnlyHeader — add each page as it gets migrated.
// Remove this Set (and the condition below) once all 35 pages are migrated.
const MOBILE_MIGRATED = new Set(["/executivo", "/calculadoras", "/roteiros"])

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isPublic = PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
  if (isPublic) {
    return <>{children}</>
  }

  return (
    <MobileMenuProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 min-h-screen bg-background flex flex-col md:ml-60">
          {!MOBILE_MIGRATED.has(pathname) && <MobileNav />}
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </MobileMenuProvider>
  )
}
