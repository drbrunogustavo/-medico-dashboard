import { NextResponse } from 'next/server'
import { captureAnthropicError } from "@/lib/anthropic"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { checkAiRateLimit } from "@/lib/rate-limit"
import { logAiUsage } from "@/lib/log-ai-usage"

export async function POST(request: Request) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data: planoData } = await supabase.from("user_planos").select("plano").eq("user_id", auth.userId).maybeSingle()
  const { allowed } = await checkAiRateLimit(auth.userId, planoData?.plano ?? "trial", supabase)
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite mensal de gerações atingido. Faça upgrade do plano." },
      { status: 429 }
    )
  }
  logAiUsage({ userId: auth.userId, rota: "imagens" })

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
