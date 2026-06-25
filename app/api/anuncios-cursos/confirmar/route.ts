import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

// Safety net: client calls this after Stripe redirects to success_url.
// Webhook is authoritative; this ensures status update lands even if
// the webhook fires late or is missed.
export async function POST(req: NextRequest) {
  const { session_id } = await req.json() as { session_id?: string }
  if (!session_id) {
    return NextResponse.json({ error: "session_id obrigatório." }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(session_id)
  } catch (e) {
    console.error("[confirmar-anuncio] retrieve:", e)
    return NextResponse.json({ error: "Sessão Stripe inválida." }, { status: 400 })
  }

  const anuncioId = session.metadata?.anuncio_id
  if (!anuncioId) {
    // Not an ad session — ignore silently (could be a subscription session)
    return NextResponse.json({ ok: true, ignorado: true })
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Pagamento ainda não confirmado." }, { status: 402 })
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : null

  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from("anuncios_cursos")
    .update({
      status:                   "pendente",
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", anuncioId)

  if (error) {
    console.error("[confirmar-anuncio] update:", error)
    return NextResponse.json({ error: "Erro ao confirmar anúncio." }, { status: 500 })
  }

  console.log(`[confirmar-anuncio] Anúncio ${anuncioId} confirmado (safety net)`)
  return NextResponse.json({ ok: true })
}
