"use client"

import { usePathname } from "next/navigation"
import { Sidebar }            from "@/components/Sidebar"
import { MobileNav }          from "@/components/MobileNav"
import { MobileMenuProvider } from "@/components/MobileMenuProvider"

// Routes that must NOT render the Sidebar or trigger any auth hooks.
// These pages use fixed inset-0 overlays and are fully public.
const PUBLIC_PATHS = new Set(["/", "/login", "/planos", "/landing", "/onboarding"])

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (PUBLIC_PATHS.has(pathname)) {
    // Public page — render children directly, no Sidebar, no auth hooks fire
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
