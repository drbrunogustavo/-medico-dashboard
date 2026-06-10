import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe/webhook] Variáveis não configuradas.")
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
          console.warn("[stripe/webhook] checkout.session.completed sem metadata", session.id)
          break
        }

        const subId = session.subscription as string | null
        let priceId: string | null = null
        let periodEnd: string | null = null

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          const item = sub.items.data[0]
          priceId   = item?.price.id ?? null
          periodEnd = item?.current_period_end
            ? new Date(item.current_period_end * 1000).toISOString()
            : null
        }

        const { error } = await supabase.from("user_planos").upsert(
          {
            user_id:                userId,
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

        if (error) console.error("[stripe/webhook] Erro ao salvar plano:", error)
        else console.log(`[stripe/webhook] Plano "${plano}" ativado — user ${userId}`)
        break
      }

      case "customer.subscription.updated": {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id

        if (!userId) {
          console.warn("[stripe/webhook] subscription.updated sem metadata user_id", sub.id)
          break
        }

        // Resolve the plan name from the Stripe price ID
        const item       = sub.items.data[0]
        const priceId    = item?.price.id ?? null
        const periodEnd  = item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null
        const subStatus  = sub.status

        const { error } = await supabase.from("user_planos").upsert(
          {
            user_id:                userId,
            stripe_subscription_id: sub.id,
            stripe_customer_id:     sub.customer as string,
            stripe_price_id:        priceId,
            status:                 subStatus === "active" ? "ativo" : subStatus,
            assinatura_termina_em:  periodEnd,
            atualizado_em:          new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

        if (error) console.error("[stripe/webhook] Erro ao atualizar plano:", error)
        else console.log(`[stripe/webhook] Assinatura atualizada — user ${userId}, status ${subStatus}`)
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
            user_id:                userId,
            plano:                  "trial",
            status:                 "cancelado",
            stripe_subscription_id: null,
            stripe_price_id:        null,
            assinatura_termina_em:  null,
            atualizado_em:          new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

        if (error) console.error("[stripe/webhook] Erro ao cancelar plano:", error)
        else console.log(`[stripe/webhook] Assinatura cancelada — user ${userId}`)
        break
      }

      default:
        break
    }
  } catch (e) {
    console.error("[stripe/webhook] Erro interno:", e)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
