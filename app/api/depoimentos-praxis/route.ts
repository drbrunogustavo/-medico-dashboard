import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("depoimentos_publicos")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await request.json() as Record<string, unknown>
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("depoimentos_publicos")
    .insert({
      user_id:            auth.userId,
      nome:               body.nome,
      crm:                body.crm ?? null,
      especialidade:      body.especialidade,
      cidade:             body.cidade ?? null,
      estado:             body.estado ?? null,
      depoimento:         body.depoimento,
      resultado_destaque: body.resultado_destaque ?? null,
      instagram:          body.instagram ?? null,
      aprovado:           false,
      exibir_landing:     body.exibir_landing === true,
    })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
