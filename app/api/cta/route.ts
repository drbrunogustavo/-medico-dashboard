import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
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
    return NextResponse.json(JSON.parse(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    console.error("[api/cta]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
