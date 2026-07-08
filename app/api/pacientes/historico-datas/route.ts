import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

// Returns { [nome_normalizado]: ISO string } — most recent copiloto date per patient name
export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from("copiloto_historico")
    .select("paciente_nome, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    if (!row.paciente_nome) continue
    const key = (row.paciente_nome as string).toLowerCase().trim()
    if (!map[key]) map[key] = row.created_at as string
  }

  return NextResponse.json(map)
}
