import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("integracoes_usuario")
    .select("tipo, config, ativo")
    .eq("user_id", auth.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { tipo, config } = await req.json() as { tipo: string; config: Record<string, string> }
  if (!tipo || !config) return NextResponse.json({ error: "tipo e config obrigatórios" }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("integracoes_usuario")
    .upsert(
      { user_id: auth.userId, tipo, config, ativo: true },
      { onConflict: "user_id,tipo" }
    )
    .select("tipo, config, ativo")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
