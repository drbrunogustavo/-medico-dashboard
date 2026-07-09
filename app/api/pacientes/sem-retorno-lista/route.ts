import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

// Retorna todos os pacientes com sua última consulta e dias sem retorno.
// Usa match por nome (mesmo débito técnico do /sem-retorno-count).
export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const agora    = Date.now()

  const [{ data: historico }, { data: pacientes }] = await Promise.all([
    supabase
      .from("copiloto_historico")
      .select("paciente_nome, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("pacientes_local")
      .select("id, nome")
      .eq("user_id", auth.userId),
  ])

  // Latest consultation per patient name
  const latestByName = new Map<string, string>()
  for (const h of (historico ?? [])) {
    const k = (h.paciente_nome as string).toLowerCase().trim()
    if (!latestByName.has(k)) latestByName.set(k, h.created_at as string)
  }

  const lista = (pacientes ?? []).map(p => {
    const k      = (p.nome as string).toLowerCase().trim()
    const ultima = latestByName.get(k) ?? null
    const dias   = ultima
      ? Math.floor((agora - new Date(ultima).getTime()) / 86_400_000)
      : null
    return { id: p.id, nome: p.nome, ultima_consulta: ultima, dias_sem_retorno: dias }
  }).sort((a, b) => (b.dias_sem_retorno ?? 99999) - (a.dias_sem_retorno ?? 99999))

  return NextResponse.json(lista)
}
