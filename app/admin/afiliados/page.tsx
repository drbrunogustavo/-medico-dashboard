"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"

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
  user_id:                  string
  nome:                     string | null
  especialidade:            string | null
  codigo_afiliado:          string
  comissao_percentual:      number
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
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

function brl(val: number | null) {
  if (!val) return "R$ 0,00"
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4">
      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[22px] font-semibold text-text-primary">{value}</div>
    </div>
  )
}

export default function AfiliadosAdminPage() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>([])
  const [totals,    setTotals]    = useState<Totals | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set())

  async function fetchData() {
    setLoading(true)
    try {
      const r    = await fetch("/api/admin/afiliados")
      const data = await r.json()
      setAfiliados(Array.isArray(data.afiliados) ? data.afiliados : [])
      setTotals(data.totals ?? null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Afiliados"
        subtitle="ADMIN · PRAXIS INTERNAL"
        tagline="Acompanhe indicações, conversões e comissões do programa de afiliados."
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

        {/* Stat cards */}
        {totals && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatBox label="Afiliados"    value={totals.total_afiliados} />
            <StatBox label="Indicações"   value={totals.total_indicacoes} />
            <StatBox label="Convertidas"  value={totals.total_convertidos} />
            <StatBox label="Pendentes"    value={totals.total_pendentes} />
            <StatBox label="Comissão paga" value={brl(totals.total_comissao)} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
          </div>
        ) : afiliados.length === 0 ? (
          <div className="text-center py-20 text-[13px] text-text-muted">
            Nenhum afiliado cadastrado ainda.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-x-4 items-center px-4 py-2.5 border-b border-border bg-background/40 min-w-[760px]">
              {["Afiliado", "Código", "Status", "Indicados", "Convertidos", "Pendentes", "Comissão", ""].map(h => (
                <div key={h} className="text-[10px] font-mono text-text-muted uppercase tracking-wider whitespace-nowrap">
                  {h}
                </div>
              ))}
            </div>

            <div className="min-w-[760px]">
              {afiliados.map((a, i) => {
                const isOpen = expanded.has(a.id)
                const isLast = i === afiliados.length - 1
                const taxa = a.total_indicados > 0
                  ? Math.round((a.convertidos / a.total_indicados) * 100)
                  : 0

                return (
                  <div key={a.id} className={cn(!isLast && "border-b border-border/50")}>
                    {/* Main row */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-x-4 items-center px-4 py-3 hover:bg-background/50 transition-colors">
                      {/* Afiliado */}
                      <div>
                        <div className="text-[12px] font-medium text-text-primary truncate max-w-[160px]">
                          {a.nome ?? <span className="italic text-text-muted">Sem nome</span>}
                        </div>
                        {a.especialidade && (
                          <div className="text-[10px] text-text-muted truncate max-w-[160px]">{a.especialidade}</div>
                        )}
                      </div>

                      {/* Código */}
                      <div className="font-mono text-[11px] text-accent bg-accent-dim border border-accent-border rounded px-2 py-0.5 whitespace-nowrap">
                        {a.codigo_afiliado}
                      </div>

                      {/* Status */}
                      <div>
                        <span className={cn(
                          "text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border whitespace-nowrap",
                          a.status === "ativo"
                            ? "bg-accent-dim border-accent-border text-accent"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        )}>
                          {a.status === "ativo" ? "Ativo" : "Pendente"}
                        </span>
                      </div>

                      {/* Indicados */}
                      <div className="text-[12px] text-text-secondary text-center">{a.total_indicados}</div>

                      {/* Convertidos */}
                      <div className="text-center">
                        <div className="text-[12px] text-text-secondary">{a.convertidos}</div>
                        {a.total_indicados > 0 && (
                          <div className="text-[9px] text-text-muted font-mono">{taxa}%</div>
                        )}
                      </div>

                      {/* Pendentes */}
                      <div className="text-center">
                        {a.pendentes > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400">
                            <AlertTriangle className="w-3 h-3" /> {a.pendentes}
                          </span>
                        ) : (
                          <span className="text-[12px] text-text-muted">0</span>
                        )}
                      </div>

                      {/* Comissão */}
                      <div className="text-[12px] font-mono text-accent whitespace-nowrap">
                        {brl(a.total_comissao_acumulada)}
                      </div>

                      {/* Expandir */}
                      <button
                        onClick={() => toggleExpand(a.id)}
                        disabled={a.indicacoes.length === 0}
                        className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 transition-all"
                        title={a.indicacoes.length === 0 ? "Sem indicações" : isOpen ? "Fechar" : "Ver indicações"}
                      >
                        {isOpen
                          ? <ChevronDown className="w-3.5 h-3.5" />
                          : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expanded indicacoes */}
                    {isOpen && a.indicacoes.length > 0 && (
                      <div className="bg-background/60 border-t border-border/50 px-4 py-3 space-y-1.5">
                        <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
                          Indicações ({a.indicacoes.length})
                        </div>
                        {a.indicacoes.map((ind, j) => (
                          <div key={j} className="flex items-center gap-4 text-[11px]">
                            <span className={cn(
                              "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0",
                              ind.status === "aplicada"
                                ? "bg-accent-dim border-accent-border text-accent"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            )}>
                              {ind.status === "aplicada" ? "PAGO" : "PEND"}
                            </span>
                            <span className="font-mono text-text-secondary truncate max-w-[200px]">
                              {ind.indicado_email ?? "—"}
                            </span>
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0",
                              ind.origem === "manual"
                                ? "border-blue-500/25 text-blue-400 bg-blue-500/10"
                                : "border-border text-text-muted"
                            )}>
                              {ind.origem === "manual" ? "manual" : "link"}
                            </span>
                            {ind.valor_comissao && (
                              <span className="font-mono text-accent flex-shrink-0">{brl(ind.valor_comissao)}</span>
                            )}
                            <span className="text-text-muted font-mono flex-shrink-0 ml-auto">
                              {ind.status === "aplicada" ? fmt(ind.aplicado_em) : fmt(ind.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
