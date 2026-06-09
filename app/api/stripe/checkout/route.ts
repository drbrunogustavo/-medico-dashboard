import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

type Plano = "starter" | "pro" | "elite"

const PRICE_IDS: Record<Plano, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro:     process.env.STRIPE_PRICE_PRO,
  elite:   process.env.STRIPE_PRICE_ELITE,
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

  const { plano } = await req.json() as { plano: Plano }

  const priceId = PRICE_IDS[plano]
  if (!priceId) {
    return NextResponse.json(
      { error: `Preço do plano "${plano}" não configurado. Verifique STRIPE_PRICE_${plano.toUpperCase()}.` },
      { status: 400 },
    )
  }

  // Fetch user email via Supabase SSR session
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const origin = req.headers.get("origin") ?? req.nextUrl.origin

  const session = await stripe.checkout.sessions.create({
    mode:           "subscription",
    line_items:     [{ price: priceId, quantity: 1 }],
    customer_email: user?.email ?? undefined,
    success_url:    `${origin}/planos?success=true`,
    cancel_url:     `${origin}/planos`,
    metadata:       { user_id: auth.userId, plano },
    subscription_data: {
      metadata: { user_id: auth.userId, plano },
    },
    locale: "pt-BR",
  })

  return NextResponse.json({ url: session.url })
}
