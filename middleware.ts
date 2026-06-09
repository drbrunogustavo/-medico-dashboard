import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes exempt from the onboarding guard (but NOT from auth, except /login)
const ONBOARDING_EXEMPT = new Set(["/onboarding", "/login", "/landing", "/planos"])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass through Next.js internals and static assets — never touch these
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // API routes bypass middleware auth — each handler calls checkAuth() internally.
  // /api/stripe/webhook is public by design (Stripe sends no user session).
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // If Supabase env vars are missing, send everyone to /login so the app
  // doesn't crash with invalid client initialization.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

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

  // Validates JWT from cookie — no network call, reads locally
  const { data: { user } } = await supabase.auth.getUser()

  // ── Unauthenticated user ──────────────────────────────────────────────────
  if (!user) {
    // Allow /login through; redirect everything else to /login
    if (pathname === "/login") return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // ── Authenticated user ────────────────────────────────────────────────────
  // Don't let logged-in users linger on /login
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Onboarding guard: skip for exempt routes
  if (!ONBOARDING_EXEMPT.has(pathname)) {
    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("onboarding_completo")
      .eq("user_id", user.id)
      .maybeSingle()

    // Only redirect when there's a clear "incomplete" signal.
    // A DB error (table not yet migrated) → let through rather than loop.
    if (!perfilError && !perfil?.onboarding_completo) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
