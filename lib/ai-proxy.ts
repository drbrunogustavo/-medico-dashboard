import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { originGuard } from "@/lib/check-origin"
import { AI_MODEL } from "@/lib/ai-config"
import { captureAnthropicError } from "@/lib/anthropic"

const MAX_MENSAGENS = 10
const MAX_CARACTERES = 40000
const MAX_SYSTEM = 20000
const MAX_TOKENS = 8000

type Mensagem = { role: "user" | "assistant"; content: string }
type CorpoValido = { messages: Mensagem[]; system?: string; max_tokens: number }

function validar(raw: unknown): CorpoValido | null {
  if (!raw || typeof raw !== "object") return null
  const b = raw as Record<string, unknown>
  if (!Array.isArray(b.messages) || b.messages.length < 1 || b.messages.length > MAX_MENSAGENS) return null
  let total = 0
  const messages: Mensagem[] = []
  for (const m of b.messages) {
    if (!m || typeof m !== "object") return null
    const { role, content } = m as Record<string, unknown>
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) return null
    total += content.length
    messages.push({ role, content })
  }
  if (total > MAX_CARACTERES) return null
  let system: string | undefined
  if (b.system !== undefined) {
    if (typeof b.system !== "string" || b.system.length > MAX_SYSTEM) return null
    system = b.system
  }
  const mt = b.max_tokens
  const max_tokens = typeof mt === "number" && Number.isInteger(mt) && mt >= 1 && mt <= MAX_TOKENS ? mt : 1500
  return { messages, system, max_tokens }
}

/**
 * Repassa uma chamada de texto para a Anthropic. Aceita só mensagens de texto, system e max_tokens
 * dentro de limites; o modelo é fixo e qualquer outro campo (tools, stream etc.) é descartado.
 * O corpo da Anthropic volta como veio, porque os clientes leem o erro dentro dele.
 */
export async function repassarClaude(request: NextRequest, tag: string): Promise<NextResponse> {
  const bloqueio = originGuard(request)
  if (bloqueio) return bloqueio
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const corpo = validar(await request.json().catch(() => null))
  if (!corpo) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ ...corpo, model: AI_MODEL }),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    captureAnthropicError(e, tag)
    console.error(tag, e)
    return NextResponse.json({ error: "Erro ao gerar conteúdo. Tente novamente." }, { status: 500 })
  }
}
