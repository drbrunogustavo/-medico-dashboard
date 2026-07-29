import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Fully public — no auth check at all
const PUBLIC_ROUTES = new Set([
  "/", "/planos", "/landing", "/sobre", "/privacidade", "/deletar-dados", "/termos", "/captacao", "/demo", "/tour",
  "/praxis-social", "/praxis-consultorio", "/praxis-executivo", "/praxis-ia", "/praxis-academy",
])

// Authenticated users may access without completing onboarding
const ONBOARDING_EXEMPT = new Set(["/onboarding"])

// Routes accessible without an active paid plan (post-onboarding)
const PAYMENT_EXEMPT_ROUTES = new Set([
  "/planos", "/onboarding", "/configuracoes", "/configuracoes/membros",
  "/tour", "/perfil", "/notificacoes", "/exportar", "/deletar-dados",
])

// Routes that require Pro or Elite plan
const PRO_ROUTES = new Set<string>(["/radar", "/copiloto", "/nps", "/precificacao", "/indicadores"])

// Routes that require Elite plan
const ELITE_ROUTES = new Set<string>(["/executivo", "/consultor", "/diagnostico", "/calculadoras"])

// Routes completely blocked for team members (owner-only modules)
const MEMBER_BLOCKED_ROUTES = ["/executivo", "/consultor", "/diagnostico", "/calculadoras", "/indicadores"]

// Map from route prefix → team_permissions column required to be true
const MEMBER_PERM_MAP: Record<string, string> = {
  "/agenda":        "agenda_ver",
  "/copiloto":      "copiloto",
  "/crm":           "crm_ver",
  "/financeiro":    "financeiro_ver",
  "/nps":           "nps_ver",
  "/indicacoes":    "indicacoes_ver",
  "/calendario":    "marketing_ver",
  "/roteiros":      "marketing_ver",
  "/imagens":       "marketing_usar",
  "/configuracoes": "configuracoes",
}

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

  const { data: { user } } = await supabase.auth.getUser()

  if (pathname === "/login" || pathname === "/cadastro") {
    if (user) return NextResponse.redirect(new URL("/dashboard", request.url))
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Admin guard — /admin/* só acessível pelo DOCTOR_USER_ID
  if (pathname.startsWith("/admin")) {
    if (user.id !== process.env.DOCTOR_USER_ID) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return supabaseResponse // admin bypassa onboarding e payment guards
  }

  // Team member permission gate — runs before onboarding/payment (members have no plan)
  const { data: membership } = await supabase
    .from("team_members")
    .select("id, team_permissions(*)")
    .eq("user_id", user.id)
    .eq("status", "ativo")
    .maybeSingle()

  if (membership) {
    const isBlocked = MEMBER_BLOCKED_ROUTES.some(
      r => pathname === r || pathname.startsWith(r + "/")
    )
    if (isBlocked) {
      return NextResponse.redirect(new URL("/dashboard?sem-acesso=1", request.url))
    }
    const routeKey = Object.keys(MEMBER_PERM_MAP).find(
      key => pathname === key || pathname.startsWith(key + "/")
    )
    const requiredPerm = routeKey ? MEMBER_PERM_MAP[routeKey] : undefined
    if (requiredPerm) {
      const perms = (
        membership.team_permissions as unknown as Array<Record<string, boolean>> | null
      )?.[0]
      if (!perms?.[requiredPerm]) {
        return NextResponse.redirect(new URL("/dashboard?sem-acesso=1", request.url))
      }
    }
    return supabaseResponse // member bypasses onboarding and payment gate
  }

  // Onboarding guard
  if (!ONBOARDING_EXEMPT.has(pathname)) {
    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("onboarding_completo")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!perfilError && !perfil?.onboarding_completo) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    // Payment gate — require an active plan after onboarding is complete
    if (!PAYMENT_EXEMPT_ROUTES.has(pathname)) {
      const { data: planoData } = await supabase
        .from("user_planos")
        .select("status, assinatura_termina_em")
        .eq("user_id", user.id)
        .maybeSingle()

      // Assinantes que cancelaram mantêm acesso até o fim do período já pago
      const dentroDoPeriodoPago =
        planoData?.status === "cancelado_fim_periodo" &&
        !!planoData.assinatura_termina_em &&
        new Date(planoData.assinatura_termina_em as string) > new Date()

      const hasActivePlan = planoData?.status === "ativo" || dentroDoPeriodoPago
      if (!hasActivePlan) {
        return NextResponse.redirect(new URL("/planos", request.url))
      }
    }
  }

  // Plan guard — tier enforcement for premium routes
  if (PRO_ROUTES.has(pathname) || ELITE_ROUTES.has(pathname)) {
    // Admin bypassa tier enforcement (mesmo padrão do payment gate)
    if (user.id === process.env.DOCTOR_USER_ID) {
      return supabaseResponse
    }

    const { data: planoData } = await supabase
      .from("user_planos")
      .select("plano, status")
      .eq("user_id", user.id)
      .maybeSingle()

    const plano  = planoData?.plano  ?? "trial"
    const status = planoData?.status ?? "ativo"
    const isActive = status === "ativo"

    if (PRO_ROUTES.has(pathname)) {
      const hasAccess = isActive && (plano === "pro" || plano === "elite")
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/planos?upgrade=pro", request.url))
      }
    }

    if (ELITE_ROUTES.has(pathname)) {
      const hasAccess = isActive && plano === "elite"
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/planos?upgrade=elite", request.url))
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
