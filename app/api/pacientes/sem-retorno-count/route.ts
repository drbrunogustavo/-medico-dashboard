import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

// Reutiliza a mesma lógica de calcSemRetorno() do cron (automacoes/diario)
// match aproximado por string — débito técnico existente, sem FK
export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const cutoff   = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: historico }, { data: pacientes }] = await Promise.all([
    supabase.from("copiloto_historico").select("paciente_nome").eq("user_id", auth.userId).gte("created_at", cutoff),
    supabase.from("pacientes_local").select("nome").eq("user_id", auth.userId),
  ])

  const comConsulta = new Set(
    (historico ?? []).map(h => (h.paciente_nome as string).toLowerCase().trim())
  )
  const count = (pacientes ?? []).filter(
    p => !comConsulta.has((p.nome as string).toLowerCase().trim())
  ).length

  return NextResponse.json({ count })
}
