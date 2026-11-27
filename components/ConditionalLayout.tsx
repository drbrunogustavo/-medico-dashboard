"use client"

import { usePathname } from "next/navigation"
import { AppShell }           from "@/components/px/AppShell"
import { MobileMenuProvider } from "@/components/MobileMenuProvider"
import { PraxisCopilot }      from "@/components/PraxisCopilot"
import { CommandBar }          from "@/components/CommandBar"
import { AppProvider }         from "@/components/AppProvider"
import { ScrollToTop }         from "@/components/ScrollToTop"

// Routes that must NOT render the Sidebar or trigger any auth hooks.
const PUBLIC_PATHS = new Set(["/", "/login", "/cadastro", "/demo", "/planos", "/landing", "/onboarding", "/captacao", "/privacidade", "/deletar-dados", "/termos", "/anunciar-curso", "/design"])
const PUBLIC_PREFIXES = ["/nps/", "/indicar/"]

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isPublic = PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
  if (isPublic) {
    return <>{children}</>
  }

  return (
    <AppProvider>
      <MobileMenuProvider>
        <ScrollToTop />
        <AppShell>{children}</AppShell>
        <PraxisCopilot />
        <CommandBar />
      </MobileMenuProvider>
    </AppProvider>
  )
}
