import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Perfil",
  description: "Configurações do perfil profissional, especialidade, integrações e preferências da plataforma.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
