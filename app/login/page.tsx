"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Check, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { PraxisLogo } from "@/components/PraxisLogo"

const BULLETS = [
  "15 módulos de inteligência e criação",
  "Conteúdo profissional em minutos",
  "Tecnologia usada por médicos de elite",
]

export default function LoginPage() {
  const [email,        setEmail]        = useState("brunogustavosa@gmail.com")
  const [password,     setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError("Email ou senha incorretos.")
      setLoading(false)
      return
    }

    // Check onboarding status to decide where to redirect
    try {
      const r = await fetch("/api/perfil")
      if (r.ok) {
        const perfil = await r.json() as { onboarding_completo?: boolean } | null
        if (!perfil?.onboarding_completo) {
          router.push("/onboarding")
          return
        }
      }
    } catch {
      // If we can't check, go to dashboard — middleware will handle it
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-[200] flex animate-fade-in" style={{ background: "var(--background)" }}>

      {/* Back link — top-left corner, outside both panels */}
      <Link
        href="/"
        className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Voltar para o início
      </Link>

      {/* ── LEFT PANEL (60%) — brand ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[60%] flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 60%, var(--surface) 100%)" }}>

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                background: `rgba(0,192,127,${0.15 + (i % 4) * 0.08})`,
                left: `${5 + (i * 5.2) % 90}%`,
                top: `${10 + (i * 7.3) % 80}%`,
                animation: `particle ${14 + (i % 6) * 3}s ${i * 0.8}s linear infinite`,
              }}
            />
          ))}
        </div>

        {/* Accent glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/[0.04] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/[0.03] rounded-full blur-[60px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md px-8">
          <PraxisLogo className="mb-10 scale-110" />

          <p className="text-[15px] text-text-secondary mb-12 leading-relaxed max-w-xs">
            A plataforma que transforma sua expertise médica em presença digital de alto impacto.
          </p>

          <div className="w-full space-y-4">
            {BULLETS.map((b, i) => (
              <div key={i} className="flex items-center gap-4 text-left">
                <div className="w-6 h-6 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-accent" />
                </div>
                <span className="text-[14px] text-text-secondary">{b}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" />
            <span className="text-[10px] font-mono text-text-muted tracking-widest">SISTEMA SEGURO · ACESSO EXCLUSIVO</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (40%) — form ────────────────────────────────────── */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center px-6 relative"
        style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)" }}>

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex flex-col items-center">
          <PraxisLogo />
        </div>

        <div className="w-full max-w-[360px]">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[22px] font-semibold text-text-primary mb-1">Acesse sua conta</h1>
            <p className="text-[13px] text-text-muted">Plataforma exclusiva para profissionais de saúde</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-text-muted tracking-[2px] uppercase">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-text-muted focus:ring-1 focus:ring-[rgba(0,192,127,0.4)]"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  WebkitTextFillColor: "var(--text-primary)",
                  caretColor: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  colorScheme: "light",
                }}
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-text-muted tracking-[2px] uppercase">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all placeholder:text-text-muted focus:ring-1 focus:ring-[rgba(0,192,127,0.4)]"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    WebkitTextFillColor: "var(--text-primary)",
                    caretColor: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    colorScheme: "light",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-[12px] text-red-400 bg-red-950/30 border border-red-500/25 rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg font-semibold text-[14px] transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ minHeight: 50, background: "#00c07f", color: "#080808", letterSpacing: "0.3px" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar na plataforma"}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] font-mono text-text-muted tracking-widest">
            ACESSO RESTRITO · PRAXIS v3.0
          </p>
        </div>
      </div>
    </div>
  )
}
