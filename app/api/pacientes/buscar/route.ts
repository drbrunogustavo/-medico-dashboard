import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { getAnthropicClient } from "@/lib/anthropic"

const ALLOWED_METRIC_FIELDS = ["peso", "altura", "circunferencia_ab"] as const
type MetricField = (typeof ALLOWED_METRIC_FIELDS)[number]

interface SearchPlan {
  strategy: "historico_text" | "patient_metric" | "inactivity" | "exam_text" | "combined"
  fulltext?: string
  metric?: { field: MetricField; op: "gt" | "lt" | "gte" | "lte" | "eq"; value: number }
  inactivity_days?: number
  exam_name?: string
  explanation: string
}

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as { query?: string }
  const query = body.query?.trim()
  if (!query) return NextResponse.json({ patients: [], explanation: "" })

  const anthropic = getAnthropicClient()
  const planMsg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Você é um assistente de busca clínica. Interprete esta query em linguagem natural e retorne APENAS JSON.

Query: "${query}"

Campos disponíveis:
- pacientes_local: peso (kg), altura (cm), circunferencia_ab (cm), sexo
- copiloto_historico: relato (texto livre de consultas)
- paciente_exames: nome do exame (ex: "HbA1c", "Glicemia"), valor (texto)

Estratégias:
- "historico_text": busca por termo livre no texto das consultas (relato)
- "patient_metric": filtra pacientes por campo numérico com operador
- "inactivity": pacientes sem consulta há N dias
- "exam_text": busca por nome de exame em paciente_exames
- "combined": combina strategies acima

Retorne JSON:
{
  "strategy": "historico_text|patient_metric|inactivity|exam_text|combined",
  "fulltext": "termo para busca em relato (se aplicável)",
  "metric": {"field": "peso|altura|circunferencia_ab", "op": "gt|lt|gte|lte|eq", "value": número},
  "inactivity_days": número,
  "exam_name": "nome do exame (se aplicável)",
  "explanation": "frase curta descrevendo o filtro aplicado"
}`,
    }],
  })

  const rawText = planMsg.content.find(b => b.type === "text")?.text ?? "{}"
  let plan: SearchPlan
  try {
    plan = JSON.parse(rawText) as SearchPlan
  } catch {
    return NextResponse.json({ patients: [], explanation: "Não foi possível interpretar a busca." })
  }

  const supabase = createSupabaseServiceClient()
  const patientIds = new Set<string>()
  const matchContext: Record<string, string> = {}

  // ── historico_text ──────────────────────────────────────────────────────────
  if (
    (plan.strategy === "historico_text" || plan.strategy === "combined") &&
    plan.fulltext
  ) {
    const term = plan.fulltext
    const { data: hRows } = await supabase
      .from("copiloto_historico")
      .select("paciente_nome")
      .eq("user_id", auth.userId)
      .ilike("relato", `%${term}%`)
      .limit(60)

    if (hRows?.length) {
      const nomes = Array.from(new Set(hRows.map(r => r.paciente_nome).filter(Boolean))) as string[]
      const { data: pacs } = await supabase
        .from("pacientes_local")
        .select("id, nome")
        .eq("user_id", auth.userId)
        .in("nome", nomes)
      pacs?.forEach(p => {
        patientIds.add(p.id)
        matchContext[p.id] = matchContext[p.id] ?? `Mencionado em consulta: "${term}"`
      })
    }
  }

  // ── patient_metric ──────────────────────────────────────────────────────────
  if (
    (plan.strategy === "patient_metric" || plan.strategy === "combined") &&
    plan.metric
  ) {
    const { field, op, value } = plan.metric
    if ((ALLOWED_METRIC_FIELDS as readonly string[]).includes(field)) {
      let q = supabase
        .from("pacientes_local")
        .select("id, nome")
        .eq("user_id", auth.userId)
        .not(field, "is", null)
      if (op === "gt")  q = q.gt(field, value)
      if (op === "gte") q = q.gte(field, value)
      if (op === "lt")  q = q.lt(field, value)
      if (op === "lte") q = q.lte(field, value)
      if (op === "eq")  q = q.eq(field, value)
      const { data: pacs } = await q.limit(50)
      pacs?.forEach(p => {
        patientIds.add(p.id)
        const opLabel: Record<string, string> = { gt: ">", gte: "≥", lt: "<", lte: "≤", eq: "=" }
        matchContext[p.id] = matchContext[p.id] ?? `${field} ${opLabel[op] ?? op} ${value}`
      })
    }
  }

  // ── inactivity ──────────────────────────────────────────────────────────────
  if (
    (plan.strategy === "inactivity" || plan.strategy === "combined") &&
    plan.inactivity_days
  ) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - plan.inactivity_days)

    const { data: allPacs } = await supabase
      .from("pacientes_local")
      .select("id, nome")
      .eq("user_id", auth.userId)

    const { data: latestConsultas } = await supabase
      .from("copiloto_historico")
      .select("paciente_nome, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })

    const latestByNome: Record<string, Date> = {}
    latestConsultas?.forEach(c => {
      if (c.paciente_nome && !latestByNome[c.paciente_nome]) {
        latestByNome[c.paciente_nome] = new Date(c.created_at)
      }
    })

    allPacs?.forEach(p => {
      const last = latestByNome[p.nome]
      if (!last || last < cutoff) {
        patientIds.add(p.id)
        const days = last
          ? Math.floor((Date.now() - last.getTime()) / 86_400_000)
          : null
        matchContext[p.id] = matchContext[p.id] ??
          (days ? `Inativo há ${days} dias` : "Sem consultas registradas")
      }
    })
  }

  // ── exam_text ───────────────────────────────────────────────────────────────
  if (
    (plan.strategy === "exam_text" || plan.strategy === "combined") &&
    plan.exam_name
  ) {
    const examTerm = plan.exam_name
    const { data: exames } = await supabase
      .from("paciente_exames")
      .select("paciente_id, nome, valor")
      .eq("user_id", auth.userId)
      .ilike("nome", `%${examTerm}%`)
      .limit(60)

    exames?.forEach(e => {
      if (!e.paciente_id) return
      patientIds.add(e.paciente_id as string)
      matchContext[e.paciente_id as string] =
        matchContext[e.paciente_id as string] ?? `Exame: ${e.nome} = ${e.valor}`
    })
  }

  if (patientIds.size === 0) {
    return NextResponse.json({ patients: [], explanation: plan.explanation })
  }

  const { data: patients } = await supabase
    .from("pacientes_local")
    .select("id, nome, telefone, peso, altura, data_nascimento, sexo")
    .eq("user_id", auth.userId)
    .in("id", Array.from(patientIds))
    .limit(30)

  return NextResponse.json({
    patients: (patients ?? []).map(p => ({
      ...p,
      _fonte: "local",
      _matchContext: matchContext[p.id] ?? "",
    })),
    explanation: plan.explanation,
  })
}
