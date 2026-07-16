import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"

export const maxDuration = 20

const ROTAS = [
  "/radar", "/pautas", "/calendario", "/copiloto", "/crm", "/nps",
  "/prescricao", "/emagrecimento", "/imagens", "/ganchos", "/reels",
  "/stories", "/carrossel", "/roteiros", "/posicionamento", "/agenda",
  "/nutricao-leads", "/scripts", "/relatorio", "/pacientes",
]

interface SugestaoIA {
  titulo: string
  descricao: string
  href: string
  categoria: "social" | "clinica" | "ia"
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as {
    especialidade?: string
    pautas?: string[]
    metrics?: { leads: number; consultas: number; nps: number | null; posts: number }
  }

  const { especialidade = "", pautas = [], metrics } = body

  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 350,
    messages: [{
      role: "user",
      content: `Você é o PRAXIS IA, assistente estratégico de médicos. Gere 1-2 sugestões práticas para o médico agir HOJE na plataforma. Seja específico e acionável.

Contexto:
- Especialidade: ${especialidade || "não informada"}
- Últimas pautas criadas: ${pautas.length ? pautas.slice(0, 5).join(", ") : "nenhuma"}
- Leads no CRM: ${metrics?.leads ?? 0}
- Consultas este mês: ${metrics?.consultas ?? 0}
- NPS: ${metrics?.nps ?? "não medido"}
- Posts publicados: ${metrics?.posts ?? 0}

Retorne APENAS JSON (array de até 2 objetos):
[{"titulo": "...", "descricao": "...", "href": "/rota", "categoria": "social|clinica|ia"}]

Rotas disponíveis: ${ROTAS.join(", ")}
Regras: titulo ≤ 8 palavras, descricao ≤ 18 palavras, href deve ser uma das rotas listadas.`,
    }],
  })

  const raw = msg.content.find(b => b.type === "text")?.text ?? "[]"
  let sugestoes: SugestaoIA[] = []
  try {
    const stripped = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const s = stripped.indexOf("["); const e = stripped.lastIndexOf("]")
    const parsed = JSON.parse(s !== -1 && e > s ? stripped.slice(s, e + 1) : stripped)
    sugestoes = (Array.isArray(parsed) ? parsed : []).slice(0, 2).filter(
      (s: unknown): s is SugestaoIA =>
        typeof s === "object" && s !== null &&
        typeof (s as SugestaoIA).titulo === "string" &&
        ROTAS.includes((s as SugestaoIA).href)
    )
  } catch { /* retorna vazio */ }

  return NextResponse.json({ sugestoes })
}
