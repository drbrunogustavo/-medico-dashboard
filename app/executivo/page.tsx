"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { BarChart3, Users, Star, Calendar, AlertTriangle, TrendingUp, Target, Loader2, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExecData {
  faturamento_mes:      number
  faturamento_6m:       { mes: string; valor: number }[]
  leads_total:          number
  leads_semana:         number
  leads_por_estagio:    { estagio: string; count: number }[]
  nps_score:            number | null
  nps_6m:               { mes: string; nps: number | null }[]
  consultas_mes:        number
  leads_origem:         { origem: string; count: number }[]
}

interface Metas {
  meta_faturamento:     number
  meta_novos_pacientes: number
  meta_conteudos:       number
  meta_leads:           number
  realizado_faturamento:  number
  realizado_pacientes:    number
  realizado_consultas:    number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ESTAGIO_COLORS = ["#3b7fff","#00c07f","#a855f7","#f59e0b","#ec4899"]
const ORIGEM_COLORS  = ["#ec4899","#00c07f","#3b7fff","#22c55e","#7c85a0"]

const ALERTAS_PADRAO = [
  { tipo: "warn",  msg: "3 leads parados há mais de 7 dias no CRM" },
  { tipo: "info",  msg: "Seu NPS será calculado com mais de 5 respostas" },
  { tipo: "warn",  msg: "Nenhum conteúdo postado há 5 dias" },
  { tipo: "info",  msg: "Defina suas metas mensais para acompanhar o progresso" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}
function pct(real: number, meta: number) {
  if (!meta) return 0
  return Math.min(Math.round((real / meta) * 100), 100)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--surface] p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{label}</span>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color.replace("text-", "bg-").replace("400","500/10"))}>
          <Icon className={cn("w-3.5 h-3.5", color)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-[11px] text-text-muted mt-1">{sub}</p>
    </div>
  )
}

function ProgressBar({ label, real, meta, color }: { label: string; real: number; meta: number; color: string }) {
  const p = pct(real, meta)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className={cn("font-mono font-semibold", p >= 100 ? "text-emerald-400" : p >= 70 ? "text-amber-400" : "text-red-400")}>
          {p}%
        </span>
      </div>
      <div className="h-1.5 bg-[--border] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${p}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted font-mono">
        <span>{typeof real === "number" && real > 1000 ? fmt(real) : real}</span>
        <span>meta: {typeof meta === "number" && meta > 1000 ? fmt(meta) : meta}</span>
      </div>
    </div>
  )
}

// ─── Metas Modal ─────────────────────────────────────────────────────────────

function MetasModal({ metas, onSave, onClose }: {
  metas: Partial<Metas>
  onSave: (m: Partial<Metas>) => void
  onClose: () => void
}) {
  const [vals, setVals] = useState<Partial<Metas>>(metas)
  const [saving, setSaving] = useState(false)

  async function salvar() {
    setSaving(true)
    try {
      await fetch("/api/metas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vals),
      })
      onSave(vals)
    } finally {
      setSaving(false)
    }
  }

  const campos: { key: keyof Metas; label: string; prefix?: string }[] = [
    { key: "meta_faturamento",     label: "Meta de faturamento",        prefix: "R$" },
    { key: "meta_novos_pacientes", label: "Meta de novos pacientes"                   },
    { key: "meta_conteudos",       label: "Meta de conteúdos publicados"              },
    { key: "meta_leads",           label: "Meta de leads gerados"                     },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[--card] border border-[--border] rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-text-primary">Metas do Mês</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {campos.map(c => (
            <div key={c.key} className="space-y-1">
              <label className="text-[11px] font-mono text-text-muted uppercase">{c.label}</label>
              <div className="relative">
                {c.prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-mono">{c.prefix}</span>
                )}
                <input
                  type="number"
                  value={vals[c.key] ?? ""}
                  onChange={e => setVals(v => ({ ...v, [c.key]: Number(e.target.value) || 0 }))}
                  className={cn(
                    "w-full bg-[--surface] border border-[--border] rounded-lg py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-purple-500/50 transition-colors",
                    c.prefix ? "pl-8 pr-3" : "px-3"
                  )}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={salvar}
          disabled={saving}
          className="w-full mt-5 py-2.5 rounded-xl bg-purple-500/80 text-white text-sm font-semibold hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Salvar Metas
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExecutivoPage() {
  const [data,        setData]        = useState<ExecData | null>(null)
  const [metas,       setMetas]       = useState<Partial<Metas>>({})
  const [loading,     setLoading]     = useState(true)
  const [showMetas,   setShowMetas]   = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/executivo").then(r => r.json()).catch(() => null),
      fetch("/api/metas").then(r => r.json()).catch(() => ({})),
    ]).then(([exec, meta]) => {
      setData(exec)
      setMetas(meta ?? {})
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    )
  }

  const d = data ?? {} as Partial<ExecData>

  return (
    <div className="animate-fade-in">
      {showMetas && (
        <MetasModal
          metas={metas}
          onSave={m => { setMetas(m); setShowMetas(false) }}
          onClose={() => setShowMetas(false)}
        />
      )}

      <div className="flex items-center justify-between p-8 pb-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Painel Executivo</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">CENTRO DE COMANDO · VISÃO ESTRATÉGICA</p>
        </div>
        <button
          onClick={() => setShowMetas(true)}
          className="text-xs font-mono border border-purple-500/30 bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg hover:bg-purple-500/15 transition-colors"
        >
          Definir Metas
        </button>
      </div>

      <div className="p-8 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Faturamento do Mês"
            value={fmt(d.faturamento_mes ?? 0)}
            sub="receitas registradas"
            icon={BarChart3}
            color="text-purple-400"
          />
          <KpiCard
            label="Leads no CRM"
            value={String(d.leads_total ?? 0)}
            sub={`+${d.leads_semana ?? 0} esta semana`}
            icon={Users}
            color="text-blue-400"
          />
          <KpiCard
            label="Score NPS"
            value={d.nps_score !== null && d.nps_score !== undefined ? String(d.nps_score) : "—"}
            sub="satisfação dos pacientes"
            icon={Star}
            color="text-amber-400"
          />
          <KpiCard
            label="Consultas no Mês"
            value={String(d.consultas_mes ?? 0)}
            sub="agenda registrada"
            icon={Calendar}
            color="text-accent"
          />
        </div>

        {/* Main grid: charts + alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Charts — 2/3 */}
          <div className="xl:col-span-2 space-y-4">

            {/* Faturamento 6m */}
            <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">Faturamento — Últimos 6 Meses</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={d.faturamento_6m ?? []} barSize={28}>
                  <XAxis dataKey="mes" tick={{ fill: "#7c85a0", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7c85a0", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#13141d", border: "1px solid #1c1d2a", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [fmt(Number(v ?? 0)), "Faturamento"]}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="valor" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Row: donut leads + NPS line */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
                <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">Leads por Estágio</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={d.leads_por_estagio ?? []} dataKey="count" nameKey="estagio" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2}>
                        {(d.leads_por_estagio ?? []).map((_, i) => (
                          <Cell key={i} fill={ESTAGIO_COLORS[i % ESTAGIO_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 flex-1 min-w-0">
                    {(d.leads_por_estagio ?? []).map((e, i) => (
                      <div key={e.estagio} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ESTAGIO_COLORS[i % ESTAGIO_COLORS.length] }} />
                          <span className="text-[10px] text-text-muted truncate">{e.estagio.split(" ")[0]}</span>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-text-secondary flex-shrink-0">{e.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
                <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">Evolução do NPS</h3>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={d.nps_6m ?? []}>
                    <XAxis dataKey="mes" tick={{ fill: "#7c85a0", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[-100, 100]} tick={{ fill: "#7c85a0", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#13141d", border: "1px solid #1c1d2a", borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [v !== null && v !== undefined ? v : "—", "NPS"]}
                      cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <Line type="monotone" dataKey="nps" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Origem leads */}
            <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">Origem dos Leads</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={d.leads_origem ?? []} layout="vertical" barSize={14}>
                  <XAxis type="number" tick={{ fill: "#7c85a0", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="origem" tick={{ fill: "#7c85a0", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ background: "#13141d", border: "1px solid #1c1d2a", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [Number(v ?? 0), "Leads"]}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {(d.leads_origem ?? []).map((_, i) => (
                      <Cell key={i} fill={ORIGEM_COLORS[i % ORIGEM_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts — 1/3 */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Alertas Inteligentes</h3>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="space-y-3">
                {ALERTAS_PADRAO.map((a, i) => (
                  <div key={i} className={cn(
                    "rounded-lg p-3 text-xs leading-relaxed",
                    a.tipo === "warn"
                      ? "bg-amber-50 border border-amber-200 text-amber-700"
                      : "bg-blue-50 border border-blue-200 text-blue-700"
                  )}>
                    {a.msg}
                  </div>
                ))}
              </div>
              <Link
                href="/consultor"
                className="mt-4 w-full py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5 hover:bg-purple-500/15 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Analisar com IA
              </Link>
            </div>

            {/* Metas */}
            <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Metas do Mês</h3>
                <Target className="w-4 h-4 text-purple-400" />
              </div>
              <div className="space-y-4">
                <ProgressBar
                  label="Faturamento"
                  real={d.faturamento_mes ?? 0}
                  meta={metas.meta_faturamento ?? 0}
                  color="bg-purple-400"
                />
                <ProgressBar
                  label="Consultas"
                  real={d.consultas_mes ?? 0}
                  meta={metas.meta_novos_pacientes ?? 0}
                  color="bg-blue-400"
                />
                <ProgressBar
                  label="Leads"
                  real={d.leads_semana ?? 0}
                  meta={metas.meta_leads ?? 0}
                  color="bg-accent"
                />
                <ProgressBar
                  label="Conteúdos"
                  real={0}
                  meta={metas.meta_conteudos ?? 0}
                  color="bg-amber-400"
                />
              </div>
              {!metas.meta_faturamento && (
                <button
                  onClick={() => setShowMetas(true)}
                  className="mt-4 w-full text-xs font-mono text-text-muted border border-dashed border-[--border] rounded-lg py-2.5 hover:border-purple-500/30 hover:text-purple-400 transition-colors"
                >
                  + Definir metas
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
