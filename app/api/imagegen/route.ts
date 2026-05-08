// Salvar em: app/api/imagegen/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { tema, formato } = await request.json()

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY não configurada' }, { status: 500 })
  }

  // Aspect ratio baseado no formato
  const aspectMap: Record<string, string> = {
    'feed-retrato': '4:5',
    'quadrado':     '1:1',
    'stories':      '9:16',
    'reels-capa':   '9:16',
  }
  const aspectRatio = aspectMap[formato] ?? '4:5'

  // Prompt otimizado — estética das fotos de referência do Dr. Bruno
  const prompt = [
    'Cinematic professional medical photography,',
    'ultra-realistic, 8K quality,',
    'doctor or medical professional in elegant dark environment,',
    'warm golden amber bokeh background,',
    'soft dramatic lighting, depth of field,',
    'sophisticated luxury aesthetic,',
    'dark moody tones with golden highlights,',
    'medical laboratory or clinical setting visible softly out of focus,',
    'subject dressed in professional attire,',
    'theme: ' + tema + ',',
    'no text, no watermarks, no logos,',
    'editorial medical photography style,',
    'inspired by high-end Brazilian medical influencer content',
  ].join(' ')

  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount:      1,
            aspectRatio,
            personGeneration: 'allow_adult',
            safetyFilterLevel: 'block_few',
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: JSON.stringify(err) }, { status: res.status })
    }

    const data = await res.json()
    const b64  = data?.predictions?.[0]?.bytesBase64Encoded

    if (!b64) {
      return NextResponse.json({ error: 'Sem imagem na resposta' }, { status: 500 })
    }

    return NextResponse.json({ image: 'data:image/png;base64,' + b64 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
