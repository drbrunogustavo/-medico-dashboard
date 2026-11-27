"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DiretorCriativoPage() {
  const router = useRouter()
  useEffect(() => { router.replace(`/imagens${window.location.search}`) }, [router])
  return (
    <div className="flex h-screen items-center justify-center">
      <p role="status" className="text-[13px] text-px-muted">Abrindo o Diretor Criativo</p>
    </div>
  )
}
