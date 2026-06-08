"use client"

import { useState, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  ShieldQuestion, BookOpen, Loader2, AlertCircle, X, Search, Check,
  ChevronRight, Layers, Play, FileText, MessageSquare, RefreshCw,
  CheckSquare, Square, Zap,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

type ObjCategoria = "MEDO" | "CUSTO/ACESSO" | "EFICACIA" | "EFEITOS" | "DEPENDENCIA"
type FormatoTab   = "reel" | "story" | "carrossel" | "faq"

interface Objecao {
  id:        number
  texto:     string
  categoria: ObjCategoria
}

interface ReelFmt     { titulo: string; gancho: string; estrutura: string[] }
interface StoryFmt    { titulo: string; slides: string[] }
interface CarrosselFmt{ titulo: string; slides: string[] }
interface FaqFmt      { titulo: string; resposta: string }

interface TransformResult {
  reel:      ReelFmt
  story:     StoryFmt
  carrossel: CarrosselFmt
  faq:       FaqFmt
}

interface Pauta {
  id:        number | string
  titulo:    string
  categoria: string
}

// ─── Config ─────────────────────────────────────────────────────────────────────

const CAT_CONFIG: Record<ObjCategoria, { label: string; color: string; bg: string; border: string; dot: string }> = {
  "MEDO":         { label: "Medo",               color: "text-red-400",    bg: "bg-red-950/30",    border: "border-red-500/30",    dot: "bg-red-400" },
  "CUSTO/ACESSO": { label: "Custo/Acesso",        color: "text-amber-400",  bg: "bg-amber-950/30",  border: "border-amber-500/30",  dot: "bg-amber-400" },
  "EFICACIA":     { label: "Eficácia",            color: "text-blue-400",   bg: "bg-blue-950/30",   border: "border-blue-500/30",   dot: "bg-blue-400" },
  "EFEITOS":      { label: "Efeitos Colaterais",  color: "text-orange-400", bg: "bg-orange-950/30", border: "border-orange-500/30", dot: "bg-orange-400" },
  "DEPENDENCIA":  { label: "Dependência/Duração", color: "text-purple-400", bg: "bg-purple-950/30", border: "border-purple-500/30", dot: "bg-purple-400" },
}

const FORMATO_TABS: { key: FormatoTab; label: string; icon: React.ElementType }[] = [
  { key: "reel",      label: "Reel",     icon: Play },
  { key: "story",     label: "Story",    icon: Layers },
  { key: "carrossel", label: "Carrossel",icon: ChevronRight },
  { key: "faq",       label: "FAQ",      icon: FileText },
]

const CATEGORIAS: ObjCategoria[] = ["MEDO", "CUSTO/ACESSO", "EFICACIA", "EFEITOS", "DEPENDENCIA"]

// ─── Mock fallback ──────────────────────────────────────────────────────────────

const MOCK_OBJECOES: Objecao[] = [
  { id:  1, texto: "Hormônio causa câncer de mama?",               categoria: "MEDO"         },
  { id:  2, texto: "Tenho medo de ter trombose",                   categoria: "MEDO"         },
  { id:  3, texto: "Pode causar infarto?",                         categoria: "MEDO"         },
  { id:  4, texto: "Vou ficar mais agressiva com hormônio?",       categoria: "MEDO"         },
  { id:  5, texto: "Minha mãe teve câncer, não posso usar",       categoria: "MEDO"         },
  { id:  6, texto: "É muito caro pagar a consulta todo mês",      categoria: "CUSTO/ACESSO" },
  { id:  7, texto: "Meu plano não cobre esse tipo de consulta",   categoria: "CUSTO/ACESSO" },
  { id:  8, texto: "Os exames são muito caros",                   categoria: "CUSTO/ACESSO" },
  { id:  9, texto: "Não tenho como pagar os medicamentos",        categoria: "CUSTO/ACESSO" },
  { id: 10, texto: "Será que posso encontrar mais barato?",       categoria: "CUSTO/ACESSO" },
  { id: 11, texto: "Realmente funciona para todo mundo?",         categoria: "EFICACIA"     },
  { id: 12, texto: "Já tentei tudo e nada resolve",               categoria: "EFICACIA"     },
  { id: 13, texto: "Vi que tem estudos contra também",            categoria: "EFICACIA"     },
  { id: 14, texto: "Minha amiga usou e não deu resultado",        categoria: "EFICACIA"     },
  { id: 15, texto: "E se não funcionar para mim?",                categoria: "EFICACIA"     },
  { id: 16, texto: "Vou engordar com o tratamento?",              categoria: "EFEITOS"      },
  { id: 17, texto: "Pode causar queda de cabelo?",                categoria: "EFEITOS"      },
  { id: 18, texto: "Vou ficar retendo líquido?",                  categoria: "EFEITOS"      },
  { id: 19, texto: "Posso ter acne com hormônio?",                categoria: "EFEITOS"      },
  { id: 20, texto: "Vai afetar meu humor?",                       categoria: "EFEITOS"      },
  { id: 21, texto: "Vou ter que tomar para sempre?",              categoria: "DEPENDENCIA"  },
  { id: 22, texto: "Se parar de tomar, fico pior?",               categoria: "DEPENDENCIA"  },
  { id: 23, texto: "Pode se tornar uma dependência?",             categoria: "DEPENDENCIA"  },
  { id: 24, texto: "Por quanto tempo preciso fazer o tratamento?",categoria: "DEPENDENCIA"  },
  { id: 25, texto: "E se quiser parar? Como faço?",               categoria: "DEPENDENCIA"  },
]

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ObecoesPage() {
  const [tema,            setTema]            = useState("")
  const [objecoes,        setObjecoes]        = useState<Objecao[]>([])
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [selectedIds,     setSelectedIds]     = useState<number[]>([])
  const [savedIds,        setSavedIds]        = useState<number[]>([])
  const [activeObjecao,   setActiveObjecao]   = useState<Objecao | null>(null)
  const [transformResult, setTransformResult] = useState<TransformResult | null>(null)
  const [loadingTransform,setLoadingTransform]= useState(false)
  const [activeTab,       setActiveTab]       = useState<FormatoTab>("reel")
  const [savedFormats,    setSavedFormats]    = useState<FormatoTab[]>([])
  const [bulkLoading,     setBulkLoading]     = useState(false)
  const [toast,           setToast]           = useState<string | null>(null)
  const [modalOpen,       setModalOpen]       = useState(false)
  const [pautas,          setPautas]          = useState<Pauta[]>([])
  const [loadingPautas,   setLoadingPautas]   = useState(false)
  const [pautaSearch,     setPautaSearch]     = useState("")

  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  const mapearObjecoes = async () => {
    if (!tema.trim()) { setError("Digite o tratamento ou tema antes de mapear."); return }
    setError(null); setLoading(true); setObjecoes([]); setSelectedIds([]); setSavedIds([])

    try {
      const res  = await fetch("/api/objecoes/mapear", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tema }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setObjecoes(data.objecoes ?? [])
    } catch {
      setError("Erro ao mapear. Usando dados de demonstração.")
      setObjecoes(MOCK_OBJECOES)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedIds.length === objecoes.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(objecoes.map(o => o.id))
    }
  }

  const transformarObjecao = async (ob: Objecao) => {
    setActiveObjecao(ob)
    setTransformResult(null)
    setSavedFormats([])
    setActiveTab("reel")
    setLoadingTransform(true)

    try {
      const res  = await fetch("/api/objecoes/transformar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ objecao: ob.texto, tema }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTransformResult(data)
    } catch {
      setTransformResult({
        reel: {
          titulo: `Reel: Respondendo "${ob.texto}"`,
          gancho: "Você já se perguntou isso?\nA resposta vai te surpreender.",
          estrutura: ["1. Valide a dúvida do paciente", "2. Explique o contexto científico", "3. Desmistifique com dados", "4. Mostre o benefício real", "5. CTA para consulta"],
        },
        story: {
          titulo: `Story: ${ob.texto}`,
          slides: ["Slide 1: Pergunta impactante", "Slide 2: Validação da dúvida", "Slide 3: A resposta com ciência", "Slide 4: O que muda na prática", "Slide 5: CTA"],
        },
        carrossel: {
          titulo: `Carrossel: Tudo sobre "${ob.texto}"`,
          slides: ["Capa: Título impactante", "Slide 2: O medo real", "Slide 3: O que a ciência diz", "Slide 4: Casos clínicos", "Slide 5: Resumo prático", "Slide 6: Consulte um especialista"],
        },
        faq: {
          titulo: ob.texto,
          resposta: "Essa é uma dúvida muito comum e completamente compreensível. Vou responder com base nas evidências científicas atuais...",
        },
      })
    } finally {
      setLoadingTransform(false)
    }
  }

  const salvarFormato = async (formato: FormatoTab) => {
    if (!transformResult || !activeObjecao) return
    const map = {
      reel:      { titulo: transformResult.reel.titulo,      nota: `REEL\nGancho: ${transformResult.reel.gancho}\n\nEstrutura:\n${transformResult.reel.estrutura.join('\n')}` },
      story:     { titulo: transformResult.story.titulo,     nota: `STORY\n${transformResult.story.slides.join('\n')}` },
      carrossel: { titulo: transformResult.carrossel.titulo, nota: `CARROSSEL\n${transformResult.carrossel.slides.join('\n')}` },
      faq:       { titulo: transformResult.faq.titulo,       nota: `FAQ/LEGENDA\n${transformResult.faq.resposta}` },
    }
    try {
      await fetch("/api/pautas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          titulo:    map[formato].titulo,
          nota:      map[formato].nota,
          categoria: "Resposta a Objeção",
          prioridade:"Alta",
          estagio:   "Ideia",
          tags:      ["objecao", formato, tema.toLowerCase()],
        }),
      })
      setSavedFormats(prev => [...prev, formato])
      showToast("Salvo no Banco de Pautas!")
    } catch {
      showToast("Erro ao salvar. Tente novamente.")
    }
  }

  const transformarEmLote = async () => {
    if (selectedIds.length === 0) return
    setBulkLoading(true)
    const selecionadas = objecoes.filter(o => selectedIds.includes(o.id))
    let saved = 0
    for (const ob of selecionadas) {
      try {
        await fetch("/api/pautas", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            titulo:    `Responder objeção: ${ob.texto}`,
            nota:      `Categoria: ${CAT_CONFIG[ob.categoria]?.label ?? ob.categoria}\nTema: ${tema}`,
            categoria: "Resposta a Objeção",
            prioridade:"Alta",
            estagio:   "Ideia",
            tags:      ["objecao", ob.categoria.toLowerCase(), tema.toLowerCase()],
          }),
        })
        setSavedIds(prev => [...prev, ob.id])
        saved++
      } catch { /* continue */ }
    }
    setBulkLoading(false)
    showToast(`${saved} objeção${saved !== 1 ? "ões" : ""} salva${saved !== 1 ? "s" : ""} no Banco de Pautas!`)
    setSelectedIds([])
  }

  const abrirModal = async () => {
    setModalOpen(true); setPautaSearch("")
    if (pautas.length > 0) return
    setLoadingPautas(true)
    try {
      const res  = await fetch("/api/pautas")
      const data = await res.json()
      setPautas(Array.isArray(data) ? data : [])
    } catch { setPautas([]) }
    finally  { setLoadingPautas(false) }
  }

  const objecoesByCategoria = CATEGORIAS.reduce<Record<ObjCategoria, Objecao[]>>((acc, cat) => {
    acc[cat] = objecoes.filter(o => o.categoria === cat)
    return acc
  }, {} as Record<ObjCategoria, Objecao[]>)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Mapa de Objeções"
        subtitle="TRANSFORME DÚVIDAS EM CONTEÚDO · OBJEÇÕES DE PACIENTES · ESTRATÉGIA EDUCATIVA"
        actions={
          objecoes.length > 0 ? (
            <button
              onClick={() => { setObjecoes([]); setSelectedIds([]); setSavedIds([]); setError(null); setActiveObjecao(null) }}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Novo mapa
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* Input */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary">Tratamento ou Tema</h3>
              <p className="text-[11px] text-text-muted mt-0.5">Mapeie todas as objeções reais de pacientes e transforme cada uma em conteúdo educativo</p>
            </div>
            <button onClick={abrirModal} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all flex-shrink-0">
              <BookOpen className="w-3 h-3" /> Importar Pauta
            </button>
          </div>
          <div className="flex gap-3">
            <input
              value={tema}
              onChange={e => setTema(e.target.value)}
              onKeyDown={e => e.key === "Enter" && mapearObjecoes()}
              placeholder="Ex: reposição hormonal, tirzepatida, emagrecimento com GLP-1..."
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
            />
            <button
              onClick={mapearObjecoes}
              disabled={loading || !tema.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Mapeando...</>
                : <><ShieldQuestion className="w-4 h-4" /> Mapear Objeções</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/40 border border-red-500/30 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <ShieldQuestion className="w-10 h-10 text-accent animate-pulse" />
            <div className="text-center">
              <div className="text-[14px] font-semibold text-text-primary">Mapeando objeções reais de pacientes...</div>
              <div className="text-[10px] font-mono text-text-muted tracking-widest mt-1">CLAUDE ANALISANDO 50 OBJEÇÕES</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && objecoes.length === 0 && !error && (
          <div className="bg-card border border-border rounded-lg py-16 flex flex-col items-center justify-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
              <ShieldQuestion className="w-7 h-7 text-accent" />
            </div>
            <div className="text-center max-w-lg">
              <h3 className="text-[15px] font-semibold text-text-primary mb-2">Mapa de Objeções de Pacientes</h3>
              <p className="text-[12px] text-text-muted leading-relaxed">
                Digite o tratamento ou tema. O Claude vai gerar 50 objeções reais categorizadas. Transforme cada objeção em conteúdo: Reel, Story, Carrossel ou FAQ — ou processe todas de uma vez.
              </p>
            </div>
            <div className="flex gap-2">
              {CATEGORIAS.map(cat => {
                const c = CAT_CONFIG[cat]
                return (
                  <div key={cat} className={cn("rounded-lg px-3 py-1.5 border text-[9px] font-mono font-bold uppercase tracking-wider", c.bg, c.border, c.color)}>
                    {c.label}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Objeções list + panel */}
        {!loading && objecoes.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-4 items-start">

            {/* Left: list */}
            <div className={cn("flex-1 min-w-0 space-y-4 transition-all", activeObjecao ? "lg:max-w-[calc(100%-520px)]" : "")}>

              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={selectAll} className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary transition-colors">
                    {selectedIds.length === objecoes.length
                      ? <CheckSquare className="w-3.5 h-3.5 text-accent" />
                      : <Square className="w-3.5 h-3.5" />}
                    {selectedIds.length === 0 ? "Selecionar todas" : `${selectedIds.length} selecionada${selectedIds.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
                {selectedIds.length > 0 && (
                  <button
                    onClick={transformarEmLote}
                    disabled={bulkLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background text-[12px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {bulkLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando...</>
                      : <><Zap className="w-3.5 h-3.5" /> Transformar TODAS Selecionadas</>}
                  </button>
                )}
              </div>

              {/* Categories */}
              {CATEGORIAS.map(cat => {
                const items = objecoesByCategoria[cat] ?? []
                if (items.length === 0) return null
                const c = CAT_CONFIG[cat]
                return (
                  <div key={cat} className={cn("rounded-xl border overflow-hidden", c.bg, c.border)}>
                    <div className={cn("px-4 py-2.5 border-b flex items-center gap-2", c.border)}>
                      <div className={cn("w-2 h-2 rounded-full", c.dot)} />
                      <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", c.color)}>{c.label}</span>
                      <span className="text-[9px] text-text-muted ml-auto">{items.length} objeções</span>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {items.map(ob => {
                        const isSelected = selectedIds.includes(ob.id)
                        const isSaved    = savedIds.includes(ob.id)
                        const isActive   = activeObjecao?.id === ob.id
                        return (
                          <div
                            key={ob.id}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 transition-colors group",
                              isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                            )}
                          >
                            <button onClick={() => toggleSelect(ob.id)} className="flex-shrink-0">
                              {isSelected
                                ? <CheckSquare className={cn("w-3.5 h-3.5", c.color)} />
                                : <Square className="w-3.5 h-3.5 text-text-muted" />}
                            </button>
                            <p className="flex-1 text-[12px] text-text-secondary leading-relaxed">{ob.texto}</p>
                            {isSaved ? (
                              <span className="text-[9px] font-mono text-accent flex-shrink-0">Salvo ✓</span>
                            ) : (
                              <button
                                onClick={() => transformarObjecao(ob)}
                                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md border border-border text-text-muted hover:border-accent-border hover:text-accent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex-shrink-0"
                              >
                                <MessageSquare className="w-3 h-3" /> Transformar
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right: transform panel */}
            {activeObjecao && (
              <div className="w-full lg:w-[500px] flex-shrink-0 bg-card border border-border rounded-xl flex flex-col lg:sticky lg:top-8" style={{ maxHeight: "calc(90vh - 80px)" }}>

                {/* Panel header */}
                <div className="flex items-start justify-between px-4 py-3 border-b border-border flex-shrink-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Transformando objeção</div>
                    <p className="text-[12px] font-semibold text-text-primary leading-snug">{activeObjecao.texto}</p>
                  </div>
                  <button onClick={() => setActiveObjecao(null)} className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md border border-border text-text-muted hover:text-text-primary transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {loadingTransform ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
                    <Loader2 className="w-7 h-7 text-accent animate-spin" />
                    <div className="text-[11px] text-text-muted font-mono">Gerando 4 formatos...</div>
                  </div>
                ) : transformResult ? (
                  <>
                    {/* Format tabs */}
                    <div className="flex gap-0.5 px-3 pt-3 flex-shrink-0">
                      {FORMATO_TABS.map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                            activeTab === key
                              ? "bg-accent-dim border border-accent-border text-accent"
                              : "text-text-muted hover:text-text-secondary"
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {label}
                          {savedFormats.includes(key) && <Check className="w-2.5 h-2.5 text-accent" />}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-3">
                      {activeTab === "reel" && (
                        <>
                          <div>
                            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Título</div>
                            <p className="text-[12px] font-semibold text-text-primary">{transformResult.reel.titulo}</p>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Gancho de abertura</div>
                            <p className="text-[11px] text-text-secondary italic leading-relaxed">{transformResult.reel.gancho}</p>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Estrutura (60s)</div>
                            <div className="space-y-1">
                              {(transformResult.reel.estrutura ?? []).map((p, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <span className="text-[9px] font-bold font-mono text-accent flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <p className="text-[10px] text-text-secondary leading-snug">{p.replace(/^\d+\.\s*/, "")}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {activeTab === "story" && (
                        <>
                          <div>
                            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Título</div>
                            <p className="text-[12px] font-semibold text-text-primary">{transformResult.story.titulo}</p>
                          </div>
                          <div className="space-y-2">
                            {(transformResult.story.slides ?? []).map((slide, i) => (
                              <div key={i} className="bg-background rounded-lg px-3 py-2.5 border border-border">
                                <div className="text-[8px] font-mono text-text-muted uppercase mb-1">Slide {i + 1}</div>
                                <p className="text-[11px] text-text-secondary leading-relaxed">{slide}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {activeTab === "carrossel" && (
                        <>
                          <div>
                            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Título</div>
                            <p className="text-[12px] font-semibold text-text-primary">{transformResult.carrossel.titulo}</p>
                          </div>
                          <div className="space-y-2">
                            {(transformResult.carrossel.slides ?? []).map((slide, i) => (
                              <div key={i} className={cn(
                                "bg-background rounded-lg px-3 py-2.5 border",
                                i === 0 ? "border-accent/30" : "border-border"
                              )}>
                                <div className="text-[8px] font-mono text-text-muted uppercase mb-1">
                                  {i === 0 ? "Capa" : i === (transformResult.carrossel.slides.length - 1) ? "CTA" : `Slide ${i + 1}`}
                                </div>
                                <p className="text-[11px] text-text-secondary leading-relaxed">{slide}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {activeTab === "faq" && (
                        <>
                          <div>
                            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Título / Pergunta</div>
                            <p className="text-[12px] font-semibold text-text-primary">{transformResult.faq.titulo}</p>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Resposta completa</div>
                            <p className="text-[11px] text-text-secondary leading-relaxed whitespace-pre-wrap">{transformResult.faq.resposta}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Save button */}
                    <div className="px-4 pb-4 flex-shrink-0">
                      <button
                        onClick={() => salvarFormato(activeTab)}
                        disabled={savedFormats.includes(activeTab)}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-semibold transition-all border",
                          savedFormats.includes(activeTab)
                            ? "bg-accent-dim border-accent-border text-accent cursor-default"
                            : "bg-accent text-background border-transparent hover:bg-accent/90"
                        )}
                      >
                        {savedFormats.includes(activeTab)
                          ? <><Check className="w-3.5 h-3.5" /> Salvo no Banco de Pautas</>
                          : "Salvar no Banco de Pautas"}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          <Check className="w-3.5 h-3.5" /> {toast}
        </div>
      )}

      {/* Pauta modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(8,9,14,0.88)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-xl border flex flex-col" style={{ background: "#0f1018", borderColor: "#1c1d2a", maxHeight: "80vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <span className="text-[13px] font-semibold text-text-primary">Importar do Banco de Pautas</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-text-muted hover:text-text-primary transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input autoFocus value={pautaSearch} onChange={e => setPautaSearch(e.target.value)} placeholder="Buscar pauta..."
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {loadingPautas ? (
                <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[12px] font-mono">Carregando pautas...</span>
                </div>
              ) : pautas.length === 0 ? (
                <p className="text-center py-12 text-[12px] text-text-muted">Nenhuma pauta encontrada.</p>
              ) : (
                <div className="space-y-1">
                  {pautas
                    .filter(p => !pautaSearch || p.titulo.toLowerCase().includes(pautaSearch.toLowerCase()))
                    .map(pauta => (
                      <button key={pauta.id} onClick={() => { setTema(pauta.titulo); setModalOpen(false) }}
                        className="w-full text-left px-4 py-3 rounded-lg border border-transparent hover:border-accent-border hover:bg-accent-dim/30 transition-all group">
                        <p className="text-[12px] font-medium text-text-primary group-hover:text-accent transition-colors">{pauta.titulo}</p>
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted mt-1 inline-block">{pauta.categoria}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
