import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET(_req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("nps_pesquisas")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { paciente_nome, paciente_telefone, agendado_para } = await req.json() as {
    paciente_nome: string; paciente_telefone: string; agendado_para?: string
  }
  if (!paciente_nome?.trim() || !paciente_telefone?.trim()) {
    return NextResponse.json({ error: "nome e telefone obrigatórios" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServerClient()
    const at = agendado_para ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from("nps_pesquisas")
      .insert({ user_id: auth.userId, paciente_nome, paciente_telefone, agendado_para: at })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
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
      .from("nps_pesquisas")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
