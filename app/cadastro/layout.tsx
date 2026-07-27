import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Criar conta gratuita",
  description: "Crie sua conta PRAXIS e teste 7 dias grátis: Copiloto de consulta com IA, CRM de pacientes, gestão e marketing médico integrado.",
}

export default function CadastroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
