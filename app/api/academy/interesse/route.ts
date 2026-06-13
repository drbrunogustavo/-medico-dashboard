import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
