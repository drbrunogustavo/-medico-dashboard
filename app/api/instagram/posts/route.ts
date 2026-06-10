import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const accessToken = process.env.META_ACCESS_TOKEN
  const igId        = process.env.META_IG_USER_ID

  if (!accessToken || !igId) {
    return NextResponse.json(
      { error: "META_ACCESS_TOKEN e META_IG_USER_ID não configurados.", notConnected: true },
      { status: 400 },
    )
  }

  try {
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count"
    const res    = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/media?fields=${fields}&limit=12&access_token=${accessToken}`
    )
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)

    return NextResponse.json({ posts: data.data ?? [] })
  } catch (e) {
    console.error("[instagram/posts]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
