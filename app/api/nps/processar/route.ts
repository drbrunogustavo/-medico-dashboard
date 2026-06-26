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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://praxisplataforma.com.br"

  try {
    const supabase = createSupabaseServerClient()
    const now = new Date().toISOString()

    let q = supabase
      .from("nps_pesquisas")
      .select("id, paciente_nome, paciente_telefone, token, user_id")
      .lte("agendado_para", now)
      .eq("status", "pendente")
    if (userId) q = q.eq("user_id", userId)

    const { data, error } = await q
    if (error) throw new Error(error.message)
    if (!data?.length) return NextResponse.json({ enviados: 0 })

    let enviados = 0
    for (const row of data) {
      const link = `${appUrl}/nps/${row.token}`
      const msg  = `Olá, ${row.paciente_nome}! 👋\n\nSua opinião é muito importante para nós.\nComo foi sua última consulta com o médico usuário?\n\nResponda em menos de 1 minuto: ${link}\n\nObrigado pela confiança! 🙏`
      const { ok } = await sendZapiForUser(row.user_id as string, row.paciente_telefone, msg)
      if (ok) {
        await supabase
          .from("nps_pesquisas")
          .update({ status: "enviado" })
          .eq("id", row.id)
        enviados++
      }
    }

    return NextResponse.json({ enviados })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
