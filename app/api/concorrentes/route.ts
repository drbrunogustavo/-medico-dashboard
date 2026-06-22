import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type TipoAnalise = "estrategia" | "posicionamento" | "pontos_fracos" | "completa" | "benchmark" | "crescimento_instagram"

interface ConcorrentesRequest {
  nome?:              string
  instagram?:         string
  especialidade?:     string
  tipo:               TipoAnalise
  contexto?:          string
  // benchmark extras
  cidade?:            string
  seguidores_atuais?: string
  posts_semana?:      string
  // crescimento extras
  bio_atual?:         string
  maior_dificuldade?: string
}

const TIPO_FOCO: Record<TipoAnalise, string> = {
  estrategia:             "Aprofunde especialmente a estratégia de conteúdo: frequência, formatos, temas, ganchos e padrões de engajamento.",
  posicionamento:         "Aprofunde especialmente o posicionamento: proposta de valor, público-alvo, linguagem e diferenciais.",
  pontos_fracos:          "Aprofunde especialmente os pontos fracos e gaps: onde ele falha, o que está ausente, como o médico pode se beneficiar.",
  completa:               "Faça uma análise completa e aprofundada de todas as dimensões. Seja detalhado em todos os campos.",
  benchmark:              "Compare os dados informados com os benchmarks reais da especialidade no Instagram médico brasileiro.",
  crescimento_instagram:  "Gere um plano de crescimento no Instagram específico para médicos, orientado a atrair pacientes particulares.",
}

const SYSTEM_CONCORRENTE = `Você é um especialista sênior em marketing médico digital e inteligência competitiva para médicos no Brasil. Analisa perfis de concorrentes no Instagram com profundidade estratégica — identifica padrões de conteúdo, gaps de posicionamento e oportunidades de diferenciação.

Suas análises são objetivas, específicas e sempre orientadas para ação. Você conhece o nicho de Endocrinologia, Nutrologia, Longevidade e Clínica Geral no Brasil.

Responda sempre em português brasileiro.

Retorne APENAS JSON válido, sem markdown, sem código, sem texto antes ou depois.`

const SYSTEM_BENCHMARK = `Você é um especialista em benchmarking de marketing médico digital no Brasil. Você conhece com profundidade as métricas reais de médicos no Instagram em todas as especialidades: Endocrinologia, Nutrologia, Cardiologia, Dermatologia, Ortopedia, Psiquiatria, Clínica Geral, Longevidade, entre outras.

Você faz comparativos objetivos entre o desempenho atual do médico e os benchmarks da especialidade — iniciante, média e top 10%. Suas recomendações são específicas, priorizadas e orientadas para crescimento.

Responda sempre em português brasileiro. Retorne APENAS JSON válido.`

const SYSTEM_CRESCIMENTO = `Você é um estrategista de crescimento no Instagram para médicos no Brasil, especializado em atrair pacientes particulares. Você cria planos de ação concretos, semana a semana, com formatos, frequências e temas específicos.

Seu foco é crescimento orgânico real: não bots, não compra de seguidores, não truques — apenas estratégia de conteúdo inteligente, posicionamento e consistência.

Responda sempre em português brasileiro. Retorne APENAS JSON válido.`

function buildConcorrentePrompt(body: ConcorrentesRequest): string {
  const { nome, instagram, especialidade, tipo, contexto } = body
  const tipoLabel =
    tipo === "estrategia"     ? "Estratégia de Conteúdo" :
    tipo === "posicionamento" ? "Posicionamento" :
    tipo === "pontos_fracos"  ? "Pontos Fracos / Oportunidades" :
                                "Análise Completa"

  return `Analise o seguinte concorrente médico para o médico usuário (Clínico Geral, Endocrinologia e Nutrologia, baseado no Brasil, foco em longevidade e saúde hormonal).

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
    "especialidade_percebida": "como ele se posiciona publicamente"
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
    "tom_comunicacao": "como ele se comunica",
    "diferenciais": ["diferencial 1", "diferencial 2", "diferencial 3"],
    "comparacao_com_voce": "onde ele se diferencia ou se assemelha ao médico usuário"
  },
  "pontos_fracos": [
    {
      "gap": "nome curto do gap",
      "oportunidade": "o que isso representa como oportunidade de mercado",
      "como_aproveitar": "ação concreta e específica que o médico pode tomar",
      "prioridade": "Alta"
    }
  ],
  "recomendacoes": [
    {
      "acao": "título curto da ação",
      "justificativa": "por que fazer isso com base na análise deste concorrente",
      "formato_sugerido": "ex: 3 Reels + 1 Carrossel por semana",
      "prioridade": "Alta"
    }
  ]
}

Gere exatamente 3-4 itens em pontos_fracos e 4-5 itens em recomendacoes. Seja específico.`
}

function buildBenchmarkPrompt(body: ConcorrentesRequest): string {
  const { especialidade, cidade, seguidores_atuais, posts_semana, contexto } = body
  return `Faça um benchmarking detalhado para um médico com o seguinte perfil:

PERFIL DO MÉDICO:
- Especialidade: ${especialidade || "Clínica Geral / Nutrologia / Longevidade"}${cidade ? `\n- Cidade: ${cidade}` : ""}${seguidores_atuais ? `\n- Seguidores atuais: ${seguidores_atuais}` : ""}${posts_semana ? `\n- Posts por semana: ${posts_semana}` : ""}${contexto ? `\n\nContexto adicional:\n${contexto}` : ""}

Compare estes números com os benchmarks reais de médicos na mesma especialidade no Instagram brasileiro. Avalie em 5 dimensões: seguidores, frequência de posts, engajamento estimado, diversidade de formatos, consistência.

Retorne JSON com EXATAMENTE esta estrutura:
{
  "pontuacao_geral": "ex: 6.8/10",
  "posicao_estimada": "ex: Top 35% dos médicos da especialidade no Instagram",
  "nivel": "ex: Em crescimento",
  "comparativo": [
    {
      "metrica": "Seguidores",
      "seu_valor": "${seguidores_atuais || "não informado"}",
      "media_especialidade": "ex: 8.500 seguidores",
      "top10_especialidade": "ex: 45.000+ seguidores",
      "avaliacao": "Abaixo"
    },
    {
      "metrica": "Posts por semana",
      "seu_valor": "${posts_semana || "não informado"}",
      "media_especialidade": "ex: 4 posts/semana",
      "top10_especialidade": "ex: 7-10 posts/semana",
      "avaliacao": "Na média"
    },
    {
      "metrica": "Taxa de engajamento",
      "seu_valor": "estimado com base nos seguidores",
      "media_especialidade": "ex: 2.1%",
      "top10_especialidade": "ex: 5.8%",
      "avaliacao": "Abaixo"
    },
    {
      "metrica": "Diversidade de formatos",
      "seu_valor": "baseado no contexto",
      "media_especialidade": "ex: 2-3 formatos",
      "top10_especialidade": "ex: 4-5 formatos",
      "avaliacao": "Na média"
    },
    {
      "metrica": "Consistência (semanas ativas)",
      "seu_valor": "baseado no contexto",
      "media_especialidade": "ex: 70% das semanas",
      "top10_especialidade": "ex: 95%+ das semanas",
      "avaliacao": "Abaixo"
    }
  ],
  "pontos_fortes": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "lacunas_criticas": ["lacuna 1", "lacuna 2", "lacuna 3"],
  "acoes_prioritarias": [
    "ação concreta 1 para subir no ranking",
    "ação concreta 2",
    "ação concreta 3",
    "ação concreta 4",
    "ação concreta 5"
  ],
  "diagnostico": "Parágrafo de 3-4 frases com diagnóstico honesto e motivador sobre onde este médico está e para onde pode ir em 90 dias."
}

Use benchmarks reais e específicos para a especialidade informada. Seja honesto mas construtivo.`
}

function buildCrescimentoPrompt(body: ConcorrentesRequest): string {
  const { especialidade, instagram, seguidores_atuais, bio_atual, maior_dificuldade, contexto } = body
  return `Crie um plano de crescimento no Instagram para um médico com o seguinte perfil:

PERFIL:
- Especialidade: ${especialidade || "Clínica Geral / Nutrologia / Longevidade"}${instagram ? `\n- Instagram: @${instagram.replace("@", "")}` : ""}${seguidores_atuais ? `\n- Seguidores atuais: ${seguidores_atuais}` : ""}${bio_atual ? `\n- Bio atual: ${bio_atual}` : ""}${maior_dificuldade ? `\n- Maior dificuldade: ${maior_dificuldade}` : ""}${contexto ? `\n\nContexto adicional:\n${contexto}` : ""}

Objetivo: crescer seguidores reais e atrair pacientes particulares em 90 dias.

Retorne JSON com EXATAMENTE esta estrutura:
{
  "pontuacao": 68,
  "nivel": "Em crescimento",
  "meta_realista": "ex: +2.400 seguidores em 90 dias com consistência",
  "analise_atual": "2-3 frases descrevendo o estado atual e o principal gap a resolver",
  "bio_otimizada": "Bio completa otimizada para o Instagram, máximo 150 caracteres, com emoji, especialidade, proposta de valor e CTA",
  "acoes_90_dias": [
    {
      "semana": "Semanas 1-2",
      "acao": "Título curto da ação prioritária",
      "motivo": "Por que isso vai gerar crescimento nesta fase",
      "formato": "ex: 3 Reels + 2 Stories por semana"
    },
    {
      "semana": "Semanas 3-4",
      "acao": "Segunda ação",
      "motivo": "Motivo",
      "formato": "Formato"
    },
    {
      "semana": "Semanas 5-8",
      "acao": "Terceira ação",
      "motivo": "Motivo",
      "formato": "Formato"
    },
    {
      "semana": "Semanas 9-12",
      "acao": "Quarta ação",
      "motivo": "Motivo",
      "formato": "Formato"
    }
  ],
  "temas_que_mais_convertem": [
    "tema 1 com alto potencial para a especialidade",
    "tema 2",
    "tema 3",
    "tema 4",
    "tema 5"
  ],
  "hashtags_recomendadas": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"],
  "erros_evitar": [
    "erro comum 1 que médicos cometem",
    "erro comum 2",
    "erro comum 3"
  ]
}

Seja específico, prático e orientado a resultados. Evite conselhos genéricos.`
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as ConcorrentesRequest
    const { tipo } = body

    let system: string
    let userMsg: string
    let maxTokens = 4000

    if (tipo === "benchmark") {
      system  = SYSTEM_BENCHMARK
      userMsg = buildBenchmarkPrompt(body)
    } else if (tipo === "crescimento_instagram") {
      system   = SYSTEM_CRESCIMENTO
      userMsg  = buildCrescimentoPrompt(body)
      maxTokens = 3500
    } else {
      if (!body.nome?.trim()) {
        return NextResponse.json({ error: "Nome do concorrente é obrigatório." }, { status: 400 })
      }
      system  = SYSTEM_CONCORRENTE
      userMsg = buildConcorrentePrompt(body)
    }

    const resp = await client.messages.create({
      model:      AI_MODEL,
      max_tokens: maxTokens,
      system,
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
