import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const appId      = process.env.META_APP_ID
  const baseUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.praxis.med.br"
  const redirectUri = `${baseUrl}/api/instagram/callback`

  if (!appId) {
    return NextResponse.json({ error: "META_APP_ID não configurado." }, { status: 503 })
  }

  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
  ].join(",")

  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${auth.userId}&response_type=code`

  return NextResponse.redirect(url)
}
