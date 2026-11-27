"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Panel, PxButton } from "@/components/px"

const NOTAS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function NPSSurveyPage() {
  const { token } = useParams() as { token: string }

  const [step, setStep] = useState<"loading" | "survey" | "done" | "error" | "already">("loading")
  const [nome, setNome] = useState("")
  const [nota, setNota] = useState<number | null>(null)
  const [comentario, setComentario] = useState("")
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState("")

  useEffect(() => {
    let vivo = true
    fetch(`/api/nps/public?token=${encodeURIComponent(token)}`)
      .then(async r => ({ ok: r.ok, data: await r.json().catch(() => null) }))
      .then(({ ok, data }) => {
        if (!vivo) return
        if (!ok || !data || data.error) { setStep("error"); return }
        if (data.status === "respondido") { setStep("already"); return }
        setNome(typeof data.paciente_nome === "string" ? data.paciente_nome : "")
        setStep("survey")
      })
      .catch(() => { if (vivo) setStep("error") })
    return () => { vivo = false }
  }, [token])

  async function submit() {
    if (nota === null || saving) return
    setErro(""); setSaving(true)
    try {
      const r = await fetch("/api/nps/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nota, comentario: comentario.trim() }),
      })
      if (r.ok) setStep("done")
      else if (r.status === 409) setStep("already")
      else if (r.status === 404) setStep("error")
      else setErro("Não foi possível enviar sua avaliação agora. Tente de novo em instantes.")
    } catch {
      setErro("Não foi possível enviar sua avaliação. Confira a conexão e tente de novo.")
    } finally {
      setSaving(false)
    }
  }

  const primeiroNome = nome.trim().split(" ")[0]

  return (
    <div className="px relative flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-10">
      <div className="px-stage" aria-hidden="true" />
      <main className="relative w-full max-w-[460px] space-y-4">
        <p className="text-center text-[22px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</p>

        {step === "loading" && <p role="status" className="py-10 text-center text-[14px] text-px-muted">Carregando a pesquisa.</p>}

        {step === "survey" && (
          <Panel as="section" className="space-y-6 !p-7">
            <div className="space-y-1">
              <h1 className="text-[22px] font-semibold text-px-ink">Como foi sua consulta?</h1>
              <p className="text-[14px] text-px-muted">{primeiroNome ? `Olá, ${primeiroNome}. ` : ""}Sua opinião ajuda a melhorar o atendimento.</p>
            </div>

            <div role="group" aria-labelledby="nps-pergunta" className="space-y-2">
              <p id="nps-pergunta" className="text-[14px] text-px-ink">De 0 a 10, qual a chance de você indicar a clínica a alguém?</p>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                {NOTAS.map(n => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={nota === n}
                    onClick={() => setNota(n)}
                    className={cn(
                      "h-11 rounded-px-ctl border text-[15px] font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40",
                      nota === n ? "border-px-ink bg-px-ink text-white" : "border-px-line bg-white text-px-ink hover:bg-white/80"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[12.5px] text-px-muted">
                <span>0, nenhuma chance</span>
                <span>10, certamente</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nps-coment" className="block text-[13px] font-medium text-px-ink">Comentário (opcional)</label>
              <textarea
                id="nps-coment"
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="O que achou da consulta? Alguma sugestão?"
                className="w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
              />
            </div>

            {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
            <PxButton fullWidth loading={saving} disabled={nota === null} onClick={submit}>
              {saving ? "Enviando" : "Enviar avaliação"}
            </PxButton>
          </Panel>
        )}

        {step === "done" && (
          <Panel as="section" className="space-y-2 !p-7 text-center">
            <h1 className="text-[22px] font-semibold text-px-ink">Obrigado pela avaliação</h1>
            <p role="status" className="text-[14px] leading-relaxed text-px-muted">Sua resposta foi registrada.</p>
          </Panel>
        )}

        {(step === "error" || step === "already") && (
          <Panel as="section" className="space-y-2 !p-7 text-center">
            <h1 className="text-[20px] font-semibold text-px-ink">{step === "already" ? "Pesquisa já respondida" : "Não foi possível abrir a pesquisa"}</h1>
            <p className="text-[14px] leading-relaxed text-px-muted">
              {step === "already" ? "Esta pesquisa já foi respondida. Obrigado." : "O link pode ter expirado ou estar incorreto. Tente abrir de novo pelo link recebido."}
            </p>
          </Panel>
        )}
      </main>
    </div>
  )
}
