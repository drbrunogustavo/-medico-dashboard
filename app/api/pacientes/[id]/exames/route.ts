import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id }   = params
  const body     = await req.json() as Record<string, string>
  const supabase = createSupabaseServiceClient()

  if (!body.nome?.trim() || !body.valor?.trim())
    return NextResponse.json({ error: "nome e valor são obrigatórios" }, { status: 400 })

  try {
    const { data, error } = await supabase
      .from("paciente_exames")
      .insert({
        user_id:    auth.userId,
        paciente_id: id,
        nome:        body.nome.trim(),
        valor:       body.valor.trim(),
        unidade:     body.unidade   || null,
        referencia:  body.referencia || null,
        tendencia:   body.tendencia  || null,
        data_coleta: body.data_coleta || null,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/pacientes/[id]/exames POST]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .eq("user_id", auth.userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/pacientes/[id]/exames DELETE]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
