import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { objecao, tema } = await request.json() as { objecao: string; tema: string }

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
        system: `Você é um estrategista de conteúdo médico especialista em transformar objeções de pacientes em conteúdo educativo e viral para Instagram. Você cria conteúdo empático, baseado em evidências, que educa sem diminuir o paciente.

Retorne SOMENTE um JSON com 4 chaves. Sem markdown, sem texto extra.`,
        messages: [{
          role: 'user',
          content: `Tema geral: ${tema}
Objeção do paciente: "${objecao}"

Crie 4 formatos de conteúdo para responder essa objeção no Instagram. Retorne um JSON com:

- reel: { titulo: string, gancho: string (primeiras 2 linhas do vídeo), estrutura: string[] (5 pontos para 60s de conteúdo) }
- story: { titulo: string, slides: string[] (5 strings, cada uma = conteúdo completo de 1 slide) }
- carrossel: { titulo: string, slides: string[] (6 strings: capa + 4 slides de conteúdo + slide de CTA) }
- faq: { titulo: string, resposta: string (resposta completa em 3-4 parágrafos para legenda ou post) }

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
    console.error('[objecoes/transformar]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
