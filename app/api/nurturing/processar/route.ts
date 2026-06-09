import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { sendZapi } from "@/lib/zapi"

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
      .from("nurturing_sequencias")
      .select("id, lead_id, mensagem, user_id")
      .lte("agendado_para", now)
      .eq("status", "pendente")
    if (userId) q = q.eq("user_id", userId)

    const { data: seqs, error } = await q
    if (error) throw new Error(error.message)
    if (!seqs?.length) return NextResponse.json({ enviados: 0 })

    let enviados = 0
    for (const seq of seqs) {
      const { data: lead } = await supabase
        .from("crm_leads")
        .select("telefone")
        .eq("id", seq.lead_id)
        .single()
      if (!lead?.telefone) continue

      const { ok } = await sendZapi(lead.telefone, seq.mensagem)
      if (ok) {
        await supabase
          .from("nurturing_sequencias")
          .update({ status: "enviado", enviado_em: new Date().toISOString() })
          .eq("id", seq.id)
        enviados++
      }
    }

    return NextResponse.json({ enviados })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
