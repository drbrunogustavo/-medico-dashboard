import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titulo, chamada, link_destino, anunciante_nome, anunciante_foto_url, contato_email, contato_telefone, periodo_dias } = body

    if (!titulo?.trim())        return NextResponse.json({ error: "Título obrigatório" },   { status: 400 })
    if (!chamada?.trim())       return NextResponse.json({ error: "Chamada obrigatória" },  { status: 400 })
    if (!link_destino?.trim())  return NextResponse.json({ error: "Link obrigatório" },     { status: 400 })
    if (!anunciante_nome?.trim()) return NextResponse.json({ error: "Nome obrigatório" },   { status: 400 })
    if (!contato_email?.trim()) return NextResponse.json({ error: "E-mail obrigatório" },   { status: 400 })
    if (![7, 15, 30].includes(Number(periodo_dias)))
      return NextResponse.json({ error: "Período inválido" }, { status: 400 })

    const supabase = createSupabaseServiceClient()
    const { error } = await supabase.from("anuncios_cursos").insert({
      titulo:              titulo.trim(),
      chamada:             chamada.trim(),
      link_destino:        link_destino.trim(),
      anunciante_nome:     anunciante_nome.trim(),
      anunciante_foto_url: anunciante_foto_url?.trim() || null,
      contato_email:       contato_email.trim(),
      contato_telefone:    contato_telefone?.trim() || null,
      periodo_dias:        Number(periodo_dias),
      status:              "pendente",
    })

    if (error) {
      console.error("[anuncios-cursos] insert:", error)
      return NextResponse.json({ error: "Erro ao registrar. Tente novamente." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[anuncios-cursos] POST:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
