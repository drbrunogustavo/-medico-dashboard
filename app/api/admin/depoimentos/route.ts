import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function isAdmin(userId: string) {
  return !!process.env.DOCTOR_USER_ID && userId === process.env.DOCTOR_USER_ID
}

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const filtro = new URL(req.url).searchParams.get("aprovado") // "true" | "false" | "all"
  const supabase = createSupabaseServerClient()
  let query = supabase
    .from("depoimentos_publicos")
    .select("id, nome, crm, especialidade, cidade, estado, depoimento, resultado_destaque, instagram, aprovado, exibir_landing, created_at")
    .order("created_at", { ascending: false })

  if (filtro === "true")       query = query.eq("aprovado", true)
  else if (filtro !== "all")   query = query.eq("aprovado", false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id, aprovado } = await req.json() as { id: string; aprovado: boolean }
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("depoimentos_publicos")
    .update({ aprovado })
    .eq("id", id)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from("depoimentos_publicos").delete().eq("id", id)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
