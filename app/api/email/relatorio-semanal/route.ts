import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? "https://praxisplataforma.com.br"
const FROM_EMAIL = process.env.EMAIL_FROM         ?? "PRAXIS <onboarding@resend.dev>"
const REPLY_TO  = process.env.EMAIL_REPLY_TO      ?? "contato@praxisplataforma.com.br"

// ─── Auth check (cron or user) ────────────────────────────────────────────────

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

interface Metrics {
  nome:           string
  leads_novos:    number
  leads_total:    number
  nps_score:      number | null
  pautas_total:   number
  receita_mes:    number
}

function buildHtml(m: Metrics): string {
  const npsColor = m.nps_score === null ? "#9a8a7a"
    : m.nps_score >= 8 ? "#10b981"
    : m.nps_score >= 6 ? "#f59e0b"
    : "#ef4444"

  const metricCards = [
    { label: "Leads novos (7 dias)", value: m.leads_novos.toString(),                            color: "#10b981" },
    { label: "Total no CRM",         value: m.leads_total.toString(),                            color: "#b8976a" },
    { label: "Receita do mês",       value: `R$ ${m.receita_mes.toLocaleString("pt-BR")}`,       color: "#10b981" },
    { label: "Nota média NPS (30d)", value: m.nps_score !== null ? m.nps_score.toString() : "—", color: npsColor  },
    { label: "Pautas salvas",        value: m.pautas_total.toString(),                           color: "#b8976a" },
  ]

  const primeiroNome = m.nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? m.nome
  const semana = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório Semanal PRAXIS</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:0 0 28px 0;">
            <div style="display:inline-block;background:#0D1B2A;border-radius:12px;padding:14px 28px;">
              <span style="color:#b8976a;font-size:20px;font-weight:800;letter-spacing:0.1em;">PRAXIS</span>
            </div>
          </td>
        </tr>

        <!-- Main card -->
        <tr>
          <td style="background:#FFFFFF;border-radius:20px;border:1px solid #e8ddd0;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#b8976a,#d4af37);height:4px;"></div>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 40px 32px;">
              <tr><td>

                <!-- Header -->
                <p style="margin:0 0 4px;font-size:11px;font-family:monospace;color:#9a8a7a;letter-spacing:2px;text-transform:uppercase;">
                  RELATÓRIO SEMANAL · ${semana}
                </p>
                <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0D1B2A;line-height:1.3;">
                  Resumo da semana, Dr. ${primeiroNome}
                </h1>
                <p style="margin:0 0 32px;font-size:14px;color:#6a5a4a;line-height:1.6;">
                  Aqui está o resumo do desempenho da sua clínica nos últimos 7 dias.
                </p>

                <!-- Metrics grid (2 cols) -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                  ${metricCards.reduce<string[]>((rows, card, i) => {
                    if (i % 2 === 0) rows.push(`<tr>`)
                    rows.push(`
                      <td width="50%" style="padding:6px;">
                        <div style="background:#F8F5F0;border-radius:12px;border:1px solid #e8ddd0;padding:18px 20px;">
                          <div style="font-size:22px;font-weight:700;color:${card.color};margin-bottom:4px;">${card.value}</div>
                          <div style="font-size:11px;color:#9a8a7a;font-family:monospace;text-transform:uppercase;letter-spacing:1px;">${card.label}</div>
                        </div>
                      </td>`)
                    if (i % 2 === 1) rows.push(`</tr>`)
                    if (i === metricCards.length - 1 && i % 2 === 0) rows.push(`<td width="50%"></td></tr>`)
                    return rows
                  }, []).join("")}
                </table>

                <div style="border-top:1px solid #e8ddd0;margin:0 0 28px;"></div>

                <!-- CTA -->
                <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0D1B2A;">
                  Ações recomendadas para essa semana
                </h2>

                ${[
                  { icon: "📊", text: "Analise seus leads parados e envie uma mensagem de reengajamento.", href: `${APP_URL}/crm`, cta: "Ver CRM" },
                  { icon: "📅", text: "Planeje o conteúdo da semana com o Calendário Editorial.", href: `${APP_URL}/calendario`, cta: "Ver Calendário" },
                  { icon: "🎓", text: "Continue sua trilha na PRAXIS Academy e aprenda uma nova estratégia.", href: `${APP_URL}/academy`, cta: "Academy" },
                ].map(a => `
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:#F8F5F0;border-radius:10px;border:1px solid #e8ddd0;">
                  <tr>
                    <td style="width:44px;text-align:center;font-size:18px;padding:14px 0;">${a.icon}</td>
                    <td style="padding:14px 16px 14px 0;">
                      <span style="font-size:13px;color:#0D1B2A;">${a.text}</span>
                      <a href="${a.href}" style="display:inline-block;margin-left:8px;font-size:12px;font-weight:600;color:#b8976a;text-decoration:none;">${a.cta} →</a>
                    </td>
                  </tr>
                </table>`).join("")}

                <div style="border-top:1px solid #e8ddd0;margin:28px 0;"></div>

                <!-- Main CTA -->
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:12px;overflow:hidden;">
                      <a href="${APP_URL}/dashboard"
                        style="display:inline-block;background:#b8976a;color:#ffffff;font-size:14px;font-weight:700;padding:14px 28px;text-decoration:none;border-radius:12px;">
                        Acessar o dashboard →
                      </a>
                    </td>
                  </tr>
                </table>

              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 0;">
            <p style="margin:0 0 4px;font-size:11px;color:#9a8a7a;">
              Você recebe este relatório toda segunda-feira. Dúvidas?
            </p>
            <p style="margin:0;font-size:11px;color:#9a8a7a;">
              <a href="mailto:${REPLY_TO}" style="color:#b8976a;text-decoration:none;">${REPLY_TO}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Route handler ────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

const isoDia = (d: Date) => d.toISOString().slice(0, 10)

// A Vercel dispara crons por GET com "Authorization: Bearer $CRON_SECRET".
// O POST fica como atalho para disparo manual com o mesmo segredo.
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY não configurado." }, { status: 503 })
  }

  try {
    // Cliente de serviço: o cron não tem sessão de usuário, então o cliente
    // comum (anon + cookies) não enxerga nenhuma linha por causa do RLS.
    const supabase = createSupabaseServiceClient()

    // Destinatários: assinantes com plano ativo, mais o admin.
    const { data: planos, error: planosErr } = await supabase
      .from("user_planos")
      .select("user_id")
      .eq("status", "ativo")
    if (planosErr) throw planosErr

    const ids = new Set<string>((planos ?? []).map(p => p.user_id as string))
    if (process.env.DOCTOR_USER_ID) ids.add(process.env.DOCTOR_USER_ID)

    if (ids.size === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "Nenhum destinatário." })
    }

    const agora       = new Date()
    const semanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
    const trintaDias  = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
    const inicioMes   = isoDia(new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1)))

    let sent = 0
    const falhas: string[] = []

    for (const userId of Array.from(ids)) {
      try {
        // O e-mail vem do Auth; a tabela perfis não tem essa coluna.
        const { data: authUser } = await supabase.auth.admin.getUserById(userId)
        const email = authUser?.user?.email
        if (!email) { falhas.push(`${userId}: sem e-mail`); continue }

        const [perfilRes, leadsRes, pautasRes, receitaRes, npsRes] = await Promise.all([
          supabase.from("perfis").select("nome").eq("user_id", userId).maybeSingle(),
          supabase.from("crm_leads").select("id, created_at").eq("user_id", userId),
          supabase.from("pautas").select("id", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("financeiro_lancamentos").select("valor")
            .eq("user_id", userId).eq("tipo", "receita")
            .gte("data", inicioMes).lte("data", isoDia(agora)),
          supabase.from("nps_pesquisas").select("nota")
            .eq("user_id", userId).eq("status", "respondido")
            .gte("respondido_em", trintaDias.toISOString()),
        ])

        const leads   = leadsRes.data ?? []
        const notas   = (npsRes.data ?? []).map(n => Number(n.nota)).filter(n => Number.isFinite(n))
        const receita = (receitaRes.data ?? []).reduce((s, l) => s + Number(l.valor ?? 0), 0)

        const nome = (perfilRes.data?.nome as string | undefined) ?? "Médico"
        const primeiroNome = nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? nome

        const metrics: Metrics = {
          nome,
          leads_novos:  leads.filter(l => new Date(l.created_at as string) >= semanaAtras).length,
          leads_total:  leads.length,
          nps_score:    notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : null,
          pautas_total: pautasRes.count ?? 0,
          receita_mes:  Math.round(receita * 100) / 100,
        }

        const { error } = await getResend().emails.send({
          from:    FROM_EMAIL,
          to:      [email],
          replyTo: REPLY_TO,
          subject: `📊 Seu relatório semanal PRAXIS, Dr. ${primeiroNome}`,
          html:    buildHtml(metrics),
        })
        if (error) throw new Error(error.message)

        sent++
        await sleep(600) // respeita o limite de requisições por segundo do Resend
      } catch (e) {
        falhas.push(`${userId}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    if (falhas.length) console.error("[relatorio-semanal] falhas:", falhas)
    return NextResponse.json({ ok: true, sent, failed: falhas.length })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[relatorio-semanal]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
