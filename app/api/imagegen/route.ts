// Salvar em: app/api/imagegen/route.ts
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: Request) {
  const { tema, formato } = await request.json()

  const dims: Record<string, { w: number; h: number }> = {
    'feed-retrato': { w: 1080, h: 1350 },
    'quadrado':     { w: 1080, h: 1080 },
    'stories':      { w: 1080, h: 1920 },
    'reels-capa':   { w: 1080, h: 1920 },
  }
  const { w, h } = dims[formato] ?? { w: 1080, h: 1350 }

  const promptText = `cinematic medical photography, professional doctor, dark moody studio, warm golden bokeh, dramatic lighting, luxury aesthetic, ${tema}, photorealistic, 8K, no text`
  const seed = Math.floor(Math.random() * 99999)

  // ── Opção 1: Pollinations (sem nologo — requer conta premium) ────────────
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=${w}&height=${h}&seed=${seed}&model=flux`

  try {
    const ctrl    = new AbortController()
    const timer   = setTimeout(() => ctrl.abort(), 30000)
    const res     = await fetch(pollinationsUrl, {
      signal:  ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MedContent/1.0)',
        'Accept':     'image/*',
      },
    })
    clearTimeout(timer)

    if (res.ok && res.headers.get('content-type')?.startsWith('image')) {
      const buf    = await res.arrayBuffer()
      const b64    = Buffer.from(buf).toString('base64')
      const mime   = res.headers.get('content-type') || 'image/jpeg'
      return NextResponse.json({ image: `data:${mime};base64,${b64}` })
    }
  } catch { /* tenta próximo */ }

  // ── Opção 2: Hugging Face Inference API (FLUX.1-schnell) ─────────────────
  const hfToken = process.env.HUGGINGFACE_TOKEN
  if (hfToken) {
    try {
      const ctrl  = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 50000)
      const res   = await fetch(
        'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
        {
          method:  'POST',
          signal:  ctrl.signal,
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            inputs: promptText,
            parameters: { width: w > 1024 ? 1024 : w, height: h > 1024 ? 1024 : h },
          }),
        }
      )
      clearTimeout(timer)

      if (res.ok) {
        const buf  = await res.arrayBuffer()
        const b64  = Buffer.from(buf).toString('base64')
        const mime = res.headers.get('content-type') || 'image/jpeg'
        return NextResponse.json({ image: `data:${mime};base64,${b64}` })
      }
    } catch { /* tenta próximo */ }
  }

  // ── Opção 3: Gemini Imagen (requer billing) ───────────────────────────────
  const googleKey = process.env.GOOGLE_AI_API_KEY
  if (googleKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${googleKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate image: ${promptText}` }] }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          }),
        }
      )
      if (res.ok) {
        const data    = await res.json()
        const imgPart = data?.candidates?.[0]?.content?.parts?.find(
          (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
        )
        if (imgPart?.inlineData?.data) {
          const mime = imgPart.inlineData.mimeType || 'image/png'
          return NextResponse.json({ image: `data:${mime};base64,${imgPart.inlineData.data}` })
        }
      }
    } catch { /* falhou */ }
  }

  return NextResponse.json({
    error: 'Não foi possível gerar a imagem. Para ativar esta função, adicione HUGGINGFACE_TOKEN nas variáveis de ambiente do Vercel. Chave gratuita em: huggingface.co/settings/tokens',
  }, { status: 500 })
}
