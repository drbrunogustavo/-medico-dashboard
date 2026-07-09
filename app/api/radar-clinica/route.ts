import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getAgenda } from "@/lib/medx"

export const maxDuration = 30

function startOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function prevMonthBounds(): [string, string] {
  const d = new Date()
  const s = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  const e = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59)
  return [s.toISOString(), e.toISOString()]
}

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase              = createSupabaseServerClient()
  const agora                 = Date.now()
  const som                   = startOfMonth()
  const now                   = new Date().toISOString()
  const [prevStart, prevEnd]  = prevMonthBounds()

  const [
    { data: pacientes },
    { data: historico },
    { data: lancMes },
    { data: lancAnt },
  ] = await Promise.all([
    supabase.from("pacientes_local").select("id, nome").eq("user_id", auth.userId),
    supabase
      .from("copiloto_historico")
      .select("paciente_nome, resultado, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("financeiro_lancamentos")
      .select("valor")
      .eq("user_id", auth.userId)
      .eq("tipo", "receita")
      .gte("data", som)
      .lte("data", now),
    supabase
      .from("financeiro_lancamentos")
      .select("valor")
      .eq("user_id", auth.userId)
      .eq("tipo", "receita")
      .gte("data", prevStart)
      .lte("data", prevEnd),
  ])

  // ── Sem retorno ────────────────────────────────────────────────────────────
  // Latest consultation date per patient (by name — mesmo match aproximado do cron)
  const latestConsultByName = new Map<string, string>()
  for (const h of (historico ?? [])) {
    const k = (h.paciente_nome as string).toLowerCase().trim()
    if (!latestConsultByName.has(k)) latestConsultByName.set(k, h.created_at as string)
  }

  interface PacItem { id: string; nome: string; ultima_consulta: string | null; dias: number }
  const semRetornoCritico: PacItem[] = []
  const semRetornoAtencao: PacItem[] = []

  for (const p of (pacientes ?? [])) {
    const k      = (p.nome as string).toLowerCase().trim()
    const ultima = latestConsultByName.get(k) ?? null
    // null → paciente sem nenhuma consulta registrada; dias = 9999 garante entrada em crítico
    const dias   = ultima
      ? Math.floor((agora - new Date(ultima).getTime()) / 86_400_000)
      : 9999

    const item: PacItem = { id: p.id as string, nome: p.nome as string, ultima_consulta: ultima, dias }
    if (dias > 180) semRetornoCritico.push(item)
    else if (dias > 90) semRetornoAtencao.push(item)
  }

  semRetornoCritico.sort((a, b) => b.dias - a.dias)
  semRetornoAtencao.sort((a, b) => b.dias - a.dias)

  // ── Exames pendentes ───────────────────────────────────────────────────────
  // Para cada paciente: última consulta com exames_solicitados não-vazio = pendentes
  const pacIdByName   = new Map((pacientes ?? []).map(p => [(p.nome as string).toLowerCase().trim(), p.id as string]))
  const pacNomeByKey  = new Map((pacientes ?? []).map(p => [(p.nome as string).toLowerCase().trim(), p.nome as string]))

  const latestHistByName = new Map<string, { created_at: string; resultado: unknown }>()
  for (const h of (historico ?? [])) {
    const k = (h.paciente_nome as string).toLowerCase().trim()
    if (!latestHistByName.has(k)) latestHistByName.set(k, { created_at: h.created_at as string, resultado: h.resultado })
  }

  interface ExamItem { id: string | null; nome: string; ultima_consulta: string; exames: string[] }
  const examesPendentes: ExamItem[] = []

  for (const [k, entry] of Array.from(latestHistByName.entries())) {
    const res    = entry.resultado as Record<string, unknown> | null
    const exames = (res?.exames_solicitados ?? []) as string[]
    if (!Array.isArray(exames) || exames.length === 0) continue
    examesPendentes.push({
      id:              pacIdByName.get(k) ?? null,
      nome:            pacNomeByKey.get(k) ?? k,
      ultima_consulta: entry.created_at,
      exames,
    })
  }

  // ── Financeiro ─────────────────────────────────────────────────────────────
  const receita_mes = (lancMes ?? []).reduce((s, l) => s + ((l.valor as number) ?? 0), 0)
  const receita_ant = (lancAnt ?? []).reduce((s, l) => s + ((l.valor as number) ?? 0), 0)
  const d           = new Date()
  const dias_dec    = d.getDate()
  const dias_tot    = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  // Projeção linear — apenas a partir do dia 3 para evitar estimativas exageradas
  const estimativa  = dias_dec >= 3 && receita_mes > 0
    ? Math.round((receita_mes / dias_dec) * dias_tot)
    : null

  // ── Agenda (MedX only) ─────────────────────────────────────────────────────
  interface AgendaAppt { hora: string; nome: string; proc: string; status: string }
  let agenda: { total: number; appts: AgendaAppt[] } | null = null

  const temMedx = !!(process.env.MEDX_URL && process.env.MEDX_INTEGRATION_TOKEN)
  if (temMedx) {
    try {
      const hojeStr = new Date().toISOString().split("T")[0]
      const raw     = await getAgenda(hojeStr, hojeStr)
      if (Array.isArray(raw)) {
        const appts: AgendaAppt[] = (raw as Record<string, unknown>[]).map(a => ({
          hora:   String(a.horaInicio   ?? a.hora       ?? ""),
          nome:   String(a.nomePaciente ?? a.nomeContato ?? a.paciente     ?? "Paciente"),
          proc:   String(a.nomeProcedimento ?? a.procedimento ?? "Consulta"),
          status: String(a.nomeStatus   ?? a.status     ?? ""),
        }))
        agenda = { total: appts.length, appts }
      }
    } catch {
      // MedX indisponível — omitir bloco silenciosamente
    }
  }

  return NextResponse.json({
    sem_retorno:      { critico: semRetornoCritico, atencao: semRetornoAtencao },
    exames_pendentes: examesPendentes,
    financeiro:       { receita_mes, receita_ant, dias_dec, dias_tot, estimativa },
    agenda,
  })
}
