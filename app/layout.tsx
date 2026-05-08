// Salvar em: app/layout.tsx  (substitui o atual)
import type { Metadata } from "next"
import "./globals.css"
import { Sidebar }   from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"

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
        <div className="flex min-h-screen">
          <Sidebar />
          <main
            className={[
              // Desktop: margem esquerda para a sidebar fixa
              "md:ml-60",
              // Mobile: largura total, sem margem
              "flex-1 min-h-screen bg-background grid-bg",
              "flex flex-col",
            ].join(" ")}
          >
            {/* Barra de navegação mobile (← Menu + título da rota) */}
            <MobileNav />
            {/* Conteúdo da página */}
            <div className="flex-1">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
