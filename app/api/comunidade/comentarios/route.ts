import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const postId = new URL(req.url).searchParams.get("post_id")
  if (!postId) return NextResponse.json({ error: "post_id obrigatório" }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("comunidade_comentarios")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comentarios: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { post_id, conteudo } = await req.json() as { post_id?: string; conteudo?: string }
  if (!post_id || !conteudo?.trim()) {
    return NextResponse.json({ error: "post_id e conteudo obrigatórios" }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("user_id", auth.userId)
    .maybeSingle()

  const autorNome = (perfil?.nome as string | null) ?? "Médico"

  const { data, error } = await supabase
    .from("comunidade_comentarios")
    .insert({ post_id, user_id: auth.userId, autor_nome: autorNome, conteudo: conteudo.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comentario: data })
}
