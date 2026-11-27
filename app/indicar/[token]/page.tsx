"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Panel, PxButton, Field, PxInput } from "@/components/px"

function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function IndicarPage() {
  const { token } = useParams() as { token: string }
  const [step, setStep] = useState<"form" | "done" | "invalid">("form")
  const [nome, setNome] = useState("")
  const [tel, setTel] = useState("")
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    if (nome.trim().length < 2) { setErro("Informe seu nome completo."); return }
    if (tel.replace(/\D/g, "").length < 10) { setErro("Informe um WhatsApp com DDD."); return }
    setErro(""); setSaving(true)
    try {
      const r = await fetch("/api/indicacoes/indicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_indicacao: token, indicado_nome: nome.trim(), indicado_telefone: tel }),
      })
      if (r.ok) setStep("done")
      else if (r.status === 404) setStep("invalid")
      else setErro("Não foi possível enviar seus dados agora. Tente de novo em instantes.")
    } catch {
      setErro("Não foi possível enviar seus dados. Confira a conexão e tente de novo.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px relative flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-10">
      <div className="px-stage" aria-hidden="true" />
      <main className="relative w-full max-w-[440px] space-y-4">
        <p className="text-center text-[22px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</p>

        {step === "form" && (
          <Panel as="section" className="space-y-5 !p-7">
            <div className="space-y-2">
              <p className="text-[13px] text-px-muted">Programa Member Get Member</p>
              <h1 className="text-[22px] font-semibold text-px-ink">Você foi indicado por um paciente</h1>
              <p className="text-[14px] leading-relaxed text-px-muted">
                Preencha seus dados e a equipe entra em contato pelo WhatsApp para agendar sua consulta.
              </p>
            </div>

            <p className="rounded-px-card bg-px-accent-soft px-3 py-2.5 text-[13.5px] leading-relaxed text-px-accent">
              Quem indicou você recebe a próxima consulta como cortesia depois que você realizar a sua.
            </p>

            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field label="Seu nome completo" htmlFor="ind-nome">
                <PxInput id="ind-nome" autoComplete="name" value={nome} onChange={e => setNome(e.target.value)} placeholder="Digite seu nome" />
              </Field>
              <Field label="Seu WhatsApp" htmlFor="ind-tel">
                <PxInput id="ind-tel" type="tel" inputMode="tel" autoComplete="tel" value={tel} onChange={e => setTel(fmtPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </Field>
              {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
              <PxButton type="submit" fullWidth loading={saving}>{saving ? "Enviando" : "Quero ser paciente"}</PxButton>
            </form>
          </Panel>
        )}

        {step === "done" && (
          <Panel as="section" className="space-y-2 !p-7 text-center">
            <h1 className="text-[22px] font-semibold text-px-ink">Recebemos seus dados</h1>
            <p role="status" className="text-[14px] leading-relaxed text-px-muted">
              A equipe vai chamar você pelo WhatsApp para agendar a consulta.
            </p>
          </Panel>
        )}

        {step === "invalid" && (
          <Panel as="section" className="space-y-2 !p-7 text-center">
            <h1 className="text-[20px] font-semibold text-px-ink">Link de indicação inválido</h1>
            <p role="alert" className="text-[14px] leading-relaxed text-px-muted">
              Este link não foi encontrado ou expirou. Peça um novo link a quem indicou você.
            </p>
          </Panel>
        )}
      </main>
    </div>
  )
}
