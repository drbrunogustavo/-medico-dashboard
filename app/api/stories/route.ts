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


export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const client = getAnthropicClient()
  try {
    const { tema, slides = 5, tom = "Educativo" } = await req.json() as {
      tema: string; slides?: number; tom?: string
    }
    if (!tema?.trim()) return NextResponse.json({ error: "Tema é obrigatório" }, { status: 400 })

    const resp = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system: "Você é especialista em criação de Stories para médicos no Instagram. Retorne APENAS JSON válido, sem markdown.",
      messages: [{
        role: "user",
        content: `Crie uma sequência de ${slides} Stories para o Instagram do médico usuário.

TEMA: ${tema}
TOM: ${tom}

Regras:
- Primeiro story: gancho irresistível — pergunta, dado chocante ou afirmação polêmica
- Último story: CTA claro (agendar, comentar, compartilhar)
- Texto de cada story: máx 150 caracteres
- Escrita em português brasileiro

Retorne JSON:
{
  "sequencia_titulo": "Título da sequência",
  "stories": [
    {
      "numero": 1,
      "texto": "Texto do story (direto e impactante, máx 150 chars)",
      "tipo": "Gancho|Conteúdo|Revelação|CTA",
      "dica_visual": "Sugestão de cor de fundo, imagem ou elemento visual",
      "sticker": "Sugestão de sticker interativo (opcional — enquete, quiz, perguntas)"
    }
  ],
  "hashtags": ["tag1", "tag2", "tag3"]
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    return NextResponse.json(parseAIJson(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    console.error("[api/stories]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
