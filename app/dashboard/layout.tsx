import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Dashboard",
  description: "Visão geral da sua clínica: métricas de leads, consultas, NPS e faturamento em tempo real.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
