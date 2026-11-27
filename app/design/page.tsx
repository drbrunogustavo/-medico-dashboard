import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { DesignDemo } from "./DesignDemo"

export const metadata: Metadata = {
  title: "Design, conferência de componentes",
  robots: { index: false, follow: false },
}

// Rota interna para conferir o sistema px. Não existe em produção.
export default function DesignPage() {
  if (process.env.VERCEL_ENV === "production") notFound()
  return <DesignDemo />
}
