import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Fully public — no auth check at all
const PUBLIC_ROUTES = new Set(["/", "/planos", "/landing", "/sobre", "/privacidade", "/deletar-dados", "/termos", "/captacao", "/demo"])

// Authenticated users may access without completing onboarding
const ONBOARDING_EXEMPT = new Set(["/onboarding", "/dashboard"])

// Routes that require Pro or Elite plan
const PRO_ROUTES = new Set(["/expansao", "/predicao", "/benchmark"])

// Routes that require Elite plan
const ELITE_ROUTES = new Set<string>()

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) return NextResponse.next()
  if (PUBLIC_ROUTES.has(pathname))  return NextResponse.next()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (pathname === "/login" || pathname === "/cadastro") return NextResponse.next()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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

  if (pathname === "/login" || pathname === "/cadastro") {
    if (session) return NextResponse.redirect(new URL("/dashboard", request.url))
    return supabaseResponse
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Onboarding guard
  if (!ONBOARDING_EXEMPT.has(pathname)) {
    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("onboarding_completo")
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (!perfilError && !perfil?.onboarding_completo) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  // Plan guard — soft enforcement for premium routes
  if (PRO_ROUTES.has(pathname) || ELITE_ROUTES.has(pathname)) {
    const { data: planoData } = await supabase
      .from("user_planos")
      .select("plano, status")
      .eq("user_id", session.user.id)
      .maybeSingle()

    const plano  = planoData?.plano  ?? "trial"
    const status = planoData?.status ?? "ativo"
    const isActive = status === "ativo"

    if (PRO_ROUTES.has(pathname)) {
      const hasAccess = isActive && (plano === "pro" || plano === "elite")
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/planos", request.url))
      }
    }

    if (ELITE_ROUTES.has(pathname)) {
      const hasAccess = isActive && plano === "elite"
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/planos", request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
  ],
}
