import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "token obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase
      .from("nps_pesquisas")
      .select("id, paciente_nome, status, nota, respondido_em")
      .eq("token", token)
      .single()
    if (error || !data) return NextResponse.json({ error: "Pesquisa não encontrada" }, { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { token, nota, comentario } = await req.json() as {
    token: string; nota: number; comentario?: string
  }
  if (!token || nota === undefined || nota < 0 || nota > 10) {
    return NextResponse.json({ error: "token e nota (0-10) obrigatórios" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServiceClient()

    const { data: pesquisa } = await supabase
      .from("nps_pesquisas")
      .select("id, status")
      .eq("token", token)
      .single()

    if (!pesquisa) return NextResponse.json({ error: "Pesquisa não encontrada" }, { status: 404 })
    if (pesquisa.status === "respondido") return NextResponse.json({ error: "Já respondida" }, { status: 409 })

    const { error } = await supabase
      .from("nps_pesquisas")
      .update({ nota, comentario: comentario ?? null, status: "respondido", respondido_em: new Date().toISOString() })
      .eq("id", pesquisa.id)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true, nota })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
