"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { Plus, FileText, Search, Filter, Tag, Clock, Star, ChevronDown, Pencil, Trash2,
  Sparkles, Loader2, Clapperboard, LayoutGrid, AlignLeft, X } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIAS = ["Todas","Nutrologia","Endocrinologia","Longevidade","Metabolismo","Microbioma","Hormônios","Anti-aging","Genômica"]
const PRIORIDADES = ["Todas","Alta","Média","Baixa"]
const ESTAGIOS = ["Todos","Ideia","Em produção","Revisão","Pronto","Publicado"]

interface IdeiaConsultorio {
  titulo:        string
  formato:       "reel" | "carrossel" | "post"
  categoria:     string
  justificativa: string
}

interface Pauta {
  id: string
  titulo: string
  categoria: string
  prioridade: string
  estagio: string
  tags: string[]
  nota: string
  fonte?: string
  criada_em: string
}

const PRIORIDADE_STYLES: Record<string, string> = {
  "Alta":  "bg-red-50 border-red-200 text-red-700",
  "Média": "bg-amber-50 border-amber-200 text-amber-700",
  "Baixa": "bg-green-50 border-green-200 text-green-700",
}

const ESTAGIO_STYLES: Record<string, string> = {
  "Ideia":       "bg-slate-100 border-slate-300 text-slate-500",
  "Em produção": "bg-blue-50 border-blue-200 text-blue-700",
  "Revisão":     "bg-amber-50 border-amber-200 text-amber-700",
  "Pronto":      "bg-emerald-50 border-emerald-200 text-emerald-700",
  "Publicado":   "bg-purple-50 border-purple-200 text-purple-700",
}

export default function PautasPage() {
  const router = useRouter()
  const [pautas, setPautas]       = useState<Pauta[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState("")
  const [filterCat, setFilterCat] = useState("Todas")
  const [filterPri, setFilterPri] = useState("Todas")
  const [filterEst, setFilterEst] = useState("Todos")
  const [showForm, setShowForm]       = useState(false)
  const [showIdeias, setShowIdeias]   = useState(false)
  const [ideias, setIdeias]           = useState<IdeiaConsultorio[]>([])
  const [loadingIdeias, setLoadingIdeias] = useState(false)
  const [adicionando, setAdicionando] = useState<string | null>(null)
  const [newTitulo, setNewTitulo] = useState("")
  const [newCat, setNewCat]       = useState("Nutrologia")
  const [newPri, setNewPri]       = useState("Média")
  const [newNota, setNewNota]     = useState("")
  const [newFonte, setNewFonte]   = useState("")
  const [toast, setToast]         = useState<string | null>(null)
  const [openMenu, setOpenMenu]           = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const menuRef                   = useRef<HTMLDivElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const fetchPautas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pautas')
      const data = await res.json()
      setPautas(data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchPautas() }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = pautas.filter(p => {
    if (filterCat !== "Todas" && p.categoria !== filterCat) return false
    if (filterPri !== "Todas" && p.prioridade !== filterPri) return false
    if (filterEst !== "Todos" && p.estagio !== filterEst) return false
    if (search && !p.titulo.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addPauta = async () => {
    if (!newTitulo.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/pautas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: newTitulo, categoria: newCat, prioridade: newPri,
          estagio: "Ideia", tags: [], nota: newNota, fonte: newFonte,
        })
      })
      if (res.ok) {
        showToast("Pauta salva com sucesso!")
        setNewTitulo(""); setNewNota(""); setNewFonte(""); setShowForm(false)
        fetchPautas()
      } else {
        showToast("Erro ao salvar.")
      }
    } catch (e) {
      showToast("Erro ao salvar.")
    }
    setSaving(false)
  }

  const removePauta = async (id: string) => {
    try {
      const res = await fetch('/api/pautas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        showToast("Pauta removida.")
        setPautas(prev => prev.filter(p => p.id !== id))
      }
    } catch (e) {
      showToast("Erro ao remover.")
    }
  }

  const gerarIdeias = async () => {
    setLoadingIdeias(true)
    try {
      const res  = await fetch("/api/pautas/ideias-consultorio", { method: "POST" })
      const data = await res.json() as { sugestoes?: IdeiaConsultorio[]; aviso?: string }
      if (data.aviso) { showToast(data.aviso); return }
      setIdeias(data.sugestoes ?? [])
      setShowIdeias(true)
    } catch (e) { console.error("[pautas] gerarIdeias:", e) }
    finally { setLoadingIdeias(false) }
  }

  const adicionarIdeia = async (ideia: IdeiaConsultorio) => {
    setAdicionando(ideia.titulo)
    try {
      await fetch('/api/pautas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: ideia.titulo, categoria: ideia.categoria,
          prioridade: "Média", estagio: "Ideia",
          notas: `[${ideia.formato.toUpperCase()}] ${ideia.justificativa}`,
        }),
      })
      showToast("Pauta adicionada!")
      await fetchPautas()
    } catch (e) { console.error("[pautas] adicionarIdeia:", e) }
    finally { setAdicionando(null) }
  }

  const fmtData = (d: string) => new Date(d).toLocaleDateString("pt-BR")
  const stats = {
    total:      pautas.length,
    alta:       pautas.filter(p => p.prioridade === "Alta").length,
    producao:   pautas.filter(p => p.estagio === "Em produção").length,
    publicados: pautas.filter(p => p.estagio === "Publicado").length,
  }
  const advancedCount = (filterCat !== "Todas" ? 1 : 0) + (filterPri !== "Todas" ? 1 : 0)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Banco de Pautas"
        subtitle="REPOSITÓRIO DE IDEIAS CLÍNICAS"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={gerarIdeias}
              disabled={loadingIdeias}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-text-secondary text-[13px] font-medium hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-50"
            >
              {loadingIdeias
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5 text-accent" />}
              Ideias do consultório
            </button>
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-accent-dim border border-accent-border text-accent text-[14px] font-semibold hover:bg-accent/20 transition-colors min-h-[44px]">
              <Plus className="w-4 h-4" /> Nova Pauta
            </button>
          </div>
        }
      />
      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total de Pautas" value={stats.total}      sub="no banco"          icon={FileText} accent="green" />
          <StatCard label="Prioridade Alta" value={stats.alta}       sub="requerem atenção"  icon={Star}     accent="red"   />
          <StatCard label="Em Produção"     value={stats.producao}   sub="sendo trabalhadas" icon={Pencil}   accent="blue"  />
          <StatCard label="Publicadas"      value={stats.publicados} sub="concluídas"        icon={Clock}    accent="amber" />
        </div>

        {showIdeias && ideias.length > 0 && (
          <div className="bg-card border border-accent-border rounded-lg p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-[11px] font-mono text-accent tracking-widest uppercase">Ideias do consultório</span>
                <span className="text-[9px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-white/[0.04] border border-border">{ideias.length} sugestões</span>
              </div>
              <button onClick={() => setShowIdeias(false)} className="text-text-muted hover:text-text-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ideias.map((ideia, i) => {
                const fmtIcon = ideia.formato === "reel" ? <Clapperboard className="w-3 h-3" /> : ideia.formato === "carrossel" ? <LayoutGrid className="w-3 h-3" /> : <AlignLeft className="w-3 h-3" />
                const isAdding = adicionando === ideia.titulo
                return (
                  <div key={i} className="bg-background border border-border rounded-lg p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border border-accent-border bg-accent-dim text-accent">
                        {fmtIcon} {ideia.formato}
                      </span>
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">{ideia.categoria}</span>
                    </div>
                    <p className="text-[13px] font-medium text-text-primary leading-snug">{ideia.titulo}</p>
                    <p className="text-[11px] text-text-muted leading-relaxed">{ideia.justificativa}</p>
                    <button
                      onClick={() => adicionarIdeia(ideia)}
                      disabled={isAdding || adicionando !== null}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-accent hover:text-accent/80 disabled:opacity-50 transition-colors"
                    >
                      {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      {isAdding ? "Adicionando..." : "Adicionar ao banco"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-card border border-accent-border rounded-lg p-6 space-y-4 animate-fade-in">
            <div className="text-[11px] font-mono text-accent tracking-widest uppercase">Nova Pauta</div>
            <input value={newTitulo} onChange={e => setNewTitulo(e.target.value)}
              placeholder="Título da pauta..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={newCat} onChange={e => setNewCat(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {CATEGORIAS.filter(c => c !== "Todas").map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={newPri} onChange={e => setNewPri(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {["Alta","Média","Baixa"].map(p => <option key={p}>{p}</option>)}
              </select>
              <input value={newFonte} onChange={e => setNewFonte(e.target.value)}
                placeholder="Fonte (ex: PubMed)"
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
            </div>
            <textarea value={newNota} onChange={e => setNewNota(e.target.value)}
              placeholder="Notas, referências, ideias de formato..."
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 resize-none" />
            <div className="flex gap-3">
              <button onClick={addPauta} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Adicionar"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-border text-text-muted text-[12px] hover:text-text-secondary transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          {/* Search */}
          <div className="flex items-center gap-3">
            <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar pauta..."
              className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none" />
          </div>

          <div className="border-t border-border pt-3 space-y-2.5">
            {/* Estágio — sempre visível */}
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase w-16 flex-shrink-0">Estágio</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {ESTAGIOS.map(item => (
                  <button key={item} onClick={() => setFilterEst(item)}
                    className={cn("text-[10px] px-2.5 py-0.5 rounded-full border transition-all",
                      filterEst === item
                        ? "bg-accent-dim border-accent-border text-accent-text font-medium"
                        : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                    )}>
                    {item}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAdvancedFilters(v => !v)}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all flex-shrink-0",
                  showAdvancedFilters || advancedCount > 0
                    ? "bg-accent-dim border-accent-border text-accent"
                    : "border-border text-text-muted hover:text-text-secondary"
                )}
              >
                Filtros
                {advancedCount > 0 && (
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-accent text-background text-[8px] font-bold">
                    {advancedCount}
                  </span>
                )}
                <ChevronDown className={cn("w-3 h-3 transition-transform", showAdvancedFilters && "rotate-180")} />
              </button>
            </div>

            {/* Categoria + Prioridade — recolhidos por padrão */}
            {showAdvancedFilters && (
              <>
                {[
                  { label:"Categoria",  items:CATEGORIAS, value:filterCat, set:setFilterCat },
                  { label:"Prioridade", items:PRIORIDADES, value:filterPri, set:setFilterPri },
                ].map(g => (
                  <div key={g.label} className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase w-16 flex-shrink-0">{g.label}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map(item => (
                        <button key={item} onClick={() => g.set(item)}
                          className={cn("text-[10px] px-2.5 py-0.5 rounded-full border transition-all",
                            g.value === item
                              ? "bg-accent-dim border-accent-border text-accent-text font-medium"
                              : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                          )}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-text-muted text-[13px]">Carregando pautas...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-[13px]">
            Nenhuma pauta encontrada. Clique em &quot;Nova Pauta&quot; para começar.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="group bg-card border border-border hover:border-border-hover rounded-lg p-5 transition-all duration-150">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", PRIORIDADE_STYLES[p.prioridade] || PRIORIDADE_STYLES["Baixa"])}>
                        {p.prioridade}
                      </span>
                      <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full border", ESTAGIO_STYLES[p.estagio] || ESTAGIO_STYLES["Ideia"])}>
                        {p.estagio}
                      </span>
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">
                        {p.categoria}
                      </span>
                      {p.fonte && <span className="text-[9px] font-mono text-text-muted">via {p.fonte}</span>}
                    </div>
                    <h3 className="text-[14px] font-semibold text-text-primary leading-snug mb-2">{p.titulo}</h3>
                    {p.nota && <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{p.nota}</p>}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="w-3 h-3 text-text-muted" />
                        {p.tags.map(t => (
                          <span key={t} className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {/* Dropdown de formatos */}
                    <div className="relative" ref={openMenu === p.id ? menuRef : undefined}>
                      <button
                        onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-text-muted hover:text-accent hover:border-accent-border text-[10px] font-mono transition-colors whitespace-nowrap"
                      >
                        Formatos <ChevronDown className="w-3 h-3" />
                      </button>
                      {openMenu === p.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[160px]">
                          {([
                            { label: "📸 Imagens",   path: "/imagens"   },
                            { label: "🎬 Roteiro",   path: "/roteiros"  },
                            { label: "📊 Carrossel", path: "/carrossel" },
                            { label: "🎭 Reels",     path: "/reels"     },
                            { label: "📱 Stories",   path: "/stories"   },
                            { label: "✍️ Legenda",   path: "/legendas"  },
                          ] as { label: string; path: string }[]).map(({ label, path }) => (
                            <button
                              key={path}
                              onClick={() => { router.push(path + "?tema=" + encodeURIComponent(p.titulo)); setOpenMenu(null) }}
                              className="w-full text-left px-3 py-2 text-[11px] text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => removePauta(p.id)}
                      className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-500/40 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-[9px] font-mono text-text-muted">Criada em {fmtData(p.criada_em)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
