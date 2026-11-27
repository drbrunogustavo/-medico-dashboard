"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, MessageCircle } from "lucide-react"
import { Panel, PxButton, Tag, PageHeader } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AfiliadoData {
  codigo_afiliado:          string
  comissao_percentual:      number
  total_indicados:          number
  total_comissao_acumulada: number
  status:                   string
}

interface Indicacao {
  id:              string
  indicado_email:  string
  plano_assinado:  string | null
  valor_comissao:  number | null
  status:          "pendente" | "ativo" | "cancelado"
  created_at:      string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://praxisplataforma.com.br"

const STATUS_UI = {
  pendente:  { label: "Pendente",  tone: "warn"   },
  ativo:     { label: "Ativo",     tone: "ok"     },
  cancelado: { label: "Cancelado", tone: "danger" },
} as const

const PASSOS = [
  { n: "1", title: "Compartilhe seu link", desc: "Envie para colegas médicos que podem se beneficiar do PRAXIS." },
  { n: "2", title: "O médico assina",      desc: "Quando seu indicado assinar qualquer plano, a comissão é registrada." },
  { n: "3", title: "Você recebe 20%",      desc: "Sobre cada fatura paga, por até 12 meses a partir da primeira fatura paga." },
]

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AfiliadosPage() {
  const [afiliado,   setAfiliado]   = useState<AfiliadoData | null>(null)
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([])
  const [loading,    setLoading]    = useState(true)
  const [loadError,  setLoadError]  = useState(false)
  const [gerando,    setGerando]    = useState(false)
  const [erroGerar,  setErroGerar]  = useState("")
  const [copied,     setCopied]     = useState(false)
  const [erroCopia,  setErroCopia]  = useState(false)
  const [pendente,   setPendente]   = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch("/api/afiliados")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAfiliado(data.afiliado ?? null)
      setIndicacoes(data.indicacoes ?? [])
      if (data.afiliado?.status === "pendente") setPendente(true)
    } catch (e) {
      console.error("[afiliados] erro ao carregar:", e)
      setLoadError(true)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleGerarCodigo = async () => {
    setGerando(true)
    setErroGerar("")
    try {
      const res = await fetch("/api/afiliados/gerar-codigo", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.afiliado) throw new Error(data.error ?? `HTTP ${res.status}`)
      setAfiliado(data.afiliado as AfiliadoData)
      if (data.status === "pendente") setPendente(true)
    } catch (e) {
      console.error("[afiliados] erro ao gerar código:", e)
      setErroGerar("Não foi possível gerar o link. Tente novamente.")
    } finally { setGerando(false) }
  }

  const linkAfiliado = afiliado ? `${APP_URL}/cadastro?ref=${afiliado.codigo_afiliado}` : ""

  const handleCopy = async () => {
    if (!linkAfiliado) return
    setErroCopia(false)
    try {
      await navigator.clipboard.writeText(linkAfiliado)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      console.error("[afiliados] erro ao copiar:", e)
      setErroCopia(true)
    }
  }

  const handleWhatsApp = () => {
    const texto = encodeURIComponent(
      `Olá! Estou usando o PRAXIS para gerenciar minha clínica e estou gostando muito.\n\nÉ uma plataforma completa para médicos, com CRM, Copiloto IA, financeiro, conteúdo e mais.\n\nSe quiser conhecer, use meu link para ganhar acesso: ${linkAfiliado}`
    )
    window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener,noreferrer")
  }

  const mesAtual = new Date().toISOString().slice(0, 7)
  const comissaoMes = indicacoes
    .filter(i => i.created_at.startsWith(mesAtual) && i.status === "ativo")
    .reduce((s, i) => s + (i.valor_comissao ?? 0), 0)

  const numeros = [
    { label: "Indicados",           value: String(afiliado?.total_indicados ?? 0) },
    { label: "Comissão acumulada",  value: brl(afiliado?.total_comissao_acumulada ?? 0) },
    { label: "Comissão este mês",   value: brl(comissaoMes) },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Programa de Afiliados" caption="20% de comissão por indicado, por até 12 meses" />

      <div className="max-w-3xl space-y-4 px-4 pb-10 md:px-10">
        {loading ? (
          <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando seu programa</p>
        ) : loadError ? (
          <Panel className="py-10 text-center">
            <p role="alert" className="mb-3 text-[14px] font-semibold text-px-ink">Não foi possível carregar o programa de afiliados</p>
            <PxButton variant="secondary" onClick={fetchData}>Tentar de novo</PxButton>
          </Panel>
        ) : (
          <>
            <Panel tone="dark" className="space-y-1.5 px-6 py-6">
              <h2 className="text-[20px] font-medium tracking-[-0.02em] text-white">Indique o PRAXIS e receba 20% de cada fatura paga</h2>
              <p className="text-[13.5px] leading-relaxed text-white/75">
                Para cada médico que assinar pelo seu link, você recebe 20% do valor de cada fatura paga por ele, durante 12 meses a partir da primeira fatura paga.
              </p>
            </Panel>

            <Panel className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">Seu link de afiliado</h2>
              {!afiliado ? (
                <div className="py-3 text-center">
                  <p className="mb-4 text-[13.5px] text-px-muted">Gere seu link exclusivo para começar a indicar.</p>
                  <PxButton onClick={handleGerarCodigo} loading={gerando}>{gerando ? "Gerando" : "Gerar meu link"}</PxButton>
                  {erroGerar && <p role="alert" className="mt-3 text-[13px] text-px-danger">{erroGerar}</p>}
                </div>
              ) : (
                <>
                  <p className="break-all rounded-px-ctl bg-px-ink/[0.05] px-3.5 py-2.5 font-mono text-[12.5px] text-px-ink" data-testid="link-afiliado">{linkAfiliado}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <PxButton variant="secondary" fullWidth onClick={handleCopy} leftIcon={copied ? Check : Copy}>
                      {copied ? "Link copiado" : "Copiar link"}
                    </PxButton>
                    <PxButton fullWidth onClick={handleWhatsApp} leftIcon={MessageCircle}>Compartilhar no WhatsApp</PxButton>
                  </div>
                  {erroCopia && <p role="alert" className="text-[13px] text-px-danger">Não foi possível copiar. Selecione o link e copie manualmente.</p>}
                  <p className="text-center text-[12.5px] text-px-muted">
                    Código <span className="font-mono font-semibold text-px-accent">{afiliado.codigo_afiliado}</span>, {afiliado.comissao_percentual}% de comissão
                  </p>
                  {pendente && (
                    <p role="note" className="rounded-px-card bg-px-warn-soft px-4 py-3 text-[13px] leading-relaxed text-px-ink">
                      <span className="font-semibold">Código gerado, mas a comissão ainda não está ativa.</span>{" "}
                      Para receber comissões você precisa ter uma assinatura ativa no PRAXIS.{" "}
                      <a href="/planos" className="font-semibold text-px-accent underline">Escolher plano</a>
                    </p>
                  )}
                </>
              )}
            </Panel>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {numeros.map(n => (
                <Panel key={n.label} as="div" className="p-4">
                  <p className="text-[24px] font-medium leading-none tracking-[-0.02em] text-px-ink">{n.value}</p>
                  <p className="mt-2 text-[12.5px] text-px-muted">{n.label}</p>
                </Panel>
              ))}
            </div>

            <Panel as="section" className="overflow-hidden p-0">
              <h2 className="px-5 pb-3 pt-4 text-[15px] font-semibold text-px-ink">Seus indicados</h2>
              {indicacoes.length === 0 ? (
                <p className="px-5 pb-8 pt-2 text-center text-[13.5px] text-px-muted">Nenhum indicado ainda. Compartilhe seu link para começar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[440px] text-left">
                    <thead>
                      <tr className="border-y border-px-ink/10 text-[12px] font-medium text-px-muted">
                        <th scope="col" className="px-5 py-2.5 font-medium">E-mail</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Plano</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Situação</th>
                        <th scope="col" className="px-5 py-2.5 text-right font-medium">Comissão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-px-ink/10">
                      {indicacoes.map(ind => {
                        const st = STATUS_UI[ind.status] ?? STATUS_UI.pendente
                        return (
                          <tr key={ind.id}>
                            <td className="px-5 py-3 text-[13px] text-px-ink">{ind.indicado_email}</td>
                            <td className="px-3 py-3 text-[13px] text-px-muted">{ind.plano_assinado ?? "Sem plano"}</td>
                            <td className="px-3 py-3"><Tag tone={st.tone}>{st.label}</Tag></td>
                            <td className="px-5 py-3 text-right text-[13px] font-semibold text-px-ink">
                              {ind.valor_comissao ? brl(ind.valor_comissao) : "Sem comissão"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel as="section">
              <h2 className="mb-3 text-[15px] font-semibold text-px-ink">Como funciona</h2>
              <ol className="space-y-3">
                {PASSOS.map(p => (
                  <li key={p.n} className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-px-ink text-[12.5px] font-semibold text-white">{p.n}</span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-px-ink">{p.title}</p>
                      <p className="text-[13px] text-px-muted">{p.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
