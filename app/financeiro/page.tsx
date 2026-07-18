"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { SkeletonList } from "@/components/LoadingPulse"
import { ErrorState } from "@/components/ErrorState"
import { EmptyState } from "@/components/EmptyState"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import {
  TrendingUp, TrendingDown, DollarSign, Hash, PlusCircle,
  Trash2, Filter, X, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react"
import {
  BarChart as ReBarChart, Bar,
  XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lancamento {
  id:               string
  unidade:          string
  tipo:             "receita" | "despesa"
  descricao:        string
  valor:            number
  forma_pagamento?: string
  observacao?:      string
  data:             string
}

type TipoFilter = "todos" | "receita" | "despesa"

// ── Constants ──────────────────────────────────────────────────────────────────

const PALETTE = ["#00c07f", "#3b7fff", "#d4af37", "#a855f7", "#f97316", "#ef4444", "#06b6d4", "#ec4899"]

function unitColor(sortedUnits: string[], u: string): string {
  const idx = sortedUnits.indexOf(u)
  return idx >= 0 ? (PALETTE[idx % PALETTE.length] ?? "#888") : "#888"
}

const FORMAS = ["PIX", "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Transferência", "Convênio", "Boleto"]

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function fmtDate(s: string) {
  return s ? s.slice(0, 10).split("-").reverse().join("/") : "—"
}

function monthRange(year: number, month: number) {
  const pad   = (n: number) => String(n).padStart(2, "0")
  const last  = new Date(year, month + 1, 0).getDate()
  return {
    inicio: `${year}-${pad(month + 1)}-01`,
    fim:    `${year}-${pad(month + 1)}-${pad(last)}`,
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const now = new Date()

  const [currentYear,  setCurrentYear]  = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())

  const { inicio, fim } = monthRange(currentYear, currentMonth)

  const [unidade,     setUnidade]     = useState("Todas")
  const [tipoFilter,  setTipoFilter]  = useState<TipoFilter>("todos")
  const [viewAll,      setViewAll]     = useState(false)
  const [rawData,     setRawData]     = useState<Lancamento[]>([])
  const [loading,     setLoading]     = useState(false)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error,       setError]       = useState("")
  const [modalOpen,   setModalOpen]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [receitaAnt,  setReceitaAnt]  = useState<number | null>(null)
  const [loadingAnt,  setLoadingAnt]  = useState(false)

  const [form, setForm] = useState({
    unidade:         "",
    tipo:            "receita" as "receita" | "despesa",
    descricao:       "",
    valor:           "",
    forma_pagamento: "PIX",
    observacao:      "",
    data:            now.toISOString().slice(0, 10),
  })

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0) }
    else setCurrentMonth(m => m + 1)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setLoadingAnt(true)
    setError("")
    try {
      const params = new URLSearchParams(viewAll ? {} : { inicio, fim })
      const prevM  = currentMonth === 0 ? 11 : currentMonth - 1
      const prevY  = currentMonth === 0 ? currentYear - 1 : currentYear
      const { inicio: pInicio, fim: pFim } = monthRange(prevY, prevM)
      const [res, resAnt] = await Promise.all([
        fetch(`/api/financeiro?${params}`),
        viewAll ? Promise.resolve(null) : fetch(`/api/financeiro?inicio=${pInicio}&fim=${pFim}`),
      ])
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setRawData(Array.isArray(json) ? json : [])
      if (resAnt) {
        const jsonAnt = await resAnt.json()
        if (Array.isArray(jsonAnt)) {
          setReceitaAnt(
            jsonAnt.filter((l: Lancamento) => l.tipo === "receita").reduce((s: number, l: Lancamento) => s + l.valor, 0)
          )
        }
      } else {
        setReceitaAnt(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
      setLoadingAnt(false)
    }
  }, [inicio, fim, viewAll, currentMonth, currentYear])

  useEffect(() => { fetchData() }, [fetchData])

  // Unique units derived from all loaded data
  const unidades = Array.from(new Set(rawData.map(l => l.unidade).filter(Boolean))).sort()

  // Client-side filters
  const data = rawData
    .filter(l => unidade    === "Todas" || l.unidade === unidade)
    .filter(l => tipoFilter === "todos" || l.tipo    === tipoFilter)

  const salvar = async () => {
    if (!form.descricao || !form.valor) return
    setSaving(true)
    try {
      const res  = await fetch("/api/financeiro", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, valor: parseFloat(form.valor) }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setModalOpen(false)
      setForm(f => ({ ...f, descricao: "", valor: "", observacao: "" }))
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const excluir = async (id: string) => {
    setDeletingId(id)
    setConfirmDeleteId(null)
    try {
      const res  = await fetch(`/api/financeiro?id=${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setDeletingId(null)
    }
  }

  // KPIs
  const receitas   = data.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0)
  const despesas   = data.filter(l => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0)
  const saldo      = receitas - despesas
  const totalCount = data.length

  // Temporal analysis
  const isCurrentMonth  = !viewAll && currentYear === now.getFullYear() && currentMonth === now.getMonth()
  const hoje            = now.getDate()
  const diasNoMes       = new Date(currentYear, currentMonth + 1, 0).getDate()
  const projecao        = isCurrentMonth && hoje > 0 ? (receitas / hoje) * diasNoMes : null
  const varPct          = !viewAll && receitaAnt !== null && receitaAnt > 0
    ? ((receitas - receitaAnt) / receitaAnt) * 100
    : null

  const receitaSemanal = [0, 1, 2, 3, 4].flatMap(idx => {
    const weekStart = idx * 7 + 1
    const weekEnd   = Math.min((idx + 1) * 7, diasNoMes)
    if (weekStart > diasNoMes) return []
    const total = rawData
      .filter(l => {
        const d = new Date(l.data + "T12:00:00")
        return l.tipo === "receita"
          && d.getDate() >= weekStart && d.getDate() <= weekEnd
          && d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((s, l) => s + l.valor, 0)
    return [{ semana: `S${idx + 1}`, total }]
  })

  // Per-unit bar chart (unfiltered by tipo so bars show full picture)
  const porUnidade = unidades.map(u => {
    const rec  = rawData.filter(l => l.unidade === u && l.tipo === "receita").reduce((s, l) => s + l.valor, 0)
    const desp = rawData.filter(l => l.unidade === u && l.tipo === "despesa").reduce((s, l) => s + l.valor, 0)
    return { unidade: u, rec, desp, saldo: rec - desp }
  }).filter(u => u.rec > 0 || u.desp > 0)

  const maxVal = Math.max(...porUnidade.map(u => Math.max(u.rec, u.desp)), 1)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Financeiro por Unidade"
        subtitle="ALA CLÍNICA · SUPABASE"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Month selector */}
            <div className={cn(
              "flex items-center gap-1 bg-surface border border-border rounded-lg px-2 py-1.5",
              viewAll && "opacity-40 pointer-events-none"
            )}>
              <button onClick={prevMonth} className="text-text-muted hover:text-text-primary transition-colors p-0.5">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-text-secondary whitespace-nowrap text-center">
                {MESES[currentMonth]} {currentYear}
              </span>
              <button onClick={nextMonth} className="text-text-muted hover:text-text-primary transition-colors p-0.5">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setViewAll(v => !v)}
              className={cn(
                "text-[11px] font-medium rounded-lg px-3 py-1.5 border transition-colors",
                viewAll
                  ? "bg-accent-dim border-accent-border text-accent"
                  : "border-border text-text-muted hover:text-text-secondary"
              )}
            >
              Ver tudo
            </button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} leftIcon={PlusCircle}>
              Lançamento
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* KPI Cards */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-3",
          projecao !== null ? "lg:grid-cols-5" : "lg:grid-cols-4"
        )}>
          <StatCard label="Receitas"         value={fmt(receitas)} sub="no período"  icon={TrendingUp}   accent="green" />
          <StatCard label="Despesas"         value={fmt(despesas)} sub="no período"  icon={TrendingDown} accent="red"   />
          <StatCard label="Saldo do Período" value={fmt(saldo)}    sub="líquido"     icon={DollarSign}   accent={saldo >= 0 ? "green" : "red"} />
          <StatCard label="Lançamentos"      value={totalCount}    sub="no período"  icon={Hash}         accent="blue"  />
          {projecao !== null && (
            <StatCard
              label="Projeção do Mês"
              value={fmt(projecao)}
              sub={loadingAnt ? "calculando…" : "baseado no ritmo atual"}
              icon={TrendingUp}
              accent="blue"
            />
          )}
        </div>
        {varPct !== null && (
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-text-muted">vs. mês anterior:</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full border font-semibold",
              varPct >= 0
                ? "bg-accent-dim border-accent-border text-accent"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            )}>
              {varPct >= 0 ? "+" : ""}{varPct.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Receita semanal */}
        {!viewAll && receitaSemanal.some(s => s.total > 0) && (
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-3">
              Receita por Semana — {MESES[currentMonth]} {currentYear}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <ReBarChart data={receitaSemanal} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                  tickFormatter={(v: unknown) => {
                    const n = Number(v)
                    return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n)
                  }}
                />
                <ReTooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: unknown) => [fmt(Number(v)), "Receita"]}
                  labelStyle={{ color: "var(--text-secondary)" }}
                />
                <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tipo + unit filters */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tipo filter */}
            <div className="flex gap-1">
              {(["todos", "receita", "despesa"] as TipoFilter[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTipoFilter(t)}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full border transition-all capitalize",
                    tipoFilter === t
                      ? t === "receita"
                        ? "bg-accent-dim border-accent-border text-accent font-medium"
                        : t === "despesa"
                          ? "bg-red-500/10 border-red-500/30 text-red-400 font-medium"
                          : "bg-accent-dim border-accent-border text-accent font-medium"
                      : "border-border text-text-muted hover:text-text-secondary"
                  )}
                >
                  {t === "todos" ? "Todos" : t === "receita" ? "Receitas" : "Despesas"}
                </button>
              ))}
            </div>
          </div>

          {/* Unit pills */}
          {unidades.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
              {["Todas", ...unidades].map(u => (
                <button
                  key={u}
                  onClick={() => setUnidade(u)}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full border transition-all",
                    unidade === u
                      ? "bg-accent-dim border-accent-border text-accent font-medium"
                      : "border-border text-text-muted hover:text-text-secondary"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <ErrorState compact message={error} onRetry={fetchData} />
        )}

        {/* Bar chart por unidade */}
        {porUnidade.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-4">
              Desempenho por Unidade — {MESES[currentMonth]} {currentYear}
            </div>
            <div className="space-y-4">
              {porUnidade.map(u => (
                <div key={u.unidade}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: unitColor(unidades, u.unidade) }}
                      />
                      <span className="text-[11px] text-text-secondary">{u.unidade}</span>
                    </div>
                    <span className={cn("text-[11px] font-mono", u.saldo >= 0 ? "text-accent" : "text-red-400")}>
                      {fmt(u.saldo)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div
                      className="rounded-full transition-all"
                      style={{
                        width:      `${(u.rec / maxVal) * 100}%`,
                        background: unitColor(unidades, u.unidade),
                        opacity:    0.85,
                      }}
                    />
                    <div
                      className="bg-red-400/50 rounded-full transition-all"
                      style={{ width: `${(u.desp / maxVal) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] font-mono text-text-muted">Rec: {fmt(u.rec)}</span>
                    <span className="text-[9px] font-mono text-text-muted">Desp: {fmt(u.desp)}</span>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-accent" /> Receitas
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-red-400/50" /> Despesas
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              {data.length} lançamento{data.length !== 1 ? "s" : ""}
              {unidade    !== "Todas" && ` · ${unidade}`}
              {tipoFilter !== "todos" && ` · ${tipoFilter === "receita" ? "Receitas" : "Despesas"}`}
            </span>
            {loading && <Loader2 className="w-3.5 h-3.5 text-text-muted animate-spin" />}
          </div>

          {/* Column headers — hidden on small screens */}
          <div className="hidden md:grid grid-cols-[100px_160px_80px_1fr_140px_120px_40px] gap-4 px-5 py-2 border-b border-border">
            {["Data", "Unidade", "Tipo", "Descrição", "Forma de Pagamento", "Valor", ""].map(h => (
              <span key={h} className="text-[9px] font-mono text-text-muted uppercase tracking-widest">{h}</span>
            ))}
          </div>

          {loading && rawData.length === 0 ? (
            <SkeletonList rows={5} />
          ) : data.length === 0 && !loading ? (
            viewAll ? (
              <EmptyState
                icon={DollarSign}
                title="Nenhum lançamento registrado"
                subtitle="Registre sua primeira receita ou despesa para começar a acompanhar o financeiro da clínica."
                action={{ label: "Registrar lançamento", onClick: () => setModalOpen(true) }}
              />
            ) : (
              <div className="py-12 text-center text-[13px] text-text-muted">
                Nenhum lançamento em {MESES[currentMonth]}.{" "}
                <button onClick={() => setViewAll(true)} className="text-accent hover:underline">
                  Ver todos os períodos
                </button>
              </div>
            )
          ) : (
            <div className="divide-y divide-border">
              {data.map(l => (
                <div
                  key={l.id}
                  className="group px-4 py-3 hover:bg-surface-2 transition-colors"
                >
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={cn(
                          "text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider flex-shrink-0",
                          l.tipo === "receita"
                            ? "bg-accent-dim border-accent-border text-accent"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                        )}>
                          {l.tipo === "receita" ? "rec" : "desp"}
                        </span>
                        <span className="text-[12px] text-text-primary truncate">{l.descricao}</span>
                      </div>
                      <span className={cn(
                        "text-[13px] font-semibold font-mono flex-shrink-0",
                        l.tipo === "receita" ? "text-accent" : "text-red-400"
                      )}>
                        {l.tipo === "despesa" ? "−" : "+"}{fmt(l.valor)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: unitColor(unidades, l.unidade) }} />
                        <span className="text-[10px] text-text-muted">{l.unidade}</span>
                        <span className="text-text-muted/40">·</span>
                        <span className="text-[10px] text-text-muted">{fmtDate(l.data)}</span>
                      </div>
                      {confirmDeleteId === l.id ? (
                        <div className="flex gap-1 items-center">
                          <button onClick={() => excluir(l.id)} className="text-[10px] px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-semibold">Excluir</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] px-2 py-0.5 border border-border text-text-muted rounded-lg">Não</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(l.id)} disabled={deletingId === l.id}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-all">
                          {deletingId === l.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid md:grid-cols-[100px_160px_80px_1fr_140px_120px_auto] md:items-center md:gap-4">
                    <span className="text-[11px] font-mono text-text-secondary">{fmtDate(l.data)}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: unitColor(unidades, l.unidade) }} />
                      <span className="text-[11px] text-text-secondary truncate">{l.unidade}</span>
                    </div>
                    <span className={cn(
                      "text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider inline-block",
                      l.tipo === "receita"
                        ? "bg-accent-dim border-accent-border text-accent"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    )}>
                      {l.tipo}
                    </span>
                    <span className="text-[12px] text-text-primary truncate">{l.descricao}</span>
                    <span className="text-[11px] text-text-muted">{l.forma_pagamento ?? "—"}</span>
                    <span className={cn(
                      "text-[13px] font-semibold font-mono",
                      l.tipo === "receita" ? "text-accent" : "text-red-400"
                    )}>
                      {l.tipo === "despesa" ? "−" : "+"}{fmt(l.valor)}
                    </span>
                    <div className="flex justify-end">
                      {confirmDeleteId === l.id ? (
                        <div className="flex gap-1 items-center">
                          <button onClick={() => excluir(l.id)} className="text-[10px] px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-semibold hover:bg-red-500/20 transition-colors">Excluir</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] px-2 py-1 border border-border text-text-muted rounded-lg hover:text-text-secondary transition-colors">Não</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(l.id)} disabled={deletingId === l.id}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-all">
                          {deletingId === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <span
                className="text-[15px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Novo Lançamento
              </span>
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)} className="w-7 h-7 p-0 border-0 hover:bg-surface-2" aria-label="Fechar">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Tipo toggle */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["receita", "despesa"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={cn(
                        "py-2.5 rounded-xl text-[12px] font-semibold border transition-all",
                        form.tipo === t
                          ? t === "receita"
                            ? "bg-accent-dim border-accent-border text-accent"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                          : "border-border text-text-muted hover:border-border-hover"
                      )}
                    >
                      {t === "receita" ? "↑ Receita" : "↓ Despesa"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Unidade */}
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Unidade</label>
                  <input
                    list="unidades-datalist"
                    value={form.unidade}
                    onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}
                    placeholder="Nome da unidade"
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                  />
                  <datalist id="unidades-datalist">
                    {unidades.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>

                {/* Data */}
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Data</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40 transition-colors"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Descrição</label>
                <input
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Consulta particular"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Valor */}
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="0,00"
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors"
                  />
                </div>

                {/* Forma de pagamento */}
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Pagamento</label>
                  <select
                    value={form.forma_pagamento}
                    onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40 transition-colors"
                  >
                    {FORMAS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">Observação</label>
                <input
                  value={form.observacao}
                  onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                  placeholder="Opcional"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-[12px] text-text-muted border border-border hover:border-border-hover hover:text-text-secondary transition-all text-center"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={saving || !form.descricao || !form.valor}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent text-background text-[12px] font-semibold rounded-xl px-5 py-2.5 sm:py-2 hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                Salvar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
