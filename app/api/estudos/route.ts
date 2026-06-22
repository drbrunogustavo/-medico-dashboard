import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'
import { AI_MODEL } from "@/lib/ai-config"

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { tema } = await request.json() as { tema: string }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 3000,
        system: `Você é um especialista em medicina baseada em evidências. Sua tarefa é resumir os principais estudos clínicos sobre um tema médico de forma estruturada e objetiva.

Retorne APENAS um JSON válido, sem markdown, sem texto extra. Formato exato:
{
  "tema": "string",
  "estudos": [
    {
      "id": "string-slug",
      "nome": "string",
      "tipo": "ECR" | "Metanálise" | "Coorte" | "Revisão Sistemática" | "Estudo Observacional",
      "n": number,
      "duracao": "string",
      "desfechoPrincipal": "string",
      "resultado": "string",
      "nivelEvidencia": "A" | "B" | "C",
      "aplicacaoClinica": "string",
      "ano": number,
      "journal": "string"
    }
  ],
  "resumo": "string"
}`,
        messages: [{
          role: 'user',
          content: `Tema: ${tema}

Liste os 4-6 principais estudos clínicos sobre este tema, priorizando: ensaios clínicos randomizados de grande porte, metanálises recentes e estudos com impacto na prática clínica. Inclua apenas estudos reais e verificáveis.`,
        }],
      }),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()
    const text = data.content?.[0]?.text ?? '{}'
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
