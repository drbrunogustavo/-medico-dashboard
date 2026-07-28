import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Calendário Editorial",
  description: "Calendário editorial de conteúdo médico: planeje e organize posts, reels e campanhas.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
