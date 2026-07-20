import { APP_URL, REPLY_TO } from "@/lib/email-boas-vindas"

// HTML do e-mail de "trial acabando". Fonte única — usada pelo webhook
// (customer.subscription.trial_will_end) e disponível para as rotas de e-mail.
export function buildTrialAcabandoHtml(nome: string, dias: number): string {
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
