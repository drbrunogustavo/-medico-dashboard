import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { gerarNurturingInline } from "@/lib/nurturing"

type Fields = Record<string, string>

function parseBody(text: string, contentType: string): Fields {
  if (contentType.includes("application/json")) {
    const parsed = JSON.parse(text)
    // Elementor may wrap fields under a nested key or send flat
    return (parsed?.fields ?? parsed) as Fields
  }
  // application/x-www-form-urlencoded (Elementor default)
  const out: Fields = {}
  new URLSearchParams(text).forEach((v, k) => { out[k] = v })
  return out
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (!secret || secret !== process.env.LEADS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const rawText = await req.text()
  let fields: Fields
  try {
    fields = parseBody(rawText, req.headers.get("content-type") ?? "")
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" })
  }

  const nome     = fields["f_name"]?.trim()
  const telefone = fields["phone"]?.replace(/\D/g, "")

  if (!nome || !telefone) {
    // Return 200 to prevent Elementor retry loop showing error to visitor
    return NextResponse.json({ ok: false, error: "campos obrigatórios ausentes" })
  }

  // UTM: prefer query params (appended to webhook URL), fall back to form fields
  const utmSource = req.nextUrl.searchParams.get("utm_source")  ?? fields["utm_source"]  ?? null
  const campanha  = req.nextUrl.searchParams.get("utm_campaign") ?? fields["utm_campaign"] ?? null

  try {
    const supabase = createSupabaseServiceClient()

    const { data: lead, error } = await supabase
      .from("crm_leads")
      .insert({
        user_id:              process.env.DOCTOR_USER_ID ?? null,
        nome,
        telefone,
        email:                fields["email"]?.trim()  || null,
        unidade_atendimento:  fields["city"]            || null,
        origem:               "Site",
        utm_source:           utmSource,
        campanha,
        consentimento_lgpd:   fields["lgpd_consent"] === "on",
        estagio:              "novo",
        valor_potencial:      0,
      })
      .select("id")
      .single()

    if (error) throw new Error(error.message)

    if (lead?.id && process.env.DOCTOR_USER_ID) {
      const leadId = lead.id
      const userId = process.env.DOCTOR_USER_ID
      gerarNurturingInline(userId, leadId).catch(err =>
        console.error("[leads/webhook] nurturing:", err)
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[leads/webhook]", e)
    // Always 200 — never let Elementor show webhook error to the lead
    return NextResponse.json({ ok: true })
  }
}
