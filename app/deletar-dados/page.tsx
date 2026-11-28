"use client"

import { useState } from "react"
import Link from "next/link"
import { Panel, PxButton, Field, PxInput } from "@/components/px"

const CONTATO = "contato@praxisplataforma.com.br"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function DeletarDadosPage() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (nome.trim().length < 2) { setError("Informe seu nome completo."); return }
    if (!EMAIL_RE.test(email.trim())) { setError("Informe um e-mail válido."); return }
    setError(null); setLoading(true)
    try {
      const res = await fetch("/api/deletar-dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim() }),
      })
      if (res.ok) setDone(true)
      else if (res.status === 429) setError("Muitas solicitações em sequência. Aguarde alguns minutos e tente de novo.")
      else setError(`Não foi possível registrar a solicitação agora. Tente de novo ou escreva para ${CONTATO}.`)
    } catch {
      setError(`Não foi possível enviar. Confira a conexão ou escreva para ${CONTATO}.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px relative min-h-screen">
      <div className="px-stage" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-[560px] space-y-4 px-4 py-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-[20px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</Link>
          <Link href="/privacidade" className="text-[13px] text-px-muted underline underline-offset-2">Política de Privacidade</Link>
        </div>

        <Panel as="section" className="space-y-5 !p-7">
          <div className="space-y-2">
            <p className="text-[13px] text-px-muted">LGPD, art. 18</p>
            <h1 className="text-[26px] font-semibold leading-tight text-px-ink">Solicitar exclusão de dados</h1>
            <p className="text-[14px] leading-relaxed text-px-muted">
              Ao enviar este formulário, você pede a exclusão dos dados pessoais associados ao seu cadastro na plataforma PRAXIS.
            </p>
          </div>

          {done ? (
            <div className="space-y-2 rounded-px-card bg-white p-5">
              <h2 className="text-[18px] font-semibold text-px-ink">Solicitação enviada</h2>
              <p role="status" className="text-[14px] leading-relaxed text-px-muted">
                Recebemos o pedido. A equipe vai responder no e-mail informado para confirmar sua identidade antes de excluir qualquer dado. O prazo de atendimento é de até 30 dias úteis.
              </p>
              <p className="text-[13px] text-px-muted">Dúvidas: <a className="text-px-accent underline underline-offset-2" href={`mailto:${CONTATO}`}>{CONTATO}</a></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <p className="rounded-px-card bg-px-warn-soft px-3 py-2.5 text-[13.5px] leading-relaxed text-px-warn">
                Esta ação é irreversível. Conteúdos gerados, leads, histórico e configurações serão excluídos e a conta será encerrada.
              </p>
              <Field label="Nome completo" htmlFor="dd-nome">
                <PxInput id="dd-nome" autoComplete="name" value={nome} onChange={e => setNome(e.target.value)} placeholder="Dr. João Silva" />
              </Field>
              <Field label="E-mail cadastrado na plataforma" htmlFor="dd-email">
                <PxInput id="dd-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seuemail@exemplo.com.br" />
              </Field>
              {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{error}</p>}
              <p className="text-[13px] leading-relaxed text-px-muted">
                Como o formulário é público, vamos pedir confirmação por e-mail antes de excluir. O prazo é de até 30 dias úteis.
              </p>
              <PxButton type="submit" variant="danger" fullWidth loading={loading}>
                {loading ? "Enviando" : "Solicitar exclusão dos meus dados"}
              </PxButton>
              <p className="text-center text-[13px] text-px-muted">
                Dúvidas? <a className="text-px-accent underline underline-offset-2" href={`mailto:${CONTATO}`}>{CONTATO}</a>
              </p>
            </form>
          )}
        </Panel>
      </div>
    </div>
  )
}
