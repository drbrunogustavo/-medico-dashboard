import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { exame, valor, unidade, sexo, idade } = await request.json() as {
    exame: string; valor: string; unidade: string; sexo?: string; idade?: string
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
        max_tokens: 600,
        system: `Você é um especialista em medicina laboratorial e comunicação médica no Brasil.
Sua tarefa é transformar um resultado de exame em uma explicação simples, clara e empática para o paciente leigo.
Use linguagem acessível, sem jargões médicos. Transmita tranquilidade e esperança quando o resultado for normal; preocupação construtiva quando alterado.
Formate a resposta em português brasileiro, em 3-5 parágrafos curtos, sem bullets ou markdown.`,
        messages: [{
          role: 'user',
          content: `Exame: ${exame}
Valor: ${valor} ${unidade}
${sexo ? `Sexo: ${sexo}` : ''}
${idade ? `Idade: ${idade} anos` : ''}

Escreva uma explicação para o paciente sobre o que significa esse resultado, se está normal ou alterado, e o que pode estar relacionado. Termine com uma frase motivacional sobre o papel do paciente no controle da sua saúde.`,
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
