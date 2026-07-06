import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL, getAnthropicClient } from "@/lib/ai-config"


function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const ai = getAnthropicClient()
  try {
    const body = await req.json() as {
      processo:       string
      equipe:         string[]
      nivel_detalhe:  string
      ferramentas:    string[]
    }

    const resp = await ai.messages.create({
      model:      AI_MODEL,
      max_tokens: 4000,
      system: `Você é um especialista em gestão de processos e qualidade para clínicas médicas no Brasil.
Crie SOPs (Procedimentos Operacionais Padrão) claros, práticos e prontos para implementação imediata.
Responda em português brasileiro. Retorne JSON puro, sem markdown, sem texto antes ou depois.`,
      messages: [{
        role: "user",
        content: `Crie um SOP completo para o processo abaixo:

PROCESSO: ${body.processo}
EQUIPE ENVOLVIDA: ${body.equipe.join(", ")}
NÍVEL DE DETALHE: ${body.nivel_detalhe}
FERRAMENTAS/SISTEMAS: ${body.ferramentas.length > 0 ? body.ferramentas.join(", ") : "Nenhuma especificada"}

Retorne JSON com EXATAMENTE esta estrutura:
{
  "titulo": "Título conciso do SOP",
  "objetivo": "Objetivo do procedimento em 1-2 frases",
  "responsavel_principal": "Cargo responsável",
  "frequencia": "Quando executar (ex: A cada consulta, Diariamente, etc.)",
  "tempo_estimado": "Tempo médio de execução",
  "materiais_necessarios": ["Material 1", "Material 2"],
  "passos": [
    {
      "numero": 1,
      "titulo": "Título do passo",
      "descricao": "Descrição detalhada do que fazer",
      "responsavel": "Quem executa",
      "tempo": "Tempo estimado",
      "observacao": "Observação importante (opcional, pode ser vazio)"
    }
  ],
  "pontos_atencao": ["Ponto crítico 1", "Ponto crítico 2"],
  "indicadores": ["Indicador de qualidade para monitorar"],
  "revisao": "Frequência de revisão deste SOP"
}

Gere entre 5-12 passos dependendo do nível de detalhe solicitado.`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx   = clean.indexOf("{")
    const data  = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)

    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/sops/gerar]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
