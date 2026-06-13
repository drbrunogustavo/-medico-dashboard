"use client"

import { useState } from "react"
import {
  Loader2, CalendarDays, Sparkles, ChevronRight,
  Copy, Check, X, Film, LayoutGrid, BookOpen, Hash,
  Download, Printer, ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  dia:              number
  dia_semana:       string
  formato:          string
  pilar:            string
  tema:             string
  gancho:           string
  legenda:          string
  cta:              string
  roteiro:          string
  stories_sequencia: string[]
  hashtags:         string[]
}

interface CalendarioResult {
  mes:                  string
  total_posts:          number
  posts:                Post[]
  distribuicao_pilares: Record<string, number>
  dica_estrategica:     string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ESPECIALIDADES = [
  "Endocrinologia e Nutrologia",
  "Cardiologia",
  "Dermatologia",
  "Ginecologia",
  "Ortopedia",
  "Pediatria",
  "Psiquiatria",
  "Neurologia",
  "Oncologia",
  "Medicina Geral",
]

const TEMAS_SUGERIDOS = [
  "Emagrecimento saudável",
  "Resistência à insulina",
  "Tireoide e hormônios",
  "Longevidade e aging",
  "Nutrição funcional",
  "Exercício e saúde",
  "Saúde da mulher",
  "Prevenção de doenças",
  "Sono e bem-estar",
  "Suplementação",
  "Estresse e cortisol",
  "Check-up anual",
]

// Reel=roxo, Carrossel=azul, Stories=âmbar, Foto/Feed=verde
const FORMATO_STYLE: Record<string, string> = {
  Reel:      "bg-purple-50 border-purple-200 text-purple-700",
  Carrossel: "bg-blue-50 border-blue-200 text-blue-700",
  Feed:      "bg-green-50 border-green-200 text-green-700",
  Foto:      "bg-green-50 border-green-200 text-green-700",
  Stories:   "bg-amber-50 border-amber-200 text-amber-700",
}

// dot colors for calendar grid
const FORMATO_DOT: Record<string, string> = {
  Reel:      "bg-purple-400",
  Carrossel: "bg-blue-400",
  Feed:      "bg-green-400",
  Foto:      "bg-green-400",
  Stories:   "bg-amber-400",
}

// module links per formato
const FORMATO_HREF: Record<string, string> = {
  Reel:      "/reels",
  Carrossel: "/carrossel",
  Stories:   "/stories",
  Feed:      "/legendas",
  Foto:      "/legendas",
}

const PILAR_STYLE: Record<string, string> = {
  Educativo:      "bg-blue-50 border-blue-200 text-blue-700",
  Autoridade:     "bg-purple-50 border-purple-200 text-purple-700",
  Vendas:         "bg-green-50 border-green-200 text-green-700",
  Relacionamento: "bg-pink-50 border-pink-200 text-pink-700",
}

const PILAR_DOT: Record<string, string> = {
  Educativo:      "bg-blue-400",
  Autoridade:     "bg-purple-400",
  Vendas:         "bg-green-400",
  Relacionamento: "bg-pink-400",
  Preventivo:     "bg-amber-400",
  Engajamento:    "bg-indigo-400",
}

interface MixPct { reel: number; carrossel: number; stories: number; foto: number }

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border", className)}>
      {label}
    </span>
  )
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn(
        "text-[11px] px-3 py-1.5 rounded-full border transition-all font-medium",
        active
          ? "bg-accent-dim border-accent-border text-accent"
          : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
      )}>
      {label}
    </button>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      className={cn(
        "text-[10px] font-mono px-2.5 py-1 rounded border transition-all flex items-center gap-1.5",
        copied
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-border text-text-muted hover:text-text-primary"
      )}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  )
}

// ─── Day Modal ────────────────────────────────────────────────────────────────

function DayModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const [tab, setTab] = useState<"legenda" | "roteiro" | "stories" | "hashtags">("legenda")

  const tabs = [
    { id: "legenda"  as const, label: "Legenda",  icon: BookOpen   },
    { id: "roteiro"  as const, label: "Roteiro",  icon: Film       },
    { id: "stories"  as const, label: "Stories",  icon: LayoutGrid },
    { id: "hashtags" as const, label: "Hashtags", icon: Hash       },
  ]

  const allHashtags = (post.hashtags ?? []).map(h => `#${h}`).join(" ")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge label={post.formato} className={FORMATO_STYLE[post.formato] ?? "bg-gray-50 border-gray-200 text-gray-700"} />
              <Badge label={post.pilar}   className={PILAR_STYLE[post.pilar]   ?? "bg-gray-50 border-gray-200 text-gray-700"} />
            </div>
            <h3 className="text-[15px] font-semibold text-text-primary leading-snug">{post.tema}</h3>
            <p className="text-[11px] text-text-muted font-mono">Dia {post.dia} &middot; {post.dia_semana}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Gancho */}
        <div className="px-5 pt-4">
          <div className="rounded-lg bg-accent-dim border border-accent-border px-3.5 py-2.5">
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Gancho</p>
            <p className="text-[13px] text-text-primary leading-relaxed italic">&ldquo;{post.gancho}&rdquo;</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-4">
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                  active ? "bg-accent-dim text-accent" : "text-text-muted hover:text-text-primary"
                )}>
                <t.icon className="w-3 h-3" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Gerar conteúdo completo */}
        <div className="px-5 pt-3">
          <Link
            href={FORMATO_HREF[post.formato] ?? "/copiloto-conteudo"}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white text-[12px] font-semibold rounded-xl py-2.5 hover:bg-accent/90 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gerar {post.formato} completo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto flex-1 p-5 pt-3">
          {tab === "legenda" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-[12px] text-text-primary leading-relaxed whitespace-pre-wrap">{post.legenda}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-[10px] font-mono text-text-muted uppercase mb-1.5">CTA</p>
                <p className="text-[12px] text-text-secondary italic">{post.cta}</p>
              </div>
              <CopyBtn text={`${post.legenda}\n\n${post.cta}\n\n${allHashtags}`} />
            </div>
          )}

          {tab === "roteiro" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-[12px] text-text-primary leading-relaxed whitespace-pre-wrap">{post.roteiro}</p>
              </div>
              <CopyBtn text={post.roteiro} />
            </div>
          )}

          {tab === "stories" && (
            <div className="space-y-2.5">
              {(post.stories_sequencia ?? []).map((s, i) => (
                <div key={i} className="rounded-lg border border-border bg-background px-3.5 py-3 flex items-start gap-3">
                  <span className="text-[10px] font-mono font-bold text-accent mt-0.5 w-4 flex-shrink-0">{i + 1}</span>
                  <p className="text-[12px] text-text-primary leading-relaxed">{s}</p>
                </div>
              ))}
              <CopyBtn text={(post.stories_sequencia ?? []).join("\n")} />
            </div>
          )}

          {tab === "hashtags" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(post.hashtags ?? []).map(h => (
                  <span key={h} className="text-[11px] font-mono px-2 py-1 rounded border border-accent-border bg-accent-dim text-accent">
                    #{h}
                  </span>
                ))}
              </div>
              <CopyBtn text={allHashtags} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

function CalendarGrid({
  posts, mes, ano, onSelectPost,
}: {
  posts: Post[]
  mes: number
  ano: number
  onSelectPost: (p: Post) => void
}) {
  const firstDay = new Date(ano, mes - 1, 1).getDay()
  const daysInMonth = new Date(ano, mes, 0).getDate()

  const postsByDay: Record<number, Post> = {}
  posts.forEach(p => { postsByDay[p.dia] = p })

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
          <div key={d} className="text-center py-2.5 text-[10px] font-mono text-text-muted uppercase tracking-widest">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-border last:border-0">
          {week.map((day, di) => {
            const post = day ? postsByDay[day] : undefined
            return (
              <div key={di}
                className={cn(
                  "min-h-[72px] p-1.5 border-r border-border last:border-0",
                  !day && "bg-background/50",
                  post && "cursor-pointer hover:bg-accent-dim/30 transition-colors"
                )}
                onClick={() => post && onSelectPost(post)}
              >
                {day && (
                  <div className="h-full flex flex-col gap-1">
                    <span className={cn(
                      "text-[10px] font-mono w-5 h-5 rounded flex items-center justify-center",
                      post ? "bg-accent text-white font-bold" : "text-text-muted"
                    )}>
                      {day}
                    </span>
                    {post && (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", FORMATO_DOT[post.formato] ?? "bg-gray-300")} />
                          <span className="text-[9px] font-mono text-text-muted truncate">{post.formato}</span>
                        </div>
                        <p className="text-[9px] text-text-secondary leading-tight line-clamp-2">{post.tema}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const today = new Date()
  const [mes,           setMes]           = useState(today.getMonth() + 1)
  const [ano,           setAno]           = useState(today.getFullYear())
  const [especialidade, setEspecialidade] = useState(ESPECIALIDADES[0])
  const [frequencia,    setFrequencia]    = useState(5)
  const [temasSel,      setTemasSel]      = useState<string[]>([])
  const [mixPct,        setMixPct]        = useState<MixPct>({ reel: 40, carrossel: 30, stories: 20, foto: 10 })
  const [resultado,     setResultado]     = useState<CalendarioResult | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState("")
  const [selectedPost,  setSelectedPost]  = useState<Post | null>(null)
  const [view,          setView]          = useState<"grid" | "lista">("grid")

  function toggleTema(t: string) {
    setTemasSel(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  async function gerar() {
    setLoading(true)
    setError("")
    setResultado(null)
    try {
      const resp = await fetch("/api/calendario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mes, ano, especialidade,
          pilares: ["Educativo", "Autoridade", "Vendas", "Relacionamento"],
          frequencia,
          temas: temasSel,
          mix: mixPct,
        }),
      })
      if (!resp.ok) throw new Error(await resp.text())
      const data = await resp.json() as CalendarioResult
      setResultado(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  function exportCSV() {
    if (!resultado) return
    const header = "Dia,Dia Semana,Formato,Pilar,Tema,Gancho,Legenda,CTA,Hashtags"
    const rows = resultado.posts.map(p =>
      [
        p.dia, p.dia_semana, p.formato, p.pilar,
        `"${p.tema}"`, `"${p.gancho}"`,
        `"${(p.legenda ?? "").replace(/"/g, '""')}"`,
        `"${p.cta ?? ""}"`,
        (p.hashtags ?? []).map(h => `#${h}`).join(" "),
      ].join(",")
    )
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `calendario-${MESES[mes - 1]}-${ano}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Calendário Editorial</h1>
            <p className="text-[11px] text-text-muted mt-1 font-mono uppercase tracking-widest">30 DIAS DE CONTEÚDO COM IA</p>
          </div>
          {resultado && (
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()}
                className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors">
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button onClick={exportCSV}
                className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Config form */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Mês de referência</label>
              <div className="flex gap-2">
                <select
                  value={mes}
                  onChange={e => setMes(Number(e.target.value))}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
                >
                  {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select
                  value={ano}
                  onChange={e => setAno(Number(e.target.value))}
                  className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
                >
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Especialidade</label>
              <select
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              >
                {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Frequência semanal</label>
            <div className="flex items-center gap-2">
              {[3, 5, 7].map(f => (
                <Pill key={f} label={`${f}x/semana`} active={frequencia === f} onClick={() => setFrequencia(f)} />
              ))}
              <span className="text-[11px] text-text-muted ml-2">≈ {Math.round(frequencia * 4.3)} posts/mês</span>
            </div>
          </div>

          {/* Mix de conteúdo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Mix de conteúdo (%)</label>
              <span className="text-[10px] font-mono text-text-muted">
                Total: {mixPct.reel + mixPct.carrossel + mixPct.stories + mixPct.foto}%
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: "reel" as const,      label: "Reels",     dot: "bg-purple-400" },
                { key: "carrossel" as const, label: "Carrossel", dot: "bg-blue-400"   },
                { key: "stories" as const,   label: "Stories",   dot: "bg-amber-400"  },
                { key: "foto" as const,      label: "Foto/Feed", dot: "bg-green-400"  },
              ]).map(({ key, label, dot }) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-2 h-2 rounded-full", dot)} />
                      <span className="text-[11px] text-text-secondary">{label}</span>
                    </div>
                    <span className="text-[11px] font-mono text-accent">{mixPct[key]}%</span>
                  </div>
                  <input type="range" min={0} max={70} value={mixPct[key]}
                    onChange={e => setMixPct(m => ({ ...m, [key]: Number(e.target.value) }))}
                    className="w-full accent-accent h-1.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Temas */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Temas prioritários&nbsp;
              <span className="text-text-muted normal-case font-sans text-[10px]">(opcional — até 4)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMAS_SUGERIDOS.map(t => (
                <Pill key={t} label={t} active={temasSel.includes(t)}
                  onClick={() => {
                    if (temasSel.includes(t)) toggleTema(t)
                    else if (temasSel.length < 4) toggleTema(t)
                  }}
                />
              ))}
            </div>
            {temasSel.length > 0 && (
              <p className="text-[11px] text-accent">{temasSel.length} tema(s): {temasSel.join(", ")}</p>
            )}
          </div>

          <button onClick={gerar} disabled={loading}
            className="w-full md:w-auto flex items-center justify-center gap-2.5 bg-accent text-white font-semibold text-[13px] px-6 py-2.5 rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando calendário...</>
              : <><Sparkles className="w-4 h-4" /> Gerar {Math.round(frequencia * 4.3)} posts para {MESES[mes - 1]}</>
            }
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-[13px]">
            Erro ao gerar calendário: {error}
          </div>
        )}

        {resultado && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-accent" />
                  <span className="text-[13px] font-semibold text-text-primary">{resultado.mes}</span>
                  <span className="text-[11px] text-text-muted font-mono">{resultado.total_posts} posts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(["grid", "lista"] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-lg border transition-all capitalize",
                        view === v ? "border-accent-border bg-accent-dim text-accent" : "border-border text-text-muted"
                      )}>
                      {v === "grid" ? "Grade" : "Lista"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {Object.entries(resultado.distribuicao_pilares).map(([pilar, pct]) => (
                  <div key={pilar} className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", PILAR_DOT[pilar] ?? "bg-gray-300")} />
                    <span className="text-[11px] text-text-secondary">{pilar}</span>
                    <span className="text-[11px] font-mono text-text-muted">{pct}%</span>
                  </div>
                ))}
              </div>

              {resultado.dica_estrategica && (
                <div className="mt-3 pt-3 border-t border-border rounded-lg bg-accent-dim border border-accent-border px-3 py-2 mt-3">
                  <p className="text-[11px] text-accent font-medium">💡 {resultado.dica_estrategica}</p>
                </div>
              )}
            </div>

            {view === "grid" ? (
              <CalendarGrid posts={resultado.posts} mes={mes} ano={ano} onSelectPost={setSelectedPost} />
            ) : (
              <div className="space-y-2">
                {resultado.posts.map((p, i) => (
                  <button key={i} onClick={() => setSelectedPost(p)}
                    className="w-full text-left rounded-xl border border-border bg-surface p-4 hover:border-accent-border hover:bg-accent-dim/30 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-background border border-border flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-mono text-text-muted">{p.dia_semana.slice(0,3)}</span>
                        <span className="text-[15px] font-bold text-text-primary leading-none">{p.dia}</span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge label={p.formato} className={FORMATO_STYLE[p.formato] ?? "bg-gray-50 border-gray-200 text-gray-700"} />
                          <Badge label={p.pilar}   className={PILAR_STYLE[p.pilar]   ?? "bg-gray-50 border-gray-200 text-gray-700"} />
                        </div>
                        <p className="text-[13px] font-medium text-text-primary truncate">{p.tema}</p>
                        <p className="text-[11px] text-text-muted truncate">{p.gancho}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPost && <DayModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  )
}
