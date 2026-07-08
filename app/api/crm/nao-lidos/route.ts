import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const supabase = createSupabaseServerClient()
  const { count } = await supabase
    .from("crm_leads")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.userId)
    .is("visualizado_em", null)
  return NextResponse.json({ count: count ?? 0 })
}

export async function PATCH() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const supabase = createSupabaseServerClient()
  await supabase
    .from("crm_leads")
    .update({ visualizado_em: new Date().toISOString() })
    .eq("user_id", auth.userId)
    .is("visualizado_em", null)
  return NextResponse.json({ ok: true })
}
