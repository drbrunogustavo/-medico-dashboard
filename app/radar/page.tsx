"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { RefreshCw, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const SOURCES_LIST   = ["Todos","PubMed","The Lancet","NEJM","Nature Medicine","MedScape","G1 Saúde","CNN Health","Instagram Trending"]
const CATEGORIES_LIST = ["Todos","Nutrologia","Endocrinologia","Longevidade","Metabolismo","Microbioma","Hormônios","Anti-aging","Genômica"]
const PERIODS        = ["24h","Semana","Mês"]

const SOURCE_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  "PubMed":            { bg:"bg-emerald-950/60", border:"border-emerald-600/40", text:"text-emerald-400", dot:"bg-emerald-400" },
  "The Lancet":        { bg:"bg-violet-950/60",  border:"border-violet-600/40",  text:"text-violet-400", dot:"bg-violet-400"  },
  "NEJM":              { bg:"bg-blue-950/60",    border:"border-blue-600/40",    text:"text-blue-400",   dot:"bg-blue-400"    },
  "Nature Medicine":   { bg:"bg-lime-950/60",    border:"border-lime-600/40",    text:"text-lime-400",   dot:"bg-lime-400"    },
  "MedScape":          { bg:"bg-fuchsia-950/60", border:"border-fuchsia-600/40", text:"text-fuchsia-400",dot:"bg-fuchsia-400" },
  "G1 Saúde":          { bg:"bg-amber-950/60",   border:"border-amber-600/40",   text:"text-amber-400",  dot:"bg-amber-400"   },
  "CNN Health":        { bg:"bg-red-950/60",      border:"border-red-600/40",     text:"text-red-400",    dot:"bg-red-400"     },
  "Instagram Trending":{ bg:"bg-purple-950/60",  border:"border-purple-600/40",  text:"text-purple-400", dot:"bg-purple-400"  },
}

const RELEVANCE_STYLES: Record<string, { bg: string; border: string; text: string; pulse: boolean }> = {
  "Alto":  { bg:"bg-red-950/60",   border:"border-red-500/50",   text:"text-red-400",   pulse:true  },
  "Médio": { bg:"bg-amber-950/60", border:"border-amber-500/50", text:"text-amber-400", pulse:false },
  "Baixo": { bg:"bg-green-950/60", border:"border-green-600/50", text:"text-green-400", pulse:false },
}

const MOCK_DATA = [
  { id:1, title:"Restrição calórica intermitente e marcadores de longevidade: novo estudo randomizado", source:"PubMed", category:"Longevidade", date:"03/05/2025", relevance:"Alto", summary:"Estudo controlado demonstra redução de 18% nos marcadores inflamatórios com jejum 16:8 por 12 semanas. Pesquisadores destacam impacto na expressão de sirtuínas." },
  { id:2, title:"GLP-1 além da diabetes: evidências emergentes para doenças neurodegenerativas", source:"The Lancet", category:"Endocrinologia", date:"02/05/2025", relevance:"Alto", summary:"Revisão sistemática aponta benefício neuroprotetor dos agonistas GLP-1 em modelos de Alzheimer e Parkinson. Ensaios clínicos de fase III já em andamento." },
  { id:3, title:"Microbiota e eixo intestino-tireoide: novas vias regulatórias identificadas", source:"Nature Medicine", category:"Microbioma", date:"01/05/2025", relevance:"Alto", summary:"Pesquisadores mapearam como bactérias do gênero Akkermansia modulam a conversão de T4 para T3. Descoberta pode revolucionar o tratamento do hipotireoidismo subclínico." },
  { id:4, title:"Protocolo de crioterapia corporal inteira viraliza entre biohackers de saúde", source:"Instagram Trending", category:"Longevidade", date:"03/05/2025", relevance:"Médio", summary:"Influenciadores promovem sessões de -110°C como protocolo anti-aging. Comunidade médica alerta para ausência de evidências em humanos saudáveis." },
  { id:5, title:"Resistência insulínica subclínica: prevalência subestimada em adultos eutróficos", source:"NEJM", category:"Metabolismo", date:"30/04/2025", relevance:"Alto", summary:"Coorte de 12.000 participantes revela que 34% dos adultos com IMC normal apresentam resistência insulínica. Novo critério diagnóstico proposto." },
  { id:6, title:"Testosterona e envelhecimento cardiovascular: meta-análise de 48 estudos", source:"MedScape", category:"Hormônios", date:"02/05/2025", relevance:"Médio", summary:"Meta-análise robusta esclarece relação entre reposição de testosterona e risco cardiovascular em homens acima de 50 anos." },
]

interface Article {
  id: number
  title: string
  source: string
  category: string
  date: string
  relevance: string
  summary: string
}

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_STYLES[source] || { bg:"bg-slate-900", border:"border-slate-700", text:"text-slate-400", dot:"bg-slate-400" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border", s.bg, s.border, s.text)}>
      <span className={cn("w-1 h-1 rounded-full flex-shrink-0", s.dot)} />
      {source}
    </span>
  )
}

function RelevanceBadge({ level }: { level: string }) {
  const s = RELEVANCE_STYLES[level] || RELEVANCE_STYLES["Baixo"]
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-mono font-semibold px-2.5 py-1 rounded-full border tracking-wider", s.bg, s.border, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", s.text.replace("text-","bg-"), s.pulse && "animate-ping")} />
      {level}
    </span>
  )
}

export default function RadarPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading]   = useState(false)
  const [saved, setSaved]       = useState<number[]>([])
  const [search, setSearch]     = useState("")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [toast, setToast]       = useState<string | null>(null)
  const [filters, setFilters]   = useState({ source:"Todos", category:"Todos", period:"Semana" })
  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 2600)
  }

  const fetchTrends = useCallback(async () => {
    setLoading(true)
    const periodMap: Record<string,string> = { "24h":"last 24 hours", "Semana":"last 7 days", "Mês":"last 30 days" }
    const periodLabel  = periodMap[filters.period] || "last 7 days"
    const sourceFilter = filters.source   !== "Todos" ? ` focusing on ${filters.source}`   : ""
    const catFilter    = filters.category !== "Todos" ? ` in the area of ${filters.category}` : ""

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: "You are a medical intelligence aggregator for a Brazilian dashboard. Return ONLY a valid JSON array, no markdown, no backticks. Respond in Brazilian Portuguese.",
          messages: [{
            role: "user",
            content: `Search top 8 trending medical topics${catFilter} from ${periodLabel}${sourceFilter} relevant to nutrologia, endocrinologia, longevidade, metabolismo, microbioma, hormônios, anti-aging, genômica. Return JSON array with: title (Portuguese, max 120 chars), source (PubMed|The Lancet|NEJM|Nature Medicine|MedScape|G1 Saúde|CNN Health|Instagram Trending), category (Nutrologia|Endocrinologia|Longevidade|Metabolismo|Microbioma|Hormônios|Anti-aging|Genômica), date (DD/MM/YYYY), relevance (Alto|Médio|Baixo), summary (2 sentences Portuguese).`
          }]
        })
      })
      const data = await res.json()
      let jsonText = ""
      for (const block of (data.content || [])) {
        if (block.type === "text") jsonText += block.text
      }
      const clean  = jsonText.replace(/```json|```/g,"").trim()
      const idx    = clean.indexOf("[")
      const parsed = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
      setArticles(parsed.map((a: Article, i: number) => ({ ...a, id: Date.now() + i })))
      setLastUpdate(new Date())
    } catch {
      setArticles(MOCK_DATA)
      setLastUpdate(new Date())
    }
    setLoading(false)
  }, [filters])

  useEffect(() => { fetchTrends() }, [])

  const filtered = articles.filter(a => {
    if (filters.source   !== "Todos" && a.source   !== filters.source)   return false
    if (filters.category !== "Todos" && a.category !== filters.category) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.summary.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleSave = async (item: Article) => {
  if (saved.includes(item.id)) {
    setSaved(prev => prev.filter(id => id !== item.id))
    showToast("Removida do banco de pautas")
    return
  }
  try {
    const res = await fetch("/api/pautas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: item.title,
        descricao: item.summary,
        categoria: item.category,
        fonte: item.source,
      }),
    })
    if (!res.ok) throw new Error()
    setSaved(prev => [...prev, item.id])
    showToast("Adicionada ao banco de pautas!")
  } catch {
    showToast("Erro ao salvar pauta.")
  }
}
      }
      showToast("Adicionada ao banco de pautas!")
      return [...prev, item.id]
    })
  }

  const fmtTime = (d: Date | null) => d ? d.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" }) : "--:--"

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Radar de Tendências"
        subtitle={`NUTROLOGIA · ENDOCRINOLOGIA · LONGEVIDADE · Atualizado às ${fmtTime(lastUpdate)}`}
        actions={
          <button
            onClick={fetchTrends}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            {loading ? "Escaneando..." : "Atualizar Radar"}
          </button>
        }
      />

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          {[
            { label: "Fonte",     items: SOURCES_LIST,    key: "source"   as const },
            { label: "Categoria", items: CATEGORIES_LIST, key: "category" as const },
            { label: "Período",   items: PERIODS,         key: "period"   as const },
          ].map(group => (
            <div key={group.key} className="flex items-center gap-4">
              <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase w-16 flex-shrink-0">{group.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map(item => (
                  <button
                    key={item}
                    onClick={() => setFilters(f => ({ ...f, [group.key]: item }))}
                    className={cn(
                      "text-[11px] px-3 py-1 rounded-full border transition-all",
                      filters[group.key] === item
                        ? "bg-accent-dim border-accent-border text-accent-text font-medium"
                        : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-1">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por tema ou palavra-chave..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label:"Tendências",    value: articles.length,                                     },
            { label:"Urgência Alta", value: articles.filter(a=>a.relevance==="Alto").length,     },
            { label:"Fontes",        value: new Set(articles.map(a=>a.source)).size,             },
            { label:"Na Pauta",      value: saved.length,                                        },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg py-3 px-4">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">{s.label}</div>
              <div className="text-2xl font-bold text-accent-text mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
            <span className="text-[11px] font-mono text-text-muted tracking-widest">VARRENDO FONTES MÉDICAS...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-[13px]">Nenhuma tendência encontrada para os filtros selecionados.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(item => (
              <div
                key={item.id}
                className={cn(
                  "bg-card border rounded-lg p-5 transition-all duration-200 hover:-translate-y-0.5",
                  item.relevance === "Alto"  && "border-l-2 border-l-red-500   border-border hover:border-red-500/30",
                  item.relevance === "Médio" && "border-l-2 border-l-amber-500 border-border hover:border-amber-500/30",
                  item.relevance === "Baixo" && "border-l-2 border-l-green-600 border-border hover:border-green-600/30",
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SourceBadge source={item.source} />
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">
                      {item.category}
                    </span>
                  </div>
                  <RelevanceBadge level={item.relevance} />
                </div>
                <h3 className="text-[13px] font-semibold text-text-primary leading-snug mb-2">{item.title}</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed mb-4">{item.summary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-text-muted">{item.date}</span>
                  <button
                    onClick={() => toggleSave(item)}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all",
                      saved.includes(item.id)
                        ? "bg-accent-dim border-accent-border text-accent"
                        : "border-border text-text-muted hover:border-accent-border hover:text-accent"
                    )}
                  >
                    {saved.includes(item.id) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {saved.includes(item.id) ? "Na Pauta" : "Transformar em Pauta"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          <Check className="w-3.5 h-3.5" /> {toast}
        </div>
      )}
    </div>
  )
}
