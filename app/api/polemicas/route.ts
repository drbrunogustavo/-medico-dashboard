import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'

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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3500,
        system: `Você é um estrategista de conteúdo médico especialista em viralização ética para redes sociais, com foco em Endocrinologia, Nutrologia e Longevidade. Seu objetivo é gerar abordagens de conteúdo que equilibrem impacto viral com responsabilidade médica.

Retorne SOMENTE um JSON array com exatamente 4 objetos. Sem markdown, sem texto extra, sem código.`,
        messages: [{
          role: 'user',
          content: `Tema médico: ${tema}

Gere 4 abordagens diferentes para criar conteúdo sobre este tema no Instagram/Reels:

1. CONSERVADORA — tom seguro, baseado em evidências, sem polêmica
2. EQUILIBRADA — apresenta dois lados, estimula reflexão crítica
3. POLÊMICA CONTROLADA — tensão ética, questiona consensos COM respaldo científico
4. ALTAMENTE VIRAL — máximo impacto emocional, no limite ético mas sem ultrapassar

Cada objeto deve ter:
- tipo: "conservadora" | "equilibrada" | "polemica" | "viral"
- titulo: título sugerido para o post (máx 85 caracteres)
- gancho: primeiras 3 linhas de abertura (string com quebras \\n)
- estrutura: array com exatamente 5 strings descrevendo os pontos do roteiro
- risco: "Baixo" | "Médio" | "Alto"
- score: número inteiro 0-100 (score estimado de viralização)

Retorne apenas o array JSON.`,
        }],
      }),
    })

    const data = await res.json() as {
      content?: { type: string; text: string }[]
      error?: { message: string }
    }
    if (data.error) throw new Error(data.error.message)

    const text  = data.content?.[0]?.text ?? '[]'
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = clean.indexOf('[')
    const end   = clean.lastIndexOf(']')
    const json  = start >= 0 && end >= 0 ? clean.slice(start, end + 1) : '[]'

    return NextResponse.json({ abordagens: JSON.parse(json) })
  } catch (e) {
    console.error('[polemicas]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
