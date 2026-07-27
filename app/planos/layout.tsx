import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Planos e preços",
  description: "Escolha seu plano PRAXIS: Starter, Pro ou Elite. Copiloto de consulta, CRM, financeiro, marketing e IA para médicos. 7 dias grátis.",
}

export default function PlanosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
