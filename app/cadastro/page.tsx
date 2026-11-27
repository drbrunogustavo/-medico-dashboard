"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Panel, PxButton, PxInput, PxCheckbox, Field } from "@/components/px"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

const MIN_SENHA = 8

function CadastroForm() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [codigoIndicacao, setCodigoIndicacao] = useState("")
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [aviso, setAviso] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Guarda o código de afiliado (sessionStorage para o checkout, cookie para a indicação no servidor)
  // e preenche o campo para a pessoa ver e poder editar
  useEffect(() => {
    const ref = searchParams.get("ref")
    if (!ref) return
    setCodigoIndicacao(ref)
    try {
      sessionStorage.setItem("praxis_ref_afiliado", ref)
      document.cookie = `praxis_ref=${encodeURIComponent(ref)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
    } catch (e) { console.error("[cadastro] erro ao guardar código de indicação:", e) }
  }, [searchParams])

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setErro(""); setAviso("")
    if (!nome.trim() || !email.trim() || !senha) { setErro("Preencha nome, e-mail e senha."); return }
    if (senha.length < MIN_SENHA) { setErro(`A senha deve ter no mínimo ${MIN_SENHA} caracteres.`); return }
    if (senha !== confirmarSenha) { setErro("As senhas não coincidem."); return }
    if (!aceitouTermos) { setErro("Você precisa aceitar os Termos de Uso e a Política de Privacidade."); return }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: senha, options: { data: { nome: nome.trim() } } })
      if (error) {
        setErro(error.message.toLowerCase().includes("already registered") ? "Este e-mail já está cadastrado. Faça login." : "Não foi possível criar sua conta. Tente novamente.")
        setLoading(false); return
      }
      if (!data.session) {
        setAviso("Conta criada. Confirme o cadastro pelo link enviado ao seu e-mail antes de entrar.")
        setLoading(false); return
      }

      const salvo = await fetch("/api/perfil", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), termos_aceitos_em: new Date().toISOString() }),
      }).catch(err => { console.error("[cadastro] erro ao salvar nome:", err); return null })
      if (!salvo?.ok) console.error("[cadastro] perfil não gravou nome e aceite dos termos")

      // A indicação nunca deve bloquear o cadastro
      fetch("/api/afiliados/registrar-indicacao", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoManual: codigoIndicacao.trim() || null }),
      }).catch(err => console.error("[cadastro] erro ao registrar indicação:", err))

      const convite = searchParams.get("convite")
      if (convite) {
        await fetch("/api/team/activate", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: convite }),
        }).catch(err => console.error("[cadastro] erro ao ativar convite:", err))
        router.push("/dashboard")
        return
      }
      router.push("/onboarding")
    } catch (err) {
      console.error("[cadastro] erro ao cadastrar:", err)
      setErro("Não foi possível criar sua conta agora. Verifique a conexão e tente de novo.")
      setLoading(false)
    }
  }

  return (
    <div className="px relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="px-stage" aria-hidden="true" />
      <main className="relative w-full max-w-[420px]">
        <Panel as="section" className="space-y-6 !p-8">
          <div className="text-center">
            <h1 className="text-[26px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</h1>
            <p className="mt-1 text-[14px] text-px-muted">Crie sua conta gratuita</p>
          </div>
          <form onSubmit={cadastrar} className="space-y-4" noValidate>
            <Field label="Nome completo" htmlFor="c-nome"><PxInput id="c-nome" autoComplete="name" placeholder="Dr. Seu Nome" value={nome} onChange={e => setNome(e.target.value)} /></Field>
            <Field label="E-mail" htmlFor="c-email"><PxInput id="c-email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} /></Field>
            <Field label="Senha" htmlFor="c-senha" hint={`Mínimo de ${MIN_SENHA} caracteres.`}><PxInput id="c-senha" type="password" autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)} /></Field>
            <Field label="Confirmar senha" htmlFor="c-conf"><PxInput id="c-conf" type="password" autoComplete="new-password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} /></Field>
            <Field label="Código de quem te indicou (opcional)" htmlFor="c-ref" hint="Se alguém te indicou, digite o código dessa pessoa.">
              <PxInput id="c-ref" autoComplete="off" placeholder="Ex.: MEDC1234" value={codigoIndicacao} onChange={e => setCodigoIndicacao(e.target.value.toUpperCase())} className="font-mono" />
            </Field>
            <div className="flex items-start gap-2">
              <PxCheckbox label="" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)} aria-label="Aceito os Termos de Uso e a Política de Privacidade" />
              <p className="text-[12.5px] leading-relaxed text-px-muted">
                Li e aceito os <Link href="/termos" target="_blank" className="font-medium text-px-ink underline underline-offset-2">Termos de Uso</Link> e a{" "}
                <Link href="/privacidade" target="_blank" className="font-medium text-px-ink underline underline-offset-2">Política de Privacidade</Link>.
              </p>
            </div>
            {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
            {aviso && <p role="status" className="rounded-px-card bg-px-ok-soft px-3 py-2 text-[13px] text-px-ok">{aviso}</p>}
            <PxButton type="submit" loading={loading} fullWidth>{loading ? "Criando conta" : "Criar minha conta"}</PxButton>
          </form>
          <div className="space-y-2 text-center text-[13px]">
            <p><Link href="/login" className="font-medium text-px-ink underline underline-offset-2">Já tenho conta</Link></p>
            <p><Link href="/" className="text-px-muted underline underline-offset-2">Voltar para o início</Link></p>
          </div>
        </Panel>
      </main>
    </div>
  )
}

export default function CadastroPage() {
  return <Suspense fallback={null}><CadastroForm /></Suspense>
}
