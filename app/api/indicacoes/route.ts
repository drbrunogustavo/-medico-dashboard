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
      .from("indicacoes")
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

  const { indicador_nome, indicador_telefone, indicado_nome, indicado_telefone } = await req.json() as {
    indicador_nome: string; indicador_telefone: string
    indicado_nome: string;  indicado_telefone: string
  }
  if (!indicador_nome || !indicador_telefone || !indicado_nome || !indicado_telefone) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("indicacoes")
      .insert({ user_id: auth.userId, indicador_nome, indicador_telefone, indicado_nome, indicado_telefone })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
