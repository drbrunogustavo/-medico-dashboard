"use client"

import { useState } from "react"
import { ChevronRight, ChevronLeft, RotateCcw, Sparkles } from "lucide-react"
import { Panel, PxButton, Segmented, Tag, BarList, CopyButton } from "@/components/px"

interface Pergunta {
  id: string
  texto: string
  opcoes: { label: string; score: number }[]
}

interface Fator {
  id: string
  nome: string
  descricao: string
  perguntas: Pergunta[]
}

interface AiTopFator {
  nome: string
  score?: number
  mecanismo: string
  exames: string[]
  intervencoes: string[]
}

interface AiResult {
  topFatores: AiTopFator[]
  plano90dias: { mes1: string[]; mes2: string[]; mes3: string[] }
  textoParaPaciente: string
  resumoMedico: string
}

// Fatores avaliados

const FATORES: Fator[] = [
  {
    id: "ri",
    nome: "Resistência Insulínica",
    descricao: "Principal bloqueio metabólico ao emagrecimento",
    perguntas: [
      {
        id: "ri_homa",
        texto: "Qual o HOMA-IR ou insulina de jejum?",
        opcoes: [
          { label: "Normal (HOMA <2,5 / insulina <8)", score: 0 },
          { label: "Limítrofe (HOMA 2,5–4,0 / insulina 8–15)", score: 1 },
          { label: "Elevado (HOMA 4–6 / insulina 15–25)", score: 2 },
          { label: "Muito elevado (HOMA >6 / insulina >25)", score: 3 },
        ],
      },
      {
        id: "ri_ca",
        texto: "Circunferência abdominal?",
        opcoes: [
          { label: "Normal (<94 cm H / <80 cm M)", score: 0 },
          { label: "Aumentada (94–102 cm H / 80–88 cm M)", score: 1 },
          { label: "Muito aumentada (>102 cm H / >88 cm M)", score: 2 },
        ],
      },
      {
        id: "ri_craving",
        texto: "Compulsão por carboidratos / doce após refeição?",
        opcoes: [
          { label: "Raramente", score: 0 },
          { label: "Às vezes", score: 1 },
          { label: "Frequentemente", score: 2 },
          { label: "Sempre, difícil controlar", score: 3 },
        ],
      },
    ],
  },
  {
    id: "sarcopenia",
    nome: "Sarcopenia",
    descricao: "Perda de massa muscular reduz gasto energético basal",
    perguntas: [
      {
        id: "sarc_forca",
        texto: "Força muscular subjetiva (escada, carregar peso)?",
        opcoes: [
          { label: "Boa força, sem limitações", score: 0 },
          { label: "Leve redução de força", score: 1 },
          { label: "Dificuldade em esforços moderados", score: 2 },
          { label: "Fraqueza significativa no dia a dia", score: 3 },
        ],
      },
      {
        id: "sarc_proteina",
        texto: "Ingestão diária de proteína?",
        opcoes: [
          { label: ">1,6 g/kg/dia (adequado para manutenção)", score: 0 },
          { label: "1,0–1,6 g/kg/dia", score: 1 },
          { label: "<1,0 g/kg/dia", score: 2 },
          { label: "Não sabe / come muito pouca proteína", score: 3 },
        ],
      },
      {
        id: "sarc_resistido",
        texto: "Realiza exercício resistido (musculação)?",
        opcoes: [
          { label: "≥3x/semana regularmente", score: 0 },
          { label: "1–2x/semana", score: 1 },
          { label: "Raramente ou irregularmente", score: 2 },
          { label: "Não pratica", score: 3 },
        ],
      },
    ],
  },
  {
    id: "apneia",
    nome: "Apneia do Sono",
    descricao: "Desregula grelina, leptina e cortisol e bloqueia o emagrecimento",
    perguntas: [
      {
        id: "ap_ronco",
        texto: "Ronca alto / já foi reportado que para de respirar?",
        opcoes: [
          { label: "Não", score: 0 },
          { label: "Ronca levemente", score: 1 },
          { label: "Ronca alto frequentemente", score: 2 },
          { label: "Ronca alto + relatos de apneias", score: 3 },
        ],
      },
      {
        id: "ap_sono",
        texto: "Acorda cansado mesmo após dormir?",
        opcoes: [
          { label: "Raramente", score: 0 },
          { label: "Às vezes (1–2x/semana)", score: 1 },
          { label: "Frequentemente (3–5x/semana)", score: 2 },
          { label: "Quase sempre", score: 3 },
        ],
      },
      {
        id: "ap_imc",
        texto: "IMC atual?",
        opcoes: [
          { label: "<25 (normal)", score: 0 },
          { label: "25–29,9 (sobrepeso)", score: 1 },
          { label: "30–34,9 (obesidade I)", score: 2 },
          { label: "≥35 (obesidade II–III)", score: 3 },
        ],
      },
    ],
  },
  {
    id: "cortisol",
    nome: "Cortisol / Estresse",
    descricao: "Hipercortisolismo aumenta deposição de gordura visceral",
    perguntas: [
      {
        id: "cort_stress",
        texto: "Nível de estresse atual (0 = sem estresse / 10 = extremo)?",
        opcoes: [
          { label: "0–3 (baixo)", score: 0 },
          { label: "4–5 (moderado)", score: 1 },
          { label: "6–7 (alto)", score: 2 },
          { label: "8–10 (muito alto / burnout)", score: 3 },
        ],
      },
      {
        id: "cort_abd",
        texto: "Gordura abdominal predominante mesmo com peso ok?",
        opcoes: [
          { label: "Não", score: 0 },
          { label: "Leve concentração abdominal", score: 1 },
          { label: "Gordura abdominal proeminente", score: 2 },
          { label: "Gordura visceral acentuada / barriga separada de resto do corpo", score: 3 },
        ],
      },
      {
        id: "cort_emocional",
        texto: "Comer emocional (ansiedade, tédio, estresse)?",
        opcoes: [
          { label: "Raramente", score: 0 },
          { label: "1–2x/semana", score: 1 },
          { label: "3–5x/semana", score: 2 },
          { label: "Diariamente", score: 3 },
        ],
      },
    ],
  },
  {
    id: "sono",
    nome: "Sono",
    descricao: "Privação de sono aumenta grelina e reduz leptina",
    perguntas: [
      {
        id: "sono_horas",
        texto: "Quantas horas dorme por noite em média?",
        opcoes: [
          { label: "7–9h (ideal)", score: 0 },
          { label: "6–7h", score: 1 },
          { label: "5–6h", score: 2 },
          { label: "<5h", score: 3 },
        ],
      },
      {
        id: "sono_qualidade",
        texto: "Qualidade do sono?",
        opcoes: [
          { label: "Boa, acorda descansado", score: 0 },
          { label: "Regular, acorda razoável", score: 1 },
          { label: "Ruim, sono fragmentado", score: 2 },
          { label: "Péssima, insônia ou sono não reparador", score: 3 },
        ],
      },
      {
        id: "sono_horario",
        texto: "Horário de dormir habitual?",
        opcoes: [
          { label: "Antes das 23h (cronobiologia ok)", score: 0 },
          { label: "23h–00h", score: 1 },
          { label: "00h–1h", score: 2 },
          { label: "Após 1h / altamente variável", score: 3 },
        ],
      },
    ],
  },
  {
    id: "tireoidismo",
    nome: "Hipotireoidismo",
    descricao: "TSH elevado reduz termogênese e gasto metabólico basal",
    perguntas: [
      {
        id: "tsh_valor",
        texto: "TSH atual?",
        opcoes: [
          { label: "Normal (0,5–2,5 mUI/L)", score: 0 },
          { label: "Limítrofe (2,5–4,0 mUI/L)", score: 1 },
          { label: "Subclínico (4,0–10 mUI/L) sem tratamento", score: 2 },
          { label: "Elevado ou em tratamento com controle ruim", score: 3 },
        ],
      },
      {
        id: "tsh_sint",
        texto: "Sintomas de hipotireoidismo?",
        opcoes: [
          { label: "Nenhum", score: 0 },
          { label: "1–2 sintomas leves (cansaço, frio)", score: 1 },
          { label: "3–4 sintomas moderados (cabelo, peso, memória)", score: 2 },
          { label: "Sintomas intensos ou múltiplos", score: 3 },
        ],
      },
    ],
  },
  {
    id: "hormonal",
    nome: "Menopausa / Andropausa",
    descricao: "Queda hormonal redistribui gordura e reduz massa muscular",
    perguntas: [
      {
        id: "horm_fase",
        texto: "Fase hormonal atual?",
        opcoes: [
          { label: "Pré-menopausa / jovem / hormônios normais", score: 0 },
          { label: "Perimenopausa / andropausa leve", score: 1 },
          { label: "Pós-menopausa / hipogonadismo moderado sem TRH", score: 2 },
          { label: "Pós-menopausa / hipogonadismo grave sem TRH", score: 3 },
        ],
      },
      {
        id: "horm_sint",
        texto: "Sintomas hormonais afetam o peso?",
        opcoes: [
          { label: "Não", score: 0 },
          { label: "Levemente (fogachos, humor)", score: 1 },
          { label: "Moderadamente (ganho de peso abdominal, sarcopenia)", score: 2 },
          { label: "Intensamente, peso não controlável mesmo com dieta", score: 3 },
        ],
      },
    ],
  },
  {
    id: "comportamento",
    nome: "Comportamento Alimentar",
    descricao: "Compulsão alimentar e restrição cíclica sabotam qualquer protocolo",
    perguntas: [
      {
        id: "comp_compulsao",
        texto: "Episódios de compulsão alimentar (comer muito, rápido, sem fome)?",
        opcoes: [
          { label: "Nunca ou raramente", score: 0 },
          { label: "1x/semana", score: 1 },
          { label: "2–3x/semana", score: 2 },
          { label: "Diariamente ou quase", score: 3 },
        ],
      },
      {
        id: "comp_restricao",
        texto: "Histórico de dietas restritivas extremas?",
        opcoes: [
          { label: "Não", score: 0 },
          { label: "1–2 dietas restritivas no passado", score: 1 },
          { label: "Várias dietas sem sucesso duradouro", score: 2 },
          { label: "Ciclos frequentes de dieta + reganho (yo-yo)", score: 3 },
        ],
      },
      {
        id: "comp_noite",
        texto: "Comer excessivo à noite ou após jantar?",
        opcoes: [
          { label: "Raramente", score: 0 },
          { label: "Às vezes", score: 1 },
          { label: "Frequentemente", score: 2 },
          { label: "Sempre, a maior parte das calorias é à noite", score: 3 },
        ],
      },
    ],
  },
  {
    id: "inflamacao",
    nome: "Inflamação / Gut Health",
    descricao: "Inflamação crônica e disbiose bloqueiam sinalização hormonal do peso",
    perguntas: [
      {
        id: "inf_antibio",
        texto: "Uso recente de antibióticos (últimos 12 meses)?",
        opcoes: [
          { label: "Não usou", score: 0 },
          { label: "1 curso curto", score: 1 },
          { label: "2–3 cursos", score: 2 },
          { label: "Uso frequente / uso crônico (acne, etc.)", score: 3 },
        ],
      },
      {
        id: "inf_digest",
        texto: "Sintomas digestivos (inchaço, gases, alteração de intestino)?",
        opcoes: [
          { label: "Raramente", score: 0 },
          { label: "1–2x/semana", score: 1 },
          { label: "3–5x/semana", score: 2 },
          { label: "Diariamente / SII / SIBO suspeito", score: 3 },
        ],
      },
      {
        id: "inf_pcr",
        texto: "PCR-as ou outros marcadores inflamatórios elevados?",
        opcoes: [
          { label: "Normal / não dosado", score: 0 },
          { label: "Levemente elevado", score: 1 },
          { label: "Moderadamente elevado", score: 2 },
          { label: "Muito elevado / doenças autoimunes associadas", score: 3 },
        ],
      },
    ],
  },
  {
    id: "sedentarismo",
    nome: "Sedentarismo / NEAT",
    descricao: "NEAT (Non-Exercise Activity Thermogenesis) é 15–30% do gasto total",
    perguntas: [
      {
        id: "sed_exercicio",
        texto: "Frequência de exercício estruturado?",
        opcoes: [
          { label: "≥5x/semana (aeróbico + resistido)", score: 0 },
          { label: "3–4x/semana", score: 1 },
          { label: "1–2x/semana", score: 2 },
          { label: "Sedentário, não pratica", score: 3 },
        ],
      },
      {
        id: "sed_neat",
        texto: "Passos diários / atividade espontânea?",
        opcoes: [
          { label: ">8.000 passos/dia", score: 0 },
          { label: "5.000–8.000 passos/dia", score: 1 },
          { label: "2.000–5.000 passos/dia", score: 2 },
          { label: "<2.000 passos / trabalho sentado todo o dia", score: 3 },
        ],
      },
      {
        id: "sed_trabalho",
        texto: "Trabalho / rotina?",
        opcoes: [
          { label: "Ativo fisicamente (em pé, se movimenta)", score: 0 },
          { label: "Misto (sentado e em pé)", score: 1 },
          { label: "Principalmente sentado (escritório)", score: 2 },
          { label: "Sedentário extremo (carro + escritório + sofá)", score: 3 },
        ],
      },
    ],
  },
]

type Sexo = "" | "F" | "M"
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [])

function Pill({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${ativo ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>{children}</button>
  )
}

export function EmagrecimentoTab() {
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [fase, setFase] = useState<"form" | "resultado">("form")
  const [sexo, setSexo] = useState<Sexo>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AiResult | null>(null)
  const [fatorIdx, setFatorIdx] = useState(0)

  // Menopausa e andropausa só entra para o sexo feminino (comportamento original mantido)
  const fatoresVisiveis = FATORES.filter(f => sexo === "F" || f.id !== "hormonal")
  const idx = Math.min(fatorIdx, fatoresVisiveis.length - 1)
  const fatorAtual = fatoresVisiveis[idx]

  const fatoresComScore = fatoresVisiveis.map(f => {
    const maxScore = f.perguntas.reduce((s, p) => s + Math.max(...p.opcoes.map(o => o.score)), 0)
    const score = f.perguntas.reduce((s, p) => s + (respostas[p.id] ?? 0), 0)
    return { ...f, score, maxScore, pct: Math.round((score / maxScore) * 100) }
  })
  // Média dos percentuais: sempre de 0 a 100, com 9 ou 10 fatores
  const totalScore = Math.round(fatoresComScore.reduce((s, f) => s + f.pct, 0) / fatoresComScore.length)

  const todasPerguntas = fatoresVisiveis.flatMap(f => f.perguntas)
  const respondidas = todasPerguntas.filter(p => p.id in respostas).length
  const todasRespondidas = respondidas === todasPerguntas.length
  const faltam = todasPerguntas.length - respondidas

  const nivel = totalScore < 30
    ? { tag: "ok" as const, texto: "Baixo bloqueio" }
    : totalScore < 60 ? { tag: "warn" as const, texto: "Bloqueio moderado" } : { tag: "danger" as const, texto: "Bloqueio elevado" }

  async function analisar() {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/emagrecimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fatores: fatoresComScore.map(f => ({ id: f.id, nome: f.nome, score: f.score, maxScore: f.maxScore })),
          scores: respostas,
          total: totalScore,
          sexo: sexo || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Partial<AiResult> & { error?: string }
      if (data.error) throw new Error(data.error)
      if (!Array.isArray(data.topFatores) || !data.plano90dias) throw new Error("resposta incompleta")
      setResult(data as AiResult)
      setFase("resultado")
    } catch (e) {
      console.error("[emagrecimento] erro ao gerar análise:", e)
      setError("Não foi possível gerar a análise. Suas respostas foram mantidas. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function reiniciar() {
    setRespostas({}); setFase("form"); setResult(null); setFatorIdx(0); setError(null)
  }

  return (
    <div className="animate-fade-in space-y-4 px-4 pb-10 md:px-10">
      {fase === "form" && (
        <>
          <Panel as="section" className="space-y-3">
            <Segmented
              label="Sexo do paciente"
              value={sexo}
              onChange={(v: Sexo) => setSexo(v)}
              options={[{ value: "", label: "Não informado" }, { value: "F", label: "Feminino" }, { value: "M", label: "Masculino" }]}
            />
            {sexo !== "F" && (
              <p className="text-[12.5px] text-px-muted">O fator Menopausa e andropausa só entra na avaliação quando o sexo é Feminino.</p>
            )}
          </Panel>

          <Panel as="section" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[14px] font-semibold text-px-ink">Fator {idx + 1} de {fatoresVisiveis.length}: {fatorAtual.nome}</p>
              <p className="text-[12.5px] text-px-muted" role="status">{respondidas} de {todasPerguntas.length} perguntas respondidas</p>
            </div>
            <div role="group" aria-label="Fatores" className="flex gap-2 overflow-x-auto pb-1">
              {fatoresVisiveis.map((f, i) => {
                const completo = f.perguntas.every(p => p.id in respostas)
                return <Pill key={f.id} ativo={i === idx} onClick={() => setFatorIdx(i)}>{f.nome.split(" ")[0]}{completo ? " (completo)" : ""}</Pill>
              })}
            </div>
          </Panel>

          <Panel as="section" className="space-y-5">
            <div>
              <h2 className="text-[16px] font-semibold text-px-ink">{fatorAtual.nome}</h2>
              <p className="text-[13px] text-px-muted">{fatorAtual.descricao}</p>
            </div>
            {fatorAtual.perguntas.map(p => (
              <div key={p.id} role="group" aria-label={p.texto} className="space-y-2">
                <p className="text-[14px] font-medium text-px-ink">{p.texto}</p>
                <div className="space-y-2">
                  {p.opcoes.map(op => {
                    const sel = respostas[p.id] === op.score
                    return (
                      <button key={op.score} type="button" aria-pressed={sel}
                        onClick={() => setRespostas(prev => ({ ...prev, [p.id]: op.score }))}
                        className={`w-full rounded-px-card border px-4 py-3 text-left text-[13.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${sel ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>
                        {op.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </Panel>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <PxButton variant="secondary" leftIcon={ChevronLeft} disabled={idx === 0} onClick={() => setFatorIdx(Math.max(0, idx - 1))}>Anterior</PxButton>
            {idx < fatoresVisiveis.length - 1 ? (
              <PxButton rightIcon={ChevronRight} onClick={() => setFatorIdx(idx + 1)}>Próximo fator</PxButton>
            ) : (
              <PxButton leftIcon={Sparkles} loading={loading} disabled={loading || !todasRespondidas} onClick={analisar}>{loading ? "Analisando" : "Gerar análise"}</PxButton>
            )}
          </div>

          {idx === fatoresVisiveis.length - 1 && !todasRespondidas && (
            <p className="text-center text-[12.5px] text-px-muted">Faltam {faltam} {faltam === 1 ? "pergunta" : "perguntas"} para gerar a análise. Use os botões acima para voltar aos fatores incompletos.</p>
          )}
          {loading && <p role="status" className="text-center text-[12.5px] text-px-muted">A análise pode levar de 30 a 60 segundos. Não feche a página.</p>}
          {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{error}</p>}
        </>
      )}

      {fase === "resultado" && result && (
        <>
          <div className="flex flex-wrap justify-end gap-2">
            <PxButton variant="secondary" size="sm" leftIcon={ChevronLeft} onClick={() => setFase("form")}>Ajustar respostas</PxButton>
            <PxButton variant="secondary" size="sm" leftIcon={RotateCcw} onClick={reiniciar}>Nova avaliação</PxButton>
          </div>

          <Panel as="section" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[13px] text-px-muted">Escore de bloqueio ao emagrecimento</p>
                <p className="text-[34px] font-semibold leading-none tabular-nums text-px-ink">{totalScore}<span className="ml-1 text-[15px] font-normal text-px-muted">de 100</span></p>
              </div>
              <Tag tone={nivel.tag}>{nivel.texto}</Tag>
            </div>
            <div>
              <p className="mb-2 text-[13px] text-px-muted">Percentual da pontuação máxima de cada fator, do maior para o menor.</p>
              <BarList data={[...fatoresComScore].sort((a, b) => b.pct - a.pct).map(f => ({ rotulo: f.nome, valor: f.pct }))} />
            </div>
            <p className="text-[12.5px] text-px-muted">Escore de triagem desta ferramenta, com faixas de 30 e 60 definidas internamente. Não é uma escala clínica validada.</p>
          </Panel>

          <section aria-label="Fatores prioritários" className="space-y-3">
            <h2 className="text-[15px] font-semibold text-px-ink">Fatores prioritários</h2>
            {result.topFatores.slice(0, 3).map((f, i) => {
              const local = fatoresComScore.find(x => x.nome === f.nome)
              return (
                <Panel key={i} as="article" className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold text-px-ink">{i + 1}. {f.nome}</h3>
                    {local && <Tag tone="ink">{local.score} de {local.maxScore} pontos ({local.pct}%)</Tag>}
                  </div>
                  <div>
                    <p className="text-[12.5px] font-medium text-px-muted">Mecanismo</p>
                    <p className="text-[13.5px] leading-relaxed text-px-ink/85">{f.mecanismo}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[12.5px] font-medium text-px-muted">Exames a solicitar</p>
                      <ul className="list-disc space-y-1 pl-5 text-[13px] text-px-ink/85">{lista(f.exames).map((e, j) => <li key={j}>{e}</li>)}</ul>
                    </div>
                    <div>
                      <p className="mb-1 text-[12.5px] font-medium text-px-muted">Intervenções</p>
                      <ul className="list-disc space-y-1 pl-5 text-[13px] text-px-ink/85">{lista(f.intervencoes).map((e, j) => <li key={j}>{e}</li>)}</ul>
                    </div>
                  </div>
                </Panel>
              )
            })}
          </section>

          <section aria-label="Plano de 90 dias" className="space-y-3">
            <h2 className="text-[15px] font-semibold text-px-ink">Plano integrado de 90 dias</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {([
                { label: "Mês 1: diagnóstico", items: lista(result.plano90dias.mes1) },
                { label: "Mês 2: implementação", items: lista(result.plano90dias.mes2) },
                { label: "Mês 3: consolidação", items: lista(result.plano90dias.mes3) },
              ]).map(m => (
                <Panel key={m.label} as="article" className="space-y-2">
                  <h3 className="text-[13.5px] font-semibold text-px-ink">{m.label}</h3>
                  <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-px-ink/85">{m.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
                </Panel>
              ))}
            </div>
          </section>

          <Panel as="section" className="space-y-3">
            <h2 className="text-[15px] font-semibold text-px-ink">Texto para o paciente</h2>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink/85">{result.textoParaPaciente}</p>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={result.textoParaPaciente ?? ""} label="Copiar texto para o paciente" />
              <CopyButton text={result.resumoMedico ?? ""} label="Copiar resumo para o prontuário" />
            </div>
            <p className="text-[12.5px] text-px-muted">Conteúdo gerado por IA para apoiar a decisão clínica. Revise antes de usar com o paciente. A avaliação não é salva: copie o que precisar antes de sair.</p>
          </Panel>
        </>
      )}
    </div>
  )
}
