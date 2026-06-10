import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

type PlanoKey = "starter" | "pro" | "elite_monthly" | "elite_annual"

const PRICE_IDS: Record<PlanoKey, string | undefined> = {
  starter:      process.env.STRIPE_PRICE_STARTER_MONTHLY,
  pro:          process.env.STRIPE_PRICE_PRO_MONTHLY,
  elite_monthly:process.env.STRIPE_PRICE_ELITE_MONTHLY,
  elite_annual: process.env.STRIPE_PRICE_ELITE_ANNUAL,
}

// Canonical plan name stored in DB
const PLANO_NAME: Record<PlanoKey, string> = {
  starter:       "starter",
  pro:           "pro",
  elite_monthly: "elite",
  elite_annual:  "elite",
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe não configurado. Configure STRIPE_SECRET_KEY no .env.local." },
      { status: 503 },
    )
  }

  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as { plano: PlanoKey }
  const { plano } = body

  const priceId = PRICE_IDS[plano]
  if (!priceId) {
    return NextResponse.json(
      { error: `Preço do plano "${plano}" não configurado.` },
      { status: 400 },
    )
  }

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY)
  const origin  = req.headers.get("origin") ?? req.nextUrl.origin
  const planoDb = PLANO_NAME[plano]

  const session = await stripe.checkout.sessions.create({
    mode:           "subscription",
    line_items:     [{ price: priceId, quantity: 1 }],
    customer_email: user?.email ?? undefined,
    success_url:    `${origin}/dashboard?pagamento=sucesso`,
    cancel_url:     `${origin}/planos`,
    metadata:       { user_id: auth.userId, plano: planoDb },
    subscription_data: {
      trial_period_days: 7,
      metadata:          { user_id: auth.userId, plano: planoDb },
    },
    locale: "pt-BR",
  })

  return NextResponse.json({ url: session.url })
}
