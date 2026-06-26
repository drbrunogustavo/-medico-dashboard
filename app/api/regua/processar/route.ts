import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { sendZapiForUser } from "@/lib/zapi"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret")
  let userId: string | undefined

  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    userId = undefined
  } else {
    const auth = await checkAuth()
    if (!auth.authenticated) return auth.response
    userId = auth.userId
  }

  try {
    const supabase = createSupabaseServerClient()
    const now = new Date().toISOString()

    let q = supabase
      .from("regua_relacionamento")
      .select("id, paciente_nome, paciente_telefone, mensagem, user_id")
      .lte("agendado_para", now)
      .eq("status", "pendente")
      .eq("pausado", false)
    if (userId) q = q.eq("user_id", userId)

    const { data, error } = await q
    if (error) throw new Error(error.message)
    if (!data?.length) return NextResponse.json({ enviados: 0 })

    let enviados = 0
    for (const row of data) {
      const { ok } = await sendZapiForUser(row.user_id as string, row.paciente_telefone, row.mensagem)
      if (ok) {
        await supabase
          .from("regua_relacionamento")
          .update({ status: "enviado", enviado_em: new Date().toISOString() })
          .eq("id", row.id)
        enviados++
      }
    }

    return NextResponse.json({ enviados })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

// POST: enviar agora (manual)
export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("regua_relacionamento")
      .select("paciente_telefone, mensagem")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single()
    if (error || !data) throw new Error("Mensagem não encontrada")

    const { ok, error: zapiErr } = await sendZapiForUser(auth.userId, data.paciente_telefone, data.mensagem)
    if (!ok) throw new Error(zapiErr ?? "Erro ao enviar")

    await supabase
      .from("regua_relacionamento")
      .update({ status: "enviado", enviado_em: new Date().toISOString() })
      .eq("id", id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
