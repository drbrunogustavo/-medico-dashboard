import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 30

function startOfMonth(offset = 0) {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() - offset, 1).toISOString()
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  let pergunta: string | undefined
  try {
    const body = await req.json() as { pergunta?: string }
    pergunta = body.pergunta?.trim() || undefined
  } catch { /* body opcional */ }

  const supabase = createSupabaseServerClient()
  const now = new Date().toISOString()
  const som = startOfMonth(0)
  const som1 = startOfMonth(1)
  const eom1 = startOfMonth(0) // previous month ends at start of current

  const [{ data: lancMes }, { data: lancAnt }, { data: leads }, { data: npsData }, { data: consultas }] =
    await Promise.all([
      supabase.from("financeiro_lancamentos").select("valor, tipo").eq("user_id", auth.userId).gte("data", som).lte("data", now),
      supabase.from("financeiro_lancamentos").select("valor, tipo").eq("user_id", auth.userId).gte("data", som1).lt("data", eom1),
      supabase.from("crm_leads").select("estagio").eq("user_id", auth.userId),
      supabase.from("nps_respostas").select("nota").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("consultas").select("id").eq("user_id", auth.userId).gte("data", som).lte("data", now),
    ])

  const receita     = (lancMes ?? []).filter(l => l.tipo === "receita").reduce((s, l) => s + (l.valor ?? 0), 0)
  const receitaAnt  = (lancAnt ?? []).filter(l => l.tipo === "receita").reduce((s, l) => s + (l.valor ?? 0), 0)
  const despesas    = (lancMes ?? []).filter(l => l.tipo === "despesa").reduce((s, l) => s + (l.valor ?? 0), 0)
  const leads_total = (leads ?? []).length
  const leads_novos = (leads ?? []).filter(l => l.estagio === "Novo Lead").length
  const nps_resps   = (npsData ?? [])
  const nps_score   = nps_resps.length
    ? Math.round((nps_resps.filter(r => r.nota >= 9).length - nps_resps.filter(r => r.nota <= 6).length) / nps_resps.length * 100)
    : null
  const consultas_mes = (consultas ?? []).length
  const crescimento   = receitaAnt > 0 ? ((receita - receitaAnt) / receitaAnt * 100).toFixed(1) : null

  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Você é um analista de negócios médicos. Analise os dados do consultório em ${mesAtual} e escreva um briefing executivo em até 160 palavras. Destaque: desempenho de receita, comparativo com mês anterior, oportunidades e alertas. Tom direto, profissional, sem ser genérico.

DADOS DO MÊS:
- Receita: ${fmtBRL(receita)}
- Mês anterior: ${fmtBRL(receitaAnt)}${crescimento !== null ? ` (${Number(crescimento) >= 0 ? "+" : ""}${crescimento}%)` : ""}
- Despesas: ${fmtBRL(despesas)}
- Resultado líquido: ${fmtBRL(receita - despesas)}
- Consultas realizadas: ${consultas_mes}
- Leads no CRM: ${leads_total} (${leads_novos} novos leads)
- NPS: ${nps_score !== null ? nps_score : "sem dados suficientes"}
${pergunta ? `\nPERGUNTA / CONTEXTO ADICIONAL DO MÉDICO:\n${pergunta}` : ""}
Responda em texto corrido com 2-3 parágrafos curtos, sem listas, sem markdown.`,
    }],
  })

  const analise = msg.content.find(b => b.type === "text")?.text ?? ""
  return NextResponse.json({ analise: analise.trim() })
}
