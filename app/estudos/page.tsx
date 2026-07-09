"use client"

import { useState, useMemo, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  BookOpen, Search, Loader2, AlertCircle, ChevronDown, ChevronRight,
  FlaskConical, Copy, Check, Zap,
} from "lucide-react"

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
        resultado: "Metformina reduziu mortalidade geral em 36% e eventos coronarianos em 39% em obesos com DM2 — superando sulfonilureias e insulina no desfecho macrovascular.",
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

// ─── Config maps ──────────────────────────────────────────────────────────────

const EVIDENCIA_CONFIG: Record<Evidencia, { label: string; color: string; bg: string; border: string }> = {
  A: { label: "Nível A", color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200"  },
  B: { label: "Nível B", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200"  },
  C: { label: "Nível C", color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"    },
}

const TIPO_CONFIG: Record<Tipo, string> = {
  "ECR":                  "text-blue-700 bg-blue-50 border-blue-200",
  "Metanálise":           "text-purple-700 bg-purple-50 border-purple-200",
  "Coorte":               "text-cyan-700 bg-cyan-50 border-cyan-200",
  "Revisão Sistemática":  "text-indigo-700 bg-indigo-50 border-indigo-200",
  "Estudo Observacional": "text-slate-500 bg-slate-100 border-slate-300",
}

// ─── Components ───────────────────────────────────────────────────────────────

function EstudoCard({ estudo, copied, onCopy }: {
  estudo: Estudo
  copied: string | null
  onCopy: (id: string, text: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ev = EVIDENCIA_CONFIG[estudo.nivelEvidencia]

  const copyText = [
    `${estudo.nome} (${estudo.ano}) — ${estudo.journal}`,
    `Tipo: ${estudo.tipo} · N=${estudo.n.toLocaleString("pt-BR")} · Duração: ${estudo.duracao}`,
    `Desfecho: ${estudo.desfechoPrincipal}`,
    `Resultado: ${estudo.resultado}`,
    `Nível de evidência: ${estudo.nivelEvidencia}`,
    `Aplicação clínica: ${estudo.aplicacaoClinica}`,
  ].join("\n")

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors text-left gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", TIPO_CONFIG[estudo.tipo])}>
              {estudo.tipo}
            </span>
            <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", ev.color, ev.bg, ev.border)}>
              {ev.label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              {estudo.ano} · {estudo.journal.split(" ").slice(0,3).join(" ")}
            </span>
          </div>
          <div className="text-[13px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
            {estudo.nome}
          </div>
          <div className="flex flex-wrap gap-3 mt-1.5">
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              N = <span style={{ color: "var(--text-secondary)" }}>{estudo.n.toLocaleString("pt-BR")}</span>
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {estudo.duracao}
            </span>
          </div>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "var(--text-muted)" }} />
          : <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "var(--text-muted)" }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="pt-3 space-y-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Desfecho principal
              </div>
              <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{estudo.desfechoPrincipal}</p>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Resultado
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-primary)" }}>{estudo.resultado}</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "rgba(0,192,127,0.06)", border: "1px solid rgba(0,192,127,0.2)" }}>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--accent)" }}>
                Aplicação clínica prática
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {estudo.aplicacaoClinica}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => onCopy(estudo.id, copyText)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: copied === estudo.id ? "var(--accent-dim)" : "var(--surface)",
                  border: `1px solid ${copied === estudo.id ? "var(--accent-border)" : "var(--border)"}`,
                  color: copied === estudo.id ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {copied === estudo.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === estudo.id ? "Copiado!" : "Copiar referência"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EstudosPage() {
  const [search,         setSearch]    = useState("")
  const [anos,           setAnos]      = useState<number | null>(5)
  const [loading,        setLoading]   = useState(false)
  const [aiResult,       setAiResult]  = useState<TemaEstudo | null>(null)
  const [error,          setError]     = useState<string | null>(null)
  const [copied,         setCopied]    = useState<string | null>(null)
  const [especialidade,  setEspecialidade] = useState<string | null>(null)
  const [openTemas, setOpenTemas] = useState<Record<string, boolean>>(
    Object.fromEntries(DATABASE.map(t => [t.id, false]))
  )

  useEffect(() => {
    fetch("/api/perfil").then(r => r.ok ? r.json() : null)
      .then(p => { if (p?.especialidade) setEspecialidade(p.especialidade as string) })
      .catch(() => {})
  }, [])

  const SUGESTOES = useMemo(() => sugestoesPorEsp(especialidade), [especialidade])

  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
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
      const res  = await fetch("/api/estudos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tema, anos }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiResult({ ...data, cor: "#a78bfa", id: `ai-${tema}` })
    } catch (e) {
      console.error("[estudos] erro ao buscar estudos:", e)
      setError("Erro ao buscar estudos. Verifique sua conexão.")
    } finally {
      setLoading(false)
    }
  }

  const totalEstudos = DATABASE.reduce((s, t) => s + t.estudos.length, 0)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Banco de Estudos Científicos"
        subtitle="MEDICINA BASEADA EM EVIDÊNCIAS · TRIALS CLÍNICOS · APLICAÇÃO PRÁTICA"
        actions={
          <span className="text-[10px] font-mono px-3 py-1.5 rounded-lg border"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {totalEstudos} estudos · {DATABASE.length} temas
          </span>
        }
      />

      <div className="p-4 md:p-8 space-y-5">

        {/* Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !hasMatch && search.trim() && buscarComIA(search.trim())}
              placeholder="Buscar estudo, medicamento ou tema… (Enter para buscar com IA)"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Quick pills */}
          <div className="flex flex-wrap gap-2">
            {SUGESTOES.map(s => (
              <button
                key={s}
                onClick={() => {
                  const match = DATABASE.find(t => t.tema.toLowerCase() === s.toLowerCase())
                  if (match) {
                    setSearch(s)
                    setAiResult(null)
                  } else {
                    buscarComIA(s)
                  }
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border transition-all"
                style={{
                  background: search.toLowerCase() === s.toLowerCase() ? "var(--accent-dim)" : "var(--surface)",
                  borderColor: search.toLowerCase() === s.toLowerCase() ? "var(--accent-border)" : "var(--border)",
                  color: search.toLowerCase() === s.toLowerCase() ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Período */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>PERÍODO:</span>
            {([
              { label: "2 anos",  value: 2    },
              { label: "5 anos",  value: 5    },
              { label: "10 anos", value: 10   },
              { label: "Todos",   value: null },
            ] as { label: string; value: number | null }[]).map(p => {
              const ativo = anos === p.value
              return (
                <button
                  key={p.label}
                  onClick={() => setAnos(p.value)}
                  className="text-[11px] px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    background:  ativo ? "rgba(59,127,255,0.12)" : "var(--surface)",
                    borderColor: ativo ? "rgba(59,127,255,0.3)"  : "var(--border)",
                    color:       ativo ? "#3b7fff"                : "var(--text-muted)",
                    fontWeight:  ativo ? 600 : 400,
                  }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <FlaskConical className="w-10 h-10 text-accent animate-pulse" />
            <div className="text-center">
              <div className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Consultando evidências científicas…
              </div>
              <div className="text-[10px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>
                CLAUDE ANALISANDO LITERATURA MÉDICA
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl p-4 bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700">{error}</p>
          </div>
        )}

        {/* AI result */}
        {aiResult && !loading && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(167,139,250,0.3)" }}>
            <div className="flex items-center justify-between px-5 py-3"
              style={{ background: "rgba(167,139,250,0.08)" }}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "#a78bfa" }} />
                <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                  {aiResult.tema}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300">
                  GERADO POR IA
                </span>
              </div>
            </div>
            {aiResult.resumo && (
              <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(167,139,250,0.2)", background: "var(--card)" }}>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{aiResult.resumo}</p>
              </div>
            )}
            <div className="p-4 space-y-3" style={{ background: "var(--background)" }}>
              {aiResult.estudos.map(e => (
                <EstudoCard key={e.id} estudo={e} copied={copied} onCopy={copy} />
              ))}
            </div>
          </div>
        )}

        {/* No match — prompt IA search */}
        {!loading && !aiResult && searchLower && !hasMatch && (
          <div className="rounded-xl p-6 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Nenhum estudo pré-carregado para &quot;{search}&quot;
            </p>
            <p className="text-[11px] mb-4" style={{ color: "var(--text-muted)" }}>
              Clique abaixo para buscar evidências com Claude IA
            </p>
            <button
              onClick={() => buscarComIA(search.trim())}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold mx-auto transition-all"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}
            >
              <Zap className="w-3.5 h-3.5" /> Buscar com IA
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {(Object.entries(EVIDENCIA_CONFIG) as [Evidencia, typeof EVIDENCIA_CONFIG[Evidencia]][]).map(([k, v]) => (
            <div key={k} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono", v.color, v.bg, v.border)}>
              {v.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono text-blue-700 bg-blue-50 border-blue-200">
            ECR = Ensaio Clínico Randomizado
          </div>
        </div>

        {/* Database */}
        {!loading && (
          <div className="space-y-4">
            {(searchLower ? filtered : DATABASE).map(tema => (
              <div key={tema.id} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <button
                  onClick={() => setOpenTemas(prev => ({ ...prev, [tema.id]: !prev[tema.id] }))}
                  className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]"
                  style={{ background: "var(--card)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: tema.cor }} />
                    <div className="text-left">
                      <div className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>{tema.tema}</div>
                      <div className="text-[11px] mt-0.5 pr-4" style={{ color: "var(--text-muted)" }}>{tema.resumo}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                      {tema.estudos.length} estudo{tema.estudos.length !== 1 ? "s" : ""}
                    </span>
                    {openTemas[tema.id]
                      ? <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      : <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
                  </div>
                </button>
                {(openTemas[tema.id] || !!searchLower) && (
                  <div className="p-4 space-y-3" style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
                    {tema.estudos.map(e => (
                      <EstudoCard key={e.id} estudo={e} copied={copied} onCopy={copy} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
