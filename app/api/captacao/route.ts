import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

// ── Rate limiting (in-memory, per serverless instance) ────────────────────────
const RL_WINDOW_MS  = 60_000
const RL_MAX        = 10
const ipStore       = new Map<string, { count: number; windowStart: number }>()

function isRateLimited(ip: string): boolean {
  const now   = Date.now()
  const entry = ipStore.get(ip)
  if (!entry || now - entry.windowStart > RL_WINDOW_MS) {
    ipStore.set(ip, { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= RL_MAX) return true
  entry.count++
  return false
}

// Prevent unbounded growth — evict expired entries every 500 calls
let _rlCalls = 0
function pruneRlStore() {
  if (++_rlCalls % 500 !== 0) return
  const now = Date.now()
  ipStore.forEach((v, k) => {
    if (now - v.windowStart > RL_WINDOW_MS) ipStore.delete(k)
  })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  pruneRlStore()
  if (isRateLimited(ip))
    return NextResponse.json({ error: "Muitas requisições. Tente novamente em breve." }, { status: 429 })
  const body = await req.json() as {
    nome: string; whatsapp: string; email?: string
    interesse?: string; como_encontrou?: string; mensagem?: string
  }

  if (!body.nome?.trim() || !body.whatsapp?.trim()) {
    return NextResponse.json({ error: "nome e whatsapp obrigatórios" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServiceClient()

    // Fetch user_id of the doctor — use first active user or env var
    const doctorUserId = process.env.DOCTOR_USER_ID ?? null

    const { data: lead, error } = await supabase
      .from("crm_leads")
      .insert({
        user_id:         doctorUserId,
        nome:            body.nome.trim(),
        telefone:        body.whatsapp.replace(/\D/g, ""),
        origem:          body.como_encontrou === "instagram" ? "Instagram"
                       : body.como_encontrou === "indicacao" ? "Indicação"
                       : body.como_encontrou === "google"    ? "Site"
                       : "Site",
        observacoes:     [
          body.interesse ? `Interesse: ${body.interesse}` : null,
          body.mensagem  ? `Mensagem: ${body.mensagem}`   : null,
          body.email     ? `Email: ${body.email}`         : null,
        ].filter(Boolean).join(" | ") || null,
        estagio:         "novo",
        valor_potencial: 0,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Trigger nurturing non-blocking
    if (lead?.id && doctorUserId) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
      fetch(`${baseUrl}/api/nurturing/gerar`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "x-internal": "1" },
        body:    JSON.stringify({ lead_id: lead.id }),
      }).catch(e => console.error("[captacao] nurturing trigger falhou:", e))
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[captacao/post]", e)
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}
