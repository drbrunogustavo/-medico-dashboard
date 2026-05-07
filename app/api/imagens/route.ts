import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { prompt } = body

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
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    let texto = ''
    for (const block of (data.content || [])) {
      if (block.type === 'text') texto += block.text
    }

    const clean = texto.replace(/```json|```/g, '').trim()
    const idx = clean.indexOf('{')
    const parsed = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json(parsed)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao gerar conteúdo' }, { status: 500 })
  }
}
