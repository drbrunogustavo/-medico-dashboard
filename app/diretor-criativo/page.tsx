"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DiretorCriativoPage() {
  const router = useRouter()
  useEffect(() => { router.replace(`/imagens${window.location.search}`) }, [router])
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-text-muted text-sm font-mono">Redirecionando para Diretor Criativo...</p>
    </div>
  )
}
