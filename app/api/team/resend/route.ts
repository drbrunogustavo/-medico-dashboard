import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { APP_URL, FROM_EMAIL } from "@/lib/email-boas-vindas"

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as { member_id?: string }
  if (!body.member_id) {
    return NextResponse.json({ error: "member_id obrigatório." }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()

  const { data: member, error } = await supabase
    .from("team_members")
    .select("id, nome, email, status, invite_token")
    .eq("id",       body.member_id)
    .eq("owner_id", auth.userId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!member) return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 })
  if (member.status !== "pendente") {
    return NextResponse.json({ error: "Membro já aceitou o convite." }, { status: 409 })
  }
  if (!member.invite_token) {
    return NextResponse.json({ error: "Token de convite não encontrado." }, { status: 409 })
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("user_id", auth.userId)
    .maybeSingle()

  const ownerNome  = (perfil?.nome as string | null) ?? "seu médico"
  const inviteUrl  = `${APP_URL}/cadastro?convite=${member.invite_token}`

  console.log("[team/resend] RESEND KEY presente:", !!process.env.RESEND_API_KEY)
  console.log("[team/resend] EMAIL_FROM env:", process.env.EMAIL_FROM ?? "(não definido — usará sandbox)")
  console.log("[team/resend] to:", member.email)
  console.log("[team/resend] invite_token:", member.invite_token ? member.invite_token.slice(0, 8) + "…" : "NULL")

  if (process.env.RESEND_API_KEY) {
    if (!process.env.EMAIL_FROM) {
      console.warn("[team/resend] EMAIL_FROM não definido — usando sandbox onboarding@resend.dev (só entrega para emails verificados no Resend)")
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
    const emailResult = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      [member.email],
      subject: "Lembrete: você foi convidado para o PRAXIS",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#0D1B2A;">
          <h2 style="margin-bottom:8px;">Convite para o PRAXIS</h2>
          <p>Olá, <strong>${member.nome}</strong>!</p>
          <p>Você foi convidado para acessar o PRAXIS da clínica de <strong>${ownerNome}</strong>.</p>
          <p style="margin:24px 0;">
            <a href="${inviteUrl}"
               style="display:inline-block;background:#b8976a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Criar minha conta
            </a>
          </p>
          <p style="color:#888;font-size:12px;">Este convite expira em 7 dias.</p>
        </div>
      `,
    })
    console.log("[team/resend] email result:", JSON.stringify(emailResult))
  } else {
    console.warn("[team/resend] RESEND_API_KEY não definido — email não enviado")
  }

  return NextResponse.json({ ok: true })
}
