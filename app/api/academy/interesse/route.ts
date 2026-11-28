import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { erroInterno } from "@/lib/api-erro"

export async function POST(req: NextRequest) {
  const body = await req.json() as { nome: string; email: string; especialidade?: string }
  if (!body.nome || !body.email) {
    return NextResponse.json({ error: "nome e email são obrigatórios" }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("academy_interesse")
    .insert({ nome: body.nome, email: body.email, especialidade: body.especialidade ?? "" })

  if (error && error.code !== "23505") {
    return erroInterno("[academy/interesse]", error)
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
