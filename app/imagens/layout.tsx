import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "PRAXIS — Diretor Criativo",
  description: "Gere imagens e conteúdos visuais para redes sociais com IA especializada para médicos.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
