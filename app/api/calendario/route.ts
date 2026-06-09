import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const {
      mes,
      ano,
      pilares = ["Educativo", "Autoridade", "Vendas", "Relacionamento"],
      frequencia = 5,
      temas = [],
    } = await req.json() as {
      mes: number; ano: number; pilares?: string[]; frequencia?: number; temas?: string[]
    }

    const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
    const mesNome = meses[(mes ?? 1) - 1] ?? "Janeiro"

    const resp = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,
      system: "Você é especialista em calendário editorial médico para Instagram. Retorne APENAS JSON válido, sem markdown.",
      messages: [{
        role: "user",
        content: `Crie um calendário editorial para ${mesNome}/${ano ?? 2025} para o Dr. Bruno Gustavo (Endocrinologia, Nutrologia, Longevidade — Poços de Caldas, MG).

PILARES DE CONTEÚDO: ${pilares.join(", ")}
FREQUÊNCIA: ${frequencia} posts por semana${temas.length > 0 ? `\nTEMAS PRIORITÁRIOS: ${temas.join(", ")}` : ""}

Distribua os posts de forma equilibrada entre os pilares.
Inclua datas reais de ${mesNome}/${ano ?? 2025} (dias 1 a 30/31).
Só inclua dias úteis para posting (segunda a sábado).

Retorne JSON:
{
  "mes": "${mesNome}/${ano ?? 2025}",
  "total_posts": número,
  "posts": [
    {
      "dia": 1,
      "dia_semana": "Segunda",
      "formato": "Reel|Carrossel|Feed|Stories",
      "pilar": "Educativo|Autoridade|Vendas|Relacionamento",
      "tema": "Tema específico do conteúdo",
      "gancho": "Sugestão de gancho ou título",
      "hashtags": ["tag1", "tag2", "tag3"]
    }
  ],
  "distribuicao_pilares": { "Educativo": 40, "Autoridade": 30, "Vendas": 20, "Relacionamento": 10 },
  "dica_estrategica": "Dica estratégica para o mês baseada no calendário gerado"
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    return NextResponse.json(JSON.parse(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    console.error("[api/calendario]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
