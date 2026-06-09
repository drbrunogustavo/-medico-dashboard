"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Loader2, CheckCircle, Heart, UserPlus } from "lucide-react"
import { PraxisLogo } from "@/components/PraxisLogo"

const inputCls = "w-full bg-surface border border-border rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"

function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d; if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

export default function IndicarPage() {
  const { token } = useParams() as { token: string }
  const [step,   setStep]   = useState<"form" | "saving" | "done" | "error">("form")
  const [nome,   setNome]   = useState("")
  const [tel,    setTel]    = useState("")
  const [error,  setError]  = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !tel.trim()) return
    setStep("saving")
    try {
      // We need a public endpoint to register the referral
      // For now, we'll use the indicacoes public route
      const r = await fetch("/api/indicacoes/indicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_indicacao: token, indicado_nome: nome.trim(), indicado_telefone: tel }),
      })
      if (r.ok) setStep("done")
      else { const d = await r.json(); setError(d.error ?? "Erro ao registrar indicação"); setStep("error") }
    } catch { setError("Erro de conexão"); setStep("error") }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <PraxisLogo />
        </div>

        {step === "form" || step === "saving" ? (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {/* Program info */}
            <div className="p-6 bg-accent-dim border-b border-accent-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-accent" />
                <span className="text-[11px] font-mono text-accent uppercase tracking-widest">Programa Member Get Member</span>
              </div>
              <h1 className="text-[20px] font-bold text-text-primary mb-2">Indique um amigo</h1>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Você foi indicado por um paciente do Dr. Bruno Gustavo. Preencha seus dados e nossa equipe entrará em contato para agendar sua consulta.
              </p>
            </div>

            {/* Benefit callout */}
            <div className="px-6 py-4 bg-amber-500/5 border-b border-amber-500/15">
              <p className="text-[12px] text-amber-300 leading-relaxed">
                🎁 Quem indicou você receberá a próxima consulta como cortesia após você realizar a sua!
              </p>
            </div>

            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Seu nome completo</label>
                <input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Digite seu nome" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-text-muted mb-1.5 uppercase tracking-wider">Seu WhatsApp</label>
                <input value={tel} onChange={e => setTel(fmtPhone(e.target.value))} required placeholder="(11) 99999-9999" className={inputCls} />
              </div>
              <button
                type="submit"
                disabled={step === "saving" || !nome.trim() || !tel.trim()}
                className="w-full py-3.5 rounded-xl bg-accent text-background text-[14px] font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-accent/90 transition-all"
              >
                {step === "saving" ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><UserPlus className="w-4 h-4" /> Quero ser paciente</>}
              </button>
            </form>
          </div>
        ) : step === "done" ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
            </div>
            <h1 className="text-[20px] font-bold text-text-primary">Obrigado pelo interesse!</h1>
            <p className="text-[13px] text-text-secondary">
              Recebemos seus dados. Nossa equipe entrará em contato via WhatsApp em breve para agendar sua consulta com o Dr. Bruno Gustavo.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-red-500/20 rounded-2xl p-8 text-center space-y-3">
            <h1 className="text-[18px] font-bold text-text-primary">Ops, algo deu errado</h1>
            <p className="text-[13px] text-text-secondary">{error || "Link inválido ou expirado."}</p>
          </div>
        )}

        <p className="text-center text-[11px] text-text-muted mt-6">Dr. Bruno Gustavo · PRAXIS</p>
      </div>
    </div>
  )
}
