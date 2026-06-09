import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const mesAno = req.nextUrl.searchParams.get("mes_ano") ?? mesAtual()

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("metas_mensais")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("mes_ano", mesAno)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? { mes_ano: mesAno })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body     = await req.json()
    const mesAno   = body.mes_ano ?? mesAtual()
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("metas_mensais")
      .upsert({ ...body, mes_ano: mesAno, user_id: auth.userId }, { onConflict: "user_id,mes_ano" })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
