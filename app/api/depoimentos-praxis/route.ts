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

  if (error) { console.error("[depoimentos-praxis GET]", error.message); return NextResponse.json({ error: "Erro ao carregar depoimentos" }, { status: 500 }) }
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
  if (!body || !txt(body.nome, 120) || !txt(body.especialidade, 80) || txt(body.depoimento, 1200).length < 30) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("depoimentos_publicos")
    .insert({
      user_id:            auth.userId,
      nome:               txt(body.nome, 120),
      crm:                txt(body.crm, 40) || null,
      especialidade:      txt(body.especialidade, 80),
      cidade:             txt(body.cidade, 80) || null,
      estado:             txt(body.estado, 2) || null,
      depoimento:         txt(body.depoimento, 1200),
      resultado_destaque: txt(body.resultado_destaque, 160) || null,
      instagram:          txt(body.instagram, 60) || null,
      aprovado:           false,
      exibir_landing:     body.exibir_landing === true,
    })

  if (error) { console.error("[depoimentos-praxis POST]", error.message); return NextResponse.json({ error: "Erro ao salvar depoimento" }, { status: 500 }) }
  return NextResponse.json({ success: true })
}
