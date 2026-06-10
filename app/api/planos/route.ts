import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from("user_planos")
    .select("plano, status, stripe_customer_id, stripe_subscription_id, assinatura_termina_em, trial_termina_em")
    .eq("user_id", auth.userId)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ plano: "trial", status: "ativo", hasStripe: false })
  }

  return NextResponse.json({
    plano:                  data.plano ?? "trial",
    status:                 data.status ?? "ativo",
    assinatura_termina_em:  data.assinatura_termina_em,
    trial_termina_em:       data.trial_termina_em,
    hasStripe:              !!data.stripe_subscription_id,
  })
}
