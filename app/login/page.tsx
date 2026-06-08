"use client"

import { useState } from "react"
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

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
      setError("Email ou senha incorretos")
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    // Fixed full-screen overlay — sits above the root layout (sidebar, etc.)
    <div className="fixed inset-0 z-[200] bg-[#08090e] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-[400px] space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(0,192,127,0.12)] border border-[rgba(0,192,127,0.3)] flex items-center justify-center">
            <Activity className="w-6 h-6 text-[#00c07f]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">
              <span style={{ color: "#00c07f" }}>MedContent</span>
              <span className="text-[#e8eaf2]"> Dashboard</span>
            </h1>
            <p className="text-[12px] text-[#7c85a0] mt-1 font-mono">
              Dr. Bruno Gustavo · Poços de Caldas
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#13141d] border border-[#1c1d2a] rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-mono text-[#7c85a0] tracking-wider uppercase mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ fontSize: 16 }}
                className="w-full bg-[#08090e] border border-[#1c1d2a] rounded-lg px-3 py-3 text-[#e8eaf2] placeholder:text-[#474f66] outline-none focus:border-[rgba(0,192,127,0.4)] transition-colors"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-[11px] font-mono text-[#7c85a0] tracking-wider uppercase mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ fontSize: 16 }}
                  className="w-full bg-[#08090e] border border-[#1c1d2a] rounded-lg px-3 py-3 pr-10 text-[#e8eaf2] placeholder:text-[#474f66] outline-none focus:border-[rgba(0,192,127,0.4)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#474f66] hover:text-[#7c85a0] transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye     className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-[12px] text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg font-bold text-[14px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ minHeight: 48, backgroundColor: "#00c07f", color: "#08090e" }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : "Entrar"
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-mono" style={{ color: "rgba(124,133,160,0.5)" }}>
          Acesso restrito · MedContent v2.0
        </p>
      </div>
    </div>
  )
}
