import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes that bypass the onboarding check
const ONBOARDING_EXEMPT = new Set(["/onboarding", "/login", "/landing", "/planos"])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let Next.js internals pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Verify session — does NOT make a network call, just reads the cookie JWT
  const { data: { user } } = await supabase.auth.getUser()

  // API routes: auth is handled per-route via checkAuth().
  // /api/stripe/webhook must remain public (Stripe calls it without auth headers).
  if (pathname.startsWith("/api/")) {
    return supabaseResponse
  }

  // Login page: redirect authenticated users to dashboard
  if (pathname === "/login") {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return supabaseResponse
  }

  // All other pages: require authentication
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl)
  }

  // Onboarding guard: for authenticated users on non-exempt routes
  if (!ONBOARDING_EXEMPT.has(pathname)) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("onboarding_completo")
      .eq("user_id", user.id)
      .single()

    if (!perfil?.onboarding_completo) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
