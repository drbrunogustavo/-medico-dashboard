import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Agenda Inteligente",
  description: "Gerencie sua agenda de consultas, confirmações de presença e disponibilidade de horários.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
