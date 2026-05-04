import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/Sidebar"

export const metadata: Metadata = {
  title: "MedContent Dashboard",
  description: "Dashboard de gestão de conteúdo médico para Instagram",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-background text-text-primary antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-60 min-h-screen bg-background grid-bg">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
