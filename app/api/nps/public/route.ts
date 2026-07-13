import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

// ── Rate limiting (in-memory, per serverless instance) ────────────────────────
const RL_WINDOW_MS = 60_000
const ipStoreGet   = new Map<string, { count: number; windowStart: number }>()
const ipStorePost  = new Map<string, { count: number; windowStart: number }>()

function isRateLimited(
  store: Map<string, { count: number; windowStart: number }>,
  ip: string,
  max: number
): boolean {
  const now   = Date.now()
  const entry = store.get(ip)
  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= max) return true
  entry.count++
  return false
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  if (isRateLimited(ipStoreGet, ip, 20))
    return NextResponse.json({ error: "Muitas requisições. Tente novamente em breve." }, { status: 429 })
  const token = req.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "token obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase
      .from("nps_pesquisas")
      .select("id, paciente_nome, status, nota, respondido_em")
      .eq("token", token)
      .single()
    if (error || !data) return NextResponse.json({ error: "Pesquisa não encontrada" }, { status: 404 })
    return NextResponse.json(data)
  } catch (e) {
    console.error("[nps/public GET]", errMsg(e))
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  if (isRateLimited(ipStorePost, ip, 5))
    return NextResponse.json({ error: "Muitas requisições. Tente novamente em breve." }, { status: 429 })

  const { token, nota, comentario } = await req.json() as {
    token: string; nota: number; comentario?: string
  }
  if (!token || nota === undefined || nota < 0 || nota > 10) {
    return NextResponse.json({ error: "token e nota (0-10) obrigatórios" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServiceClient()

    const { data: pesquisa } = await supabase
      .from("nps_pesquisas")
      .select("id, status, user_id, paciente_nome")
      .eq("token", token)
      .single()

    if (!pesquisa) return NextResponse.json({ error: "Pesquisa não encontrada" }, { status: 404 })
    if (pesquisa.status === "respondido") return NextResponse.json({ error: "Já respondida" }, { status: 409 })

    const { error } = await supabase
      .from("nps_pesquisas")
      .update({ nota, comentario: comentario ?? null, status: "respondido", respondido_em: new Date().toISOString() })
      .eq("id", pesquisa.id)
    if (error) throw new Error(error.message)

    // Fire nps-baixo email alert (best-effort, non-blocking)
    if (nota <= 6 && pesquisa.user_id) {
      void (async () => {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(pesquisa.user_id)
          const email = authUser?.user?.email
          if (!email) return
          const { data: perfil } = await supabase
            .from("perfis")
            .select("nome")
            .eq("user_id", pesquisa.user_id)
            .maybeSingle()
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://praxisplataforma.com.br"
          await fetch(`${appUrl}/api/email/nps-baixo`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({
              email,
              nome:         perfil?.nome ?? email.split("@")[0],
              pacienteNome: pesquisa.paciente_nome ?? "Paciente",
              nota,
              comentario:   comentario ?? null,
            }),
          })
        } catch (e) { console.error("[nps/public] erro ao disparar email de alerta NPS baixo:", e) }
      })()
    }

    return NextResponse.json({ ok: true, nota })
  } catch (e) {
    console.error("[nps/public POST]", errMsg(e))
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}
