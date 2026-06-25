import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { isAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const supabase = createSupabaseServiceClient()

  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })

  const { data: perfis } = await supabase
    .from("perfis")
    .select("user_id, nome, especialidade")

  const { data: planos } = await supabase
    .from("user_planos")
    .select("user_id, plano, status, assinatura_termina_em, trial_termina_em, stripe_subscription_id")

  const perfisMap = Object.fromEntries((perfis ?? []).map(p => [p.user_id, p]))
  const planosMap = Object.fromEntries((planos ?? []).map(p => [p.user_id, p]))

  const result = users.map(u => {
    const p  = perfisMap[u.id] ?? {}
    const pl = planosMap[u.id] ?? {}
    return {
      id:                    u.id,
      email:                 u.email,
      nome:                  p.nome          ?? null,
      especialidade:         p.especialidade ?? null,
      plano:                 pl.plano        ?? "trial",
      status:                pl.status       ?? "ativo",
      assinatura_termina_em: pl.assinatura_termina_em ?? null,
      trial_termina_em:      pl.trial_termina_em      ?? null,
      tem_stripe:             !!pl.stripe_subscription_id,
      stripe_subscription_id: pl.stripe_subscription_id ?? null,
      cadastro_em:           u.created_at,
      ultimo_acesso:         u.last_sign_in_at ?? null,
    }
  })

  result.sort((a, b) => new Date(b.cadastro_em).getTime() - new Date(a.cadastro_em).getTime())
  return NextResponse.json(result)
}
