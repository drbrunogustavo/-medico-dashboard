"use client"

import { useEffect, useState, useCallback } from "react"
import type { Perfil } from "@/lib/app-types"
import { useAppContext } from "@/components/AppProvider"

// Re-export so existing consumers keep working without changes
export type { Perfil }

export function usePerfil(): { perfil: Perfil | null; loading: boolean; refetch: () => void } {
  const ctx = useAppContext()

  // Standalone state — only used when AppProvider is not in the tree
  const [standalonePerfil,  setStandalonePerfil]  = useState<Perfil | null>(null)
  const [standaloneLoading, setStandaloneLoading] = useState(true)

  const standaloneRefetch = useCallback(() => {
    setStandaloneLoading(true)
    fetch("/api/perfil")
      .then(r => r.ok ? r.json() as Promise<Perfil | null> : null)
      .then(data => setStandalonePerfil(data))
      .catch(() => setStandalonePerfil(null))
      .finally(() => setStandaloneLoading(false))
  }, [])

  useEffect(() => {
    if (!ctx) standaloneRefetch()
  }, [ctx, standaloneRefetch])

  if (ctx) return { perfil: ctx.perfil, loading: ctx.loading, refetch: ctx.refetchPerfil }
  return { perfil: standalonePerfil, loading: standaloneLoading, refetch: standaloneRefetch }
}
