import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Sobre a plataforma",
  description: "Conheça o PRAXIS: o sistema operacional de clínicas que integra consultório, gestão, marketing e inteligência para médicos brasileiros.",
}

export default function SobreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
