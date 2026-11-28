"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink, RefreshCw } from "lucide-react"
import { Field, Panel, PxButton, PxInput, PxModal, PxSelect, Segmented, Tag, PageHeader } from "@/components/px"

type Status = "aguardando_pagamento" | "pendente" | "aprovado" | "rejeitado" | "expirado"

interface Anuncio {
  id: string
  created_at: string
  titulo: string
  chamada: string
  link_destino: string
  anunciante_nome: string
  anunciante_foto_url: string | null
  contato_email: string
  contato_telefone: string | null
  periodo_dias: number
  data_inicio: string | null
  data_fim: string | null
  status: Status
  tipo_produto: string | null
}

type Filtro = "pendente" | "aprovado" | "inativos" | "all"

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "pendente", label: "Em revisão" },
  { value: "aprovado", label: "Aprovados" },
  { value: "inativos", label: "Inativos" },
  { value: "all",      label: "Todos" },
]
const FILTRO_STATUS: Record<Filtro, string> = {
  pendente: "pendente,aguardando_pagamento",
  aprovado: "aprovado",
  inativos: "expirado,rejeitado",
  all:      "all",
}
const TIPOS = [
  { value: "",            label: "Todos os tipos" },
  { value: "curso",       label: "Curso" },
  { value: "livro",       label: "Livro" },
  { value: "equipamento", label: "Equipamento" },
  { value: "suplemento",  label: "Suplemento" },
  { value: "mentoria",    label: "Mentoria" },
  { value: "ferramenta",  label: "Ferramenta" },
]
const STATUS_LABEL: Record<Status, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pendente:             "Pago, em revisão",
  aprovado:             "Aprovado",
  rejeitado:            "Rejeitado",
  expirado:             "Expirado",
}
const STATUS_TOM: Record<Status, "neutral" | "ok" | "warn" | "danger"> = {
  aguardando_pagamento: "neutral", pendente: "warn", aprovado: "ok", rejeitado: "danger", expirado: "neutral",
}

function linkSeguro(url: string): string | null {
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : null
}

function dia(iso: string | null) {
  if (!iso) return "-"
  const [a, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${a}`
}

type Acao = { tipo: "rejeitar" | "excluir"; anuncio: Anuncio } | null

export default function AdminAnunciosPage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loading, setLoading] = useState(true)
  const [erroCarga, setErroCarga] = useState("")
  const [filtro, setFiltro] = useState<Filtro>("pendente")
  const [tipo, setTipo] = useState("")
  const [ocupado, setOcupado] = useState<string[]>([])
  const [aprovando, setAprovando] = useState<Record<string, { inicio: string; fim: string }>>({})
  const [erroAcao, setErroAcao] = useState<Record<string, string>>({})
  const [acao, setAcao] = useState<Acao>(null)
  const [erroModal, setErroModal] = useState("")

  const carregar = useCallback(async () => {
    setLoading(true); setErroCarga("")
    try {
      const qs = new URLSearchParams({ status: FILTRO_STATUS[filtro] })
      if (tipo) qs.set("tipo", tipo)
      const r = await fetch("/api/admin/anuncios?" + qs.toString())
      if (r.status === 403) { setErroCarga("Esta área é restrita ao administrador."); setAnuncios([]); return }
      const data = await r.json().catch(() => null)
      if (!r.ok || !Array.isArray(data)) throw new Error("HTTP " + r.status)
      setAnuncios(data as Anuncio[])
    } catch (e) {
      console.error("[admin/anuncios] erro ao carregar:", e)
      setErroCarga("Não foi possível carregar os anúncios."); setAnuncios([])
    } finally {
      setLoading(false)
    }
  }, [filtro, tipo])

  useEffect(() => { carregar() }, [carregar])

  const marcar = (id: string, on: boolean) => setOcupado(o => on ? [...o, id] : o.filter(x => x !== id))
  const tirar = (id: string) => setAnuncios(a => a.filter(x => x.id !== id))

  function iniciarAprovacao(a: Anuncio) {
    const ini = new Date(); const fim = new Date(); fim.setDate(ini.getDate() + a.periodo_dias)
    setErroAcao(e => ({ ...e, [a.id]: "" }))
    setAprovando(p => ({ ...p, [a.id]: { inicio: ini.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) } }))
  }

  async function confirmarAprovacao(a: Anuncio) {
    const d = aprovando[a.id]
    if (!d?.inicio || !d?.fim) { setErroAcao(e => ({ ...e, [a.id]: "Informe início e fim da veiculação." })); return }
    if (d.fim < d.inicio) { setErroAcao(e => ({ ...e, [a.id]: "A data final não pode ser anterior à inicial." })); return }
    marcar(a.id, true); setErroAcao(e => ({ ...e, [a.id]: "" }))
    try {
      const r = await fetch("/api/admin/anuncios", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, status: "aprovado", data_inicio: d.inicio, data_fim: d.fim }),
      })
      const data = await r.json().catch(() => null) as { error?: string } | null
      if (!r.ok) { setErroAcao(e => ({ ...e, [a.id]: data?.error ?? "Não foi possível aprovar." })); return }
      tirar(a.id)
      setAprovando(p => { const n = { ...p }; delete n[a.id]; return n })
    } catch (e) {
      console.error("[admin/anuncios] aprovar:", e)
      setErroAcao(er => ({ ...er, [a.id]: "Erro de conexão. Tente novamente." }))
    } finally { marcar(a.id, false) }
  }

  async function executarAcao() {
    if (!acao) return
    const { tipo: t, anuncio: a } = acao
    marcar(a.id, true); setErroModal("")
    try {
      const r = t === "rejeitar"
        ? await fetch("/api/admin/anuncios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, status: "rejeitado" }) })
        : await fetch("/api/admin/anuncios?id=" + encodeURIComponent(a.id), { method: "DELETE" })
      const data = await r.json().catch(() => null) as { error?: string } | null
      if (!r.ok) { setErroModal(data?.error ?? "Não foi possível concluir."); return }
      tirar(a.id); setAcao(null)
    } catch (e) {
      console.error("[admin/anuncios] ação:", e)
      setErroModal("Erro de conexão. Tente novamente.")
    } finally { marcar(a.id, false) }
  }

  const emAcao = !!acao && ocupado.includes(acao.anuncio.id)
  const fecharModal = () => { if (!emAcao) { setAcao(null); setErroModal("") } }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Anúncios do marketplace"
        caption="Revise os anúncios pagos antes de entrarem no ar"
        actions={<PxButton variant="secondary" size="sm" leftIcon={RefreshCw} onClick={carregar} loading={loading}>Atualizar</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Situação dos anúncios" value={filtro} onChange={setFiltro} options={FILTROS} />
          <div className="w-48">
            <PxSelect aria-label="Tipo de produto" value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </PxSelect>
          </div>
        </div>

        {erroCarga && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erroCarga}</p>}

        {loading && !erroCarga ? <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando anúncios</p>
          : !erroCarga && anuncios.length === 0 ? <Panel className="py-12 text-center text-[13.5px] text-px-muted">{filtro === "pendente" ? "Nenhum anúncio em revisão ou aguardando pagamento." : "Nenhum anúncio encontrado."}</Panel>
          : !erroCarga && (
            <ul className="space-y-3">
              {anuncios.map(an => {
                const link = linkSeguro(an.link_destino)
                const aprov = aprovando[an.id]
                const busy = ocupado.includes(an.id)
                return (
                  <li key={an.id}>
                    <Panel as="article" className="space-y-3">
                      <div className="flex items-start gap-3">
                        {an.anunciante_foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={an.anunciante_foto_url} alt="" className="h-10 w-10 shrink-0 rounded-full border border-px-line object-cover" />
                        ) : (
                          <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-px-line bg-white text-[13px] font-semibold text-px-muted">
                            {an.anunciante_nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-[14.5px] font-semibold text-px-ink">{an.anunciante_nome}</h2>
                            <Tag tone={STATUS_TOM[an.status]}>{STATUS_LABEL[an.status]}</Tag>
                            {an.tipo_produto && <Tag tone="neutral">{TIPOS.find(t => t.value === an.tipo_produto)?.label ?? an.tipo_produto}</Tag>}
                          </div>
                          <p className="mt-1 flex flex-wrap gap-x-3 text-[12.5px] text-px-muted">
                            <a href={"mailto:" + an.contato_email} className="underline underline-offset-2">{an.contato_email}</a>
                            {an.contato_telefone && <span>{an.contato_telefone}</span>}
                            <span>Enviado em {new Date(an.created_at).toLocaleDateString("pt-BR")}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 rounded-px-card bg-white/70 p-3">
                        <p className="text-[14px] font-medium text-px-ink">{an.titulo}</p>
                        <p className="text-[13px] leading-relaxed text-px-ink">{an.chamada}</p>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1 text-[12.5px] text-px-accent underline underline-offset-2">
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{an.link_destino}</span>
                          </a>
                        ) : (
                          <p className="break-all text-[12.5px] text-px-danger">Link inválido (não começa com http): {an.link_destino}</p>
                        )}
                      </div>

                      <p className="text-[12.5px] text-px-muted">
                        Período contratado: {an.periodo_dias} dias
                        {an.data_inicio && an.data_fim ? `. No ar de ${dia(an.data_inicio)} a ${dia(an.data_fim)}.` : "."}
                      </p>

                      {aprov && (
                        <div className="space-y-3 rounded-px-card border border-px-line bg-white/70 p-3">
                          <p className="text-[13px] font-medium text-px-ink">Período de veiculação</p>
                          <div className="flex flex-wrap gap-3">
                            <Field label="Início" htmlFor={"ini-" + an.id}>
                              <PxInput id={"ini-" + an.id} type="date" value={aprov.inicio} onChange={e => setAprovando(p => ({ ...p, [an.id]: { ...p[an.id], inicio: e.target.value } }))} />
                            </Field>
                            <Field label="Fim" htmlFor={"fim-" + an.id}>
                              <PxInput id={"fim-" + an.id} type="date" value={aprov.fim} onChange={e => setAprovando(p => ({ ...p, [an.id]: { ...p[an.id], fim: e.target.value } }))} />
                            </Field>
                          </div>
                          <div className="flex gap-2">
                            <PxButton size="sm" onClick={() => confirmarAprovacao(an)} loading={busy}>Confirmar aprovação</PxButton>
                            <PxButton size="sm" variant="quiet" disabled={busy} onClick={() => setAprovando(p => { const n = { ...p }; delete n[an.id]; return n })}>Voltar</PxButton>
                          </div>
                        </div>
                      )}

                      {erroAcao[an.id] && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erroAcao[an.id]}</p>}

                      <div className="flex flex-wrap gap-2">
                        {an.status === "pendente" && !aprov && <PxButton size="sm" onClick={() => iniciarAprovacao(an)} disabled={busy}>Aprovar</PxButton>}
                        {(an.status === "pendente" || an.status === "aguardando_pagamento") && <PxButton size="sm" variant="secondary" disabled={busy} onClick={() => { setErroModal(""); setAcao({ tipo: "rejeitar", anuncio: an }) }}>Rejeitar</PxButton>}
                        {an.status !== "pendente" && <PxButton size="sm" variant="danger" disabled={busy} onClick={() => { setErroModal(""); setAcao({ tipo: "excluir", anuncio: an }) }}>Excluir</PxButton>}
                      </div>
                    </Panel>
                  </li>
                )
              })}
            </ul>
          )}
      </div>

      <PxModal open={!!acao} onClose={fecharModal} title={acao?.tipo === "rejeitar" ? "Rejeitar anúncio" : "Excluir anúncio"}>
        {acao && (
          <div className="space-y-4">
            <p className="text-[13.5px] leading-relaxed text-px-ink">
              {acao.tipo === "rejeitar"
                ? acao.anuncio.status === "pendente"
                  ? `O anúncio "${acao.anuncio.titulo}" será rejeitado e o pagamento, estornado por completo no Stripe.`
                  : `O anúncio "${acao.anuncio.titulo}" ainda não foi pago e será rejeitado sem estorno.`
                : `O anúncio "${acao.anuncio.titulo}" será excluído de vez. A exclusão não estorna pagamento.`}
            </p>
            {erroModal && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erroModal}</p>}
            <div className="flex justify-end gap-2">
              <PxButton variant="quiet" onClick={fecharModal} disabled={emAcao}>Voltar</PxButton>
              <PxButton variant="danger" onClick={executarAcao} loading={emAcao}>{acao.tipo === "rejeitar" ? "Rejeitar" : "Excluir"}</PxButton>
            </div>
          </div>
        )}
      </PxModal>
    </div>
  )
}
