import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"


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

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  try {
    const client = getAnthropicClient()
    const { tema, objetivo = "agendar consulta", formato = "Reel", quantidade = 10 } = await req.json() as {
      tema: string; objetivo?: string; formato?: string; quantidade?: number
    }
    if (!tema?.trim()) return NextResponse.json({ error: "Tema é obrigatório" }, { status: 400 })

    const resp = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1500,
      system: "Você é especialista em copywriting médico para Instagram. Retorne APENAS JSON válido, sem markdown.",
      messages: [{
        role: "user",
        content: `Crie ${quantidade} CTAs (calls-to-action) para o médico usuário.

TEMA DO CONTEÚDO: ${tema}
OBJETIVO DO CTA: ${objetivo}
FORMATO: ${formato}

Regras:
- Diretos, urgentes mas sem pressão excessiva
- Linguagem humana e médica, em português brasileiro
- Variedade de tipos: pergunta, imperativo, benefício, urgência
- Máx 2 linhas por CTA

Retorne JSON:
{
  "ctas": [
    { "texto": "Texto completo do CTA", "tipo": "Imperativo|Pergunta|Benefício|Urgência", "canal": "Post|Story|Reel|Bio" }
  ]
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    return NextResponse.json(parseAIJson(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    captureAnthropicError(e, "/api/cta")
    console.error("[api/cta]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
