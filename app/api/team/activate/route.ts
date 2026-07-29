import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

// POST { token } — ativa o convite para o usuário autenticado
// Chamado logo após o signup em /cadastro?convite=[token]
export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const body = await req.json() as { token?: string }
  if (!body.token) {
    return NextResponse.json({ error: "token obrigatório." }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from("team_members")
    .update({
      user_id:      auth.userId,
      status:       "ativo",
      invite_token: null,        // invalida o token após uso
    })
    .eq("invite_token", body.token)
    .eq("status", "pendente")
    .select("id")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Token inválido ou já utilizado." }, { status: 400 })
  }

  return NextResponse.json({ ok: true, memberId: data.id })
}
