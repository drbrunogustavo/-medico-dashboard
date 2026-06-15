import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { tema, slides = 7, objetivo = "Educativo", tom = "Profissional" } = await req.json() as {
      tema: string; slides?: number; objetivo?: string; tom?: string
    }
    if (!tema?.trim()) return NextResponse.json({ error: "Tema é obrigatório" }, { status: 400 })

    const resp = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: "Você é especialista em criação de carrosséis para Instagram de médicos no Brasil. Retorne APENAS JSON válido, sem markdown, sem texto antes ou depois.",
      messages: [{
        role: "user",
        content: `Crie um carrossel do Instagram para o o médico usuário.

TEMA: ${tema}
NÚMERO DE SLIDES: ${slides}
OBJETIVO: ${objetivo}
TOM: ${tom}

Slide 1 = Capa impactante. Slides intermediários = conteúdo. Último slide = CTA.

Retorne JSON:
{
  "titulo": "título da capa (texto impactante)",
  "subtitulo": "subtítulo da capa",
  "slides": [
    { "numero": 1, "titulo": "Texto principal do slide", "conteudo": "Texto completo do slide (2-3 linhas)", "dica_visual": "Sugestão de layout/cor de fundo" }
  ],
  "cta": "Call-to-action do último slide",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "legenda": "Legenda completa para acompanhar o post (inclui gancho + conteúdo + CTA + hashtags)"
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    return NextResponse.json(JSON.parse(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    console.error("[api/carrossel]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
