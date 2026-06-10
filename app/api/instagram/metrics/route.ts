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
    .select("access_token, ig_account_id, ig_username, page_token")
    .eq("user_id", auth.userId)
    .maybeSingle()

  if (!tokenRow?.ig_account_id) {
    return NextResponse.json({ error: "Instagram não conectado.", notConnected: true }, { status: 400 })
  }

  const { ig_account_id: igId, page_token: token } = tokenRow
  const accessToken = token ?? tokenRow.access_token

  try {
    const fields = "followers_count,media_count,profile_picture_url,username,biography,website"
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/${igId}?fields=${fields}&access_token=${accessToken}`
    )
    const profile = await profileRes.json()
    if (profile.error) throw new Error(profile.error.message)

    const insightFields = "impressions,reach,profile_views,follower_count"
    const period = "day"
    const since  = Math.floor(Date.now() / 1000) - 30 * 86400
    const until  = Math.floor(Date.now() / 1000)

    const insightRes = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/insights?metric=${insightFields}&period=${period}&since=${since}&until=${until}&access_token=${accessToken}`
    )
    const insights = await insightRes.json()
    const insightData: Record<string, number[]> = {}
    if (insights.data) {
      for (const metric of insights.data) {
        insightData[metric.name] = metric.values?.map((v: { value: number }) => v.value) ?? []
      }
    }

    return NextResponse.json({
      username:      profile.username,
      biography:     profile.biography,
      website:       profile.website,
      followers:     profile.followers_count,
      mediaCount:    profile.media_count,
      profilePic:    profile.profile_picture_url,
      insights:      insightData,
    })
  } catch (e) {
    console.error("[instagram/metrics]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
