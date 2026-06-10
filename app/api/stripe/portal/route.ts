import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 })
  }

  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const { data: planoData } = await supabase
      .from("user_planos")
      .select("stripe_customer_id")
      .eq("user_id", auth.userId)
      .maybeSingle()

    if (!planoData?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Nenhuma assinatura ativa encontrada." },
        { status: 400 }
      )
    }

    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY)
    const origin  = req.headers.get("origin") ?? req.nextUrl.origin

    const session = await stripe.billingPortal.sessions.create({
      customer:    planoData.stripe_customer_id,
      return_url:  `${origin}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error("[api/stripe/portal]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
