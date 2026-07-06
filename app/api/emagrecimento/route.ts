import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { fatores, scores, total, sexo } = await request.json() as {
    fatores: { id: string; nome: string; score: number; maxScore: number }[]
    scores: Record<string, number>
    total: number
    sexo?: "M" | "F" | null
  }

  const fatoresText = fatores
    .map(f => `${f.nome}: ${f.score}/${f.maxScore} (${Math.round((f.score / f.maxScore) * 100)}%)`)
    .join('\n')

  try {
    const client = getAnthropicClient()
    const data = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 3500,
      system: `Você é um especialista em medicina do estilo de vida, nutrologia e emagrecimento baseado em evidências.
Analise os fatores de bloqueio ao emagrecimento de um paciente e gere um plano personalizado estruturado.

Retorne APENAS um JSON válido. Formato exato:
{
  "topFatores": [
    {
      "nome": "string",
      "score": number,
      "mecanismo": "string",
      "exames": ["string"],
      "intervencoes": ["string"]
    }
  ],
  "plano90dias": {
    "mes1": ["string"],
    "mes2": ["string"],
    "mes3": ["string"]
  },
  "textoParaPaciente": "string",
  "resumoMedico": "string"
}`,
      messages: [{
        role: 'user',
        content: `Avaliação dos fatores de bloqueio ao emagrecimento:

${fatoresText}

Score total: ${total}/100
Sexo do paciente: ${sexo === "F" ? "Feminino" : sexo === "M" ? "Masculino" : "Não informado"}

Identifique os 3 fatores com maior score (maior bloqueio), explique o mecanismo fisiopatológico de cada um, liste exames específicos a solicitar e intervenções práticas. Gere um plano de 90 dias progressivo e um texto simples para compartilhar com o paciente.`,
      }],
    })

    const text = data.content?.[0]?.type === 'text' ? data.content[0].text : '{}'
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
