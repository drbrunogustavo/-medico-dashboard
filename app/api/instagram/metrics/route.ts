import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const accessToken = process.env.META_ACCESS_TOKEN
  const igId        = process.env.META_IG_USER_ID

  console.log("[instagram/metrics] META_ACCESS_TOKEN exists:", !!accessToken)
  console.log("[instagram/metrics] META_IG_USER_ID:", igId ?? "(não definido)")

  if (!accessToken || !igId) {
    return NextResponse.json(
      {
        error: "Variáveis de ambiente não configuradas. Adicione META_ACCESS_TOKEN e META_IG_USER_ID no Vercel.",
        notConnected: true,
        debug: {
          hasToken: !!accessToken,
          hasIgId:  !!igId,
        },
      },
      { status: 400 },
    )
  }

  try {
    const fields     = "followers_count,media_count,profile_picture_url,username,biography,website"
    const profileUrl = `https://graph.facebook.com/v19.0/${igId}?fields=${fields}&access_token=${accessToken}`
    console.log("[instagram/metrics] GET profile URL:", profileUrl.replace(accessToken, "***TOKEN***"))

    const profileRes  = await fetch(profileUrl)
    const profile     = await profileRes.json()

    console.log("[instagram/metrics] profile response status:", profileRes.status)

    if (profile.error) {
      const code        = profile.error.code ?? 0
      const subcode     = profile.error.error_subcode ?? 0
      const tokenExpired = code === 190 || subcode === 460 || subcode === 463 || subcode === 467
      console.error("[instagram/metrics] Meta API error:", profile.error)
      return NextResponse.json(
        {
          error:         profile.error.message,
          errorCode:     code,
          errorSubcode:  subcode,
          errorType:     profile.error.type ?? "unknown",
          tokenExpired,
          debug: {
            code, subcode,
            fbtrace_id: profile.error.fbtrace_id,
            hint: tokenExpired
              ? "Token expirado. Renove o access token no Meta for Developers."
              : code === 200
              ? "Permissão insuficiente. Verifique os escopos do app."
              : "Verifique se META_IG_USER_ID é um ID de conta Business/Creator.",
          },
        },
        { status: 400 },
      )
    }

    // Insights (não críticos — falha silenciosa)
    const insightFields = "impressions,reach,profile_views"
    const since  = Math.floor(Date.now() / 1000) - 30 * 86400
    const until  = Math.floor(Date.now() / 1000)
    const insightUrl = `https://graph.facebook.com/v19.0/${igId}/insights?metric=${insightFields}&period=day&since=${since}&until=${until}&access_token=${accessToken}`

    console.log("[instagram/metrics] GET insights URL:", insightUrl.replace(accessToken, "***TOKEN***"))

    const insightRes  = await fetch(insightUrl)
    const insights    = await insightRes.json()

    if (insights.error) {
      console.warn("[instagram/metrics] insights error (non-fatal):", insights.error.message)
    }

    const insightData: Record<string, number[]> = {}
    if (insights.data) {
      for (const metric of insights.data) {
        insightData[metric.name] = metric.values?.map((v: { value: number }) => v.value) ?? []
      }
    }

    return NextResponse.json({
      username:    profile.username,
      biography:   profile.biography,
      website:     profile.website,
      followers:   profile.followers_count,
      mediaCount:  profile.media_count,
      profilePic:  profile.profile_picture_url,
      insights:    insightData,
      insightError: insights.error?.message ?? null,
    })
  } catch (e) {
    console.error("[instagram/metrics] exception:", e)
    return NextResponse.json({ error: errMsg(e), errorType: "network" }, { status: 500 })
  }
}
