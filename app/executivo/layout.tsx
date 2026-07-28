import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Painel Executivo",
  description: "Painel executivo com visão estratégica da clínica: métricas consolidadas, alertas e projeções.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
