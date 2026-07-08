import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { sendZapiForUser } from "@/lib/zapi"
import { logAutomacao } from "@/lib/automacoes-log"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  let userId: string | undefined

  if (isCronAuthorized(req)) {
    userId = undefined           // cron: processa todos os usuários
  } else {
    const auth = await checkAuth()
    if (!auth.authenticated) return auth.response
    userId = auth.userId         // usuário logado: só os registros dele
  }

  const supabase = createSupabaseServiceClient()
  const now      = new Date().toISOString()
  const result   = { nurturing: 0, reativacao: 0 }

  try {

    // ── 1. Nurturing sequences ────────────────────────────────────────────────
    {
      let q = supabase
        .from("nurturing_sequencias")
        .select("id, lead_id, mensagem, user_id")
        .lte("agendado_para", now)
        .eq("status", "pendente")
      if (userId) q = q.eq("user_id", userId)

      const { data: seqs } = await q
      for (const seq of seqs ?? []) {
        const { data: lead } = await supabase
          .from("crm_leads").select("telefone").eq("id", seq.lead_id).single()
        if (!lead?.telefone) continue

        const { ok } = await sendZapiForUser(seq.user_id as string, lead.telefone, seq.mensagem)
        if (ok) {
          await supabase
            .from("nurturing_sequencias")
            .update({ status: "enviado", enviado_em: new Date().toISOString() })
            .eq("id", seq.id)
          result.nurturing++
        }
        await sleep(150)
      }
    }

    // ── 2. Reativação de pacientes ────────────────────────────────────────────
    // Envia mensagem_gerada (gerada pela IA) para pacientes status='inativo'.
    // Pré-condição: médico deve ter gerado a mensagem antes via /reativacao.
    // Após envio: status → 'contatado' (guarda de idempotência — nunca reenvia).
    {
      let q = supabase
        .from("pacientes_reativacao")
        .select("id, telefone, mensagem_gerada, user_id")
        .eq("status", "inativo")
        .not("mensagem_gerada", "is", null)
        .not("telefone", "is", null)
      if (userId) q = q.eq("user_id", userId)

      const { data: rows } = await q
      for (const row of rows ?? []) {
        const { ok } = await sendZapiForUser(row.user_id as string, row.telefone as string, row.mensagem_gerada as string)
        if (ok) {
          await supabase
            .from("pacientes_reativacao")
            .update({ status: "contatado", enviado_automaticamente: true, enviado_automaticamente_em: new Date().toISOString() })
            .eq("id", row.id)
          result.reativacao++
        }
        await sleep(150)
      }
    }

    await logAutomacao("nurturing", "ok", result as Record<string, unknown>)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    await logAutomacao("nurturing", "erro", { error: errMsg(e) })
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
