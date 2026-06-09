import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as {
      especialidade:        string
      cidade:               string
      tempo_consulta:       string
      anos_experiencia:     number
      consultas_dia:        number
      dias_mes:             number
      custo_aluguel:        number
      custo_funcionarios:   number
      custo_sistemas:       number
      custo_marketing:      number
      custo_outros:         number
      posicionamento:       string
    }

    const custo_total = body.custo_aluguel + body.custo_funcionarios +
                        body.custo_sistemas + body.custo_marketing + body.custo_outros
    const consultas_mes = body.consultas_dia * body.dias_mes

    const resp = await ai.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: `Você é um consultor de gestão médica especializado em precificação estratégica de consultas no Brasil.
Analise os dados financeiros e sugira preços estratégicos baseados no mercado real.
Responda em português brasileiro. Retorne JSON puro, sem markdown, sem texto antes ou depois.`,
      messages: [{
        role: "user",
        content: `Calcule a precificação estratégica para este médico:

ESPECIALIDADE: ${body.especialidade}
CIDADE: ${body.cidade}
TEMPO DE CONSULTA: ${body.tempo_consulta}
ANOS DE EXPERIÊNCIA: ${body.anos_experiencia} anos
CONSULTAS POR DIA: ${body.consultas_dia}
DIAS DE TRABALHO/MÊS: ${body.dias_mes}
TOTAL DE CONSULTAS/MÊS: ${consultas_mes}

CUSTOS OPERACIONAIS MENSAIS:
- Aluguel/espaço: R$ ${body.custo_aluguel.toLocaleString("pt-BR")}
- Funcionários: R$ ${body.custo_funcionarios.toLocaleString("pt-BR")}
- Sistemas/software: R$ ${body.custo_sistemas.toLocaleString("pt-BR")}
- Marketing: R$ ${body.custo_marketing.toLocaleString("pt-BR")}
- Outros: R$ ${body.custo_outros.toLocaleString("pt-BR")}
- CUSTO TOTAL MENSAL: R$ ${custo_total.toLocaleString("pt-BR")}

POSICIONAMENTO DESEJADO: ${body.posicionamento}

Retorne JSON com EXATAMENTE esta estrutura:
{
  "valor_minimo": 250,
  "valor_recomendado": 380,
  "valor_premium": 550,
  "ponto_equilibrio": 195,
  "margem_liquida_pct": 35,
  "faturamento_estimado_recomendado": 57000,
  "estrategia_reajuste": "Estratégia detalhada para aumentar o preço gradualmente sem perder pacientes",
  "justificativa": "Justificativa detalhada de cada faixa de preço baseada no mercado de ${body.cidade} para ${body.especialidade}",
  "benchmarks_regiao": [
    { "perfil": "Médico iniciante (0-3 anos)", "faixa": "R$ X – R$ Y", "media": 280 },
    { "perfil": "Médico estabelecido (4-10 anos)", "faixa": "R$ X – R$ Y", "media": 380 },
    { "perfil": "Especialista referência (10+ anos)", "faixa": "R$ X – R$ Y", "media": 520 },
    { "perfil": "Ultra-premium / celebrity doc", "faixa": "R$ X – R$ Y", "media": 800 }
  ],
  "acoes_para_aumentar_valor": [
    { "acao": "Ação concreta", "impacto_estimado": "+R$ 50-100", "prazo": "30 dias" }
  ],
  "erros_comuns_precificacao": [
    "Erro que médicos cometem ao precificar"
  ]
}

Todos os valores numéricos devem ser números inteiros (sem "R$", sem "," como separador), exceto margem_liquida_pct que pode ter uma casa decimal.`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx   = clean.indexOf("{")
    const data  = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)

    return NextResponse.json(data)
  } catch (e) {
    console.error("[api/precificacao]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
