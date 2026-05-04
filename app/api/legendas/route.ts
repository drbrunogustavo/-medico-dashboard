import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  const { tema, contexto, formato, tom, emojis } = await request.json()

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `Você é um especialista em marketing médico digital para Instagram. Cria legendas profissionais para médicos brasileiros nas áreas de nutrologia, endocrinologia e longevidade. Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois.`,
      messages: [{
        role: "user",
        content: `Crie uma legenda para Instagram no formato ${formato} com tom ${tom} ${emojis ? "com emojis" : "sem emojis"}.

${contexto}

Retorne APENAS um JSON com exatamente estes campos:
{
  "gancho": "primeira linha impactante que para o scroll (máx 150 chars)",
  "desenvolvimento": "corpo do texto com informação de valor (2-4 parágrafos)",
  "cta": "chamada para ação final (máx 100 chars)",
  "hashtags": "15-20 hashtags relevantes separadas por espaço",
  "completa": "legenda completa formatada pronta para copiar"
}`
      }]
    })

    const texto = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = texto.replace(/```json|```/g, "").trim()
    const idx = clean.indexOf("{")
    const parsed = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json(parsed)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao gerar legenda" }, { status: 500 })
  }
}