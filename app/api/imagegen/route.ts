// Salvar em: app/api/imagegen/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { tema, formato } = await request.json()

  // Dimensões por formato
  const dims: Record<string, { w: number; h: number }> = {
    'feed-retrato': { w: 1080, h: 1350 },
    'quadrado':     { w: 1080, h: 1080 },
    'stories':      { w: 1080, h: 1920 },
    'reels-capa':   { w: 1080, h: 1920 },
  }
  const { w, h } = dims[formato] ?? { w: 1080, h: 1350 }

  const prompt = [
    'cinematic medical photography, photorealistic, ultra detailed, 8K,',
    'professional doctor in elegant dark environment,',
    'warm golden amber bokeh background, soft dramatic lighting, depth of field,',
    'sophisticated luxury aesthetic, dark moody tones with golden highlights,',
    'medical laboratory setting softly out of focus,',
    'professional attire, high-end editorial style,',
    'theme: ' + tema + ',',
    'no text, no watermarks, no logos,',
    'Brazilian medical influencer content aesthetic',
  ].join(' ')

  const encoded = encodeURIComponent(prompt)
  const seed    = Math.floor(Math.random() * 999999)
  const url     = `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&seed=${seed}&model=flux&nologo=true&enhance=true`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'medico-dashboard/1.0' },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Pollinations retornou status ${res.status}` },
        { status: 500 }
      )
    }

    const buffer     = await res.arrayBuffer()
    const base64     = Buffer.from(buffer).toString('base64')
    const mimeType   = res.headers.get('content-type') || 'image/jpeg'

    return NextResponse.json({
      image: `data:${mimeType};base64,${base64}`,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
