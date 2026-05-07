import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { contexto, formato, tom, emojis } = await request.json()

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: "Você é um especialista em marketing médico digital para Instagram. Cria legendas profissionais para médicos brasileiros nas áreas de nutrologia, endocrinologia e longevidade. Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois.",
        messages: [{
          role: "user",
          content: `Crie uma legenda para Instagram no formato ${formato} com tom ${tom} ${emojis ? "com emojis" : "sem emojis"}.\n\n${contexto}\n\nRetorne APENAS um JSON com exatamente estes campos:\n{\n  "gancho": "primeira linha impactante que para o scroll (máx 150 chars)",\n  "desenvolvimento": "corpo do texto com informação de valor (2-4 parágrafos)",\n  "cta": "chamada para ação final (máx 100 chars)",\n  "hashtags": "15-20 hashtags relevantes separadas por espaço",\n  "completa": "legenda completa formatada pronta para copiar"\n}`
        }]
      })
    })

    const data = await res.json()
    let texto = ""
    for (const block of (data.content || [])) {
      if (block.type === "text") texto += block.text
    }
    const clean = texto.replace(/```json|```/g, "").trim()
    const idx = clean.indexOf("{")
    const parsed = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json(parsed)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao gerar legenda" }, { status: 500 })
  }
}