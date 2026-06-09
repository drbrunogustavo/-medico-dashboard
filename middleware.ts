import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Fully public — no auth check whatsoever
const PUBLIC_ROUTES = new Set(["/", "/landing", "/planos"])

// Authenticated users may access these without completing onboarding
const ONBOARDING_EXEMPT = new Set(["/onboarding"])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets — never intercepted
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // API routes — auth handled inside each handler via checkAuth()
  // /api/stripe/webhook is intentionally public (Stripe calls it without a session)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Fully public pages — serve without touching auth cookies
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next()
  }

  // Supabase not configured — redirect everything to /login to avoid crashes
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (pathname === "/login") return NextResponse.next()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // ── Set up Supabase SSR client (reads/refreshes JWT from cookies) ─────────
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

  const { data: { user } } = await supabase.auth.getUser()

  // ── /login: public page, but redirect authenticated users away ────────────
  if (pathname === "/login") {
    if (user) return NextResponse.redirect(new URL("/dashboard", request.url))
    return supabaseResponse
  }

  // ── All other routes require authentication ───────────────────────────────
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // ── Onboarding guard for authenticated users ──────────────────────────────
  if (!ONBOARDING_EXEMPT.has(pathname)) {
    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("onboarding_completo")
      .eq("user_id", user.id)
      .maybeSingle()

    // Only redirect on a clear "not completed" signal.
    // DB errors (table not migrated yet) → let through to avoid infinite loops.
    if (!perfilError && !perfil?.onboarding_completo) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
