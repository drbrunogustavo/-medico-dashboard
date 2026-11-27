"use client"

import { useState, useMemo } from "react"
import { useAppContext } from "@/components/AppProvider"
import { FlaskConical, Zap, ChevronDown, ChevronRight, Copy, Check, BookOpen } from "lucide-react"
import { Panel, PxButton, Segmented, PxInput, Tag, PageHeader } from "@/components/px"

// ─── Types ────────────────────────────────────────────────────────────────────

type Tipo = "ECR" | "Metanálise" | "Coorte" | "Revisão Sistemática" | "Estudo Observacional"
type Evidencia = "A" | "B" | "C"

interface Estudo {
  id: string
  nome: string
  tipo: Tipo
  n: number
  duracao: string
  desfechoPrincipal: string
  resultado: string
  nivelEvidencia: Evidencia
  aplicacaoClinica: string
  ano: number
  journal: string
}

interface TemaEstudo {
  id: string
  tema: string
  cor: string
  estudos: Estudo[]
  resumo: string
}

// ─── Database pré-carregado ───────────────────────────────────────────────────

const DATABASE: TemaEstudo[] = [
  {
    id: "semaglutida",
    tema: "Semaglutida",
    cor: "#00c07f",
    resumo: "Agonista GLP-1 semanal com evidência robusta para perda de peso (até 17,4%) e redução de eventos cardiovasculares maiores.",
    estudos: [
      {
        id: "step1",
        nome: "STEP-1 (Semaglutide Treatment Effect in People with Obesity)",
        tipo: "ECR",
        n: 1961,
        duracao: "68 semanas",
        desfechoPrincipal: "Variação percentual do peso corporal",
        resultado: "Perda de peso de −14,9% vs −2,4% placebo (p<0,001). 86,4% dos participantes com perda ≥5%.",
        nivelEvidencia: "A",
        aplicacaoClinica: "Semaglutida 2,4mg/semana SC é o padrão-ouro farmacológico para obesidade sem DM2. Indicar IMC ≥30 ou ≥27 + comorbidade.",
        ano: 2021,
        journal: "New England Journal of Medicine",
      },
      {
        id: "step2",
        nome: "STEP-2 (Obesity + DM2)",
        tipo: "ECR",
        n: 1210,
        duracao: "68 semanas",
        desfechoPrincipal: "Perda de peso + controle glicêmico (HbA1c)",
        resultado: "Perda de −9,6% vs −3,4% placebo. HbA1c reduziu −1,6 pp. Dose 1,0mg foi semelhante à 2,4mg no controle glicêmico.",
        nivelEvidencia: "A",
        aplicacaoClinica: "Em DM2 com obesidade, dose 1,0mg é suficiente para controle glicêmico; 2,4mg para perda de peso máxima.",
        ano: 2021,
        journal: "The Lancet",
      },
      {
        id: "step4",
        nome: "STEP-4 (Manutenção com semaglutida)",
        tipo: "ECR",
        n: 803,
        duracao: "48 semanas (após 20 sem de indução)",
        desfechoPrincipal: "Manutenção ou continuidade da perda de peso",
        resultado: "Manutenção −7,9% adicional vs +6,9% com troca para placebo. Confirma necessidade de uso contínuo.",
        nivelEvidencia: "A",
        aplicacaoClinica: "A suspensão da semaglutida leva a recuperação significativa de peso. Comunicar ao paciente que é tratamento de longo prazo.",
        ano: 2021,
        journal: "JAMA",
      },
      {
        id: "select",
        nome: "SELECT (Cardiovascular Outcomes Trial)",
        tipo: "ECR",
        n: 17604,
        duracao: "~3,3 anos",
        desfechoPrincipal: "MACE (morte CV, IAM não fatal, AVC não fatal)",
        resultado: "Redução de 20% em MACE vs placebo (HR 0,80; p<0,001) em obesos sem DM2 com DCV estabelecida.",
        nivelEvidencia: "A",
        aplicacaoClinica: "Semaglutida reduz eventos cardiovasculares em obesos com DCV, independente do DM2. Expansão da indicação para prevenção CV.",
        ano: 2023,
        journal: "New England Journal of Medicine",
      },
    ],
  },
  {
    id: "tirzepatida",
    tema: "Tirzepatida",
    cor: "#3b7fff",
    resumo: "Duplo agonista GIP/GLP-1 com maior eficácia de perda de peso que qualquer fármaco disponível até o momento.",
    estudos: [
      {
        id: "surmount1",
        nome: "SURMOUNT-1 (Obesidade sem DM2)",
        tipo: "ECR",
        n: 2539,
        duracao: "72 semanas",
        desfechoPrincipal: "Variação percentual do peso",
        resultado: "Perda de −20,9% (15mg), −19,5% (10mg), −15,0% (5mg) vs −3,1% placebo. 63% com perda ≥20%.",
        nivelEvidencia: "A",
        aplicacaoClinica: "Tirzepatida 15mg tem maior eficácia de perda de peso que semaglutida. Considerar para pacientes com obesidade grave ou insucesso prévo com GLP-1 mono-agonista.",
        ano: 2022,
        journal: "New England Journal of Medicine",
      },
      {
        id: "surmount2",
        nome: "SURMOUNT-2 (Obesidade + DM2)",
        tipo: "ECR",
        n: 938,
        duracao: "72 semanas",
        desfechoPrincipal: "Peso + HbA1c",
        resultado: "Perda de −15,7% (15mg) vs −3,3% placebo. HbA1c −2,1 pp. 82% com HbA1c <7%.",
        nivelEvidencia: "A",
        aplicacaoClinica: "Melhor perfil de perda de peso e controle glicêmico combinado disponível. Primeira linha em DM2 com obesidade quando acesso disponível.",
        ano: 2023,
        journal: "The Lancet",
      },
      {
        id: "surpass1",
        nome: "SURPASS-1 (Monoterapia em DM2)",
        tipo: "ECR",
        n: 478,
        duracao: "40 semanas",
        desfechoPrincipal: "Redução de HbA1c",
        resultado: "Redução de HbA1c: −1,87% (5mg), −1,89% (10mg), −2,07% (15mg) vs −0,04% placebo. Sem hipoglicemia significativa.",
        nivelEvidencia: "A",
        aplicacaoClinica: "Tirzepatida como monoterapia (após metformina) oferece controle glicêmico superior sem hipoglicemia. Considerar antes de sulfonilureias.",
        ano: 2021,
        journal: "New England Journal of Medicine",
      },
    ],
  },
  {
    id: "vitaminad",
    tema: "Vitamina D",
    cor: "#f59e0b",
    resumo: "Evidência robusta para prevenção de câncer (especialmente mortalidade) e benefícios cardiovasculares modestos com suplementação de 2.000 UI/dia.",
    estudos: [
      {
        id: "vital",
        nome: "VITAL Trial (Vitamin D and Omega-3 Trial)",
        tipo: "ECR",
        n: 25871,
        duracao: "5,3 anos",
        desfechoPrincipal: "Câncer invasivo + MACE",
        resultado: "Vitamina D 2.000 UI/dia: sem redução de novos cânceres (HR 0,96), mas redução de 17% na mortalidade por câncer. Sem efeito em MACE primário.",
        nivelEvidencia: "A",
        aplicacaoClinica: "Vitamina D 2.000 UI/dia é segura e reduz mortalidade por câncer. Reposição obrigatória quando <30 ng/mL. Não previne câncer novo, mas melhora prognóstico.",
        ano: 2019,
        journal: "New England Journal of Medicine",
      },
    ],
  },
  {
    id: "testosterona",
    tema: "Testosterona",
    cor: "#8b5cf6",
    resumo: "TRT melhora composição corporal, função sexual, humor e qualidade de vida em homens com hipogonadismo confirmado.",
    estudos: [
      {
        id: "ttrials",
        nome: "T-Trials (Testosterone Trials)",
        tipo: "ECR",
        n: 790,
        duracao: "12 meses",
        desfechoPrincipal: "Função sexual, mobilidade física, vitalidade",
        resultado: "TRT melhorou significativamente função sexual (libido, ereção), densidade mineral óssea e humor. Efeito modesto em mobilidade física. Aumento de eritrocitose e volume prostático sem malignidade.",
        nivelEvidencia: "A",
        aplicacaoClinica: "TRT em homens ≥65a com T <275 ng/dL melhora função sexual e humor. Monitorar hematócrito e PSA. Não aumentou risco CV em homens selecionados.",
        ano: 2016,
        journal: "New England Journal of Medicine",
      },
    ],
  },
  {
    id: "trh",
    tema: "TRH Menopausa",
    cor: "#e1306c",
    resumo: "TRH alivia sintomas climatéricos com eficácia comprovada. Risco benefício depende fortemente da via, tipo de hormônio e timing de início.",
    estudos: [
      {
        id: "whi",
        nome: "WHI (Women's Health Initiative)",
        tipo: "ECR",
        n: 27347,
        duracao: "5,6–7,1 anos",
        desfechoPrincipal: "Eventos cardiovasculares, câncer de mama, fratura",
        resultado: "Estrogênio + progestina sintética: ↑CA mama (HR 1,26), ↑AVC, ↑TEP. Estrogênio isolado (histerectomia): sem aumento de CA mama, redução de CA mama em alguns subgrupos.",
        nivelEvidencia: "A",
        aplicacaoClinica: "WHI foi realizado com mulheres mais velhas (média 63a), progestina sintética e estrogênio oral. NÃO extrapolar para mulheres jovens (<60a), via transdérmica ou progesterona micronizada.",
        ano: 2002,
        journal: "JAMA",
      },
      {
        id: "keeps",
        nome: "KEEPS (Kronos Early Estrogen Prevention Study)",
        tipo: "ECR",
        n: 727,
        duracao: "4 anos",
        desfechoPrincipal: "Progressão de aterosclerose subclínica (CIMT, escore de cálcio)",
        resultado: "TRH iniciada logo após menopausa (<3 anos) não acelerou aterosclerose. Melhora significativa de sintomas, humor e qualidade óssea. Sem diferença em CIMT vs placebo.",
        nivelEvidencia: "A",
        aplicacaoClinica: "KEEPS sustenta a 'janela de oportunidade': TRH iniciada antes dos 60 anos/10 anos pós-menopausa é segura cardiovascularmente. Suporta o uso precoce e individualizado.",
        ano: 2012,
        journal: "Annals of Internal Medicine",
      },
    ],
  },
  {
    id: "metformina",
    tema: "Metformina",
    cor: "#06b6d4",
    resumo: "Primeira linha no DM2 com 60+ anos de uso clínico. Evidência emergente para longevidade e prevenção do DM2.",
    estudos: [
      {
        id: "ukpds",
        nome: "UKPDS (UK Prospective Diabetes Study)",
        tipo: "ECR",
        n: 4209,
        duracao: "10 anos",
        desfechoPrincipal: "Complicações micro e macrovasculares no DM2",
        resultado: "Metformina reduziu mortalidade geral em 36% e eventos coronarianos em 39% em obesos com DM2, superando sulfonilureias e insulina no desfecho macrovascular.",
        nivelEvidencia: "A",
        aplicacaoClinica: "Metformina permanece como pedra angular do DM2. Benefício cardiovascular independente do controle glicêmico. Manter sempre que TFG ≥30.",
        ano: 1998,
        journal: "The Lancet",
      },
      {
        id: "tame",
        nome: "TAME Trial (Targeting Aging with Metformin)",
        tipo: "ECR",
        n: 3000,
        duracao: "6 anos (em andamento)",
        desfechoPrincipal: "Prevenção de doenças relacionadas à idade (DCV, câncer, demência, morte)",
        resultado: "Ensaio pioneiro em longevidade. Dados preliminares de estudos observacionais: usuários de metformina têm menor incidência de câncer, demência e mortalidade por todas as causas vs não-diabéticos.",
        nivelEvidencia: "B",
        aplicacaoClinica: "TAME pode estabelecer metformina como a primeira droga anti-envelhecimento. Uso off-label em longevidade é explorado por médicos funcionalistas, mas aguarda evidência A.",
        ano: 2023,
        journal: "Cell Metabolism (protocolo)",
      },
    ],
  },
  {
    id: "omega3",
    tema: "Ômega-3",
    cor: "#f97316",
    resumo: "EPA em altas doses (4g/dia) reduz eventos cardiovasculares em pacientes com TG elevados em uso de estatina.",
    estudos: [
      {
        id: "reduceit",
        nome: "REDUCE-IT (Reduction of Cardiovascular Events with Icosapentaenoic Acid–Intervention Trial)",
        tipo: "ECR",
        n: 8179,
        duracao: "4,9 anos",
        desfechoPrincipal: "MACE (morte CV, IAM, AVC, angina instável, revascularização)",
        resultado: "EPA 4g/dia (icosapentaenoato de etila): redução de 25% em MACE (HR 0,75; p<0,001) em pacientes com TG 135–499 mg/dL em uso de estatina.",
        nivelEvidencia: "A",
        aplicacaoClinica: "Vascepa® (EPA puro) 4g/dia é indicado para pacientes de alto risco CV com TG ≥150 mg/dL em uso de estatina. Ômega-3 comum (EPA+DHA) não demonstrou o mesmo benefício no STRENGTH trial.",
        ano: 2019,
        journal: "New England Journal of Medicine",
      },
    ],
  },
]

// ─── Sugestões por especialidade ─────────────────────────────────────────────

const SUGESTOES_ESP: Record<string, string[]> = {
  Endocrinologia: ["Semaglutida", "Tirzepatida", "Metformina", "Vitamina D", "Testosterona", "GH", "Resistência à insulina", "Hipotireoidismo"],
  Ginecologia:    ["TRH Menopausa", "SOP", "Endometriose", "Progesterona", "HPV", "Anticoncepcional oral", "Mioma uterino", "Câncer de mama"],
  Nutrologia:     ["Vitamina D", "Ômega-3", "Ferro EV", "Berberina", "Metformina", "Vitamina B12", "Magnésio", "Jejum intermitente"],
  Cardiologia:    ["Estatinas", "Hipertensão arterial", "Fibrilação atrial", "Anticoagulação", "Insuficiência cardíaca", "IECA", "Betabloqueadores", "AVC prevenção"],
  Pneumologia:    ["Asma grave", "DPOC", "Apneia do sono", "Corticoides inalatórios", "Broncodilatadores LABA", "Pneumonia", "Fibrose pulmonar", "Tabagismo cessação"],
  Ortopedia:      ["Osteoporose", "Artrose joelho", "Lesão LCA", "Lombalgia crônica", "Ácido hialurônico", "PRP ortopedia", "Sarcopenia", "Fratura de quadril"],
  Dermatologia:   ["Isotretinoína acne", "Psoríase biologics", "Dermatite atópica dupilumab", "Melanoma imunoterapia", "Rosácea", "Vitiligo", "Carcinoma basocelular", "Alopecia androgenética"],
  Psiquiatria:    ["ISRS depressão", "Bupropiona", "TDAH adulto", "Transtorno bipolar", "Ansiedade generalizada", "Insônia", "Cetamina depressão", "Antipsicóticos"],
  Pediatria:      ["Vacinas rotavírus", "Aleitamento materno", "TDAH metilfenidato", "Asma infantil", "Vitamina D pediátrica", "Obesidade infantil", "Antibiótico otite", "Febre manejo"],
  Neurologia:     ["AVC trombólise", "Alzheimer donepezil", "Epilepsia levetiracetam", "Enxaqueca preventiva", "Parkinson levodopa", "Esclerose múltipla", "Demência vascular", "Enxaqueca CGRP"],
}

const SUGESTOES_FALLBACK = [
  "Metformina", "Vitamina D", "Estatinas", "Hipertensão arterial",
  "Diabetes tipo 2", "Asma", "Antibióticos", "Osteoporose", "Ômega-3", "Antidepressivos ISRS",
]

function sugestoesPorEsp(esp?: string | null): string[] {
  if (!esp) return SUGESTOES_FALLBACK
  const e = esp.toLowerCase()
  if (e.includes("endocrin")) return SUGESTOES_ESP.Endocrinologia
  if (e.includes("nutrol"))   return SUGESTOES_ESP.Nutrologia
  if (e.includes("gineco") || e.includes("obstet")) return SUGESTOES_ESP.Ginecologia
  if (e.includes("cardio"))   return SUGESTOES_ESP.Cardiologia
  if (e.includes("pneumo") || e.includes("pulmo"))  return SUGESTOES_ESP.Pneumologia
  if (e.includes("ortoped") || e.includes("traumato")) return SUGESTOES_ESP.Ortopedia
  if (e.includes("dermato"))  return SUGESTOES_ESP.Dermatologia
  if (e.includes("psiquiat")) return SUGESTOES_ESP.Psiquiatria
  if (e.includes("pediatr"))  return SUGESTOES_ESP.Pediatria
  if (e.includes("neurolog")) return SUGESTOES_ESP.Neurologia
  return SUGESTOES_FALLBACK
}

// ─── Mapas de configuração ────────────────────────────────────────────────────

type Tone = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"

const EVIDENCIA_CONFIG: Record<Evidencia, { label: string; tone: Tone }> = {
  A: { label: "Nível A", tone: "ok" },
  B: { label: "Nível B", tone: "warn" },
  C: { label: "Nível C", tone: "danger" },
}

const PERIODOS: { key: string; label: string; value: number | null }[] = [
  { key: "0.5",   label: "6 meses", value: 0.5  },
  { key: "2",     label: "2 anos",  value: 2    },
  { key: "5",     label: "5 anos",  value: 5    },
  { key: "10",    label: "10 anos", value: 10   },
  { key: "todos", label: "Todos",   value: null },
]

// ─── Componentes ──────────────────────────────────────────────────────────────

function Rotulo({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return <p className={accent ? "mb-1 text-[12px] font-medium text-px-accent" : "mb-1 text-[12px] font-medium text-px-muted"}>{children}</p>
}

function EstudoCard({ estudo, copied, onCopy }: {
  estudo: Estudo
  copied: string | null
  onCopy: (id: string, text: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ev = EVIDENCIA_CONFIG[estudo.nivelEvidencia]

  const copyText = [
    `${estudo.nome} (${estudo.ano}), ${estudo.journal}`,
    `Tipo: ${estudo.tipo} · N=${estudo.n.toLocaleString("pt-BR")} · Duração: ${estudo.duracao}`,
    `Desfecho: ${estudo.desfechoPrincipal}`,
    `Resultado: ${estudo.resultado}`,
    `Nível de evidência: ${estudo.nivelEvidencia}`,
    `Aplicação clínica: ${estudo.aplicacaoClinica}`,
  ].join("\n")

  return (
    <Panel as="article" tone="light" className="overflow-hidden p-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Tag>{estudo.tipo}</Tag>
            <Tag tone={ev.tone}>{ev.label}</Tag>
            <span className="text-[12px] text-px-muted">{estudo.ano}, {estudo.journal.split(" ").slice(0, 3).join(" ")}</span>
          </div>
          <p className="text-[14px] font-semibold leading-snug text-px-ink">{estudo.nome}</p>
          <p className="mt-1.5 text-[12.5px] text-px-muted">
            N = {estudo.n.toLocaleString("pt-BR")}, {estudo.duracao}
          </p>
        </div>
        {open
          ? <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-px-muted" aria-hidden="true" />
          : <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-px-muted" aria-hidden="true" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-px-ink/10 px-4 py-4">
          <div>
            <Rotulo>Desfecho principal</Rotulo>
            <p className="text-[13px] text-px-ink/75">{estudo.desfechoPrincipal}</p>
          </div>
          <div>
            <Rotulo>Resultado</Rotulo>
            <p className="text-[13px] leading-relaxed text-px-ink">{estudo.resultado}</p>
          </div>
          <div className="rounded-px-card bg-px-accent-soft px-4 py-3">
            <Rotulo accent>Aplicação clínica prática</Rotulo>
            <p className="text-[13px] leading-relaxed text-px-ink">{estudo.aplicacaoClinica}</p>
          </div>
          <div className="flex justify-end">
            <PxButton
              size="sm"
              variant="secondary"
              leftIcon={copied === estudo.id ? Check : Copy}
              onClick={() => onCopy(estudo.id, copyText)}
            >
              {copied === estudo.id ? "Copiado" : "Copiar referência"}
            </PxButton>
          </div>
        </div>
      )}
    </Panel>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function EstudosPage() {
  const ctx          = useAppContext()
  const especialidade = ctx?.perfil?.especialidade ?? null

  const [search,    setSearch]    = useState("")
  const [anos,      setAnos]      = useState<number | null>(5)
  const [loading,   setLoading]   = useState(false)
  const [aiResult,  setAiResult]  = useState<TemaEstudo | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [copied,    setCopied]    = useState<string | null>(null)
  const [openTemas, setOpenTemas] = useState<Record<string, boolean>>(
    Object.fromEntries(DATABASE.map(t => [t.id, false]))
  )

  const SUGESTOES = useMemo(() => sugestoesPorEsp(especialidade), [especialidade])

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => { /* área de transferência indisponível */ })
  }

  const searchLower = search.toLowerCase().trim()

  const filtered = useMemo(() => {
    if (!searchLower) return DATABASE
    return DATABASE.filter(t =>
      t.tema.toLowerCase().includes(searchLower) ||
      t.estudos.some(e =>
        e.nome.toLowerCase().includes(searchLower) ||
        e.resultado.toLowerCase().includes(searchLower) ||
        e.aplicacaoClinica.toLowerCase().includes(searchLower)
      )
    )
  }, [searchLower])

  const hasMatch = filtered.length > 0

  const buscarComIA = async (tema: string) => {
    setSearch(tema)
    setLoading(true); setError(null); setAiResult(null)
    try {
      let res: Response
      try {
        res = await fetch("/api/estudos", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ tema, anos }),
        })
      } catch {
        // fetch rejeitado antes de qualquer resposta (sem rede, DNS, CORS)
        setError("Sem conexão com o servidor. Verifique sua internet e tente novamente.")
        return
      }
      if (res.status === 504 || res.status === 408) {
        setError("A busca demorou mais que o esperado. Tente com um período menor ou repita em alguns segundos.")
        return
      }
      let data: Record<string, unknown>
      try {
        data = await res.json()
      } catch {
        setError(`Erro inesperado do servidor (HTTP ${res.status}). Tente novamente.`)
        return
      }
      if (data.error) {
        setError(`Erro ao buscar estudos: ${String(data.error)}`)
        return
      }
      if (!Array.isArray(data.estudos)) {
        setError("A busca não devolveu estudos nesse formato. Tente novamente.")
        return
      }
      setAiResult({ ...(data as unknown as TemaEstudo), cor: "#a78bfa", id: `ai-${tema}` })
    } catch (e) {
      console.error("[estudos] erro inesperado:", e)
      setError("Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const totalEstudos = DATABASE.reduce((s, t) => s + t.estudos.length, 0)
  const periodoAtual = PERIODOS.find(p => p.value === anos)?.key ?? "todos"
  const sugestaoAtual = SUGESTOES.find(s => s.toLowerCase() === search.toLowerCase()) ?? ""

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Banco de Estudos"
        caption={`Evidência clínica com aplicação prática: ${totalEstudos} estudos em ${DATABASE.length} temas`}
      />

      <div className="space-y-5 px-4 pb-10 md:px-10">

        <div className="space-y-3">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={e => {
              e.preventDefault()
              if (search.trim()) buscarComIA(search.trim())
            }}
          >
            <PxInput
              type="search"
              aria-label="Buscar estudo, medicamento ou tema"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar estudo, medicamento ou tema"
              className="flex-1"
            />
            <PxButton type="submit" leftIcon={Zap} loading={loading} disabled={!search.trim()}>
              Buscar com IA
            </PxButton>
          </form>

          <Segmented
            label="Sugestões de tema"
            value={sugestaoAtual}
            onChange={s => {
              const match = DATABASE.find(t => t.tema.toLowerCase() === s.toLowerCase())
              if (match) {
                setSearch(s)
                setAiResult(null)
              } else {
                buscarComIA(s)
              }
            }}
            options={SUGESTOES.map(s => ({ value: s, label: s }))}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-px-muted">Período da busca com IA</span>
            <Segmented
              label="Período da busca com IA"
              value={periodoAtual}
              onChange={k => setAnos(PERIODOS.find(p => p.key === k)?.value ?? null)}
              options={PERIODOS.map(p => ({ value: p.key, label: p.label }))}
            />
          </div>
        </div>

        {loading && (
          <div role="status" className="flex flex-col items-center justify-center gap-3 py-14">
            <FlaskConical className="h-9 w-9 animate-pulse text-px-ink" aria-hidden="true" />
            <div className="text-center">
              <p className="text-[15px] font-semibold text-px-ink">Consultando evidências científicas</p>
              <p className="mt-1 text-[12.5px] text-px-muted">A IA está analisando a literatura médica</p>
            </div>
          </div>
        )}

        {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>}

        {aiResult && !loading && (
          <Panel tone="light" className="space-y-3 p-0">
            <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
              <h2 className="text-[16px] font-semibold text-px-ink">{aiResult.tema}</h2>
              <Tag tone="ink">Gerado por IA</Tag>
            </div>
            {aiResult.resumo && (
              <p className="px-5 text-[13px] leading-relaxed text-px-ink/75">{aiResult.resumo}</p>
            )}
            <div className="space-y-3 p-4">
              {aiResult.estudos.map(e => (
                <EstudoCard key={e.id} estudo={e} copied={copied} onCopy={copy} />
              ))}
            </div>
          </Panel>
        )}

        {!loading && !aiResult && searchLower && !hasMatch && (
          <Panel className="py-10 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-px-muted" aria-hidden="true" />
            <p className="mb-1 text-[14px] font-semibold text-px-ink">Nenhum estudo carregado para &quot;{search}&quot;</p>
            <p className="mb-4 text-[13px] text-px-muted">Busque as evidências com a IA para esse tema.</p>
            <PxButton leftIcon={Zap} onClick={() => buscarComIA(search.trim())}>Buscar com IA</PxButton>
          </Panel>
        )}

        <p className="text-[12.5px] text-px-muted">
          Nível de evidência: A, B ou C. ECR significa ensaio clínico randomizado.
        </p>

        {!loading && (
          <div className="space-y-3">
            {(searchLower ? filtered : DATABASE).map(tema => {
              const aberto = openTemas[tema.id] || !!searchLower
              return (
                <Panel key={tema.id} as="section" tone="light" className="overflow-hidden p-0">
                  <button
                    type="button"
                    aria-expanded={aberto}
                    onClick={() => setOpenTemas(prev => ({ ...prev, [tema.id]: !prev[tema.id] }))}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-px-ink">{tema.tema}</p>
                      <p className="mt-0.5 pr-4 text-[12.5px] text-px-muted">{tema.resumo}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Tag>{tema.estudos.length} {tema.estudos.length === 1 ? "estudo" : "estudos"}</Tag>
                      {aberto
                        ? <ChevronDown className="h-4 w-4 text-px-muted" aria-hidden="true" />
                        : <ChevronRight className="h-4 w-4 text-px-muted" aria-hidden="true" />}
                    </div>
                  </button>
                  {aberto && (
                    <div className="space-y-3 border-t border-px-ink/10 p-4">
                      {tema.estudos.map(e => (
                        <EstudoCard key={e.id} estudo={e} copied={copied} onCopy={copy} />
                      ))}
                    </div>
                  )}
                </Panel>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
