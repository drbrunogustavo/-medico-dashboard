"use client"

import { useEffect, useState, useCallback } from "react"

export interface Perfil {
  user_id:             string
  nome:                string | null
  especialidade:       string | null
  crm:                 string | null
  cidade:              string | null
  instagram:           string | null
  publico_alvo:        string | null
  diferencial:         string | null
  avatar_url:          string | null
  onboarding_completo: boolean
  criado_em:           string
  // Kit de Marca
  marca_logo_url:       string | null
  marca_cor_primaria:   string | null
  marca_cor_secundaria: string | null
  marca_cor_fundo:      string | null
  marca_tipografia:     string | null
  marca_slogan:         string | null
  marca_tom_voz:        string | null
}

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
