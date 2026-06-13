import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("academy_progresso")
    .select("*")
    .eq("user_id", auth.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as { aula_id: string; trilha_id: string; status: string }
  if (!body.aula_id || !body.trilha_id) {
    return NextResponse.json({ error: "aula_id e trilha_id são obrigatórios" }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("academy_progresso")
    .upsert(
      {
        user_id:       auth.userId,
        aula_id:       body.aula_id,
        trilha_id:     body.trilha_id,
        status:        body.status ?? "concluida",
        concluida_em:  body.status === "concluida" ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,aula_id" }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
