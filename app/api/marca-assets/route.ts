import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("marca_assets")
    .select("id, arquivo_url, nome_arquivo, tamanho_bytes, criado_em")
    .eq("user_id", auth.userId)
    .eq("tipo", "imagem")
    .order("criado_em", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const supabase = createSupabaseServerClient()
  const body = await req.json() as { arquivo_url: string; nome_arquivo?: string; tamanho_bytes?: number }
  if (!body.arquivo_url) return NextResponse.json({ error: "arquivo_url obrigatório" }, { status: 400 })
  const { data, error } = await supabase
    .from("marca_assets")
    .insert({
      user_id:       auth.userId,
      tipo:          "imagem",
      arquivo_url:   body.arquivo_url,
      nome_arquivo:  body.nome_arquivo  ?? null,
      tamanho_bytes: body.tamanho_bytes ?? null,
    })
    .select("id, arquivo_url, nome_arquivo, tamanho_bytes, criado_em")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
