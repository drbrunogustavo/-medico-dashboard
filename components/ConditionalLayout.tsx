"use client"

import { usePathname } from "next/navigation"
import { Sidebar }            from "@/components/Sidebar"
import { MobileNav }          from "@/components/MobileNav"
import { MobileMenuProvider } from "@/components/MobileMenuProvider"

// Routes that must NOT render the Sidebar or trigger any auth hooks.
const PUBLIC_PATHS = new Set(["/", "/login", "/planos", "/landing", "/onboarding", "/captacao"])
const PUBLIC_PREFIXES = ["/nps/", "/indicar/"]

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
        <main className="flex-1 min-h-screen bg-background flex flex-col md:ml-60">
          <MobileNav />
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </MobileMenuProvider>
  )
}
