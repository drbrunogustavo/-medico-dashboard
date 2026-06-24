"use client"

import { useEffect, useState, useRef } from "react"
import { Target, Loader2, Check, ChevronDown, ChevronUp, Sparkles, TrendingUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanoMes {
  mes:               string
  meta_faturamento:  number
  meta_consultas:    number
  meta_leads:        number
  foco:              string
}

interface PlanoIA {
  breakdown_mensal:     PlanoMes[]
  estrategias:          { area: string; estrategia: string; impacto: string }[]
  indicadores_semanais: string[]
  alertas_desvio:       string[]
}

interface MetasMes {
  meta_faturamento:      number
  meta_novos_pacientes:  number
  meta_conteudos:        number
  meta_leads:            number
  realizado_faturamento: number
  realizado_pacientes:   number
  realizado_consultas:   number
}

interface Objetivo90 {
  titulo:  string
  acoes:   { texto: string; feito: boolean }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}
function pct(r: number, m: number) { return m > 0 ? Math.min(Math.round(r / m * 100), 100) : 0 }
function semaforo(p: number) {
  if (p >= 100) return "bg-emerald-400 text-emerald-400"
  if (p >= 70)  return "bg-amber-400 text-amber-400"
  return              "bg-red-400 text-red-400"
}

// ─── Accordion ───────────────────────────────────────────────────────────────

function Accordion({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-[--border] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-text-primary">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-[--border] pt-4">{children}</div>}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MetasPage() {
  // Annual goals form
  const [fatAnual,     setFatAnual]     = useState(0)
  const [pacAtivos,    setPacAtivos]    = useState(0)
  const [ticketMedio,  setTicketMedio]  = useState(0)
  const [consultasMes, setConsultasMes] = useState(0)
  const [objetivo,     setObjetivo]     = useState("")

  // Plan
  const [plano,        setPlano]        = useState<PlanoIA | null>(null)
  const [loadingPlano, setLoadingPlano] = useState(false)
  const [errorPlano,   setErrorPlano]   = useState("")

  // Monthly tracker
  const [metasMes,     setMetasMes]     = useState<Partial<MetasMes>>({})
  const [loadingMes,   setLoadingMes]   = useState(true)

  // 90-day plan
  const [obj90,        setObj90]        = useState<Objetivo90[]>([
    { titulo: "", acoes: [{ texto: "", feito: false }] },
    { titulo: "", acoes: [{ texto: "", feito: false }] },
    { titulo: "", acoes: [{ texto: "", feito: false }] },
  ])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
  const mesAtual = new Date().getMonth()

  useEffect(() => {
    fetch("/api/metas").then(r => r.json()).then(d => setMetasMes(d ?? {})).finally(() => setLoadingMes(false))
  }, [])

  async function gerarPlano() {
    if (!fatAnual || !objetivo.trim()) return
    setLoadingPlano(true)
    setErrorPlano("")
    try {
      const res = await fetch("/api/metas/plano", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faturamento_anual:  fatAnual,
          pacientes_ativos:   pacAtivos,
          ticket_medio:       ticketMedio,
          consultas_mes:      consultasMes,
          objetivo_principal: objetivo,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setErrorPlano(data.error ?? "Erro"); return }
      setPlano(data as PlanoIA)
    } catch (e) {
      console.error("[metas] erro ao gerar plano:", e)
      setErrorPlano("Erro de conexão.")
    } finally {
      setLoadingPlano(false)
    }
  }

  function updateMetas(key: keyof MetasMes, val: number) {
    setMetasMes(prev => {
      const next = { ...prev, [key]: val }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        fetch("/api/metas", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(console.error)
      }, 800)
      return next
    })
  }

  // 90-day helpers
  function toggleAcao(oi: number, ai: number) {
    setObj90(prev => prev.map((o, i) =>
      i === oi ? { ...o, acoes: o.acoes.map((a, j) => j === ai ? { ...a, feito: !a.feito } : a) } : o
    ))
  }
  function updateObjetivoTitulo(oi: number, txt: string) {
    setObj90(prev => prev.map((o, i) => i === oi ? { ...o, titulo: txt } : o))
  }
  function updateAcao(oi: number, ai: number, txt: string) {
    setObj90(prev => prev.map((o, i) =>
      i === oi ? { ...o, acoes: o.acoes.map((a, j) => j === ai ? { ...a, texto: txt } : a) } : o
    ))
  }
  function addAcao(oi: number) {
    setObj90(prev => prev.map((o, i) =>
      i === oi ? { ...o, acoes: [...o.acoes, { texto: "", feito: false }] } : o
    ))
  }

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Metas e Planejamento" />
      <div className="flex items-center gap-3 p-8 pb-0">
        <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Metas e Planejamento</h1>
          <p className="text-sm text-text-muted mt-0.5 font-mono">EXECUTIVO · CRESCIMENTO</p>
          <p className="text-[12px] text-text-secondary mt-1.5">Defina metas anuais e acompanhe seu progresso com planejamento de 90 dias.</p>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6 max-w-3xl">

        {/* ── SEÇÃO 1: Metas do Ano ── */}
        <Accordion title="Metas do Ano" icon={TrendingUp} defaultOpen>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Faturamento anual (R$)",    val: fatAnual,     set: setFatAnual,     ph: "Ex: 600000", prefix: "R$" },
                { label: "Pacientes ativos desejados", val: pacAtivos,    set: setPacAtivos,    ph: "Ex: 300"                 },
                { label: "Ticket médio desejado (R$)", val: ticketMedio,  set: setTicketMedio,  ph: "Ex: 400",   prefix: "R$" },
                { label: "Consultas/mês desejadas",   val: consultasMes, set: setConsultasMes, ph: "Ex: 120"                 },
              ].map(f => (
                <div key={f.label} className="space-y-1">
                  <label className="text-[11px] font-mono text-text-muted uppercase">{f.label}</label>
                  <div className="relative">
                    {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-mono">{f.prefix}</span>}
                    <input
                      type="number"
                      value={f.val || ""}
                      onChange={e => f.set(Number(e.target.value) || 0)}
                      placeholder={f.ph}
                      className={cn(
                        "w-full bg-[--surface] border border-[--border] rounded-lg py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted",
                        f.prefix ? "pl-8 pr-3" : "px-3"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-text-muted uppercase">Objetivo principal do ano</label>
              <textarea
                value={objetivo}
                onChange={e => setObjetivo(e.target.value)}
                placeholder="Ex: Largar convênios e migrar para consulta particular premium..."
                rows={2}
                className="w-full bg-[--surface] border border-[--border] rounded-lg px-3 py-2.5 text-sm text-text-primary resize-none focus:outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted"
              />
            </div>
            {errorPlano && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{errorPlano}</p>}
            <button
              onClick={gerarPlano}
              disabled={loadingPlano || !fatAnual || !objetivo.trim()}
              className={cn(
                "flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors",
                !loadingPlano && fatAnual && objetivo.trim()
                  ? "bg-accent text-[--background] hover:bg-accent/90"
                  : "bg-[--surface] border border-[--border] text-text-muted cursor-not-allowed"
              )}
            >
              {loadingPlano ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar Plano com IA
            </button>

            {plano && (
              <div className="space-y-4 mt-2">
                {/* Estratégias */}
                <div>
                  <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">Estratégias Prioritárias</p>
                  <div className="space-y-2">
                    {plano.estrategias.slice(0, 6).map((e, i) => (
                      <div key={i} className="flex gap-2 p-3 rounded-lg bg-[--surface] border border-[--border]">
                        <span className="text-[10px] font-mono text-accent border border-accent/30 px-1.5 py-0.5 rounded h-fit flex-shrink-0">{e.area}</span>
                        <p className="text-xs text-text-secondary">{e.estrategia}</p>
                        <span className={cn(
                          "text-[9px] font-mono px-1.5 rounded-full border h-fit flex-shrink-0 ml-auto",
                          e.impacto === "Alto" ? "border-red-500/30 text-red-400" : "border-amber-500/30 text-amber-400"
                        )}>{e.impacto}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indicadores semanais */}
                {plano.indicadores_semanais?.length > 0 && (
                  <div>
                    <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">Indicadores Semanais</p>
                    <ul className="space-y-1">
                      {plano.indicadores_semanais.map((ind, i) => (
                        <li key={i} className="flex gap-2 text-xs text-text-secondary">
                          <Check className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                          {ind}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Alertas */}
                {plano.alertas_desvio?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">Alertas de Desvio</p>
                    </div>
                    <ul className="space-y-1">
                      {plano.alertas_desvio.map((a, i) => (
                        <li key={i} className="text-xs text-amber-300/80">• {a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Accordion>

        {/* ── SEÇÃO 2: Tracker Mensal ── */}
        <Accordion title="Tracker Mensal" icon={Target}>
          {loadingMes ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-text-muted" /></div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">Edite as metas e realizados do mês atual. Salvamento automático.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left border-b border-[--border]">
                      <th className="pb-2 text-text-muted font-mono font-medium pr-4">KPI</th>
                      <th className="pb-2 text-text-muted font-mono font-medium pr-4">Meta</th>
                      <th className="pb-2 text-text-muted font-mono font-medium pr-4">Realizado</th>
                      <th className="pb-2 text-text-muted font-mono font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {[
                      { label: "Faturamento",  meta: "meta_faturamento" as const,      real: "realizado_faturamento" as const,  fmt: true },
                      { label: "Pacientes",    meta: "meta_novos_pacientes" as const,  real: "realizado_pacientes" as const     },
                      { label: "Consultas",    meta: "meta_conteudos" as const,        real: "realizado_consultas" as const     },
                      { label: "Leads",        meta: "meta_leads" as const,            real: "realizado_consultas" as const     },
                    ].map(row => {
                      const m = metasMes[row.meta] ?? 0
                      const r = metasMes[row.real] ?? 0
                      const p = pct(r, m)
                      const [barCls, txtCls] = semaforo(p).split(" ")
                      return (
                        <tr key={row.label} className="border-b border-[--border]/40">
                          <td className="py-2.5 pr-4 font-semibold text-text-primary">{row.label}</td>
                          <td className="py-2.5 pr-4">
                            <input
                              type="number"
                              value={m || ""}
                              onChange={e => updateMetas(row.meta, Number(e.target.value) || 0)}
                              className="w-24 bg-transparent border border-[--border] rounded px-2 py-1 font-mono text-text-secondary focus:outline-none focus:border-accent/40"
                            />
                          </td>
                          <td className="py-2.5 pr-4">
                            <input
                              type="number"
                              value={r || ""}
                              onChange={e => updateMetas(row.real, Number(e.target.value) || 0)}
                              className="w-24 bg-transparent border border-[--border] rounded px-2 py-1 font-mono text-text-secondary focus:outline-none focus:border-accent/40"
                            />
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-[--border] rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full", barCls)} style={{ width: `${p}%` }} />
                              </div>
                              <span className={cn("font-mono", txtCls)}>{p}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Month grid */}
              {plano && (
                <div>
                  <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">Breakdown Mensal (IA)</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {(plano.breakdown_mensal ?? []).slice(0, 12).map((m, i) => {
                      const isCurrent = i === mesAtual
                      return (
                        <div
                          key={m.mes}
                          className={cn(
                            "rounded-lg border p-2 text-center",
                            isCurrent ? "border-accent/40 bg-accent/5" : "border-[--border] bg-[--surface]"
                          )}
                        >
                          <p className={cn("text-[10px] font-mono mb-1", isCurrent ? "text-accent" : "text-text-muted")}>
                            {meses[i]}
                          </p>
                          <p className="text-[11px] font-bold text-text-primary">
                            {(m.meta_faturamento / 1000).toFixed(0)}k
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </Accordion>

        {/* ── SEÇÃO 3: Planejamento 90 dias ── */}
        <Accordion title="Planejamento 90 Dias" icon={Target}>
          <div className="space-y-4">
            <p className="text-xs text-text-muted">Defina 3 objetivos principais do trimestre com ações semanais.</p>
            {obj90.map((obj, oi) => (
              <div key={oi} className="rounded-xl border border-[--border] bg-[--surface] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-mono font-bold text-accent flex-shrink-0">
                    {oi + 1}
                  </div>
                  <input
                    value={obj.titulo}
                    onChange={e => updateObjetivoTitulo(oi, e.target.value)}
                    placeholder={`Objetivo ${oi + 1}...`}
                    className="flex-1 bg-transparent border-b border-[--border] pb-1 text-sm font-semibold text-text-primary focus:outline-none focus:border-accent/50 placeholder:text-text-muted"
                  />
                </div>
                <div className="space-y-2 ml-8">
                  {obj.acoes.map((a, ai) => (
                    <div key={ai} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAcao(oi, ai)}
                        className={cn(
                          "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all",
                          a.feito ? "bg-accent border-accent" : "border-[--border] hover:border-accent/40"
                        )}
                      >
                        {a.feito && <Check className="w-2.5 h-2.5 text-[--background]" />}
                      </button>
                      <input
                        value={a.texto}
                        onChange={e => updateAcao(oi, ai, e.target.value)}
                        placeholder="Ação da semana..."
                        className={cn(
                          "flex-1 bg-transparent text-xs focus:outline-none placeholder:text-text-muted",
                          a.feito ? "line-through text-text-muted" : "text-text-secondary"
                        )}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addAcao(oi)}
                    className="text-[10px] font-mono text-text-muted hover:text-accent transition-colors"
                  >
                    + Adicionar ação
                  </button>
                </div>
                <div className="ml-8">
                  <div className="h-1 bg-[--border] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${obj.acoes.length ? pct(obj.acoes.filter(a => a.feito).length, obj.acoes.length) : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    {obj.acoes.filter(a => a.feito).length}/{obj.acoes.length} concluídas
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      </div>
    </div>
  )
}
