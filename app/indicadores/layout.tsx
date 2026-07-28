import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Indicadores",
  description: "KPIs da clínica: taxa de conversão, ticket médio, NPS e indicadores de performance.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
