"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { Plus, FileText, Search, Filter, Tag, Clock, Star, ChevronRight, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIAS = ["Todas","Nutrologia","Endocrinologia","Longevidade","Metabolismo","Microbioma","Hormônios","Anti-aging","Genômica"]
const PRIORIDADES = ["Todas","Alta","Média","Baixa"]
const ESTAGIOS = ["Todos","Ideia","Em produção","Revisão","Pronto","Publicado"]

interface Pauta {
  id: number
  titulo: string
  categoria: string
  prioridade: "Alta" | "Média" | "Baixa"
  estagio: string
  tags: string[]
  nota: string
  criada: string
  fonte?: string
}

const MOCK_PAUTAS: Pauta[] = [
  {
    id: 1,
    titulo: "GLP-1 além da diabetes: o que os seus pacientes precisam saber",
    categoria: "Endocrinologia",
    prioridade: "Alta",
    estagio: "Em produção",
    tags: ["GLP-1","Ozempic","Neuroproteção"],
    nota: "Usar dados do Lancet. Abordar a questão do acesso no Brasil.",
    criada: "02/05/2025",
    fonte: "The Lancet",
  },
  {
    id: 2,
    titulo: "Resistência insulínica em pessoas magras: o que o exame não mostra",
    categoria: "Metabolismo",
    prioridade: "Alta",
    estagio: "Ideia",
    tags: ["Insulina","Diagnóstico","Prevenção"],
    nota: "Basear no estudo do NEJM. Carrossel com 5 sinais clínicos.",
    criada: "30/04/2025",
    fonte: "NEJM",
  },
  {
    id: 3,
    titulo: "Microbioma e tireoide: a conexão que ninguém te contou",
    categoria: "Microbioma",
    prioridade: "Média",
    estagio: "Revisão",
    tags: ["Microbioma","Tireoide","Akkermansia"],
    nota: "Simplificar a linguagem para o público geral. Incluir dicas práticas de alimentação.",
    criada: "01/05/2025",
    fonte: "Nature Medicine",
  },
]

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
  const [pautas, setPautas] = useState<Pauta[]>(MOCK_PAUTAS)
  const [search, setSearch]       = useState("")
  const [filterCat, setFilterCat] = useState("Todas")
  const [filterPri, setFilterPri] = useState("Todas")
  const [filterEst, setFilterEst] = useState("Todos")
  const [showForm, setShowForm]   = useState(false)
  const [newTitulo, setNewTitulo] = useState("")
  const [newCat, setNewCat]       = useState("Nutrologia")
  const [newPri, setNewPri]       = useState<"Alta"|"Média"|"Baixa">("Média")
  const [newNota, setNewNota]     = useState("")

  const filtered = pautas.filter(p => {
    if (filterCat !== "Todas" && p.categoria !== filterCat) return false
    if (filterPri !== "Todas" && p.prioridade !== filterPri) return false
    if (filterEst !== "Todos" && p.estagio !== filterEst) return false
    if (search && !p.titulo.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addPauta = () => {
    if (!newTitulo.trim()) return
    const nova: Pauta = {
      id: Date.now(),
      titulo: newTitulo,
      categoria: newCat,
      prioridade: newPri,
      estagio: "Ideia",
      tags: [],
      nota: newNota,
      criada: new Date().toLocaleDateString("pt-BR"),
    }
    setPautas(prev => [nova, ...prev])
    setNewTitulo(""); setNewNota(""); setShowForm(false)
  }

  const removePauta = (id: number) => setPautas(prev => prev.filter(p => p.id !== id))

  const stats = {
    total:      pautas.length,
    alta:       pautas.filter(p=>p.prioridade==="Alta").length,
    producao:   pautas.filter(p=>p.estagio==="Em produção").length,
    publicados: pautas.filter(p=>p.estagio==="Publicado").length,
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Banco de Pautas"
        subtitle="REPOSITÓRIO DE IDEIAS CLÍNICAS"
        actions={
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Pauta
          </button>
        }
      />

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total de Pautas"  value={stats.total}      sub="no banco"            icon={FileText} accent="green" />
          <StatCard label="Prioridade Alta"  value={stats.alta}       sub="requerem atenção"    icon={Star}     accent="red"   />
          <StatCard label="Em Produção"      value={stats.producao}   sub="sendo trabalhadas"   icon={Pencil}   accent="blue"  />
          <StatCard label="Publicadas"       value={stats.publicados} sub="concluídas"          icon={Clock}    accent="amber" />
        </div>

        {/* Form nova pauta */}
        {showForm && (
          <div className="bg-card border border-accent-border rounded-lg p-6 space-y-4 animate-fade-in">
            <div className="text-[11px] font-mono text-accent tracking-widest uppercase">Nova Pauta</div>
            <input
              value={newTitulo}
              onChange={e => setNewTitulo(e.target.value)}
              placeholder="Título da pauta..."
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
            />
            <div className="grid grid-cols-2 gap-3">
              <select value={newCat} onChange={e => setNewCat(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {CATEGORIAS.filter(c => c !== "Todas").map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={newPri} onChange={e => setNewPri(e.target.value as "Alta"|"Média"|"Baixa")}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {["Alta","Média","Baixa"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <textarea
              value={newNota}
              onChange={e => setNewNota(e.target.value)}
              placeholder="Notas, referências, ideias de formato..."
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none"
            />
            <div className="flex gap-3">
              <button onClick={addPauta}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-border text-text-muted text-[12px] hover:text-text-secondary transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar pauta..."
              className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none"
            />
            <Filter className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="border-t border-border pt-3 space-y-2.5">
            {[
              { label:"Categoria", items:CATEGORIAS,    key:"cat", value:filterCat, set:setFilterCat },
              { label:"Prioridade",items:PRIORIDADES,   key:"pri", value:filterPri, set:setFilterPri },
              { label:"Estágio",   items:ESTAGIOS,      key:"est", value:filterEst, set:setFilterEst },
            ].map(g => (
              <div key={g.key} className="flex items-center gap-3">
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

        {/* Pautas list */}
        {filtered.length === 0 ? (
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
                      {p.fonte && (
                        <span className="text-[9px] font-mono text-text-muted">via {p.fonte}</span>
                      )}
                    </div>
                    <h3 className="text-[14px] font-semibold text-text-primary leading-snug mb-2">{p.titulo}</h3>
                    {p.nota && (
                      <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{p.nota}</p>
                    )}
                    {p.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="w-3 h-3 text-text-muted" />
                        {p.tags.map(t => (
                          <span key={t} className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-hover transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => removePauta(p.id)}
                      className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-500/40 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[9px] font-mono text-text-muted">Criada em {p.criada}</span>
                  <span className="text-[9px] font-mono text-text-muted">ID #{p.id.toString().slice(-4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
