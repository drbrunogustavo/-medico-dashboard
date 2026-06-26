import { createSupabaseServiceClient } from "@/lib/supabase-service"

type ZapiResult = { ok: boolean; error?: string }

async function callZapiApi(instanceId: string, token: string, phone: string, message: string): Promise<ZapiResult> {
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: phone.replace(/\D/g, ""), message }),
      }
    )
    if (!res.ok) {
      const data = await res.json() as { message?: string }
      return { ok: false, error: data.message ?? `Erro Z-API ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export async function sendZapi(phone: string, message: string): Promise<ZapiResult> {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token      = process.env.ZAPI_TOKEN
  if (!instanceId || !token) return { ok: false, error: "Z-API não configurada" }
  return callZapiApi(instanceId, token, phone, message)
}

export async function sendZapiForUser(userId: string, phone: string, message: string): Promise<ZapiResult> {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from("integracoes_usuario")
    .select("config")
    .eq("user_id", userId)
    .eq("tipo", "zapi")
    .eq("ativo", true)
    .single()

  const cfg        = data?.config as { instance_id?: string; token?: string } | null
  const instanceId = cfg?.instance_id ?? process.env.ZAPI_INSTANCE_ID
  const token      = cfg?.token       ?? process.env.ZAPI_TOKEN

  if (!instanceId || !token) return { ok: false, error: "Z-API não configurada" }
  return callZapiApi(instanceId, token, phone, message)
}
