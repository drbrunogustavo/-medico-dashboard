import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { isAdmin } from "@/lib/admin-auth"

// ATENÇÃO: preços hardcoded — atualizar aqui se os planos mudarem.
// Fonte de verdade: app/planos/page.tsx e painel Stripe.
// Para MRR sem hardcode seria necessário chamar a Stripe API.
const PRICE_STARTER = 97
const PRICE_PRO     = 197
const PRICE_ELITE_M = 397
const PRICE_ELITE_A = 2997 / 12  // R$ 249,75 — anual distribuído em MRR

function getMRR(plano: string, stripePriceId: string | null): number {
  const eliteAnualId = process.env.STRIPE_PRICE_ELITE_ANNUAL
                    ?? process.env.STRIPE_PRICE_ELITE_ANUAL
  if (plano === "starter") return PRICE_STARTER
  if (plano === "pro")     return PRICE_PRO
  if (plano === "elite") {
    if (stripePriceId && eliteAnualId && stripePriceId === eliteAnualId) return PRICE_ELITE_A
    return PRICE_ELITE_M
  }
  return 0
}

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from("user_planos")
    .select("plano, status, stripe_price_id, assinatura_termina_em")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []

  // Separar trialing ("ativo" no banco mas ainda em período grátis) dos cobrados.
  // O webhook mapeia subStatus "active" e "trialing" ambos para "ativo", então
  // não temos essa distinção no banco — trial_termina_em preenchido indica trial.
  // Regra: se assinatura_termina_em > hoje E nenhum pagamento real → ativar só
  // assinaturas cujo trial_termina_em já passou. Mas como não guardamos isso
  // separadamente, usamos a heurística: linha com stripe_subscription_id e
  // assinatura_termina_em é sempre cobrada; sem stripe_price_id → trial/manual.
  // Abordagem conservadora: exclui do MRR quem está em trial do Stripe.
  // "trialing" não é salvo como status (mapeado para "ativo"), então usamos
  // stripe_price_id nulo como proxy de "nunca foi cobrado".
  const ativos          = rows.filter(r => r.status === "ativo")
  const cobrados        = ativos.filter(r => !!r.stripe_price_id)   // pagaram ao menos 1 ciclo
  const emTrial         = ativos.filter(r => !r.stripe_price_id)    // trial ou manual

  const eliteAnualId = process.env.STRIPE_PRICE_ELITE_ANNUAL ?? process.env.STRIPE_PRICE_ELITE_ANUAL

  const proC         = cobrados.filter(r => r.plano === "pro")
  const starterC     = cobrados.filter(r => r.plano === "starter")
  const eliteMensalC = cobrados.filter(r => r.plano === "elite" && !(eliteAnualId && r.stripe_price_id === eliteAnualId))
  const eliteAnualC  = cobrados.filter(r => r.plano === "elite" && !!(eliteAnualId && r.stripe_price_id === eliteAnualId))

  const mrr = cobrados.reduce((s, r) => s + getMRR(r.plano, r.stripe_price_id), 0)
  const mrrRounded = Math.round(mrr * 100) / 100

  const breakdown = [
    { plano: "Pro",          count: proC.length,         preco_unit: PRICE_PRO,     subtotal: proC.length * PRICE_PRO },
    { plano: "Elite Mensal", count: eliteMensalC.length, preco_unit: PRICE_ELITE_M, subtotal: eliteMensalC.length * PRICE_ELITE_M },
    { plano: "Elite Anual",  count: eliteAnualC.length,  preco_unit: PRICE_ELITE_A, subtotal: Math.round(eliteAnualC.length * PRICE_ELITE_A * 100) / 100 },
    { plano: "Starter",      count: starterC.length,     preco_unit: PRICE_STARTER, subtotal: starterC.length * PRICE_STARTER },
  ].filter(b => b.count > 0)

  const renovandoEmBreve = cobrados.filter(r => {
    if (!r.assinatura_termina_em) return false
    const dias = (new Date(r.assinatura_termina_em).getTime() - Date.now()) / 86400000
    return dias >= 0 && dias <= 30
  }).length

  return NextResponse.json({
    resumo: {
      mrr:               mrrRounded,
      arr:               Math.round(mrrRounded * 12 * 100) / 100,
      total_registros:   rows.length,
      cobrados:          cobrados.length,
      em_trial:          emTrial.length,
      past_due:          rows.filter(r => r.status === "past_due").length,
      cancelados:        rows.filter(r => r.status === "cancelado").length,
      renovando_em_breve: renovandoEmBreve,
    },
    breakdown,
  })
}
