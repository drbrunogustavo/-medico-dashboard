"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Panel, PxButton, Segmented, PxInput, PageHeader, PillBars, LineSeries, BarList } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ExecData {
  faturamento_mes:   number
  faturamento_6m:    { mes: string; valor: number }[]
  leads_total:       number
  leads_semana:      number
  leads_por_estagio: { estagio: string; count: number }[]
  consultas_mes:     number
  leads_origem:      { origem: string; count: number }[]
  nps_score:         number | null
  nps_6m:            { mes: string; nps: number | null }[]
}

interface IndManuais {
  taxa_comparecimento?:        number
  taxa_fechamento_protocolos?: number
  taxa_faltas?:                number
  conversao_recepcao?:         number
  adesao_tratamento?:          number
  permanencia_media_meses?:    number
  recompra_protocolos?:        number
  engajamento_medio?:          number
  custo_marketing?:            number
}

type Aba = "financeiro" | "marketing" | "comercial" | "clinico"

const ABAS = [
  { value: "financeiro", label: "Financeiro" },
  { value: "marketing",  label: "Marketing"  },
  { value: "comercial",  label: "Comercial"  },
  { value: "clinico",    label: "Clínico"    },
] as const

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

// ─── Campo editável ──────────────────────────────────────────────────────────

function EditField({ id, label, value, onChange, suffix = "", min = 0, max = 100 }: {
  id: string; label: string; value: number | undefined; onChange: (v: number) => void
  suffix?: string; min?: number; max?: number
}) {
  const [texto, setTexto] = useState(value === undefined ? "" : String(value))
  const ultimo = useRef(value)
  useEffect(() => {
    if (value !== ultimo.current) { ultimo.current = value; setTexto(value === undefined ? "" : String(value)) }
  }, [value])

  function alterar(raw: string) {
    setTexto(raw)
    if (raw.trim() === "") return
    const n = Number(raw)
    if (!Number.isFinite(n)) return
    const limitado = Math.min(max, Math.max(min, n))
    ultimo.current = limitado
    if (limitado !== n) setTexto(String(limitado))
    onChange(limitado)
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-px-card bg-white/60 px-4 py-3">
      <label htmlFor={id} className="text-[13.5px] text-px-ink">{label}</label>
      <div className="flex items-center gap-1.5">
        <PxInput id={id} type="number" inputMode="decimal" min={min} max={max} value={texto} onChange={e => alterar(e.target.value)} placeholder="Informar" className="h-9 w-24 text-right" />
        {suffix && <span className="text-[12.5px] text-px-muted">{suffix}</span>}
      </div>
    </div>
  )
}

function Numero({ label, value, apoio }: { label: string; value: string; apoio?: string }) {
  return (
    <Panel as="div" className="p-4">
      <p className="text-[12.5px] text-px-muted">{label}</p>
      <p className="mt-1 text-[24px] font-medium leading-none tracking-[-0.02em] text-px-ink">{value}</p>
      {apoio && <p className="mt-1.5 text-[12px] text-px-muted">{apoio}</p>}
    </Panel>
  )
}

function Secao({ titulo, children, nota }: { titulo: string; children: React.ReactNode; nota?: string }) {
  return (
    <Panel as="section">
      <h2 className="mb-4 text-[15px] font-semibold text-px-ink">{titulo}</h2>
      {children}
      {nota && <p className="mt-3 text-[12.5px] text-px-muted">{nota}</p>}
    </Panel>
  )
}

function LinkIA({ href, texto }: { href: string; texto: string }) {
  return <Link href={href} className="inline-block text-[13.5px] font-semibold text-px-accent underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">{texto}</Link>
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function IndicadoresPage() {
  const [tab,       setTab]       = useState<Aba>("financeiro")
  const [exec,      setExec]      = useState<Partial<ExecData>>({})
  const [ind,       setInd]       = useState<IndManuais>({})
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saveErro,  setSaveErro]  = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true); setLoadError(false)
    try {
      const [re, ri] = await Promise.all([fetch("/api/executivo"), fetch("/api/indicadores")])
      if (!re.ok || !ri.ok) throw new Error(`HTTP ${re.status}/${ri.status}`)
      const [e, i] = await Promise.all([re.json(), ri.json()])
      setExec(e ?? {}); setInd(i ?? {})
    } catch (err) {
      console.error("[indicadores] erro ao carregar:", err)
      setLoadError(true)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const updateInd = useCallback((key: keyof IndManuais, val: number) => {
    setInd(prev => {
      const next = { ...prev, [key]: val }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        fetch("/api/indicadores", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        })
          .then(r => { if (!r.ok) throw new Error(); setSaveErro(false) })
          .catch(() => setSaveErro(true))
      }, 800)
      return next
    })
  }, [])

  // Derivados
  const consultas = exec.consultas_mes ?? 0
  const leads     = exec.leads_total ?? 0
  const ticket_medio = consultas && exec.faturamento_mes ? Math.round(exec.faturamento_mes / consultas) : 0
  const custo_lead   = ind.custo_marketing && leads ? Math.round(ind.custo_marketing / leads) : 0
  const custo_consulta = ind.custo_marketing && consultas ? Math.round(ind.custo_marketing / consultas) : 0
  const conv_lead    = leads && consultas ? Math.round((consultas / leads) * 100) : 0

  // Projeção linear simples a partir dos dois últimos meses
  const fat6 = exec.faturamento_6m ?? []
  const proj3: { rotulo: string; valor: number }[] = []
  if (fat6.length >= 2) {
    const last  = fat6[fat6.length - 1]?.valor ?? 0
    const delta = last - (fat6[fat6.length - 2]?.valor ?? 0)
    for (let i = 1; i <= 3; i++) {
      const d = new Date(); d.setMonth(d.getMonth() + i)
      proj3.push({ rotulo: `${d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")} (proj.)`, valor: Math.max(0, last + delta * i) })
    }
  }
  const barrasFat = [...fat6.map(p => ({ rotulo: p.mes, valor: p.valor })), ...proj3]

  const semDados = !(exec.faturamento_mes ?? 0) && !consultas && !leads
  const iaNota = "Edite os valores abaixo e eles são salvos automaticamente."

  let corpo: React.ReactNode
  if (loading) {
    corpo = <p role="status" className="py-20 text-center text-[13px] text-px-muted">Carregando indicadores</p>
  } else if (loadError) {
    corpo = (
      <Panel className="py-10 text-center">
        <p role="alert" className="mb-3 text-[14px] font-semibold text-px-ink">Não foi possível carregar os indicadores</p>
        <PxButton variant="secondary" onClick={carregar}>Tentar de novo</PxButton>
      </Panel>
    )
  } else if (semDados) {
    corpo = (
      <Panel className="mx-auto max-w-md py-10 text-center">
        <h2 className="text-[16px] font-semibold text-px-ink">Seus indicadores aparecem aqui</h2>
        <p className="mb-5 mt-1.5 text-[13.5px] text-px-muted">
          Documente consultas no Copiloto, adicione leads no CRM e registre lançamentos financeiros. Os números são calculados a partir desses registros.
        </p>
        <PxButton href="/copiloto">Iniciar primeira consulta</PxButton>
      </Panel>
    )
  } else {
    corpo = (
      <>
        <Segmented label="Área dos indicadores" value={tab} onChange={setTab} options={ABAS.map(a => ({ value: a.value, label: a.label }))} />

        {saveErro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-2.5 text-[13px] text-px-danger">Não foi possível salvar a última alteração. Verifique sua conexão e edite o valor de novo.</p>}

        {tab === "financeiro" && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Numero label="Faturamento do mês" value={fmt(exec.faturamento_mes ?? 0)} />
              <Numero label="Ticket médio" value={fmt(ticket_medio)} apoio="faturamento ÷ consultas" />
              <Numero label="Consultas no mês" value={String(consultas)} />
              <Numero label="Custo por lead" value={custo_lead ? fmt(custo_lead) : "Informe o custo"} apoio="marketing ÷ leads no CRM" />
            </div>
            <Secao titulo="Faturamento e projeção dos próximos 3 meses" nota="A projeção repete a variação entre os dois últimos meses. É uma tendência simples, não uma previsão.">
              {barrasFat.length > 0
                ? <PillBars data={barrasFat} label="Faturamento mensal com projeção de três meses" />
                : <p className="text-[13px] text-px-muted">Ainda não há meses de faturamento registrados.</p>}
            </Secao>
            <Panel className="space-y-2">
              <p className="text-[12.5px] text-px-muted">{iaNota}</p>
              <EditField id="ind-custo-fin" label="Custo mensal de marketing (R$)" value={ind.custo_marketing} onChange={v => updateInd("custo_marketing", v)} min={0} max={99999} />
            </Panel>
            <LinkIA href="/consultor" texto="Pedir análise financeira ao Consultor" />
          </>
        )}

        {tab === "marketing" && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Numero label="Leads no CRM" value={String(leads)} />
              <Numero label="Leads esta semana" value={String(exec.leads_semana ?? 0)} />
              <Numero label="Conversão em consulta" value={`${conv_lead}%`} apoio="consultas do mês ÷ leads no CRM" />
              <Numero label="Custo por consulta" value={custo_consulta ? fmt(custo_consulta) : "Informe o custo"} apoio="marketing ÷ consultas do mês" />
            </div>
            <Secao titulo="Leads por origem">
              {(exec.leads_origem ?? []).length > 0
                ? <BarList data={(exec.leads_origem ?? []).map(o => ({ rotulo: o.origem, valor: o.count }))} />
                : <p className="text-[13px] text-px-muted">Nenhum lead com origem registrada.</p>}
            </Secao>
            <Panel className="space-y-2">
              <p className="text-[12.5px] text-px-muted">{iaNota}</p>
              <EditField id="ind-eng" label="Engajamento médio (%)" value={ind.engajamento_medio} onChange={v => updateInd("engajamento_medio", v)} suffix="%" />
              <EditField id="ind-custo-mkt" label="Custo mensal de marketing (R$)" value={ind.custo_marketing} onChange={v => updateInd("custo_marketing", v)} min={0} max={99999} />
            </Panel>
            <LinkIA href="/consultor" texto="Pedir análise de marketing ao Consultor" />
          </>
        )}

        {tab === "comercial" && (
          <>
            <Panel className="space-y-2">
              <p className="text-[12.5px] text-px-muted">{iaNota}</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <EditField id="ind-comp"  label="Taxa de comparecimento (%)"           value={ind.taxa_comparecimento}        onChange={v => updateInd("taxa_comparecimento", v)}        suffix="%" />
                <EditField id="ind-fech"  label="Fechamento de protocolos (%)"         value={ind.taxa_fechamento_protocolos} onChange={v => updateInd("taxa_fechamento_protocolos", v)} suffix="%" />
                <EditField id="ind-falt"  label="Taxa de faltas (%)"                   value={ind.taxa_faltas}                onChange={v => updateInd("taxa_faltas", v)}                suffix="%" />
                <EditField id="ind-recep" label="Conversão da recepção (%)"            value={ind.conversao_recepcao}         onChange={v => updateInd("conversao_recepcao", v)}         suffix="%" />
              </div>
            </Panel>
            <Secao titulo="Leads por estágio do funil">
              {(exec.leads_por_estagio ?? []).length > 0
                ? <BarList data={(exec.leads_por_estagio ?? []).map(e => ({ rotulo: e.estagio, valor: e.count }))} />
                : <p className="text-[13px] text-px-muted">Nenhum lead no funil.</p>}
            </Secao>
            <LinkIA href="/consultor" texto="Pedir análise comercial ao Consultor" />
          </>
        )}

        {tab === "clinico" && (
          <>
            <Panel className="space-y-2">
              <p className="text-[12.5px] text-px-muted">{iaNota}</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <EditField id="ind-ret"  label="Taxa de retorno (%)"        value={ind.taxa_comparecimento}     onChange={v => updateInd("taxa_comparecimento", v)} suffix="%" />
                <EditField id="ind-ades" label="Adesão ao tratamento (1 a 10)" value={ind.adesao_tratamento}    onChange={v => updateInd("adesao_tratamento", v)} max={10} />
                <EditField id="ind-perm" label="Permanência média (meses)"  value={ind.permanencia_media_meses} onChange={v => updateInd("permanencia_media_meses", v)} suffix="meses" max={120} />
                <EditField id="ind-rec"  label="Recompra de protocolos (%)" value={ind.recompra_protocolos}    onChange={v => updateInd("recompra_protocolos", v)} suffix="%" />
              </div>
            </Panel>
            <div className="grid grid-cols-2 gap-3">
              <Numero label="Leads no CRM" value={String(leads)} />
              <Numero label="NPS" value={exec.nps_score !== null && exec.nps_score !== undefined ? String(exec.nps_score) : "Sem respostas"} />
            </div>
            {(exec.nps_6m ?? []).some(p => p.nps !== null) && (
              <Secao titulo="NPS ao longo do tempo">
                <LineSeries data={(exec.nps_6m ?? []).map(p => ({ rotulo: p.mes, valor: p.nps }))} label="NPS dos últimos meses" />
              </Secao>
            )}
            <LinkIA href="/consultor" texto="Pedir análise clínica ao Consultor" />
          </>
        )}
      </>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Indicadores da Clínica" caption="Números do mês para decidir o que ajustar" />
      <div className="max-w-4xl space-y-4 px-4 pb-10 md:px-10">{corpo}</div>
    </div>
  )
}
