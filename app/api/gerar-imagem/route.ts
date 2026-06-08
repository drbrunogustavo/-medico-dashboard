import { NextResponse } from 'next/server'

const OPENAI_SIZE: Record<string, string> = {
  "9:16": "1024x1536",
  "4:5":  "1024x1536",
  "1:1":  "1024x1024",
}

const GEMINI_ASPECT: Record<string, string> = {
  "9:16": "9:16",
  "4:5":  "4:5",
  "1:1":  "1:1",
}

const FLUX_DIMS: Record<string, { width: number; height: number }> = {
  "9:16": { width: 576,  height: 1024 },
  "4:5":  { width: 768,  height: 960  },
  "1:1":  { width: 1024, height: 1024 },
}

export async function POST(request: Request) {
  const { prompt, formato, modelo } = await request.json() as {
    prompt: string
    formato: string
    modelo: "gpt-image" | "gemini" | "flux"
  }

  try {
    // ── GPT Image (gpt-image-1) ────────────────────────────────────────────────
    if (modelo === "gpt-image") {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY não configurada. Adicione em Vercel → Settings → Environment Variables." },
          { status: 500 }
        )
      }

      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:         "gpt-image-1",
          prompt,
          n:             1,
          size:          OPENAI_SIZE[formato] ?? "1024x1024",
          output_format: "png",
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
        const msg = err.error?.message ?? `OpenAI erro ${res.status}`
        console.error("[gerar-imagem] OpenAI error:", msg)
        return NextResponse.json({ error: msg }, { status: res.status })
      }

      const data = await res.json() as { data?: { b64_json?: string; url?: string }[] }
      const item = data.data?.[0]
      if (item?.b64_json) return NextResponse.json({ image: `data:image/png;base64,${item.b64_json}` })
      if (item?.url)      return NextResponse.json({ image: item.url })
      return NextResponse.json({ error: "OpenAI não retornou imagem. Verifique seu plano de acesso ao gpt-image-1." }, { status: 500 })
    }

    // ── Gemini Imagen ──────────────────────────────────────────────────────────
    if (modelo === "gemini") {
      const apiKey = process.env.GOOGLE_AI_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: "GOOGLE_AI_API_KEY não configurada. Adicione em Vercel → Settings → Environment Variables." },
          { status: 500 }
        )
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances:  [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio: GEMINI_ASPECT[formato] ?? "1:1" },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
        const msg = err.error?.message ?? `Gemini erro ${res.status}`
        console.error("[gerar-imagem] Gemini error:", msg)
        return NextResponse.json({ error: msg }, { status: res.status })
      }

      const data = await res.json() as { predictions?: { bytesBase64Encoded?: string; mimeType?: string }[] }
      const pred = data.predictions?.[0]
      if (!pred?.bytesBase64Encoded) return NextResponse.json({ error: "Gemini não retornou imagem." }, { status: 500 })
      const mime = pred.mimeType ?? "image/png"
      return NextResponse.json({ image: `data:${mime};base64,${pred.bytesBase64Encoded}` })
    }

    // ── Flux (HuggingFace FLUX.1-schnell) ─────────────────────────────────────
    if (modelo === "flux") {
      const hfToken = process.env.HUGGINGFACE_TOKEN
      if (!hfToken) {
        return NextResponse.json(
          { error: "HUGGINGFACE_TOKEN não configurado. Adicione em Vercel → Settings → Environment Variables." },
          { status: 500 }
        )
      }

      const dims = FLUX_DIMS[formato] ?? { width: 1024, height: 1024 }
      const res = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${hfToken}`,
          },
          body: JSON.stringify({
            inputs:     prompt,
            parameters: { ...dims, num_inference_steps: 4 },
          }),
        }
      )

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("[gerar-imagem] Flux error:", text)
        return NextResponse.json({ error: text || `Flux erro ${res.status}` }, { status: res.status })
      }

      const arrayBuffer = await res.arrayBuffer()
      const b64 = Buffer.from(arrayBuffer).toString("base64")
      const ct  = res.headers.get("content-type") ?? "image/jpeg"
      return NextResponse.json({ image: `data:${ct};base64,${b64}` })
    }

    return NextResponse.json({ error: "Modelo inválido" }, { status: 400 })
  } catch (e) {
    console.error("[gerar-imagem]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
