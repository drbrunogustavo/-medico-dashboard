"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { RefreshCw } from "lucide-react"
import { Panel, PxButton, PageHeader } from "@/components/px"

interface Resumo {
  mrr:                number
  arr:                number
  total_registros:    number
  cobrados:           number
  em_trial:           number
  past_due:           number
  cancelados:         number
  renovando_em_breve: number
}

interface BreakdownItem {
  plano:      string
  count:      number
  preco_unit: number
  subtotal:   number
}

interface Data {
  resumo:    Resumo
  breakdown: BreakdownItem[]
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function Numero({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Panel className="space-y-0.5">
      <div className="text-[12.5px] text-px-muted">{label}</div>
      <div className="text-[24px] font-semibold leading-tight text-px-ink">{value}</div>
      {hint && <div className="text-[12px] text-px-muted">{hint}</div>}
    </Panel>
  )
}

export default function FinanceiroAdminPage() {
  const [data,    setData]    = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro,    setErro]    = useState("")

  const carregar = useCallback(async () => {
    setLoading(true); setErro("")
    try {
      const r = await fetch("/api/admin/financeiro")
      if (r.status === 403) { setErro("Esta área é restrita ao administrador."); setData(null); return }
      const d = await r.json().catch(() => null) as Data | null
      if (!r.ok || !d?.resumo || !Array.isArray(d.breakdown)) throw new Error("HTTP " + r.status)
      setData(d)
    } catch (e) {
      console.error("[admin/financeiro] erro ao carregar:", e)
      setErro("Não foi possível carregar os números."); setData(null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const r = data?.resumo

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Financeiro"
        caption="Receita recorrente estimada e assinaturas que pedem atenção"
        actions={<PxButton variant="secondary" size="sm" leftIcon={RefreshCw} onClick={carregar} loading={loading}>Atualizar</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel className="text-[13px] leading-relaxed text-px-muted">
          É uma estimativa. Cada assinatura entra pelo preço de tabela do plano, e conta como cobrada quem tem um preço do Stripe vinculado.
          O valor realmente cobrado, com cupons, descontos e créditos de afiliado, não é consultado. Os preços de tabela estão fixos no código e
          precisam ser atualizados lá quando os planos mudarem. Quem ainda está em trial ou foi liberado manualmente não entra na receita.
        </Panel>

        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}

        {loading && !erro ? <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando números</p>
          : r && data && (
            <>
              {r.past_due > 0 && (
                <p role="status" className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[13px] text-px-warn">
                  {r.past_due} assinatura{r.past_due > 1 ? "s" : ""} com pagamento vencido.{" "}
                  <Link href="/admin/assinantes" className="font-medium underline underline-offset-2">Ver em Assinantes</Link>
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Numero label="Receita mensal estimada" value={brl(r.mrr)} hint="Assinaturas cobradas" />
                <Numero label="Receita anual projetada" value={brl(r.arr)} hint="Receita mensal vezes 12" />
                <Numero label="Assinaturas cobradas" value={String(r.cobrados)} hint={`De ${r.total_registros} registros`} />
                <Numero label="Em trial ou manual" value={String(r.em_trial)} hint="Fora da receita" />
              </div>

              <Panel className="overflow-hidden p-0">
                <h2 className="border-b border-px-line px-5 py-3 text-[14px] font-semibold text-px-ink">Receita por plano</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-px-line text-[12px] text-px-muted">
                        <th scope="col" className="px-5 py-2.5 font-medium">Plano</th>
                        <th scope="col" className="px-5 py-2.5 text-right font-medium">Assinantes</th>
                        <th scope="col" className="px-5 py-2.5 text-right font-medium">Preço por mês</th>
                        <th scope="col" className="px-5 py-2.5 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.breakdown.length === 0 ? (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-px-muted">Nenhuma assinatura cobrada ainda.</td></tr>
                      ) : data.breakdown.map(b => (
                        <tr key={b.plano} className="border-b border-px-line/60">
                          <td className="px-5 py-3 font-medium text-px-ink">{b.plano}</td>
                          <td className="px-5 py-3 text-right tabular-nums text-px-ink">{b.count}</td>
                          <td className="px-5 py-3 text-right tabular-nums text-px-muted">{brl(b.preco_unit)}</td>
                          <td className="px-5 py-3 text-right tabular-nums font-medium text-px-ink">{brl(b.subtotal)}</td>
                        </tr>
                      ))}
                      <tr>
                        <th scope="row" colSpan={3} className="px-5 py-3 text-left font-medium text-px-ink">Total</th>
                        <td className="px-5 py-3 text-right text-[15px] font-semibold tabular-nums text-px-ink">{brl(r.mrr)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Panel>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Numero label="Pagamento vencido" value={String(r.past_due)} />
                <Numero label="Cancelados" value={String(r.cancelados)} />
                <Numero label="Renovam em até 30 dias" value={String(r.renovando_em_breve)} hint="Assinaturas cobradas" />
              </div>
            </>
          )}
      </div>
    </div>
  )
}
