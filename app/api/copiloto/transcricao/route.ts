import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY não configurado." }, { status: 503 })
  }

  const form  = await req.formData()
  const audio = form.get("audio") as File | null
  if (!audio) return NextResponse.json({ error: "Campo 'audio' obrigatório." }, { status: 400 })
  if (audio.size > 25 * 1024 * 1024)
    return NextResponse.json({ error: "Áudio excede 25MB." }, { status: 413 })

  const groqForm = new FormData()
  groqForm.append("file", audio, audio.name || "audio.webm")
  groqForm.append("model", "whisper-large-v3")
  groqForm.append("language", "pt")
  groqForm.append("response_format", "json")

  const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method:  "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body:    groqForm,
  })

  if (!groqRes.ok) {
    const err = await groqRes.text()
    console.error("[copiloto/transcricao] Groq error:", err)
    return NextResponse.json({ error: "Falha na transcrição. Tente novamente." }, { status: 502 })
  }

  const data = await groqRes.json() as { text: string }
  return NextResponse.json({ text: data.text ?? "" })
}
