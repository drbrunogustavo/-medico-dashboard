import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'

interface CalendarioItem {
  dia:     number
  tema:    string
  formato: string
}

interface Plano {
  tema:         string
  pilares:      string[]
  distribuicao: { reels: number; stories: number; carrosseis: number }
  calendario:   CalendarioItem[]
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { plano, dias, publico, briefing } = await request.json() as {
    plano:    Plano
    dias:     number[]
    publico:  string
    briefing: string
  }

  const diasCalendario = (plano.calendario ?? []).filter(c => dias.includes(c.dia))

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
        max_tokens: 8000,
        system: `Você é o Agente Executivo de Conteúdo Médico do médico usuário. Você cria conteúdo médico de alta qualidade, baseado em evidências, que educa e converte no Instagram.

Retorne SOMENTE um JSON array. Sem markdown, sem texto extra.`,
        messages: [{
          role: 'user',
          content: `CAMPANHA: ${plano.tema}
PILARES: ${plano.pilares.join(' · ')}
PÚBLICO-ALVO: ${publico}
BRIEFING ORIGINAL: ${briefing}

Gere conteúdo completo e pronto para publicar para os dias abaixo:

${diasCalendario.map(d => `DIA ${d.dia}: "${d.tema}" (formato principal: ${d.formato})`).join('\n')}

Para CADA dia, retorne um objeto JSON com exatamente estas propriedades:
{
  "dia": [número],
  "reel": {
    "titulo": "[título chamativo, máx 80 caracteres]",
    "gancho": "[3 linhas de abertura impactantes separadas por \\n — cria tensão ou curiosidade]",
    "roteiro": ["ponto 1 (10s)", "ponto 2 (15s)", "ponto 3 (15s)", "ponto 4 (10s)", "ponto 5 (10s)"],
    "cta": "[call to action específico e direto]"
  },
  "imagem": {
    "headline": "[título da arte em máx 8 palavras — impactante e visual]",
    "prompt": "[descrição em inglês para IA gerar arte médica profissional e elegante]",
    "estilo": "[estilo: Autoridade Médica | Infográfico Limpo | Emocional | Minimalista | Antes e Depois]"
  },
  "legenda": {
    "texto": "[legenda completa com emojis estratégicos, 2-3 parágrafos: gancho → desenvolvimento → CTA]",
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  },
  "story": {
    "slides": ["[slide 1: pergunta ou dado impactante]", "[slide 2: conteúdo principal em 2-3 linhas]", "[slide 3: CTA ou conclusão]"]
  }
}

Retorne um JSON array com ${dias.length} objeto(s). Apenas o JSON array puro, sem markdown.`,
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

    return NextResponse.json({ dias: JSON.parse(json) })
  } catch (e) {
    console.error('[agente/gerar]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
