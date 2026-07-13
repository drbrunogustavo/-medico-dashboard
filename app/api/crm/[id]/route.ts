import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message)
  return String(e)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = params
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single()

    if (error) {
      console.error("[crm/[id] GET]", error.message)
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error("[crm/[id] GET]", errMsg(e))
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = params
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  try {
    const body = await req.json()
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("crm_leads")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", auth.userId)
      .select()
      .single()

    if (error) {
      console.error("[crm/[id] PATCH]", error.message)
      return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error("[crm/[id] PATCH]", errMsg(e))
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = params
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from("crm_leads")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId)

    if (error) {
      console.error("[crm/[id] DELETE]", error.message)
      return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[crm/[id] DELETE]", errMsg(e))
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}
