import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"

// Acessa auth.sessions via PostgREST com Accept-Profile: auth
// O service role key bypassa RLS e tem acesso ao schema auth.

interface AuthSession {
  id:           string
  user_agent:   string | null
  created_at:   string
  not_after:    string | null
  ip:           string | null
  refreshed_at: string | null
}

function authHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return {
    "apikey":         key,
    "Authorization":  `Bearer ${key}`,
    "Accept-Profile": "auth",
    "Content-Profile":"auth",
    "Content-Type":   "application/json",
  }
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Dispositivo desconhecido"
  if (/iPhone|iPad/i.test(ua))  return ua.match(/Safari\/([\d.]+)/i) ? "Safari — iPhone/iPad" : "Mobile Apple"
  if (/Android/i.test(ua))      return "Android"
  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) {
    if (/Mac/i.test(ua))    return "Chrome — macOS"
    if (/Windows/i.test(ua)) return "Chrome — Windows"
    return "Chrome"
  }
  if (/Firefox/i.test(ua))  return "Firefox"
  if (/Safari/i.test(ua))   return "Safari"
  if (/Edge/i.test(ua))     return "Microsoft Edge"
  return "Navegador desconhecido"
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split(".")
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"))
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  // Pega o access token do cookie para identificar a sessão atual
  const cookieHeader = req.headers.get("cookie") ?? ""
  const accessTokenMatch = cookieHeader.match(/sb-[^-]+-auth-token(?:\.0)?=([^;]+)/)
  let currentSessionId: string | null = null
  if (accessTokenMatch) {
    try {
      const parsed = JSON.parse(decodeURIComponent(accessTokenMatch[1]))
      const payload = decodeJwtPayload(Array.isArray(parsed) ? parsed[0] : parsed)
      currentSessionId = (payload.session_id as string) ?? null
    } catch { /* ignora */ }
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sessions` +
    `?user_id=eq.${auth.userId}` +
    `&select=id,user_agent,created_at,not_after,ip,refreshed_at` +
    `&order=created_at.desc`

  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) {
    return NextResponse.json({ error: "Erro ao buscar sessões." }, { status: 500 })
  }

  const sessions = await res.json() as AuthSession[]

  const formatted = sessions.map(s => ({
    id:      s.id,
    device:  parseUserAgent(s.user_agent),
    ip:      s.ip ?? "IP desconhecido",
    time:    s.refreshed_at
      ? new Date(s.refreshed_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
      : new Date(s.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    atual:   currentSessionId ? s.id === currentSessionId : false,
  }))

  // Se não conseguiu identificar a sessão atual, marca a mais recente
  if (currentSessionId === null && formatted.length > 0) {
    formatted[0].atual = true
  }

  return NextResponse.json(formatted)
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const sessionId = req.nextUrl.searchParams.get("session_id")
  if (!sessionId) {
    return NextResponse.json({ error: "session_id obrigatório." }, { status: 400 })
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sessions` +
    `?id=eq.${sessionId}&user_id=eq.${auth.userId}`

  const res = await fetch(url, { method: "DELETE", headers: authHeaders() })
  if (!res.ok) {
    return NextResponse.json({ error: "Erro ao encerrar sessão." }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
