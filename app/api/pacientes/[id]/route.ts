import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = params
  const supabase = createSupabaseServiceClient()

  try {
    const { data: pac, error } = await supabase
      .from("pacientes_local")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single()
    if (error) {
      console.error("[api/pacientes/[id] GET]", error.message)
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })
    }

    const [{ data: exames }, { data: historico }] = await Promise.all([
      supabase
        .from("paciente_exames")
        .select("*")
        .eq("paciente_id", id)
        .eq("user_id", auth.userId)
        .order("data_coleta", { ascending: false })
        .limit(20),
      supabase
        .from("copiloto_historico")
        .select("id,tipo_consulta,relato,resultado,created_at")
        .eq("user_id", auth.userId)
        .ilike("paciente_nome", pac.nome)
        .order("created_at", { ascending: false })
        .limit(20),
    ])

    return NextResponse.json({
      paciente: pac,
      exames:   exames   ?? [],
      historico: historico ?? [],
    })
  } catch (e) {
    console.error("[api/pacientes/[id] GET]", e)
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}

const ALLOWED_PATCH = [
  "peso", "altura", "circunferencia_ab", "medicamentos",
  "pendencias", "protocolo_ativo", "sexo",
] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = params
  const body   = await req.json() as Record<string, unknown>

  const updates: Record<string, unknown> = {}
  for (const k of ALLOWED_PATCH) {
    if (k in body) updates[k] = body[k]
  }
  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Nenhum campo válido para atualizar" }, { status: 400 })

  const supabase = createSupabaseServiceClient()

  try {
    const { data, error } = await supabase
      .from("pacientes_local")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/pacientes/[id] PATCH]", e)
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}
