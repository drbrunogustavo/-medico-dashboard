"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { Perfil, Plano } from "@/lib/app-types"

// ── Context shape ─────────────────────────────────────────────────────────────

interface AppContextValue {
  user:          User | null
  userId:        string | null
  perfil:        Perfil | null
  plano:         Plano
  loading:       boolean
  error:         string | null
  signOut:       () => Promise<void>
  refetchPerfil: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [perfil,  setPerfil]  = useState<Perfil | null>(null)
  const [plano,   setPlano]   = useState<Plano>("trial")
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const router = useRouter()

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me")
      if (!res.ok) {
        // 401 is expected when logged out — not an error worth surfacing
        if (res.status !== 401) setError(`/api/me retornou ${res.status}`)
        setPerfil(null)
        setPlano("trial")
        return
      }
      const data = await res.json() as { userId: string; perfil: Perfil | null; plano: Plano }
      setPerfil(data.perfil)
      setPlano(data.plano)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados do perfil")
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    let mounted = true

    // Initial load: validate session + fetch perfil/plano
    supabase.auth.getUser().then(async ({ data: { user: u } }: { data: { user: User | null } }) => {
      if (!mounted) return
      setUser(u)
      if (u) await fetchMe()
      if (mounted) setLoading(false)
    })

    // Keep auth in sync — re-fetch data when session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchMe()
      } else {
        setPerfil(null)
        setPlano("trial")
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchMe])

  async function signOut() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <AppContext.Provider value={{
      user,
      userId:        user?.id ?? null,
      perfil,
      plano,
      loading,
      error,
      signOut,
      refetchPerfil: fetchMe,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the AppContext value if called inside an AppProvider subtree,
 * or null if called outside (e.g. public routes, tests). Hooks that use
 * this should fall back to their own fetch logic when null.
 */
export function useAppContext(): AppContextValue | null {
  return useContext(AppContext)
}
