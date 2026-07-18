import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const mes = Number(req.nextUrl.searchParams.get("mes"))
  const ano = Number(req.nextUrl.searchParams.get("ano"))
  if (!mes || !ano) {
    return NextResponse.json({ error: "mes e ano obrigatórios" }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("calendario_posts")
    .select("*")
    .eq("user_id", auth.userId)
    .eq("mes", mes)
    .eq("ano", ano)
    .order("dia", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  let body: { mes: number; ano: number; posts: Record<string, unknown>[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 })
  }

  const { mes, ano, posts } = body
  if (!mes || !ano || !Array.isArray(posts)) {
    return NextResponse.json({ error: "mes, ano e posts obrigatórios" }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()

  const { error: delError } = await supabase
    .from("calendario_posts")
    .delete()
    .eq("user_id", auth.userId)
    .eq("mes", mes)
    .eq("ano", ano)

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  const rows = posts.map(p => ({ ...p, user_id: auth.userId, mes, ano }))
  const { data, error: insError } = await supabase
    .from("calendario_posts")
    .insert(rows)
    .select("id")

  if (insError) return NextResponse.json({ error: insError.message }, { status: 500 })
  return NextResponse.json({ count: data?.length ?? 0 })
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  let body: { id: string; publicado: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 })
  }

  const { id, publicado } = body
  if (!id || publicado === undefined) {
    return NextResponse.json({ error: "id e publicado obrigatórios" }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("calendario_posts")
    .update({ publicado })
    .eq("id", id)
    .eq("user_id", auth.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
