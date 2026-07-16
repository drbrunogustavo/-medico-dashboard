import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"

export const maxDuration = 20

interface InsightInput {
  faturamento_mes:  number
  faturamento_ant?: number
  consultas_mes:    number
  leads_total:      number
  leads_semana:     number
  nps_score:        number | null
}

interface Insight {
  tipo:     "ok" | "warn" | "info"
  titulo:   string
  descricao: string
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as InsightInput
  const { faturamento_mes, faturamento_ant, consultas_mes, leads_total, leads_semana, nps_score } = body

  const crescimento = faturamento_ant && faturamento_ant > 0
    ? ((faturamento_mes - faturamento_ant) / faturamento_ant * 100).toFixed(1)
    : null

  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Analise os dados do consultório de ${mesAtual} e gere exatamente 3 insights acionáveis. Cada insight deve ter: tipo (ok/warn/info), título curto (≤8 palavras), descrição prática (≤15 palavras).

DADOS:
- Receita: ${fmtBRL(faturamento_mes)}${crescimento !== null ? ` (${Number(crescimento) >= 0 ? "+" : ""}${crescimento}% vs mês anterior)` : ""}
- Consultas realizadas: ${consultas_mes}
- Leads no CRM: ${leads_total} (+${leads_semana} esta semana)
- NPS: ${nps_score !== null ? nps_score : "sem dados"}

Regras para tipo:
- "ok" = resultado positivo, parabéns
- "warn" = atenção, algo abaixo do esperado
- "info" = oportunidade neutra ou dica acionável

Retorne APENAS JSON:
[{"tipo":"ok|warn|info","titulo":"...","descricao":"..."}]`,
    }],
  })

  const raw = msg.content.find(b => b.type === "text")?.text ?? "[]"
  let insights: Insight[] = []
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const s = cleaned.indexOf("["); const e = cleaned.lastIndexOf("]")
    const parsed  = JSON.parse(s !== -1 && e > s ? cleaned.slice(s, e + 1) : cleaned)
    insights = (Array.isArray(parsed) ? parsed : []).slice(0, 4).filter(
      (s: unknown): s is Insight =>
        typeof s === "object" && s !== null &&
        ["ok","warn","info"].includes((s as Insight).tipo) &&
        typeof (s as Insight).titulo === "string"
    )
  } catch { /* retorna vazio */ }

  return NextResponse.json({ insights })
}
