import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type RadarType = "radar" | "reels" | "velocity" | "opportunities"

interface RadarFilters {
  fonte?:     string
  categoria?: string
  topico?:    string
  periodo?:   string
}

function periodLabel(v: string): string {
  const m: Record<string, string> = {
    "24h":  "last 24 hours",
    "7d":   "last 7 days",
    "30d":  "last 30 days",
    "90d":  "last 90 days",
    "180d": "last 180 days",
  }
  return m[v] ?? "last 7 days"
}

function buildPrompt(type: RadarType, f: RadarFilters): { user: string; system: string } {
  const pl = periodLabel(f.periodo ?? "7d")
  const sf = f.fonte     && f.fonte     !== "Todos" ? ` focusing on ${f.fonte}`        : ""
  const cf = f.categoria && f.categoria !== "Todos" ? ` in the area of ${f.categoria}` : ""
  const tf = f.topico    && f.topico    !== "Todos" ? ` related to "${f.topico}"`       : ""

  switch (type) {
    case "radar":
      return {
        user: `Search top 12 trending medical topics${cf}${tf} from ${pl}${sf} relevant to Brazilian medical content creators in nutrologia, endocrinologia, longevidade, metabolismo, hormônios, obesidade, saúde mental, menopausa, andropausa, emagrecimento, suplementação. Sources: PubMed, The Lancet, NEJM, Nature Medicine, MedScape, JAMA, BMJ, Instagram Trending, TikTok Trending, Reddit Health, STAT News, medRxiv. Return JSON array: title (em português, máx 120 chars), source, category (Nutrologia|Endocrinologia|Longevidade|Metabolismo|Microbioma|Hormônios|Anti-aging|Genômica|Obesidade|Nutrição Clínica|Saúde Mental|Cardiometabolismo|Medicina do Esporte|Suplementação|Sono e Cronobiologia|Imunologia|Menopausa|Andropausa|Envelhecimento|Terapia Hormonal|Emagrecimento), date (DD/MM/YYYY), relevance (Alto|Médio|Baixo), summary (2 frases em português).`,
        system: "Você é um agregador de inteligência médica para um dashboard brasileiro. Retorne APENAS um array JSON válido, sem markdown, sem backticks. Responda sempre em português brasileiro. Nunca use inglês nas respostas.",
      }

    case "reels":
      return {
        user: `Find top 50 viral medical/health reels and videos from Instagram, TikTok, YouTube in ${pl}. Topics: GLP-1, tirzepatida, retatrutida, testosterona, menopausa, jejum, longevidade, sarcopenia, hormônios, emagrecimento, saúde mental, andropausa, biohacking. Return JSON array: rank (1-50), title (em português), platform (Instagram|TikTok|YouTube), views (ex: "4.2M"), engagement (ex: "18.4%"), link (URL or "#"), category (em português).`,
        system: "Você é um analista de inteligência de mídias sociais para conteúdo médico brasileiro. Retorne APENAS um array JSON válido, sem markdown. Responda sempre em português brasileiro. Nunca use inglês nas respostas.",
      }

    case "velocity":
      return {
        user: `Analyze Trend Velocity Score for medical topics in Brazil for ${pl}. Evaluate search growth, mentions volume, and scientific publications. Return JSON array (15+ topics): topic (em português), score (0-100), growth (ex: "+280%"), mentions (inteiro estimado mensal), publications (inteiro recente), trend (🔥 if score>90, ⚡ if 70-90, 📈 if 50-70, 📊 if <50), category (em português).`,
        system: "Você é um analista de velocidade de tendências médicas. Retorne APENAS um array JSON válido, sem markdown. Responda sempre em português brasileiro. Nunca use inglês nas respostas.",
      }

    case "opportunities":
      return {
        user: `Identify content opportunities for a Brazilian medical doctor creating health content. Find topics with high growth trend + low competition among medical creators + high sharing potential. Return JSON array (8+ items): topic (em português), growth (ex: "+280%"), competition (Muito Baixa|Baixa|Média|Alta), sharing (Muito Alto|Alto|Médio|Baixo), score (0-100), trending_since (ex: "2 semanas"), why (2-3 frases em português), keywords (array 3-5 termos em português), platforms (array).`,
        system: "Você é um analista de estratégia de conteúdo para influenciadores médicos brasileiros. Retorne APENAS um array JSON válido, sem markdown. Responda sempre em português brasileiro. Nunca use inglês nas respostas.",
      }
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as {
      type:     RadarType
      filters?: RadarFilters
    }

    const { user, system } = buildPrompt(body.type, body.filters ?? {})

    const resp = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4000,
      tools:      [{ type: "web_search_20250305" as const, name: "web_search" as const }],
      system,
      messages:   [{ role: "user", content: user }],
    })

    let text = ""
    for (const block of resp.content) {
      if (block.type === "text") text += block.text
    }

    const clean = text.replace(/```json|```/g, "").trim()
    const idx   = clean.indexOf("[")
    const data  = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)

    return NextResponse.json({ data })
  } catch (e) {
    console.error("[api/radar]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
