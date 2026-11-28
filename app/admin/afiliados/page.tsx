"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react"
import { Panel, PxButton, Tag, PageHeader } from "@/components/px"

interface Indicacao {
  indicado_email: string | null
  status:         "pendente" | "aplicada"
  valor_comissao: number | null
  aplicado_em:    string | null
  created_at:     string
  origem:         "manual" | "automatica"
}

interface Afiliado {
  id:                       string
  nome:                     string | null
  especialidade:            string | null
  codigo_afiliado:          string
  status:                   "ativo" | "pendente"
  total_indicados:          number
  total_comissao_acumulada: number
  convertidos:              number
  pendentes:                number
  indicacoes:               Indicacao[]
}

interface Totals {
  total_afiliados:   number
  total_indicacoes:  number
  total_convertidos: number
  total_pendentes:   number
  total_comissao:    number
}

function fmt(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

function brl(val: number | null) {
  return (val ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function Numero({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Panel className="space-y-0.5">
      <div className="text-[12.5px] text-px-muted">{label}</div>
      <div className="text-[24px] font-semibold leading-tight text-px-ink">{value}</div>
      {hint && <div className="text-[12px] text-px-muted">{hint}</div>}
    </Panel>
  )
}

export default function AfiliadosAdminPage() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>([])
  const [totals,    setTotals]    = useState<Totals | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [erro,      setErro]      = useState("")
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set())

  const carregar = useCallback(async () => {
    setLoading(true); setErro("")
    try {
      const r = await fetch("/api/admin/afiliados")
      if (r.status === 403) { setErro("Esta área é restrita ao administrador."); return }
      const data = await r.json().catch(() => null) as { afiliados?: Afiliado[]; totals?: Totals } | null
      if (!r.ok || !data || !Array.isArray(data.afiliados)) throw new Error("HTTP " + r.status)
      setAfiliados(data.afiliados)
      setTotals(data.totals ?? null)
    } catch (e) {
      console.error("[admin/afiliados] erro ao carregar:", e)
      setErro("Não foi possível carregar os afiliados.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function alternar(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Afiliados"
        caption="Indicações, conversões e crédito de comissão de cada afiliado"
        actions={<PxButton variant="secondary" size="sm" leftIcon={RefreshCw} onClick={carregar} loading={loading}>Atualizar</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}

        {totals && !erro && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Numero label="Afiliados" value={totals.total_afiliados} />
            <Numero label="Indicações" value={totals.total_indicacoes} />
            <Numero label="Com crédito aplicado" value={totals.total_convertidos} hint="Primeira fatura paga" />
            <Numero label="Aguardando fatura" value={totals.total_pendentes} />
            <Numero label="Crédito acumulado" value={brl(totals.total_comissao)} hint="Saldo creditado no Stripe" />
          </div>
        )}

        {loading && !erro ? <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando afiliados</p>
          : !erro && afiliados.length === 0 ? <Panel className="py-12 text-center text-[13.5px] text-px-muted">Nenhum afiliado cadastrado ainda.</Panel>
          : !erro && (
            <Panel className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-px-line text-[12px] text-px-muted">
                      <th scope="col" className="px-4 py-2.5 font-medium">Afiliado</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Código</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Situação</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Indicados</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Convertidos</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Aguardando</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-medium">Crédito</th>
                      <th scope="col" className="px-3 py-2.5"><span className="sr-only">Indicações</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {afiliados.map(a => {
                      const aberto = expanded.has(a.id)
                      return (
                        <Fragment key={a.id}>
                          <tr className="border-b border-px-line/60 align-top">
                            <td className="px-4 py-3">
                              <div className="font-medium text-px-ink">{a.nome ?? "Sem nome"}</div>
                              {a.especialidade && <div className="text-[12px] text-px-muted">{a.especialidade}</div>}
                            </td>
                            <td className="px-3 py-3 font-mono text-[12px] text-px-ink">{a.codigo_afiliado}</td>
                            <td className="px-3 py-3"><Tag tone={a.status === "ativo" ? "ok" : "warn"}>{a.status === "ativo" ? "Ativo" : "Pendente"}</Tag></td>
                            <td className="px-3 py-3 text-right tabular-nums text-px-ink">{a.total_indicados}</td>
                            <td className="px-3 py-3 text-right tabular-nums text-px-ink">
                              {a.convertidos}
                              {a.total_indicados > 0 && <span className="ml-1 text-[12px] text-px-muted">({Math.round((a.convertidos / a.total_indicados) * 100)}%)</span>}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums text-px-ink">{a.pendentes}</td>
                            <td className="px-3 py-3 text-right tabular-nums font-medium text-px-ink">{brl(a.total_comissao_acumulada)}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => alternar(a.id)}
                                disabled={a.indicacoes.length === 0}
                                aria-expanded={aberto}
                                aria-label={(aberto ? "Ocultar" : "Ver") + " indicações de " + (a.nome ?? a.codigo_afiliado)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-px-ctl text-px-muted hover:bg-white/60 hover:text-px-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 disabled:opacity-30"
                              >
                                {aberto ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
                              </button>
                            </td>
                          </tr>
                          {aberto && (
                            <tr className="border-b border-px-line/60 bg-white/40">
                              <td colSpan={8} className="px-4 py-3">
                                <ul className="space-y-2">
                                  {a.indicacoes.map((ind, j) => (
                                    <li key={j} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                                      <Tag tone={ind.status === "aplicada" ? "ok" : "warn"}>{ind.status === "aplicada" ? "Crédito aplicado" : "Aguardando fatura"}</Tag>
                                      <span className="min-w-0 break-all text-px-ink">{ind.indicado_email ?? "E-mail não informado"}</span>
                                      <Tag tone="neutral">{ind.origem === "manual" ? "Manual" : "Link"}</Tag>
                                      {ind.valor_comissao ? <span className="tabular-nums text-px-ink">{brl(ind.valor_comissao)}</span> : null}
                                      <span className="ml-auto tabular-nums text-px-muted">{ind.status === "aplicada" ? fmt(ind.aplicado_em) : fmt(ind.created_at)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
      </div>
    </div>
  )
}
