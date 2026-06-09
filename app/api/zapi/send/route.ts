import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token      = process.env.ZAPI_TOKEN

  if (!instanceId || !token) {
    return NextResponse.json(
      { error: "Z-API não configurada. Adicione ZAPI_INSTANCE_ID e ZAPI_TOKEN nas variáveis de ambiente do Vercel." },
      { status: 503 }
    )
  }

  const body = await req.json() as { phone?: string; message?: string }
  const { phone, message } = body

  if (!phone?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "phone e message são obrigatórios" }, { status: 400 })
  }

  // Remove tudo que não é dígito; Z-API espera só números com DDI
  const phoneNormalized = phone.replace(/\D/g, "")

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: phoneNormalized, message }),
      }
    )

    const data = await res.json() as { message?: string; zaapId?: string }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message ?? `Erro Z-API: ${res.status}` },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, zaapId: data.zaapId })
  } catch (e) {
    console.error("[api/zapi/send]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
