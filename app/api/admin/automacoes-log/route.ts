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
  const limit  = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200)

  const supabase = createSupabaseServiceClient()
  let query = supabase
    .from("automacoes_log")
    .select("id, tipo, status, detalhes, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (tipo) query = query.eq("tipo", tipo)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}
