import { NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient()
    const hoje = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("anuncios_cursos")
      .select("id, titulo, chamada, link_destino, anunciante_nome, anunciante_foto_url")
      .eq("status", "aprovado")
      .lte("data_inicio", hoje)
      .gte("data_fim", hoje)
      .order("data_inicio", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[anuncios-cursos/publico] GET:", error)
      return NextResponse.json({ anuncio: null })
    }

    return NextResponse.json({ anuncio: data ?? null })
  } catch (e) {
    console.error("[anuncios-cursos/publico] GET:", e)
    return NextResponse.json({ anuncio: null })
  }
}
