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
      especialidade = "Endocrinologia e Nutrologia",
      pilares = ["Educativo", "Autoridade", "Vendas", "Relacionamento"],
      frequencia = 5,
      temas = [],
    } = await req.json() as {
      mes: number; ano: number
      especialidade?: string
      pilares?: string[]
      frequencia?: number
      temas?: string[]
    }

    const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
    const mesNome = meses[(mes ?? 1) - 1] ?? "Janeiro"

    const resp = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: "Você é especialista em calendário editorial médico para Instagram. Retorne APENAS JSON válido, sem markdown, sem texto adicional.",
      messages: [{
        role: "user",
        content: `Crie um calendário editorial completo para ${mesNome}/${ano ?? 2025}.

ESPECIALIDADE: ${especialidade}
MÉDICO: Dr. Bruno Gustavo (Poços de Caldas, MG)
PILARES DE CONTEÚDO: ${pilares.join(", ")}
FREQUÊNCIA: ${frequencia} posts por semana${temas.length > 0 ? `\nTEMAS PRIORITÁRIOS: ${temas.join(", ")}` : ""}

Distribua os posts de forma equilibrada.
Inclua apenas dias com post agendado (segunda a sábado, respeitando a frequência).

Retorne JSON neste formato exato:
{
  "mes": "${mesNome}/${ano ?? 2025}",
  "total_posts": 20,
  "posts": [
    {
      "dia": 1,
      "dia_semana": "Segunda",
      "formato": "Reel",
      "pilar": "Educativo",
      "tema": "Título específico do conteúdo",
      "gancho": "Você sabia que 70% dos brasileiros têm resistência à insulina sem saber?",
      "legenda": "Legenda completa para Instagram (150-200 palavras) com storytelling médico, educativo e chamada para engajamento",
      "cta": "Salva esse post para revisar depois! Me conta nos comentários: você já fez exames de insulina em jejum?",
      "roteiro": "Roteiro completo: [0-3s] Gancho visual. [3-10s] Desenvolvimento do problema. [10-25s] Solução prática. [25-30s] CTA e encerramento.",
      "stories_sequencia": ["Card 1: pergunta engajamento", "Card 2: informação principal", "Card 3: dica prática", "Card 4: CTA para o post"],
      "hashtags": ["endocrinologia", "resistenciainsulina", "saude"]
    }
  ],
  "distribuicao_pilares": { "Educativo": 40, "Autoridade": 30, "Vendas": 20, "Relacionamento": 10 },
  "dica_estrategica": "Dica estratégica para o mês."
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
