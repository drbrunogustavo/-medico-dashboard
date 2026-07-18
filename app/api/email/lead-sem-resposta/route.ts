import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL    ?? "https://praxisplataforma.com.br"
const FROM_EMAIL = process.env.EMAIL_FROM             ?? "PRAXIS <onboarding@resend.dev>"
const REPLY_TO   = process.env.EMAIL_REPLY_TO         ?? "contato@praxisplataforma.com.br"

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}

function horasAtras(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
}

function buildHtml(nome: string, leads: Array<{ nome: string; horas: number }>): string {
  const primeiroNome = nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? nome
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>Leads sem resposta</title></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <tr><td align="center" style="padding:0 0 24px 0;">
        <div style="display:inline-block;background:#0D1B2A;border-radius:12px;padding:14px 28px;">
          <span style="color:#b8976a;font-size:20px;font-weight:800;letter-spacing:0.1em;">PRAXIS</span>
        </div>
      </td></tr>

      <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #e8ddd0;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);height:4px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 40px 32px;">
          <tr><td>

            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0D1B2A;">
              ⏰ Leads aguardando resposta
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6a5a4a;line-height:1.7;">
              Olá, Dr. ${primeiroNome}! Você tem <strong>${leads.length} lead${leads.length !== 1 ? "s" : ""}</strong> sem follow-up há mais de 48 horas.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid #e8ddd0;border-radius:12px;overflow:hidden;">
              <tr style="background:#F8F5F0;">
                <th style="text-align:left;padding:10px 16px;font-size:11px;color:#8a7a6a;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Lead</th>
                <th style="text-align:right;padding:10px 16px;font-size:11px;color:#8a7a6a;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Aguardando</th>
              </tr>
              ${leads.slice(0, 10).map(l => `
              <tr style="border-top:1px solid #e8ddd0;">
                <td style="padding:12px 16px;font-size:13px;color:#0D1B2A;font-weight:500;">${l.nome}</td>
                <td style="padding:12px 16px;font-size:12px;color:#d97706;font-weight:600;text-align:right;font-family:monospace;">${Math.round(l.horas)}h</td>
              </tr>`).join("")}
              ${leads.length > 10 ? `
              <tr style="border-top:1px solid #e8ddd0;background:#F8F5F0;">
                <td colspan="2" style="padding:10px 16px;font-size:12px;color:#8a7a6a;text-align:center;">
                  + ${leads.length - 10} outros leads
                </td>
              </tr>` : ""}
            </table>

            <table cellpadding="0" cellspacing="0">
              <tr><td style="border-radius:12px;overflow:hidden;">
                <a href="${APP_URL}/crm"
                  style="display:inline-block;background:#b8976a;color:#fff;font-size:14px;font-weight:700;padding:14px 28px;text-decoration:none;border-radius:12px;">
                  Ver leads no CRM →
                </a>
              </td></tr>
            </table>

            <div style="border-top:1px solid #e8ddd0;margin:28px 0 0;padding-top:20px;">
              <p style="margin:0;font-size:11px;color:#9a8a7a;">
                Você está recebendo este email porque tem notificações de leads ativas no PRAXIS.
                <a href="${APP_URL}/configuracoes" style="color:#b8976a;text-decoration:none;"> Gerenciar preferências</a>
              </p>
            </div>

          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY não configurado" }, { status: 503 })
  }

  try {
    const supabase = createSupabaseServiceClient()
    const cutoff   = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    // Leads sem atualização há 48h+ e não fechados/convertidos
    const { data: leads } = await supabase
      .from("crm_leads")
      .select("user_id, nome, updated_at")
      .lt("updated_at", cutoff)
      .not("estagio", "in", '("fechado","convertido","perdido")')
      .order("updated_at", { ascending: true })

    if (!leads || leads.length === 0) {
      return NextResponse.json({ ok: true, enviados: 0 })
    }

    // Group by user_id
    const byUser: Record<string, Array<{ nome: string; horas: number }>> = {}
    for (const lead of leads) {
      if (!byUser[lead.user_id]) byUser[lead.user_id] = []
      byUser[lead.user_id].push({ nome: lead.nome, horas: horasAtras(lead.updated_at) })
    }

    let enviados = 0
    for (const [userId, userLeads] of Object.entries(byUser)) {
      const { data: auth_user } = await supabase.auth.admin.getUserById(userId)
      const email = auth_user?.user?.email
      if (!email) continue

      const { data: perfil } = await supabase
        .from("perfis")
        .select("nome")
        .eq("user_id", userId)
        .maybeSingle()

      const nome = perfil?.nome ?? email.split("@")[0]
      const { error } = await getResend().emails.send({
        from:    FROM_EMAIL,
        to:      [email],
        replyTo: REPLY_TO,
        subject: `⏰ ${userLeads.length} lead${userLeads.length !== 1 ? "s" : ""} sem resposta há mais de 48h`,
        html:    buildHtml(nome, userLeads),
      })
      if (!error) enviados++
    }

    return NextResponse.json({ ok: true, enviados })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
