"use client"

import { useEffect, useState } from "react"
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useAppContext } from "@/components/AppProvider"

interface AuthState {
  user: User | null
  loading: boolean
}

export function useAuth() {
  const ctx = useAppContext()
  const router = useRouter()

  // Standalone state — only used when AppProvider is not in the tree
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    if (ctx) return // context handles it

    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setState({ user: session?.user ?? null, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setState({ user: session?.user ?? null, loading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [ctx])

  async function signOut() {
    if (ctx) return ctx.signOut()
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (ctx) return { user: ctx.user, loading: ctx.loading, signOut }
  return { ...state, signOut }
}
