import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

const resend     = new Resend(process.env.RESEND_API_KEY)
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL    ?? "https://praxisplataforma.com.br"
const FROM_EMAIL = process.env.EMAIL_FROM             ?? "PRAXIS <onboarding@resend.dev>"
const REPLY_TO   = process.env.EMAIL_REPLY_TO         ?? "contato@praxisplataforma.com.br"

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}

function diasRestantes(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function buildHtml(nome: string, dias: number): string {
  const primeiroNome = nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? nome
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>Seu trial expira em breve</title></head>
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
        <div style="background:linear-gradient(135deg,#b8976a,#d4af37);height:4px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 40px 32px;">
          <tr><td>

            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0D1B2A;">
              🔔 Seu trial expira em ${dias} dia${dias !== 1 ? "s" : ""}
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6a5a4a;line-height:1.7;">
              Dr. ${primeiroNome}, seu período de trial gratuito está chegando ao fim.
              Para continuar usando o PRAXIS sem interrupções, escolha seu plano agora.
            </p>

            <div style="background:#F8F5F0;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0D1B2A;">
                O que você vai preservar ao assinar:
              </p>
              ${[
                "Todos os seus pacientes e leads cadastrados",
                "Histórico de consultas do Copiloto IA",
                "Protocolos e prescrições criados",
                "Pautas e conteúdos gerados",
              ].map(item => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="color:#b8976a;font-size:14px;font-weight:700;">✓</span>
                <span style="font-size:13px;color:#6a5a4a;">${item}</span>
              </div>`).join("")}
            </div>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
              <tr><td style="border-radius:12px;overflow:hidden;">
                <a href="${APP_URL}/planos"
                  style="display:inline-block;background:#b8976a;color:#fff;font-size:14px;font-weight:700;padding:14px 28px;text-decoration:none;border-radius:12px;">
                  Escolher meu plano →
                </a>
              </td></tr>
            </table>

            <p style="margin:0 0 0;font-size:12px;color:#9a8a7a;">
              Dúvidas? Responda este email ou escreva para
              <a href="mailto:${REPLY_TO}" style="color:#b8976a;text-decoration:none;"> ${REPLY_TO}</a>
            </p>

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
    const now      = new Date()
    const daqui2d  = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const daqui3d  = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const { data: planos } = await supabase
      .from("user_planos")
      .select("user_id, trial_termina_em")
      .eq("plano", "trial")
      .eq("status", "ativo")
      .gte("trial_termina_em", daqui2d)
      .lte("trial_termina_em", daqui3d)

    if (!planos || planos.length === 0) {
      return NextResponse.json({ ok: true, enviados: 0 })
    }

    const { data: perfisRows } = await supabase
      .from("perfis")
      .select("user_id, nome")
      .in("user_id", planos.map(p => p.user_id))
    const nomeByUserId = Object.fromEntries((perfisRows ?? []).map(p => [p.user_id as string, p.nome as string | null]))

    let enviados = 0
    for (const plano of planos) {
      const { data: auth_user } = await supabase.auth.admin.getUserById(plano.user_id)
      const email = auth_user?.user?.email
      if (!email) continue

      const dias    = diasRestantes(plano.trial_termina_em)
      const nomeRaw = nomeByUserId[plano.user_id] ?? email.split("@")[0]
      const { error } = await resend.emails.send({
        from:    FROM_EMAIL,
        to:      [email],
        replyTo: REPLY_TO,
        subject: `🔔 Seu trial PRAXIS expira em ${dias} dia${dias !== 1 ? "s" : ""}`,
        html:    buildHtml(nomeRaw, dias),
      })
      if (!error) enviados++
    }

    return NextResponse.json({ ok: true, enviados })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
