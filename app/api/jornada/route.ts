import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAIJson(text: string): any {
  try { return JSON.parse(text) } catch { /* continua */ }
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  try { return JSON.parse(stripped) } catch { /* continua */ }
  const m1 = stripped.match(/\{[\s\S]*\}/)
  if (m1) { try { return JSON.parse(m1[0]) } catch { /* continua */ } }
  const m2 = stripped.match(/\[[\s\S]*\]/)
  if (m2) { try { return JSON.parse(m2[0]) } catch { /* continua */ } }
  throw new Error(`IA retornou resposta n\u00e3o parse\u00e1vel como JSON: ${text.slice(0, 120)}\u2026`)
}
export const maxDuration = 60

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const ai = getAnthropicClient()
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
      model:      AI_MODEL,
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
    const data  = parseAIJson(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/jornada]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
