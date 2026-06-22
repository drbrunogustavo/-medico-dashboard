import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

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
        system: "Você é um especialista em marketing médico digital para Instagram do médico usuário — Clínico-Geral, Endocrinologia e Nutrologia. Cria legendas profissionais, diretas e humanas. Responda sempre em português brasileiro. Nunca use inglês. Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois.",
        messages: [{
          role: "user",
          content: `Crie uma legenda em português brasileiro para Instagram no formato ${formato} com tom ${tom} ${emojis ? "com emojis" : "sem emojis"}.\n\n${contexto}\n\nRegras obrigatórias:\n- Escreva tudo em português brasileiro. Nunca use inglês.\n- Tom: médico que conversa como amigo, direto, sem enrolação\n- Proibido: "mergulhar", "jornada", "empoderar", "transformador"\n- Máx 5 hashtags (algoritmo do Instagram 2025 penaliza mais)\n\nRetorne APENAS um JSON com exatamente estes campos (todos os valores em português brasileiro):\n{\n  "gancho": "primeira linha impactante que para o scroll (máx 150 chars, em português)",\n  "desenvolvimento": "corpo do texto com informação de valor (2-4 parágrafos, em português)",\n  "cta": "chamada para ação final (máx 100 chars, em português)",\n  "hashtags": "exatamente 5 hashtags relevantes separadas por espaço",\n  "completa": "legenda completa formatada pronta para copiar (em português)"\n}`
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
