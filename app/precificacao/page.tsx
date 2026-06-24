"use client"

import { useState } from "react"
import { Calculator, TrendingUp, Target, Loader2, ChevronDown, ChevronUp, DollarSign, BarChart3, Lightbulb, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Benchmark {
  perfil:  string
  faixa:   string
  media:   number
}

interface AcaoValor {
  acao:              string
  impacto_estimado:  string
  prazo:             string
}

interface PrecificacaoResult {
  valor_minimo:                       number
  valor_recomendado:                  number
  valor_premium:                      number
  ponto_equilibrio:                   number
  margem_liquida_pct:                 number
  faturamento_estimado_recomendado:   number
  estrategia_reajuste:                string
  justificativa:                      string
  benchmarks_regiao:                  Benchmark[]
  acoes_para_aumentar_valor:          AcaoValor[]
  erros_comuns_precificacao:          string[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TEMPO_CONSULTA_OPTS = ["20 min", "30 min", "45 min", "60 min", "90 min"]
const POSICIONAMENTO_OPTS = [
  { id: "acessivel",     label: "Acessível",      desc: "Volume alto, ticket baixo" },
  { id: "intermediario", label: "Intermediário",  desc: "Equilíbrio volume/valor" },
  { id: "premium",       label: "Premium",        desc: "Qualidade percebida alta" },
  { id: "ultra",         label: "Ultra-premium",  desc: "Exclusivo, agenda seletiva" },
]

const LOADING_PHRASES = [
  "Analisando mercado da sua cidade...",
  "Calculando ponto de equilíbrio...",
  "Comparando benchmarks regionais...",
  "Identificando oportunidades de aumento...",
  "Gerando estratégia de reajuste...",
  "Finalizando relatório de precificação...",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SliderField({
  label, value, onChange, min, max, step = 1, suffix = "",
}: {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step?: number; suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">{label}</label>
        <span className="text-sm font-semibold text-text-primary font-mono">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-accent"
      />
      <div className="flex justify-between text-[10px] text-text-muted font-mono">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  )
}

function CostField({
  label, value, onChange,
}: {
  label: string; value: number; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-mono">R$</span>
        <input
          type="number"
          min={0}
          value={value || ""}
          onChange={e => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="w-full bg-[--surface] border border-[--border] rounded-lg pl-9 pr-3 py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>
    </div>
  )
}

function ValueCard({
  label, value, desc, color, big = false,
}: {
  label: string; value: number; desc: string; color: string; big?: boolean
}) {
  return (
    <div className={cn(
      "rounded-xl border p-5 flex flex-col gap-2",
      big ? "border-accent/30 bg-accent/5" : "border-[--border] bg-[--surface]"
    )}>
      <span className={cn("text-[10px] font-mono uppercase tracking-widest", color)}>{label}</span>
      <span className={cn("font-bold tracking-tight", big ? "text-3xl text-accent" : "text-2xl text-text-primary")}>
        {fmt(value)}
      </span>
      <span className="text-[11px] text-text-muted leading-relaxed">{desc}</span>
    </div>
  )
}

function Section({
  icon: Icon, title, children, defaultOpen = false,
}: {
  icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean
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

// ─── Simulator ───────────────────────────────────────────────────────────────

function Simulator({
  result, consultasMes,
}: {
  result: PrecificacaoResult; consultasMes: number
}) {
  const [preco, setPreco]           = useState(result.valor_recomendado)
  const [ocupacao, setOcupacao]     = useState(80)
  const consultasEfetivas           = Math.round(consultasMes * ocupacao / 100)
  const faturamento                 = consultasEfetivas * preco

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SliderField
          label="Preço da consulta"
          value={preco}
          onChange={setPreco}
          min={result.valor_minimo}
          max={result.valor_premium + 200}
          step={10}
          suffix=""
        />
        <SliderField
          label="Taxa de ocupação"
          value={ocupacao}
          onChange={setOcupacao}
          min={20} max={100} suffix="%"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        <div className="rounded-lg bg-[--surface] border border-[--border] p-3 text-center">
          <p className="text-[10px] font-mono text-text-muted uppercase mb-1">Consultas/mês</p>
          <p className="text-lg font-bold text-text-primary font-mono">{consultasEfetivas}</p>
        </div>
        <div className="rounded-lg bg-[--surface] border border-[--border] p-3 text-center">
          <p className="text-[10px] font-mono text-text-muted uppercase mb-1">Faturamento</p>
          <p className="text-lg font-bold text-accent font-mono">{fmt(faturamento)}</p>
        </div>
        <div className="rounded-lg bg-[--surface] border border-[--border] p-3 text-center">
          <p className="text-[10px] font-mono text-text-muted uppercase mb-1">vs. Recomendado</p>
          <p className={cn("text-lg font-bold font-mono", faturamento >= result.faturamento_estimado_recomendado ? "text-emerald-400" : "text-red-400")}>
            {faturamento >= result.faturamento_estimado_recomendado ? "+" : ""}{fmt(faturamento - result.faturamento_estimado_recomendado)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PrecificacaoPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [result, setResult] = useState<PrecificacaoResult | null>(null)
  const [error, setError]   = useState("")

  // Form state
  const [especialidade,      setEspecialidade]      = useState("")
  const [cidade,             setCidade]             = useState("")
  const [tempoConsulta,      setTempoConsulta]      = useState("30 min")
  const [anosExp,            setAnosExp]            = useState(5)
  const [consultasDia,       setConsultasDia]       = useState(8)
  const [diasMes,            setDiasMes]            = useState(20)
  const [custoAluguel,       setCustoAluguel]       = useState(0)
  const [custoFuncionarios,  setCustoFuncionarios]  = useState(0)
  const [custoSistemas,      setCustoSistemas]      = useState(0)
  const [custoMarketing,     setCustoMarketing]     = useState(0)
  const [custoOutros,        setCustoOutros]        = useState(0)
  const [posicionamento,     setPosicionamento]     = useState("intermediario")

  const custoTotal    = custoAluguel + custoFuncionarios + custoSistemas + custoMarketing + custoOutros
  const consultasMes  = consultasDia * diasMes
  const canSubmit     = especialidade.trim().length > 0 && cidade.trim().length > 0

  async function handleSubmit() {
    if (!canSubmit) return
    setError("")
    setStep(2)
    setPhraseIdx(0)

    const interval = setInterval(() =>
      setPhraseIdx(i => (i + 1) % LOADING_PHRASES.length), 2000)

    try {
      const res = await fetch("/api/precificacao", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          especialidade,
          cidade,
          tempo_consulta:      tempoConsulta,
          anos_experiencia:    anosExp,
          consultas_dia:       consultasDia,
          dias_mes:            diasMes,
          custo_aluguel:       custoAluguel,
          custo_funcionarios:  custoFuncionarios,
          custo_sistemas:      custoSistemas,
          custo_marketing:     custoMarketing,
          custo_outros:        custoOutros,
          posicionamento,
        }),
      })
      const data = await res.json()
      clearInterval(interval)
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao calcular precificação")
        setStep(1)
        return
      }
      setResult(data as PrecificacaoResult)
      setStep(3)
    } catch (e) {
      console.error("[precificacao] erro ao calcular precificação:", e)
      clearInterval(interval)
      setError("Erro de conexão. Tente novamente.")
      setStep(1)
    }
  }

  // ── Step 2: Loading ──
  if (step === 2) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[70vh] gap-8">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Calculator className="w-8 h-8 text-accent animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-text-primary">Calculando sua precificação...</h2>
          <p className="text-sm text-text-muted font-mono">{LOADING_PHRASES[phraseIdx]}</p>
        </div>
        <div className="flex gap-2">
          {LOADING_PHRASES.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-500",
                i === phraseIdx ? "bg-accent scale-125" : "bg-[--border]"
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Step 3: Results ──
  if (step === 3 && result) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-8 pb-0">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Precificação Estratégica</h1>
            <p className="text-sm text-text-muted mt-1 font-mono">
              {especialidade} · {cidade} · {tempoConsulta} · {posicionamento}
            </p>
          </div>
          <button
            onClick={() => { setStep(1); setResult(null) }}
            className="text-xs font-mono border border-[--border] px-3 py-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:border-accent/30 transition-colors"
          >
            Recalcular
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ValueCard
              label="Valor Mínimo"
              value={result.valor_minimo}
              desc="Ponto de equilíbrio + margem mínima. Abaixo disso você trabalha no prejuízo."
              color="text-red-400"
            />
            <ValueCard
              label="Valor Recomendado"
              value={result.valor_recomendado}
              desc="Preço ideal para seu perfil, mercado e posicionamento desejado."
              color="text-accent"
              big
            />
            <ValueCard
              label="Valor Premium"
              value={result.valor_premium}
              desc="Teto realista para sua especialidade e cidade. Meta de médio prazo."
              color="text-purple-400"
            />
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Ponto de equilíbrio",     value: fmt(result.ponto_equilibrio),                         note: "por consulta" },
              { label: "Margem líquida est.",      value: `${result.margem_liquida_pct}%`,                     note: "no recomendado" },
              { label: "Faturamento est.",         value: fmt(result.faturamento_estimado_recomendado),         note: "/mês" },
              { label: "Custo total mensal",       value: fmt(custoTotal),                                      note: "seus dados" },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-[--border] bg-[--surface] p-4">
                <p className="text-[10px] font-mono text-text-muted uppercase tracking-wide">{k.label}</p>
                <p className="text-xl font-bold text-text-primary mt-1">{k.value}</p>
                <p className="text-[10px] text-text-muted mt-0.5 font-mono">{k.note}</p>
              </div>
            ))}
          </div>

          {/* Simulator */}
          <Section icon={Calculator} title="Simulador Interativo" defaultOpen>
            <Simulator result={result} consultasMes={consultasMes} />
          </Section>

          {/* Benchmarks */}
          <Section icon={BarChart3} title="Benchmark Regional" defaultOpen>
            <div className="space-y-2">
              {result.benchmarks_regiao.map((b, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[--border] last:border-0">
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">{b.perfil}</p>
                    <p className="text-[11px] text-text-muted font-mono">{b.faixa}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-accent font-mono">{fmt(b.media)}</p>
                    <p className="text-[10px] text-text-muted font-mono">média</p>
                  </div>
                  <div className="w-24 h-1.5 bg-[--border] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${Math.min((b.media / (result.valor_premium + 200)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Justificativa */}
          <Section icon={Target} title="Justificativa da Precificação">
            <p className="text-sm text-text-secondary leading-relaxed">{result.justificativa}</p>
          </Section>

          {/* Estratégia de reajuste */}
          <Section icon={TrendingUp} title="Estratégia de Reajuste">
            <p className="text-sm text-text-secondary leading-relaxed">{result.estrategia_reajuste}</p>
          </Section>

          {/* Ações para aumentar valor */}
          <Section icon={Lightbulb} title="Ações para Aumentar Seu Valor Percebido">
            <div className="space-y-3">
              {result.acoes_para_aumentar_valor.map((a, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-[--surface] border border-[--border]">
                  <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-accent">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{a.acao}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] font-mono text-emerald-400">{a.impacto_estimado}</span>
                      <span className="text-[10px] font-mono text-text-muted">⏱ {a.prazo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Erros comuns */}
          <Section icon={AlertCircle} title="Erros Comuns a Evitar">
            <ul className="space-y-2">
              {result.erros_comuns_precificacao.map((e, i) => (
                <li key={i} className="flex gap-2 text-sm text-text-secondary">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                  {e}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    )
  }

  // ── Step 1: Form ──
  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Precificação Estratégica" />
      <div className="p-4 md:p-8 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Precificação Inteligente</h1>
            <p className="text-sm text-text-muted font-mono">EXECUTIVO · CALCULADORA ESTRATÉGICA</p>
            <p className="text-[12px] text-text-secondary mt-1.5">Calcule o preço ideal dos seus procedimentos com base em custos e benchmark regional.</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-8 max-w-3xl w-full">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Perfil */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px]">1</span>
            Perfil Profissional
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Especialidade *</label>
              <input
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                placeholder="Ex: Dermatologista, Cardiologista..."
                className="w-full bg-[--surface] border border-[--border] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Cidade *</label>
              <input
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="Ex: São Paulo - SP"
                className="w-full bg-[--surface] border border-[--border] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Tempo de consulta</label>
            <div className="flex flex-wrap gap-2">
              {TEMPO_CONSULTA_OPTS.map(t => (
                <button
                  key={t}
                  onClick={() => setTempoConsulta(t)}
                  className={cn(
                    "text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all",
                    tempoConsulta === t
                      ? "bg-accent/10 border-accent/40 text-accent font-semibold"
                      : "border-[--border] text-text-muted hover:text-text-secondary"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <SliderField label="Anos de experiência" value={anosExp} onChange={setAnosExp} min={0} max={30} suffix=" anos" />
        </div>

        {/* Agenda */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px]">2</span>
            Capacidade de Agenda
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SliderField label="Consultas por dia" value={consultasDia} onChange={setConsultasDia} min={1} max={20} />
            <SliderField label="Dias de trabalho/mês" value={diasMes} onChange={setDiasMes} min={4} max={26} />
          </div>
          <div className="text-center py-3 rounded-lg bg-accent/5 border border-accent/15">
            <span className="text-[11px] font-mono text-text-muted">Capacidade total: </span>
            <span className="text-sm font-bold text-accent font-mono">{consultasMes} consultas/mês</span>
          </div>
        </div>

        {/* Custos */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px]">3</span>
            Custos Operacionais Mensais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <CostField label="Aluguel / espaço"    value={custoAluguel}      onChange={setCustoAluguel} />
            <CostField label="Funcionários"         value={custoFuncionarios} onChange={setCustoFuncionarios} />
            <CostField label="Sistemas / software"  value={custoSistemas}     onChange={setCustoSistemas} />
            <CostField label="Marketing / ads"      value={custoMarketing}    onChange={setCustoMarketing} />
            <CostField label="Outros"               value={custoOutros}       onChange={setCustoOutros} />
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-text-muted uppercase tracking-wide">Total mensal</label>
              <div className="bg-[--surface] border border-accent/20 rounded-lg px-3 py-2.5 flex items-center">
                <DollarSign className="w-3.5 h-3.5 text-accent mr-1.5" />
                <span className="text-sm font-bold text-accent font-mono">
                  {custoTotal.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Posicionamento */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px]">4</span>
            Posicionamento Desejado
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {POSICIONAMENTO_OPTS.map(p => (
              <button
                key={p.id}
                onClick={() => setPosicionamento(p.id)}
                className={cn(
                  "text-left rounded-xl border p-3 transition-all",
                  posicionamento === p.id
                    ? "border-accent/40 bg-accent/5"
                    : "border-[--border] hover:border-[--border-hover]"
                )}
              >
                <p className={cn("text-sm font-semibold", posicionamento === p.id ? "text-accent" : "text-text-primary")}>
                  {p.label}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
            canSubmit
              ? "bg-accent text-[--background] hover:bg-accent/90"
              : "bg-[--surface] border border-[--border] text-text-muted cursor-not-allowed"
          )}
        >
          <Calculator className="w-4 h-4" />
          Calcular Precificação Estratégica
        </button>
      </div>
    </div>
  )
}
