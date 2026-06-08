import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Sidebar }            from "@/components/Sidebar"
import { MobileNav }          from "@/components/MobileNav"
import { MobileMenuProvider } from "@/components/MobileMenuProvider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "PRAXIS — Marketing Médico de Alto Padrão",
  description: "Plataforma de inteligência e criação de conteúdo para profissionais de saúde.",
  openGraph: {
    title: "PRAXIS — Marketing Médico de Alto Padrão",
    description: "Plataforma de inteligência e criação de conteúdo para profissionais de saúde.",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PRAXIS",
  },
}

// Anti-flash: sets data-theme BEFORE first paint to avoid white flash on dark mode
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('praxis-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-background text-text-primary antialiased">
        <MobileMenuProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-h-screen bg-background flex flex-col md:ml-60">
              <MobileNav />
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
