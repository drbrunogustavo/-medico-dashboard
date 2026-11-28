import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { originGuard } from "@/lib/check-origin"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("perfis")
    .select("*")
    .eq("user_id", auth.userId)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("[perfil] GET:", error)
    return NextResponse.json({ error: "Não foi possível carregar o perfil." }, { status: 500 })
  }

  return NextResponse.json(data ?? null)
}

const CAMPOS_TEXTO: Record<string, number> = {
  nome: 120, especialidade: 120, crm: 40, cidade: 120, instagram: 80, publico_alvo: 600, diferencial: 600,
  avatar_url: 500, marca_logo_url: 500, marca_tipografia: 60, marca_slogan: 200, marca_tom_voz: 60, problema: 300,
}
const CAMPOS_COR = ["marca_cor_primaria", "marca_cor_secundaria", "marca_cor_fundo"]
const CAMPOS_BOOL = ["onboarding_completo", "voz_gravacao_autorizada"]
const COR = /^#[0-9a-fA-F]{6}$/

export async function PATCH(req: NextRequest) {
  const blocked = originGuard(req)
  if (blocked) return blocked
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> } catch { return NextResponse.json({ error: "Corpo inválido." }, { status: 400 }) }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })

  // Só campos conhecidos entram no upsert. Qualquer outra coluna da tabela fica fora do alcance do cliente.
  const dados: Record<string, unknown> = {}
  for (const [campo, max] of Object.entries(CAMPOS_TEXTO)) {
    if (!(campo in body)) continue
    const v = body[campo]
    if (v === null) { dados[campo] = null; continue }
    if (typeof v !== "string" || v.length > max) return NextResponse.json({ error: `Campo inválido: ${campo}.` }, { status: 400 })
    dados[campo] = v
  }
  for (const campo of CAMPOS_COR) {
    if (!(campo in body)) continue
    const v = body[campo]
    if (typeof v !== "string" || !COR.test(v)) return NextResponse.json({ error: `Cor inválida: ${campo}.` }, { status: 400 })
    dados[campo] = v
  }
  for (const campo of CAMPOS_BOOL) {
    if (!(campo in body)) continue
    if (typeof body[campo] !== "boolean") return NextResponse.json({ error: `Campo inválido: ${campo}.` }, { status: 400 })
    dados[campo] = body[campo]
  }
  if ("termos_aceitos_em" in body) {
    const v = body.termos_aceitos_em
    if (typeof v !== "string" || Number.isNaN(Date.parse(v))) return NextResponse.json({ error: "Data inválida: termos_aceitos_em." }, { status: 400 })
    dados.termos_aceitos_em = v
  }
  if (Object.keys(dados).length === 0) return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("perfis")
    .upsert({ ...dados, user_id: auth.userId }, { onConflict: "user_id" })
    .select()
    .single()

  if (error) {
    console.error("[perfil] PATCH:", error)
    return NextResponse.json({ error: "Não foi possível salvar o perfil." }, { status: 500 })
  }
  return NextResponse.json(data)
}
