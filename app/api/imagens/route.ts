import { NextResponse } from 'next/server'
import { captureAnthropicError } from "@/lib/anthropic"

export async function POST(request: Request) {
  const body = await request.json()

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    captureAnthropicError(e, "/api/imagens")
    console.error(e)
    return NextResponse.json({ error: 'Erro ao gerar conteúdo' }, { status: 500 })
  }
}
