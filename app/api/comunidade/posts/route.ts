import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const CATEGORIAS_VALIDAS = ["protocolo", "caso_clinico", "experiencia", "duvida", "resultado", "geral"]

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()

  const { data: posts, error } = await supabase
    .from("comunidade_posts")
    .select("*")
    .order("fixado", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch which posts the current user liked
  const { data: meusLikes } = await supabase
    .from("comunidade_likes")
    .select("post_id")
    .eq("user_id", auth.userId)

  const likedSet = new Set((meusLikes ?? []).map(l => l.post_id as string))

  const postsComLike = (posts ?? []).map(p => ({
    ...p,
    meu_like: likedSet.has(p.id as string),
  }))

  return NextResponse.json({ posts: postsComLike })
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { titulo, conteudo, categoria } = await req.json() as {
    titulo?:    string
    conteudo?:  string
    categoria?: string
  }

  if (!titulo?.trim() || !conteudo?.trim()) {
    return NextResponse.json({ error: "titulo e conteudo obrigatórios" }, { status: 400 })
  }
  const cat = CATEGORIAS_VALIDAS.includes(categoria ?? "") ? (categoria ?? "geral") : "geral"

  const supabase = createSupabaseServerClient()

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("user_id", auth.userId)
    .maybeSingle()

  const autorNome = (perfil?.nome as string | null) ?? "Médico"

  const { data, error } = await supabase
    .from("comunidade_posts")
    .insert({
      user_id:    auth.userId,
      autor_nome: autorNome,
      titulo:     titulo.trim(),
      conteudo:   conteudo.trim(),
      categoria:  cat,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ post: { ...data, meu_like: false } })
}
