import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAIJson(text: string): any {
  try { return JSON.parse(text) } catch { /* continua */ }
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  try { return JSON.parse(stripped) } catch { /* continua */ }
  const m1 = stripped.match(/\{[\s\S]*\}/)
  if (m1) { try { return JSON.parse(m1[0]) } catch { /* continua */ } }
  const m2 = stripped.match(/\[[\s\S]*\]/)
  if (m2) { try { return JSON.parse(m2[0]) } catch { /* continua */ } }
  throw new Error(`IA retornou resposta n\u00e3o parse\u00e1vel como JSON: ${text.slice(0, 120)}\u2026`)
}
export const maxDuration = 60

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { mes, ano } = await req.json() as { mes: number; ano: number }

  const inicio = new Date(ano, mes - 1, 1).toISOString()
  const fim    = new Date(ano, mes, 0, 23, 59, 59).toISOString()

  const supabase = createSupabaseServerClient()

  // Aggregate data in parallel
  const [leadRes, npsRes, pautasRes, financeiroRes] = await Promise.all([
    supabase
      .from("leads")
      .select("id, status, origem, criado_em, convertido_em")
      .eq("user_id", auth.userId)
      .gte("criado_em", inicio)
      .lte("criado_em", fim),
    supabase
      .from("nps_respostas")
      .select("nota, comentario, criado_em")
      .eq("user_id", auth.userId)
      .gte("criado_em", inicio)
      .lte("criado_em", fim),
    supabase
      .from("pautas")
      .select("id, titulo, status, categoria, criado_em")
      .eq("user_id", auth.userId)
      .gte("criado_em", inicio)
      .lte("criado_em", fim),
    supabase
      .from("financeiro")
      .select("tipo, valor, categoria, data")
      .eq("user_id", auth.userId)
      .gte("data", inicio.split("T")[0])
      .lte("data", fim.split("T")[0]),
  ])

  const leads      = leadRes.data     ?? []
  const nps        = npsRes.data      ?? []
  const pautas     = pautasRes.data   ?? []
  const financeiro = financeiroRes.data ?? []

  // Compute metrics
  const totalLeads      = leads.length
  const leadsConvertidos = leads.filter(l => l.status === "convertido" || l.convertido_em).length
  const taxaConversao   = totalLeads > 0 ? Math.round((leadsConvertidos / totalLeads) * 100) : 0

  const receitas       = financeiro.filter(f => f.tipo === "receita")
  const despesas       = financeiro.filter(f => f.tipo === "despesa")
  const totalReceitas  = receitas.reduce((s, f) => s + (f.valor || 0), 0)
  const totalDespesas  = despesas.reduce((s, f) => s + (f.valor || 0), 0)
  const lucroLiquido   = totalReceitas - totalDespesas

  const npsNotas    = nps.map(n => n.nota).filter(Boolean) as number[]
  const npsMedia    = npsNotas.length > 0 ? (npsNotas.reduce((a, b) => a + b, 0) / npsNotas.length).toFixed(1) : "N/A"
  const npsPromotores   = npsNotas.filter(n => n >= 9).length
  const npsDetratores   = npsNotas.filter(n => n <= 6).length
  const npsScore        = npsNotas.length > 0
    ? Math.round(((npsPromotores - npsDetratores) / npsNotas.length) * 100)
    : null

  const pautasPublicadas = pautas.filter(p => p.status === "publicado").length
  const pautasCriadas    = pautas.length

  const origemLeads = leads.reduce<Record<string, number>>((acc, l) => {
    const k = l.origem ?? "Não informado"
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

  const contexto = `
Relatório de ${meses[mes - 1]} de ${ano} — PRAXIS Platform

DADOS FINANCEIROS:
- Receita bruta: R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Despesas: R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Lucro líquido: R$ ${lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Ticket médio estimado: ${leadsConvertidos > 0 ? `R$ ${(totalReceitas / leadsConvertidos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sem conversões"}

MARKETING E LEADS:
- Total de leads: ${totalLeads}
- Leads convertidos: ${leadsConvertidos}
- Taxa de conversão: ${taxaConversao}%
- Origens: ${JSON.stringify(origemLeads)}

CLÍNICO / NPS:
- Respostas NPS: ${npsNotas.length}
- Nota média NPS: ${npsMedia}
- NPS Score: ${npsScore ?? "N/A"}
- Promotores: ${npsPromotores} | Detratores: ${npsDetratores}

CONTEÚDO:
- Pautas criadas no mês: ${pautasCriadas}
- Publicadas: ${pautasPublicadas}
`

  const prompt = `Você é um consultor estratégico especializado em marketing médico e gestão de clínicas.

Analise os dados abaixo e gere um relatório mensal estruturado, escrito em português brasileiro, com linguagem profissional e objetiva.

${contexto}

Gere o relatório EXATAMENTE neste formato JSON (sem markdown, apenas JSON puro):
{
  "resumoExecutivo": "Parágrafo de 3-4 frases resumindo o mês",
  "financeiro": {
    "avaliacao": "Breve análise do financeiro",
    "pontosFortes": ["ponto 1", "ponto 2"],
    "atencao": "Alerta ou oportunidade principal"
  },
  "marketing": {
    "avaliacao": "Análise dos leads e conversão",
    "pontosFortes": ["ponto 1", "ponto 2"],
    "atencao": "Principal oportunidade de melhoria"
  },
  "clinico": {
    "avaliacao": "Análise do NPS e relacionamento",
    "pontosFortes": ["ponto 1"],
    "atencao": "Alerta ou recomendação"
  },
  "destaques": ["destaque 1", "destaque 2", "destaque 3"],
  "pontosAtencao": ["ponto 1", "ponto 2"],
  "recomendacoes": ["recomendação 1", "recomendação 2", "recomendação 3", "recomendação 4"]
}`

  try {
    const client   = getAnthropicClient()
    const response = await client.messages.create({
      model:      AI_MODEL,
      max_tokens: 2000,
      messages:   [{ role: "user", content: prompt }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("IA não retornou JSON válido")

    const analise = parseAIJson(jsonMatch[0])

    return NextResponse.json({
      mes, ano,
      metricas: {
        totalLeads, leadsConvertidos, taxaConversao,
        totalReceitas, totalDespesas, lucroLiquido,
        npsScore, npsMedia, npsNotas: npsNotas.length,
        pautasCriadas, pautasPublicadas,
        origemLeads,
      },
      analise,
    })
  } catch (e) {
    console.error("[api/relatorio]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
