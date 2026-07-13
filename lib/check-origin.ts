import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGINS = new Set(
  [
    process.env.NEXT_PUBLIC_APP_URL ?? "",
    "https://praxisplataforma.com.br",
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter(Boolean)
)

export function originGuard(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin")
  if (!origin) return null // non-browser / server-to-server — allow
  if (ALLOWED_ORIGINS.has(origin)) return null
  return NextResponse.json({ error: "Origin não permitida" }, { status: 403 })
}
