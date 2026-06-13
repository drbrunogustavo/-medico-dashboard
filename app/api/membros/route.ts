import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("equipe_membros")
    .select("*")
    .eq("owner_id", auth.userId)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as {
    nome: string
    email: string
    cargo: string
    perfil: string
  }

  if (!body.nome || !body.email || !body.cargo || !body.perfil) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, email, cargo, perfil" }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("equipe_membros")
    .insert({
      owner_id: auth.userId,
      nome:     body.nome,
      email:    body.email,
      cargo:    body.cargo,
      perfil:   body.perfil,
      ativo:    true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este e-mail já está na sua equipe." }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
