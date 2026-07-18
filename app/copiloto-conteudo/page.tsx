"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Wand2, Loader2, Copy, Check, Film, LayoutGrid,
  BookOpen, X, ChevronRight, Sparkles, Hash, MessageSquare, Zap,
  BookmarkPlus, CalendarPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReelData {
  titulo:   string
  gancho:   string
  roteiro:  string
  legenda:  string
  cta:      string
  hashtags: string[]
}

interface CarrosselSlide {
  numero: number
  titulo: string
  texto:  string
}

interface CarrosselData {
  titulo:   string
  slides:   CarrosselSlide[]
  legenda:  string
  hashtags: string[]
}

interface StoriesCard {
  numero:    number
  tipo:      string
  texto:     string
  interacao: string
}

interface StoriesData {
  sequencia: StoriesCard[]
}

interface LegendaAlt {
  versao:   string
  cta:      string
  hashtags: string[]
}

interface ConteudoData {
  topico:              string
  reel:                ReelData
  carrossel:           CarrosselData
  stories:             StoriesData
  legenda_alternativa: LegendaAlt
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      className={cn(
        "text-[10px] font-mono px-2.5 py-1 rounded border transition-all flex items-center gap-1.5 flex-shrink-0",
        copied
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-border text-text-muted hover:text-text-primary"
      )}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado" : label}
    </button>
  )
}

function ContentBlock({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{label}</p>
      <div className="rounded-lg border border-border bg-background px-3 py-3">
        <p className="text-[12px] text-text-primary leading-relaxed whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  )
}

function HashtagBlock({ tags }: { tags: string[] }) {
  const text = tags.map(h => '#' + h.replace(/^#/, '')).join(" ")
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Hashtags</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(h => (
          <span key={h} className="text-[10px] font-mono px-2 py-0.5 rounded border border-accent-border bg-accent-dim text-accent">
            #{h.replace(/^#/, '')}
          </span>
        ))}
      </div>
      <CopyBtn text={text} label="Copiar tags" />
    </div>
  )
}

// ─── Cards de conteúdo ────────────────────────────────────────────────────────

function ReelCard({ data }: { data: ReelData }) {
  const fullText = `${data.roteiro}\n\n${data.legenda}\n\n${data.cta}\n\n${data.hashtags.map(h => '#' + h.replace(/^#/, '')).join(" ")}`
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-200">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-red-600" />
          <span className="text-[12px] font-semibold text-red-700">Reel</span>
        </div>
        <CopyBtn text={fullText} label="Copiar tudo" />
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-[13px] font-semibold text-text-primary mb-1">{data.titulo}</p>
          <div className="rounded-lg bg-white border border-red-200 px-3 py-2">
            <p className="text-[10px] font-mono text-text-muted uppercase mb-0.5">Gancho</p>
            <p className="text-[13px] font-bold text-text-primary italic">&ldquo;{data.gancho}&rdquo;</p>
          </div>
        </div>
        <ContentBlock label="Roteiro" value={data.roteiro} />
        <ContentBlock label="Legenda" value={data.legenda} />
        <ContentBlock label="CTA" value={data.cta} />
        <HashtagBlock tags={data.hashtags} />
      </div>
    </div>
  )
}

function CarrosselCard({ data }: { data: CarrosselData }) {
  const allText = data.slides.map(s => `[Slide ${s.numero}] ${s.titulo}\n${s.texto}`).join("\n\n")
  const fullText = `${allText}\n\n${data.legenda}\n\n${data.hashtags.map(h => '#' + h.replace(/^#/, '')).join(" ")}`
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-blue-600" />
          <span className="text-[12px] font-semibold text-blue-700">Carrossel</span>
        </div>
        <CopyBtn text={fullText} label="Copiar tudo" />
      </div>
      <div className="p-4 space-y-4">
        <p className="text-[13px] font-semibold text-text-primary">{data.titulo}</p>
        <div className="space-y-2">
          {(data.slides ?? []).map(s => (
            <div key={s.numero} className="rounded-lg bg-white border border-blue-200 px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <span className="text-[10px] font-mono font-bold text-blue-600 mt-0.5 w-5 flex-shrink-0">{s.numero}</span>
                <div>
                  <p className="text-[11px] font-semibold text-text-primary">{s.titulo}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{s.texto}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ContentBlock label="Legenda" value={data.legenda} />
        <HashtagBlock tags={data.hashtags} />
      </div>
    </div>
  )
}

function StoriesCard({ data }: { data: StoriesData }) {
  const allText = (data.sequencia ?? []).map(s => `[Card ${s.numero} - ${s.tipo}]\n${s.texto}${s.interacao ? `\nInteração: ${s.interacao}` : ""}`).join("\n\n")
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-600" />
          <span className="text-[12px] font-semibold text-amber-700">Stories</span>
        </div>
        <CopyBtn text={allText} label="Copiar sequência" />
      </div>
      <div className="p-4 space-y-2.5">
        {(data.sequencia ?? []).map(s => (
          <div key={s.numero} className="rounded-lg bg-white border border-amber-200 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
              <span className="text-[10px] font-mono font-bold text-amber-600 mt-0.5 w-4 flex-shrink-0">{s.numero}</span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-badge font-mono px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700">
                    {s.tipo}
                  </span>
                </div>
                <p className="text-[12px] text-text-primary leading-relaxed">{s.texto}</p>
                {s.interacao && (
                  <p className="text-[10px] text-text-muted font-mono">↳ {s.interacao}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LegendaAltCard({ data }: { data: LegendaAlt }) {
  const fullText = `${data.versao}\n\n${data.cta}\n\n${data.hashtags.map(h => '#' + h.replace(/^#/, '')).join(" ")}`
  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-200">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span className="text-[12px] font-semibold text-purple-700">Legenda Alternativa</span>
        </div>
        <CopyBtn text={fullText} label="Copiar tudo" />
      </div>
      <div className="p-4 space-y-4">
        <ContentBlock label="Versão curta" value={data.versao} />
        <ContentBlock label="CTA" value={data.cta} />
        <HashtagBlock tags={data.hashtags} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface TopicoPill {
  label:     string
  categoria: string
}

const TOPICOS_SUGERIDOS: TopicoPill[] = [
  { label: "Reel sobre resistência insulínica",  categoria: "Endocrinologia" },
  { label: "Série sobre menopausa",              categoria: "Ginecologia"    },
  { label: "Carrossel GLP-1",                    categoria: "Endocrinologia" },
  { label: "Stories longevidade",                categoria: "Preventivo"     },
  { label: "Conteúdo sono",                      categoria: "Bem-estar"      },
  { label: "Resistência à insulina",             categoria: "Endocrinologia" },
  { label: "Jejum intermitente",                 categoria: "Nutrição"       },
  { label: "Vitamina D e imunidade",             categoria: "Preventivo"     },
]

export default function CopilotoConteudoPage() {
  const router = useRouter()
  const [topico,       setTopico]       = useState("")
  const [contexto,     setContexto]     = useState("")
  const [dados,        setDados]        = useState<ConteudoData | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState("")
  const [salvando,     setSalvando]     = useState(false)
  const [salvouPauta,  setSalvouPauta]  = useState(false)

  async function salvarEmPautas() {
    if (!dados) return
    setSalvando(true)
    try {
      await fetch("/api/pautas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo:    dados.topico,
          categoria: "Conteúdo",
          prioridade: "Alta",
          estagio:   "Ideia",
          descricao: `Pacote gerado pelo Copiloto: Reel, Carrossel, Stories e Legenda`,
        }),
      })
      setSalvouPauta(true)
      setTimeout(() => setSalvouPauta(false), 3000)
    } catch (e) {
      console.error("[copiloto-conteudo] erro ao salvar pauta:", e)
    } finally {
      setSalvando(false)
    }
  }

  async function gerar() {
    if (!topico.trim()) return
    setLoading(true)
    setError("")
    setDados(null)
    try {
      const resp = await fetch("/api/copiloto-conteudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topico: topico.trim(), contexto }),
      })
      if (!resp.ok) throw new Error(await resp.text())
      setDados(await resp.json() as ConteudoData)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Copiloto de Conteúdo" />
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-border">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Copiloto de Conteúdo</h1>
        <p className="text-[11px] text-text-muted mt-1 font-mono uppercase tracking-widest">REEL · CARROSSEL · STORIES · LEGENDA EM 1 CLIQUE</p>
        <p className="text-[12px] text-text-secondary mt-1.5">Tire dúvidas e peça sugestões de conteúdo em conversa direta com a IA.</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Input form */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Tópico do conteúdo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                value={topico}
                onChange={e => setTopico(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && gerar()}
                placeholder="Ex: resistência à insulina, jejum intermitente, vitamina D…"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-12 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
              <button onClick={gerar} disabled={loading || !topico.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Context (optional) */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Contexto adicional <span className="font-sans normal-case text-[10px]">(opcional)</span>
            </label>
            <textarea
              value={contexto}
              onChange={e => setContexto(e.target.value)}
              placeholder="Ex: para pacientes com hipotireoidismo, baseado em estudo recente, abordagem para iniciantes…"
              rows={2}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none"
            />
          </div>

          {/* Sugestões */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Sugestões rápidas</p>
            <div className="flex flex-wrap gap-2">
              {TOPICOS_SUGERIDOS.map(t => (
                <button key={t.label} onClick={() => setTopico(t.label)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full border transition-all",
                    topico === t.label
                      ? "border-accent-border bg-accent-dim text-accent"
                      : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={gerar} disabled={loading || !topico.trim()}
            className="w-full md:w-auto flex items-center justify-center gap-2.5 bg-accent text-white font-semibold text-[13px] px-6 py-2.5 rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando pacote completo...</>
              : <><Sparkles className="w-4 h-4" /> Gerar pacote de conteúdo</>
            }
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="rounded-xl border border-accent-border bg-accent-dim p-8 text-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-text-primary mb-1">Gerando seu pacote completo</p>
            <p className="text-[11px] text-text-muted">Reel · Carrossel · Stories · Legenda Alternativa</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-[13px]">
            {error}
          </div>
        )}

        {/* Results */}
        {dados && !loading && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-text-primary">Pacote: {dados.topico}</h2>
                <p className="text-[11px] text-text-muted">4 formatos gerados — clique em &ldquo;Copiar tudo&rdquo; em cada card</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={salvarEmPautas} disabled={salvando}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-all",
                    salvouPauta
                      ? "bg-accent-dim border-accent-border text-accent"
                      : "border-border text-text-muted hover:border-accent-border hover:text-accent"
                  )}>
                  {salvando ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookmarkPlus className="w-3 h-3" />}
                  {salvouPauta ? "Salvo!" : "Salvar em pautas"}
                </button>
                <button onClick={() => router.push("/calendario")}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all">
                  <CalendarPlus className="w-3 h-3" />
                  Agendar
                </button>
                <button onClick={() => setDados(null)}
                  className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {dados.reel && <ReelCard data={dados.reel} />}
              {dados.carrossel && <CarrosselCard data={dados.carrossel} />}
              {dados.stories && <StoriesCard data={dados.stories} />}
              {dados.legenda_alternativa && <LegendaAltCard data={dados.legenda_alternativa} />}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!dados && !loading && !error && (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <Wand2 className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <h3 className="text-[14px] font-semibold text-text-primary mb-2">Copiloto de Conteúdo</h3>
            <p className="text-[12px] text-text-muted max-w-sm mx-auto">
              Digite um tópico médico e receba em segundos: roteiro de Reel, slides de Carrossel, sequência de Stories e legenda alternativa.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
