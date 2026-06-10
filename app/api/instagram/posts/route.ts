import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data: tokenRow } = await supabase
    .from("instagram_tokens")
    .select("access_token, ig_account_id, page_token")
    .eq("user_id", auth.userId)
    .maybeSingle()

  if (!tokenRow?.ig_account_id) {
    return NextResponse.json({ error: "Instagram não conectado.", notConnected: true }, { status: 400 })
  }

  const { ig_account_id: igId, page_token: token } = tokenRow
  const accessToken = token ?? tokenRow.access_token

  try {
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count"
    const res = await fetch(
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
