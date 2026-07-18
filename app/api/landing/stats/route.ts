import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

export const revalidate = 3600

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient()
    const [{ count: medicos }, { count: consultas }] = await Promise.all([
      supabase.from("perfis").select("*", { count: "exact", head: true }).eq("onboarding_completo", true),
      supabase.from("copiloto_historico").select("*", { count: "exact", head: true }),
    ])
    return NextResponse.json(
      { medicos_ativos: medicos ?? 0, consultas_realizadas: consultas ?? 0 },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    )
  } catch {
    return NextResponse.json({ medicos_ativos: 0, consultas_realizadas: 0 })
  }
}
