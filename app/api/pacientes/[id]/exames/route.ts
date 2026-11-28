import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { originGuard } from "@/lib/check-origin"

const TENDENCIAS = ["up", "down", "stable"]

function opcional(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originErr = originGuard(req)
  if (originErr) return originErr

  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = await params
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const nome  = opcional(body?.nome, 120)
  const valor = opcional(body?.valor, 60)
  if (!nome || !valor)
    return NextResponse.json({ error: "nome e valor são obrigatórios" }, { status: 400 })

  const tendencia = body?.tendencia
  if (tendencia !== undefined && tendencia !== null && tendencia !== "" && !(typeof tendencia === "string" && TENDENCIAS.includes(tendencia)))
    return NextResponse.json({ error: "Tendência inválida." }, { status: 400 })

  const coleta = opcional(body?.data_coleta, 10)
  if (coleta && !(/^\d{4}-\d{2}-\d{2}$/.test(coleta) && !Number.isNaN(Date.parse(coleta))))
    return NextResponse.json({ error: "Data de coleta inválida." }, { status: 400 })

  const supabase = createSupabaseServiceClient()

  try {
    // O exame só entra em ficha de paciente que pertence a quem está logado.
    const { data: pac, error: pacErr } = await supabase
      .from("pacientes_local").select("id").eq("id", id).eq("user_id", auth.userId).maybeSingle()
    if (pacErr) throw new Error(pacErr.message)
    if (!pac) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })

    const { data, error } = await supabase
      .from("paciente_exames")
      .insert({
        user_id:     auth.userId,
        paciente_id: id,
        nome,
        valor,
        unidade:     opcional(body?.unidade, 30),
        referencia:  opcional(body?.referencia, 80),
        tendencia:   typeof tendencia === "string" && tendencia ? tendencia : null,
        data_coleta: coleta,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/pacientes/[id]/exames POST]", e)
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originErr = originGuard(req)
  if (originErr) return originErr

  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const exameId = req.nextUrl.searchParams.get("exameId")
  if (!exameId) return NextResponse.json({ error: "exameId obrigatório" }, { status: 400 })

  const supabase = createSupabaseServiceClient()

  try {
    const { error } = await supabase
      .from("paciente_exames")
      .delete()
      .eq("id", exameId)
      .eq("paciente_id", (await params).id)
      .eq("user_id", auth.userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/pacientes/[id]/exames DELETE]", e)
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}
