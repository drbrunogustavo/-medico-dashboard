"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { RefreshCw, Plus, Check, TrendingUp, Target, Play, ExternalLink, Sparkles, Radio, Zap, Microscope, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AI_MODEL } from "@/lib/ai-config"

// ─── SOURCES ────────────────────────────────────────────────────────────────

const SOURCE_GROUPS: Record<string, string[]> = {
  "Social": [
    "Instagram Trending","TikTok Trending","YouTube Trending","X (Twitter)",
    "Reddit","Reddit Health","Reddit Longevity","Reddit Biohackers",
    "Reddit Menopause","Reddit Testosterone","Reddit Weight Loss","Reddit Nutrition",
    "Instagram Viral Intelligence",
  ],
  "Científica": [
    "PubMed","The Lancet","NEJM","Nature Medicine","BMJ","JAMA","medRxiv","bioRxiv",
  ],
  "Clínica & News": [
    "MedScape","MedPage Today","STAT News","Fierce Healthcare","Endocrine News",
    "Healio Endocrinologia","Medscape Brasil","UpToDate","Healthline","Mayo Clinic",
    "FDA","SBD","G1 Saúde","CNN Health",
  ],
}

const ALL_SOURCES = Object.values(SOURCE_GROUPS).flat()
const SOURCES_LIST = ["Todos", ...ALL_SOURCES]

const TOPIC_FILTERS = [
  "Todos","GLP-1","Tirzepatida","Retatrutida","Testosterona","Libido",
  "Disfunção Erétil","Andropausa","Massa Muscular","Menopausa",
  "Terapia Hormonal","Libido Feminina","Sarcopenia","Jejum",
  "Mitos","Dietas","Hacks","Protocolos","Saúde Mental",
]

const CATEGORIES_LIST = [
  "Todos","Nutrologia","Endocrinologia","Longevidade","Metabolismo","Microbioma",
  "Hormônios","Anti-aging","Genômica","Obesidade","Nutrição Clínica","Saúde Mental",
  "Cardiometabolismo","Medicina do Esporte","Suplementação","Sono e Cronobiologia",
  "Imunologia","Menopausa","Andropausa","Envelhecimento","Terapia Hormonal","Emagrecimento",
]

const PERIODS = [
  { label:"24 horas", value:"24h"  },
  { label:"7 dias",   value:"7d"   },
  { label:"30 dias",  value:"30d"  },
  { label:"90 dias",  value:"90d"  },
  { label:"180 dias", value:"180d" },
]

// ─── STYLES ─────────────────────────────────────────────────────────────────

const SOURCE_STYLES: Record<string,{bg:string;border:string;text:string;dot:string}> = {
  "PubMed":                      {bg:"bg-emerald-50",     border:"border-emerald-200",   text:"text-emerald-700", dot:"bg-emerald-500"},
  "The Lancet":                  {bg:"bg-violet-50",      border:"border-violet-200",    text:"text-violet-700",  dot:"bg-violet-500"},
  "NEJM":                        {bg:"bg-blue-50",        border:"border-blue-200",      text:"text-blue-700",    dot:"bg-blue-500"},
  "Nature Medicine":             {bg:"bg-lime-50",        border:"border-lime-200",      text:"text-lime-700",    dot:"bg-lime-500"},
  "MedScape":                    {bg:"bg-fuchsia-50",     border:"border-fuchsia-200",   text:"text-fuchsia-700", dot:"bg-fuchsia-500"},
  "G1 Saúde":                    {bg:"bg-amber-50",       border:"border-amber-200",     text:"text-amber-700",   dot:"bg-amber-500"},
  "CNN Health":                  {bg:"bg-red-50",         border:"border-red-200",       text:"text-red-700",     dot:"bg-red-500"},
  "Instagram Trending":          {bg:"bg-pink-50",        border:"border-pink-200",      text:"text-pink-700",    dot:"bg-pink-500"},
  "Instagram Viral Intelligence":{bg:"bg-rose-50",        border:"border-rose-200",      text:"text-rose-700",    dot:"bg-rose-500"},
  "TikTok Trending":             {bg:"bg-purple-50",      border:"border-purple-200",    text:"text-purple-700",  dot:"bg-purple-500"},
  "YouTube Trending":            {bg:"bg-red-50",         border:"border-red-200",       text:"text-red-600",     dot:"bg-red-400"},
  "X (Twitter)":                 {bg:"bg-slate-100",      border:"border-slate-300",     text:"text-slate-600",   dot:"bg-slate-400"},
  "Reddit":                      {bg:"bg-orange-50",      border:"border-orange-200",    text:"text-orange-700",  dot:"bg-orange-500"},
  "Reddit Health":               {bg:"bg-orange-50",      border:"border-orange-200",    text:"text-orange-600",  dot:"bg-orange-400"},
  "Reddit Longevity":            {bg:"bg-teal-50",        border:"border-teal-200",      text:"text-teal-700",    dot:"bg-teal-500"},
  "Reddit Biohackers":           {bg:"bg-cyan-50",        border:"border-cyan-200",      text:"text-cyan-700",    dot:"bg-cyan-500"},
  "Reddit Menopause":            {bg:"bg-pink-50",        border:"border-pink-200",      text:"text-pink-600",    dot:"bg-pink-400"},
  "Reddit Testosterone":         {bg:"bg-amber-50",       border:"border-amber-200",     text:"text-amber-600",   dot:"bg-amber-400"},
  "Reddit Weight Loss":          {bg:"bg-green-50",       border:"border-green-200",     text:"text-green-700",   dot:"bg-green-500"},
  "Reddit Nutrition":            {bg:"bg-lime-50",        border:"border-lime-200",      text:"text-lime-600",    dot:"bg-lime-400"},
  "FDA":                         {bg:"bg-blue-50",        border:"border-blue-200",      text:"text-blue-600",    dot:"bg-blue-400"},
  "BMJ":                         {bg:"bg-teal-50",        border:"border-teal-200",      text:"text-teal-700",    dot:"bg-teal-500"},
  "JAMA":                        {bg:"bg-indigo-50",      border:"border-indigo-200",    text:"text-indigo-700",  dot:"bg-indigo-500"},
  "UpToDate":                    {bg:"bg-sky-50",         border:"border-sky-200",       text:"text-sky-700",     dot:"bg-sky-500"},
  "Medscape Brasil":             {bg:"bg-pink-50",        border:"border-pink-200",      text:"text-pink-700",    dot:"bg-pink-500"},
  "Healthline":                  {bg:"bg-green-50",       border:"border-green-200",     text:"text-green-700",   dot:"bg-green-500"},
  "Mayo Clinic":                 {bg:"bg-cyan-50",        border:"border-cyan-200",      text:"text-cyan-700",    dot:"bg-cyan-500"},
  "SBD":                         {bg:"bg-orange-50",      border:"border-orange-200",    text:"text-orange-700",  dot:"bg-orange-500"},
  "STAT News":                   {bg:"bg-slate-100",      border:"border-slate-300",     text:"text-slate-600",   dot:"bg-slate-400"},
  "MedPage Today":               {bg:"bg-blue-50",        border:"border-blue-200",      text:"text-blue-600",    dot:"bg-blue-400"},
  "Fierce Healthcare":           {bg:"bg-rose-50",        border:"border-rose-200",      text:"text-rose-700",    dot:"bg-rose-500"},
  "Endocrine News":              {bg:"bg-yellow-50",      border:"border-yellow-200",    text:"text-yellow-700",  dot:"bg-yellow-500"},
  "Healio Endocrinologia":       {bg:"bg-violet-50",      border:"border-violet-200",    text:"text-violet-600",  dot:"bg-violet-400"},
  "medRxiv":                     {bg:"bg-emerald-50",     border:"border-emerald-200",   text:"text-emerald-600", dot:"bg-emerald-400"},
  "bioRxiv":                     {bg:"bg-lime-50",        border:"border-lime-200",      text:"text-lime-700",    dot:"bg-lime-500"},
}

const RELEVANCE_STYLES: Record<string,{bg:string;border:string;text:string;pulse:boolean}> = {
  "Alto":  {bg:"bg-red-50",    border:"border-red-300",    text:"text-red-700",   pulse:true},
  "Médio": {bg:"bg-amber-50",  border:"border-amber-300",  text:"text-amber-700", pulse:false},
  "Baixo": {bg:"bg-green-50",  border:"border-green-300",  text:"text-green-700", pulse:false},
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const MOCK_TRENDS: Article[] = [
  {id:1,title:"Restrição calórica intermitente e marcadores de longevidade: novo estudo randomizado",source:"PubMed",category:"Longevidade",date:"03/05/2025",relevance:"Alto",summary:"Estudo controlado demonstra redução de 18% nos marcadores inflamatórios com jejum 16:8 por 12 semanas. Pesquisadores destacam impacto na expressão de sirtuínas."},
  {id:2,title:"GLP-1 além da diabetes: evidências emergentes para doenças neurodegenerativas",source:"The Lancet",category:"Endocrinologia",date:"02/05/2025",relevance:"Alto",summary:"Revisão sistemática aponta benefício neuroprotetor dos agonistas GLP-1 em modelos de Alzheimer e Parkinson. Ensaios clínicos de fase III já em andamento."},
  {id:3,title:"Terapia de reposição hormonal na menopausa: novas diretrizes internacionais",source:"JAMA",category:"Menopausa",date:"01/05/2025",relevance:"Alto",summary:"Novas diretrizes ampliam indicações da TRH para mulheres sintomáticas abaixo de 60 anos. Benefícios cardiovasculares e ósseos são destacados quando iniciada precocemente."},
  {id:4,title:"Semaglutida e tirzepatida: comparativo de eficácia no emagrecimento a longo prazo",source:"NEJM",category:"Emagrecimento",date:"03/05/2025",relevance:"Alto",summary:"Meta-análise de 18 meses aponta superioridade da tirzepatida na redução de peso. Perfil de efeitos colaterais semelhante entre as duas drogas."},
  {id:5,title:"Andropausa e reposição de testosterona: quando e como tratar",source:"Medscape Brasil",category:"Andropausa",date:"30/04/2025",relevance:"Médio",summary:"Consenso brasileiro atualiza critérios diagnósticos do hipogonadismo tardio. Nível de corte de testosterona total revisado para 350 ng/dL."},
  {id:6,title:"Microbiota e eixo intestino-tireoide: novas vias regulatórias identificadas",source:"Nature Medicine",category:"Microbioma",date:"01/05/2025",relevance:"Alto",summary:"Pesquisadores mapearam como bactérias do gênero Akkermansia modulam a conversão de T4 para T3. Descoberta pode revolucionar o tratamento do hipotireoidismo subclínico."},
]

const MOCK_REELS: Reel[] = [
  {id:1,rank:1, title:"Tirzepatida: o que ninguém te conta sobre os efeitos colaterais",      platform:"TikTok",    views:"4.2M", engagement:"18.4%",link:"#",category:"Emagrecimento"},
  {id:2,rank:2, title:"Creatina para mulheres na menopausa — muda TUDO",                      platform:"Instagram", views:"3.8M", engagement:"22.1%",link:"#",category:"Menopausa"},
  {id:3,rank:3, title:"Jejum intermitente mitos vs. realidade em 2025",                       platform:"YouTube",   views:"3.1M", engagement:"9.8%", link:"#",category:"Nutrição Clínica"},
  {id:4,rank:4, title:"Testosterona baixa em homens jovens: causas modernas",                 platform:"TikTok",    views:"2.9M", engagement:"16.2%",link:"#",category:"Andropausa"},
  {id:5,rank:5, title:"Semaglutida vs Tirzepatida: qual escolher?",                           platform:"Instagram", views:"2.7M", engagement:"19.3%",link:"#",category:"Emagrecimento"},
  {id:6,rank:6, title:"Protocolo de longevidade do Dr. Peter Attia — o que funciona",         platform:"YouTube",   views:"2.4M", engagement:"11.5%",link:"#",category:"Longevidade"},
  {id:7,rank:7, title:"Retatrutida: o próximo GLP-1 que vai mudar tudo",                      platform:"TikTok",    views:"2.2M", engagement:"21.7%",link:"#",category:"Emagrecimento"},
  {id:8,rank:8, title:"Como a sarcopenia silenciosa está destruindo sua saúde",               platform:"Instagram", views:"2.0M", engagement:"17.8%",link:"#",category:"Longevidade"},
  {id:9,rank:9, title:"Saúde mental e intestino: a conexão que sua psiquiatra não te contou", platform:"TikTok",    views:"1.9M", engagement:"20.4%",link:"#",category:"Saúde Mental"},
  {id:10,rank:10,title:"5 sinais de que sua testosterona está baixa",                         platform:"Instagram", views:"1.8M", engagement:"15.9%",link:"#",category:"Hormônios"},
  {id:11,rank:11,title:"Menopausa precoce: reconheça os sinais antes dos 45",                 platform:"TikTok",    views:"1.7M", engagement:"23.2%",link:"#",category:"Menopausa"},
  {id:12,rank:12,title:"Ozempic para não diabéticos: riscos e benefícios reais",              platform:"YouTube",   views:"1.6M", engagement:"12.1%",link:"#",category:"Emagrecimento"},
  {id:13,rank:13,title:"Protocolo de massa muscular após os 40",                              platform:"Instagram", views:"1.5M", engagement:"14.7%",link:"#",category:"Medicina do Esporte"},
  {id:14,rank:14,title:"Libido feminina e testosterona: o que a ciência diz",                 platform:"TikTok",    views:"1.4M", engagement:"25.1%",link:"#",category:"Hormônios"},
  {id:15,rank:15,title:"Retatrutida fase 3: resultados surpreendentes",                       platform:"YouTube",   views:"1.3M", engagement:"13.4%",link:"#",category:"Emagrecimento"},
  {id:16,rank:16,title:"O erro que todos cometem no jejum intermitente",                      platform:"Instagram", views:"1.25M",engagement:"18.9%",link:"#",category:"Nutrição Clínica"},
  {id:17,rank:17,title:"Andropausa: a menopausa masculina que ninguém fala",                  platform:"TikTok",    views:"1.2M", engagement:"19.6%",link:"#",category:"Andropausa"},
  {id:18,rank:18,title:"Creatina e cognição: evidências 2025",                                platform:"YouTube",   views:"1.1M", engagement:"10.8%",link:"#",category:"Suplementação"},
  {id:19,rank:19,title:"Terapia hormonal bioidêntica: mito ou realidade?",                    platform:"Instagram", views:"1.05M",engagement:"21.3%",link:"#",category:"Terapia Hormonal"},
  {id:20,rank:20,title:"Sarcopenia nos 30 anos: como prevenir agora",                         platform:"TikTok",    views:"980K", engagement:"17.2%",link:"#",category:"Longevidade"},
]

const MOCK_VELOCITY: VelocityItem[] = [
  {id:1, topic:"Retatrutida",           score:97,growth:"+340%",mentions:12400,publications:89, trend:"🔥",category:"Emagrecimento"},
  {id:2, topic:"Tirzepatida",           score:91,growth:"+220%",mentions:28900,publications:234,trend:"🔥",category:"Emagrecimento"},
  {id:3, topic:"Creatina + Menopausa",  score:88,growth:"+280%",mentions:8700, publications:43, trend:"🔥",category:"Menopausa"},
  {id:4, topic:"GLP-1 Neurológico",     score:84,growth:"+195%",mentions:6200, publications:178,trend:"⚡",category:"Neurologia"},
  {id:5, topic:"Sarcopenia Feminina",   score:78,growth:"+162%",mentions:5100, publications:67, trend:"⚡",category:"Longevidade"},
  {id:6, topic:"Libido Feminina + TRT", score:76,growth:"+155%",mentions:9800, publications:31, trend:"⚡",category:"Hormônios"},
  {id:7, topic:"Andropausa Jovem",      score:71,growth:"+138%",mentions:7300, publications:52, trend:"📈",category:"Andropausa"},
  {id:8, topic:"Biohacking Hormonal",   score:68,growth:"+124%",mentions:4500, publications:28, trend:"📈",category:"Anti-aging"},
  {id:9, topic:"Jejum Feminino",        score:64,growth:"+108%",mentions:6700, publications:44, trend:"📈",category:"Nutrição Clínica"},
  {id:10,topic:"Saúde Mental + Gut",    score:61,growth:"+95%", mentions:5200, publications:89, trend:"📈",category:"Saúde Mental"},
  {id:11,topic:"Reposição Hormonal",    score:58,growth:"+87%", mentions:14200,publications:112,trend:"📊",category:"Terapia Hormonal"},
  {id:12,topic:"Massa Muscular +40",    score:54,growth:"+74%", mentions:8900, publications:56, trend:"📊",category:"Medicina do Esporte"},
  {id:13,topic:"Disfunção Erétil Jovem",score:51,growth:"+68%", mentions:6100, publications:39, trend:"📊",category:"Andropausa"},
  {id:14,topic:"Microbioma e Obesidade",score:48,growth:"+61%", mentions:4800, publications:143,trend:"📊",category:"Microbioma"},
  {id:15,topic:"Sono e Hormônios",      score:44,growth:"+52%", mentions:3900, publications:71, trend:"📊",category:"Sono e Cronobiologia"},
]

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {id:1,topic:"Creatina para Mulheres na Menopausa",growth:"+280%",competition:"Baixa",sharing:"Alto",score:94,trending_since:"2 semanas",why:"Combinação de dois temas em alta (creatina + menopausa) com poucos criadores de conteúdo médico abordando a interseção. Alto potencial de compartilhamento em grupos femininos e de saúde da mulher.",keywords:["creatina","menopausa","massa muscular","hormônios"],platforms:["Instagram","TikTok"]},
  {id:2,topic:"Retatrutida — Próxima Geração dos GLP-1",growth:"+340%",competition:"Muito Baixa",sharing:"Muito Alto",score:97,trending_since:"3 semanas",why:"Novo medicamento com pouquíssimo conteúdo educativo disponível em português. Audiência já familiarizada com Ozempic e Wegovy está buscando ativamente informações sobre a próxima geração.",keywords:["retatrutida","GLP-1","emagrecimento","medicamento"],platforms:["Instagram","YouTube","TikTok"]},
  {id:3,topic:"Libido Feminina e Testosterona",growth:"+195%",competition:"Baixa",sharing:"Alto",score:88,trending_since:"1 mês",why:"Assunto com alto tabu gera naturalmente mais compartilhamento. Poucas médicas abordando com embasamento científico sério. Crescimento expressivo no Reddit Menopause e Instagram.",keywords:["libido feminina","testosterona","hormônios","menopausa"],platforms:["Instagram","Reddit"]},
  {id:4,topic:"Jejum + Protocolo de Testosterona",growth:"+162%",competition:"Média",sharing:"Alto",score:79,trending_since:"6 semanas",why:"Interseção entre biohacking masculino e endocrinologia com audiência 25-45 anos e alto engajamento. Conteúdo prático supera o teórico nesse nicho específico.",keywords:["jejum","testosterona","biohacking","andropausa"],platforms:["TikTok","X (Twitter)","Reddit"]},
  {id:5,topic:"Sarcopenia Silenciosa nos 30",growth:"+145%",competition:"Baixa",sharing:"Muito Alto",score:85,trending_since:"1 mês",why:"Tema de prevenção com gatilho emocional forte — a ideia de perder músculo silenciosamente. Público jovem que não se identifica com 'saúde do idoso' mas reage ao conteúdo preventivo.",keywords:["sarcopenia","massa muscular","longevidade","30 anos"],platforms:["TikTok","Instagram","YouTube"]},
  {id:6,topic:"Disfunção Erétil Causas Modernas",growth:"+138%",competition:"Média",sharing:"Alto",score:76,trending_since:"2 meses",why:"Homens jovens buscando respostas para DE não relacionada a idade. Correlação com estilo de vida, pornografia e testosterona gera muito engajamento e compartilhamento privado.",keywords:["disfunção erétil","testosterona","andropausa","saúde masculina"],platforms:["Reddit","TikTok","YouTube"]},
  {id:7,topic:"Menopausa Precoce — Sinais Ignorados",growth:"+172%",competition:"Baixa",sharing:"Muito Alto",score:91,trending_since:"3 semanas",why:"Mulheres entre 35-45 anos compartilham massivamente conteúdo de alerta. Médicos com linguagem acessível sobre menopausa precoce têm crescimento orgânico acelerado no Instagram.",keywords:["menopausa precoce","hormônios","terapia hormonal","saúde feminina"],platforms:["Instagram","TikTok"]},
  {id:8,topic:"Biohacking Hormonal Feminino",growth:"+124%",competition:"Muito Baixa",sharing:"Alto",score:82,trending_since:"5 semanas",why:"Nicho com crescimento acelerado no Reddit Biohackers e Longevity. Mulheres buscando otimização hormonal além da medicina convencional. Conteúdo médico com base científica tem grande credibilidade nesse espaço.",keywords:["biohacking","hormônios","longevidade","otimização"],platforms:["Instagram","Reddit","YouTube"]},
]

// ─── INTERFACES ──────────────────────────────────────────────────────────────

interface Article {
  id: number; title: string; source: string; category: string
  date: string; relevance: string; summary: string
}

interface Reel {
  id: number; rank: number; title: string; platform: string
  views: string; engagement: string; link: string; category: string
}

interface VelocityItem {
  id: number; topic: string; score: number; growth: string
  mentions: number; publications: number; trend: string; category: string
}

interface Opportunity {
  id: number; topic: string; growth: string; competition: string
  sharing: string; score: number; trending_since: string; why: string
  keywords: string[]; platforms: string[]
}

interface ReverseResult {
  gancho:           string
  estrutura:        string
  retencao:         string
  gatilhos:         string[]
  cta:              string
  autoridade:       number
  polemica:         number
  compartilhamento: "Baixo" | "Médio" | "Alto" | "Viral"
  versao_adaptada: {
    titulo:    string
    gancho:    string
    estrutura: string[]
  }
}

type Tab = "radar" | "reels" | "velocity" | "opportunities"

// ─── BADGE COMPONENTS ────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_STYLES[source] || {bg:"bg-slate-100",border:"border-slate-300",text:"text-slate-500",dot:"bg-slate-400"}
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border",s.bg,s.border,s.text)}>
      <span className={cn("w-1 h-1 rounded-full flex-shrink-0",s.dot)} />{source}
    </span>
  )
}

function RelevanceBadge({ level }: { level: string }) {
  const s = RELEVANCE_STYLES[level] || RELEVANCE_STYLES["Baixo"]
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-mono font-semibold px-2.5 py-1 rounded-full border tracking-wider",s.bg,s.border,s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",s.text.replace("text-","bg-"),s.pulse&&"animate-ping")} />{level}
    </span>
  )
}

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string,string> = {
    "Instagram":"bg-pink-50 border-pink-200 text-pink-700",
    "TikTok":   "bg-purple-50 border-purple-200 text-purple-700",
    "YouTube":  "bg-red-50 border-red-200 text-red-700",
    "Reddit":   "bg-orange-50 border-orange-200 text-orange-700",
    "X (Twitter)":"bg-slate-100 border-slate-300 text-slate-600",
  }
  return (
    <span className={cn("text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border",map[platform]||"bg-slate-100 border-slate-300 text-slate-500")}>
      {platform}
    </span>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function RadarPage() {
  const router = useRouter()
  const [activeTab, setActiveTab]         = useState<Tab>("radar")
  const [articles,  setArticles]          = useState<Article[]>([])
  const [reels,     setReels]             = useState<Reel[]>([])
  const [velocity,  setVelocity]          = useState<VelocityItem[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loadingRadar, setLoadingRadar]   = useState(false)
  const [loadingReels, setLoadingReels]   = useState(false)
  const [loadingVel,   setLoadingVel]     = useState(false)
  const [loadingOpp,   setLoadingOpp]     = useState(false)
  const [saved,        setSaved]          = useState<number[]>([])
  const [search,       setSearch]         = useState("")
  const [lastUpdate,   setLastUpdate]     = useState<Date | null>(null)
  const [toast,        setToast]          = useState<string | null>(null)
  const [reelSort,     setReelSort]       = useState<"views"|"engagement">("views")
  const [filters, setFilters] = useState({ source:"Todos", category:"Todos", topic:"Todos", period:"7d" })
  const [reverseReel,    setReverseReel]    = useState<Reel | null>(null)
  const [reverseResult,  setReverseResult]  = useState<ReverseResult | null>(null)
  const [loadingReverse, setLoadingReverse] = useState(false)
  const [reverseSent,    setReverseSent]    = useState(false)
  const [savedOpps,      setSavedOpps]      = useState<Set<number>>(new Set())

  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 2600)
  }

  const callRadarAPI = useCallback(async (
    type: "radar" | "reels" | "velocity" | "opportunities",
    extraFilters?: Record<string, string>,
  ) => {
    const res = await fetch("/api/radar", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        type,
        filters: {
          fonte:     filters.source,
          categoria: filters.category,
          topico:    filters.topic,
          periodo:   filters.period,
          ...extraFilters,
        },
      }),
    })
    const json = await res.json() as { data?: unknown[]; error?: string }
    if (json.error) throw new Error(json.error)
    return json.data ?? []
  }, [filters])

  const fetchRadar = useCallback(async () => {
    setLoadingRadar(true)
    try {
      const r = await callRadarAPI("radar")
      setArticles((r as Article[]).map((a, i) => ({ ...a, id: Date.now() + i })))
      setLastUpdate(new Date())
    } catch (e) {
      console.error("[radar] erro ao buscar artigos:", e)
      setArticles(MOCK_TRENDS); setLastUpdate(new Date())
    }
    setLoadingRadar(false)
  }, [filters, callRadarAPI])

  const fetchReels = useCallback(async () => {
    setLoadingReels(true)
    try {
      const r = await callRadarAPI("reels")
      setReels((r as Reel[]).map((x, i) => ({ ...x, id: Date.now() + i })))
    } catch { setReels(MOCK_REELS) }
    setLoadingReels(false)
  }, [filters.period, callRadarAPI])

  const fetchVelocity = useCallback(async () => {
    setLoadingVel(true)
    try {
      const r = await callRadarAPI("velocity")
      setVelocity((r as VelocityItem[]).map((x, i) => ({ ...x, id: Date.now() + i })))
    } catch { setVelocity(MOCK_VELOCITY) }
    setLoadingVel(false)
  }, [filters.period, callRadarAPI])

  const fetchOpportunities = useCallback(async () => {
    setLoadingOpp(true)
    try {
      const r = await callRadarAPI("opportunities")
      setOpportunities((r as Opportunity[]).map((x, i) => ({ ...x, id: Date.now() + i })))
    } catch { setOpportunities(MOCK_OPPORTUNITIES) }
    setLoadingOpp(false)
  }, [filters.period, callRadarAPI])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRadar() }, [])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === "reels"         && reels.length        === 0) fetchReels()
    if (tab === "velocity"      && velocity.length     === 0) fetchVelocity()
    if (tab === "opportunities" && opportunities.length === 0) fetchOpportunities()
  }

  const handleRefresh = () => {
    if (activeTab === "radar")         fetchRadar()
    if (activeTab === "reels")         fetchReels()
    if (activeTab === "velocity")      fetchVelocity()
    if (activeTab === "opportunities") fetchOpportunities()
  }

  const currentLoading = activeTab==="radar" ? loadingRadar : activeTab==="reels" ? loadingReels : activeTab==="velocity" ? loadingVel : loadingOpp

  const filteredArticles = articles.filter(a => {
    if (filters.source   !== "Todos" && a.source   !== filters.source)   return false
    if (filters.category !== "Todos" && a.category !== filters.category) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.summary.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const sortedReels = [...reels].sort((a,b) => {
    if (reelSort === "views") {
      const parse = (s: string) => parseFloat(s.replace(/[KMk]/g,"")) * (s.includes("M")?1e6:s.includes("K")||s.includes("k")?1e3:1)
      return parse(b.views) - parse(a.views)
    }
    return parseFloat(b.engagement) - parseFloat(a.engagement)
  })

  const toggleSave = async (item: Article) => {
    if (saved.includes(item.id)) {
      setSaved(prev => prev.filter(id => id !== item.id))
      showToast("Removida do banco de pautas")
      return
    }
    try {
      const res = await fetch("/api/pautas", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          titulo:item.title, nota:item.summary, categoria:item.category, fonte:item.source,
          prioridade:item.relevance==="Alto"?"Alta":item.relevance==="Médio"?"Média":"Baixa",
          estagio:"Ideia", tags:[],
        }),
      })
      if (!res.ok) throw new Error()
      setSaved(prev => [...prev, item.id])
      showToast("Adicionada ao banco de pautas!")
    } catch { showToast("Erro ao salvar pauta.") }
  }

  const saveOpportunityAsPauta = async (opp: Opportunity) => {
    try {
      const res = await fetch("/api/pautas", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          titulo:opp.topic, nota:opp.why, categoria:"Oportunidade de Conteúdo",
          prioridade: opp.score >= 90 ? "Alta" : opp.score >= 75 ? "Média" : "Baixa",
          estagio:"Ideia", tags:opp.keywords,
        }),
      })
      if (!res.ok) throw new Error()
      setSavedOpps(prev => new Set(prev).add(opp.id))
      showToast("Oportunidade salva no banco de pautas!")
    } catch { showToast("Erro ao salvar pauta.") }
  }

  const openReverseModal = (reel: Reel) => {
    setReverseReel(reel); setReverseResult(null); setReverseSent(false); setLoadingReverse(true)
    fetch("/api/roteiros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 2000,
        system: `Você é um analista de conteúdo médico viral especializado em engenharia reversa de Reels. Retorne SOMENTE JSON, sem markdown.`,
        messages: [{
          role: "user",
          content: `Analise este Reel médico viral:

Título: "${reel.title}"
Plataforma: ${reel.platform}
Visualizações: ${reel.views}
Taxa de engajamento: ${reel.engagement}
Categoria: ${reel.category}

Retorne um objeto JSON com:
{
  "gancho": "o que prende nos primeiros 3 segundos — técnica específica usada",
  "estrutura": "sequência narrativa do conteúdo — como o vídeo progride",
  "retencao": "estimativa de retenção % com justificativa",
  "gatilhos": ["gatilho 1", "gatilho 2", "gatilho 3"],
  "cta": "direto|indireto|implícito",
  "autoridade": número inteiro 0-10,
  "polemica": número inteiro 0-10,
  "compartilhamento": "Baixo|Médio|Alto|Viral",
  "versao_adaptada": {
    "titulo": "título adaptado para o médico usuário — Endocrinologia/Nutrologia/Longevidade",
    "gancho": "abertura adaptada para o estilo clínico e científico do médico",
    "estrutura": ["ponto 1", "ponto 2", "ponto 3", "ponto 4", "ponto 5"]
  }
}`,
        }],
      }),
    })
    .then(r => r.json())
    .then(data => {
      const raw   = (data.content?.[0]?.text ?? "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      const start = raw.indexOf("{")
      const result = JSON.parse(start >= 0 ? raw.slice(start) : raw) as ReverseResult
      setReverseResult(result)
    })
    .catch(() => setReverseResult(null))
    .finally(() => setLoadingReverse(false))
  }

  const sendAdaptedToPautas = async () => {
    if (!reverseResult || !reverseReel) return
    try {
      const res = await fetch("/api/pautas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo:     reverseResult.versao_adaptada.titulo,
          nota:       `[ENGENHARIA REVERSA DE: "${reverseReel.title}" — ${reverseReel.views} views]\n\nGancho: ${reverseResult.versao_adaptada.gancho}\n\nEstrutura:\n${reverseResult.versao_adaptada.estrutura.join('\n')}`,
          categoria:  reverseReel.category,
          prioridade: "Alta",
          estagio:    "Ideia",
          tags:       ["engenharia-reversa", reverseReel.platform.toLowerCase()],
        }),
      })
      if (!res.ok) throw new Error()
      setReverseSent(true)
      showToast("Pauta salva no Banco de Pautas!")
    } catch { showToast("Erro ao salvar pauta.") }
  }

  const sendAdaptedToRoteiros = () => {
    if (!reverseResult) return
    const v    = reverseResult.versao_adaptada
    const text = `${v.titulo}\n\n${v.gancho}\n\n${v.estrutura.join('\n')}`
    localStorage.setItem("praxis_roteiro_tema", text)
    router.push("/roteiros")
  }

  const fmtTime = (d: Date | null) => d ? d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : "--:--"

  const TABS = [
    {id:"radar"         as Tab, label:"Radar",              icon:Radio,      },
    {id:"reels"         as Tab, label:"Top Reels",          icon:Play,       },
    {id:"velocity"      as Tab, label:"Tendência Emergente",icon:TrendingUp, },
    {id:"opportunities" as Tab, label:"Oportunidades",      icon:Target,     },
  ]

  const filterPill = (active: boolean, onClick: ()=>void, label: string, size="text-[11px] px-3 py-1") => (
    <button onClick={onClick} className={cn(
      size,"rounded-full border transition-all",
      active ? "bg-accent-dim border-accent-border text-accent font-medium" : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
    )}>{label}</button>
  )

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Radar de Tendências"
        subtitle={`NUTROLOGIA · ENDOCRINOLOGIA · LONGEVIDADE · Atualizado às ${fmtTime(lastUpdate)}`}
        tagline="Descubra o que está funcionando nas redes antes da concorrência e transforme em conteúdo."
        actions={
          <button onClick={handleRefresh} disabled={currentLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-50">
            <RefreshCw className={cn("w-3.5 h-3.5",currentLoading&&"animate-spin")} />
            {currentLoading ? "Escaneando..." : "Atualizar"}
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-5">

        {/* ── TABS ── */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-medium transition-all flex-1 justify-center",
                  activeTab === tab.id ? "bg-accent-dim border border-accent-border text-accent" : "text-text-muted hover:text-text-secondary"
                )}>
                <Icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            )
          })}
        </div>

        {/* ── FILTERS ── */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">

          {/* Period */}
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase w-16 flex-shrink-0">Período</span>
            <div className="flex flex-wrap gap-1.5">
              {PERIODS.map(p => filterPill(filters.period===p.value, ()=>setFilters(f=>({...f,period:p.value})), p.label))}
            </div>
          </div>

          {/* Topics */}
          <div className="flex items-start gap-4">
            <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase w-16 flex-shrink-0 pt-1">Tópico</span>
            <div className="flex flex-wrap gap-1.5">
              {TOPIC_FILTERS.map(t => (
                <button key={t} onClick={() => setFilters(f=>({...f,topic:t}))}
                  className={cn(
                    "text-[10px] px-2.5 py-0.5 rounded-full border transition-all",
                    filters.topic===t ? "bg-blue-50 border-blue-300 text-blue-700 font-medium" : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                  )}>{t}</button>
              ))}
            </div>
          </div>

          {/* Sources — grouped */}
          <div className="flex items-start gap-4">
            <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase w-16 flex-shrink-0 pt-1">Fonte</span>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex flex-wrap gap-1.5">
                {filterPill(filters.source==="Todos", ()=>setFilters(f=>({...f,source:"Todos"})), "Todos")}
              </div>
              {Object.entries(SOURCE_GROUPS).map(([group, srcs]) => (
                <div key={group} className="flex items-start gap-2">
                  <span className="text-[8px] font-mono text-text-muted/50 uppercase w-14 flex-shrink-0 pt-1 tracking-wider">{group}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {srcs.map(s => (
                      <button key={s} onClick={()=>setFilters(f=>({...f,source:s}))}
                        className={cn(
                          "text-[10px] px-2.5 py-0.5 rounded-full border transition-all",
                          filters.source===s ? "bg-accent-dim border-accent-border text-accent font-medium" : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                        )}>{s}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category — only radar tab */}
          {activeTab === "radar" && (
            <div className="flex items-start gap-4">
              <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase w-16 flex-shrink-0 pt-1">Categoria</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES_LIST.map(c => (
                  <button key={c} onClick={()=>setFilters(f=>({...f,category:c}))}
                    className={cn(
                      "text-[10px] px-2.5 py-0.5 rounded-full border transition-all",
                      filters.category===c ? "bg-accent-dim border-accent-border text-accent font-medium" : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                    )}>{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="pt-1">
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar por tema ou palavra-chave..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════
            TAB: RADAR
        ══════════════════════════════════════════ */}
        {activeTab === "radar" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {[
                {label:"Tendências",    value:articles.length},
                {label:"Urgência Alta", value:articles.filter(a=>a.relevance==="Alto").length},
                {label:"Fontes",        value:new Set(articles.map(a=>a.source)).size},
                {label:"Na Pauta",      value:saved.length},
              ].map(s=>(
                <div key={s.label} className="bg-card border border-border rounded-lg py-3 px-4">
                  <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">{s.label}</div>
                  <div className="text-2xl font-bold text-accent-text mt-1">{s.value}</div>
                </div>
              ))}
            </div>

            {loadingRadar ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="w-8 h-8 text-accent animate-spin" />
                <span className="text-[11px] font-mono text-text-muted tracking-widest">VARRENDO FONTES MÉDICAS...</span>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16 text-text-muted text-[13px]">Nenhuma tendência encontrada.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map(item => (
                  <div key={item.id} className={cn(
                    "bg-card border rounded-lg p-5 transition-all duration-200 hover:-translate-y-0.5",
                    item.relevance==="Alto"  && "border-l-2 border-l-red-500   border-border hover:border-red-500/30",
                    item.relevance==="Médio" && "border-l-2 border-l-amber-500 border-border hover:border-amber-500/30",
                    item.relevance==="Baixo" && "border-l-2 border-l-green-600 border-border hover:border-green-600/30",
                  )}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SourceBadge source={item.source} />
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">{item.category}</span>
                      </div>
                      <RelevanceBadge level={item.relevance} />
                    </div>
                    <h3 className="text-[13px] font-semibold text-text-primary leading-snug mb-2">{item.title}</h3>
                    <p className="text-[11px] text-text-secondary leading-relaxed mb-4">{item.summary}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-text-muted">{item.date}</span>
                      <button onClick={()=>toggleSave(item)}
                        className={cn(
                          "flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all",
                          saved.includes(item.id) ? "bg-accent-dim border-accent-border text-accent" : "border-border text-text-muted hover:border-accent-border hover:text-accent"
                        )}>
                        {saved.includes(item.id) ? <Check className="w-3 h-3"/> : <Plus className="w-3 h-3"/>}
                        {saved.includes(item.id) ? "Na Pauta" : "Transformar em Pauta"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            TAB: TOP REELS
        ══════════════════════════════════════════ */}
        {activeTab === "reels" && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-text-primary">Top Reels em Saúde</h2>
                <p className="text-[11px] text-text-muted mt-0.5">Conteúdos com maior visualização e engajamento • Instagram, TikTok, YouTube</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-text-muted">Ordenar:</span>
                {(["views","engagement"] as const).map(s=>(
                  <button key={s} onClick={()=>setReelSort(s)}
                    className={cn(
                      "text-[11px] px-3 py-1 rounded-full border transition-all",
                      reelSort===s ? "bg-accent-dim border-accent-border text-accent font-medium" : "border-border text-text-muted hover:text-text-secondary"
                    )}>
                    {s==="views"?"Visualizações":"Engajamento"}
                  </button>
                ))}
              </div>
            </div>

            {loadingReels ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Play className="w-8 h-8 text-accent animate-pulse"/>
                <span className="text-[11px] font-mono text-text-muted tracking-widest">ESCANEANDO REELS VIRAIS...</span>
              </div>
            ) : sortedReels.length === 0 ? (
              <div className="text-center py-16 text-text-muted text-[13px]">Nenhum reel encontrado.</div>
            ) : (
              <div className="space-y-1.5">
                {sortedReels.map((reel, idx) => (
                  <div key={reel.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 hover:border-border-hover transition-all group">
                    <span className={cn(
                      "text-[12px] font-mono font-bold w-6 flex-shrink-0 text-center tabular-nums",
                      idx===0&&"text-yellow-400", idx===1&&"text-slate-300", idx===2&&"text-amber-600", idx>2&&"text-text-muted"
                    )}>
                      {idx+1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-text-primary truncate">{reel.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <PlatformBadge platform={reel.platform}/>
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">{reel.category}</span>
                        <span className="text-[10px] font-mono font-bold text-text-primary tabular-nums">{reel.views} <span className="text-[10px] font-normal text-text-muted">views</span></span>
                        <span className={cn("text-[10px] font-mono font-bold tabular-nums", parseFloat(reel.engagement)>15?"text-accent":"text-text-primary")}>{reel.engagement} <span className="text-[10px] font-normal text-text-muted">engaj.</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openReverseModal(reel)}
                        title="Engenharia Reversa"
                        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all whitespace-nowrap"
                      >
                        <Microscope className="w-3 h-3" />
                        <span className="hidden sm:inline">Engenharia Reversa</span>
                      </button>
                      {reel.link && reel.link !== "#" ? (
                        <a href={reel.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 text-text-muted hover:text-accent transition-colors"/>
                        </a>
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-text-muted/20"/>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            TAB: TREND VELOCITY SCORE
        ══════════════════════════════════════════ */}
        {activeTab === "velocity" && (
          <>
            <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"/>
              <div>
                <h2 className="text-[13px] font-semibold text-text-primary mb-0.5">Trend Velocity Score</h2>
                <p className="text-[11px] text-text-secondary">Score composto (0–100) que avalia velocidade de crescimento de buscas, volume de menções e publicações científicas recentes. Score alto = tema ganhando tração rapidamente.</p>
              </div>
            </div>

            {loadingVel ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <TrendingUp className="w-8 h-8 text-accent animate-pulse"/>
                <span className="text-[11px] font-mono text-text-muted tracking-widest">CALCULANDO VELOCITY SCORES...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {[...velocity].sort((a,b)=>b.score-a.score).map((item, idx) => (
                  <div key={item.id} className="bg-card border border-border rounded-lg p-4 hover:border-border-hover transition-all">
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] w-8 text-center flex-shrink-0">{item.trend}</span>
                      <span className="text-[10px] font-mono text-text-muted w-5 text-right flex-shrink-0">{idx+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[13px] font-semibold text-text-primary">{item.topic}</span>
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">{item.category}</span>
                        </div>
                        <div className="relative h-1.5 bg-background rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 rounded-full",
                              item.score>=90&&"bg-red-500",
                              item.score>=70&&item.score<90&&"bg-amber-400",
                              item.score>=50&&item.score<70&&"bg-accent",
                              item.score<50&&"bg-blue-500"
                            )}
                            style={{width:`${item.score}%`}}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
                        <div className="text-right">
                          <div className={cn(
                            "text-[20px] font-bold tabular-nums leading-none",
                            item.score>=90&&"text-red-400",
                            item.score>=70&&item.score<90&&"text-amber-400",
                            item.score>=50&&item.score<70&&"text-accent",
                            item.score<50&&"text-blue-400"
                          )}>{item.score}</div>
                          <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider">score</div>
                        </div>
                        <div className="hidden sm:block text-right">
                          <div className="text-[13px] font-bold text-green-400 tabular-nums">{item.growth}</div>
                          <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider">crescim.</div>
                        </div>
                        <div className="hidden md:block text-right">
                          <div className="text-[13px] font-bold text-text-primary tabular-nums">{item.mentions.toLocaleString("pt-BR")}</div>
                          <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider">menções</div>
                        </div>
                        <div className="hidden md:block text-right">
                          <div className="text-[13px] font-bold text-blue-400 tabular-nums">{item.publications}</div>
                          <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider">publicações</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            TAB: OPORTUNIDADES DE CONTEÚDO
        ══════════════════════════════════════════ */}
        {activeTab === "opportunities" && (
          <>
            <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5"/>
              <div>
                <h2 className="text-[13px] font-semibold text-text-primary mb-0.5">Oportunidades de Conteúdo para Seu Perfil</h2>
                <p className="text-[11px] text-text-secondary">A IA analisa <strong className="text-text-primary">tendência crescente + baixa concorrência + alto engajamento</strong> e retorna os melhores gaps de conteúdo para explorar agora.</p>
              </div>
            </div>

            {loadingOpp ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Sparkles className="w-8 h-8 text-accent animate-pulse"/>
                <span className="text-[11px] font-mono text-text-muted tracking-widest">ANALISANDO OPORTUNIDADES...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...opportunities].sort((a,b)=>b.score-a.score).map(opp => (
                  <div key={opp.id} className={cn(
                    "bg-card border rounded-lg p-5 transition-all hover:-translate-y-0.5",
                    opp.score>=90 ? "border-l-2 border-l-accent border-border" : "border-l-2 border-l-blue-500/60 border-border"
                  )}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-[14px] font-bold text-text-primary leading-tight">{opp.topic}</h3>
                      <span className={cn(
                        "flex-shrink-0 text-[12px] font-bold px-2.5 py-1 rounded-full font-mono",
                        opp.score>=90 ? "bg-accent-dim border border-accent-border text-accent" : "bg-blue-50 border border-blue-200 text-blue-700"
                      )}>{opp.score}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-background rounded-lg p-2 text-center">
                        <div className="text-[12px] font-bold text-green-400">{opp.growth}</div>
                        <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider mt-0.5">Crescimento</div>
                      </div>
                      <div className="bg-background rounded-lg p-2 text-center">
                        <div className={cn("text-[11px] font-bold leading-tight",
                          (opp.competition==="Muito Baixa"||opp.competition==="Baixa")?"text-accent":"text-amber-400"
                        )}>{opp.competition}</div>
                        <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider mt-0.5">Concorrência</div>
                      </div>
                      <div className="bg-background rounded-lg p-2 text-center">
                        <div className={cn("text-[11px] font-bold leading-tight",
                          (opp.sharing==="Muito Alto"||opp.sharing==="Alto")?"text-blue-400":"text-text-secondary"
                        )}>{opp.sharing}</div>
                        <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider mt-0.5">Potencial</div>
                      </div>
                    </div>

                    <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{opp.why}</p>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {opp.platforms.map(p => <PlatformBadge key={p} platform={p}/>)}
                      {opp.keywords.slice(0,3).map(k => (
                        <span key={k} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">#{k}</span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-[9px] font-mono text-text-muted">Tendência há {opp.trending_since}</span>
                      <button
                        onClick={() => !savedOpps.has(opp.id) && saveOpportunityAsPauta(opp)}
                        disabled={savedOpps.has(opp.id)}
                        className={cn(
                          "flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all",
                          savedOpps.has(opp.id)
                            ? "bg-accent-dim border-accent-border text-accent cursor-default"
                            : "border-border text-text-muted hover:border-accent-border hover:text-accent"
                        )}>
                        {savedOpps.has(opp.id) ? <Check className="w-3 h-3"/> : <Plus className="w-3 h-3"/>}
                        {savedOpps.has(opp.id) ? "Na Pauta" : "Criar Pauta"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-[200]">
          <Check className="w-3.5 h-3.5"/> {toast}
        </div>
      )}

      {/* ══ ENGENHARIA REVERSA MODAL ══ */}
      {reverseReel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,9,14,0.90)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-2xl rounded-xl border flex flex-col"
            style={{ background: "var(--surface)", borderColor: "var(--border)", maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <Microscope className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-[13px] font-semibold text-text-primary">Engenharia Reversa</span>
                <PlatformBadge platform={reverseReel.platform} />
                <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">
                  {reverseReel.category}
                </span>
              </div>
              <button
                onClick={() => { setReverseReel(null); setReverseResult(null) }}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-text-muted hover:text-text-primary transition-all flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reel info */}
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-[13px] font-medium text-text-primary leading-snug">{reverseReel.title}</p>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-[10px] font-mono text-accent">{reverseReel.views} views</span>
                <span className="text-[10px] font-mono text-text-muted">{reverseReel.engagement} engajamento</span>
                <span className="text-[9px] text-text-muted">#{reverseReel.rank}</span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Loading */}
              {loadingReverse && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Microscope className="w-10 h-10 text-accent animate-pulse" />
                  <div className="text-center">
                    <div className="text-[13px] font-semibold text-text-primary">Analisando estrutura viral...</div>
                    <div className="text-[9px] font-mono text-text-muted tracking-widest mt-1">LABORATÓRIO DE VIRALIZAÇÃO</div>
                  </div>
                </div>
              )}

              {/* Error fallback */}
              {!loadingReverse && !reverseResult && (
                <div className="text-center py-10 text-text-muted text-[12px]">
                  Não foi possível analisar este reel. Tente novamente.
                </div>
              )}

              {/* Analysis */}
              {reverseResult && !loadingReverse && (
                <>
                  {/* Technical analysis */}
                  <div>
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-3">Análise Técnica</div>
                    <div className="grid grid-cols-2 gap-3">

                      <div className="bg-background rounded-lg p-3 col-span-2">
                        <div className="text-[9px] font-mono text-text-muted mb-1.5">GANCHO INICIAL</div>
                        <p className="text-[12px] text-text-primary leading-relaxed">{reverseResult.gancho}</p>
                      </div>

                      <div className="bg-background rounded-lg p-3 col-span-2">
                        <div className="text-[9px] font-mono text-text-muted mb-1.5">ESTRUTURA NARRATIVA</div>
                        <p className="text-[12px] text-text-secondary leading-relaxed">{reverseResult.estrutura}</p>
                      </div>

                      <div className="bg-background rounded-lg p-3">
                        <div className="text-[9px] font-mono text-text-muted mb-1.5">RETENÇÃO ESTIMADA</div>
                        <p className="text-[12px] text-text-primary">{reverseResult.retencao}</p>
                      </div>

                      <div className="bg-background rounded-lg p-3">
                        <div className="text-[9px] font-mono text-text-muted mb-1.5">TIPO DE CTA</div>
                        <p className="text-[13px] font-semibold text-text-primary capitalize">{reverseResult.cta}</p>
                      </div>

                      <div className="bg-background rounded-lg p-3">
                        <div className="text-[9px] font-mono text-text-muted mb-2">GATILHOS EMOCIONAIS</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(reverseResult.gatilhos ?? []).map((g, i) => (
                            <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-background rounded-lg p-3 grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider mb-1">Autoridade</div>
                          <div className="text-[20px] font-bold text-violet-400 tabular-nums">{reverseResult.autoridade}<span className="text-[11px] text-text-muted">/10</span></div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider mb-1">Polêmica</div>
                          <div className="text-[20px] font-bold text-orange-400 tabular-nums">{reverseResult.polemica}<span className="text-[11px] text-text-muted">/10</span></div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider mb-1">Viral</div>
                          <div className={cn(
                            "text-[13px] font-bold leading-tight mt-1",
                            reverseResult.compartilhamento === "Viral" ? "text-red-400" :
                            reverseResult.compartilhamento === "Alto"  ? "text-accent" :
                            reverseResult.compartilhamento === "Médio" ? "text-amber-400" : "text-text-secondary"
                          )}>
                            {reverseResult.compartilhamento}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adapted version */}
                  <div className="border border-accent-border/50 rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 bg-accent-dim/20 border-b border-accent-border/30">
                      <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest">
                        VERSÃO ADAPTADA PARA DR. BRUNO
                      </span>
                      <span className="text-[9px] font-mono text-text-muted ml-2">Endocrinologia · Nutrologia · Longevidade</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-[9px] font-mono text-text-muted mb-1">TÍTULO ADAPTADO</div>
                        <p className="text-[13px] font-semibold text-text-primary leading-snug">
                          {reverseResult.versao_adaptada?.titulo}
                        </p>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-text-muted mb-1">GANCHO ADAPTADO</div>
                        <p className="text-[12px] text-text-secondary italic leading-relaxed">
                          {reverseResult.versao_adaptada?.gancho}
                        </p>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-text-muted mb-2">ESTRUTURA ADAPTADA</div>
                        <div className="space-y-1.5">
                          {(reverseResult.versao_adaptada?.estrutura ?? []).map((p, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-[9px] font-bold font-mono text-accent flex-shrink-0 mt-0.5">{i + 1}</span>
                              <p className="text-[11px] text-text-secondary leading-snug">{p.replace(/^\d+\.\s*/, "")}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                        <button
                          onClick={sendAdaptedToPautas}
                          disabled={reverseSent}
                          className={cn(
                            "flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-lg border transition-all",
                            reverseSent
                              ? "bg-accent-dim border-accent-border text-accent"
                              : "border-border text-text-muted hover:border-accent-border hover:text-accent"
                          )}
                        >
                          {reverseSent ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          {reverseSent ? "Salvo na Pauta" : "Enviar para Banco de Pautas"}
                        </button>
                        <button
                          onClick={sendAdaptedToRoteiros}
                          className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all"
                        >
                          <Zap className="w-3.5 h-3.5" /> Enviar para Gerador de Roteiros
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
