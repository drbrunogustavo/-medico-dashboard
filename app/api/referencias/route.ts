import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const RELEVANCIAS = ["Alta", "Media", "Baixa"]

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined)

/** Aceita só os campos conhecidos, com tamanho limitado. Campos ausentes ficam de fora. */
function campos(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  const set = (k: string, v: unknown) => { if (v !== undefined) out[k] = v }
  set("nome", txt(body.nome, 120))
  set("especialidade", txt(body.especialidade, 60))
  set("instagram", txt(body.instagram, 60))
  set("seguidores", txt(body.seguidores, 20))
  set("frequencia", txt(body.frequencia, 30))
  set("nota", txt(body.nota, 1000))
  set("site", txt(body.site, 200))
  if (typeof body.relevancia === "string" && RELEVANCIAS.includes(body.relevancia)) out.relevancia = body.relevancia
  if (Array.isArray(body.temas)) out.temas = body.temas.map(t => txt(t, 40)).filter((t): t is string => !!t).slice(0, 12)
  return out
}

const lerJson = (request: NextRequest) => request.json().catch(() => null) as Promise<Record<string, unknown> | null>
const falha = (e: unknown, rota: string) => {
  console.error("[referencias] " + rota, e)
  return NextResponse.json({ error: "Não foi possível concluir a operação. Tente novamente." }, { status: 500 })
}

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("referencias")
    .select("*")
    .eq("user_id", auth.userId)
    .order("criada_em", { ascending: false })

  if (error) return falha(error, "GET")
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await lerJson(request)
  const dados = body ? campos(body) : {}
  if (!dados.nome) return NextResponse.json({ error: "Informe o nome." }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from("referencias").insert({ ...dados, user_id: auth.userId })
  if (error) return falha(error, "POST")
  return NextResponse.json({ success: true })
}

export async function PUT(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await lerJson(request)
  const id = typeof body?.id === "string" ? body.id : ""
  const dados = body ? campos(body) : {}
  if (!id) return NextResponse.json({ error: "Referência não informada." }, { status: 400 })
  if (Object.keys(dados).length === 0 || ("nome" in dados && !dados.nome)) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from("referencias").update(dados).eq("id", id).eq("user_id", auth.userId)
  if (error) return falha(error, "PUT")
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await lerJson(request)
  const id = typeof body?.id === "string" ? body.id : ""
  if (!id) return NextResponse.json({ error: "Referência não informada." }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from("referencias").delete().eq("id", id).eq("user_id", auth.userId)
  if (error) return falha(error, "DELETE")
  return NextResponse.json({ success: true })
}
