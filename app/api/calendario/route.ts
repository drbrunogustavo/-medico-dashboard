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
      model: AI_MODEL,
      max_tokens: 8000,
      system: "Você é especialista em calendário editorial médico para Instagram. Retorne APENAS JSON válido, sem markdown, sem texto adicional.",
      messages: [{
        role: "user",
        content: `Crie um calendário editorial completo para ${mesNome}/${ano ?? 2025}.

ESPECIALIDADE: ${especialidade}
MÉDICO: o médico usuário
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
    return NextResponse.json(parseAIJson(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    console.error("[api/calendario]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
