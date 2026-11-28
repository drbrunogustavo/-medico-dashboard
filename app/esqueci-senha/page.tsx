"use client"

import { useState } from "react"
import Link from "next/link"
import { Panel, PxButton, PxInput, Field } from "@/components/px"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [enviado, setEnviado] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErro("Informe um e-mail válido."); return }
    setLoading(true); setErro("")
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/redefinir-senha` })
      // Limite de envios do Supabase: avisa. Qualquer outro resultado recebe a mesma resposta,
      // para a tela não revelar se o e-mail tem conta.
      if (error && error.status === 429) { setErro("Muitas tentativas. Aguarde alguns minutos e tente de novo."); return }
      if (error) console.error("[esqueci-senha]", error.message)
      setEnviado(true)
    } catch (err) {
      console.error("[esqueci-senha] erro:", err)
      setErro("Não foi possível enviar agora. Verifique a conexão e tente de novo.")
    } finally { setLoading(false) }
  }

  return (
    <div className="px relative flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-10">
      <div className="px-stage" aria-hidden="true" />
      <main className="relative w-full max-w-[420px]">
        <Panel as="section" className="space-y-6 !p-8">
          <div className="text-center">
            <h1 className="text-[22px] font-semibold text-px-ink">Recuperar senha</h1>
            <p className="mt-1 text-[14px] text-px-muted">Enviaremos um link para você criar uma nova senha.</p>
          </div>
          {enviado ? (
            <div role="status" className="space-y-3 text-[14px] leading-relaxed text-px-ink">
              <p>Se existir uma conta com esse e-mail, o link chega em alguns minutos. Confira também a caixa de spam.</p>
              <p className="text-px-muted">O link vale por tempo limitado e só pode ser usado uma vez.</p>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-4" noValidate>
              <Field label="E-mail" htmlFor="r-email">
                <PxInput id="r-email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </Field>
              {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
              <PxButton type="submit" loading={loading} fullWidth>{loading ? "Enviando" : "Enviar link"}</PxButton>
            </form>
          )}
          <p className="text-center text-[13px]"><Link href="/login" className="font-medium text-px-ink underline underline-offset-2">Voltar para o login</Link></p>
        </Panel>
      </main>
    </div>
  )
}
