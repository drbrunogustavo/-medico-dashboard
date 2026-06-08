import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { searchParams } = req.nextUrl
  const unidade = searchParams.get("unidade") ?? undefined
  const inicio  = searchParams.get("inicio")  ?? undefined
  const fim     = searchParams.get("fim")     ?? undefined

  try {
    const supabase = createSupabaseServerClient()
    let query      = supabase
      .from("financeiro_lancamentos")
      .select("*")
      .order("data", { ascending: false })

    if (unidade) query = query.eq("unidade", unidade)
    if (inicio)  query = query.gte("data", inicio)
    if (fim)     query = query.lte("data", fim)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body     = await req.json()
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("financeiro_lancamentos")
      .insert({ ...body, user_id: auth.userId })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from("financeiro_lancamentos")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
