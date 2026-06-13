import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as Partial<{
    nome:   string
    cargo:  string
    perfil: string
    ativo:  boolean
  }>

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("equipe_membros")
    .update(body)
    .eq("id", params.id)
    .eq("owner_id", auth.userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("equipe_membros")
    .delete()
    .eq("id", params.id)
    .eq("owner_id", auth.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
