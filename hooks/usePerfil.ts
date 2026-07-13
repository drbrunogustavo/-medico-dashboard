"use client"

import { useEffect, useState, useCallback } from "react"
import type { Perfil } from "@/lib/app-types"

// Re-export so existing consumers keep working without changes
export type { Perfil }

export function usePerfil(): { perfil: Perfil | null; loading: boolean; refetch: () => void } {
  const [perfil,  setPerfil]  = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    fetch("/api/perfil")
      .then(r => r.ok ? r.json() as Promise<Perfil | null> : null)
      .then(data => setPerfil(data))
      .catch(() => setPerfil(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return { perfil, loading, refetch }
}
