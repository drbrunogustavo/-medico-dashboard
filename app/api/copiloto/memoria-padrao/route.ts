import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 20

interface Chip {
  tipo:  "exame" | "medicamento" | "diagnostico"
  texto: string
}

interface HistoricoResultado {
  exames_solicitados?: string[]
  plano?:              string
  resumo?:             string
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { paciente_nome } = await req.json() as { paciente_nome?: string }
  if (!paciente_nome?.trim()) return NextResponse.json({ chips: [] })

  const supabase = createSupabaseServerClient()
  const { data: historico } = await supabase
    .from("copiloto_historico")
    .select("resultado, created_at")
    .eq("user_id", auth.userId)
    .ilike("paciente_nome", paciente_nome.trim())
    .order("created_at", { ascending: false })
    .limit(5)

  if (!historico || historico.length < 2) return NextResponse.json({ chips: [] })

  // Aggregate exams from all consultations
  const examesCounts: Record<string, number> = {}
  const planos: string[] = []
  const resumos: string[] = []

  for (const h of historico) {
    const r = h.resultado as HistoricoResultado | null
    if (!r) continue
    for (const e of r.exames_solicitados ?? []) {
      const key = e.trim()
      if (key) examesCounts[key] = (examesCounts[key] ?? 0) + 1
    }
    if (r.plano) planos.push(r.plano)
    if (r.resumo) resumos.push(r.resumo.slice(0, 300))
  }

  // Exams that appear in ≥2 of the last 5 consultations
  const examesRecorrentes = Object.entries(examesCounts)
    .filter(([, n]) => n >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([e]) => e)

  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Você é um assistente clínico. Analise os dados de ${historico.length} atendimentos anteriores deste paciente e identifique padrões recorrentes.

EXAMES RECORRENTES (apareceram em ≥2 consultas): ${examesRecorrentes.join(", ") || "nenhum identificado"}

TRECHOS DO PLANO TERAPÊUTICO:
${planos.slice(0, 3).map((p, i) => `Consulta ${i + 1}: ${p.slice(0, 200)}`).join("\n")}

Retorne APENAS um JSON com chips acionáveis. Máximo 6 chips totais:
{
  "chips": [
    {"tipo": "exame", "texto": "TSH, Ferritina, Vitamina D — adicionar a exames?"},
    {"tipo": "medicamento", "texto": "Metformina 500mg — medicamento recorrente"},
    {"tipo": "diagnostico", "texto": "Resistência insulínica — diagnóstico recorrente"}
  ]
}

Regras:
- tipo "exame": apenas se examesRecorrentes não estiver vazio; agrupe em 1-2 chips
- tipo "medicamento": apenas se identificar medicamento em ≥2 planos
- tipo "diagnostico": apenas se identificar condição em ≥2 resumos
- Se não houver padrão claro, retorne {"chips": []}
- Textos curtos (≤ 10 palavras), acionáveis, no imperativo ou afirmativos`,
    }],
  })

  const raw = msg.content.find(b => b.type === "text")?.text ?? "{}"
  let chips: Chip[] = []
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const parsed  = JSON.parse(cleaned) as { chips?: Chip[] }
    chips = (parsed.chips ?? []).filter(
      (c): c is Chip =>
        ["exame","medicamento","diagnostico"].includes(c.tipo) &&
        typeof c.texto === "string" && c.texto.length > 0
    ).slice(0, 6)
  } catch { /* retorna vazio */ }

  return NextResponse.json({ chips })
}
