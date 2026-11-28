import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { isAdmin } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url         = new URL(req.url)
  const statusParam = url.searchParams.get("status") ?? "pendente"
  const tipoParam   = url.searchParams.get("tipo")
  const supabase = createSupabaseServiceClient()
  let query = supabase
    .from("anuncios_cursos")
    .select("id, created_at, titulo, chamada, link_destino, anunciante_nome, anunciante_foto_url, contato_email, contato_telefone, periodo_dias, data_inicio, data_fim, status, tipo_produto")
    .order("created_at", { ascending: false })

  if (statusParam !== "all") {
    const statuses = statusParam.split(",")
    query = statuses.length === 1
      ? query.eq("status", statuses[0])
      : query.in("status", statuses)
  }
  if (tipoParam) query = query.eq("tipo_produto", tipoParam)

  const { data, error } = await query
  if (error) {
    console.error("[admin/anuncios] erro ao listar:", error)
    return NextResponse.json({ error: "Não foi possível carregar os anúncios." }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null) as { id?: unknown; status?: unknown; data_inicio?: unknown; data_fim?: unknown } | null
  const id = typeof body?.id === "string" ? body.id : ""
  const status = typeof body?.status === "string" ? body.status : ""
  if (!id || !status) return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 })
  if (status !== "aprovado" && status !== "rejeitado") {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 })
  }

  const dataOk = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
  const data_inicio = dataOk(body?.data_inicio) ? body!.data_inicio as string : undefined
  const data_fim    = dataOk(body?.data_fim)    ? body!.data_fim    as string : undefined
  if (status === "aprovado") {
    if (!data_inicio || !data_fim) return NextResponse.json({ error: "Informe início e fim da veiculação." }, { status: 400 })
    if (data_fim < data_inicio)    return NextResponse.json({ error: "A data final não pode ser anterior à inicial." }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  // Só anúncios já pagos e em revisão podem ser aprovados; rejeitar vale para pago em revisão
  // ou ainda aguardando pagamento (nesse caso não há o que estornar).
  const { data: atual, error: atualErr } = await supabase.from("anuncios_cursos").select("status").eq("id", id).maybeSingle()
  if (atualErr) {
    console.error("[admin/anuncios] erro ao ler anúncio:", atualErr)
    return NextResponse.json({ error: "Não foi possível ler o anúncio." }, { status: 500 })
  }
  if (!atual) return NextResponse.json({ error: "Anúncio não encontrado." }, { status: 404 })
  const permitidos = status === "aprovado" ? ["pendente"] : ["pendente", "aguardando_pagamento"]
  if (!permitidos.includes(atual.status as string)) {
    return NextResponse.json({ error: "A situação deste anúncio mudou. Atualize a lista." }, { status: 409 })
  }

  // Estorno automático quando admin rejeita anúncio já pago
  if (status === "rejeitado") {
    const { data: anuncio } = await supabase
      .from("anuncios_cursos")
      .select("stripe_payment_intent_id")
      .eq("id", id)
      .single()

    const paymentIntentId = anuncio?.stripe_payment_intent_id as string | null
    if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        await stripe.refunds.create({ payment_intent: paymentIntentId })
        console.log(`[admin/anuncios] Estorno realizado — PI: ${paymentIntentId}`)
      } catch (e) {
        console.error("[admin/anuncios] Erro ao estornar:", e)
        return NextResponse.json({ error: "Erro ao processar estorno. Verifique o Stripe. O anúncio não foi rejeitado." }, { status: 500 })
      }
    }
  }

  const updates: Record<string, unknown> = { status }
  if (data_inicio) updates.data_inicio = data_inicio
  if (data_fim)    updates.data_fim    = data_fim

  const { error } = await supabase.from("anuncios_cursos").update(updates).eq("id", id).eq("status", atual.status as string)
  if (error) {
    console.error("[admin/anuncios] erro ao atualizar:", error)
    return NextResponse.json({ error: "Não foi possível atualizar o anúncio." }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const supabase = createSupabaseServiceClient()
  // Anúncio pago e em revisão não se exclui: a exclusão não estorna. Rejeitar antes.
  const { data: atual } = await supabase.from("anuncios_cursos").select("status").eq("id", id).maybeSingle()
  if (atual?.status === "pendente") {
    return NextResponse.json({ error: "Este anúncio já foi pago. Rejeite para estornar antes de excluir." }, { status: 409 })
  }
  const { error } = await supabase.from("anuncios_cursos").delete().eq("id", id)
  if (error) {
    console.error("[admin/anuncios] erro ao excluir:", error)
    return NextResponse.json({ error: "Não foi possível excluir o anúncio." }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
