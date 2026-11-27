"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Plus, Sparkles } from "lucide-react"
import { Panel, PxButton, Field, PxInput, Tag, PageHeader } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  titulo: string
  acoes:  { texto: string; feito: boolean }[]
}

// ─── Auxiliares ──────────────────────────────────────────────────────────────

function pct(r: number, m: number) { return m > 0 ? Math.min(Math.round(r / m * 100), 100) : 0 }

function situacao(p: number): { label: string; tone: "ok" | "warn" | "danger" } {
  if (p >= 100) return { label: "Meta atingida", tone: "ok" }
  if (p >= 70)  return { label: "Em andamento", tone: "warn" }
  return { label: "Abaixo da meta", tone: "danger" }
}

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

const LINHAS = [
  { label: "Faturamento", meta: "meta_faturamento",     real: "realizado_faturamento" },
  { label: "Pacientes",   meta: "meta_novos_pacientes", real: "realizado_pacientes"   },
  { label: "Consultas",   meta: "meta_conteudos",       real: "realizado_consultas"   },
  { label: "Leads",       meta: "meta_leads",           real: "realizado_consultas"   },
] as const

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function Barra({ pct, label }: { pct: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 w-full overflow-hidden rounded-full bg-px-ink/10">
      <div className="h-full rounded-full bg-px-ink transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MetasPage() {
  const [fatAnual,     setFatAnual]     = useState(0)
  const [pacAtivos,    setPacAtivos]    = useState(0)
  const [ticketMedio,  setTicketMedio]  = useState(0)
  const [consultasMes, setConsultasMes] = useState(0)
  const [objetivo,     setObjetivo]     = useState("")

  const [plano,        setPlano]        = useState<PlanoIA | null>(null)
  const [loadingPlano, setLoadingPlano] = useState(false)
  const [errorPlano,   setErrorPlano]   = useState("")
  const [saveErro,     setSaveErro]     = useState(false)

  const [metasMes,     setMetasMes]     = useState<Partial<MetasMes>>({})
  const [loadingMes,   setLoadingMes]   = useState(true)
  const [erroMes,      setErroMes]      = useState(false)

  const [obj90, setObj90] = useState<Objetivo90[]>([
    { titulo: "", acoes: [{ texto: "", feito: false }] },
    { titulo: "", acoes: [{ texto: "", feito: false }] },
    { titulo: "", acoes: [{ texto: "", feito: false }] },
  ])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mesAtual = new Date().getMonth()

  const carregarMes = useCallback(async () => {
    setLoadingMes(true); setErroMes(false)
    try {
      const res = await fetch("/api/metas")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMetasMes((await res.json()) ?? {})
    } catch (e) {
      console.error("[metas] erro ao carregar metas do mês:", e)
      setErroMes(true)
    } finally { setLoadingMes(false) }
  }, [])

  useEffect(() => { carregarMes() }, [carregarMes])
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

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
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) { setErrorPlano(data.error ?? "Não foi possível gerar o plano. Tente novamente."); return }
      setPlano(data as PlanoIA)
    } catch (e) {
      console.error("[metas] erro ao gerar plano:", e)
      setErrorPlano("Erro de conexão. Tente novamente.")
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
        })
          .then(r => { if (!r.ok) throw new Error(); setSaveErro(false) })
          .catch(() => setSaveErro(true))
      }, 800)
      return next
    })
  }

  const mapObj = (oi: number, fn: (o: Objetivo90) => Objetivo90) => setObj90(prev => prev.map((o, i) => i === oi ? fn(o) : o))
  const toggleAcao   = (oi: number, ai: number) => mapObj(oi, o => ({ ...o, acoes: o.acoes.map((a, j) => j === ai ? { ...a, feito: !a.feito } : a) }))
  const updateTitulo = (oi: number, txt: string) => mapObj(oi, o => ({ ...o, titulo: txt }))
  const updateAcao   = (oi: number, ai: number, txt: string) => mapObj(oi, o => ({ ...o, acoes: o.acoes.map((a, j) => j === ai ? { ...a, texto: txt } : a) }))
  const addAcao      = (oi: number) => mapObj(oi, o => ({ ...o, acoes: [...o.acoes, { texto: "", feito: false }] }))

  const camposAnuais = [
    { id: "meta-fat",  label: "Faturamento anual (R$)",     val: fatAnual,     set: setFatAnual,     ph: "Ex: 600000" },
    { id: "meta-pac",  label: "Pacientes ativos desejados", val: pacAtivos,    set: setPacAtivos,    ph: "Ex: 300"    },
    { id: "meta-tkt",  label: "Ticket médio desejado (R$)", val: ticketMedio,  set: setTicketMedio,  ph: "Ex: 400"    },
    { id: "meta-cons", label: "Consultas por mês desejadas", val: consultasMes, set: setConsultasMes, ph: "Ex: 120"    },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Metas e Planejamento" caption="Defina as metas do ano e acompanhe o mês" />

      <div className="max-w-3xl space-y-4 px-4 pb-10 md:px-10">
        {saveErro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-2.5 text-[13px] text-px-danger">Não foi possível salvar a última alteração do tracker. Verifique sua conexão e edite o valor de novo.</p>}

        {/* Metas do ano */}
        <Panel as="section" className="space-y-4">
          <h2 className="text-[15px] font-semibold text-px-ink">Metas do ano</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {camposAnuais.map(f => (
              <Field key={f.id} label={f.label} htmlFor={f.id}>
                <PxInput id={f.id} type="number" inputMode="decimal" min={0} value={f.val || ""} onChange={e => f.set(Number(e.target.value) || 0)} placeholder={f.ph} />
              </Field>
            ))}
          </div>
          <Field label="Objetivo principal do ano" htmlFor="meta-obj">
            <textarea id="meta-obj" value={objetivo} onChange={e => setObjetivo(e.target.value)} rows={2} placeholder="Ex: sair dos convênios e migrar para consulta particular premium" className={areaCls} />
          </Field>
          {errorPlano && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-2.5 text-[13px] text-px-danger">{errorPlano}</p>}
          <PxButton onClick={gerarPlano} loading={loadingPlano} disabled={!fatAnual || !objetivo.trim()} leftIcon={Sparkles}>Gerar plano com IA</PxButton>
          {(!fatAnual || !objetivo.trim()) && <p className="text-[12.5px] text-px-muted">Preencha o faturamento anual e o objetivo principal para gerar o plano.</p>}

          {plano && (
            <div className="space-y-5 border-t border-px-ink/10 pt-4">
              <div>
                <h3 className="mb-2 text-[13.5px] font-semibold text-px-ink">Estratégias prioritárias</h3>
                <ul className="space-y-2">
                  {(plano.estrategias ?? []).slice(0, 6).map((e, i) => (
                    <li key={i} className="flex flex-wrap items-start gap-2 rounded-px-card bg-white/60 p-3">
                      <Tag tone="accent">{e.area}</Tag>
                      <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-px-ink/80">{e.estrategia}</p>
                      <Tag tone={e.impacto === "Alto" ? "danger" : "warn"}>Impacto {e.impacto.toLowerCase()}</Tag>
                    </li>
                  ))}
                </ul>
              </div>

              {plano.indicadores_semanais?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-[13.5px] font-semibold text-px-ink">Indicadores para ver toda semana</h3>
                  <ul className="list-disc space-y-1 pl-5 text-[13px] text-px-ink/80">
                    {plano.indicadores_semanais.map((ind, i) => <li key={i}>{ind}</li>)}
                  </ul>
                </div>
              )}

              {plano.alertas_desvio?.length > 0 && (
                <div role="note" className="rounded-px-card bg-px-warn-soft p-4">
                  <h3 className="mb-1.5 text-[13.5px] font-semibold text-px-ink">Sinais de desvio</h3>
                  <ul className="list-disc space-y-1 pl-5 text-[13px] text-px-ink/80">
                    {plano.alertas_desvio.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* Tracker mensal */}
        <Panel as="section" className="space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-px-ink">Tracker do mês</h2>
            <p className="mt-0.5 text-[12.5px] text-px-muted">Edite a meta e o realizado do mês atual. Os valores são salvos automaticamente.</p>
          </div>

          {loadingMes ? (
            <p role="status" className="py-4 text-center text-[13px] text-px-muted">Carregando metas do mês</p>
          ) : erroMes ? (
            <div className="py-4 text-center">
              <p role="alert" className="mb-3 text-[13.5px] font-semibold text-px-ink">Não foi possível carregar as metas do mês</p>
              <PxButton variant="secondary" onClick={carregarMes}>Tentar de novo</PxButton>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b border-px-ink/10 text-[12px] text-px-muted">
                      <th scope="col" className="py-2 pr-3 font-medium">Indicador</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Meta</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Realizado</th>
                      <th scope="col" className="py-2 font-medium">Andamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-px-ink/10">
                    {LINHAS.map(row => {
                      const m = metasMes[row.meta] ?? 0
                      const r = metasMes[row.real] ?? 0
                      const p = pct(r, m)
                      const s = situacao(p)
                      return (
                        <tr key={row.label}>
                          <th scope="row" className="py-2.5 pr-3 text-[13.5px] font-semibold text-px-ink">{row.label}</th>
                          <td className="py-2.5 pr-3">
                            <PxInput type="number" inputMode="decimal" min={0} aria-label={`Meta de ${row.label.toLowerCase()}`} value={m || ""} onChange={e => updateMetas(row.meta, Number(e.target.value) || 0)} className="h-9 w-28" />
                          </td>
                          <td className="py-2.5 pr-3">
                            <PxInput type="number" inputMode="decimal" min={0} aria-label={`Realizado de ${row.label.toLowerCase()}`} value={r || ""} onChange={e => updateMetas(row.real, Number(e.target.value) || 0)} className="h-9 w-28" />
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20"><Barra pct={p} label={`Andamento de ${row.label.toLowerCase()}`} /></div>
                              <span className="w-10 text-[13px] font-semibold tabular-nums text-px-ink">{p}%</span>
                              <Tag tone={s.tone}>{s.label}</Tag>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {plano && (plano.breakdown_mensal ?? []).length > 0 && (
                <div>
                  <h3 className="mb-2 text-[13.5px] font-semibold text-px-ink">Meta de faturamento por mês, segundo o plano da IA</h3>
                  <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                    {plano.breakdown_mensal.slice(0, 12).map((m, i) => (
                      <li key={m.mes} className={`rounded-px-card px-2 py-2 text-center ${i === mesAtual ? "bg-px-ink text-white" : "bg-white/60 text-px-ink"}`}>
                        <p className={`text-[12px] ${i === mesAtual ? "text-white/75" : "text-px-muted"}`}>{MESES[i]}</p>
                        <p className="text-[13px] font-semibold">{(m.meta_faturamento / 1000).toFixed(0)} mil</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Panel>

        {/* Planejamento de 90 dias */}
        <Panel as="section" className="space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-px-ink">Planejamento de 90 dias</h2>
            <p className="mt-0.5 text-[12.5px] text-px-muted">Defina 3 objetivos do trimestre com ações semanais. Esta lista não é salva: ao sair da página ela é apagada.</p>
          </div>
          {obj90.map((obj, oi) => {
            const feitas = obj.acoes.filter(a => a.feito).length
            const p = obj.acoes.length ? pct(feitas, obj.acoes.length) : 0
            return (
              <div key={oi} className="space-y-3 rounded-px-card bg-white/60 p-4">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-px-ink text-[12px] font-semibold text-white">{oi + 1}</span>
                  <PxInput aria-label={`Objetivo ${oi + 1}`} value={obj.titulo} onChange={e => updateTitulo(oi, e.target.value)} placeholder={`Objetivo ${oi + 1}`} className="h-9" />
                </div>
                <ul className="ml-8 space-y-2">
                  {obj.acoes.map((a, ai) => (
                    <li key={ai} className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 shrink-0 accent-px-ink" checked={a.feito} onChange={() => toggleAcao(oi, ai)} aria-label={`Ação ${ai + 1} do objetivo ${oi + 1} concluída`} />
                      <PxInput aria-label={`Ação ${ai + 1} do objetivo ${oi + 1}`} value={a.texto} onChange={e => updateAcao(oi, ai, e.target.value)} placeholder="Ação da semana" className={`h-9 ${a.feito ? "text-px-muted line-through" : ""}`} />
                    </li>
                  ))}
                </ul>
                <div className="ml-8 space-y-1.5">
                  <PxButton variant="quiet" size="sm" leftIcon={Plus} onClick={() => addAcao(oi)}>Adicionar ação</PxButton>
                  <Barra pct={p} label={`Progresso do objetivo ${oi + 1}`} />
                  <p className="text-[12px] text-px-muted">{feitas} de {obj.acoes.length} concluídas</p>
                </div>
              </div>
            )
          })}
        </Panel>
      </div>
    </div>
  )
}
