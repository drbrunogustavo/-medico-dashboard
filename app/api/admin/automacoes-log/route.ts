import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { isAdmin } from "@/lib/admin-auth"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url    = new URL(req.url)
  const tipo   = url.searchParams.get("tipo") ?? undefined
  const pedido = Number(url.searchParams.get("limit") ?? "50")
  const limit  = Number.isFinite(pedido) && pedido > 0 ? Math.min(Math.floor(pedido), 200) : 50

  const supabase = createSupabaseServiceClient()
  let query = supabase
    .from("automacoes_log")
    .select("id, tipo, status, detalhes, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (tipo) query = query.eq("tipo", tipo)

  const { data, error } = await query
  if (error) {
    console.error("[admin/automacoes-log] erro ao listar:", error)
    return NextResponse.json({ error: "Não foi possível carregar o registro." }, { status: 500 })
  }
  return NextResponse.json({ logs: data ?? [] })
}
