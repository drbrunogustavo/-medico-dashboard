import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

// Called immediately after signup — registers an affiliate referral if praxis_ref cookie is present.
// Never throws or returns an error status that would block the signup flow.
export async function POST() {
  try {
    const auth = await checkAuth()
    if (!auth.authenticated) {
      return NextResponse.json({ ok: false, reason: "unauthenticated" })
    }

    const cookieStore = cookies()
    const refCookie   = cookieStore.get("praxis_ref")
    const refCode     = refCookie?.value ? decodeURIComponent(refCookie.value).trim() : null

    if (!refCode) {
      return NextResponse.json({ ok: false, reason: "no_ref_cookie" })
    }

    const supabase = createSupabaseServiceClient()

    // Look up affiliate by code (case-insensitive) with status = 'ativo'
    const { data: afiliado, error: afiliadoErr } = await supabase
      .from("afiliados")
      .select("id, user_id, status")
      .ilike("codigo_afiliado", refCode)
      .eq("status", "ativo")
      .maybeSingle()

    if (afiliadoErr) {
      console.error("[registrar-indicacao] erro ao buscar afiliado:", afiliadoErr)
      return NextResponse.json({ ok: false, reason: "db_error" })
    }

    if (!afiliado) {
      return NextResponse.json({ ok: false, reason: "afiliado_not_found_or_inactive" })
    }

    // Prevent self-referral
    if (afiliado.user_id === auth.userId) {
      return NextResponse.json({ ok: false, reason: "self_referral" })
    }

    // Idempotency: only insert if no existing indicação for this user
    const { data: existing, error: existErr } = await supabase
      .from("afiliados_indicacoes")
      .select("id")
      .eq("indicacoes_user_id", auth.userId)
      .maybeSingle()

    if (existErr) {
      console.error("[registrar-indicacao] erro ao checar indicação existente:", existErr)
      return NextResponse.json({ ok: false, reason: "db_error" })
    }

    if (existing) {
      return NextResponse.json({ ok: false, reason: "already_registered" })
    }

    // Get the new user's email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(auth.userId)
    const email = authUser?.user?.email ?? null

    const { error: insertErr } = await supabase
      .from("afiliados_indicacoes")
      .insert({
        afiliado_id:       afiliado.id,
        indicacoes_user_id: auth.userId,
        indicado_email:    email,
        status:            "pendente",
        origem:            "automatica",
      })

    if (insertErr) {
      console.error("[registrar-indicacao] erro ao inserir indicação:", insertErr)
      return NextResponse.json({ ok: false, reason: "insert_error" })
    }

    console.log(`[registrar-indicacao] indicação registrada — afiliado ${afiliado.id}, user ${auth.userId}, ref: ${refCode}`)
    return NextResponse.json({ ok: true })

  } catch (e) {
    console.error("[registrar-indicacao] erro inesperado:", e)
    return NextResponse.json({ ok: false, reason: "unexpected_error" })
  }
}
