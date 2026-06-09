"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AgenteExecutivoPage() {
  const router = useRouter()
  useEffect(() => { router.replace("/agente") }, [router])
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-text-muted text-sm font-mono">Redirecionando para Agente Executivo...</p>
    </div>
  )
}
