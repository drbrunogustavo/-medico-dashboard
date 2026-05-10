// Salvar em: app/api/legendas/route.ts
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
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: "Você é um especialista em marketing médico digital para Instagram do Dr. Bruno Gustavo — Clínico-Geral, Endocrinologia e Nutrologia. Cria legendas profissionais, diretas e humanas. Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois.",
        messages: [{
          role: "user",
          content: `Crie uma legenda para Instagram no formato ${formato} com tom ${tom} ${emojis ? "com emojis" : "sem emojis"}.\n\n${contexto}\n\nRegras:\n- Tom: médico que conversa como amigo, direto, sem enrolação\n- Proibido: "mergulhar", "jornada", "empoderar", "transformador"\n- Máx 5 hashtags (algoritmo do Instagram 2025 penaliza mais)\n\nRetorne APENAS um JSON com exatamente estes campos:\n{\n  "gancho": "primeira linha impactante que para o scroll (máx 150 chars)",\n  "desenvolvimento": "corpo do texto com informação de valor (2-4 parágrafos)",\n  "cta": "chamada para ação final (máx 100 chars)",\n  "hashtags": "exatamente 5 hashtags relevantes separadas por espaço",\n  "completa": "legenda completa formatada pronta para copiar"\n}`
        }]
      })
    })

    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ error: JSON.stringify(data.error) }, { status: 500 })
    }

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
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
