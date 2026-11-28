import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { originGuard } from "@/lib/check-origin"
import { escapeLike } from "@/lib/like"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = await params
  const supabase = createSupabaseServiceClient()

  try {
    const { data: pac, error } = await supabase
      .from("pacientes_local")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .maybeSingle()
    if (error) {
      console.error("[api/pacientes/[id] GET]", error.message)
      return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
    }
    if (!pac) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })

    const [{ data: exames }, { data: historico }] = await Promise.all([
      supabase
        .from("paciente_exames")
        .select("*")
        .eq("paciente_id", id)
        .eq("user_id", auth.userId)
        // Sem isso o Postgres põe no topo os exames sem data de coleta, que encheriam os 20 do limite.
        .order("data_coleta", { ascending: false, nullsFirst: false })
        .order("criado_em", { ascending: false })
        .limit(20),
      supabase
        .from("copiloto_historico")
        .select("id,tipo_consulta,relato,resultado,created_at")
        .eq("user_id", auth.userId)
        .ilike("paciente_nome", escapeLike(String(pac.nome ?? "")))
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

const SEXOS = ["M", "F", "outro"]

function numeroNaFaixa(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : NaN
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : null
}

function texto(v: unknown, max: number): string | null {
  return typeof v === "string" ? v.slice(0, max) : null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originErr = originGuard(req)
  if (originErr) return originErr

  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = await params
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Corpo inválido" }, { status: 400 })

  const updates: Record<string, unknown> = {}
  const invalido = (campo: string) => NextResponse.json({ error: `Valor inválido para ${campo}.` }, { status: 400 })

  if ("peso" in body)              { const v = numeroNaFaixa(body.peso, 1, 500);   if (v === null) return invalido("peso");              updates.peso = v }
  if ("altura" in body)            { const v = numeroNaFaixa(body.altura, 30, 260); if (v === null) return invalido("altura");            updates.altura = v }
  if ("circunferencia_ab" in body) { const v = numeroNaFaixa(body.circunferencia_ab, 20, 300); if (v === null) return invalido("circunferência abdominal"); updates.circunferencia_ab = v }
  if ("medicamentos" in body) {
    const m = body.medicamentos
    if (!Array.isArray(m) || m.length > 60 || m.some(x => typeof x !== "string" || x.length > 200)) return invalido("medicamentos")
    updates.medicamentos = (m as string[]).map(x => x.trim()).filter(Boolean)
  }
  if ("pendencias" in body)       { const v = texto(body.pendencias, 4000);       if (v === null) return invalido("pendências");       updates.pendencias = v }
  if ("protocolo_ativo" in body)  { const v = texto(body.protocolo_ativo, 4000);  if (v === null) return invalido("protocolo ativo");  updates.protocolo_ativo = v }
  if ("sexo" in body) {
    if (body.sexo !== null && !(typeof body.sexo === "string" && SEXOS.includes(body.sexo))) return invalido("sexo")
    updates.sexo = body.sexo
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
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/pacientes/[id] PATCH]", e)
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}
