import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { isAdmin } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const filtro = new URL(req.url).searchParams.get("status") ?? "pendente"
  const supabase = createSupabaseServiceClient()
  let query = supabase
    .from("anuncios_cursos")
    .select("id, created_at, titulo, chamada, link_destino, anunciante_nome, anunciante_foto_url, contato_email, contato_telefone, periodo_dias, data_inicio, data_fim, status")
    .order("created_at", { ascending: false })

  if (filtro !== "all") query = query.eq("status", filtro)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json() as { id: string; status: string; data_inicio?: string; data_fim?: string }
  const { id, status, data_inicio, data_fim } = body
  if (!id || !status) return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 })

  const updates: Record<string, unknown> = { status }
  if (data_inicio) updates.data_inicio = data_inicio
  if (data_fim)    updates.data_fim    = data_fim

  const supabase = createSupabaseServiceClient()
  const { error } = await supabase.from("anuncios_cursos").update(updates).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const supabase = createSupabaseServiceClient()
  const { error } = await supabase.from("anuncios_cursos").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
