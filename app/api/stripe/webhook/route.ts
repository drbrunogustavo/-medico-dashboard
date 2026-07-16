import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import * as Sentry from "@sentry/nextjs"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { buildBoasVindasHtml, FROM_EMAIL, REPLY_TO } from "@/lib/email-boas-vindas"

function getSupabaseAdmin() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

async function dispararEmailBoasVindas(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  fallbackEmail: string | null | undefined,
) {
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  const email = authUser.user?.email ?? fallbackEmail
  if (!email) return
  const { data: perfilRow } = await supabase
    .from("perfis")
    .select("nome")
    .eq("user_id", userId)
    .maybeSingle()
  const nome = (perfilRow?.nome as string | null) ?? email
  const primeiroNome = nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? nome
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from:    FROM_EMAIL,
    to:      [email],
    replyTo: REPLY_TO,
    subject: `Bem-vindo ao PRAXIS, Dr. ${primeiroNome}! 🎉`,
    html:    buildBoasVindasHtml(nome),
  })
  console.log(`[stripe/webhook] E-mail de boas-vindas enviado — user ${userId} → ${email}`)
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

        // ── Anúncio de curso (pagamento único) ──────────────────────────────
        const anuncioId = session.metadata?.anuncio_id
        if (anuncioId) {
          const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : null
          if (session.payment_status !== "paid") {
            console.warn("[stripe/webhook] anuncio payment_status não é paid:", session.payment_status, anuncioId)
            break
          }
          // TODO: checar count de linhas afetadas — se 0, o anuncio_id não existe na tabela
          const { error } = await supabase
            .from("anuncios_cursos")
            .update({
              status:                   "pendente",
              stripe_payment_intent_id: paymentIntentId,
            })
            .eq("id", anuncioId)
          if (error) console.error("[stripe/webhook] Erro ao ativar anúncio:", error)
          else console.log(`[stripe/webhook] Anúncio ${anuncioId} ativado — PI: ${paymentIntentId}`)
          break
        }

        // ── Assinatura (comportamento existente) ─────────────────────────────
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

        // Safety net: pagamento confirmado é prova definitiva de onboarding concluído,
        // independente de falha silenciosa no PATCH /api/perfil feito pelo cliente antes do checkout.
        const { error: perfilError } = await supabase
          .from("perfis")
          .update({ onboarding_completo: true })
          .eq("user_id", userId)

        if (perfilError) console.error("[stripe/webhook] Erro ao marcar onboarding_completo:", perfilError)

        // Fire-and-forget: falha no e-mail nunca trava nem reverte o webhook
        if (process.env.RESEND_API_KEY) {
          dispararEmailBoasVindas(
            supabase,
            userId,
            session.customer_details?.email ?? session.customer_email,
          ).catch((err) => console.error("[stripe/webhook] Falha ao enviar e-mail de boas-vindas:", err))
        }
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
        const subStatus         = sub.status
        const cancelAtPeriodEnd = sub.cancel_at_period_end

        const { error } = await supabase.from("user_planos").upsert(
          {
            user_id:                userId,
            stripe_subscription_id: sub.id,
            stripe_customer_id:     sub.customer as string,
            stripe_price_id:        priceId,
            status: (subStatus === "active" && cancelAtPeriodEnd)
              ? "cancelado_fim_periodo"
              : (subStatus === "active" || subStatus === "trialing") ? "ativo" : subStatus,
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

        // Affiliate balance zeroing — isolated try/catch, never blocks webhook
        try {
          const customerId = typeof sub.customer === "string"
            ? sub.customer
            : (sub.customer as Stripe.Customer | Stripe.DeletedCustomer | null)?.id ?? null

          if (!customerId) break

          // Check if this customer is a registered affiliate
          const { data: afiliado } = await supabase
            .from("afiliados")
            .select("id, stripe_customer_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle()

          if (!afiliado) break // regular customer — nothing to do

          // Fetch current Stripe balance (negative = available credit)
          const customer = await stripe.customers.retrieve(customerId)
          if (customer.deleted) break

          const saldoAtual = (customer as Stripe.Customer).balance ?? 0

          if (saldoAtual >= 0) {
            console.log(`[stripe/webhook] Afiliado ${afiliado.id} cancelou — saldo já é zero ou positivo, nada a fazer`)
            break
          }

          // saldoAtual is negative (credit) — create a positive transaction to zero it out
          const valorAbsoluto = Math.abs(saldoAtual) // cents

          console.log(`[stripe/webhook] Zerando saldo — afiliado ${afiliado.id}, R$${(valorAbsoluto / 100).toFixed(2)}`)
          const balanceTx = await stripe.customers.createBalanceTransaction(customerId, {
            amount:      valorAbsoluto, // positive = debit, zeroes the negative balance
            currency:    "brl",
            description: "Estorno de saldo de comissão — cancelamento de assinatura",
          })

          await supabase.from("afiliados_saldo_perdido").insert({
            afiliado_id:       afiliado.id,
            valor_perdido:     parseFloat((valorAbsoluto / 100).toFixed(2)), // store as reais
            stripe_customer_id: customerId,
            motivo:            "cancelamento_assinatura",
          })

          console.log(`[stripe/webhook] Saldo de comissão zerado — afiliado ${afiliado.id}, R$${(valorAbsoluto / 100).toFixed(2)} perdidos, tx ${balanceTx.id}`)
        } catch (afiliadoErr) {
          console.error("[stripe/webhook] Erro ao zerar saldo do afiliado:", afiliadoErr)
          // intentionally swallowed — webhook must always return 200
        }
        break
      }

      case "invoice.paid": {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer as Stripe.Customer | Stripe.DeletedCustomer | null)?.id ?? null
        const amountPaid = invoice.amount_paid // cents

        if (!customerId || amountPaid <= 0) break

        // Affiliate commission — isolated try/catch, never blocks the webhook response
        try {
          // Resolve Supabase user from stripe_customer_id
          const { data: planoRow } = await supabase
            .from("user_planos")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle()

          if (!planoRow?.user_id) break

          const userId = planoRow.user_id

          // Find pending referral for this user
          const { data: indicacao } = await supabase
            .from("afiliados_indicacoes")
            .select("id, afiliado_id")
            .eq("indicacoes_user_id", userId)
            .eq("status", "pendente")
            .maybeSingle()

          if (!indicacao) break // user was not referred, or already processed

          // Load affiliate
          const { data: afiliado } = await supabase
            .from("afiliados")
            .select("id, status, stripe_customer_id, comissao_percentual, total_indicados, total_comissao_acumulada")
            .eq("id", indicacao.afiliado_id)
            .maybeSingle()

          if (!afiliado) {
            console.warn(`[stripe/webhook] Afiliado ${indicacao.afiliado_id} não encontrado para indicação ${indicacao.id}`)
            break
          }

          if (afiliado.status !== "ativo" || !afiliado.stripe_customer_id) {
            console.warn(`[stripe/webhook] Afiliado ${afiliado.id} inativo ou sem stripe_customer_id — indicação ${indicacao.id} aguarda processamento manual`)
            break
          }

          // Calculate and credit commission
          const percentual     = (afiliado.comissao_percentual as number) ?? 20
          const comissaoCents  = Math.round(amountPaid * (percentual / 100))
          const comissaoReais  = parseFloat((comissaoCents / 100).toFixed(2))

          console.log(`[stripe/webhook] Creditando comissão — afiliado ${afiliado.id}, indicação ${indicacao.id}, R$${comissaoReais.toFixed(2)} (${percentual}% de R$${(amountPaid / 100).toFixed(2)})`)
          const balanceTx = await stripe.customers.createBalanceTransaction(
            afiliado.stripe_customer_id as string,
            {
              amount:      -comissaoCents, // negative = credit in Stripe
              currency:    "brl",
              description: `Comissão de indicação #${indicacao.id}`,
            }
          )

          const agora = new Date().toISOString()

          await supabase
            .from("afiliados_indicacoes")
            .update({
              status:                         "aplicada",
              valor_comissao:                 comissaoReais,
              stripe_balance_transaction_id:  balanceTx.id,
              aplicado_em:                    agora,
            })
            .eq("id", indicacao.id)

          await supabase
            .from("afiliados")
            .update({
              total_indicados:          ((afiliado.total_indicados  as number) ?? 0) + 1,
              total_comissao_acumulada: parseFloat((((afiliado.total_comissao_acumulada as number) ?? 0) + comissaoReais).toFixed(2)),
            })
            .eq("id", afiliado.id)

          console.log(`[stripe/webhook] Comissão aplicada — afiliado ${afiliado.id}, indicação ${indicacao.id}, R$${comissaoReais.toFixed(2)} (${percentual}% de R$${(amountPaid / 100).toFixed(2)})`)
        } catch (comissaoErr) {
          console.error("[stripe/webhook] Erro ao processar comissão de afiliado:", comissaoErr)
          // intentionally swallowed — webhook must always return 200
        }
        break
      }

      default:
        break
    }
  } catch (e) {
    Sentry.captureException(e, { tags: { route: "stripe-webhook" }, level: "fatal" })
    console.error("[stripe/webhook] Erro interno:", e)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
