import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"


function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const ai = getAnthropicClient()
  try {
    const body = await req.json() as {
      especialidade:   string
      tempo_atuacao:   string
      cidade:          string
      atendimento:     string
      ticket_medio:    string
      paciente_ideal:  string
      maior_desafio:   string
      diferencial:     string
    }

    const resp = await ai.messages.create({
      model:      AI_MODEL,
      max_tokens: 5000,
      system: `Você é um consultor estratégico especializado em marketing médico e gestão de clínicas no Brasil.
Analise o perfil deste médico e gere um relatório estratégico completo e acionável.
Responda em português brasileiro. Retorne JSON puro, sem markdown, sem texto antes ou depois.`,
      messages: [{
        role: "user",
        content: `Analise o perfil deste médico e gere um relatório estratégico completo:

ESPECIALIDADE: ${body.especialidade}
TEMPO DE ATUAÇÃO: ${body.tempo_atuacao}
CIDADE/BAIRRO: ${body.cidade}
TIPO DE ATENDIMENTO: ${body.atendimento}
TICKET MÉDIO ATUAL: ${body.ticket_medio}
PACIENTE IDEAL: ${body.paciente_ideal}
MAIOR DESAFIO: ${body.maior_desafio}
DIFERENCIAL: ${body.diferencial}

Retorne JSON com EXATAMENTE esta estrutura:
{
  "nicho_ideal": {
    "titulo": "Nome do nicho recomendado",
    "descricao": "Descrição detalhada do nicho ideal",
    "justificativa": "Por que este nicho faz sentido para este médico",
    "tamanho_mercado": "Estimativa do mercado neste nicho"
  },
  "publico_alvo": {
    "avatar_nome": "Nome fictício do paciente ideal (ex: Ana, 42 anos)",
    "demografia": "Idade, gênero, renda, localização",
    "psicografia": "Valores, medos, aspirações, comportamento",
    "dores_principais": ["Dor 1", "Dor 2", "Dor 3"],
    "onde_encontrar": "Onde esse paciente está nas redes sociais",
    "como_decide": "Como e por que escolhe um médico"
  },
  "diferenciais_competitivos": {
    "diferenciais_atuais": ["Diferencial 1", "Diferencial 2", "Diferencial 3"],
    "diferenciais_a_desenvolver": ["Diferencial potencial 1", "Diferencial potencial 2"],
    "proposta_de_valor": "Frase de posicionamento única (máx 15 palavras)"
  },
  "posicionamento_mercado": {
    "posicionamento_atual": "Como o médico provavelmente é percebido hoje",
    "posicionamento_ideal": "Como deveria ser percebido",
    "estrategia_transicao": "Como fazer essa transição de imagem",
    "benchmark": "Exemplos de médicos bem posicionados neste nicho"
  },
  "dores_publico": [
    { "dor": "Descrição da dor", "intensidade": "Alta|Média|Baixa", "conteudo_sugerido": "Tipo de conteúdo para abordar" }
  ],
  "linha_editorial": {
    "pilares": [
      { "nome": "Nome do pilar", "descricao": "O que falar neste pilar", "percentual": "30%", "exemplos": ["Tema 1", "Tema 2"] }
    ],
    "frequencia_recomendada": "X posts por semana",
    "formatos_prioritarios": ["Reel", "Carrossel", "Stories"]
  },
  "estrategia_comunicacao": {
    "tom_de_voz": "Como deve soar a comunicação (ex: Empático e científico)",
    "palavras_chave": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"],
    "frases_a_evitar": ["Frase genérica 1", "Frase genérica 2"],
    "storytelling": "Como usar sua história e trajetória no conteúdo"
  },
  "top10_temas": [
    { "tema": "Tema de conteúdo", "formato": "Reel|Carrossel|Post", "justificativa": "Por que funciona", "gancho": "Sugestão de gancho" }
  ]
}`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx   = clean.indexOf("{")
    const data  = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)

    // Optionally save to user profile
    try {
      const supabase = createSupabaseServerClient()
      await supabase
        .from("perfis")
        .update({
          posicionamento:            data,
          posicionamento_gerado_em:  new Date().toISOString(),
        })
        .eq("user_id", auth.userId)
    } catch {
      // Non-critical — don't fail the request if save fails
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/posicionamento]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
