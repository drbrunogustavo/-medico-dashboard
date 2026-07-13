import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 60

interface CasoClinico {
  historia_clinica:    string
  exames_sugeridos:    string
  prescricao_sugerida: string
  protocolo:           string
  orientacoes:         string
  retorno_previsto:    string
  conteudo_instagram:  string
  carta_paciente:      string
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { relato, dados, nomePaciente, tipoConsulta } = await req.json() as {
    relato?:       string
    dados?:        string
    nomePaciente?: string
    tipoConsulta?: string
  }

  if (!relato?.trim()) return NextResponse.json({ error: "relato obrigatório" }, { status: 400 })

  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role:    "user",
      content: `Você é um assistente médico clínico experiente. Analise o caso abaixo e retorne um JSON estruturado com 8 seções. Seja específico, clínico e prático.

CASO CLÍNICO:
Paciente: ${nomePaciente ?? "não informado"}
Tipo de consulta: ${tipoConsulta ?? "não especificado"}
Relato: ${relato.trim()}
${dados?.trim() ? `\nDados objetivos:\n${dados.trim()}` : ""}

Retorne APENAS o JSON abaixo, sem markdown:
{
  "historia_clinica":    "anamnese estruturada e exame físico relevante (3-5 linhas)",
  "exames_sugeridos":    "lista de exames com justificativa clínica (bullet points)",
  "prescricao_sugerida": "prescrição detalhada com doses, frequência e duração (bullet points)",
  "protocolo":           "protocolo clínico aplicável à condição e conduta passo a passo (bullet points)",
  "orientacoes":         "orientações ao paciente em linguagem acessível (bullet points)",
  "retorno_previsto":    "prazo e critérios para retorno ou reavaliação (1-2 linhas)",
  "conteudo_instagram":  "legenda educativa para Instagram sobre o tema clínico, sem identificar o paciente (3-5 linhas + hashtags)",
  "carta_paciente":      "carta resumo do atendimento para entregar ao paciente, em linguagem simples (5-8 linhas)"
}`,
    }],
  })

  const raw = msg.content.find(b => b.type === "text")?.text ?? "{}"
  let caso: Partial<CasoClinico> = {}
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const s = cleaned.indexOf("{"); const e = cleaned.lastIndexOf("}")
    caso = JSON.parse(s !== -1 && e > s ? cleaned.slice(s, e + 1) : cleaned) as Partial<CasoClinico>
  } catch { /* retorna parcial */ }

  return NextResponse.json({ caso })
}
