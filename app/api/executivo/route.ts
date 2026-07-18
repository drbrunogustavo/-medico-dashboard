import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}
function startOfWeek() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString()
}
function monthsAgo(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  return d.toISOString()
}

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const now      = new Date().toISOString()
  const som      = startOfMonth()
  const sow      = startOfWeek()
  const six      = monthsAgo(6)

  try {
    const [
      { data: lancMes },
      { data: lancSeis },
      { data: leads },
      { data: npsData },
      { data: consultas },
    ] = await Promise.all([
      supabase.from("financeiro_lancamentos").select("valor, tipo").eq("user_id", auth.userId).gte("data", som).lte("data", now),
      supabase.from("financeiro_lancamentos").select("valor, tipo, data").eq("user_id", auth.userId).eq("tipo", "receita").gte("data", six),
      supabase.from("crm_leads").select("estagio, created_at").eq("user_id", auth.userId),
      supabase.from("nps_respostas").select("nota, created_at").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("consultas").select("id, origem").eq("user_id", auth.userId).gte("data", som).lte("data", now),
    ])

    const faturamento_mes = (lancMes ?? [])
      .filter(l => l.tipo === "receita")
      .reduce((s: number, l: { valor: number }) => s + (l.valor ?? 0), 0)

    const faturamento_6m: { mes: string; valor: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mesLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      const mesStr   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const valor    = (lancSeis ?? [])
        .filter((l: { data: string }) => l.data?.startsWith(mesStr))
        .reduce((s: number, l: { valor: number }) => s + (l.valor ?? 0), 0)
      faturamento_6m.push({ mes: mesLabel, valor })
    }

    const leads_total          = (leads ?? []).length
    const leads_semana         = (leads ?? []).filter(l => l.created_at >= sow).length
    const leads_por_estagio   = ["Novo Lead","Contato Feito","Qualificado","Consulta Agendada","Paciente"].map(e => ({
      estagio: e,
      count:   (leads ?? []).filter(l => l.estagio === e).length,
    }))

    const calcNps = (resps: { nota: number }[]) => {
      if (!resps.length) return null
      const prom = resps.filter(r => r.nota >= 9).length
      const det  = resps.filter(r => r.nota <= 6).length
      return Math.round((prom - det) / resps.length * 100)
    }
    const nps_score = calcNps(npsData ?? [])

    const nps_6m: { mes: string; nps: number | null }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mesLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      const mesStr   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const mesResps = (npsData ?? []).filter(r => r.created_at?.startsWith(mesStr))
      nps_6m.push({ mes: mesLabel, nps: calcNps(mesResps) })
    }

    const consultas_mes = (consultas ?? []).length

    // Origem dos leads
    const origens = ["Instagram","Indicação","Site","WhatsApp","Outro"]
    const allLeads = (leads ?? []) as { estagio: string; created_at: string; origem?: string }[]
    const leads_origem = origens.map(o => ({
      origem: o,
      count:  allLeads.filter(l => l.origem === o).length,
    }))

    return NextResponse.json({
      faturamento_mes,
      faturamento_6m,
      leads_total,
      leads_semana,
      leads_por_estagio,
      nps_score,
      nps_6m,
      consultas_mes,
      leads_origem,
    })
  } catch (e) {
    console.error("[api/executivo]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
