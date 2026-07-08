import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { sendZapiForUser } from "@/lib/zapi"
import { logAutomacao } from "@/lib/automacoes-log"

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

const resend     = new Resend(process.env.RESEND_API_KEY)
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://praxisplataforma.com.br"
const FROM_EMAIL = process.env.EMAIL_FROM          ?? "PRAXIS <onboarding@resend.dev>"
const REPLY_TO   = process.env.EMAIL_REPLY_TO      ?? "contato@praxisplataforma.com.br"

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}

// ── Email: trial acabando ─────────────────────────────────────────────────────

function buildTrialEmail(nome: string, dias: number): string {
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
            <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
              <tr><td style="border-radius:12px;overflow:hidden;">
                <a href="${APP_URL}/planos"
                  style="display:inline-block;background:#b8976a;color:#fff;font-size:14px;font-weight:700;padding:14px 28px;text-decoration:none;border-radius:12px;">
                  Escolher meu plano →
                </a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:12px;color:#9a8a7a;">
              Dúvidas? Escreva para
              <a href="mailto:${REPLY_TO}" style="color:#b8976a;text-decoration:none;">${REPLY_TO}</a>
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

// ── Email: leads sem resposta ─────────────────────────────────────────────────

function buildLeadEmail(nome: string, leads: Array<{ nome: string; horas: number }>): string {
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
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Email: relatório semanal ──────────────────────────────────────────────────

interface RelatorioMetrics {
  nome:          string
  leads_novos:   number
  leads_total:   number
  consultas_mes: number
  nps_score:     number | null
  pautas_total:  number
  receita_mes:   number
  sem_retorno?:  string[]
}

function buildRelatorioEmail(m: RelatorioMetrics): string {
  const npsColor     = m.nps_score === null ? "#9a8a7a" : m.nps_score >= 8 ? "#10b981" : m.nps_score >= 6 ? "#f59e0b" : "#ef4444"
  const primeiroNome = m.nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? m.nome
  const semana       = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  const cards = [
    { label: "Leads novos",    value: m.leads_novos.toString(),                            color: "#10b981" },
    { label: "Total no CRM",   value: m.leads_total.toString(),                            color: "#b8976a" },
    { label: "Consultas/mês",  value: m.consultas_mes.toString(),                          color: "#b8976a" },
    { label: "NPS Score",      value: m.nps_score !== null ? m.nps_score.toString() : "—", color: npsColor  },
    { label: "Pautas salvas",  value: m.pautas_total.toString(),                           color: "#b8976a" },
    { label: "Receita do mês", value: `R$ ${m.receita_mes.toLocaleString("pt-BR")}`,       color: "#10b981" },
  ]

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>Relatório Semanal PRAXIS</title></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td align="center" style="padding:0 0 28px 0;">
        <div style="display:inline-block;background:#0D1B2A;border-radius:12px;padding:14px 28px;">
          <span style="color:#b8976a;font-size:20px;font-weight:800;letter-spacing:0.1em;">PRAXIS</span>
        </div>
      </td></tr>
      <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #e8ddd0;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#b8976a,#d4af37);height:4px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 40px 32px;">
          <tr><td>
            <p style="margin:0 0 4px;font-size:11px;font-family:monospace;color:#9a8a7a;letter-spacing:2px;text-transform:uppercase;">
              RELATÓRIO SEMANAL · ${semana}
            </p>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0D1B2A;">
              Resumo da semana, Dr. ${primeiroNome}
            </h1>
            <p style="margin:0 0 32px;font-size:14px;color:#6a5a4a;line-height:1.6;">
              Aqui está o resumo do desempenho da sua clínica nos últimos 7 dias.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              ${cards.reduce<string[]>((rows, card, i) => {
                if (i % 2 === 0) rows.push(`<tr>`)
                rows.push(`<td width="50%" style="padding:6px;"><div style="background:#F8F5F0;border-radius:12px;border:1px solid #e8ddd0;padding:18px 20px;"><div style="font-size:22px;font-weight:700;color:${card.color};margin-bottom:4px;">${card.value}</div><div style="font-size:11px;color:#9a8a7a;font-family:monospace;text-transform:uppercase;letter-spacing:1px;">${card.label}</div></div></td>`)
                if (i % 2 === 1) rows.push(`</tr>`)
                if (i === cards.length - 1 && i % 2 === 0) rows.push(`<td width="50%"></td></tr>`)
                return rows
              }, []).join("")}
            </table>
            ${m.sem_retorno && m.sem_retorno.length > 0 ? `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#991b1b;">⚠️ ${m.sem_retorno.length} paciente${m.sem_retorno.length !== 1 ? "s" : ""} sem retorno nos últimos 180 dias</p>
              <ul style="margin:0;padding-left:16px;">
                ${m.sem_retorno.slice(0, 5).map(n => `<li style="font-size:12px;color:#b91c1c;margin-bottom:4px;">${n}</li>`).join("")}
                ${m.sem_retorno.length > 5 ? `<li style="font-size:12px;color:#b91c1c;">… e mais ${m.sem_retorno.length - 5}</li>` : ""}
              </ul>
            </div>` : ""}
            <div style="border-top:1px solid #e8ddd0;margin:0 0 28px;"></div>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="border-radius:12px;overflow:hidden;">
                <a href="${APP_URL}/dashboard"
                  style="display:inline-block;background:#b8976a;color:#ffffff;font-size:14px;font-weight:700;padding:14px 28px;text-decoration:none;border-radius:12px;">
                  Acessar o dashboard →
                </a>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding:24px 0;">
        <p style="margin:0;font-size:11px;color:#9a8a7a;">
          Você recebe este relatório toda segunda-feira. Dúvidas?
          <a href="mailto:${REPLY_TO}" style="color:#b8976a;text-decoration:none;">${REPLY_TO}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Email: auditoria Instagram ────────────────────────────────────────────────

function buildAuditoriaEmail(nome: string, dados: {
  diasSemPost: number | null
  semPost: boolean
  pautasParadas: Array<{ titulo?: string | null }>
}): string {
  const primeiroNome = nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? nome
  const linhasSemPost = dados.semPost
    ? `<tr><td style="padding:0 0 16px 0;">
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#9a3412;">⚠️ ${dados.diasSemPost != null ? `Você ficou ${dados.diasSemPost} dias sem publicar` : "Nenhum post publicado ainda"}</p>
          <p style="margin:0;font-size:13px;color:#c2410c;">A consistência é chave para o crescimento. Publique hoje!</p>
        </div>
      </td></tr>` : ""
  const linhasPautas = dados.pautasParadas.length > 0
    ? `<tr><td style="padding:0 0 16px 0;">
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#92400e;">📋 ${dados.pautasParadas.length} pauta${dados.pautasParadas.length !== 1 ? "s" : ""} parada${dados.pautasParadas.length !== 1 ? "s" : ""} há mais de 7 dias</p>
          <ul style="margin:0;padding-left:16px;">
            ${dados.pautasParadas.slice(0, 5).map(p => `<li style="font-size:12px;color:#78350f;margin-bottom:4px;">${p.titulo ?? "Sem título"}</li>`).join("")}
            ${dados.pautasParadas.length > 5 ? `<li style="font-size:12px;color:#78350f;">… e mais ${dados.pautasParadas.length - 5}</li>` : ""}
          </ul>
        </div>
      </td></tr>` : ""

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>Auditoria de conteúdo</title></head>
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
        <div style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);height:4px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 40px 32px;">
          <tr><td>
            <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0D1B2A;">📱 Auditoria de Conteúdo</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#6a5a4a;">Dr. ${primeiroNome}, aqui está o resumo desta semana:</p>
          </td></tr>
          ${linhasSemPost}
          ${linhasPautas}
          <tr><td>
            <a href="${APP_URL}/pautas"
              style="display:inline-block;background:#6d28d9;color:#fff;font-size:14px;font-weight:700;padding:14px 28px;text-decoration:none;border-radius:12px;">
              Ir para Banco de Pautas →
            </a>
          </td></tr>
          <tr><td style="padding-top:24px;">
            <p style="margin:0;font-size:11px;color:#9a8a7a;">
              Auditoria semanal PRAXIS. Dúvidas?
              <a href="mailto:${REPLY_TO}" style="color:#b8976a;text-decoration:none;">${REPLY_TO}</a>
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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY não configurado." }, { status: 503 })
  }

  const supabase = createSupabaseServiceClient()
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://praxisplataforma.com.br"

  async function runTrialAcabando() {
    const now     = new Date()
    const daqui2d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const daqui3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: perfis } = await supabase
      .from("perfis").select("user_id, nome, trial_termina_em")
      .eq("plano", "trial").gte("trial_termina_em", daqui2d).lte("trial_termina_em", daqui3d)
    let enviados = 0
    for (const perfil of perfis ?? []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(perfil.user_id)
      const email = authUser?.user?.email
      if (!email) continue
      const dias = Math.ceil((new Date(perfil.trial_termina_em).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const { error } = await resend.emails.send({
        from: FROM_EMAIL, to: [email], replyTo: REPLY_TO,
        subject: `🔔 Seu trial PRAXIS expira em ${dias} dia${dias !== 1 ? "s" : ""}`,
        html: buildTrialEmail(perfil.nome ?? email.split("@")[0], dias),
      })
      if (!error) enviados++
    }
    return enviados
  }

  async function runLeadSemResposta() {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data: leads } = await supabase
      .from("crm_leads").select("user_id, nome, updated_at")
      .lt("updated_at", cutoff)
      .not("estagio", "in", '("fechado","convertido","perdido")')
      .order("updated_at", { ascending: true })
    const byUser: Record<string, Array<{ nome: string; horas: number }>> = {}
    for (const lead of leads ?? []) {
      if (!byUser[lead.user_id]) byUser[lead.user_id] = []
      byUser[lead.user_id].push({ nome: lead.nome, horas: (Date.now() - new Date(lead.updated_at).getTime()) / 3600000 })
    }
    let enviados = 0
    for (const [uid, userLeads] of Object.entries(byUser)) {
      const { data: authUser } = await supabase.auth.admin.getUserById(uid)
      const email = authUser?.user?.email
      if (!email) continue
      const { data: perfil } = await supabase.from("perfis").select("nome").eq("user_id", uid).maybeSingle()
      const { error } = await resend.emails.send({
        from: FROM_EMAIL, to: [email], replyTo: REPLY_TO,
        subject: `⏰ ${userLeads.length} lead${userLeads.length !== 1 ? "s" : ""} sem resposta há mais de 48h`,
        html: buildLeadEmail(perfil?.nome ?? email.split("@")[0], userLeads),
      })
      if (!error) enviados++
    }
    return enviados
  }

  async function runRelatorioSemanal() {
    if (new Date().getDay() !== 1) return null
    const { data: perfis } = await supabase.from("perfis").select("user_id, nome")
    const resultados = await Promise.allSettled(
      (perfis ?? []).map(async (perfil) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(perfil.user_id as string)
        const email = authUser?.user?.email
        if (!email) throw new Error(`sem email — user ${perfil.user_id}`)
        const cento80diasAtras = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
        const [leadsRes, pautasRes, historicoRes] = await Promise.all([
          supabase.from("crm_leads").select("id, created_at").eq("user_id", perfil.user_id),
          supabase.from("pautas").select("id").eq("user_id", perfil.user_id),
          supabase.from("copiloto_historico").select("paciente_nome").eq("user_id", perfil.user_id).gte("created_at", cento80diasAtras),
        ])
        const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const leadsData   = leadsRes.data ?? []

        // match aproximado por string (lowercase+trim), não por FK — débito técnico
        const nomesComConsulta = new Set((historicoRes.data ?? []).map(h => (h.paciente_nome as string).toLowerCase().trim()))
        const { data: todosPacientes } = await supabase.from("pacientes_local").select("nome").eq("user_id", perfil.user_id)
        const semRetorno = (todosPacientes ?? []).map(p => p.nome as string).filter(n => !nomesComConsulta.has(n.toLowerCase().trim()))

        const metrics: RelatorioMetrics = {
          nome:          (perfil.nome as string) ?? "Médico",
          leads_novos:   leadsData.filter(l => new Date(l.created_at) >= semanaAtras).length,
          leads_total:   leadsData.length,
          consultas_mes: 0,
          nps_score:     null,
          pautas_total:  pautasRes.data?.length ?? 0,
          receita_mes:   0,
          sem_retorno:   semRetorno,
        }
        const nome         = (perfil.nome as string) ?? "Médico"
        const primeiroNome = nome.replace(/^Dr\.?\s*/i, "").split(" ")[0] ?? nome
        const { error } = await resend.emails.send({
          from: FROM_EMAIL, to: [email], replyTo: REPLY_TO,
          subject: `📊 Seu relatório semanal PRAXIS, Dr. ${primeiroNome}`,
          html: buildRelatorioEmail(metrics),
        })
        if (error) throw new Error(`Falha para ${email}: ${error.message}`)
        return { email, ok: true }
      })
    )
    return { sent: resultados.filter(r => r.status === "fulfilled").length, failed: resultados.filter(r => r.status === "rejected").length }
  }

  async function runRegua() {
    const now = new Date().toISOString()
    const { data } = await supabase
      .from("regua_relacionamento")
      .select("id, paciente_telefone, mensagem, user_id")
      .lte("agendado_para", now).eq("status", "pendente").eq("pausado", false)
    let enviados = 0
    for (const row of data ?? []) {
      const { ok } = await sendZapiForUser(row.user_id as string, row.paciente_telefone, row.mensagem)
      if (ok) {
        await supabase.from("regua_relacionamento")
          .update({ status: "enviado", enviado_em: new Date().toISOString() }).eq("id", row.id)
        enviados++
      }
      await sleep(150)
    }
    return enviados
  }

  async function runNps() {
    const now = new Date().toISOString()
    const { data } = await supabase
      .from("nps_pesquisas")
      .select("id, paciente_nome, paciente_telefone, token, user_id")
      .lte("agendado_para", now).eq("status", "pendente")
    let enviados = 0
    for (const row of data ?? []) {
      const link = `${appUrl}/nps/${row.token}`
      const msg  = `Olá, ${row.paciente_nome}! 👋\n\nSua opinião é muito importante para nós.\nComo foi sua última consulta com o médico?\n\nResponda em menos de 1 minuto: ${link}\n\nObrigado pela confiança! 🙏`
      const { ok } = await sendZapiForUser(row.user_id as string, row.paciente_telefone, msg)
      if (ok) {
        await supabase.from("nps_pesquisas").update({ status: "enviado" }).eq("id", row.id)
        enviados++
      }
      await sleep(150)
    }
    return enviados
  }

  // ── Auditoria Instagram (quinta-feira) ───────────────────────────────────────
  async function runAuditoriaInstagram() {
    if (new Date().getDay() !== 4) return null   // executa apenas às quintas

    const { data: perfis } = await supabase
      .from("perfis").select("user_id, nome")
    if (!perfis?.length) return { emails_enviados: 0 }

    const now         = new Date()
    const cutoff4dias = new Date(now.getTime() - 4  * 86_400_000)
    const cutoff7dias = new Date(now.getTime() - 7  * 86_400_000)

    let emailsEnviados = 0

    for (const perfil of perfis) {
      const { data: authUser } = await supabase.auth.admin.getUserById(perfil.user_id as string)
      const email = authUser?.user?.email
      if (!email) continue

      // Último post publicado
      const { data: ultimoPost } = await supabase
        .from("pautas")
        .select("updated_at")
        .eq("user_id", perfil.user_id)
        .eq("estagio", "Publicado")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const dataUltimoPost = ultimoPost?.updated_at ? new Date(ultimoPost.updated_at) : null
      const diasSemPost    = dataUltimoPost
        ? Math.floor((now.getTime() - dataUltimoPost.getTime()) / 86_400_000)
        : null
      const semPost = !dataUltimoPost || dataUltimoPost < cutoff4dias

      // Pautas paradas há > 7 dias
      const { data: pautasParadas } = await supabase
        .from("pautas")
        .select("titulo")
        .eq("user_id", perfil.user_id)
        .not("estagio", "in", '("Publicado","Pronto")')
        .lt("created_at", cutoff7dias.toISOString())
        .limit(20)

      if (!semPost && !(pautasParadas?.length)) continue

      const { error } = await resend.emails.send({
        from: FROM_EMAIL, to: [email], replyTo: REPLY_TO,
        subject: semPost
          ? `📱 Você ficou ${diasSemPost ?? "vários"} dias sem publicar`
          : `📋 ${pautasParadas!.length} pauta${pautasParadas!.length !== 1 ? "s" : ""} parada${pautasParadas!.length !== 1 ? "s" : ""} — auditoria semanal`,
        html: buildAuditoriaEmail(
          (perfil.nome as string | null) ?? email.split("@")[0],
          { diasSemPost, semPost, pautasParadas: pautasParadas ?? [] }
        ),
      })
      if (!error) emailsEnviados++
    }

    return { emails_enviados: emailsEnviados }
  }

  const pick = (r: PromiseSettledResult<unknown>) =>
    r.status === "fulfilled" ? r.value : { error: String((r as PromiseRejectedResult).reason) }

  const [trialR, leadR, relatorioR, reguaR, npsR, auditoriaR] = await Promise.allSettled([
    runTrialAcabando(),
    runLeadSemResposta(),
    runRelatorioSemanal(),
    runRegua(),
    runNps(),
    runAuditoriaInstagram(),
  ])

  const results = {
    trial_acabando:       pick(trialR),
    lead_sem_resposta:    pick(leadR),
    relatorio_semanal:    pick(relatorioR),
    regua:                pick(reguaR),
    nps:                  pick(npsR),
    auditoria_instagram:  pick(auditoriaR),
  }

  const erros   = [trialR, leadR, relatorioR, reguaR, npsR, auditoriaR].filter(r => r.status === "rejected").length
  const logStatus = erros === 6 ? "erro" : erros > 0 ? "parcial" : "ok"
  await logAutomacao("diario", logStatus, results as Record<string, unknown>)

  return NextResponse.json({ ok: true, ...results })
}
