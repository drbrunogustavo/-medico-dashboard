// Salvar em: app/api/imagegen/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { tema, formato } = await request.json()

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_AI_API_KEY não configurada' }, { status: 500 })
  }

  const prompt = [
    'Generate a photorealistic cinematic medical photography image.',
    'Style: dark moody background, warm golden amber bokeh, soft dramatic lighting, depth of field.',
    'A professional doctor or medical professional in elegant attire.',
    'High-end luxury aesthetic, sophisticated atmosphere.',
    'Medical or clinical environment softly visible out of focus in background.',
    'Theme of the image: ' + tema + '.',
    'No text, no watermarks, no logos, no captions.',
    'Ultra-realistic, 8K quality, editorial photography style.',
    'Inspired by high-end Brazilian medical influencer content aesthetics.',
  ].join(' ')

  // Tenta modelos em ordem de preferência
  const models = [
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.0-flash-exp',
  ]

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        // Se modelo não encontrado, tenta o próximo
        if (err?.error?.code === 404 || err?.error?.status === 'NOT_FOUND') continue
        return NextResponse.json({ error: JSON.stringify(err) }, { status: res.status })
      }

      const data = await res.json()
      const parts = data?.candidates?.[0]?.content?.parts ?? []
      const imgPart = parts.find((p: {inlineData?: {mimeType: string; data: string}}) => p.inlineData)

      if (imgPart?.inlineData?.data) {
        const mime = imgPart.inlineData.mimeType || 'image/png'
        return NextResponse.json({
          image: `data:${mime};base64,${imgPart.inlineData.data}`,
          model,
        })
      }
    } catch (e) {
      console.error(`Model ${model} failed:`, e)
      continue
    }
  }

  return NextResponse.json({
    error: 'Nenhum modelo disponível gerou a imagem. Verifique se sua chave do Google AI Studio tem acesso à geração de imagens em aistudio.google.com.',
  }, { status: 500 })
}
