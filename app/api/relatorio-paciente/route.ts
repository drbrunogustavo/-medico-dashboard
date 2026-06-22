import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { nome, exames, contexto, conduta, tom } = await request.json() as {
    nome: string; exames: string; contexto?: string; conduta?: string
    tom: 'Simples' | 'Detalhado' | 'Motivacional'
  }

  const tomMap = {
    Simples:      "Linguagem muito simples, frases curtas, sem termos técnicos. Ideal para pacientes com baixa escolaridade.",
    Detalhado:    "Linguagem clara com explicações mais completas sobre cada achado, causas e impacto na saúde.",
    Motivacional: "Tom encorajador e empoderador. Celebre os acertos, motive as mudanças necessárias. Transmita esperança e parceria.",
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
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: `Você é um especialista em comunicação médica empática no Brasil.
Sua missão é transformar resultados de exames em uma mensagem clara, humana e motivacional para o paciente.

Regras:
- Nunca use jargão médico sem explicar em seguida
- Organize por seções: saudação, resumo geral, cada exame alterado, próximos passos, encerramento motivacional
- Transmita segurança, parceria e esperança
- Use "você" para se dirigir ao paciente
- Escreva em português brasileiro

Tom de comunicação: ${tomMap[tom] ?? tomMap.Simples}`,
        messages: [{
          role: 'user',
          content: `Paciente: ${nome}
Resultados dos exames:
${exames}
${contexto ? `\nContexto clínico: ${contexto}` : ''}
${conduta ? `\nConduta definida pelo médico: ${conduta}` : ''}

Escreva o relatório para o paciente conforme as instruções.`,
        }],
      }),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()
    const texto = data.content?.[0]?.text ?? ''
    return NextResponse.json({ texto })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
