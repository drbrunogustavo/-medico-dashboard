import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 60

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const ai = getAnthropicClient()

  try {
    const body = await req.json() as {
      pacientes:    { nome: string; motivo_saida?: string; dias_inativo: number }[]
      nome_medico:  string
      especialidade: string
    }

    const resp = await ai.messages.create({
      model:      AI_MODEL,
      max_tokens: 2000,
      system: `Você é especialista em recuperação de pacientes para clínicas médicas no Brasil. Crie campanhas de reativação éticas, empáticas e eficazes. Retorne JSON puro.`,
      messages: [{
        role: "user",
        content: `Crie uma sequência de 3 mensagens de reativação para estes ${body.pacientes.length} pacientes inativos.

MÉDICO: Dr(a). ${body.nome_medico}, ${body.especialidade}
PACIENTES: ${body.pacientes.slice(0, 5).map(p => p.nome).join(", ")} ${body.pacientes.length > 5 ? `e mais ${body.pacientes.length - 5}` : ""}

As 3 mensagens devem ter abordagens diferentes:
1. Mensagem de reconexão (mais suave, mostra que se importa)
2. Mensagem de valor (compartilha novidade ou informação útil)
3. Mensagem de urgência (oferta ou convite limitado)

Use [NOME] onde deve inserir o nome do paciente.

Retorne JSON:
{
  "mensagens": [
    { "numero": 1, "titulo": "Reconexão", "intervalo": "Dia 1", "texto": "..." },
    { "numero": 2, "titulo": "Valor",     "intervalo": "Dia 3", "texto": "..." },
    { "numero": 3, "titulo": "Urgência",  "intervalo": "Dia 7", "texto": "..." }
  ]
}`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx   = clean.indexOf("{")
    const data  = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/reativacao/campanha]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
