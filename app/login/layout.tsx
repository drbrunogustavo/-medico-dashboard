import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Entrar na plataforma",
  description: "Acesse sua conta PRAXIS: Copiloto de consulta com voz, CRM de pacientes, gestão financeira e marketing médico em um só lugar.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
