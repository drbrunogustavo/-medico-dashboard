"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Panel, PxButton, PxInput, Field } from "@/components/px"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

interface BannerAd {
  id: string
  titulo: string
  chamada: string
  link_destino: string
  anunciante_nome: string
  anunciante_foto_url: string | null
}

const linkSeguro = (u: string) => /^https?:\/\//i.test(u)

function LoginForm() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [banner, setBanner] = useState<BannerAd | null>(null)
  const router = useRouter()
  const senhaRedefinida = useSearchParams().get("senha") === "redefinida"

  useEffect(() => {
    fetch("/api/anuncios-cursos/publico")
      .then(r => (r.ok ? r.json() : null))
      .then((data: { anuncio: BannerAd | null } | null) => { if (data?.anuncio && linkSeguro(data.anuncio.link_destino)) setBanner(data.anuncio) })
      .catch(e => console.error("[login] erro ao carregar anúncio:", e))
  }, [])

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!email.trim() || !senha) { setErro("Informe e-mail e senha."); return }
    setLoading(true); setErro("")
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
      if (error) { setErro("E-mail ou senha incorretos."); setLoading(false); return }
      router.push("/dashboard")
    } catch (err) {
      console.error("[login] erro ao entrar:", err)
      setErro("Não foi possível entrar agora. Verifique a conexão e tente de novo.")
      setLoading(false)
    }
  }

  return (
    <div className="px relative flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-10">
      <div className="px-stage" aria-hidden="true" />
      <main className="relative w-full max-w-[420px] space-y-4">
        <Panel as="section" className="space-y-6 !p-8">
          <div className="text-center">
            <h1 className="text-[26px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</h1>
            <p className="mt-1 text-[14px] text-px-muted">Acesse sua plataforma</p>
          </div>
          <form onSubmit={entrar} className="space-y-4" noValidate>
            <Field label="E-mail" htmlFor="l-email">
              <PxInput id="l-email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Senha" htmlFor="l-senha">
              <PxInput id="l-senha" type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} />
            </Field>
            {senhaRedefinida && !erro && <p role="status" className="rounded-px-card bg-px-ink/5 px-3 py-2 text-[13px] text-px-ink">Senha alterada. Entre com a nova senha.</p>}
            {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
            <PxButton type="submit" loading={loading} fullWidth>{loading ? "Entrando" : "Entrar"}</PxButton>
          </form>
          <div className="space-y-2 text-center text-[13px]">
            <p><Link href="/esqueci-senha" className="text-px-muted underline underline-offset-2">Esqueci a senha</Link></p>
            <p><Link href="/cadastro" className="font-medium text-px-ink underline underline-offset-2">Criar conta gratuita</Link></p>
            <p><Link href="/" className="text-px-muted underline underline-offset-2">Voltar para o início</Link></p>
          </div>
        </Panel>

        {banner && (
          <a href={banner.link_destino} target="_blank" rel="noopener noreferrer" className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 rounded-px-panel">
            <Panel as="article" className="space-y-2 !p-4">
              <div className="flex items-center gap-3">
                {banner.anunciante_foto_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={banner.anunciante_foto_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  : <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-px-ink/10 text-[14px] font-semibold text-px-ink">{banner.anunciante_nome.charAt(0).toUpperCase()}</span>}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-px-ink">{banner.titulo}</p>
                  <p className="text-[12px] text-px-muted">{banner.anunciante_nome}</p>
                </div>
                <span className="shrink-0 text-[12px] font-medium text-px-ink underline underline-offset-2">Ver curso</span>
              </div>
              <p className="text-[12.5px] leading-relaxed text-px-ink/80">{banner.chamada}</p>
              <p className="text-[11px] text-px-muted">Espaço patrocinado</p>
            </Panel>
          </a>
        )}

        <p className="pt-2 text-center text-[12px] text-px-muted">
          Especialista e quer divulgar seu curso aqui?{" "}
          <Link href="/anunciar-curso" className="font-medium text-px-ink underline underline-offset-2">Anunciar curso</Link>
        </p>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>
}
