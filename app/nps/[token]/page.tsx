"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Loader2, CheckCircle, Heart } from "lucide-react"
import { PraxisLogo } from "@/components/PraxisLogo"

export default function NPSSurveyPage() {
  const { token } = useParams() as { token: string }

  const [step,      setStep]      = useState<"loading" | "survey" | "done" | "error" | "already">("loading")
  const [nome,      setNome]      = useState("")
  const [nota,      setNota]      = useState<number | null>(null)
  const [comentario, setComentario] = useState("")
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    fetch(`/api/nps/public?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStep("error"); return }
        if (data.status === "respondido") { setStep("already"); return }
        setNome(data.paciente_nome ?? "")
        setStep("survey")
      })
      .catch(() => setStep("error"))
  }, [token])

  async function submit() {
    if (nota === null) return
    setSaving(true)
    try {
      const r = await fetch("/api/nps/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nota, comentario }),
      })
      if (r.ok) setStep("done")
      else { const d = await r.json(); if (d.error === "Já respondida") setStep("already"); else setStep("error") }
    } catch { setStep("error") }
    finally { setSaving(false) }
  }

  const COLORS: Record<number, string> = {
    0: "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20",
    1: "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20",
    2: "border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20",
    3: "border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20",
    4: "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20",
    5: "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20",
    6: "border-orange-400/40 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20",
    7: "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
    8: "border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20",
    9: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
    10:"border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20",
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <PraxisLogo />
        </div>

        {step === "loading" && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {step === "survey" && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
            <div className="text-center">
              <h1 className="text-[20px] font-bold text-text-primary">Como foi sua consulta?</h1>
              <p className="text-[13px] text-text-secondary mt-1">
                {nome ? `Olá, ${nome.split(" ")[0]}!` : "Olá!"} Sua opinião é muito importante para nós.
              </p>
            </div>

            <div>
              <p className="text-[12px] text-text-muted text-center mb-3">
                De 0 a 10, qual a probabilidade de indicar o Dr. Bruno Gustavo a alguém?
              </p>
              <div className="grid grid-cols-6 gap-2 mb-2">
                {[0,1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => setNota(n)}
                    className={cn(
                      "h-12 rounded-xl border text-[16px] font-bold transition-all",
                      nota === n ? COLORS[n] + " scale-110 ring-2 ring-current/30" : "border-border text-text-muted hover:border-border-hover"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setNota(n)}
                    className={cn(
                      "h-12 rounded-xl border text-[16px] font-bold transition-all",
                      nota === n ? COLORS[n] + " scale-110 ring-2 ring-current/30" : "border-border text-text-muted hover:border-border-hover"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                <span>Definitivamente não</span>
                <span>Definitivamente sim</span>
              </div>
            </div>

            <div>
              <label className="block text-[12px] text-text-muted mb-1.5">
                Comentário (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="O que achou da consulta? Sugestões de melhoria?"
                rows={3}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-[13px] text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none"
              />
            </div>

            <button
              onClick={submit}
              disabled={nota === null || saving}
              className="w-full py-3 rounded-xl bg-accent text-background text-[14px] font-bold disabled:opacity-50 transition-all hover:bg-accent/90 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Enviando..." : "Confirmar avaliação"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
            </div>
            <h1 className="text-[20px] font-bold text-text-primary">Muito obrigado!</h1>
            <p className="text-[13px] text-text-secondary">
              Sua avaliação foi registrada com sucesso. Ela nos ajuda a melhorar continuamente o atendimento.
            </p>
            {nota !== null && nota >= 9 && (
              <div className="mt-4 p-4 bg-accent-dim border border-accent-border rounded-xl text-center">
                <Heart className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="text-[13px] text-accent font-medium">
                  Fico muito feliz com sua satisfação! Que tal indicar nossa clínica para um amigo?
                </p>
              </div>
            )}
          </div>
        )}

        {(step === "error" || step === "already") && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-3">
            <h1 className="text-[20px] font-bold text-text-primary">
              {step === "already" ? "Pesquisa já respondida" : "Ops, algo deu errado"}
            </h1>
            <p className="text-[13px] text-text-secondary">
              {step === "already"
                ? "Esta pesquisa já foi respondida anteriormente."
                : "Não foi possível carregar a pesquisa. O link pode ter expirado."}
            </p>
          </div>
        )}

        <p className="text-center text-[11px] text-text-muted mt-6">
          Desenvolvido com PRAXIS · Dr. Bruno Gustavo
        </p>
      </div>
    </div>
  )
}
