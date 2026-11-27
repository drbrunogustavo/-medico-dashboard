import { AI_MODEL } from "@/lib/ai-config"

export class ErroIA extends Error {
  constructor(public codigo: "limite" | "resposta" | "rede", mensagem: string) { super(mensagem) }
}

/**
 * Envia um prompt para uma rota de IA (/api/roteiros, /api/titulos etc.) e devolve o JSON da resposta.
 * As rotas repassam o corpo da Anthropic com status 200, então o erro vem dentro do corpo
 * (`{ type: "error", error: { type: "rate_limit_error" } }`) e não no status HTTP.
 */
export async function pedirJSON<T>(url: string, prompt: string, maxTokens: number): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
    })
  } catch {
    throw new ErroIA("rede", "Erro de conexão. Tente novamente.")
  }
  const data = await res.json().catch(() => ({})) as { content?: { text?: string }[]; error?: { type?: string } | string }
  const tipoErro = typeof data.error === "object" ? data.error?.type : undefined
  if (res.status === 429 || tipoErro === "rate_limit_error")
    throw new ErroIA("limite", "Limite de requisições atingido. Aguarde 1 minuto e tente novamente.")
  if (!res.ok || data.error)
    throw new ErroIA("resposta", "O serviço de IA não respondeu. Tente novamente.")

  const raw = (data.content?.[0]?.text || "{}").replace(/```json/g, "").replace(/```/g, "").trim()
  const ini = raw.indexOf("{")
  try {
    return JSON.parse(ini >= 0 ? raw.slice(ini) : raw) as T
  } catch {
    throw new ErroIA("resposta", "A resposta da IA veio incompleta. Tente novamente.")
  }
}

export const mensagemErroIA = (e: unknown, padrao: string) => (e instanceof ErroIA ? e.message : padrao)
