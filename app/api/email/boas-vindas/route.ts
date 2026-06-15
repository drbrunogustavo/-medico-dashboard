import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL    ?? "https://praxisplataforma.com.br"
const FROM_EMAIL = process.env.EMAIL_FROM             ?? "PRAXIS <onboarding@resend.dev>"
const REPLY_TO   = process.env.EMAIL_REPLY_TO         ?? "contato@praxisplataforma.com.br"

function buildHtml(nome: string): string {
  const primeiroNome = nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? nome
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao PRAXIS</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header / Logo -->
        <tr>
          <td align="center" style="padding:0 0 32px 0;">
            <div style="display:inline-block;background:#0D1B2A;border-radius:12px;padding:16px 32px;">
              <span style="color:#b8976a;font-size:22px;font-weight:800;letter-spacing:0.1em;">PRAXIS</span>
            </div>
          </td>
        </tr>

        <!-- Main card -->
        <tr>
          <td style="background:#FFFFFF;border-radius:20px;border:1px solid #e8ddd0;overflow:hidden;">

            <!-- Top accent -->
            <div style="background:linear-gradient(135deg,#b8976a,#d4af37);height:4px;"></div>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 40px 32px;">
              <tr>
                <td>
                  <h1 style="margin:0 0 12px;font-size:28px;font-weight:700;color:#0D1B2A;line-height:1.3;">
                    Olá, Dr. ${primeiroNome}! 🎉
                  </h1>
                  <p style="margin:0 0 24px;font-size:15px;color:#6a5a4a;line-height:1.7;">
                    Seja bem-vindo ao <strong style="color:#0D1B2A;">PRAXIS</strong> — a plataforma que vai transformar sua clínica.
                  </p>
                  <p style="margin:0 0 28px;font-size:15px;color:#6a5a4a;line-height:1.7;">
                    Você acaba de dar o primeiro passo para:
                  </p>

                  <!-- Bullets -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                    ${[
                      "Lotar sua agenda com pacientes particulares",
                      "Crescer no Instagram com conteúdo estratégico",
                      "Gerenciar sua clínica como um empresário",
                      "Ter uma IA trabalhando para você 24h/dia",
                    ].map(item => `
                    <tr>
                      <td style="padding:8px 0;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:28px;vertical-align:top;padding-top:2px;">
                              <span style="display:inline-block;width:20px;height:20px;background:#b8976a;border-radius:50%;text-align:center;line-height:20px;font-size:11px;color:#fff;font-weight:bold;">✓</span>
                            </td>
                            <td style="font-size:14px;color:#0D1B2A;line-height:1.5;padding-left:8px;">${item}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>`).join("")}
                  </table>

                  <!-- Divider -->
                  <div style="border-top:1px solid #e8ddd0;margin:0 0 28px;"></div>

                  <!-- Next steps -->
                  <h2 style="margin:0 0 20px;font-size:17px;font-weight:700;color:#0D1B2A;letter-spacing:-0.02em;">
                    Seus próximos passos:
                  </h2>

                  ${[
                    {
                      n: "1",
                      title: "Complete seu perfil",
                      desc: "Adicione sua especialidade e Instagram para personalizar toda a plataforma.",
                      href: `${APP_URL}/configuracoes`,
                      cta: "Completar perfil →",
                    },
                    {
                      n: "2",
                      title: "Faça seu Diagnóstico 360°",
                      desc: "Descubra onde sua clínica pode melhorar em minutos.",
                      href: `${APP_URL}/posicionamento`,
                      cta: "Fazer diagnóstico →",
                    },
                    {
                      n: "3",
                      title: "Gere seu primeiro conteúdo",
                      desc: "Use o Gerador de Roteiros para criar um Reel completo em 2 minutos.",
                      href: `${APP_URL}/roteiros`,
                      cta: "Criar conteúdo →",
                    },
                  ].map(step => `
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#F8F5F0;border-radius:12px;border:1px solid #e8ddd0;overflow:hidden;">
                    <tr>
                      <td style="width:52px;background:#b8976a;text-align:center;vertical-align:middle;padding:20px 0;">
                        <span style="font-size:18px;font-weight:800;color:#fff;">${step.n}</span>
                      </td>
                      <td style="padding:16px 20px;">
                        <div style="font-size:14px;font-weight:700;color:#0D1B2A;margin-bottom:4px;">${step.title}</div>
                        <div style="font-size:12px;color:#6a5a4a;line-height:1.5;margin-bottom:10px;">${step.desc}</div>
                        <a href="${step.href}" style="font-size:12px;font-weight:600;color:#b8976a;text-decoration:none;">${step.cta}</a>
                      </td>
                    </tr>
                  </table>`).join("")}

                  <!-- Divider -->
                  <div style="border-top:1px solid #e8ddd0;margin:28px 0;"></div>

                  <!-- Signature -->
                  <p style="margin:0 0 4px;font-size:14px;color:#6a5a4a;">Com toda a força,</p>
                  <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0D1B2A;">Dr. Bruno Gustavo</p>
                  <p style="margin:0 0 28px;font-size:12px;color:#9a8a7a;">Fundador do PRAXIS</p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="border-radius:12px;overflow:hidden;">
                        <a href="${APP_URL}/dashboard"
                          style="display:inline-block;background:#b8976a;color:#ffffff;font-size:14px;font-weight:700;padding:14px 28px;text-decoration:none;border-radius:12px;letter-spacing:0.01em;">
                          Acessar minha plataforma →
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 0;">
            <p style="margin:0 0 4px;font-size:11px;color:#9a8a7a;">
              Você está recebendo este email porque criou uma conta no PRAXIS.
            </p>
            <p style="margin:0;font-size:11px;color:#9a8a7a;">
              Dúvidas? Responda este email ou escreva para
              <a href="mailto:${REPLY_TO}" style="color:#b8976a;text-decoration:none;"> ${REPLY_TO}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY não configurado." }, { status: 503 })
  }

  const body = await req.json() as { nome?: string; email?: string }
  if (!body.nome || !body.email) {
    return NextResponse.json({ error: "nome e email são obrigatórios." }, { status: 400 })
  }

  const nome = body.nome.replace(/^Dr\.?\s*/i, "")
  const primeiroNome = nome.split(" ")[0] ?? nome

  const { data, error } = await resend.emails.send({
    from:     FROM_EMAIL,
    to:       [body.email],
    replyTo:  REPLY_TO,
    subject:  `Bem-vindo ao PRAXIS, Dr. ${primeiroNome}! 🎉`,
    html:     buildHtml(body.nome),
  })

  if (error) {
    console.error("[email/boas-vindas] Resend error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id }, { status: 201 })
}
