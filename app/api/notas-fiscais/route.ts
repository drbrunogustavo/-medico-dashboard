import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET(_req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const [notasResult, configResult] = await Promise.all([
      supabase
        .from("notas_fiscais")
        .select("*")
        .eq("user_id", auth.userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("configuracao_fiscal")
        .select("*")
        .eq("user_id", auth.userId)
        .maybeSingle(),
    ])
    return NextResponse.json({
      notas:  notasResult.data  ?? [],
      config: configResult.data ?? {},
    })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as {
    paciente_nome?:    string
    paciente_cpf?:     string
    valor?:            number
    descricao_servico?: string
    lancamento_id?:    string
  }

  if (!body.paciente_nome?.trim() || !body.valor || body.valor <= 0) {
    return NextResponse.json({ error: "paciente_nome e valor são obrigatórios" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("notas_fiscais")
      .insert({
        user_id:           auth.userId,
        paciente_nome:     body.paciente_nome.trim(),
        paciente_cpf:      body.paciente_cpf?.trim()       || null,
        valor:             body.valor,
        descricao_servico: body.descricao_servico?.trim()  || "Consulta médica",
        lancamento_id:     body.lancamento_id              || null,
        status:            "pendente",
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ nota: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as {
    cnpj?:               string
    razao_social?:       string
    inscricao_municipal?: string
    regime_tributario?:  string
    api_key_emissor?:    string
    ativo?:              boolean
  }

  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from("configuracao_fiscal")
      .upsert({ user_id: auth.userId, ...body })
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
