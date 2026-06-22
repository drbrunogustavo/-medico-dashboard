import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { isAdmin } from "@/lib/admin-auth"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (!isAdmin(auth.userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const supabase = createSupabaseServiceClient()

  const [afiliadosRes, indicacoesRes, perfisRes] = await Promise.all([
    supabase
      .from("afiliados")
      .select("id, user_id, codigo_afiliado, comissao_percentual, status, total_indicados, total_comissao_acumulada")
      .order("total_comissao_acumulada", { ascending: false }),
    supabase
      .from("afiliados_indicacoes")
      .select("afiliado_id, status, valor_comissao, indicado_email, aplicado_em, created_at, origem"),
    supabase
      .from("perfis")
      .select("user_id, nome, especialidade"),
  ])

  if (afiliadosRes.error) return NextResponse.json({ error: afiliadosRes.error.message }, { status: 500 })

  const indicacoes = indicacoesRes.data ?? []
  const perfisMap  = Object.fromEntries((perfisRes.data ?? []).map(p => [p.user_id, p]))

  // Group indicacoes by afiliado_id
  const indMap: Record<string, typeof indicacoes> = {}
  for (const ind of indicacoes) {
    if (!indMap[ind.afiliado_id]) indMap[ind.afiliado_id] = []
    indMap[ind.afiliado_id].push(ind)
  }

  const afiliados = (afiliadosRes.data ?? []).map(a => {
    const perfil = perfisMap[a.user_id] ?? {}
    const inds   = indMap[a.id] ?? []
    return {
      id:                      a.id,
      user_id:                 a.user_id,
      nome:                    perfil.nome          ?? null,
      especialidade:           perfil.especialidade ?? null,
      codigo_afiliado:         a.codigo_afiliado,
      comissao_percentual:     a.comissao_percentual,
      status:                  a.status,
      total_indicados:         a.total_indicados         ?? inds.length,
      total_comissao_acumulada: a.total_comissao_acumulada ?? 0,
      convertidos:             inds.filter(i => i.status === "aplicada").length,
      pendentes:               inds.filter(i => i.status === "pendente").length,
      indicacoes:              inds.map(i => ({
        indicado_email: i.indicado_email,
        status:         i.status,
        valor_comissao: i.valor_comissao,
        aplicado_em:    i.aplicado_em,
        created_at:     i.created_at,
        origem:         i.origem,
      })),
    }
  })

  // Summary totals
  const totals = {
    total_afiliados:   afiliados.length,
    total_indicacoes:  indicacoes.length,
    total_convertidos: indicacoes.filter(i => i.status === "aplicada").length,
    total_pendentes:   indicacoes.filter(i => i.status === "pendente").length,
    total_comissao:    afiliados.reduce((s, a) => s + (a.total_comissao_acumulada ?? 0), 0),
  }

  return NextResponse.json({ afiliados, totals })
}
