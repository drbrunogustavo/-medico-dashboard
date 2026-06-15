import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function err(e: unknown) { return e instanceof Error ? e.message : String(e) }

// GET — list entries (by tipo) or fetch copiloto_historico
export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const tipo = req.nextUrl.searchParams.get("tipo") ?? "all"
  const supabase = createSupabaseServerClient()

  try {
    if (tipo === "historico") {
      const { data, error } = await supabase
        .from("copiloto_historico")
        .select("id, paciente_nome, tipo_consulta, resultado, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data ?? [])
    }

    const q = supabase
      .from("memoria_clinica")
      .select("*")
      .eq("user_id", auth.userId)
      .order("criado_em", { ascending: false })

    if (tipo !== "all") q.eq("tipo", tipo)

    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 500 })
  }
}

// POST — create entry
export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json()
    const { tipo, titulo, conteudo, tags = [], favorito = false } = body as {
      tipo:      string
      titulo:    string
      conteudo:  string
      tags?:     string[]
      favorito?: boolean
    }

    if (!tipo || !titulo || !conteudo) {
      return NextResponse.json({ error: "tipo, titulo e conteudo obrigatórios" }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("memoria_clinica")
      .insert({ user_id: auth.userId, tipo, titulo, conteudo, tags, favorito })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 500 })
  }
}

// PATCH — update entry (favorito toggle, conteudo, titulo)
export async function PATCH(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as { id: string; [k: string]: unknown }
    const { id, ...fields } = body

    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("memoria_clinica")
      .update(fields)
      .eq("id", id)
      .eq("user_id", auth.userId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 500 })
  }
}

// DELETE — remove entry
export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from("memoria_clinica")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: err(e) }, { status: 500 })
  }
}
