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
        user: `Pesquise na web os 12 principais temas médicos que estão em alta NO BRASIL AGORA${cf}${tf} nos últimos ${pl}${sf}. Foque em: tendências do Instagram e TikTok médico brasileiro, Google Trends saúde no Brasil, notícias de saúde brasileiras, hashtags em alta em medicina, medicamentos em discussão (GLP-1, tirzepatida, retatrutida, dupilumabe, biológicos), temas de longevidade e bem-estar, procedimentos populares, doenças em evidência e perguntas que pacientes brasileiros estão fazendo. Fontes prioritárias: Instagram médico BR, TikTok saúde BR, G1 Saúde, UOL Saúde, PubMed (últimas publicações), MedScape, SBEM, CFM, SBC. Retorne JSON array com: title (tema em português, máx 120 chars — impactante e específico), source (fonte real), category (Nutrologia|Endocrinologia|Longevidade|Metabolismo|Hormônios|Obesidade|Saúde Mental|Cardiometabolismo|Medicina do Esporte|Suplementação|Menopausa|Andropausa|Imunologia|Dermatologia|Emagrecimento|Oncologia|Neurologia|Pediatria), date (DD/MM/YYYY), relevance (Alto|Médio|Baixo), summary (2 frases em português explicando por que o tema está em alta e como o médico pode usar no conteúdo).`,
        system: "Você é um especialista em tendências de conteúdo médico no Brasil. Pesquise na web em tempo real o que está em alta no Instagram, TikTok, Google e notícias de saúde brasileiras AGORA. Retorne APENAS um array JSON válido, sem markdown, sem explicações, sem backticks. Responda exclusivamente em português brasileiro. Priorize temas com alto potencial de engajamento para médicos criadores de conteúdo.",
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
