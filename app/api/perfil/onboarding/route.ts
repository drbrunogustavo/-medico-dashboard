import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkAuth } from "@/lib/auth-check"

function getSupabaseAdmin() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

// Rota dedicada para marcar onboarding_completo=true via service role,
// isolada de qualquer outro campo do formulário de perfil que possa
// falhar o upsert genérico (coluna inexistente, RLS, etc.) e mascarar
// silenciosamente a gravação dessa flag crítica.
export async function POST() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("perfis")
    .upsert({ user_id: auth.userId, onboarding_completo: true }, { onConflict: "user_id" })

  if (error) {
    console.error("[perfil/onboarding] Erro ao marcar onboarding_completo:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
