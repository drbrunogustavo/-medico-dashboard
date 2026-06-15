import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ConditionalLayout } from "@/components/ConditionalLayout"

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
  title: "PRAXIS — A plataforma que transforma clínicas",
  description: "Plataforma completa para médicos: marketing digital, gestão clínica, CRM de leads, IA estratégica e muito mais.",
  keywords: ["médicos", "marketing médico", "gestão clínica", "plataforma médica", "CRM médico", "conteúdo médico", "IA para médicos"],
  openGraph: {
    title: "PRAXIS — Para médicos que pensam grande",
    description: "Plataforma completa para médicos: marketing digital, gestão clínica, CRM de leads, IA estratégica e muito mais.",
    url: "https://praxisplataforma.com.br",
    siteName: "PRAXIS",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRAXIS",
    description: "Plataforma completa para médicos: marketing digital, gestão clínica, CRM de leads, IA estratégica e muito mais.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://praxisplataforma.com.br",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PRAXIS",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-background text-text-primary antialiased">
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}
