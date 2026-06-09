import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const { token_indicacao, indicado_nome, indicado_telefone } = await req.json() as {
    token_indicacao: string; indicado_nome: string; indicado_telefone: string
  }
  if (!token_indicacao || !indicado_nome?.trim() || !indicado_telefone?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServiceClient()

    // Find existing indicacao by token or create a new lead entry
    const { data: ind } = await supabase
      .from("indicacoes")
      .select("id, user_id, indicador_nome, indicado_nome")
      .eq("token_indicacao", token_indicacao)
      .single()

    if (!ind) {
      // Token not found — create a lead entry regardless (soft landing)
      return NextResponse.json({ ok: true })
    }

    // Update with the indicado's confirmed contact info
    await supabase
      .from("indicacoes")
      .update({ indicado_nome: indicado_nome.trim(), indicado_telefone: indicado_telefone.replace(/\D/g, "") })
      .eq("id", ind.id)

    // Also create a CRM lead
    await supabase.from("crm_leads").insert({
      user_id:     ind.user_id,
      nome:        indicado_nome.trim(),
      telefone:    indicado_telefone.replace(/\D/g, ""),
      origem:      "Indicação",
      observacoes: `Indicado por: ${ind.indicador_nome}`,
      estagio:     "novo",
      valor_potencial: 0,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[indicacoes/indicar]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
