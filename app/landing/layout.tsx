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
    // TODO: substituir por /og-image.png (1200×630) quando criado
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "PRAXIS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PRAXIS — Plataforma Clínica com IA para Médicos",
    description:
      "Copiloto de consulta com voz, CRM de pacientes, gestão financeira e marketing médico integrado.",
    images: ["/icon-512.png"],
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
