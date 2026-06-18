import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

// Verifies a Stripe checkout session and immediately activates the plan in DB.
// Called client-side after Stripe redirects to success_url — eliminates the
// race condition between the redirect and the webhook processing.
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 })
  }

  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as { session_id?: string }
  const { session_id } = body

  if (!session_id || !session_id.startsWith("cs_")) {
    return NextResponse.json({ error: "session_id inválido." }, { status: 400 })
  }

  try {
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    })

    // Verify the session belongs to this authenticated user
    const metaUserId = session.metadata?.user_id
    if (metaUserId && metaUserId !== auth.userId) {
      return NextResponse.json({ error: "Sessão não pertence a este usuário." }, { status: 403 })
    }

    const paid = session.payment_status === "paid" || session.status === "complete"
    const sub  = session.subscription as Stripe.Subscription | null
    const isTrialing = sub?.status === "trialing"

    if (!paid && !isTrialing) {
      return NextResponse.json({ ok: false, message: "Pagamento ainda não confirmado pelo Stripe." })
    }

    const plano     = session.metadata?.plano ?? "starter"
    const subId     = sub?.id ?? null
    const priceId   = (sub?.items?.data[0]?.price.id) ?? null
    const subAny    = sub as (Stripe.Subscription & { current_period_end?: number }) | null
    const periodEnd = subAny?.current_period_end
      ? new Date(subAny.current_period_end * 1000).toISOString()
      : null

    const supabase = createSupabaseServerClient()
    const { error: upsertErr } = await supabase.from("user_planos").upsert(
      {
        user_id:                auth.userId,
        plano,
        status:                 "ativo",
        stripe_customer_id:     (session.customer as string) ?? null,
        stripe_subscription_id: subId,
        stripe_price_id:        priceId,
        assinatura_termina_em:  periodEnd,
        atualizado_em:          new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (upsertErr) {
      console.error("[confirm-session] erro upsert:", upsertErr)
      return NextResponse.json({ error: "Erro ao ativar plano." }, { status: 500 })
    }

    console.log(`[confirm-session] Plano "${plano}" ativado via session ${session_id} — user ${auth.userId}`)
    return NextResponse.json({ ok: true, plano, activated: true })
  } catch (e) {
    console.error("[confirm-session]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
