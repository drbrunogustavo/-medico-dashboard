import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

// ─── PREÇOS DO MARKETPLACE ───────────────────────────────────────────────────
// Atualizar aqui se os valores mudarem. Valores em centavos (BRL).
// IMPORTANTE: atualizar também PRECOS em app/anunciar-curso/page.tsx
const PRECOS: Record<number, number> = {
  7:  15000,  // R$ 150,00
  15: 25000,  // R$ 250,00
  30: 40000,  // R$ 400,00
}
// ─────────────────────────────────────────────────────────────────────────────

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 })
  }

  let body: {
    titulo: string
    chamada: string
    link_destino: string
    anunciante_nome: string
    anunciante_foto_url?: string
    contato_email: string
    contato_telefone?: string
    periodo_dias: number
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 })
  }

  const { titulo, chamada, link_destino, anunciante_nome, contato_email, periodo_dias } = body

  if (!titulo || !chamada || !link_destino || !anunciante_nome || !contato_email || !periodo_dias) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 })
  }

  if (![7, 15, 30].includes(periodo_dias)) {
    return NextResponse.json({ error: "periodo_dias deve ser 7, 15 ou 30." }, { status: 400 })
  }

  const valorCentavos = PRECOS[periodo_dias]
  // TODO: preferir req.headers.get("origin") com whitelist em vez de NEXT_PUBLIC_APP_URL
  //       para evitar open-redirect caso origin seja manipulado por client malicioso.
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? req.nextUrl.origin

  // 1. Cria registro como 'aguardando_pagamento' (service_role bypassa RLS)
  const supabase = createSupabaseServiceClient()
  const { data: anuncio, error: insertErr } = await supabase
    .from("anuncios_cursos")
    .insert({
      titulo,
      chamada,
      link_destino,
      anunciante_nome,
      anunciante_foto_url:  body.anunciante_foto_url ?? null,
      contato_email,
      contato_telefone:     body.contato_telefone ?? null,
      periodo_dias,
      status:               "aguardando_pagamento",
    })
    .select("id")
    .single()

  if (insertErr || !anuncio) {
    console.error("[checkout-anuncio] insert:", insertErr)
    return NextResponse.json({ error: "Erro ao registrar anúncio." }, { status: 500 })
  }

  // 2. Cria sessão Stripe mode:"payment" (pagamento único, não assinatura)
  try {
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      line_items: [{
        quantity:   1,
        price_data: {
          currency:     "brl",
          unit_amount:  valorCentavos,
          product_data: {
            name:        `Anúncio Praxis — ${periodo_dias} dias`,
            description: titulo,
          },
        },
      }],
      customer_email: contato_email,
      success_url:    `${origin}/anunciar-curso?sucesso=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:     `${origin}/anunciar-curso`,
      metadata:       { anuncio_id: anuncio.id },
      locale:         "pt-BR",
    })

    console.log("[checkout-anuncio] session criada:", session.id, "anuncio:", anuncio.id)
    return NextResponse.json({ url: session.url })
  } catch (e) {
    // Se Stripe falhou, limpa o registro para não deixar lixo aguardando_pagamento
    await supabase.from("anuncios_cursos").delete().eq("id", anuncio.id)
    console.error("[checkout-anuncio] stripe:", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
