import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend     = new Resend(process.env.RESEND_API_KEY)
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL    ?? "https://praxisplataforma.com.br"
const FROM_EMAIL = process.env.EMAIL_FROM             ?? "PRAXIS <onboarding@resend.dev>"
const REPLY_TO   = process.env.EMAIL_REPLY_TO         ?? "contato@praxisplataforma.com.br"

function buildHtml(nome: string, pacienteNome: string, nota: number, comentario: string | null): string {
  const primeiroNome = nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? nome
  const notaColor    = nota <= 3 ? "#ef4444" : "#f59e0b"
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>Avaliação baixa recebida</title></head>
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
        <div style="background:linear-gradient(135deg,${notaColor},${notaColor}cc);height:4px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 40px 32px;">
          <tr><td>

            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0D1B2A;">
              ⚠️ Atenção: avaliação baixa recebida
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6a5a4a;line-height:1.7;">
              Dr. ${primeiroNome}, um paciente respondeu a pesquisa NPS com uma nota baixa.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#FFF5F5;border:1px solid #fecaca;border-radius:12px;overflow:hidden;">
              <tr><td style="padding:20px 24px;">
                <div style="display:flex;align-items:center;gap:16px;">
                  <div style="font-size:36px;font-weight:800;color:${notaColor};font-family:monospace;min-width:48px;">${nota}</div>
                  <div>
                    <div style="font-size:13px;font-weight:600;color:#0D1B2A;margin-bottom:2px;">Paciente: ${pacienteNome}</div>
                    <div style="font-size:12px;color:#6a5a4a;">Nota: ${nota}/10 — ${nota <= 6 ? "Detrator" : "Neutro"}</div>
                  </div>
                </div>
                ${comentario ? `
                <div style="margin-top:16px;padding:12px 16px;background:#fff;border-radius:8px;border:1px solid #fecaca;">
                  <p style="margin:0;font-size:13px;color:#6a5a4a;line-height:1.6;font-style:italic;">"${comentario}"</p>
                </div>` : ""}
              </td></tr>
            </table>

            <div style="background:#F8F5F0;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#0D1B2A;">💡 Sugestão:</p>
              <p style="margin:0;font-size:13px;color:#6a5a4a;line-height:1.6;">
                Considere entrar em contato com ${pacienteNome} para entender melhor a experiência.
                Um simples WhatsApp pode transformar um detrator em promotor da sua clínica.
              </p>
            </div>

            <table cellpadding="0" cellspacing="0">
              <tr><td style="border-radius:12px;overflow:hidden;">
                <a href="${APP_URL}/nps"
                  style="display:inline-block;background:#b8976a;color:#fff;font-size:14px;font-weight:700;padding:14px 28px;text-decoration:none;border-radius:12px;">
                  Ver pesquisas NPS →
                </a>
              </td></tr>
            </table>

            <div style="border-top:1px solid #e8ddd0;margin:28px 0 0;padding-top:20px;">
              <p style="margin:0;font-size:11px;color:#9a8a7a;">
                Você recebe este alerta porque tem notificações de NPS ativas.
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

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY não configurado" }, { status: 503 })
  }

  const body = await req.json() as {
    email:        string
    nome:         string
    pacienteNome: string
    nota:         number
    comentario?:  string | null
  }

  if (!body.email || !body.nota) {
    return NextResponse.json({ error: "email e nota são obrigatórios" }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from:    FROM_EMAIL,
    to:      [body.email],
    replyTo: REPLY_TO,
    subject: `⚠️ Avaliação NPS baixa: ${body.pacienteNome} deu nota ${body.nota}`,
    html:    buildHtml(body.nome, body.pacienteNome, body.nota, body.comentario ?? null),
  })

  if (error) {
    console.error("[email/nps-baixo]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
