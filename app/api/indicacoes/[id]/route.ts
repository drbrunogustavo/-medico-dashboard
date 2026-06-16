import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { sendZapi } from "@/lib/zapi"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as Record<string, unknown>
  const { id } = params

  try {
    const supabase = createSupabaseServerClient()

    const { data: current } = await supabase
      .from("indicacoes")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single()
    if (!current) return NextResponse.json({ error: "Indicação não encontrada" }, { status: 404 })

    const updates: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cur = current as any

    // Se confirmando consulta do indicado → gera cortesia
    if (body.consulta_indicado_realizada === true && !cur.consulta_indicado_realizada) {
      updates.cortesia_gerada = true
      updates.status = "cortesia_gerada"

      // Envia WhatsApp para o indicador
      const msg = `Olá, ${cur.indicador_nome}! 🎉\n\nSua indicação de ${cur.indicado_nome} realizou a consulta com o médico usuário.\n\nComo prometido, sua próxima consulta conosco será cortesia. 🙏\n\nObrigado pela confiança!\n— o médico usuário`
      sendZapi(cur.indicador_telefone, msg).catch(console.error)
    }

    if (body.cortesia_usada === true && !cur.cortesia_usada) {
      updates.status = "cortesia_usada"
    }

    const { data, error } = await supabase
      .from("indicacoes")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from("indicacoes")
      .delete()
      .eq("id", params.id)
      .eq("user_id", auth.userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
