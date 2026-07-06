import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  return NextResponse.json({
    medx:      !!(process.env.MEDX_URL && process.env.MEDX_INTEGRATION_TOKEN),
    zapi:      !!(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN),
    instagram: !!(process.env.META_ACCESS_TOKEN && process.env.META_IG_USER_ID),
    stripe:    !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_STARTER_MONTHLY),
  })
}
