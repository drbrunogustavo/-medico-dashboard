import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 60


function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const ai = getAnthropicClient()
  try {
    const body = await req.json() as {
      tipo:         string
      situacao:     string
      tom:          string
      nome_medico:  string
      especialidade: string
    }

    const resp = await ai.messages.create({
      model:      AI_MODEL,
      max_tokens: 2000,
      system: `Você é um especialista em comunicação médica e gestão de consultórios no Brasil.
Crie scripts profissionais, humanizados e prontos para uso imediato.
Escreva em português brasileiro. Retorne apenas o script, sem explicações ou metadados adicionais.`,
      messages: [{
        role: "user",
        content: `Crie um script de ${body.tipo} para o médico abaixo.

MÉDICO: ${body.nome_medico}
ESPECIALIDADE: ${body.especialidade}
SITUAÇÃO: ${body.situacao}
TOM DESEJADO: ${body.tom}

O script deve:
- Ser prático e direto ao ponto
- Usar linguagem adequada ao tom solicitado
- Incluir [variáveis entre colchetes] onde o usuário deve personalizar
- Ter entre 100-300 palavras
- Ser estruturado com saudação, corpo e fechamento quando aplicável

Retorne APENAS o texto do script, sem títulos, sem explicações.`,
      }],
    })

    const texto = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
    return NextResponse.json({ texto })
  } catch (e) {
    console.error("[api/scripts/gerar]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
