"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/* A gestão da equipe vive em Configurações, na seção Membros, e usa /api/team,
   que é a rota que grava as permissões que o middleware realmente aplica.
   Esta rota fica só para não quebrar atalhos antigos. */
export default function MembrosRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/configuracoes?aba=membros") }, [router])
  return <p role="status" className="px-4 py-10 text-center text-[13px] text-px-muted md:px-10">Abrindo a equipe em Configurações</p>
}
