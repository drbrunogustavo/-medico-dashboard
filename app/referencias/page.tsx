"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { Plus, Users, TrendingUp, Eye, Star, ExternalLink, Search, Instagram, Globe, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const NICHOS = ["Todos","Nutrologia","Endocrinologia","Longevidade","Metabolismo","Geral"]
const RELEVANCIA = ["Todas","Alta","Media","Baixa"]

interface Referencia {
  id: string
  nome: string
  especialidade: string
  instagram: string
  seguidores: string
  frequencia: string
  temas: string[]
  relevancia: string
  nota: string
  site?: string
  criada_em: string
}

const RELEVANCIA_STYLES: Record<string, string> = {
  "Alta":  "bg-red-950/60 border-red-500/40 text-red-400",
  "Media": "bg-amber-950/60 border-amber-500/40 text-amber-400",
  "Baixa": "bg-green-950/60 border-green-600/40 text-green-400",
}

const FREQ_STYLES: Record<string, string> = {
  "Diaria":    "text-emerald-400",
  "3x/semana": "text-blue-400",
  "2x/semana": "text-blue-400",
  "1x/semana": "text-amber-400",
  "Esporadica":"text-text-muted",
}

export default function ReferenciasPage() {
  const router = useRouter()
  const [refs, setRefs]               = useState<Referencia[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [search, setSearch]           = useState("")
  const [filterNicho, setFilterNicho] = useState("Todos")
  const [filterRel, setFilterRel]     = useState("Todas")
  const [showForm, setShowForm]       = useState(false)
  const [newNome, setNewNome]         = useState("")
  const [newInsta, setNewInsta]       = useState("")
  const [newEsp, setNewEsp]           = useState("Endocrinologia")
  const [newSeg, setNewSeg]           = useState("")
  const [newFreq, setNewFreq]         = useState("2x/semana")
  const [newRel, setNewRel]           = useState("Media")
  const [newNota, setNewNota]         = useState("")
  const [newSite, setNewSite]         = useState("")
  const [newTemas, setNewTemas]       = useState("")
  const [toast, setToast]             = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const fetchRefs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/referencias')
      const data = await res.json()
      setRefs(data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchRefs() }, [])

  const filtered = refs
    .filter(r => {
      if (filterNicho !== "Todos" && r.especialidade !== filterNicho) return false
      if (filterRel !== "Todas" && r.relevancia !== filterRel) return false
      if (search && !r.nome.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      const order: Record<string, number> = { Alta: 0, Media: 1, Baixa: 2 }
      return (order[a.relevancia] ?? 2) - (order[b.relevancia] ?? 2)
    })

  const addRef = async () => {
    if (!newNome.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/referencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newNome, especialidade: newEsp, instagram: newInsta || "-",
          seguidores: newSeg || "-", frequencia: newFreq,
          temas: newTemas ? newTemas.split(",").map(t => t.trim()).filter(Boolean) : [],
          relevancia: newRel, nota: newNota, site: newSite,
        })
      })
      if (res.ok) {
        showToast("Referencia salva!")
        setNewNome(""); setNewInsta(""); setNewNota(""); setNewSite(""); setNewSeg(""); setNewTemas("")
        setShowForm(false)
        fetchRefs()
      } else {
        showToast("Erro ao salvar.")
      }
    } catch (e) {
      showToast("Erro ao salvar.")
    }
    setSaving(false)
  }

  const removeRef = async (id: string) => {
    try {
      const res = await fetch('/api/referencias', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        showToast("Removida.")
        setRefs(prev => prev.filter(r => r.id !== id))
      }
    } catch (e) {
      showToast("Erro ao remover.")
    }
  }

  const totalSeg = refs.map(r => parseInt(r.seguidores.replace(/[^0-9]/g, "")) || 0).reduce((a, b) => a + b, 0)
  const fmtSeg = totalSeg > 0 ? (totalSeg >= 1000000 ? (totalSeg/1000000).toFixed(1)+"M+" : (totalSeg/1000).toFixed(0)+"k+") : "-"

  const inspirarPauta = (r: Referencia) => {
    const base = r.temas && r.temas.length > 0
      ? r.temas[0]
      : r.especialidade
    router.push('/roteiros?tema=' + encodeURIComponent(base))
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Monitor de Referencias"
        subtitle="MEDICOS INFLUENTES NO SEU NICHO"
        actions={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Adicionar Referencia
          </button>
        }
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Perfis" value={refs.length} sub="referencias ativas" icon={Users} accent="green" />
          <StatCard label="Alta Relevancia" value={refs.filter(r=>r.relevancia==="Alta").length} sub="prioritarios" icon={Star} accent="red" />
          <StatCard label="Especialidades" value={new Set(refs.map(r=>r.especialidade)).size} sub="nichos" icon={TrendingUp} accent="blue" />
          <StatCard label="Seguidores" value={fmtSeg} sub="alcance combinado" icon={Eye} accent="amber" />
        </div>

        {showForm && (
          <div className="bg-card border border-accent-border rounded-lg p-6 space-y-4 animate-fade-in">
            <div className="text-[11px] font-mono text-accent tracking-widest uppercase">Nova Referencia</div>
            <div className="grid grid-cols-2 gap-3">
              <input value={newNome} onChange={e => setNewNome(e.target.value)}
                placeholder="Nome do medico..."
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 col-span-2" />
              <input value={newInsta} onChange={e => setNewInsta(e.target.value)}
                placeholder="@instagram"
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
              <input value={newSeg} onChange={e => setNewSeg(e.target.value)}
                placeholder="Seguidores (ex: 150k)"
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
              <select value={newEsp} onChange={e => setNewEsp(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {NICHOS.filter(n => n !== "Todos").map(n => <option key={n}>{n}</option>)}
              </select>
              <select value={newFreq} onChange={e => setNewFreq(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {["Diaria","3x/semana","2x/semana","1x/semana","Esporadica"].map(f => <option key={f}>{f}</option>)}
              </select>
              <select value={newRel} onChange={e => setNewRel(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {["Alta","Media","Baixa"].map(r => <option key={r}>{r}</option>)}
              </select>
              <input value={newSite} onChange={e => setNewSite(e.target.value)}
                placeholder="Site (opcional)"
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
              {/* Temas frequentes */}
              <input value={newTemas} onChange={e => setNewTemas(e.target.value)}
                placeholder="Temas frequentes (ex: insulina, tireoide, emagrecimento)"
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 col-span-2" />
            </div>
            <textarea value={newNota} onChange={e => setNewNota(e.target.value)}
              placeholder="Observacoes..." rows={3}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 resize-none" />
            <div className="flex gap-3">
              <button onClick={addRef} disabled={saving}
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
          <div className="flex items-center gap-3">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou @instagram..."
              className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none" />
          </div>
          <div className="border-t border-border pt-3 space-y-2.5">
            {[
              { label:"Nicho",      items:NICHOS,     value:filterNicho, set:setFilterNicho },
              { label:"Relevancia", items:RELEVANCIA, value:filterRel,   set:setFilterRel   },
            ].map(g => (
              <div key={g.label} className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase w-16 flex-shrink-0">{g.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map(item => (
                    <button key={item} onClick={() => g.set(item)}
                      className={cn("text-[10px] px-2.5 py-0.5 rounded-full border transition-all",
                        g.value === item
                          ? "bg-accent-dim border-accent-border text-accent-text font-medium"
                          : "border-border text-text-muted hover:text-text-secondary")}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-text-muted text-[13px]">Carregando referencias...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-[13px]">Nenhuma referencia encontrada. Clique em Adicionar Referencia para comecar.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(r => (
              <div key={r.id} className="group bg-card border border-border hover:border-border-hover rounded-lg p-5 transition-all duration-150">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-accent">
                      {r.nome.split(" ").slice(0,2).map((n:string) => n[0]).join("")}
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
                    <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", RELEVANCIA_STYLES[r.relevancia] || RELEVANCIA_STYLES["Media"])}>
                      {r.relevancia}
                    </span>
                    <button onClick={() => removeRef(r.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded border border-border flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-500/40 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label:"Especialidade", value:r.especialidade, colored:false },
                    { label:"Seguidores",    value:r.seguidores,    colored:false },
                    { label:"Frequencia",    value:r.frequencia,    colored:true  },
                  ].map(info => (
                    <div key={info.label} className="bg-background border border-border rounded-md px-3 py-2">
                      <div className="text-[8px] font-mono text-text-muted tracking-widest uppercase mb-0.5">{info.label}</div>
                      <div className={cn("text-[11px] font-medium", info.colored ? (FREQ_STYLES[info.value] || "text-text-secondary") : "text-text-primary")}>{info.value}</div>
                    </div>
                  ))}
                </div>

                {/* Temas frequentes */}
                {r.temas && r.temas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.temas.map((t: string) => (
                      <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent-text font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {r.nota && <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{r.nota}</p>}

                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <a href={"https://instagram.com/" + r.instagram.replace("@","")} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors">
                    <Instagram className="w-3 h-3" /> Ver perfil
                  </a>
                  {r.site && (
                    <a href={"https://" + r.site} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors">
                      <Globe className="w-3 h-3" /> {r.site}
                    </a>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => inspirarPauta(r)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-text-muted hover:text-accent hover:border-accent-border text-[10px] font-mono transition-all whitespace-nowrap">
                      💡 Inspirar Pauta
                    </button>
                    <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
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
