import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Financeiro",
  description: "Controle financeiro da clínica: receitas, despesas, DRE e projeções de faturamento.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
