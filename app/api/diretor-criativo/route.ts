import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { captureAnthropicError } from "@/lib/anthropic"

export async function POST(request: Request) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const body = await request.json()
  const safeBody = { ...body, model: AI_MODEL }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(safeBody),
    })
    return NextResponse.json(await res.json())
  } catch (e) {
    captureAnthropicError(e, "/api/diretor-criativo")
    console.error(e)
    return NextResponse.json({ error: "Erro ao processar direção criativa" }, { status: 500 })
  }
}
