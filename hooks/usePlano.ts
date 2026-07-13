"use client"

import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export type Plano = "trial" | "starter" | "pro" | "elite"

interface UsePlanoResult {
  plano:   Plano
  loading: boolean
}

export function usePlano(): UsePlanoResult {
  const [plano,   setPlano]   = useState<Plano>("starter")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const userId = data.session?.user?.id
      if (!userId) {
        setLoading(false)
        return
      }

      supabase
        .from("user_planos")
        .select("plano")
        .eq("user_id", userId)
        .single()
        .then(({ data: row }: { data: { plano: string } | null }) => {
          const p = row?.plano as Plano | null
          if (p === "trial" || p === "starter" || p === "pro" || p === "elite") {
            setPlano(p)
          }
          setLoading(false)
        })
    })
  }, [])

  return { plano, loading }
}
