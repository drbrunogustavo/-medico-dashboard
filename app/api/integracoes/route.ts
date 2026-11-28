import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { originGuard } from "@/lib/check-origin"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { erroInterno } from "@/lib/api-erro"
import { cifrarConfig, lerConfig, mascararConfig, mesclarSegredos, type ConfigIntegracao } from "@/lib/cripto-config"

const CAMPOS: Record<string, string[]> = {
  zapi: ["instance_id", "token"],
  instagram: ["page_id", "access_token"],
  stripe: ["secret_key", "webhook_secret"],
  resend: ["api_key", "from_email"],
  medx: ["url", "integration_token"],
}

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("integracoes_usuario")
    .select("tipo, config, ativo")
    .eq("user_id", auth.userId)

  if (error) return erroInterno("[integracoes]", error)
  return NextResponse.json((data ?? []).map(r => ({ ...r, config: mascararConfig(lerConfig(r.config)) })))
}

export async function POST(req: NextRequest) {
  const bloqueio = originGuard(req)
  if (bloqueio) return bloqueio
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const corpo = await req.json().catch(() => null) as { tipo?: unknown; config?: unknown } | null
  const tipo = corpo?.tipo
  if (typeof tipo !== "string" || !CAMPOS[tipo]) return NextResponse.json({ error: "Integração inválida." }, { status: 400 })
  const bruto = corpo?.config
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return NextResponse.json({ error: "Configuração inválida." }, { status: 400 })

  const config: ConfigIntegracao = {}
  for (const campo of CAMPOS[tipo]) {
    const v = (bruto as Record<string, unknown>)[campo]
    if (v === undefined || v === null) continue
    if (typeof v !== "string" || v.length > 500) return NextResponse.json({ error: "Configuração inválida." }, { status: 400 })
    config[campo] = v.trim()
  }

  const supabase = createSupabaseServerClient()
  const { data: existente } = await supabase
    .from("integracoes_usuario")
    .select("config")
    .eq("user_id", auth.userId)
    .eq("tipo", tipo)
    .maybeSingle()
  const final = mesclarSegredos(config, lerConfig(existente?.config))

  const { data, error } = await supabase
    .from("integracoes_usuario")
    .upsert(
      { user_id: auth.userId, tipo, config: cifrarConfig(final), ativo: true },
      { onConflict: "user_id,tipo" }
    )
    .select("tipo, ativo")
    .single()

  if (error) return erroInterno("[integracoes]", error)
  return NextResponse.json({ ...data, config: mascararConfig(final) })
}
