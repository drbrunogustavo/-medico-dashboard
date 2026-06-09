import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Fully public — no auth check at all
const PUBLIC_ROUTES = new Set(["/", "/planos", "/landing"])

// Authenticated users may access without completing onboarding
const ONBOARDING_EXEMPT = new Set(["/onboarding"])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes — auth handled per-handler via checkAuth()
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Fully public pages — no Supabase needed
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next()
  }

  // Guard: missing env vars → everything except /login redirects to /login
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (pathname === "/login") return NextResponse.next()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // ── Supabase SSR client ────────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // ── /login: public, but send authenticated users to /dashboard ────────────
  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/dashboard", request.url))
    return supabaseResponse
  }

  // ── All other routes are protected — require a valid session ──────────────
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // ── Onboarding guard (skip for /onboarding itself) ────────────────────────
  if (!ONBOARDING_EXEMPT.has(pathname)) {
    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("onboarding_completo")
      .eq("user_id", session.user.id)
      .maybeSingle()

    // Only redirect on a clear "not completed" signal.
    // DB errors (e.g. table not yet migrated) → let through to avoid loops.
    if (!perfilError && !perfil?.onboarding_completo) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
  ],
}
