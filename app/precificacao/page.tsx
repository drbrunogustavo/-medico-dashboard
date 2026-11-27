"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Panel, PxButton, Segmented, Field, PxInput, PageHeader } from "@/components/px"

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Benchmark { perfil: string; faixa: string; media: number }
interface AcaoValor { acao: string; impacto_estimado: string; prazo: string }

interface PrecificacaoResult {
  valor_minimo:                     number
  valor_recomendado:                number
  valor_premium:                    number
  ponto_equilibrio:                 number
  margem_liquida_pct:               number
  faturamento_estimado_recomendado: number
  estrategia_reajuste:              string
  justificativa:                    string
  benchmarks_regiao:                Benchmark[]
  acoes_para_aumentar_valor:        AcaoValor[]
  erros_comuns_precificacao:        string[]
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const TEMPO_CONSULTA_OPTS = ["20 min", "30 min", "45 min", "60 min", "90 min"]
const POSICIONAMENTO_OPTS = [
  { id: "acessivel",     label: "Acessível",     desc: "Volume alto, ticket baixo" },
  { id: "intermediario", label: "Intermediário", desc: "Equilíbrio entre volume e valor" },
  { id: "premium",       label: "Premium",       desc: "Qualidade percebida alta" },
  { id: "ultra",         label: "Ultra-premium", desc: "Exclusivo, agenda seletiva" },
]

const LOADING_PHRASES = [
  "Analisando o mercado da sua cidade",
  "Calculando o ponto de equilíbrio",
  "Comparando benchmarks regionais",
  "Identificando oportunidades de aumento",
  "Gerando a estratégia de reajuste",
  "Finalizando o relatório de precificação",
]

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

const areaTitulo = "text-[15px] font-semibold text-px-ink"

// ─── Componentes ─────────────────────────────────────────────────────────────

function SliderField({ label, value, onChange, min, max, step = 1, suffix = "" }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string
}) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-px-ink">{label}</label>
        <span className="text-[14px] font-semibold text-px-ink">{value}{suffix}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-px-ink/15 accent-px-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40" />
      <div className="flex justify-between text-[12px] text-px-muted"><span>{min}{suffix}</span><span>{max}{suffix}</span></div>
    </div>
  )
}

function CostField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-px-muted">R$</span>
        <PxInput id={id} type="number" min={0} inputMode="decimal" value={value || ""} placeholder="0" className="pl-9"
          onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))} />
      </div>
    </Field>
  )
}

function Secao({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <Panel as="section" className="p-0">
      <h2>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between gap-3 rounded-px-panel p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">
          <span className={areaTitulo}>{title}</span>
          {open ? <ChevronUp className="h-4 w-4 text-px-muted" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 text-px-muted" aria-hidden="true" />}
        </button>
      </h2>
      {open && <div id={id} className="border-t border-px-ink/10 p-4">{children}</div>}
    </Panel>
  )
}

function Simulador({ result, consultasMes }: { result: PrecificacaoResult; consultasMes: number }) {
  const max = result.valor_premium + 200
  const [preco,    setPreco]    = useState(Math.min(Math.max(result.valor_recomendado, result.valor_minimo), max))
  const [ocupacao, setOcupacao] = useState(80)
  const consultasEfetivas = Math.round(consultasMes * ocupacao / 100)
  const faturamento       = consultasEfetivas * preco
  const diff              = faturamento - result.faturamento_estimado_recomendado

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SliderField label="Preço da consulta" value={preco} onChange={setPreco} min={result.valor_minimo} max={max} step={10} />
        <SliderField label="Taxa de ocupação" value={ocupacao} onChange={setOcupacao} min={20} max={100} suffix="%" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-px-card bg-px-ink/[0.05] p-3 text-center">
          <p className="text-[12.5px] text-px-muted">Consultas por mês</p>
          <p className="text-[20px] font-semibold text-px-ink">{consultasEfetivas}</p>
        </div>
        <div className="rounded-px-card bg-px-ink/[0.05] p-3 text-center">
          <p className="text-[12.5px] text-px-muted">Faturamento</p>
          <p className="text-[20px] font-semibold text-px-ink">{fmt(faturamento)}</p>
        </div>
        <div className="rounded-px-card bg-px-ink/[0.05] p-3 text-center">
          <p className="text-[12.5px] text-px-muted">Diferença para o recomendado</p>
          <p className={`text-[20px] font-semibold ${diff < 0 ? "text-px-danger" : "text-px-ink"}`}>{diff > 0 ? "+" : ""}{fmt(diff)}</p>
        </div>
      </div>
    </div>
  )
}

function ValorCard({ label, value, desc, destaque = false }: { label: string; value: number; desc: string; destaque?: boolean }) {
  return (
    <Panel as="div" tone={destaque ? "dark" : "light"} className="flex flex-col gap-1.5">
      <span className={`text-[13px] font-medium ${destaque ? "text-white/75" : "text-px-muted"}`}>{label}</span>
      <span className={`font-semibold tracking-[-0.02em] ${destaque ? "text-[32px] text-white" : "text-[26px] text-px-ink"}`}>{fmt(value)}</span>
      <span className={`text-[12.5px] leading-relaxed ${destaque ? "text-white/75" : "text-px-muted"}`}>{desc}</span>
    </Panel>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function PrecificacaoPage() {
  const [step, setStep]           = useState<1 | 2 | 3>(1)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [result, setResult]       = useState<PrecificacaoResult | null>(null)
  const [error, setError]         = useState("")
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const [especialidade,     setEspecialidade]     = useState("")
  const [cidade,            setCidade]            = useState("")
  const [tempoConsulta,     setTempoConsulta]     = useState("30 min")
  const [anosExp,           setAnosExp]           = useState(5)
  const [consultasDia,      setConsultasDia]      = useState(8)
  const [diasMes,           setDiasMes]           = useState(20)
  const [custoAluguel,      setCustoAluguel]      = useState(0)
  const [custoFuncionarios, setCustoFuncionarios] = useState(0)
  const [custoSistemas,     setCustoSistemas]     = useState(0)
  const [custoMarketing,    setCustoMarketing]    = useState(0)
  const [custoOutros,       setCustoOutros]       = useState(0)
  const [posicionamento,    setPosicionamento]    = useState("intermediario")

  const custoTotal   = custoAluguel + custoFuncionarios + custoSistemas + custoMarketing + custoOutros
  const consultasMes = consultasDia * diasMes
  const canSubmit    = especialidade.trim().length > 0 && cidade.trim().length > 0

  const parar = () => { if (timer.current) { clearInterval(timer.current); timer.current = null } }
  useEffect(() => parar, [])

  async function handleSubmit() {
    if (!canSubmit) return
    setError(""); setStep(2); setPhraseIdx(0)
    parar()
    timer.current = setInterval(() => setPhraseIdx(i => (i + 1) % LOADING_PHRASES.length), 2000)

    try {
      const res = await fetch("/api/precificacao", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          especialidade, cidade,
          tempo_consulta:     tempoConsulta,
          anos_experiencia:   anosExp,
          consultas_dia:      consultasDia,
          dias_mes:           diasMes,
          custo_aluguel:      custoAluguel,
          custo_funcionarios: custoFuncionarios,
          custo_sistemas:     custoSistemas,
          custo_marketing:    custoMarketing,
          custo_outros:       custoOutros,
          posicionamento,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) { setError(data.error ?? "Não foi possível calcular a precificação. Tente novamente."); setStep(1); return }
      setResult(data as PrecificacaoResult)
      setStep(3)
    } catch (e) {
      console.error("[precificacao] erro ao calcular precificação:", e)
      setError("Erro de conexão. Tente novamente.")
      setStep(1)
    } finally { parar() }
  }

  // ── Carregando ──
  if (step === 2) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Precificação" caption="Calculando" />
        <div className="px-4 py-24 text-center md:px-10">
          <p role="status" className="text-[16px] font-semibold text-px-ink">Calculando sua precificação</p>
          <p className="mt-1.5 text-[13.5px] text-px-muted">{LOADING_PHRASES[phraseIdx]}</p>
        </div>
      </div>
    )
  }

  // ── Resultado ──
  if (step === 3 && result) {
    const posLabel = POSICIONAMENTO_OPTS.find(p => p.id === posicionamento)?.label ?? posicionamento
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Precificação"
          caption={`${especialidade}, ${cidade}, consulta de ${tempoConsulta}, perfil ${posLabel.toLowerCase()}`}
          actions={<PxButton variant="secondary" size="sm" onClick={() => { setStep(1); setResult(null) }}>Recalcular</PxButton>}
        />
        <div className="max-w-5xl space-y-4 px-4 pb-10 md:px-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ValorCard label="Valor mínimo" value={result.valor_minimo} desc="Ponto de equilíbrio mais margem mínima. Abaixo disso a consulta dá prejuízo." />
            <ValorCard label="Valor recomendado" value={result.valor_recomendado} desc="Preço ideal para seu perfil, mercado e posicionamento." destaque />
            <ValorCard label="Valor premium" value={result.valor_premium} desc="Teto realista para sua especialidade e cidade. Meta de médio prazo." />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Ponto de equilíbrio",  value: fmt(result.ponto_equilibrio),                 note: "por consulta" },
              { label: "Margem líquida",       value: `${result.margem_liquida_pct}%`,              note: "estimada no valor recomendado" },
              { label: "Faturamento",          value: fmt(result.faturamento_estimado_recomendado), note: "estimado por mês" },
              { label: "Custo total mensal",   value: fmt(custoTotal),                              note: "informado por você" },
            ].map(k => (
              <Panel as="div" key={k.label} className="p-4">
                <p className="text-[12.5px] text-px-muted">{k.label}</p>
                <p className="mt-1 text-[20px] font-semibold leading-none text-px-ink">{k.value}</p>
                <p className="mt-1.5 text-[12px] text-px-muted">{k.note}</p>
              </Panel>
            ))}
          </div>

          <Secao title="Simulador" defaultOpen><Simulador result={result} consultasMes={consultasMes} /></Secao>

          <Secao title="Benchmark regional" defaultOpen>
            <ul className="divide-y divide-px-ink/10">
              {(result.benchmarks_regiao ?? []).map((b, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] text-px-ink">{b.perfil}</p>
                    <p className="text-[12.5px] text-px-muted">{b.faixa}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-semibold text-px-ink">{fmt(b.media)}</p>
                    <p className="text-[12px] text-px-muted">média</p>
                  </div>
                  <div aria-hidden="true" className="h-1.5 w-24 overflow-hidden rounded-full bg-px-ink/10">
                    <div className="h-full rounded-full bg-px-ink" style={{ width: `${Math.min((b.media / (result.valor_premium + 200)) * 100, 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Secao>

          <Secao title="Justificativa"><p className="text-[13.5px] leading-relaxed text-px-ink/80">{result.justificativa}</p></Secao>
          <Secao title="Estratégia de reajuste"><p className="text-[13.5px] leading-relaxed text-px-ink/80">{result.estrategia_reajuste}</p></Secao>

          <Secao title="Ações para aumentar o valor percebido">
            <ol className="space-y-2.5">
              {(result.acoes_para_aumentar_valor ?? []).map((a, i) => (
                <li key={i} className="flex gap-3 rounded-px-card bg-px-ink/[0.04] p-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-px-ink text-[12px] font-semibold text-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] text-px-ink">{a.acao}</p>
                    <p className="mt-1 text-[12.5px] text-px-muted">Impacto: {a.impacto_estimado}. Prazo: {a.prazo}.</p>
                  </div>
                </li>
              ))}
            </ol>
          </Secao>

          <Secao title="Erros comuns a evitar">
            <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-px-ink/80">
              {(result.erros_comuns_precificacao ?? []).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </Secao>
        </div>
      </div>
    )
  }

  // ── Formulário ──
  return (
    <div className="animate-fade-in">
      <PageHeader title="Precificação" caption="Preço ideal da consulta, com base nos seus custos e no mercado da sua cidade" />
      <div className="max-w-3xl space-y-4 px-4 pb-10 md:px-10">
        {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>}

        <Panel as="section" className="space-y-4">
          <h2 className={areaTitulo}>Perfil profissional</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Especialidade" htmlFor="pr-esp"><PxInput id="pr-esp" value={especialidade} onChange={e => setEspecialidade(e.target.value)} placeholder="Dermatologista, cardiologista" required /></Field>
            <Field label="Cidade" htmlFor="pr-cid"><PxInput id="pr-cid" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="São Paulo, SP" required /></Field>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Tempo de consulta</p>
            <Segmented label="Tempo de consulta" value={tempoConsulta} onChange={setTempoConsulta} options={TEMPO_CONSULTA_OPTS.map(t => ({ value: t, label: t }))} />
          </div>
          <SliderField label="Anos de experiência" value={anosExp} onChange={setAnosExp} min={0} max={30} suffix=" anos" />
        </Panel>

        <Panel as="section" className="space-y-4">
          <h2 className={areaTitulo}>Capacidade de agenda</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SliderField label="Consultas por dia" value={consultasDia} onChange={setConsultasDia} min={1} max={20} />
            <SliderField label="Dias de trabalho por mês" value={diasMes} onChange={setDiasMes} min={4} max={26} />
          </div>
          <p className="rounded-px-card bg-px-ink/[0.05] py-3 text-center text-[13.5px] text-px-ink">
            Capacidade total: <span className="font-semibold">{consultasMes} consultas por mês</span>
          </p>
        </Panel>

        <Panel as="section" className="space-y-4">
          <h2 className={areaTitulo}>Custos operacionais mensais</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <CostField label="Aluguel ou espaço"    value={custoAluguel}      onChange={setCustoAluguel} />
            <CostField label="Funcionários"         value={custoFuncionarios} onChange={setCustoFuncionarios} />
            <CostField label="Sistemas e software"  value={custoSistemas}     onChange={setCustoSistemas} />
            <CostField label="Marketing e anúncios" value={custoMarketing}    onChange={setCustoMarketing} />
            <CostField label="Outros"               value={custoOutros}       onChange={setCustoOutros} />
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-px-ink">Total mensal</p>
              <p data-testid="custo-total" className="flex h-11 items-center rounded-px-ctl bg-px-ink/[0.05] px-3.5 text-[14px] font-semibold text-px-ink">{fmt(custoTotal)}</p>
            </div>
          </div>
        </Panel>

        <Panel as="section" className="space-y-3">
          <h2 className={areaTitulo}>Posicionamento desejado</h2>
          <div role="group" aria-label="Posicionamento desejado" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {POSICIONAMENTO_OPTS.map(p => {
              const ativo = posicionamento === p.id
              return (
                <button key={p.id} type="button" aria-pressed={ativo} onClick={() => setPosicionamento(p.id)}
                  className={`rounded-px-card border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${ativo ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>
                  <span className="block text-[14px] font-semibold">{p.label}</span>
                  <span className={`mt-0.5 block text-[12.5px] ${ativo ? "text-white/75" : "text-px-muted"}`}>{p.desc}</span>
                </button>
              )
            })}
          </div>
        </Panel>

        <PxButton fullWidth onClick={handleSubmit} disabled={!canSubmit}>Calcular precificação</PxButton>
        {!canSubmit && <p className="text-center text-[12.5px] text-px-muted">Informe especialidade e cidade para calcular.</p>}
      </div>
    </div>
  )
}
