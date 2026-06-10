import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
}

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code   = searchParams.get("code")
  const userId = searchParams.get("state")
  const error  = searchParams.get("error")

  const baseUrl    = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const redirectUri = `${baseUrl}/api/instagram/callback`

  if (error || !code || !userId) {
    return NextResponse.redirect(`${baseUrl}/instagram?error=oauth_denied`)
  }

  try {
    const appId     = process.env.META_APP_ID!
    const appSecret = process.env.META_APP_SECRET!

    // Exchange code for short-lived token
    const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     appId,
        client_secret: appSecret,
        redirect_uri:  redirectUri,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error.message)

    // Exchange for long-lived token
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const longData = await longRes.json()
    if (longData.error) throw new Error(longData.error.message)

    const accessToken  = longData.access_token
    const expiresIn    = longData.expires_in ?? 5184000 // 60 days
    const expiresAt    = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Get Instagram Business Account ID
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    )
    const pagesData = await pagesRes.json()
    const pageId = pagesData.data?.[0]?.id
    const pageToken = pagesData.data?.[0]?.access_token

    let igAccountId: string | null = null
    let igUsername:  string | null = null

    if (pageId && pageToken) {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      )
      const igData = await igRes.json()
      igAccountId = igData.instagram_business_account?.id ?? null

      if (igAccountId) {
        const profileRes = await fetch(
          `https://graph.facebook.com/v19.0/${igAccountId}?fields=username&access_token=${pageToken}`
        )
        const profileData = await profileRes.json()
        igUsername = profileData.username ?? null
      }
    }

    const supabase = getSupabaseAdmin()
    await supabase.from("instagram_tokens").upsert(
      {
        user_id:         userId,
        access_token:    accessToken,
        page_token:      pageToken ?? null,
        ig_account_id:   igAccountId,
        ig_username:     igUsername,
        expires_at:      expiresAt,
        atualizado_em:   new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    return NextResponse.redirect(`${baseUrl}/instagram?connected=true`)
  } catch (e) {
    console.error("[instagram/callback]", e)
    return NextResponse.redirect(`${baseUrl}/instagram?error=${encodeURIComponent(errMsg(e))}`)
  }
}
