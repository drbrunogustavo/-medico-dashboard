"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Activity, TrendingUp, Users, Stethoscope, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExecData {
  faturamento_mes:   number
  faturamento_6m:    { mes: string; valor: number }[]
  leads_total:       number
  leads_por_estagio: { estagio: string; count: number }[]
  consultas_mes:     number
  leads_origem:      { origem: string; count: number }[]
  nps_score:         number | null
}

interface IndManuais {
  taxa_comparecimento?:          number
  taxa_fechamento_protocolos?:   number
  taxa_faltas?:                  number
  conversao_recepcao?:           number
  adesao_tratamento?:            number
  permanencia_media_meses?:      number
  recompra_protocolos?:          number
  engajamento_medio?:            number
  custo_marketing?:              number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "financeiro",  label: "Financeiro",  icon: TrendingUp },
  { id: "marketing",   label: "Marketing",   icon: Sparkles   },
  { id: "comercial",   label: "Comercial",   icon: Users      },
  { id: "clinico",     label: "Clínico",     icon: Stethoscope},
]

const ORIGEM_COLORS  = ["#ec4899","#00c07f","#3b7fff","#22c55e","#7c85a0"]

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

// ─── Editable Field ──────────────────────────────────────────────────────────

function EditField({
  label, value, onChange, suffix = "", min = 0, max = 100,
}: {
  label: string; value: number | undefined; onChange: (v: number) => void
  suffix?: string; min?: number; max?: number
}) {
  const [editing, setEditing] = useState(false)
  const [local,   setLocal]   = useState(value ?? 0)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  return (
    <div className="rounded-xl border border-[--border] bg-[--surface] p-4 flex items-center justify-between gap-3">
      <span className="text-sm text-text-secondary">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={ref}
            type="number"
            min={min} max={max}
            value={local}
            onChange={e => setLocal(Number(e.target.value))}
            className="w-20 text-right bg-transparent border border-accent/40 rounded-md px-2 py-1 text-sm font-mono text-accent focus:outline-none"
            onBlur={() => { setEditing(false); onChange(local) }}
            onKeyDown={e => { if (e.key === "Enter") { setEditing(false); onChange(local) } }}
          />
          <span className="text-xs text-text-muted font-mono">{suffix}</span>
        </div>
      ) : (
        <button
          onClick={() => { setLocal(value ?? 0); setEditing(true) }}
          className="text-sm font-semibold font-mono text-text-primary hover:text-accent transition-colors"
        >
          {value !== undefined ? `${value}${suffix}` : <span className="text-text-muted text-xs">Clique p/ editar</span>}
        </button>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IndicadoresPage() {
  const [tab,       setTab]       = useState("financeiro")
  const [exec,      setExec]      = useState<Partial<ExecData>>({})
  const [ind,       setInd]       = useState<IndManuais>({})
  const [loading,   setLoading]   = useState(true)
  const saveTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/executivo").then(r => r.json()).catch(e => { console.error("[indicadores] executivo falhou:", e); return {} }),
      fetch("/api/indicadores").then(r => r.json()).catch(e => { console.error("[indicadores] indicadores falhou:", e); return {} }),
    ]).then(([e, i]) => {
      setExec(e ?? {})
      setInd(i ?? {})
    }).finally(() => setLoading(false))
  }, [])

  const updateInd = useCallback((key: keyof IndManuais, val: number) => {
    setInd(prev => {
      const next = { ...prev, [key]: val }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        fetch("/api/indicadores", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(console.error)
      }, 800)
      return next
    })
  }, [])

  // Derived
  const ticket_medio  = exec.consultas_mes && exec.faturamento_mes
    ? Math.round(exec.faturamento_mes / exec.consultas_mes) : 0
  const custo_lead    = ind.custo_marketing && exec.leads_total
    ? Math.round(ind.custo_marketing / exec.leads_total) : 0
  const conv_lead     = exec.leads_total && exec.consultas_mes
    ? Math.round((exec.consultas_mes / exec.leads_total) * 100) : 0

  // Projections: simple linear from last 6m
  const fat6 = exec.faturamento_6m ?? []
  const proj3: { mes: string; valor: number }[] = []
  if (fat6.length >= 2) {
    const last  = fat6[fat6.length - 1]?.valor ?? 0
    const prev  = fat6[fat6.length - 2]?.valor ?? 0
    const delta = last - prev
    for (let i = 1; i <= 3; i++) {
      const d = new Date()
      d.setMonth(d.getMonth() + i)
      proj3.push({
        mes:   d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        valor: Math.max(0, last + delta * i),
      })
    }
  }

  const chartData = [...(fat6), ...proj3.map(p => ({ ...p, projecao: p.valor }))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-8 pb-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Indicadores da Clínica</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">KPIs · PERFORMANCE · DECISÕES</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-purple-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 pt-6">
        <div className="flex gap-1 bg-[--surface] border border-[--border] rounded-xl p-1 overflow-x-auto scrollbar-none">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wide transition-all flex items-center gap-1.5",
                  tab === t.id
                    ? "bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6 max-w-4xl">

        {/* ── FINANCEIRO ── */}
        {tab === "financeiro" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Faturamento do Mês",  value: fmt(exec.faturamento_mes ?? 0) },
                { label: "Ticket Médio",         value: fmt(ticket_medio) },
                { label: "Consultas no Mês",     value: String(exec.consultas_mes ?? 0) },
                { label: "Custo por Lead",       value: fmt(custo_lead) },
              ].map(k => (
                <div key={k.label} className="rounded-xl border border-[--border] bg-[--surface] p-4">
                  <p className="text-[10px] font-mono text-text-muted uppercase">{k.label}</p>
                  <p className="text-xl font-bold text-text-primary mt-1">{k.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">Faturamento + Projeção 3 meses</h3>
              <div className="h-[160px] md:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={24}>
                  <XAxis dataKey="mes" tick={{ fill: "#7c85a0", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7c85a0", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#13141d", border: "1px solid #1c1d2a", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [fmt(Number(v ?? 0)), ""]}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="valor"    fill="#a855f7" radius={[4,4,0,0]} />
                  <Bar dataKey="projecao" fill="#a855f740" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-text-muted font-mono mt-2">Barras claras = projeção baseada na tendência</p>
            </div>

            <div className="space-y-2">
              <EditField label="Custo mensal de marketing (R$)" value={ind.custo_marketing} onChange={v => updateInd("custo_marketing", v)} suffix="" min={0} max={99999} />
            </div>

            <Link href="/consultor" className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Gerar análise financeira com IA →
            </Link>
          </>
        )}

        {/* ── MARKETING ── */}
        {tab === "marketing" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Leads no Mês",            value: String(exec.leads_total ?? 0) },
                { label: "Taxa Conversão Lead",      value: `${conv_lead}%` },
                { label: "Custo por Consulta (est.)",value: fmt(ticket_medio > 0 && custo_lead > 0 ? custo_lead : 0) },
              ].map(k => (
                <div key={k.label} className="rounded-xl border border-[--border] bg-[--surface] p-4">
                  <p className="text-[10px] font-mono text-text-muted uppercase">{k.label}</p>
                  <p className="text-xl font-bold text-text-primary mt-1">{k.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">Leads por Origem</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="w-full sm:w-[180px] h-[180px] flex-shrink-0">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={exec.leads_origem ?? []} dataKey="count" nameKey="origem" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {(exec.leads_origem ?? []).map((_, i) => (
                        <Cell key={i} fill={ORIGEM_COLORS[i % ORIGEM_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#13141d", border: "1px solid #1c1d2a", borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [Number(v ?? 0), "leads"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1 w-full sm:w-auto">
                  {(exec.leads_origem ?? []).map((o, i) => (
                    <div key={o.origem} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: ORIGEM_COLORS[i % ORIGEM_COLORS.length] }} />
                      <span className="text-sm text-text-secondary flex-1">{o.origem}</span>
                      <span className="text-sm font-mono font-semibold text-text-primary">{o.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <EditField label="Engajamento médio (%)"    value={ind.engajamento_medio}  onChange={v => updateInd("engajamento_medio",  v)} suffix="%" />
              <EditField label="Custo mensal de marketing (R$)" value={ind.custo_marketing} onChange={v => updateInd("custo_marketing", v)} suffix="" min={0} max={99999} />
            </div>

            <Link href="/consultor" className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Gerar análise de marketing com IA →
            </Link>
          </>
        )}

        {/* ── COMERCIAL ── */}
        {tab === "comercial" && (
          <>
            <p className="text-xs text-text-muted font-mono">Clique nos valores para editar — salvamento automático.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {[
                { label: "Taxa de comparecimento (%)",        key: "taxa_comparecimento"        as const, suffix: "%" },
                { label: "Taxa de fechamento de protocolos (%)", key: "taxa_fechamento_protocolos" as const, suffix: "%" },
                { label: "Taxa de faltas (%)",                key: "taxa_faltas"                as const, suffix: "%" },
                { label: "Conversão da recepção (%)",         key: "conversao_recepcao"         as const, suffix: "%" },
              ].map(f => (
                <EditField
                  key={f.key}
                  label={f.label}
                  value={ind[f.key]}
                  onChange={v => updateInd(f.key, v)}
                  suffix={f.suffix}
                />
              ))}
            </div>

            <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">Leads por Estágio do Funil</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={exec.leads_por_estagio ?? []} layout="vertical" barSize={14}>
                  <XAxis type="number" tick={{ fill: "#7c85a0", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="estagio" tick={{ fill: "#7c85a0", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ background: "#13141d", border: "1px solid #1c1d2a", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [Number(v ?? 0), "leads"]}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="count" fill="#3b7fff" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <Link href="/consultor" className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Gerar análise comercial com IA →
            </Link>
          </>
        )}

        {/* ── CLÍNICO ── */}
        {tab === "clinico" && (
          <>
            <p className="text-xs text-text-muted font-mono">Clique nos valores para editar — salvamento automático.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Taxa de retorno (%)",                key: "taxa_comparecimento"     as const, suffix: "%" },
                { label: "Adesão ao tratamento (1-10)",        key: "adesao_tratamento"       as const, suffix: "", max: 10 },
                { label: "Permanência média (meses)",          key: "permanencia_media_meses" as const, suffix: " meses", max: 120 },
                { label: "Recompra de protocolos (%)",         key: "recompra_protocolos"     as const, suffix: "%" },
              ].map(f => (
                <EditField
                  key={f.key}
                  label={f.label}
                  value={ind[f.key]}
                  onChange={v => updateInd(f.key, v)}
                  suffix={f.suffix}
                  max={f.max ?? 100}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[--border] bg-[--surface] p-4">
                <p className="text-[10px] font-mono text-text-muted uppercase">Pacientes Ativos no CRM</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{exec.leads_total ?? 0}</p>
              </div>
              <div className="rounded-xl border border-[--border] bg-[--surface] p-4">
                <p className="text-[10px] font-mono text-text-muted uppercase">Score NPS</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {exec.nps_score !== null && exec.nps_score !== undefined ? exec.nps_score : "—"}
                </p>
              </div>
            </div>

            <Link href="/consultor" className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Gerar análise clínica com IA →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
