import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type TipoAnalise = "estrategia" | "posicionamento" | "pontos_fracos" | "completa"

interface ConcorrentesRequest {
  nome:           string
  instagram?:     string
  especialidade?: string
  tipo:           TipoAnalise
  contexto?:      string
}

const TIPO_FOCO: Record<TipoAnalise, string> = {
  estrategia:     "Aprofunde especialmente a estratégia de conteúdo: frequência, formatos, temas, ganchos e padrões de engajamento.",
  posicionamento: "Aprofunde especialmente o posicionamento: proposta de valor, público-alvo, linguagem e diferenciais.",
  pontos_fracos:  "Aprofunde especialmente os pontos fracos e gaps: onde ele falha, o que está ausente, como Dr. Bruno pode se beneficiar.",
  completa:       "Faça uma análise completa e aprofundada de todas as dimensões. Seja detalhado em todos os campos.",
}

const SYSTEM = `Você é um especialista sênior em marketing médico digital e inteligência competitiva para médicos no Brasil. Analisa perfis de concorrentes no Instagram com profundidade estratégica — identifica padrões de conteúdo, gaps de posicionamento e oportunidades de diferenciação.

Suas análises são objetivas, específicas e sempre orientadas para ação. Você conhece o nicho de Endocrinologia, Nutrologia, Longevidade e Clínica Geral no Brasil.

Responda sempre em português brasileiro.

Retorne APENAS JSON válido, sem markdown, sem código, sem texto antes ou depois.`

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as ConcorrentesRequest
    const { nome, instagram, especialidade, tipo, contexto } = body

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome do concorrente é obrigatório." }, { status: 400 })
    }

    const tipoLabel =
      tipo === "estrategia"     ? "Estratégia de Conteúdo" :
      tipo === "posicionamento" ? "Posicionamento" :
      tipo === "pontos_fracos"  ? "Pontos Fracos / Oportunidades" :
                                  "Análise Completa"

    const userMsg = `Analise o seguinte concorrente médico para o Dr. Bruno Gustavo (Clínico Geral, Endocrinologia e Nutrologia, baseado no Brasil, foco em longevidade e saúde hormonal).

CONCORRENTE:
- Nome: ${nome}${instagram ? `\n- Instagram: @${instagram.replace("@", "")}` : ""}${especialidade ? `\n- Especialidade: ${especialidade}` : ""}${contexto ? `\n\nContexto adicional:\n${contexto}` : ""}

TIPO DE ANÁLISE: ${tipoLabel}
${TIPO_FOCO[tipo]}

Retorne um JSON com EXATAMENTE esta estrutura (todos os valores em português brasileiro):
{
  "visao_geral": {
    "resumo": "2-3 frases descrevendo o perfil e presença digital do concorrente",
    "seguidores_estimados": "ex: 80 mil seguidores",
    "frequencia_posting": "ex: 5-7 posts por semana",
    "formatos_principais": ["Reels", "Carrossel", "Stories"],
    "especialidade_percebida": "como ele se posiciona publicamente — ex: 'especialista em emagrecimento'"
  },
  "estrategia_conteudo": {
    "frequencia": "descrição da cadência e consistência de posts",
    "formatos": [
      { "tipo": "Reels", "percentual": "60%", "observacao": "foco em educação rápida" }
    ],
    "temas_recorrentes": ["Tema 1", "Tema 2", "Tema 3", "Tema 4"],
    "ganchos_tipicos": ["padrão de abertura 1", "padrão de abertura 2", "padrão de abertura 3"],
    "analise_geral": "2-3 frases avaliando a estratégia geral de conteúdo"
  },
  "posicionamento": {
    "proposta_valor": "o que ele entrega de único ao seguidor",
    "publico_alvo": "quem ele atrai e por quê",
    "tom_comunicacao": "como ele se comunica — formal, casual, técnico, empático, etc.",
    "diferenciais": ["diferencial 1", "diferencial 2", "diferencial 3"],
    "comparacao_com_voce": "onde ele se diferencia ou se assemelha ao Dr. Bruno Gustavo"
  },
  "pontos_fracos": [
    {
      "gap": "nome curto do gap (ex: Falta de conteúdo sobre longevidade)",
      "oportunidade": "o que isso representa como oportunidade de mercado",
      "como_aproveitar": "ação concreta e específica que Dr. Bruno pode tomar",
      "prioridade": "Alta"
    }
  ],
  "recomendacoes": [
    {
      "acao": "título curto da ação (ex: Série semanal sobre hormônios masculinos)",
      "justificativa": "por que fazer isso com base na análise deste concorrente",
      "formato_sugerido": "ex: 3 Reels + 1 Carrossel por semana",
      "prioridade": "Alta"
    }
  ]
}

Gere exatamente 3-4 itens em pontos_fracos e 4-5 itens em recomendacoes. Seja específico — evite generalizações.`

    const resp = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system:     SYSTEM,
      messages:   [{ role: "user", content: userMsg }],
    })

    let text = ""
    for (const block of resp.content) {
      if (block.type === "text") text += block.text
    }

    const clean = text.replace(/```json|```/g, "").trim()
    const idx   = clean.indexOf("{")
    const data  = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)

    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/concorrentes]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
