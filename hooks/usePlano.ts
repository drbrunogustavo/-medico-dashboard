"use client"

import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { Plano } from "@/lib/app-types"
import { useAppContext } from "@/components/AppProvider"

// Re-export so existing consumers keep working without changes
export type { Plano }

interface UsePlanoResult {
  plano:   Plano
  loading: boolean
}

export function usePlano(): UsePlanoResult {
  const ctx = useAppContext()

  // Standalone state — only used when AppProvider is not in the tree
  const [plano,   setPlano]   = useState<Plano>("starter")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ctx) return // context handles it

    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const userId = data.session?.user?.id
      if (!userId) { setLoading(false); return }

      supabase
        .from("user_planos")
        .select("plano")
        .eq("user_id", userId)
        .single()
        .then(({ data: row }: { data: { plano: string } | null }) => {
          const p = row?.plano as Plano | null
          if (p === "trial" || p === "starter" || p === "pro" || p === "elite") setPlano(p)
          setLoading(false)
        })
    })
  }, [ctx])

  if (ctx) return { plano: ctx.plano, loading: ctx.loading }
  return { plano, loading }
}
