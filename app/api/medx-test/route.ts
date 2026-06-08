import { NextResponse } from "next/server"
import { getAuthToken, getUsuariosAgenda, getStatusAgenda } from "@/lib/medx"

export async function GET() {
  const steps: Record<string, unknown> = {}

  // 1. Variáveis de ambiente configuradas?
  steps.env = {
    MEDX_URL:               process.env.MEDX_URL               ? "✓ definida" : "✗ ausente",
    MEDX_INTEGRATION_TOKEN: process.env.MEDX_INTEGRATION_TOKEN ? "✓ definida" : "✗ ausente",
  }

  // 2. Obter token de autenticação
  try {
    const token = await getAuthToken()
    steps.auth = {
      ok:     true,
      token:  token.slice(0, 20) + "…",   // mostra apenas início por segurança
      length: token.length,
    }
  } catch (err) {
    steps.auth = { ok: false, error: String(err) }
    return NextResponse.json({ ok: false, steps }, { status: 500 })
  }

  // 3. Chamar GetUsuariosAgenda
  try {
    const usuarios = await getUsuariosAgenda()
    steps.usuarios = { ok: true, count: Array.isArray(usuarios) ? usuarios.length : "?", data: usuarios }
  } catch (err) {
    steps.usuarios = { ok: false, error: String(err) }
  }

  // 4. Chamar GetStatusNomeAgenda (bônus)
  try {
    const status = await getStatusAgenda()
    steps.status = { ok: true, count: Array.isArray(status) ? status.length : "?", data: status }
  } catch (err) {
    steps.status = { ok: false, error: String(err) }
  }

  const allOk = !!(
    steps.auth && (steps.auth as Record<string, unknown>).ok &&
    steps.usuarios && (steps.usuarios as Record<string, unknown>).ok
  )

  return NextResponse.json({ ok: allOk, steps }, { status: allOk ? 200 : 500 })
}
