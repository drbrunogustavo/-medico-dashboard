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

  const promptText = `cinematic medical photography, professional doctor, dark moody studio, warm golden bokeh, dramatic lighting, luxury aesthetic, ${tema}, photorealistic, no text, no watermarks`
  const errors: string[] = []

  // ── 1. Pollinations ───────────────────────────────────────────────────────
  try {
    const seed = Math.floor(Math.random() * 99999)
    const url  = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=${w}&height=${h}&seed=${seed}&model=flux`
    const ctrl = new AbortController()
    const t    = setTimeout(() => ctrl.abort(), 30000)
    const res  = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' },
    })
    clearTimeout(t)
    if (res.ok && res.headers.get('content-type')?.startsWith('image')) {
      const buf  = await res.arrayBuffer()
      const b64  = Buffer.from(buf).toString('base64')
      const mime = res.headers.get('content-type') || 'image/jpeg'
      return NextResponse.json({ image: `data:${mime};base64,${b64}`, provider: 'pollinations' })
    }
    errors.push(`Pollinations: status ${res.status}`)
  } catch (e) { errors.push(`Pollinations: ${String(e)}`) }

  // ── 2. Hugging Face — modelos gratuitos ───────────────────────────────────
  const hfToken = process.env.HUGGINGFACE_TOKEN
  if (hfToken) {
    const hfModels = [
      'stabilityai/stable-diffusion-2-1',
      'stabilityai/stable-diffusion-xl-base-1.0',
      'runwayml/stable-diffusion-v1-5',
    ]
    for (const model of hfModels) {
      try {
        const ctrl = new AbortController()
        const t    = setTimeout(() => ctrl.abort(), 45000)
        const res  = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method:  'POST',
          signal:  ctrl.signal,
          headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: promptText }),
        })
        clearTimeout(t)
        if (res.ok) {
          const buf  = await res.arrayBuffer()
          const b64  = Buffer.from(buf).toString('base64')
          const mime = res.headers.get('content-type') || 'image/jpeg'
          return NextResponse.json({ image: `data:${mime};base64,${b64}`, provider: model })
        }
        const errText = await res.text().catch(() => res.status.toString())
        errors.push(`HF ${model}: ${res.status} — ${errText.slice(0, 120)}`)
      } catch (e) { errors.push(`HF ${model}: ${String(e)}`) }
    }
  } else {
    errors.push('HUGGINGFACE_TOKEN não configurada')
  }

  // ── 3. Gemini ─────────────────────────────────────────────────────────────
  const googleKey = process.env.GOOGLE_AI_API_KEY
  if (googleKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${googleKey}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
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
          return NextResponse.json({ image: `data:${mime};base64,${imgPart.inlineData.data}`, provider: 'gemini' })
        }
      }
      const errText = await res.text().catch(() => '')
      errors.push(`Gemini: ${res.status} — ${errText.slice(0, 120)}`)
    } catch (e) { errors.push(`Gemini: ${String(e)}`) }
  }

  // Retorna erros reais para debug
  return NextResponse.json({ error: errors.join(' | ') }, { status: 500 })
}
