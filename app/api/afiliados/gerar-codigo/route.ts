import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

function gerarCodigo(userId: string): string {
  // 6 uppercase chars from userId hash + random suffix
  const base = userId.replace(/-/g, "").toUpperCase().slice(0, 4)
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6)
  return `${base}${rand}`
}

export async function POST(_req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()

    // Return existing if already has one
    const { data: existing } = await supabase
      .from("afiliados")
      .select("*")
      .eq("user_id", auth.userId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ afiliado: existing })
    }

    // Look up stripe_customer_id from an active subscription
    let stripeCustomerId: string | null = null
    let statusAfiliado: "ativo" | "pendente" = "pendente"

    try {
      const { data: planRow } = await supabase
        .from("user_planos")
        .select("stripe_customer_id, status")
        .eq("user_id", auth.userId)
        .maybeSingle()

      if (planRow?.stripe_customer_id && planRow.status === "ativo") {
        stripeCustomerId = planRow.stripe_customer_id
        statusAfiliado   = "ativo"
      }
    } catch {
      // treat as not found — statusAfiliado stays "pendente"
    }

    // Generate unique code (retry up to 5 times on collision)
    let codigo = gerarCodigo(auth.userId)
    let data   = null
    let error  = null

    for (let i = 0; i < 5; i++) {
      const result = await supabase
        .from("afiliados")
        .insert({
          user_id:             auth.userId,
          codigo_afiliado:     codigo,
          comissao_percentual: 20,
          status:              statusAfiliado,
          ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
        })
        .select()
        .single()

      data  = result.data
      error = result.error

      if (!error) break
      // Code collision — try another
      codigo = gerarCodigo(auth.userId + i)
    }

    if (error) throw new Error(error.message)

    if (statusAfiliado === "pendente") {
      return NextResponse.json(
        { afiliado: data, ok: true, status: "pendente", motivo: "sem_assinatura_ativa" },
        { status: 201 },
      )
    }

    return NextResponse.json({ afiliado: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
