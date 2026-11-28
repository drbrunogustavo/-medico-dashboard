import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { erroInterno } from "@/lib/api-erro"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from("consultor_historico")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: true })
      .limit(100)

    if (error) return erroInterno("[consultor/historico]", error)
    return NextResponse.json(data ?? [])
  } catch (e) {
    return erroInterno("[consultor/historico]", e)
  }
}

export async function DELETE() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from("consultor_historico")
      .delete()
      .eq("user_id", auth.userId)

    if (error) return erroInterno("[consultor/historico]", error)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return erroInterno("[consultor/historico]", e)
  }
}
