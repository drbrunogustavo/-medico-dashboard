"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, Microscope, ExternalLink, ChevronDown, ChevronRight } from "lucide-react"
import { Panel, PxButton, PxInput, Segmented, Tag, PageHeader, PxModal } from "@/components/px"
import { pedirJSON, mensagemErroIA } from "@/lib/ia-json"

const SOURCE_GROUPS: Record<string, string[]> = {
  "Social": ["Instagram Trending", "TikTok Trending", "YouTube Trending", "X (Twitter)", "Reddit", "Reddit Health", "Reddit Longevity", "Reddit Biohackers", "Reddit Menopause", "Reddit Testosterone", "Reddit Weight Loss", "Reddit Nutrition", "Instagram Viral Intelligence"],
  "Científica": ["PubMed", "The Lancet", "NEJM", "Nature Medicine", "BMJ", "JAMA", "medRxiv", "bioRxiv"],
  "Clínica e notícias": ["MedScape", "MedPage Today", "STAT News", "Fierce Healthcare", "Endocrine News", "Healio Endocrinologia", "Medscape Brasil", "UpToDate", "Healthline", "Mayo Clinic", "FDA", "SBD", "G1 Saúde", "CNN Health"],
}
const TOPIC_FILTERS = ["Todos", "GLP-1", "Tirzepatida", "Retatrutida", "Testosterona", "Libido", "Disfunção Erétil", "Andropausa", "Massa Muscular", "Menopausa", "Terapia Hormonal", "Libido Feminina", "Sarcopenia", "Jejum", "Mitos", "Dietas", "Hacks", "Protocolos", "Saúde Mental"]
const CATEGORIES_LIST = ["Todos", "Nutrologia", "Endocrinologia", "Longevidade", "Metabolismo", "Microbioma", "Hormônios", "Anti-aging", "Genômica", "Obesidade", "Nutrição Clínica", "Saúde Mental", "Cardiometabolismo", "Medicina do Esporte", "Suplementação", "Sono e Cronobiologia", "Imunologia", "Menopausa", "Andropausa", "Envelhecimento", "Terapia Hormonal", "Emagrecimento"]
const PERIODS = [{ label: "24 horas", value: "24h" }, { label: "7 dias", value: "7d" }, { label: "30 dias", value: "30d" }, { label: "90 dias", value: "90d" }, { label: "180 dias", value: "180d" }]

interface Article { id: number; title: string; source: string; category: string; date: string; relevance: string; summary: string }
interface Reel { id: number; rank: number; title: string; platform: string; views: string; engagement: string; link: string; category: string }
interface VelocityItem { id: number; topic: string; score: number; growth: string; mentions: number; publications: number; category: string }
interface Opportunity { id: number; topic: string; growth: string; competition: string; sharing: string; score: number; trending_since: string; why: string; keywords: string[]; platforms: string[] }
interface ReverseResult {
  gancho: string; estrutura: string; retencao: string; gatilhos: string[]; cta: string; autoridade: number; polemica: number
  compartilhamento: "Baixo" | "Médio" | "Alto" | "Viral"; versao_adaptada: { titulo: string; gancho: string; estrutura: string[] }
}
type Tab = "radar" | "reels" | "velocity" | "opportunities"
type Filters = { source: string; category: string; topic: string; period: string }

const AVISO = "Resultados gerados por IA com busca na web. Números de visualizações, engajamento, menções e crescimento são estimativas, não medições das plataformas. Confira a fonte antes de publicar."
const TAB_OPTS: { value: Tab; label: string }[] = [{ value: "radar", label: "Radar" }, { value: "reels", label: "Top Reels" }, { value: "velocity", label: "Tendência emergente" }, { value: "opportunities", label: "Oportunidades" }]
const SEM_ERRO: Record<Tab, string | null> = { radar: null, reels: null, velocity: null, opportunities: null }

function Pill({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${ativo ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>{children}</button>
  )
}
const Barra = ({ valor, rotulo }: { valor: number; rotulo: string }) => (
  <div role="img" aria-label={rotulo} className="h-2 rounded-full bg-px-ink/10"><div className="h-2 rounded-full bg-px-ink" style={{ width: `${Math.min(Math.max(valor, 2), 100)}%` }} /></div>
)
const viewsNum = (s: string) => { const n = parseFloat(String(s).replace(",", ".").replace(/[^\d.]/g, "")); if (isNaN(n)) return 0; return n * (/M/i.test(s) ? 1e6 : /K|mil/i.test(s) ? 1e3 : 1) }

export default function RadarPage() {
  const [tab, setTab] = useState<Tab>("radar")
  const [articles, setArticles] = useState<Article[]>([])
  const [reels, setReels] = useState<Reel[]>([])
  const [velocity, setVelocity] = useState<VelocityItem[]>([])
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [carregado, setCarregado] = useState<Record<Tab, boolean>>({ radar: false, reels: false, velocity: false, opportunities: false })
  const [loading, setLoading] = useState<Record<Tab, boolean>>({ radar: false, reels: false, velocity: false, opportunities: false })
  const [erros, setErros] = useState<Record<Tab, string | null>>(SEM_ERRO)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const [reelSort, setReelSort] = useState<"views" | "engagement">("views")
  const [filters, setFilters] = useState<Filters>({ source: "Todos", category: "Todos", topic: "Todos", period: "7d" })
  const [usados, setUsados] = useState<Filters | null>(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [reverseReel, setReverseReel] = useState<Reel | null>(null)
  const [reverseResult, setReverseResult] = useState<ReverseResult | null>(null)
  const [reverseErro, setReverseErro] = useState("")
  const [loadingReverse, setLoadingReverse] = useState(false)
  const [reverseSent, setReverseSent] = useState(false)

  const buscar = useCallback(async (t: Tab, f: Filters) => {
    setLoading(l => ({ ...l, [t]: true })); setErros(e => ({ ...e, [t]: null }))
    try {
      const res = await fetch("/api/radar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: t, filters: { fonte: f.source, categoria: f.category, topico: f.topic, periodo: f.period } }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { data?: unknown[]; error?: string }
      if (json.error) throw new Error(json.error)
      if (!Array.isArray(json.data)) throw new Error("resposta vazia")
      const stamp = Date.now()
      if (t === "radar") setArticles((json.data as Article[]).map((a, i) => ({ ...a, id: stamp + i })))
      if (t === "reels") setReels((json.data as Reel[]).map((x, i) => ({ ...x, id: stamp + i })))
      if (t === "velocity") setVelocity((json.data as VelocityItem[]).map((x, i) => ({ ...x, id: stamp + i })))
      if (t === "opportunities") setOpps((json.data as Opportunity[]).map((x, i) => ({ ...x, id: stamp + i })))
      setCarregado(c => ({ ...c, [t]: true })); setLastUpdate(new Date()); setUsados(f)
    } catch (e) {
      console.error(`[radar] erro ao buscar ${t}:`, e)
      setErros(er => ({ ...er, [t]: "Não foi possível buscar agora. Nenhum dado de exemplo é exibido. Tente novamente em instantes." }))
    } finally { setLoading(l => ({ ...l, [t]: false })) }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { buscar("radar", filters) }, [])

  const mudarAba = (t: Tab) => { setTab(t); if (!carregado[t] && !erros[t] && !loading[t]) buscar(t, filters) }
  const mudou = usados !== null && (usados.period !== filters.period || usados.topic !== filters.topic || (tab === "radar" && (usados.source !== filters.source || usados.category !== filters.category)))
  const setF = (p: Partial<Filters>) => setFilters(f => ({ ...f, ...p }))
  const filtrosAtivos = (filters.topic !== "Todos" ? 1 : 0) + (tab === "radar" ? (filters.source !== "Todos" ? 1 : 0) + (filters.category !== "Todos" ? 1 : 0) : 0)

  const filteredArticles = articles.filter(a => {
    if (filters.source !== "Todos" && a.source !== filters.source) return false
    if (filters.category !== "Todos" && a.category !== filters.category) return false
    const q = search.trim().toLowerCase()
    if (q && !a.title.toLowerCase().includes(q) && !(a.summary ?? "").toLowerCase().includes(q)) return false
    return true
  })
  const sortedReels = [...reels].sort((a, b) => reelSort === "views" ? viewsNum(b.views) - viewsNum(a.views) : parseFloat(String(b.engagement)) - parseFloat(String(a.engagement)))

  async function salvarPauta(key: string, corpo: Record<string, unknown>, ok: string) {
    setSavingKey(key); setAviso(null)
    try {
      const res = await fetch("/api/pautas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSavedKeys(s => new Set(s).add(key)); setAviso({ ok: true, texto: ok })
      return true
    } catch (e) {
      console.error("[radar] erro ao salvar pauta:", e)
      setAviso({ ok: false, texto: "Não foi possível salvar a pauta. Tente novamente." })
      return false
    } finally { setSavingKey(null) }
  }
  const prio = (r: string) => (r === "Alto" ? "Alta" : r === "Médio" ? "Média" : "Baixa")
  const salvarArtigo = (a: Article) => salvarPauta("a:" + a.title, { titulo: a.title, nota: a.summary, categoria: a.category, fonte: a.source, prioridade: prio(a.relevance), estagio: "Ideia", tags: [] }, "Adicionada ao Banco de Pautas.")
  const salvarOpp = (o: Opportunity) => salvarPauta("o:" + o.topic, { titulo: o.topic, nota: o.why, categoria: "Oportunidade de Conteúdo", prioridade: o.score >= 90 ? "Alta" : o.score >= 75 ? "Média" : "Baixa", estagio: "Ideia", tags: o.keywords ?? [] }, "Oportunidade salva no Banco de Pautas.")

  async function abrirReverso(reel: Reel) {
    setReverseReel(reel); setReverseResult(null); setReverseErro(""); setReverseSent(false); setLoadingReverse(true)
    const prompt = `Você é um analista de conteúdo médico viral especializado em engenharia reversa de Reels. Retorne SOMENTE JSON, sem markdown.

Analise este Reel médico:
Título: "${reel.title}"
Plataforma: ${reel.platform}
Visualizações (estimadas): ${reel.views}
Taxa de engajamento (estimada): ${reel.engagement}
Categoria: ${reel.category}

Você não assistiu ao vídeo. Infira a estrutura provável a partir do título e deixe isso claro nas justificativas.

Retorne um objeto JSON com:
{
  "gancho": "técnica provável usada nos primeiros 3 segundos",
  "estrutura": "sequência narrativa provável do conteúdo",
  "retencao": "estimativa de retenção com justificativa",
  "gatilhos": ["gatilho 1", "gatilho 2", "gatilho 3"],
  "cta": "direto|indireto|implícito",
  "autoridade": número inteiro 0-10,
  "polemica": número inteiro 0-10,
  "compartilhamento": "Baixo|Médio|Alto|Viral",
  "versao_adaptada": {
    "titulo": "título adaptado para um médico de Endocrinologia, Nutrologia e Longevidade",
    "gancho": "abertura adaptada ao estilo clínico e científico",
    "estrutura": ["ponto 1", "ponto 2", "ponto 3", "ponto 4", "ponto 5"]
  }
}`
    try {
      const r = await pedirJSON<ReverseResult>("/api/roteiros", prompt, 2000)
      if (!r || !r.versao_adaptada) throw new Error("incompleto")
      setReverseResult(r)
    } catch (e) {
      console.error("[radar] erro na engenharia reversa:", e)
      setReverseErro(mensagemErroIA(e, "Não foi possível analisar este reel. Tente novamente."))
    } finally { setLoadingReverse(false) }
  }
  const fecharReverso = () => { setReverseReel(null); setReverseResult(null); setReverseErro("") }
  const enviarPautaReverso = async () => {
    if (!reverseResult || !reverseReel) return
    const v = reverseResult.versao_adaptada
    const ok = await salvarPauta("r:" + reverseReel.title, {
      titulo: v.titulo, nota: `Engenharia reversa de: "${reverseReel.title}" (${reverseReel.views} visualizações estimadas)\n\nGancho: ${v.gancho}\n\nEstrutura:\n${(v.estrutura ?? []).join("\n")}`,
      categoria: reverseReel.category, prioridade: "Alta", estagio: "Ideia", tags: ["engenharia-reversa", reverseReel.platform.toLowerCase()],
    }, "Pauta salva no Banco de Pautas.")
    if (ok) setReverseSent(true)
  }
  const roteiroHref = reverseResult ? `/roteiros?tema=${encodeURIComponent(`${reverseResult.versao_adaptada.titulo}\n\n${reverseResult.versao_adaptada.gancho}\n\n${(reverseResult.versao_adaptada.estrutura ?? []).join("\n")}`)}` : "/roteiros"

  const carregando = loading[tab]
  const erroAtual = erros[tab]
  const fmtTime = (d: Date | null) => d ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null

  const botaoSalvar = (key: string, salvar: () => void, rotulo: string, aria: string) => (
    <PxButton variant={savedKeys.has(key) ? "primary" : "secondary"} size="sm" disabled={savedKeys.has(key)} loading={savingKey === key} onClick={salvar} aria-label={aria}>{savedKeys.has(key) ? "Na pauta" : rotulo}</PxButton>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="Radar de Tendências" caption={`Nutrologia, endocrinologia e longevidade${fmtTime(lastUpdate) ? `. Atualizado às ${fmtTime(lastUpdate)}` : ""}`}
        actions={<PxButton variant="secondary" leftIcon={RefreshCw} loading={carregando} onClick={() => buscar(tab, filters)}>{carregando ? "Buscando" : "Buscar tendências"}</PxButton>} />
      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Segmented label="Seção do radar" value={tab} onChange={mudarAba} options={TAB_OPTS} />

        <Panel as="section" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Período" className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-medium text-px-muted">Período</span>
              {PERIODS.map(p => <Pill key={p.value} ativo={filters.period === p.value} onClick={() => setF({ period: p.value })}>{p.label}</Pill>)}
            </div>
            <PxButton variant="secondary" size="sm" rightIcon={ChevronDown} aria-expanded={mostrarFiltros} onClick={() => setMostrarFiltros(v => !v)}>Filtros{filtrosAtivos > 0 ? ` (${filtrosAtivos})` : ""}</PxButton>
          </div>
          {mostrarFiltros && (
            <div className="space-y-3 border-t border-px-ink/10 pt-3">
              <div role="group" aria-label="Tópico" className="flex flex-wrap items-center gap-2"><span className="text-[12.5px] font-medium text-px-muted">Tópico</span>
                {TOPIC_FILTERS.map(t => <Pill key={t} ativo={filters.topic === t} onClick={() => setF({ topic: t })}>{t}</Pill>)}</div>
              {tab === "radar" && <>
                <div role="group" aria-label="Fonte" className="space-y-2"><span className="text-[12.5px] font-medium text-px-muted">Fonte</span>
                  <div className="flex flex-wrap gap-2"><Pill ativo={filters.source === "Todos"} onClick={() => setF({ source: "Todos" })}>Todas</Pill></div>
                  {Object.entries(SOURCE_GROUPS).map(([g, srcs]) => (
                    <div key={g} className="flex flex-wrap items-center gap-2"><span className="w-28 text-[12px] text-px-muted">{g}</span>{srcs.map(s => <Pill key={s} ativo={filters.source === s} onClick={() => setF({ source: s })}>{s}</Pill>)}</div>))}</div>
                <div role="group" aria-label="Categoria" className="flex flex-wrap items-center gap-2"><span className="text-[12.5px] font-medium text-px-muted">Categoria</span>
                  {CATEGORIES_LIST.map(c => <Pill key={c} ativo={filters.category === c} onClick={() => setF({ category: c })}>{c}</Pill>)}</div>
                <PxInput aria-label="Buscar nos resultados" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por tema ou palavra-chave nos resultados" />
              </>}
            </div>
          )}
          {mudou && <p role="status" className="text-[12.5px] text-px-warn">Os filtros mudaram desde a última busca. Clique em Buscar tendências para aplicar.</p>}
        </Panel>

        <p className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[12.5px] text-px-warn">{AVISO}</p>
        {aviso && <p role={aviso.ok ? "status" : "alert"} className={aviso.ok ? "text-[13px] text-px-ok" : "text-[13px] text-px-danger"}>{aviso.texto}</p>}
        {carregando && <p role="status" className="py-16 text-center text-[14px] font-medium text-px-ink">Varrendo fontes. Pode levar até um minuto.</p>}
        {!carregando && erroAtual && (
          <Panel className="space-y-3 py-8 text-center"><p role="alert" className="text-[14px] text-px-danger">{erroAtual}</p><div><PxButton onClick={() => buscar(tab, filters)}>Tentar novamente</PxButton></div></Panel>
        )}

        {!carregando && !erroAtual && tab === "radar" && (
          filteredArticles.length === 0 ? <Panel className="py-12 text-center text-[13px] text-px-muted">Nenhuma tendência encontrada com estes filtros.</Panel> : (
            <>
              <p className="text-[13px] text-px-muted">{filteredArticles.length} tendências, {filteredArticles.filter(a => a.relevance === "Alto").length} com relevância alta, de {new Set(filteredArticles.map(a => a.source)).size} fontes.</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredArticles.map(item => (
                  <Panel key={item.id} as="article" className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-1.5"><Tag tone="ink">{item.source}</Tag><Tag tone="neutral">{item.category}</Tag><Tag tone={item.relevance === "Alto" ? "accent" : "neutral"}>Relevância {String(item.relevance).toLowerCase()}</Tag></div>
                    <h3 className="text-[14.5px] font-semibold leading-snug text-px-ink">{item.title}</h3>
                    <p className="flex-1 text-[13px] leading-relaxed text-px-ink/80">{item.summary}</p>
                    <div className="flex items-center justify-between"><span className="text-[12.5px] text-px-muted">{item.date}</span>
                      {botaoSalvar("a:" + item.title, () => salvarArtigo(item), "Transformar em pauta", `Transformar em pauta: ${item.title}`)}</div>
                  </Panel>))}
              </div>
            </>)
        )}

        {!carregando && !erroAtual && tab === "reels" && (
          <section className="space-y-3" aria-label="Top Reels">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-px-muted">Conteúdos de saúde com maior alcance estimado no Instagram, TikTok e YouTube.</p>
              <Segmented label="Ordenar por" value={reelSort} onChange={setReelSort} options={[{ value: "views", label: "Visualizações" }, { value: "engagement", label: "Engajamento" }]} />
            </div>
            {sortedReels.length === 0 ? <Panel className="py-12 text-center text-[13px] text-px-muted">Nenhum reel encontrado.</Panel> : (
              <ol className="space-y-2">{sortedReels.map((reel, idx) => (
                <li key={reel.id}><Panel className="flex items-center gap-3 !py-3">
                  <span className="w-6 shrink-0 text-center text-[13px] font-semibold tabular-nums text-px-muted">{idx + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-medium text-px-ink">{reel.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-px-muted">{reel.platform}, {reel.category}. <span className="font-semibold text-px-ink">{reel.views}</span> visualizações, <span className="font-semibold text-px-ink">{reel.engagement}</span> de engajamento</p></div>
                  <PxButton variant="secondary" size="sm" leftIcon={Microscope} onClick={() => abrirReverso(reel)} aria-label={`Engenharia reversa: ${reel.title}`}><span className="hidden sm:inline">Engenharia reversa</span></PxButton>
                  {reel.link && /^https?:\/\//.test(reel.link) && <a href={reel.link} target="_blank" rel="noopener noreferrer" aria-label="Abrir reel" className="flex h-9 w-9 items-center justify-center rounded-full text-px-ink hover:bg-px-ink/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40"><ExternalLink className="h-4 w-4" aria-hidden="true" /></a>}
                </Panel></li>))}</ol>)}
          </section>
        )}

        {!carregando && !erroAtual && tab === "velocity" && (
          <section className="space-y-3" aria-label="Tendência emergente">
            <p className="text-[13px] text-px-muted">Pontuação de 0 a 100 estimada pela IA, combinando crescimento de buscas, menções e publicações científicas recentes. Quanto maior, mais rápido o tema ganha tração.</p>
            {velocity.length === 0 ? <Panel className="py-12 text-center text-[13px] text-px-muted">Nenhum tema encontrado.</Panel> : (
              <ol className="space-y-2">{[...velocity].sort((a, b) => b.score - a.score).map((item, idx) => (
                <li key={item.id}><Panel className="space-y-2 !py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-[14px] font-semibold text-px-ink">{idx + 1}. {item.topic}</p><p className="text-[12.5px] text-px-muted">{item.category}</p></div>
                    <div className="text-right"><p className="text-[22px] font-semibold leading-none tabular-nums text-px-ink">{item.score}</p><p className="text-[12px] text-px-muted">pontuação</p></div>
                  </div>
                  <Barra valor={item.score} rotulo={`Pontuação ${item.score} de 100`} />
                  <p className="text-[12.5px] text-px-muted">Crescimento <span className="font-semibold text-px-ink">{item.growth}</span>, {Number(item.mentions).toLocaleString("pt-BR")} menções e {item.publications} publicações (estimativas)</p>
                </Panel></li>))}</ol>)}
          </section>
        )}

        {!carregando && !erroAtual && tab === "opportunities" && (
          <section className="space-y-3" aria-label="Oportunidades de conteúdo">
            <p className="text-[13px] text-px-muted">A IA cruza tendência crescente, baixa concorrência e alto potencial de compartilhamento para sugerir lacunas de conteúdo.</p>
            {opps.length === 0 ? <Panel className="py-12 text-center text-[13px] text-px-muted">Nenhuma oportunidade encontrada.</Panel> : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{[...opps].sort((a, b) => b.score - a.score).map(opp => (
                <Panel key={opp.id} as="article" className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3"><h3 className="text-[14.5px] font-semibold leading-snug text-px-ink">{opp.topic}</h3><Tag tone={opp.score >= 90 ? "accent" : "ink"}>{opp.score}</Tag></div>
                  <dl className="grid grid-cols-3 gap-2 text-[12.5px]"><div><dt className="text-px-muted">Crescimento</dt><dd className="font-semibold text-px-ink">{opp.growth}</dd></div><div><dt className="text-px-muted">Concorrência</dt><dd className="font-semibold text-px-ink">{opp.competition}</dd></div><div><dt className="text-px-muted">Potencial</dt><dd className="font-semibold text-px-ink">{opp.sharing}</dd></div></dl>
                  <p className="flex-1 text-[13px] leading-relaxed text-px-ink/80">{opp.why}</p>
                  <p className="text-[12.5px] text-px-muted">{(opp.platforms ?? []).join(", ")}{(opp.keywords ?? []).length ? `. Palavras-chave: ${(opp.keywords ?? []).slice(0, 3).join(", ")}` : ""}</p>
                  <div className="flex items-center justify-between border-t border-px-ink/10 pt-2"><span className="text-[12.5px] text-px-muted">Em alta há {opp.trending_since}</span>
                    {botaoSalvar("o:" + opp.topic, () => salvarOpp(opp), "Criar pauta", `Criar pauta: ${opp.topic}`)}</div>
                </Panel>))}</div>)}
          </section>
        )}
      </div>

      {reverseReel && (
        <PxModal open onClose={fecharReverso} title="Engenharia reversa" className="max-w-2xl">
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            <div><p className="text-[14px] font-medium text-px-ink">{reverseReel.title}</p><p className="text-[12.5px] text-px-muted">{reverseReel.platform}, {reverseReel.views} visualizações e {reverseReel.engagement} de engajamento (estimativas)</p></div>
            {loadingReverse && <p role="status" className="py-10 text-center text-[14px] text-px-ink">Analisando a estrutura do vídeo</p>}
            {!loadingReverse && reverseErro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{reverseErro}</p>}
            {reverseResult && !loadingReverse && (
              <>
                <p className="text-[12.5px] text-px-muted">A IA não assistiu ao vídeo. A análise infere a estrutura provável a partir do título.</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-px-card bg-px-ink/[0.04] p-3 sm:col-span-2"><p className="text-[12.5px] font-medium text-px-muted">Gancho inicial</p><p className="text-[13.5px] text-px-ink">{reverseResult.gancho}</p></div>
                  <div className="rounded-px-card bg-px-ink/[0.04] p-3 sm:col-span-2"><p className="text-[12.5px] font-medium text-px-muted">Estrutura narrativa</p><p className="text-[13.5px] text-px-ink">{reverseResult.estrutura}</p></div>
                  <div className="rounded-px-card bg-px-ink/[0.04] p-3"><p className="text-[12.5px] font-medium text-px-muted">Retenção estimada</p><p className="text-[13.5px] text-px-ink">{reverseResult.retencao}</p></div>
                  <div className="rounded-px-card bg-px-ink/[0.04] p-3"><p className="text-[12.5px] font-medium text-px-muted">Tipo de CTA</p><p className="text-[13.5px] capitalize text-px-ink">{reverseResult.cta}</p></div>
                  <div className="rounded-px-card bg-px-ink/[0.04] p-3"><p className="text-[12.5px] font-medium text-px-muted">Gatilhos emocionais</p><p className="text-[13.5px] text-px-ink">{(reverseResult.gatilhos ?? []).join(", ")}</p></div>
                  <div className="rounded-px-card bg-px-ink/[0.04] p-3"><p className="text-[12.5px] font-medium text-px-muted">Notas estimadas</p><p className="text-[13.5px] text-px-ink">Autoridade {reverseResult.autoridade}/10, polêmica {reverseResult.polemica}/10, compartilhamento {reverseResult.compartilhamento}</p></div>
                </div>
                <div className="space-y-2 rounded-px-card bg-px-ink/[0.08] p-3">
                  <p className="text-[12.5px] font-medium text-px-muted">Versão adaptada para o seu perfil</p>
                  <p className="text-[14px] font-semibold text-px-ink">{reverseResult.versao_adaptada.titulo}</p>
                  <p className="text-[13.5px] italic text-px-ink">{reverseResult.versao_adaptada.gancho}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-[13px] text-px-ink/85">{(reverseResult.versao_adaptada.estrutura ?? []).map((p, i) => <li key={i}>{String(p).replace(/^\d+\.\s*/, "")}</li>)}</ol>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <PxButton size="sm" disabled={reverseSent} loading={savingKey === "r:" + reverseReel.title} onClick={enviarPautaReverso}>{reverseSent ? "Salvo na pauta" : "Enviar para o Banco de Pautas"}</PxButton>
                    <PxButton size="sm" variant="secondary" rightIcon={ChevronRight} href={roteiroHref}>Enviar para o Gerador de Roteiros</PxButton>
                  </div>
                  {aviso && !aviso.ok && <p role="alert" className="text-[13px] text-px-danger">{aviso.texto}</p>}
                </div>
              </>
            )}
          </div>
        </PxModal>
      )}
    </div>
  )
}
