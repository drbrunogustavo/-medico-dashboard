import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Plataforma Clínica com IA para Médicos",
  description:
    "Copiloto de consulta com voz, CRM de pacientes, gestão financeira e marketing médico integrado. Tudo em uma plataforma para médicos brasileiros.",
  openGraph: {
    title: "PRAXIS — Plataforma Clínica com IA para Médicos",
    description:
      "Copiloto de consulta com voz, CRM de pacientes, gestão financeira e marketing médico integrado.",
    url: "https://praxisplataforma.com.br/landing",
    siteName: "PRAXIS",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PRAXIS — Plataforma Clínica com IA para Médicos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRAXIS — Plataforma Clínica com IA para Médicos",
    description:
      "Copiloto de consulta com voz, CRM de pacientes, gestão financeira e marketing médico integrado.",
    images: ["/og-image.png"],
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
