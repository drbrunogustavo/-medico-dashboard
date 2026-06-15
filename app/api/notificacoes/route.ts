import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

// ── GET — list notifications ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const url    = new URL(req.url)
  const limit  = Number(url.searchParams.get("limit")  ?? 50)
  const soNaoLidas = url.searchParams.get("nao_lidas") === "true"

  try {
    const supabase = createSupabaseServerClient()
    let q = supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (soNaoLidas) q = q.eq("lida", false)

    const { data, error } = await q
    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Erro ao buscar notificações: ${msg}` }, { status: 500 })
  }
}

// ── POST — create notification (internal / system) ────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as {
      titulo:   string
      mensagem: string
      tipo?:    string
      link?:    string
      user_id?: string
    }

    if (!body.titulo || !body.mensagem) {
      return NextResponse.json({ error: "titulo e mensagem são obrigatórios." }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("notificacoes")
      .insert({
        user_id:  body.user_id ?? auth.userId,
        titulo:   body.titulo,
        mensagem: body.mensagem,
        tipo:     body.tipo ?? "info",
        link:     body.link ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Erro ao criar notificação: ${msg}` }, { status: 500 })
  }
}

// ── PATCH — mark as read (one or all) ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as { id?: string; todas?: boolean }
    const supabase = createSupabaseServerClient()

    if (body.todas) {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("user_id", auth.userId)
        .eq("lida", false)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (!body.id) {
      return NextResponse.json({ error: "id ou todas são obrigatórios." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("id", body.id)
      .eq("user_id", auth.userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Erro ao atualizar notificação: ${msg}` }, { status: 500 })
  }
}

// ── DELETE — delete a notification ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const url = new URL(req.url)
    const id  = url.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id é obrigatório." }, { status: 400 })

    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from("notificacoes")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Erro ao deletar notificação: ${msg}` }, { status: 500 })
  }
}
