"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Panel, PxButton, PxInput, Field } from "@/components/px"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

const MIN_SENHA = 8

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [pronto, setPronto] = useState(false)
  const [invalido, setInvalido] = useState(false)
  const [nova, setNova] = useState("")
  const [conf, setConf] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  // O cliente do Supabase troca o código do link por uma sessão de recuperação ao carregar a página.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const { data: sub } = supabase.auth.onAuthStateChange((evento: string, sessao: unknown) => {
      if (evento === "PASSWORD_RECOVERY" || (evento === "SIGNED_IN" && sessao)) setPronto(true)
    })
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) setPronto(true); else setInvalido(true)
    }, 2500)
    return () => { sub.subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (nova.length < MIN_SENHA) { setErro(`A senha precisa ter ao menos ${MIN_SENHA} caracteres.`); return }
    if (nova !== conf) { setErro("As senhas não coincidem."); return }
    setLoading(true); setErro("")
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password: nova })
      if (error) { setErro("Não foi possível salvar a nova senha. Peça um novo link e tente de novo."); return }
      await supabase.auth.signOut()
      router.push("/login?senha=redefinida")
    } catch (err) {
      console.error("[redefinir-senha] erro:", err)
      setErro("Não foi possível salvar agora. Verifique a conexão e tente de novo.")
    } finally { setLoading(false) }
  }

  return (
    <div className="px relative flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-10">
      <div className="px-stage" aria-hidden="true" />
      <main className="relative w-full max-w-[420px]">
        <Panel as="section" className="space-y-6 !p-8">
          <div className="text-center">
            <h1 className="text-[22px] font-semibold text-px-ink">Nova senha</h1>
          </div>
          {invalido && !pronto ? (
            <div role="alert" className="space-y-3 text-[14px] leading-relaxed text-px-ink">
              <p>Este link expirou ou já foi usado.</p>
              <PxButton href="/esqueci-senha" fullWidth>Pedir novo link</PxButton>
            </div>
          ) : !pronto ? (
            <p role="status" className="text-center text-[14px] text-px-muted">Validando o link</p>
          ) : (
            <form onSubmit={salvar} className="space-y-4" noValidate>
              <Field label="Nova senha" htmlFor="n-senha" hint={`Mínimo de ${MIN_SENHA} caracteres.`}>
                <PxInput id="n-senha" type="password" autoComplete="new-password" value={nova} onChange={e => setNova(e.target.value)} />
              </Field>
              <Field label="Confirmar nova senha" htmlFor="n-conf">
                <PxInput id="n-conf" type="password" autoComplete="new-password" value={conf} onChange={e => setConf(e.target.value)} />
              </Field>
              {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
              <PxButton type="submit" loading={loading} fullWidth>{loading ? "Salvando" : "Salvar nova senha"}</PxButton>
            </form>
          )}
          <p className="text-center text-[13px]"><Link href="/login" className="font-medium text-px-ink underline underline-offset-2">Voltar para o login</Link></p>
        </Panel>
      </main>
    </div>
  )
}
