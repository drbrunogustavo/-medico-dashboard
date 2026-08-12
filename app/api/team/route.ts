import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { APP_URL, FROM_EMAIL } from "@/lib/email-boas-vindas"

// ── Types ─────────────────────────────────────────────────────────────────────

interface PermissionsRow {
  id:                  string
  member_id:           string
  owner_id:            string
  agenda_ver:          boolean
  agenda_editar:       boolean
  copiloto:            boolean
  prontuario_ver:      boolean
  prontuario_escrever: boolean
  crm_ver:             boolean
  crm_editar:          boolean
  financeiro_ver:      boolean
  financeiro_editar:   boolean
  nps_ver:             boolean
  indicacoes_ver:      boolean
  marketing_ver:       boolean
  marketing_usar:      boolean
  configuracoes:       boolean
  gerenciar_membros:   boolean
  updated_at:          string
}

// ── GET — listar membros com permissões ───────────────────────────────────────

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("team_members")
    .select("*, team_permissions(*)")
    .eq("owner_id", auth.userId)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// ── POST — convidar novo membro ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as { nome?: string; email?: string }
  if (!body.nome?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "Nome e email são obrigatórios." }, { status: 400 })
  }

  const email = body.email.trim().toLowerCase()
  const nome  = body.nome.trim()

  const supabase = createSupabaseServerClient()

  // Idempotência: impede convite duplicado
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("owner_id", auth.userId)
    .eq("email", email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "Este e-mail já é membro da equipe." }, { status: 409 })
  }

  // Nome do dono para o corpo do email
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("user_id", auth.userId)
    .maybeSingle()

  const ownerNome   = (perfil?.nome as string | null) ?? "seu médico"
  const inviteToken = crypto.randomUUID()

  // Inserir membro
  const { data: member, error: insertError } = await supabase
    .from("team_members")
    .insert({
      owner_id:     auth.userId,
      email,
      nome,
      status:       "pendente",
      invite_token: inviteToken,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Permissões padrão
  await supabase.from("team_permissions").insert({
    member_id: member.id,
    owner_id:  auth.userId,
  })

  // Enviar email de convite via Resend (fire-and-forget)
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const inviteUrl = `${APP_URL}/cadastro?convite=${inviteToken}`
    resend.emails.send({
      from:    FROM_EMAIL,
      to:      [email],
      subject: "Você foi convidado para o PRAXIS",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#0D1B2A;">
          <h2 style="margin-bottom:8px;">Convite para o PRAXIS</h2>
          <p>Olá, <strong>${nome}</strong>!</p>
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
    }).catch(console.error)
  }

  return NextResponse.json({ ...member, team_permissions: [] as PermissionsRow[] }, { status: 201 })
}

// ── PATCH — atualizar permissões ──────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as {
    memberId:    string
    permissions: Record<string, boolean>
    cargo?:      string
  }

  if (!body.memberId || !body.permissions) {
    return NextResponse.json({ error: "memberId e permissions obrigatórios." }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()

  // Atualizar cargo em team_members se fornecido
  if (body.cargo !== undefined) {
    await supabase
      .from("team_members")
      .update({ cargo: body.cargo.trim() || null })
      .eq("id",       body.memberId)
      .eq("owner_id", auth.userId)
  }

  const { data, error } = await supabase
    .from("team_permissions")
    .update({ ...body.permissions, updated_at: new Date().toISOString() })
    .eq("member_id", body.memberId)
    .eq("owner_id",  auth.userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)  return NextResponse.json({ error: "Permissões não encontradas." }, { status: 404 })
  return NextResponse.json(data)
}

// ── DELETE — remover membro ───────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const memberId = req.nextUrl.searchParams.get("id")
  if (!memberId) {
    return NextResponse.json({ error: "Parâmetro id obrigatório." }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id",       memberId)
    .eq("owner_id", auth.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
