import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAIJson(text: string): any {
  try { return JSON.parse(text) } catch { /* continua */ }
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  try { return JSON.parse(stripped) } catch { /* continua */ }
  const m1 = stripped.match(/\{[\s\S]*\}/)
  if (m1) { try { return JSON.parse(m1[0]) } catch { /* continua */ } }
  const m2 = stripped.match(/\[[\s\S]*\]/)
  if (m2) { try { return JSON.parse(m2[0]) } catch { /* continua */ } }
  throw new Error(`IA retornou resposta n\u00e3o parse\u00e1vel como JSON: ${text.slice(0, 120)}\u2026`)
}
export const maxDuration = 60


const SYSTEM = `Você é um copywriter médico especialista em campanhas de alto desempenho para médicos brasileiros.
Crie conteúdo profissional, ético, persuasivo e altamente eficaz.
Retorne SEMPRE JSON válido puro, sem markdown, sem texto antes ou depois do JSON.`

function extractJSON(text: string): string {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  const s = cleaned.indexOf("{")
  const e = cleaned.lastIndexOf("}")
  if (s !== -1 && e !== -1 && e > s) return cleaned.slice(s, e + 1)
  return cleaned
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const client = getAnthropicClient()
  try {
    const { tema, publico, objetivo, duracao, tom, parte } = await req.json()

    const ctx = `Tema da campanha: ${tema}
Público-alvo: ${publico}
Objetivo: ${objetivo}
Duração: ${duracao}
Tom: ${tom}`

    const prompt =
      parte === 1
        ? `Crie 3 roteiros de Reels (60 segundos cada) e uma landing page completa para esta campanha médica:

${ctx}

Retorne apenas JSON válido, sem markdown:
{
  "roteiros": [
    {
      "titulo": "título do roteiro",
      "gancho": "abertura impactante nos primeiros 5 segundos",
      "estrutura": "roteiro completo com indicações de cena e fala, detalhado",
      "cta": "chamada para ação final do vídeo",
      "promptImagem": "prompt detalhado em inglês para gerar a capa do reel com IA"
    }
  ],
  "landingPage": {
    "headline": "headline principal impactante",
    "subtitulo": "subtítulo explicativo",
    "beneficios": [
      { "titulo": "benefício 1", "descricao": "descrição detalhada" },
      { "titulo": "benefício 2", "descricao": "descrição detalhada" },
      { "titulo": "benefício 3", "descricao": "descrição detalhada" }
    ],
    "provaSocial": "modelo de depoimento para inspirar coleta de depoimentos reais",
    "ctaTexto": "texto do botão principal de conversão",
    "ctaUrgencia": "texto de escassez ou urgência abaixo do botão",
    "faq": [
      { "pergunta": "pergunta 1", "resposta": "resposta completa" },
      { "pergunta": "pergunta 2", "resposta": "resposta completa" },
      { "pergunta": "pergunta 3", "resposta": "resposta completa" },
      { "pergunta": "pergunta 4", "resposta": "resposta completa" },
      { "pergunta": "pergunta 5", "resposta": "resposta completa" }
    ],
    "ctaSecundario": "texto do CTA secundário no rodapé"
  }
}`
        : `Crie anúncios (3 variações para Feed, Stories e Reels), sequência de 7 dias de stories e mensagens de WhatsApp para esta campanha médica:

${ctx}

Retorne apenas JSON válido, sem markdown:
{
  "anuncios": {
    "feed": [
      { "variacao": "Conservador", "headline": "headline curta", "texto": "texto 2-3 linhas", "cta": "..." },
      { "variacao": "Equilibrado", "headline": "...", "texto": "...", "cta": "..." },
      { "variacao": "Agressivo",   "headline": "...", "texto": "...", "cta": "..." }
    ],
    "stories": [
      { "variacao": "Conservador", "headline": "linha 1", "texto": "linhas 2 e 3", "cta": "..." },
      { "variacao": "Equilibrado", "headline": "...", "texto": "...", "cta": "..." },
      { "variacao": "Agressivo",   "headline": "...", "texto": "...", "cta": "..." }
    ],
    "reels": [
      { "variacao": "Conservador", "headline": "gancho de abertura", "texto": "narração 15s", "cta": "..." },
      { "variacao": "Equilibrado", "headline": "...", "texto": "...", "cta": "..." },
      { "variacao": "Agressivo",   "headline": "...", "texto": "...", "cta": "..." }
    ]
  },
  "stories": [
    { "dia": 1, "tipo": "Educativo",  "texto": "máximo 3 linhas curtas", "sugestaoVisual": "...", "sticker": "..." },
    { "dia": 2, "tipo": "Depoimento", "texto": "...", "sugestaoVisual": "...", "sticker": "..." },
    { "dia": 3, "tipo": "Bastidores", "texto": "...", "sugestaoVisual": "...", "sticker": "..." },
    { "dia": 4, "tipo": "Oferta",     "texto": "...", "sugestaoVisual": "...", "sticker": "..." },
    { "dia": 5, "tipo": "FAQ",        "texto": "...", "sugestaoVisual": "...", "sticker": "..." },
    { "dia": 6, "tipo": "Educativo",  "texto": "...", "sugestaoVisual": "...", "sticker": "..." },
    { "dia": 7, "tipo": "Oferta",     "texto": "...", "sugestaoVisual": "...", "sticker": "..." }
  ],
  "whatsapp": {
    "abertura": "mensagem inicial para lista de transmissão, casual e não spam",
    "followUps": [
      { "dia": 1, "mensagem": "..." },
      { "dia": 3, "mensagem": "..." },
      { "dia": 7, "mensagem": "..." }
    ],
    "fechamento": "mensagem final de urgência e escassez",
    "respostaObjecao": "resposta pronta para a objeção mais comum desta campanha"
  }
}`

    const resp = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    })

    const text = resp.content.find((b) => b.type === "text")?.text ?? "{}"
    const data = parseAIJson(extractJSON(text))
    return NextResponse.json(data)
  } catch (err) {
    captureAnthropicError(err, "/api/ofertas")
    console.error(err)
    return NextResponse.json({ error: "Erro ao gerar campanha" }, { status: 500 })
  }
}
