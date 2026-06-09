import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { briefing, volume, publico } = await request.json() as {
    briefing: string
    volume: number
    publico: string
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: `Você é um estrategista de conteúdo médico sênior especializado em planejamento editorial para médicos no Instagram. Você cria planos editoriais que equilibram educação, autoridade e conversão.

Retorne SOMENTE um JSON com o plano editorial. Sem markdown, sem texto extra.`,
        messages: [{
          role: 'user',
          content: `Briefing: ${briefing}
Volume: ${volume} dias de conteúdo
Público-alvo: ${publico}

Crie um plano editorial completo. Retorne um JSON com:
- tema: string (tema central da campanha — máx 60 caracteres)
- pilares: string[] (exatamente 3 pilares editoriais — ex: "Educação Científica", "Empoderamento", "Autoridade Clínica")
- distribuicao: { reels: number, stories: number, carrosseis: number } (soma deve ser ${volume})
- calendario: array com exatamente ${volume} objetos, cada um com { dia: number, tema: string (tema específico do dia, máx 70 chars), formato: "Reel" | "Story" | "Carrossel" }

Distribua os formatos de forma variada e estratégica ao longo dos dias.
Retorne apenas o JSON puro.`,
        }],
      }),
    })

    const data = await res.json() as {
      content?: { type: string; text: string }[]
      error?: { message: string }
    }
    if (data.error) throw new Error(data.error.message)

    const text  = data.content?.[0]?.text ?? '{}'
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = clean.indexOf('{')
    const end   = clean.lastIndexOf('}')
    const json  = start >= 0 && end >= 0 ? clean.slice(start, end + 1) : '{}'

    return NextResponse.json(JSON.parse(json))
  } catch (e) {
    console.error('[agente/planejar]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
