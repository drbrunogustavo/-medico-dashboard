"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Panel, PxButton, Field, PxInput, Segmented } from "@/components/px"

// Mantenha estes valores iguais a PRECOS em app/api/anuncios-cursos/checkout/route.ts
const PERIODOS = [
  { dias: 7, label: "7 dias", preco: "R$ 150" },
  { dias: 15, label: "15 dias", preco: "R$ 250" },
  { dias: 30, label: "30 dias", preco: "R$ 400" },
]

const TIPOS_PRODUTO = [
  { value: "curso", label: "Curso" },
  { value: "livro", label: "Livro" },
  { value: "equipamento", label: "Equipamento" },
  { value: "suplemento", label: "Suplemento" },
  { value: "mentoria", label: "Mentoria" },
  { value: "ferramenta", label: "Ferramenta" },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/[^\s]+$/i

type Pagamento = "confirmando" | "confirmado" | "aguardando" | "falha"

export default function AnunciarCursoPage() {
  const [form, setForm] = useState({
    titulo: "", chamada: "", link_destino: "", anunciante_nome: "", anunciante_foto_url: "",
    contato_email: "", contato_telefone: "", periodo_dias: 15, tipo_produto: "curso",
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [uploadando, setUploadando] = useState(false)
  const [uploadErro, setUploadErro] = useState("")
  const [uploadPreview, setUploadPreview] = useState("")
  const [previewErro, setPreviewErro] = useState(false)
  const [pagamento, setPagamento] = useState<Pagamento | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Retorno do Stripe: ?sucesso=true&session_id=... O resultado vem da confirmação no servidor, não da URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get("session_id")
    if (params.get("sucesso") !== "true" || !sessionId) return
    setPagamento("confirmando")
    fetch("/api/anuncios-cursos/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(r => setPagamento(r.ok ? "confirmado" : r.status === 402 ? "aguardando" : "falha"))
      .catch(() => setPagamento("falha"))
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    setUploadando(true); setUploadErro(""); setPreviewErro(false)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/anuncios-cursos/upload-imagem", { method: "POST", body: fd })
      const data = await res.json().catch(() => null)
      if (!res.ok || typeof data?.url !== "string") {
        setUploadErro(res.status === 400 && typeof data?.error === "string" ? data.error : "Não foi possível enviar a imagem. Tente de novo.")
        return
      }
      setUploadPreview(data.url)
      setForm(f => ({ ...f, anunciante_foto_url: data.url }))
    } catch {
      setUploadErro("Não foi possível enviar a imagem. Confira a conexão.")
    } finally {
      setUploadando(false)
    }
  }, [])

  const set = (key: string, val: string | number) => setForm(f => ({ ...f, [key]: val }))
  const campo = (k: "titulo" | "chamada" | "link_destino" | "anunciante_nome" | "contato_email" | "contato_telefone") =>
    (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value)

  const tipoLabel = TIPOS_PRODUTO.find(t => t.value === form.tipo_produto)?.label ?? "Produto"
  const periodo = PERIODOS.find(p => p.dias === form.periodo_dias)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!form.titulo.trim() || !form.chamada.trim() || !form.anunciante_nome.trim()) { setErro("Preencha título, chamada e sua identificação."); return }
    if (!URL_RE.test(form.link_destino.trim())) { setErro("O link precisa começar com http:// ou https://."); return }
    if (!EMAIL_RE.test(form.contato_email.trim())) { setErro("Informe um e-mail de contato válido."); return }
    setLoading(true); setErro("")
    try {
      const res = await fetch("/api/anuncios-cursos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || typeof data?.url !== "string") {
        setErro(res.status === 400 ? "Confira os dados do anúncio e tente de novo." : "Não foi possível iniciar o pagamento agora. Os dados foram mantidos, tente de novo.")
        return
      }
      window.location.href = data.url
    } catch {
      setErro("Não foi possível iniciar o pagamento. Confira a conexão e tente de novo.")
    } finally {
      setLoading(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="px relative min-h-screen">
      <div className="px-stage" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-[600px] space-y-4 px-4 py-10">
        <div className="flex items-center justify-between">
          <span className="text-[20px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</span>
          <Link href="/login" className="text-[13px] text-px-muted underline underline-offset-2">Voltar ao login</Link>
        </div>
        {children}
      </div>
    </div>
  )

  if (pagamento) {
    const textos: Record<Pagamento, { t: string; d: string }> = {
      confirmando: { t: "Confirmando o pagamento", d: "Aguarde um instante." },
      confirmado: { t: "Pagamento confirmado", d: "Seu anúncio está em análise e entra no ar depois da aprovação, em até 24 horas. Se for rejeitado, o pagamento é estornado." },
      aguardando: { t: "Pagamento em processamento", d: "O pagamento ainda não foi confirmado pelo Stripe. Assim que for, o anúncio segue para análise automaticamente." },
      falha: { t: "Não foi possível confirmar agora", d: "Se o pagamento foi concluído, o anúncio segue para análise automaticamente. Em caso de dúvida, escreva para contato@praxisplataforma.com.br." },
    }
    return shell(
      <Panel as="section" className="space-y-2 !p-7 text-center">
        <h1 className="text-[22px] font-semibold text-px-ink">{textos[pagamento].t}</h1>
        <p role="status" className="text-[14px] leading-relaxed text-px-muted">{textos[pagamento].d}</p>
      </Panel>
    )
  }

  return shell(
    <>
      <div className="space-y-2 px-1">
        <h1 className="text-[26px] font-semibold leading-tight text-px-ink">Anuncie no Marketplace Praxis</h1>
        <p className="text-[14px] leading-relaxed text-px-muted">
          O anúncio aparece no banner da tela de login da PRAXIS. O pagamento é único, sem recorrência, e o período começa depois que o anúncio for aprovado.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Panel as="section" className="space-y-3">
          <h2 className="text-[15px] font-semibold text-px-ink">Tipo de produto</h2>
          <Segmented label="Tipo de produto" value={form.tipo_produto} onChange={v => set("tipo_produto", v)} options={TIPOS_PRODUTO} />
        </Panel>

        <Panel as="section" className="space-y-4">
          <h2 className="text-[15px] font-semibold text-px-ink">Sobre o produto</h2>
          <Field label={`Título (${tipoLabel.toLowerCase()})`} htmlFor="an-titulo">
            <PxInput id="an-titulo" maxLength={80} value={form.titulo} onChange={campo("titulo")} placeholder="Ex: Masterclass de Emagrecimento Funcional" />
          </Field>
          <Field label="Chamada" htmlFor="an-chamada">
            <PxInput id="an-chamada" maxLength={120} value={form.chamada} onChange={campo("chamada")} placeholder="Ex: Inscrições abertas até sexta" />
          </Field>
          <Field label="Link de destino" htmlFor="an-link">
            <PxInput id="an-link" type="url" value={form.link_destino} onChange={campo("link_destino")} placeholder="https://..." />
          </Field>
        </Panel>

        <Panel as="section" className="space-y-4">
          <h2 className="text-[15px] font-semibold text-px-ink">Seus dados</h2>
          <Field label="Nome ou identificação" htmlFor="an-nome">
            <PxInput id="an-nome" maxLength={80} value={form.anunciante_nome} onChange={campo("anunciante_nome")} placeholder="Dra. Ana Lima, nutróloga" />
          </Field>

          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Foto ou banner (opcional)</p>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Selecionar imagem" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
            {uploadPreview ? (
              <div className="flex items-center gap-3">
                {previewErro ? (
                  <p className="max-w-[340px] text-[13px] text-px-warn">Não foi possível carregar a prévia. O envio pode ter funcionado, mas confira antes de pagar.</p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={uploadPreview} alt="Prévia da imagem enviada" onError={() => setPreviewErro(true)} className="h-12 w-12 flex-shrink-0 rounded-px-ctl border border-px-line object-cover" />
                )}
                <PxButton variant="quiet" size="sm" onClick={() => { setUploadPreview(""); setPreviewErro(false); setForm(f => ({ ...f, anunciante_foto_url: "" })); if (fileInputRef.current) fileInputRef.current.value = "" }}>Trocar imagem</PxButton>
              </div>
            ) : (
              <PxButton variant="secondary" loading={uploadando} onClick={() => fileInputRef.current?.click()}>
                {uploadando ? "Enviando" : "Selecionar imagem"}
              </PxButton>
            )}
            <p className="text-[12.5px] text-px-muted">JPEG, PNG ou WebP, até 2 MB.</p>
            {uploadErro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{uploadErro}</p>}
          </div>

          <Field label="E-mail de contato" htmlFor="an-email">
            <PxInput id="an-email" type="email" autoComplete="email" value={form.contato_email} onChange={campo("contato_email")} placeholder="seu@email.com" />
          </Field>
          <Field label="Telefone ou WhatsApp (opcional)" htmlFor="an-tel">
            <PxInput id="an-tel" type="tel" autoComplete="tel" maxLength={30} value={form.contato_telefone} onChange={campo("contato_telefone")} placeholder="(11) 99999-9999" />
          </Field>
        </Panel>

        <Panel as="section" className="space-y-3">
          <h2 className="text-[15px] font-semibold text-px-ink">Período e preço</h2>
          <div role="group" aria-label="Período do anúncio" className="grid grid-cols-3 gap-2">
            {PERIODOS.map(p => {
              const ativo = form.periodo_dias === p.dias
              return (
                <button key={p.dias} type="button" aria-pressed={ativo} onClick={() => set("periodo_dias", p.dias)}
                  className={cn("rounded-px-card border px-2 py-3.5 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40", ativo ? "border-px-ink bg-white" : "border-px-line bg-white/50 hover:bg-white")}>
                  <span className="block text-[13.5px] text-px-muted">{p.label}</span>
                  <span className="mt-1 block text-[20px] font-semibold text-px-ink">{p.preco}</span>
                </button>
              )
            })}
          </div>
          <p className="text-[13px] text-px-muted">Pagamento único por cartão, via Stripe. O anúncio passa por análise em até 24 horas e, se for rejeitado, o pagamento é estornado.</p>
        </Panel>

        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
        <PxButton type="submit" fullWidth loading={loading}>
          {loading ? "Abrindo o pagamento" : `Pagar ${periodo?.preco ?? ""} e anunciar`}
        </PxButton>
      </form>
    </>
  )
}
