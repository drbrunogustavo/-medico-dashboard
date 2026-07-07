import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

interface ZapiStatusResponse {
  connected?:            boolean
  smartphoneConnected?:  boolean
  error?:                string
  value?: {
    connected?:           boolean
    smartphoneConnected?: boolean
  }
}

export async function POST() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()

  // Prefer user-stored credentials; fall back to env vars
  const { data } = await supabase
    .from("integracoes_usuario")
    .select("config")
    .eq("user_id", auth.userId)
    .eq("tipo", "zapi")
    .eq("ativo", true)
    .maybeSingle()

  const cfg        = data?.config as { instance_id?: string; token?: string } | null
  const instanceId = cfg?.instance_id ?? process.env.ZAPI_INSTANCE_ID
  const token      = cfg?.token       ?? process.env.ZAPI_TOKEN

  if (!instanceId || !token) {
    return NextResponse.json({
      ok: false,
      error: "Credenciais Z-API não configuradas. Insira Instance ID e Token e salve.",
    })
  }

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/status`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`)
      return NextResponse.json({ ok: false, error: `Z-API retornou ${res.status}: ${text.slice(0, 200)}` })
    }

    const data = await res.json() as ZapiStatusResponse
    const connected           = data.connected           ?? data.value?.connected           ?? false
    const smartphoneConnected = data.smartphoneConnected ?? data.value?.smartphoneConnected ?? false

    return NextResponse.json({ ok: true, connected, smartphoneConnected })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
