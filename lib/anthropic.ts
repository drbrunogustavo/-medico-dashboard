import Anthropic from "@anthropic-ai/sdk"
import * as Sentry from "@sentry/nextjs"

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY não configurada")
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

/**
 * Reporta erros de rotas de IA ao Sentry com contexto de provider/route.
 * Usar em todos os catch blocks de rotas que chamam a Anthropic API.
 */
export function captureAnthropicError(e: unknown, route: string): void {
  Sentry.captureException(e, {
    tags: { provider: "anthropic", route },
    level: "error",
  })
}
