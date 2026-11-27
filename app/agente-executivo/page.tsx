"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AgenteExecutivoPage() {
  const router = useRouter()
  useEffect(() => { router.replace("/agente") }, [router])
  return (
    <div className="flex h-screen items-center justify-center">
      <p role="status" className="text-[13px] text-px-muted">Abrindo o Agente Executivo</p>
    </div>
  )
}
