"use client"

import { useEffect, useRef, useState } from "react"
import { Panel, PxButton, Segmented, Tag, PageHeader } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Pergunta { id: string; texto: string }
interface Dimensao  { id: string; titulo: string; perguntas: Pergunta[] }

interface PlanoResult {
  classificacao:       string
  resumo_diagnostico:  string
  top3_prioridades:    { prioridade: number; titulo: string; descricao: string; impacto: string }[]
  plano_90_dias: {
    mes1: { semana: string; acao: string }[]
    mes2: { semana: string; acao: string }[]
    mes3: { semana: string; acao: string }[]
  }
  quick_wins: string[]
  _scores?:     Record<string, number>
  _scoreGeral?: number
}

// ─── Perguntas ───────────────────────────────────────────────────────────────

const DIMENSOES: Dimensao[] = [
  {
    id: "marketing", titulo: "Marketing",
    perguntas: [
      { id: "mkt1", texto: "Você produz conteúdo regularmente?" },
      { id: "mkt2", texto: "Tem estratégia de captação de leads?" },
      { id: "mkt3", texto: "Usa WhatsApp para nurturing de leads?" },
      { id: "mkt4", texto: "Tem página de captura ou link bio otimizado?" },
      { id: "mkt5", texto: "Analisa métricas do Instagram regularmente?" },
      { id: "mkt6", texto: "Tem calendário editorial definido?" },
      { id: "mkt7", texto: "Investe em tráfego pago?" },
      { id: "mkt8", texto: "Tem posicionamento de marca definido?" },
    ],
  },
  {
    id: "comercial", titulo: "Comercial",
    perguntas: [
      { id: "com1", texto: "Sua recepção tem script de atendimento?" },
      { id: "com2", texto: "Você acompanha taxa de conversão de leads?" },
      { id: "com3", texto: "Tem processo de follow-up de leads?" },
      { id: "com4", texto: "Oferece protocolos de tratamento premium?" },
      { id: "com5", texto: "Tem programa de indicações estruturado?" },
      { id: "com6", texto: "Acompanha taxa de faltas e faz recuperação?" },
    ],
  },
  {
    id: "financeiro", titulo: "Financeiro",
    perguntas: [
      { id: "fin1", texto: "Conhece seu ticket médio atual?" },
      { id: "fin2", texto: "Acompanha faturamento mensalmente?" },
      { id: "fin3", texto: "Tem metas financeiras definidas?" },
      { id: "fin4", texto: "Calcula custo por paciente adquirido?" },
      { id: "fin5", texto: "Tem reserva de emergência do consultório?" },
      { id: "fin6", texto: "Planeja investimentos anualmente?" },
    ],
  },
  {
    id: "experiencia", titulo: "Experiência",
    perguntas: [
      { id: "exp1", texto: "Tem processo de boas-vindas para novos pacientes?" },
      { id: "exp2", texto: "Envia lembretes de consulta automaticamente?" },
      { id: "exp3", texto: "Faz pesquisa de satisfação (NPS)?" },
      { id: "exp4", texto: "Tem régua de relacionamento pós-consulta?" },
      { id: "exp5", texto: "Oferece experiência premium no consultório?" },
      { id: "exp6", texto: "Tem programa de fidelização de pacientes?" },
    ],
  },
  {
    id: "gestao", titulo: "Gestão",
    perguntas: [
      { id: "ges1", texto: "Tem SOPs documentados para os processos principais?" },
      { id: "ges2", texto: "Usa sistema de CRM para gerenciar pacientes?" },
      { id: "ges3", texto: "Tem indicadores de desempenho (KPIs)?" },
      { id: "ges4", texto: "Avalia sua equipe periodicamente?" },
      { id: "ges5", texto: "Tem plano de expansão definido?" },
      { id: "ges6", texto: "Delega tarefas operacionais da clínica?" },
    ],
  },
]

const SCORE_LABELS: Record<number, string> = { 1: "Não", 2: "Raramente", 3: "Às vezes", 4: "Frequentemente", 5: "Sim, sempre" }

const LOAD_PHRASES = [
  "Analisando dimensões da clínica",
  "Calculando pontuações",
  "Identificando prioridades",
  "Gerando plano de 90 dias",
  "Finalizando diagnóstico",
]

const ESCALA = [1, 2, 3, 4, 5].map(v => ({ value: String(v), label: String(v) }))

function Barra({ pct, label }: { pct: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 w-full overflow-hidden rounded-full bg-px-ink/10">
      <div className="h-full rounded-full bg-px-ink transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DiagnosticoPage() {
  const [step,       setStep]       = useState(0) // 0 intro, 1 a 5 dimensões, 6 carregando, 7 resultado
  const [respostas,  setRespostas]  = useState<Record<string, number>>({})
  const [result,     setResult]     = useState<PlanoResult | null>(null)
  const [error,      setError]      = useState("")
  const [loadPhrase, setLoadPhrase] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const parar = () => { if (timer.current) { clearInterval(timer.current); timer.current = null } }
  useEffect(() => parar, [])

  const dimAtual    = step >= 1 && step <= 5 ? DIMENSOES[step - 1] : null
  const totalPergs  = DIMENSOES.reduce((s, d) => s + d.perguntas.length, 0)
  const respondidas = Object.keys(respostas).length

  function scoreFor(dimId: string) {
    const dim = DIMENSOES.find(d => d.id === dimId)!
    const vals = dim.perguntas.map(p => respostas[p.id] ?? 0).filter(v => v > 0)
    if (!vals.length) return 0
    return Math.round((vals.reduce((s, v) => s + v, 0) / (vals.length * 5)) * 100)
  }

  const canAdvance = !!dimAtual && dimAtual.perguntas.every(p => respostas[p.id] !== undefined)

  async function finalizar() {
    const scores = Object.fromEntries(DIMENSOES.map(d => [d.titulo, scoreFor(d.id)]))
    const score_geral = Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / DIMENSOES.length)
    setError(""); setLoadPhrase(0); setStep(6)

    parar()
    timer.current = setInterval(() => setLoadPhrase(i => (i + 1) % LOAD_PHRASES.length), 1800)
    try {
      const res = await fetch("/api/diagnostico", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas, scores, score_geral }),
      })
      const data = await res.json().catch(() => ({}))
      parar()
      if (!res.ok || data.error) { setError(data.error ?? "Não foi possível gerar o diagnóstico. Tente novamente."); setStep(5); return }
      setResult({ ...data, _scores: scores, _scoreGeral: score_geral })
      setStep(7)
    } catch (e) {
      console.error("[diagnostico] erro ao gerar diagnóstico:", e)
      parar()
      setError("Erro de conexão. Suas respostas foram mantidas, tente novamente.")
      setStep(5)
    }
  }

  const radarData = DIMENSOES.map(d => ({ dimensao: d.titulo, score: scoreFor(d.id) }))
  const scoreGeral = Math.round(radarData.reduce((s, r) => s + r.score, 0) / radarData.length)

  // ── Introdução ──
  if (step === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Diagnóstico 360" caption="Análise completa da clínica com plano de ação" back />
        <div className="max-w-2xl space-y-4 px-4 pb-10 md:px-10">
          <Panel className="space-y-4">
            <h2 className="text-[18px] font-semibold text-px-ink">Descubra onde sua clínica está</h2>
            <p className="text-[13.5px] leading-relaxed text-px-ink/80">
              Responda {totalPergs} perguntas em 5 dimensões. No final você recebe seu score, a classificação da clínica e um plano de ação de 90 dias gerado por IA.
            </p>
            <ol className="grid grid-cols-5 gap-2">
              {DIMENSOES.map((d, i) => (
                <li key={d.id} className="text-center">
                  <span aria-hidden="true" className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-px-ink text-[12.5px] font-semibold text-white">{i + 1}</span>
                  <span className="text-[12px] text-px-muted">{d.titulo}</span>
                </li>
              ))}
            </ol>
          </Panel>
          <PxButton onClick={() => setStep(1)}>Iniciar diagnóstico</PxButton>
        </div>
      </div>
    )
  }

  // ── Carregando ──
  if (step === 6) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Diagnóstico 360" />
        <div className="px-4 py-20 text-center md:px-10">
          <h2 className="text-[18px] font-semibold text-px-ink">Analisando sua clínica</h2>
          <p role="status" className="mt-1.5 text-[13.5px] text-px-muted">{LOAD_PHRASES[loadPhrase]}</p>
        </div>
      </div>
    )
  }

  // ── Resultado ──
  if (step === 7 && result) {
    const sg = result._scoreGeral ?? scoreGeral
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Diagnóstico 360"
          caption={`${result.classificacao}, score ${sg} de 100`}
          actions={<PxButton variant="secondary" size="sm" onClick={() => { setStep(0); setRespostas({}); setResult(null); setError("") }}>Refazer</PxButton>}
        />

        <div className="max-w-3xl space-y-4 px-4 pb-10 md:px-10">
          <Panel as="section">
            <h2 className="mb-3 text-[15px] font-semibold text-px-ink">Pontuação por dimensão</h2>
            <ul className="space-y-3">
              {DIMENSOES.map(d => {
                const s = result._scores?.[d.titulo] ?? scoreFor(d.id)
                return (
                  <li key={d.id}>
                    <div className="mb-1.5 flex items-baseline justify-between text-[13px] text-px-ink">
                      <span>{d.titulo}</span>
                      <span className="font-semibold tabular-nums">{s} de 100</span>
                    </div>
                    <Barra pct={s} label={`Pontuação em ${d.titulo}`} />
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel>
            <p className="text-[13.5px] leading-relaxed text-px-ink/80">{result.resumo_diagnostico}</p>
          </Panel>

          {result.quick_wins?.length > 0 && (
            <Panel tone="dark" as="section">
              <h2 className="mb-3 text-[15px] font-semibold text-white">Para fazer esta semana</h2>
              <ul className="list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed text-white/85">
                {result.quick_wins.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </Panel>
          )}

          <section aria-labelledby="dg-prio" className="space-y-3">
            <h2 id="dg-prio" className="text-[15px] font-semibold text-px-ink">Três prioridades</h2>
            {result.top3_prioridades.map(p => (
              <Panel key={p.prioridade} as="article" className="flex gap-3 p-4">
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-px-ink text-[12.5px] font-semibold text-white">{p.prioridade}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-px-ink">{p.titulo}</h3>
                    <Tag tone={p.impacto === "Alto" ? "danger" : "warn"}>Impacto {p.impacto.toLowerCase()}</Tag>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-px-ink/80">{p.descricao}</p>
                </div>
              </Panel>
            ))}
          </section>

          <section aria-labelledby="dg-plano" className="space-y-3">
            <h2 id="dg-plano" className="text-[15px] font-semibold text-px-ink">Plano de ação de 90 dias</h2>
            {(["mes1", "mes2", "mes3"] as const).map((m, i) => (
              <Panel key={m} as="article" className="p-4">
                <h3 className="mb-3 text-[13.5px] font-semibold text-px-ink">Mês {i + 1}</h3>
                <ul className="space-y-2">
                  {(result.plano_90_dias?.[m] ?? []).map((a, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="w-20 shrink-0 text-[12.5px] font-medium text-px-accent">{a.semana}</span>
                      <p className="text-[13px] leading-relaxed text-px-ink/80">{a.acao}</p>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </section>

          <PxButton href="/consultor" fullWidth variant="secondary">Aprofundar a análise com o Consultor Estratégico</PxButton>
        </div>
      </div>
    )
  }

  // ── Perguntas ──
  if (!dimAtual) return null
  const progresso = Math.round((respondidas / totalPergs) * 100)

  return (
    <div className="animate-fade-in">
      <PageHeader title={dimAtual.titulo} caption={`Dimensão ${step} de 5`} back />

      <div className="max-w-2xl space-y-4 px-4 pb-10 md:px-10">
        <div className="flex items-center gap-3">
          <Barra pct={progresso} label="Perguntas respondidas" />
          <span className="shrink-0 text-[12.5px] text-px-muted">{respondidas} de {totalPergs}</span>
        </div>

        {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-2.5 text-[13px] text-px-danger">{error}</p>}

        {dimAtual.perguntas.map(p => (
          <Panel key={p.id} as="div" className="space-y-2.5 p-4">
            <p className="text-[14px] font-medium text-px-ink">{p.texto}</p>
            <Segmented
              label={p.texto}
              value={respostas[p.id] !== undefined ? String(respostas[p.id]) : ""}
              onChange={v => setRespostas(prev => ({ ...prev, [p.id]: Number(v) }))}
              options={ESCALA}
            />
            <p className="text-[12px] text-px-muted">
              {respostas[p.id] !== undefined ? SCORE_LABELS[respostas[p.id]] : "1 = Não, 5 = Sim, sempre"}
            </p>
          </Panel>
        ))}

        <div className="flex gap-3 pt-1">
          {step > 1 && <PxButton variant="secondary" fullWidth onClick={() => setStep(s => s - 1)}>Voltar</PxButton>}
          {step < 5
            ? <PxButton fullWidth disabled={!canAdvance} onClick={() => setStep(s => s + 1)}>Próxima dimensão</PxButton>
            : <PxButton fullWidth disabled={!canAdvance} onClick={finalizar}>Gerar diagnóstico</PxButton>}
        </div>
      </div>
    </div>
  )
}
