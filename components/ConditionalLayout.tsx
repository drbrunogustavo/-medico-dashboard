"use client"

import { usePathname } from "next/navigation"
import { Sidebar }            from "@/components/Sidebar"
import { MobileMenuProvider } from "@/components/MobileMenuProvider"
import { PraxisCopilot }      from "@/components/PraxisCopilot"
import { CommandBar }          from "@/components/CommandBar"
import { AppProvider }         from "@/components/AppProvider"

// Routes that must NOT render the Sidebar or trigger any auth hooks.
const PUBLIC_PATHS = new Set(["/", "/login", "/cadastro", "/demo", "/planos", "/landing", "/onboarding", "/captacao", "/privacidade", "/deletar-dados", "/termos", "/anunciar-curso"])
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
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 min-h-screen bg-background flex flex-col md:ml-60">
            <div className="flex-1">{children}</div>
          </main>
        </div>
        <PraxisCopilot />
        <CommandBar />
      </MobileMenuProvider>
    </AppProvider>
  )
}
