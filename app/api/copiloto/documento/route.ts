import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 30

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const client = getAnthropicClient()

  const { tipo, resumo, plano, nomePaciente } = await req.json() as {
    tipo:          "carta" | "atestado"
    resumo:        string
    plano?:        string
    nomePaciente?: string
  }

  if (!tipo || !resumo?.trim()) {
    return NextResponse.json({ error: "tipo e resumo são obrigatórios" }, { status: 400 })
  }

  const paciente = nomePaciente ?? "Paciente"
  const hoje     = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  const prompts: Record<string, string> = {
    carta: `Escreva uma carta de encaminhamento médico formal e completa, em português brasileiro.

DADOS DO CASO:
Paciente: ${paciente}
Data: ${hoje}

RESUMO CLÍNICO:
${resumo.slice(0, 1500)}
${plano ? `\nPLANO TERAPÊUTICO:\n${plano.slice(0, 600)}` : ""}

A carta deve:
- Ter cabeçalho formal com data e referência ao colega especialista
- Apresentar o paciente, queixa principal e história resumida
- Indicar a hipótese diagnóstica e o motivo do encaminhamento
- Mencionar os exames já realizados e o tratamento em curso
- Solicitar avaliação/conduta especializada
- Encerrar com cordialidade profissional
- Tom: formal, objetivo, linguagem médica

Retorne APENAS o texto da carta, sem marcações JSON.`,

    atestado: `Escreva um atestado médico formal e completo, em português brasileiro.

DADOS DO CASO:
Paciente: ${paciente}
Data: ${hoje}

RESUMO CLÍNICO:
${resumo.slice(0, 1000)}
${plano ? `\nCONDUTA:\n${plano.slice(0, 400)}` : ""}

O atestado deve:
- Ser breve, objetivo e formal
- Identificar o paciente pelo nome
- Indicar que o médico atendeu o paciente na data de hoje
- Declarar que o paciente necessita de repouso/afastamento (inferir do contexto clínico)
- Indicar o número de dias de afastamento recomendados (baseado no caso)
- Incluir espaço para CID, número de dias e assinatura
- Tom: formal, linguagem médico-legal adequada

Retorne APENAS o texto do atestado, sem marcações JSON.`,
  }

  try {
    const resp = await client.messages.create({
      model:      AI_MODEL,
      max_tokens: 1200,
      system:     "Você é um médico assistente especializado em redação médica formal brasileira. Produza documentos clínicos precisos, formais e adequados ao contexto legal-médico do Brasil.",
      messages: [{ role: "user", content: prompts[tipo] }],
    })

    const texto = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
    return NextResponse.json({ texto: texto.trim() })
  } catch (e) {
    console.error("[copiloto/documento]", errMsg(e))
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
