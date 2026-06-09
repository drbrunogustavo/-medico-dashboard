import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const leadId = req.nextUrl.searchParams.get("lead_id")

  try {
    const supabase = createSupabaseServerClient()
    let q = supabase
      .from("nurturing_sequencias")
      .select("id, lead_id, dia, mensagem, status, agendado_para, enviado_em")
      .eq("user_id", auth.userId)
      .order("dia", { ascending: true })

    if (leadId) q = q.eq("lead_id", leadId)

    const { data, error } = await q
    if (error) throw new Error(error.message)
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
