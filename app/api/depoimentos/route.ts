import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { sendZapi } from "@/lib/zapi"
import { AI_MODEL } from "@/lib/ai-config"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as {
    paciente_nome: string
    nota: number
    comentario?: string
    resultado?: string
    tempo_paciente?: string
    transformacao?: string
    usar_nome_completo?: boolean
    paciente_telefone?: string
    action?: "gerar" | "enviar_aprovacao"
  }

  if (body.action === "enviar_aprovacao") {
    if (!body.paciente_telefone) return NextResponse.json({ error: "telefone obrigatório" }, { status: 400 })
    const msg = `Olá, ${body.paciente_nome}! 😊\n\nCriamos um depoimento baseado na sua avaliação. Antes de usar, gostaríamos da sua aprovação:\n\n"${body.comentario}"\n\nPode confirmar o uso? Responda SIM ou NÃO.\n\nObrigado!\n— o médico usuário`
    const { ok, error } = await sendZapi(body.paciente_telefone, msg)
    if (!ok) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (!body.paciente_nome || !body.nota) {
    return NextResponse.json({ error: "paciente_nome e nota obrigatórios" }, { status: 400 })
  }

  const nome = body.usar_nome_completo ? body.paciente_nome : body.paciente_nome.split(" ")[0]

  try {
    const resp = await ai.messages.create({
      model:      AI_MODEL,
      max_tokens: 1000,
      messages: [{
        role: "user",
        content:
`Você é especialista em marketing médico. Transforme este feedback em depoimento profissional para o médico usuário.

Dados:
- Nome: ${nome}
- Nota: ${body.nota}/10
- Comentário original: ${body.comentario ?? "não informado"}
- Resultado obtido: ${body.resultado ?? "não informado"}
- Tempo como paciente: ${body.tempo_paciente ?? "não informado"}
- Principal transformação: ${body.transformacao ?? "não informada"}

Retorne APENAS JSON:
{
  "instagram": "depoimento formatado para Instagram: máx 150 palavras, emocional, com 3-4 emojis relevantes e 5 hashtags médicas no final",
  "google": "depoimento formal para Google: máx 100 palavras, sem emojis, sem hashtags, objetivo e credível"
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim()
    const s = clean.indexOf("{"); const e = clean.lastIndexOf("}")
    if (s === -1) throw new Error("JSON inválido")
    const result = JSON.parse(clean.slice(s, e + 1)) as { instagram: string; google: string }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
