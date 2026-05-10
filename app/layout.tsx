// Salvar em: app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"
import { Sidebar }            from "@/components/Sidebar"
import { MobileNav }          from "@/components/MobileNav"
import { MobileMenuProvider } from "@/components/MobileMenuProvider"

export const metadata: Metadata = {
  title: "MedContent Dashboard",
  description: "Dashboard de gestão de conteúdo médico",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MedContent",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="theme-color" content="#00c07f" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-background text-text-primary antialiased">
        <MobileMenuProvider>
          <div className="flex min-h-screen">
            {/* Sidebar — fixed desktop / overlay mobile */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 min-h-screen bg-background grid-bg flex flex-col md:ml-60">
              {/* Mobile top bar com hamburger */}
              <MobileNav />
              {/* Conteúdo da página */}
              <div className="flex-1">
                {children}
              </div>
            </main>
          </div>
        </MobileMenuProvider>
      </body>
    </html>
  )
}
