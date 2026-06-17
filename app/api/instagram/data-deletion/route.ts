import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

/**
 * Meta Data Deletion Callback.
 * Required by Meta for apps requesting Instagram permissions.
 *
 * Configure no painel Meta for Developers:
 *   Settings → Basic → Data Deletion Request URL:
 *   https://praxisplataforma.com.br/api/instagram/data-deletion
 *
 * Meta sends a POST with `signed_request` (base64url-encoded JSON signed with
 * HMAC-SHA256 using the app secret). We verify the signature, delete the user's
 * Instagram tokens, and return a confirmation URL + code.
 */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

function parseSignedRequest(signedRequest: string, appSecret: string): Record<string, unknown> | null {
  const parts = signedRequest.split(".")
  if (parts.length !== 2) return null

  const [encodedSig, encodedPayload] = parts
  const sig     = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64")
  const payload = Buffer.from(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")

  const expected = crypto.createHmac("sha256", appSecret).update(encodedPayload).digest()
  if (!crypto.timingSafeEqual(sig, expected)) return null

  return JSON.parse(payload) as Record<string, unknown>
}

export async function POST(req: NextRequest) {
  try {
    const appSecret = process.env.META_APP_SECRET
    if (!appSecret) {
      return NextResponse.json({ error: "META_APP_SECRET não configurado" }, { status: 503 })
    }

    const contentType = req.headers.get("content-type") ?? ""
    let signedRequest: string | null = null

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text   = await req.text()
      const params = new URLSearchParams(text)
      signedRequest = params.get("signed_request")
    } else {
      const body = await req.json() as { signed_request?: string }
      signedRequest = body.signed_request ?? null
    }

    if (!signedRequest) {
      return NextResponse.json({ error: "signed_request ausente" }, { status: 400 })
    }

    const payload = parseSignedRequest(signedRequest, appSecret)
    if (!payload) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 })
    }

    const facebookUserId = payload.user_id as string | undefined
    const confirmationCode = `praxis-del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    if (facebookUserId) {
      const supabase = getSupabaseAdmin()

      // Delete instagram token associated with this Facebook user
      // The facebook_user_id is stored in the instagram_tokens table if available,
      // or we do a best-effort delete based on ig_account_id
      await Promise.allSettled([
        supabase
          .from("instagram_tokens")
          .delete()
          .eq("facebook_user_id", facebookUserId),
        supabase
          .from("instagram_tokens")
          .delete()
          .eq("ig_account_id", facebookUserId),
      ])

      console.log(`[data-deletion] Facebook user ${facebookUserId} requested deletion — code: ${confirmationCode}`)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://praxisplataforma.com.br"

    // Meta requires this exact response format
    return NextResponse.json({
      url:               `${appUrl}/deletar-dados?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    })
  } catch (e) {
    console.error("[data-deletion]", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Meta also sends GET to verify the endpoint is reachable
export async function GET() {
  return NextResponse.json({
    ok:      true,
    message: "PRAXIS Data Deletion Callback endpoint",
    url:     "POST /api/instagram/data-deletion",
  })
}
