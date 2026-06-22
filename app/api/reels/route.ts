import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { tema, categoria = "Educativo", quantidade = 8 } = await req.json() as {
      tema: string; categoria?: string; quantidade?: number
    }
    if (!tema?.trim()) return NextResponse.json({ error: "Tema é obrigatório" }, { status: 400 })

    const resp = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2500,
      system: "Você é especialista em ideias de Reels médicos para Instagram e TikTok. Retorne APENAS JSON válido, sem markdown.",
      messages: [{
        role: "user",
        content: `Crie ${quantidade} ideias de Reels para o médico usuário.

TEMA GERAL: ${tema}
CATEGORIA: ${categoria}

Para cada ideia, inclua gancho de abertura, estrutura do vídeo, duração recomendada e potencial viral.

Retorne JSON:
{
  "ideias": [
    {
      "titulo": "Título do Reel",
      "gancho": "Frase de abertura irresistível (primeiros 3 segundos)",
      "estrutura": ["Ponto 1", "Ponto 2", "Ponto 3", "Ponto 4"],
      "duracao": "15s|30s|60s|90s",
      "formato": "Talking head|B-roll|Texto na tela|Misto",
      "potencial_viral": "Alto|Médio|Baixo",
      "razao_viral": "Por que esse tema tem potencial viral neste momento"
    }
  ]
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    return NextResponse.json(JSON.parse(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    console.error("[api/reels]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
