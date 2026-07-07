import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 15

const ROTAS: Record<string, string> = {
  "/dashboard":          "Painel principal",
  "/agenda":             "Agenda de consultas",
  "/pacientes":          "Lista de pacientes",
  "/copiloto":           "Copiloto de Consulta",
  "/executivo":          "Painel Executivo",
  "/crm":                "CRM de leads",
  "/nps":                "NPS e satisfação",
  "/pautas":             "Banco de Pautas",
  "/radar":              "Radar de Tendências",
  "/prescricao":         "Prescrição e Conduta",
  "/protocolos":         "Protocolos Clínicos",
  "/emagrecimento":      "Emagrecimento Inteligente",
  "/interpretacao-exames":"Interpretação de Exames",
  "/imagens":            "Gerador de Imagens",
  "/roteiros":           "Roteiros de Vídeo",
  "/carrossel":          "Carrossel",
  "/reels":              "Reels",
  "/stories":            "Stories",
  "/ganchos":            "Biblioteca de Ganchos",
  "/posicionamento":     "Posicionamento Médico",
  "/financeiro":         "Financeiro",
  "/calendario":         "Calendário Editorial",
  "/praxis-ia":          "Hub de IA",
  "/memoria":            "Memória Clínica",
  "/diagnostico":        "Diagnóstico 360°",
}

interface CopilotResult {
  action:   "navigate" | "suggest"
  route?:   string
  message:  string
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { query, currentPath } = await req.json() as { query: string; currentPath: string }
  if (!query?.trim()) return NextResponse.json({ error: "query obrigatória" }, { status: 400 })

  const rotasList = Object.entries(ROTAS)
    .map(([href, desc]) => `${href} → ${desc}`)
    .join("\n")

  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Você é um assistente de navegação do sistema PRAXIS (plataforma para médicos). O usuário está em "${currentPath}" e digitou: "${query}"

Rotas disponíveis:
${rotasList}

Interprete a intenção e retorne JSON com uma das seguintes formas:
- Navegação simples: {"action":"navigate","route":"/rota","message":"Abrindo [nome]..."}
- Navegação com busca: {"action":"navigate","route":"/rota?busca=termo","message":"Buscando [termo]..."}
- Sem rota clara: {"action":"suggest","message":"Dica ou sugestão curta (≤15 palavras)"}

Retorne APENAS o JSON, sem markdown.`,
    }],
  })

  const raw = msg.content.find(b => b.type === "text")?.text ?? "{}"
  let result: CopilotResult = { action: "suggest", message: "Não entendi. Tente: 'abrir agenda', 'ver pacientes', 'ir para finanças'." }

  try {
    const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()) as CopilotResult
    if (parsed.action === "navigate" && parsed.route) {
      const base = parsed.route.split("?")[0]
      if (!ROTAS[base]) {
        result = { action: "suggest", message: `Rota não encontrada. Tente: ${Object.keys(ROTAS).slice(0, 4).join(", ")}` }
      } else {
        result = parsed
      }
    } else {
      result = parsed
    }
  } catch { /* usa default */ }

  return NextResponse.json(result)
}
