import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("depoimentos_publicos")
    .select("id, nome, especialidade, cidade, estado, depoimento, resultado_destaque, instagram")
    .eq("aprovado", true)
    .eq("exibir_landing", true)
    .order("created_at", { ascending: false })
    .limit(9)

  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data ?? [])
}
