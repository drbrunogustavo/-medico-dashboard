import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

// Service role client bypasses RLS — required for webhook upserts (no user session)
function getSupabaseAdmin() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe/webhook] Variáveis STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET não configuradas.")
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 })
  }

  const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body      = await req.text()
  const signature = req.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("[stripe/webhook] Assinatura inválida:", err)
    return NextResponse.json({ error: "Assinatura de webhook inválida." }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.user_id
        const plano   = session.metadata?.plano

        if (!userId || !plano) {
          console.warn("[stripe/webhook] checkout.session.completed sem metadata user_id/plano", session.id)
          break
        }

        const { error } = await supabase.from("user_planos").upsert(
          {
            user_id:                userId,
            plano,
            stripe_customer_id:      (session.customer as string) ?? null,
            stripe_subscription_id:  (session.subscription as string) ?? null,
            atualizado_em:           new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

        if (error) console.error("[stripe/webhook] Erro ao salvar plano:", error)
        else console.log(`[stripe/webhook] Plano "${plano}" ativado para user ${userId}`)
        break
      }

      case "customer.subscription.deleted": {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id

        if (!userId) {
          console.warn("[stripe/webhook] subscription.deleted sem metadata user_id", sub.id)
          break
        }

        const { error } = await supabase.from("user_planos").upsert(
          {
            user_id:      userId,
            plano:        "starter",
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

        if (error) console.error("[stripe/webhook] Erro ao rebaixar plano:", error)
        else console.log(`[stripe/webhook] Plano rebaixado para starter — user ${userId}`)
        break
      }

      default:
        // Eventos não tratados — retorna 200 para o Stripe não retentar
        break
    }
  } catch (e) {
    console.error("[stripe/webhook] Erro interno ao processar evento:", e)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
