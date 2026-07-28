import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — CRM de Pacientes",
  description: "Funil de captação e gestão de leads: acompanhe cada paciente da atração à fidelização.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
