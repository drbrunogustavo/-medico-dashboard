import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/Sidebar"

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
          <main className="flex-1 ml-60 min-h-screen bg-background grid-bg">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}