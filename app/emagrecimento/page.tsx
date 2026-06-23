"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Scale, Loader2, AlertCircle, ChevronRight, ChevronLeft,
  Copy, Check, RotateCcw, Zap,
} from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pergunta {
  id: string
  texto: string
  opcoes: { label: string; score: number }[]
}

interface Fator {
  id: string
  nome: string
  cor: string
  descricao: string
  perguntas: Pergunta[]
}

interface AiTopFator {
  nome: string
  score: number
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

// ─── Fatores ─────────────────────────────────────────────────────────────────

const FATORES: Fator[] = [
  {
    id: "ri",
    nome: "Resistência Insulínica",
    cor: "#f59e0b",
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
          { label: "Sempre — difícil controlar", score: 3 },
        ],
      },
    ],
  },
  {
    id: "sarcopenia",
    nome: "Sarcopenia",
    cor: "#8b5cf6",
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
    cor: "#3b7fff",
    descricao: "Desregula grelina, leptina e cortisol — bloqueia emagrecimento",
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
    cor: "#ef4444",
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
    cor: "#06b6d4",
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
          { label: "Boa — acorda descansado", score: 0 },
          { label: "Regular — acorda razoável", score: 1 },
          { label: "Ruim — sono fragmentado", score: 2 },
          { label: "Péssima — insônia ou sono não reparador", score: 3 },
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
    cor: "#10b981",
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
    cor: "#e1306c",
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
          { label: "Intensamente — peso não controlável mesmo com dieta", score: 3 },
        ],
      },
    ],
  },
  {
    id: "comportamento",
    nome: "Comportamento Alimentar",
    cor: "#f97316",
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
          { label: "Sempre — a maior parte das calorias é à noite", score: 3 },
        ],
      },
    ],
  },
  {
    id: "inflamacao",
    nome: "Inflamação / Gut Health",
    cor: "#84cc16",
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
    cor: "#a78bfa",
    descricao: "NEAT (Non-Exercise Activity Thermogenesis) é 15–30% do gasto total",
    perguntas: [
      {
        id: "sed_exercicio",
        texto: "Frequência de exercício estruturado?",
        opcoes: [
          { label: "≥5x/semana (aeróbico + resistido)", score: 0 },
          { label: "3–4x/semana", score: 1 },
          { label: "1–2x/semana", score: 2 },
          { label: "Sedentário — não pratica", score: 3 },
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

// ─── Radar custom label ───────────────────────────────────────────────────────

function RadarLabel({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (!x || !y || !payload) return null
  const words = (payload.value ?? "").split(" ")
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
      {words.map((w, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>{w}</tspan>
      ))}
    </text>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmagrecimentoPage() {
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [fase,    setFase]   = useState<"form" | "resultado">("form")
  const [loading, setLoading] = useState(false)
  const [error,   setError]  = useState<string | null>(null)
  const [result,  setResult] = useState<AiResult | null>(null)
  const [copied,  setCopied] = useState<"medico" | "paciente" | null>(null)
  const [fatorIdx, setFatorIdx] = useState(0)

  const responder = (perguntaId: string, score: number) => {
    setRespostas(prev => ({ ...prev, [perguntaId]: score }))
  }

  // Score per factor
  const fatoresComScore = FATORES.map(f => {
    const maxScore = f.perguntas.reduce((s, p) => s + Math.max(...p.opcoes.map(o => o.score)), 0)
    const score    = f.perguntas.reduce((s, p) => s + (respostas[p.id] ?? 0), 0)
    return { ...f, score, maxScore, pct: Math.round((score / maxScore) * 100) }
  })

  const totalScore = Math.round(
    fatoresComScore.reduce((s, f) => s + (f.score / f.maxScore) * 10, 0)
  )

  const perguntasRespondidas = FATORES.flatMap(f => f.perguntas).filter(p => p.id in respostas).length
  const totalPerguntas       = FATORES.flatMap(f => f.perguntas).length

  const radarData = fatoresComScore.map(f => ({
    fator:  f.nome.split(" ")[0],
    value:  f.pct,
    fullMark: 100,
  }))

  const copiar = (tipo: "medico" | "paciente") => {
    if (!result) return
    const text = tipo === "medico" ? result.resumoMedico : result.textoParaPaciente
    navigator.clipboard.writeText(text).then(() => {
      setCopied(tipo)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const analisar = async () => {
    setLoading(true); setError(null)
    try {
      const payload = {
        fatores: fatoresComScore.map(f => ({ id: f.id, nome: f.nome, score: f.score, maxScore: f.maxScore })),
        scores: respostas,
        total: totalScore,
      }
      const res  = await fetch("/api/emagrecimento", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setFase("resultado")
    } catch (e) {
      console.error("[emagrecimento] erro ao gerar análise:", e)
      setError("Erro ao gerar análise. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const reiniciar = () => {
    setRespostas({}); setFase("form"); setResult(null); setFatorIdx(0)
  }

  const fatorAtual = FATORES[fatorIdx]
  const todasRespondidas = FATORES.every(f => f.perguntas.every(p => p.id in respostas))

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Inteligência para Emagrecimento"
        subtitle="DIAGNÓSTICO DOS 10 FATORES DE BLOQUEIO · PLANO PERSONALIZADO 90 DIAS"
        actions={
          fase === "resultado" ? (
            <button
              onClick={reiniciar}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-colors"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <RotateCcw className="w-3 h-3" /> Nova avaliação
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-5 max-w-4xl mx-auto w-full">

        {fase === "form" && (
          <>
            {/* Progress */}
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  {fatorIdx + 1} de {FATORES.length} fatores — {fatorAtual.nome}
                </span>
                <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {perguntasRespondidas}/{totalPerguntas} perguntas
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "var(--surface)" }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${((fatorIdx + 1) / FATORES.length) * 100}%`, background: fatorAtual.cor }}
                />
              </div>
            </div>

            {/* Factor tabs — scrollable */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {FATORES.map((f, i) => {
                const allAnswered = f.perguntas.every(p => p.id in respostas)
                return (
                  <button
                    key={f.id}
                    onClick={() => setFatorIdx(i)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all"
                    style={{
                      background: fatorIdx === i ? `${f.cor}15` : "var(--surface)",
                      border: `1px solid ${fatorIdx === i ? f.cor + "40" : "var(--border)"}`,
                      color: fatorIdx === i ? f.cor : "var(--text-muted)",
                    }}
                  >
                    {allAnswered && <Check className="w-2.5 h-2.5" />}
                    {f.nome.split(" ")[0]}
                  </button>
                )
              })}
            </div>

            {/* Current factor */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${fatorAtual.cor}30` }}>
              <div className="px-5 py-4" style={{ background: `${fatorAtual.cor}08` }}>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: fatorAtual.cor }}>
                  Fator {fatorIdx + 1} · {fatorAtual.descricao}
                </div>
                <div className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>
                  {fatorAtual.nome}
                </div>
              </div>

              <div className="p-5 space-y-5" style={{ background: "var(--card)" }}>
                {fatorAtual.perguntas.map(p => (
                  <div key={p.id}>
                    <div className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                      {p.texto}
                    </div>
                    <div className="space-y-2">
                      {p.opcoes.map(op => (
                        <button
                          key={op.score}
                          onClick={() => responder(p.id, op.score)}
                          className="w-full text-left px-4 py-3 rounded-xl transition-all text-[12px]"
                          style={{
                            background: respostas[p.id] === op.score ? `${fatorAtual.cor}12` : "var(--surface)",
                            border: `1px solid ${respostas[p.id] === op.score ? fatorAtual.cor + "40" : "var(--border)"}`,
                            color: respostas[p.id] === op.score ? "var(--text-primary)" : "var(--text-secondary)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{op.label}</span>
                            {respostas[p.id] === op.score && (
                              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: fatorAtual.cor }} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={() => setFatorIdx(i => Math.max(0, i - 1))}
                disabled={fatorIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all disabled:opacity-40"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>

              {fatorIdx < FATORES.length - 1 ? (
                <button
                  onClick={() => setFatorIdx(i => Math.min(FATORES.length - 1, i + 1))}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                  style={{ background: fatorAtual.cor, color: "#080808" }}
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={analisar}
                  disabled={loading || !todasRespondidas}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "#080808" }}
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando…</>
                    : <><Zap className="w-4 h-4" /> Gerar Análise IA</>}
                </button>
              )}
            </div>

            {!todasRespondidas && fatorIdx === FATORES.length - 1 && (
              <p className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                Responda todas as perguntas para gerar a análise
              </p>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-xl p-4 bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-700">{error}</p>
              </div>
            )}
          </>
        )}

        {fase === "resultado" && result && (
          <div className="space-y-6">

            {/* Radar */}
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Score de bloqueio ao emagrecimento
                  </div>
                  <div className="text-[28px] font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                    {totalScore}
                    <span className="text-[14px] font-normal ml-1" style={{ color: "var(--text-muted)" }}>/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px]" style={{ color: totalScore < 30 ? "#00c07f" : totalScore < 60 ? "#f59e0b" : "#ef4444" }}>
                    {totalScore < 30 ? "Baixo bloqueio" : totalScore < 60 ? "Bloqueio moderado" : "Bloqueio elevado"}
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240} className="md:!h-[320px]">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="fator" tick={<RadarLabel />} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Bloqueio"
                    dataKey="value"
                    stroke="var(--accent)"
                    fill="var(--accent)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(v: unknown) => [`${v}%`, "Nível de bloqueio"]}
                    contentStyle={{
                      background: "var(--card)", border: "1px solid var(--border)",
                      borderRadius: 8, fontSize: 11,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Top 3 fatores */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Top 3 Fatores Prioritários
              </div>
              <div className="space-y-4">
                {result.topFatores.map((f, i) => {
                  const fatorData = FATORES.find(x => x.nome === f.nome) ?? FATORES[i]
                  return (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${fatorData.cor}30` }}>
                      <div className="px-4 py-3 flex items-center gap-3" style={{ background: `${fatorData.cor}08` }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                          style={{ background: fatorData.cor, color: "#080808" }}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{f.nome}</div>
                          <div className="text-[10px] font-mono" style={{ color: fatorData.cor }}>
                            Score: {f.score}/10
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-3" style={{ background: "var(--card)" }}>
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                            Mecanismo
                          </div>
                          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.mecanismo}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                              Exames a solicitar
                            </div>
                            <div className="space-y-1">
                              {f.exames.map((e, j) => (
                                <div key={j} className="flex items-start gap-1.5">
                                  <span className="text-[9px] mt-0.5 flex-shrink-0" style={{ color: "#3b7fff" }}>▸</span>
                                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{e}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                              Intervenções
                            </div>
                            <div className="space-y-1">
                              {f.intervencoes.map((iv, j) => (
                                <div key={j} className="flex items-start gap-1.5">
                                  <span className="text-[9px] mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }}>→</span>
                                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{iv}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Plano 90 dias */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-5 py-3" style={{ background: "var(--card)" }}>
                <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Plano Integrado 90 Dias
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
                style={{ borderTop: "1px solid var(--border)", borderColor: "var(--border)" }}>
                {([
                  { label: "Mês 1 — Diagnóstico", items: result.plano90dias.mes1, cor: "#3b7fff" },
                  { label: "Mês 2 — Implementação", items: result.plano90dias.mes2, cor: "#f59e0b" },
                  { label: "Mês 3 — Consolidação", items: result.plano90dias.mes3, cor: "#00c07f" },
                ] as const).map(m => (
                  <div key={m.label} className="p-4" style={{ background: "var(--background)" }}>
                    <div className="text-[10px] font-mono font-bold mb-3" style={{ color: m.cor }}>
                      {m.label}
                    </div>
                    <div className="space-y-1.5">
                      {m.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-[9px] mt-0.5 flex-shrink-0" style={{ color: m.cor }}>▸</span>
                          <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Texto para paciente */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Texto para compartilhar com o paciente
              </div>
              <p className="text-[12px] leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                {result.textoParaPaciente}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => copiar("paciente")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: copied === "paciente" ? "var(--accent-dim)" : "var(--surface)",
                    border: `1px solid ${copied === "paciente" ? "var(--accent-border)" : "var(--border)"}`,
                    color: copied === "paciente" ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {copied === "paciente" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === "paciente" ? "Copiado!" : "Copiar para paciente"}
                </button>
                <button
                  onClick={() => copiar("medico")}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: copied === "medico" ? "var(--accent-dim)" : "var(--surface)",
                    border: `1px solid ${copied === "medico" ? "var(--accent-border)" : "var(--border)"}`,
                    color: copied === "medico" ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {copied === "medico" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === "medico" ? "Copiado!" : "Resumo para prontuário"}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
