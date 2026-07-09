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
      faturamento_anual:       number
      pacientes_ativos:        number
      ticket_medio:            number
      consultas_mes:           number
      objetivo_principal:      string
      faturamento_atual?:      number
    }

    const resp = await ai.messages.create({
      model:      AI_MODEL,
      max_tokens: 3000,
      system: `Você é o Consultor Estratégico do PRAXIS, especializado em planejamento financeiro e estratégico de clínicas médicas no Brasil. Crie planos de metas realistas e acionáveis. Retorne JSON puro.`,
      messages: [{
        role: "user",
        content: `Crie um plano estratégico anual para esta clínica:

META DE FATURAMENTO ANUAL: R$ ${body.faturamento_anual.toLocaleString("pt-BR")}
META DE PACIENTES ATIVOS: ${body.pacientes_ativos}
TICKET MÉDIO DESEJADO: R$ ${body.ticket_medio.toLocaleString("pt-BR")}
CONSULTAS/MÊS DESEJADAS: ${body.consultas_mes}
OBJETIVO PRINCIPAL: ${body.objetivo_principal}
${body.faturamento_atual ? `FATURAMENTO ATUAL: R$ ${body.faturamento_atual.toLocaleString("pt-BR")}` : ""}

Retorne JSON com EXATAMENTE esta estrutura:
{
  "breakdown_mensal": [
    { "mes": "Janeiro", "meta_faturamento": 0, "meta_consultas": 0, "meta_leads": 0, "foco": "Texto curto do foco do mês" }
  ],
  "estrategias": [
    { "area": "Marketing|Comercial|Financeiro|Clínico|Gestão", "estrategia": "Estratégia específica", "impacto": "Alto|Médio" }
  ],
  "indicadores_semanais": ["KPI para acompanhar toda semana"],
  "alertas_desvio": ["Sinal de alerta que indica que está fora da meta"]
}

O breakdown deve ter os 12 meses. Seja realista, com crescimento gradual.`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx   = clean.indexOf("{")
    const data  = parseAIJson(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/metas/plano]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
