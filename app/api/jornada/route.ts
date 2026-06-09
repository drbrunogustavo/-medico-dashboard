import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as {
      etapas: {
        id:        string
        nome:      string
        canais:    string
        mensagens: string
        acoes:     string
        atritos:   string
      }[]
    }

    const resp = await ai.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: `Você é especialista em jornada do paciente e funis de aquisição para clínicas médicas no Brasil. Analise o mapa de jornada e identifique lacunas, oportunidades e sugira melhorias práticas. Retorne JSON puro.`,
      messages: [{
        role: "user",
        content: `Analise esta jornada do paciente e gere recomendações:

${body.etapas.map(e => `
ETAPA: ${e.nome}
- Canais: ${e.canais || "não definido"}
- Mensagens: ${e.mensagens || "não definido"}
- Ações automáticas: ${e.acoes || "não definido"}
- Pontos de atrito: ${e.atritos || "não identificado"}
`).join("\n")}

Retorne JSON:
{
  "pontos_cegos": ["Lacuna identificada na jornada"],
  "sugestoes_automacao": [
    { "etapa": "Nome da etapa", "sugestao": "Automação específica", "impacto": "Alto|Médio" }
  ],
  "jornada_ideal_diff": [
    { "etapa": "Nome", "situacao_atual": "Como está", "situacao_ideal": "Como deveria ser" }
  ],
  "prioridades": [
    { "prioridade": 1, "acao": "Ação prioritária", "justificativa": "Por que é urgente" }
  ]
}`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx   = clean.indexOf("{")
    const data  = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/jornada]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
