import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET(_req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const [afiliadoResult, indicacoesResult] = await Promise.all([
      supabase
        .from("afiliados")
        .select("*")
        .eq("user_id", auth.userId)
        .maybeSingle(),
      supabase
        .from("afiliados_indicacoes")
        .select("*")
        .order("created_at", { ascending: false }),
    ])

    return NextResponse.json({
      afiliado:   afiliadoResult.data   ?? null,
      indicacoes: indicacoesResult.data ?? [],
    })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
