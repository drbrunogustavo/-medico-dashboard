import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGINS = new Set(
  [
    process.env.NEXT_PUBLIC_APP_URL ?? "",
    "https://www.praxisplataforma.com.br",
    "https://praxisplataforma.com.br",
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter(Boolean)
)

// Em deploys de preview a Vercel informa o endereço do próprio deploy e o da branch.
// Só valem quando VERCEL_ENV é "preview": em produção a lista acima é a única.
function previewOrigins(): string[] {
  if (process.env.VERCEL_ENV !== "preview") return []
  return [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .filter((h): h is string => Boolean(h))
    .map(h => `https://${h}`)
}

export function originGuard(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin")
  if (!origin) return null // non-browser / server-to-server — allow
  if (ALLOWED_ORIGINS.has(origin)) return null
  if (previewOrigins().includes(origin)) return null
  return NextResponse.json({ error: "Origin não permitida" }, { status: 403 })
}
