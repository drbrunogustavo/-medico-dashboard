"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { Plus, Users, TrendingUp, Eye, Star, ExternalLink, Search, Instagram, Globe, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const NICHOS = ["Todos","Nutrologia","Endocrinologia","Longevidade","Metabolismo","Geral"]
const RELEVANCIA = ["Todas","Alta","Média","Baixa"]

interface Referencia {
  id: number
  nome: string
  especialidade: string
  instagram: string
  seguidores: string
  frequencia: string
  temas: string[]
  relevancia: "Alta" | "Média" | "Baixa"
  nota: string
  site?: string
}

const MOCK_REFS: Referencia[] = [
  {
    id: 1,
    nome: "Dr. Rodrigo Bomeny",
    especialidade: "Endocrinologia",
    instagram: "@rodrigobomeny",
    seguidores: "280k",
    frequencia: "Diária",
    temas: ["Tireoide","GLP-1","Metabolismo"],
    relevancia: "Alta",
    nota: "Referência nacional em endocrinologia. Posts altamente técnicos com linguagem acessível.",
    site: "rodrigobomeny.com.br",
  },
  {
    id: 2,
    nome: "Dr. Souto",
    especialidade: "Longevidade",
    instagram: "@drsouto",
    seguidores: "520k",
    frequencia: "3x/semana",
    temas: ["Low carb","Jejum","Evidências"],
    relevancia: "Alta",
    nota: "Muito forte em comunicação científica. Excelente referência de formato de carrossel.",
  },
  {
    id: 3,
    nome: "Dra. Ana Claudia Kaufmann",
    especialidade: "Nutrologia",
    instagram: "@anacklaufmann",
    seguidores: "95k",
    frequencia: "2x/semana",
    temas: ["Micronutrientes","Suplementação","Nutrição clínica"],
    relevancia: "Média",
    nota: "Ótimo conteúdo sobre suplementação com base em evidências.",
  },
]

const RELEVANCIA_STYLES = {
  Alta:  "bg-red-950/60 border-red-500/40 text-red-400",
  Média: "bg-amber-950/60 border-amber-500/40 text-amber-400",
  Baixa: "bg-green-950/60 border-green-600/40 text-green-400",
}

const FREQ_STYLES: Record<string, string> = {
  "Diária":    "text-emerald-400",
  "3x/semana": "text-blue-400",
  "2x/semana": "text-blue-400",
  "1x/semana": "text-amber-400",
  "Esporádica":"text-text-muted",
}

export default function ReferenciasPage() {
  const [refs, setRefs]           = useState<Referencia[]>(MOCK_REFS)
  const [search, setSearch]       = useState("")
  const [filterNicho, setFilterNicho] = useState("Todos")
  const [filterRel, setFilterRel] = useState("Todas")
  const [showForm, setShowForm]   = useState(false)
  const [newNome, setNewNome]     = useState("")
  const [newInsta, setNewInsta]   = useState("")
  const [newEsp, setNewEsp]       = useState("Endocrinologia")
    const [newRel, setNewRel]     = useState<"Alta"|"Média"|"Baixa">("Média")
  const [newNota, setNewNota]     = useState("")

  const filtered = refs.filter(r => {
    if (filterNicho !== "Todos" && r.especialidade !== filterNicho) return false
    if (filterRel   !== "Todas" && r.relevancia    !== filterRel)   return false
    if (search && !r.nome.toLowerCase().includes(search.toLowerCase()) &&
        !r.instagram.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addRef = () => {
    if (!newNome.trim()) return
    const nova: Referencia = {
      id: Date.now(),
      nome: newNome,
      especialidade: newEsp,
      instagram: newInsta || "@—",
      seguidores: "—",
      frequencia: "—",
      temas: [],
      relevancia: newRel,
      nota: newNota,
    }
    setRefs(prev => [nova, ...prev])
    setNewNome(""); setNewInsta(""); setNewNota(""); setShowForm(false)
  }

  const removeRef = (id: number) => setRefs(prev => prev.filter(r => r.id !== id))

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Monitor de Referências"
        subtitle="MÉDICOS INFLUENTES NO SEU NICHO"
        actions={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Adicionar Referência
          </button>
        }
      />

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Perfis Monitorados" value={refs.length}                                    sub="referências ativas"  icon={Users}      accent="green" />
          <StatCard label="Alta Relevância"     value={refs.filter(r=>r.relevancia==="Alta").length}  sub="perfis prioritários" icon={Star}        accent="red"   />
          <StatCard label="Especialidades"      value={new Set(refs.map(r=>r.especialidade)).size}    sub="nichos cobertos"     icon={TrendingUp}  accent="blue"  />
          <StatCard label="Total Seguidores"    value="895k+"                                          sub="alcance combinado"   icon={Eye}         accent="amber" />
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-accent-border rounded-lg p-6 space-y-4 animate-fade-in">
            <div className="text-[11px] font-mono text-accent tracking-widest uppercase">Nova Referência</div>
            <div className="grid grid-cols-2 gap-3">
              <input value={newNome} onChange={e => setNewNome(e.target.value)}
                placeholder="Nome do médico..."
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 col-span-2" />
              <input value={newInsta} onChange={e => setNewInsta(e.target.value)}
                placeholder="@instagram"
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
              <select value={newEsp} onChange={e => setNewEsp(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {NICHOS.filter(n => n !== "Todos").map(n => <option key={n}>{n}</option>)}
              </select>
              <select value={newRel} onChange={e => setNewRel(e.target.value as "Alta"|"Média"|"Baixa")}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {["Alta","Média","Baixa"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <textarea value={newNota} onChange={e => setNewNota(e.target.value)}
              placeholder="Observações sobre o perfil, estilo de conteúdo, diferenciais..."
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 resize-none" />
            <div className="flex gap-3">
              <button onClick={addRef}
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
          <div className="flex items-center gap-3">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou @instagram..."
              className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none" />
          </div>
          <div className="border-t border-border pt-3 space-y-2.5">
            {[
              { label:"Nicho",       items:NICHOS,     value:filterNicho, set:setFilterNicho },
              { label:"Relevância",  items:RELEVANCIA, value:filterRel,   set:setFilterRel   },
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

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-[13px]">
            Nenhuma referência encontrada. Clique em &quot;Adicionar Referência&quot; para começar.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(r => (
              <div key={r.id} className="group bg-card border border-border hover:border-border-hover rounded-lg p-5 transition-all duration-150">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0 text-[14px] font-semibold text-accent">
                      {r.nome.split(" ").slice(0,2).map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">{r.nome}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Instagram className="w-3 h-3 text-text-muted" />
                        <span className="text-[10px] font-mono text-text-secondary">{r.instagram}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", RELEVANCIA_STYLES[r.relevancia])}>
                      {r.relevancia}
                    </span>
                    <button onClick={() => removeRef(r.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded border border-border flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-500/40 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label:"Especialidade", value: r.especialidade },
                    { label:"Seguidores",    value: r.seguidores    },
                    { label:"Frequência",    value: r.frequencia, colored: true },
                  ].map(info => (
                    <div key={info.label} className="bg-background border border-border rounded-md px-3 py-2">
                      <div className="text-[8px] font-mono text-text-muted tracking-widest uppercase mb-0.5">{info.label}</div>
                      <div className={cn("text-[11px] font-medium", info.colored ? (FREQ_STYLES[info.value] || "text-text-secondary") : "text-text-primary")}>
                        {info.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Temas */}
                {r.temas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.temas.map(t => (
                      <span key={t} className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">{t}</span>
                    ))}
                  </div>
                )}

                {/* Nota */}
                {r.nota && (
                  <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{r.nota}</p>
                )}

                {/* Footer */}
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <a href={`https://instagram.com/${r.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors">
                    <Instagram className="w-3 h-3" /> Ver perfil
                  </a>
                  {r.site && (
                    <a href={`https://${r.site}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors">
                      <Globe className="w-3 h-3" /> {r.site}
                    </a>
                  )}
                  <div className="ml-auto">
                    <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
