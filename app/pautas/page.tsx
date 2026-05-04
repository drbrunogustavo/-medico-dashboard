"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { Plus, FileText, Search, Filter, Tag, Clock, Star, ChevronRight, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const CATEGORIAS = ["Todas","Nutrologia","Endocrinologia","Longevidade","Metabolismo","Microbioma","Hormônios","Anti-aging","Genômica"]
const PRIORIDADES = ["Todas","Alta","Média","Baixa"]
const ESTAGIOS = ["Todos","Ideia","Em produção","Revisão","Pronto","Publicado"]

interface Pauta {
  id: string
  titulo: string
  categoria: string
  prioridade: "Alta" | "Média" | "Baixa"
  estagio: string
  tags: string[]
  nota: string
  fonte?: string
  criada_em: string
}

const PRIORIDADE_STYLES = {
  Alta:  "bg-red-950/60 border-red-500/40 text-red-400",
  Média: "bg-amber-950/60 border-amber-500/40 text-amber-400",
  Baixa: "bg-green-950/60 border-green-600/40 text-green-400",
}

const ESTAGIO_STYLES: Record<string, string> = {
  "Ideia":       "bg-slate-800/60 border-slate-600/40 text-slate-400",
  "Em produção": "bg-blue-950/60 border-blue-600/40 text-blue-400",
  "Revisão":     "bg-amber-950/60 border-amber-500/40 text-amber-400",
  "Pronto":      "bg-emerald-950/60 border-emerald-600/40 text-emerald-400",
  "Publicado":   "bg-purple-950/60 border-purple-600/40 text-purple-400",
}

export default function PautasPage() {
  const [pautas, setPautas]       = useState<Pauta[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState("")
  const [filterCat, setFilterCat] = useState("Todas")
  const [filterPri, setFilterPri] = useState("Todas")
  const [filterEst, setFilterEst] = useState("Todos")
  const [showForm, setShowForm]   = useState(false)
  const [newTitulo, setNewTitulo] = useState("")
  const [newCat, setNewCat]       = useState("Nutrologia")
  const [newPri, setNewPri]       = useState<"Alta"|"Média"|"Baixa">("Média")
  const [newNota, setNewNota]     = useState("")
  const [newFonte, setNewFonte]   = useState("")
  const [toast, setToast]         = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const fetchPautas = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("pautas")
      .select("*")
      .order("criada_em", { ascending: false })
    if (error) console.error("Erro ao buscar pautas:", error)
    else setPautas(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPautas() }, [])

  const filtered = pautas.filter(p => {
    if (filterCat !== "Todas" && p.categoria !== filterCat) return false
    if (filterPri !== "Todas" && p.prioridade !== filterPri) return false
    if (filterEst !== "Todos" && p.estagio    !== filterEst) return false
    if (search && !p.titulo.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addPauta = async () => {
    if (!newTitulo.trim()) return
    setSaving(true)
    const { error } = await supabase.from("pautas").insert({
      titulo: newTitulo, categoria: newCat, prioridade: newPri,
      estagio: "Ideia", tags: [], nota: newNota, fonte: newFonte,
    })
    if (error) showToast("Erro ao salvar. Tente novamente.")
    else {
      showToast("Pauta salva com sucesso!")
      setNewTitulo(""); setNewNota(""); setNewFonte(""); setShowForm(false)
      fetchPautas()
    }
    setSaving(false)
  }

  const removePauta = async (id: string) => {
    const { error } = await supabase.from("pautas").delete().eq("id", id)
    if (error) showToast("Erro ao remover. Tente novamente.")
    else { showToast("Pauta removida."); setPautas(prev => prev.filter(p => p.id !== id)) }
  }

  const fmtData = (d: string) => new Date(d).toLocaleDateString("pt-BR")
  const stats = {
    total:      pautas.length,
    alta:       pautas.filter(p => p.prioridade === "Alta").length,
    producao:   pautas.filter(p => p.estagio === "Em produção").length,
    publicados: pautas.filter(p => p.estagio === "Publicado").length,
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Banco de Pautas"
        subtitle="REPOSITÓRIO DE IDEIAS CLÍNICAS"
        actions={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nova Pauta
          </button>
        }
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total de Pautas" value={stats.total}      sub="no banco"          icon={FileText} accent="green" />
          <StatCard label="Prioridade Alta" value={stats.alta}       sub="requerem atenção"  icon={Star}     accent="red"   />
          <StatCard label="Em Produção"     value={stats.producao}   sub="sendo trabalhadas" icon={Pencil}   accent="blue"  />
          <StatCard label="Publicadas"      value={stats.publicados} sub="concluídas"        icon={Clock}    accent="amber" />
        </div>

        {showForm && (
          <div className="bg-card border border-accent-border rounded-lg p-6 space-y-4 animate-fade-in">
            <div className="text-[11px] font-mono text-accent tracking-widest uppercase">Nova Pauta</div>
            <input value={newTitulo} onChange={e => setNewTitulo(e.target.value)}
              placeholder="Título da pauta..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
            <div className="grid grid-cols-3 gap-3">
              <select value={newCat} onChange={e => setNewCat(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {CATEGORIAS.filter(c => c !== "Todas").map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={newPri} onChange={e => setNewPri(e.target.value as "Alta"|"Média"|"Baixa")}
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
          <div className="flex items-center gap-3 mb-1">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar pauta..."
              className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none" />
            <Filter className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="border-t border-border pt-3 space-y-2.5">
            {[
              { label:"Categoria",  items:CATEGORIAS, value:filterCat, set:setFilterCat },
              { label:"Prioridade", items:PRIORIDADES, value:filterPri, set:setFilterPri },
              { label:"Estágio",    items:ESTAGIOS,   value:filterEst, set:setFilterEst },
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
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", PRIORIDADE_STYLES[p.prioridade])}>
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
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => removePauta(p.id)}
                      className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-500/40 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
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