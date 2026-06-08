"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { cn } from "@/lib/utils"
import {
  TrendingUp, TrendingDown, DollarSign, PlusCircle,
  Trash2, Filter, X, Loader2,
} from "lucide-react"

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

// ── Constants ──────────────────────────────────────────────────────────────────

const GRUPOS = {
  consolidado: ["Poços de Caldas", "Alfenas", "São Paulo", "Balneário Camboriú", "Itapema"],
  g1:          ["Poços de Caldas", "Alfenas", "São Paulo"],
  g2:          ["Balneário Camboriú", "Itapema"],
} as const

type Grupo = keyof typeof GRUPOS

const GRUPO_LABELS: Record<Grupo, string> = {
  consolidado: "Consolidado",
  g1:          "Grupo 1",
  g2:          "Grupo 2",
}

const FORMAS = ["Dinheiro", "PIX", "Cartão de Débito", "Cartão de Crédito", "Transferência", "Convênio"]

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function fmtDate(s: string) {
  return s ? s.slice(0, 10).split("-").reverse().join("/") : "—"
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const today    = new Date().toISOString().slice(0, 10)
  const firstDay = today.slice(0, 7) + "-01"

  const [grupo,   setGrupo]   = useState<Grupo>("consolidado")
  const [unidade, setUnidade] = useState("Todas")
  const [inicio,  setInicio]  = useState(firstDay)
  const [fim,     setFim]     = useState(today)
  const [rawData, setRawData] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({
    unidade:         "Poços de Caldas",
    tipo:            "receita" as "receita" | "despesa",
    descricao:       "",
    valor:           "",
    forma_pagamento: "PIX",
    observacao:      "",
    data:            today,
  })

  const unidadesGrupo = GRUPOS[grupo] as readonly string[]

  const switchGrupo = (g: Grupo) => {
    setGrupo(g)
    setUnidade("Todas")
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      params.set("inicio", inicio)
      params.set("fim",    fim)
      const res  = await fetch(`/api/financeiro?${params}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setRawData(Array.isArray(json) ? json : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [inicio, fim])

  useEffect(() => { fetchData() }, [fetchData])

  // Client-side filter: group → unidade
  const data = rawData
    .filter(l => (unidadesGrupo as string[]).includes(l.unidade))
    .filter(l => unidade === "Todas" || l.unidade === unidade)

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
      setFormOpen(false)
      setForm(f => ({ ...f, descricao: "", valor: "", observacao: "" }))
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const excluir = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return
    try {
      const res  = await fetch(`/api/financeiro?id=${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const receitas = data.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0)
  const despesas = data.filter(l => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0)
  const saldo    = receitas - despesas

  const porUnidade = unidadesGrupo.map(u => {
    const rec  = data.filter(l => l.unidade === u && l.tipo === "receita").reduce((s, l) => s + l.valor, 0)
    const desp = data.filter(l => l.unidade === u && l.tipo === "despesa").reduce((s, l) => s + l.valor, 0)
    return { unidade: u, rec, desp }
  }).filter(u => u.rec > 0 || u.desp > 0)

  const maxVal = Math.max(...porUnidade.map(u => Math.max(u.rec, u.desp)), 1)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Financeiro por Unidade"
        subtitle="ALA CLÍNICA · SUPABASE"
        actions={
          <button
            onClick={() => setFormOpen(o => !o)}
            className="flex items-center gap-1.5 text-[11px] bg-accent text-background font-semibold rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Lançamento
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Receitas" value={fmt(receitas)} sub="no período" icon={TrendingUp}  accent="green" />
          <StatCard label="Despesas" value={fmt(despesas)} sub="no período" icon={TrendingDown} accent="red"   />
          <StatCard label="Saldo"    value={fmt(saldo)}    sub="líquido"   icon={DollarSign}   accent={saldo >= 0 ? "green" : "red"} />
        </div>

        {/* Group toggle + unit pills + date range */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Group toggle */}
          <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
            {(Object.keys(GRUPOS) as Grupo[]).map(g => (
              <button
                key={g}
                onClick={() => switchGrupo(g)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                  grupo === g
                    ? "bg-accent-dim border border-accent-border text-accent"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {GRUPO_LABELS[g]}
              </button>
            ))}
          </div>

          {/* Unit pills */}
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            {["Todas", ...unidadesGrupo].map(u => (
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

          {/* Date range */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={inicio}
              onChange={e => setInicio(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none focus:border-accent/40 transition-colors"
            />
            <span className="text-text-muted text-[11px]">até</span>
            <input
              type="date"
              value={fim}
              onChange={e => setFim(e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-1.5 text-[12px] text-text-primary outline-none focus:border-accent/40 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">{error}</div>
        )}

        {/* Bar chart por unidade */}
        {porUnidade.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-4">
              Por Unidade — {GRUPO_LABELS[grupo]}
            </div>
            <div className="space-y-4">
              {porUnidade.map(u => (
                <div key={u.unidade}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-text-secondary">{u.unidade}</span>
                    <span className={cn("text-[11px] font-mono", u.rec - u.desp >= 0 ? "text-accent" : "text-red-400")}>
                      {fmt(u.rec - u.desp)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="bg-accent rounded-full transition-all" style={{ width: `${(u.rec / maxVal) * 100}%` }} />
                    <div className="bg-red-400/60 rounded-full transition-all" style={{ width: `${(u.desp / maxVal) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-accent" /> Receitas
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-red-400/60" /> Despesas
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New lancamento form */}
        {formOpen && (
          <div className="bg-surface border border-accent-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-text-primary">Novo Lançamento</span>
              <button onClick={() => setFormOpen(false)}><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Unidade</label>
                <select
                  value={form.unidade}
                  onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40"
                >
                  {GRUPOS.consolidado.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Tipo</label>
                <div className="flex gap-2">
                  {(["receita", "despesa"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[11px] font-medium border transition-all",
                        form.tipo === t
                          ? t === "receita"
                            ? "bg-accent-dim border-accent-border text-accent"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                          : "border-border text-text-muted hover:border-border-hover"
                      )}
                    >
                      {t === "receita" ? "Receita" : "Despesa"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Descrição</label>
                <input
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Consulta particular — Dr. Bruno"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Valor (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Forma de Pagamento</label>
                <select
                  value={form.forma_pagamento}
                  onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40"
                >
                  {FORMAS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Data</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1">Observação</label>
                <input
                  value={form.observacao}
                  onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                  placeholder="Opcional"
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none"
                />
              </div>
            </div>
            <button
              onClick={salvar}
              disabled={saving || !form.descricao || !form.valor}
              className="flex items-center gap-2 bg-accent text-background text-[12px] font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
              Salvar Lançamento
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              {data.length} lançamento{data.length !== 1 ? "s" : ""}
              {unidade !== "Todas" && ` · ${unidade}`}
            </span>
            {loading && <Loader2 className="w-3.5 h-3.5 text-text-muted animate-spin" />}
          </div>

          {data.length === 0 && !loading ? (
            <div className="py-12 text-center text-[13px] text-text-muted">
              Nenhum lançamento no período selecionado.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.map(l => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-2 transition-colors group">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                    l.tipo === "receita" ? "bg-accent-dim" : "bg-red-500/10"
                  )}>
                    {l.tipo === "receita"
                      ? <TrendingUp  className="w-3.5 h-3.5 text-accent"   />
                      : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-text-primary truncate">{l.descricao}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-text-muted">{fmtDate(l.data)}</span>
                      <span className="text-[10px] text-text-muted">·</span>
                      <span className="text-[10px] text-text-muted">{l.unidade}</span>
                      {l.forma_pagamento && (
                        <>
                          <span className="text-[10px] text-text-muted">·</span>
                          <span className="text-[10px] text-text-muted">{l.forma_pagamento}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "text-[14px] font-semibold font-mono flex-shrink-0",
                    l.tipo === "receita" ? "text-accent" : "text-red-400"
                  )}>
                    {l.tipo === "despesa" ? "−" : "+"}{fmt(l.valor)}
                  </div>
                  <button
                    onClick={() => excluir(l.id)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
