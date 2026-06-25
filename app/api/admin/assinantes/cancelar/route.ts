import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { isAdmin } from "@/lib/admin-auth"

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (!process.env.STRIPE_SECRET_KEY)
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 })

  const { user_id } = await req.json() as { user_id?: string }
  if (!user_id) return NextResponse.json({ error: "user_id obrigatório." }, { status: 400 })

  const supabase = createSupabaseServiceClient()

  // 1. Busca subscription id no banco
  const { data: plano, error: planoErr } = await supabase
    .from("user_planos")
    .select("stripe_subscription_id")
    .eq("user_id", user_id)
    .single()

  if (planoErr || !plano?.stripe_subscription_id)
    return NextResponse.json({ error: "Assinatura Stripe não encontrada para este usuário." }, { status: 400 })

  const subId  = plano.stripe_subscription_id as string
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  // 2. Recupera assinatura com último invoice expandido
  const sub = await stripe.subscriptions.retrieve(subId, {
    expand: ["latest_invoice"],
  })

  if (sub.status === "canceled")
    return NextResponse.json({ error: "Assinatura já está cancelada no Stripe." }, { status: 400 })

  // 3. Extrai payment_intent do último invoice.
  //    Em Stripe SDK v22 `payment_intent` não aparece no tipo Invoice, mas existe na API.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceRaw      = sub.latest_invoice as any
  const paymentIntentId = typeof invoiceRaw?.payment_intent === "string"
    ? (invoiceRaw.payment_intent as string)
    : null

  // 4. Estorno BLOQUEANTE — falha aqui impede tudo abaixo
  if (paymentIntentId) {
    try {
      await stripe.refunds.create({ payment_intent: paymentIntentId })
      console.log(`[admin/cancelar] Estorno realizado — PI: ${paymentIntentId}, user: ${user_id}`)
    } catch (e) {
      console.error("[admin/cancelar] Erro ao estornar:", e)
      return NextResponse.json(
        { error: "Estorno falhou. Verifique o Stripe. Assinatura NÃO foi cancelada." },
        { status: 500 },
      )
    }
  } else {
    console.log(`[admin/cancelar] Sem payment_intent (trial sem cobrança) — cancelando sem estorno. user: ${user_id}`)
  }

  // 5. Só chega aqui se estorno foi bem-sucedido (ou não havia pagamento)
  await stripe.subscriptions.update(subId, { cancel_at_period_end: true })

  // 6. Atualiza status no banco — só após confirmação do Stripe.
  //    current_period_end em SDK v22 fica no SubscriptionItem (mesmo padrão do webhook).
  const item      = sub.items.data[0]
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null

  const { error: updateErr } = await supabase
    .from("user_planos")
    .update({ status: "cancelado_fim_periodo", atualizado_em: new Date().toISOString() })
    .eq("user_id", user_id)

  if (updateErr) {
    console.error("[admin/cancelar] Erro ao atualizar user_planos:", updateErr)
    return NextResponse.json(
      { error: "Stripe atualizado mas banco falhou. Verifique manualmente." },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, period_end: periodEnd })
}
