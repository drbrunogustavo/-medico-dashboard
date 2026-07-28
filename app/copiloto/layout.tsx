import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Copiloto de Consulta",
  description: "Assistente clínico com IA: resumo SOAP, plano terapêutico, exames e follow-up gerados em segundos após a consulta.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
