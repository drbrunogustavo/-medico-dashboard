"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, AlertTriangle, Info } from "lucide-react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"

interface Resumo {
  mrr:               number
  arr:               number
  total_registros:   number
  cobrados:          number
  em_trial:          number
  past_due:          number
  cancelados:        number
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

function StatCard({
  label, value, sub, accent, warn,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div className={cn(
      "bg-card border rounded-xl px-5 py-4",
      accent ? "border-accent/30 bg-accent-dim/40" : warn ? "border-amber-500/25 bg-amber-500/5" : "border-border"
    )}>
      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={cn(
        "text-[22px] font-semibold",
        accent ? "text-accent" : warn ? "text-amber-400" : "text-text-primary"
      )}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

export default function FinanceiroAdminPage() {
  const [data,    setData]    = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [err,     setErr]     = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch("/api/admin/financeiro")
      const d = await r.json() as Data & { error?: string }
      if (d.error) throw new Error(d.error)
      setData(d)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const r = data?.resumo

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Financeiro"
        subtitle="ADMIN · PRAXIS INTERNAL"
        actions={
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[12px] text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-6">

        {/* Disclaimer */}
        <div className="flex items-start gap-2.5 text-[11px] text-text-muted bg-card border border-border rounded-lg px-4 py-3">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-text-muted" />
          <span>
            MRR calculado apenas sobre assinaturas cobradas (com <code className="font-mono">stripe_price_id</code>).
            Trials gratuitos não entram na receita. Preços hardcoded — atualizar em{" "}
            <code className="font-mono">app/api/admin/financeiro/route.ts</code> se mudarem.
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
          </div>
        ) : err ? (
          <div className="text-center py-20 text-red-400 text-[13px]">{err}</div>
        ) : r && data && (
          <>
            {/* Alerta past_due */}
            {r.past_due > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-3 text-[12px] text-amber-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {r.past_due} assinatura{r.past_due > 1 ? "s" : ""} com pagamento vencido (past_due) — verifique na tela de Assinantes.
              </div>
            )}

            {/* Cards principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="MRR Estimado"
                value={brl(r.mrr)}
                sub="assinaturas cobradas"
                accent
              />
              <StatCard
                label="ARR Projetado"
                value={brl(r.arr)}
                sub="MRR × 12 meses"
              />
              <StatCard
                label="Cobrados"
                value={String(r.cobrados)}
                sub={`de ${r.total_registros} registros`}
              />
              <StatCard
                label="Em Trial"
                value={String(r.em_trial)}
                sub="não contados no MRR"
              />
            </div>

            {/* Breakdown por plano */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Receita por plano — apenas cobrados
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] min-w-[420px]">
                  <thead>
                    <tr className="border-b border-border/60">
                      {["Plano", "Assinantes", "Preço unit.", "Subtotal MRR"].map(h => (
                        <th
                          key={h}
                          className={cn(
                            "px-5 py-2.5 text-[10px] font-mono text-text-muted uppercase tracking-wider",
                            h === "Plano" ? "text-left" : "text-right"
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.breakdown.map((b, i) => (
                      <tr
                        key={b.plano}
                        className={cn(
                          "border-b border-border/40 hover:bg-background/40 transition-colors",
                          i === data.breakdown.length - 1 && "border-b-0"
                        )}
                      >
                        <td className="px-5 py-3 font-medium text-text-primary">{b.plano}</td>
                        <td className="px-5 py-3 text-right text-text-secondary">{b.count}</td>
                        <td className="px-5 py-3 text-right font-mono text-text-muted">{brl(b.preco_unit)}</td>
                        <td className="px-5 py-3 text-right font-mono text-accent font-semibold">{brl(b.subtotal)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-border bg-background/40">
                      <td colSpan={3} className="px-5 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">
                        Total MRR
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-accent font-bold text-[15px]">
                        {brl(r.mrr)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status e alertas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Cobrados ativos" value={String(r.cobrados)}  />
              <StatCard label="Em trial"         value={String(r.em_trial)} sub="não cobrados" />
              <StatCard label="Vencidos"         value={String(r.past_due)}   warn={r.past_due > 0} />
              <StatCard label="Renovando em 30d" value={String(r.renovando_em_breve)} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
