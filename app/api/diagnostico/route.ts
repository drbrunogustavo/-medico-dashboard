import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as {
      respostas: Record<string, number>
      scores:    Record<string, number>
      score_geral: number
    }

    const resp = await ai.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 3000,
      system: `Você é o Consultor Estratégico do PRAXIS. Analise o diagnóstico de uma clínica médica e gere um plano de ação prático e específico. Responda em português brasileiro. Retorne JSON puro.`,
      messages: [{
        role: "user",
        content: `Analise o diagnóstico desta clínica:

SCORE GERAL: ${body.score_geral}/100

SCORES POR DIMENSÃO:
${Object.entries(body.scores).map(([k, v]) => `- ${k}: ${v}/100`).join("\n")}

Gere um plano de ação. Retorne JSON com EXATAMENTE esta estrutura:
{
  "classificacao": "Clínica Iniciante|Em Crescimento|Estruturada|Premium|Referência",
  "resumo_diagnostico": "Parágrafo de 3-4 frases resumindo o diagnóstico",
  "top3_prioridades": [
    { "prioridade": 1, "titulo": "Título curto", "descricao": "O que fazer e por quê", "impacto": "Alto|Médio" }
  ],
  "plano_90_dias": {
    "mes1": [
      { "semana": "Semana 1-2", "acao": "Ação específica" }
    ],
    "mes2": [
      { "semana": "Semana 5-6", "acao": "Ação específica" }
    ],
    "mes3": [
      { "semana": "Semana 9-10", "acao": "Ação específica" }
    ]
  },
  "quick_wins": ["Ação que pode ser feita esta semana com resultado rápido"]
}`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx   = clean.indexOf("{")
    const plano = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)

    // Save
    try {
      const supabase = createSupabaseServerClient()
      await supabase.from("diagnosticos").insert({
        user_id:       auth.userId,
        respostas:     body.respostas,
        scores:        body.scores,
        score_geral:   body.score_geral,
        classificacao: plano.classificacao,
        plano_acao:    plano,
      })
    } catch { /* non-critical */ }

    return NextResponse.json(plano)
  } catch (e) {
    console.error("[api/diagnostico]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
