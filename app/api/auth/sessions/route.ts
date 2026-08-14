import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Dispositivo desconhecido"
  if (/iPhone|iPad/i.test(ua))  return "Safari — iPhone/iPad"
  if (/Android/i.test(ua))      return "Android"
  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) {
    if (/Mac/i.test(ua))     return "Chrome — macOS"
    if (/Windows/i.test(ua)) return "Chrome — Windows"
    return "Chrome"
  }
  if (/Firefox/i.test(ua))  return "Firefox"
  if (/Safari/i.test(ua))   return "Safari"
  if (/Edge/i.test(ua))     return "Microsoft Edge"
  return "Navegador desconhecido"
}

function sessionCreatedAt(accessToken: string): string {
  try {
    const [, payload] = accessToken.split(".")
    const { iat } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { iat?: number }
    if (iat) return new Date(iat * 1000).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
  } catch { /* ignora */ }
  return new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return NextResponse.json([])

  return NextResponse.json([{
    id:     session.access_token,
    device: parseUserAgent(req.headers.get("user-agent")),
    ip:     "—",
    time:   sessionCreatedAt(session.access_token),
    atual:  true,
  }])
}

export async function DELETE() {
  // Sem API pública para listar/revogar sessões individuais no Supabase.
  // Encerrar a própria sessão é feito via supabase.auth.signOut() no cliente.
  return new NextResponse(null, { status: 204 })
}
