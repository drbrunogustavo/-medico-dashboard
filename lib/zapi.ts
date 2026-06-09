export async function sendZapi(phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token      = process.env.ZAPI_TOKEN
  if (!instanceId || !token) return { ok: false, error: "Z-API não configurada" }

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
