import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

type Plano = "trial" | "starter" | "pro" | "elite"
const VALID_PLANOS = new Set<string>(["trial", "starter", "pro", "elite"])

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()

  const [perfilRes, planoRes] = await Promise.all([
    supabase.from("perfis").select("*").eq("user_id", auth.userId).single(),
    supabase.from("user_planos").select("plano").eq("user_id", auth.userId).maybeSingle(),
  ])

  // PGRST116 = no rows — perfil ainda não criado (onboarding incompleto)
  const perfil = perfilRes.error?.code === "PGRST116" ? null : (perfilRes.data ?? null)

  const rawPlano = planoRes.data?.plano
  const plano: Plano = VALID_PLANOS.has(rawPlano ?? "") ? (rawPlano as Plano) : "trial"

  return NextResponse.json({ userId: auth.userId, perfil, plano })
}
