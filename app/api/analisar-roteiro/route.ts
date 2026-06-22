import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'
import { AI_MODEL } from "@/lib/ai-config"

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { roteiro } = await request.json() as { roteiro: string }

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
        max_tokens: 2000,
        system: `Você é um editor de vídeo especialista em Reels médicos para Instagram.

Analise o roteiro e decomponha-o em segmentos de timeline para um vídeo de até 60 segundos no formato 9:16.

Retorne SOMENTE um JSON array (sem markdown, sem texto extra) com objetos no formato:
{
  "segundo_inicio": number,
  "segundo_fim": number,
  "instrucao": string (máx 60 chars — instrução de direção para o segmento),
  "tipo": "video" | "asset" | "texto",
  "texto_sugerido": string (apenas se tipo for "texto" — texto que aparecerá em tela)
}

Regras:
- Cobrir de 0 até no máximo 60 segundos
- tipo "video" = momento de fala direta para câmera
- tipo "asset" = sobrepor imagem/gráfico explicativo
- tipo "texto" = legenda ou título em tela
- Distribua o tempo de forma realista para fala médica
- Retorne somente o array JSON, sem nenhum texto adicional`,
        messages: [{ role: 'user', content: `Roteiro:\n\n${roteiro}` }],
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

    return NextResponse.json({ segments: JSON.parse(json) })
  } catch (e) {
    console.error('[analisar-roteiro]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
