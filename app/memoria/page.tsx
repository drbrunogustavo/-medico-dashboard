"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Brain, BookOpen, Star, History, Tag, Database, Info,
  Plus, Trash2, Edit2, Check, X, Loader2, Heart,
  Copy, Search, ChevronDown, ChevronRight,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Tipo = "protocolo" | "script" | "historico" | "tema" | "conhecimento"

interface MemoriaItem {
  id:        string
  tipo:      Tipo
  titulo:    string
  conteudo:  string
  tags:      string[]
  favorito:  boolean
  criado_em: string
}

interface HistoricoItem {
  id:            string
  paciente_nome: string | null
  tipo_consulta: string | null
  resultado:     Record<string, unknown>
  created_at:    string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ABAS: { id: Tipo; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { id: "protocolo",   label: "Protocolos",         icon: BookOpen,  desc: "Protocolos clínicos salvos",       color: "#3b7fff" },
  { id: "script",      label: "Scripts",            icon: Star,      desc: "Scripts e textos favoritos",       color: "#d4af37" },
  { id: "historico",   label: "Histórico",          icon: History,   desc: "Consultas recentes",               color: "#a78bfa" },
  { id: "tema",        label: "Temas de Conteúdo",  icon: Tag,       desc: "Temas para redes sociais",         color: "var(--accent)" },
  { id: "conhecimento",label: "Base de Conhecimento",icon: Database,  desc: "Conhecimento da clínica",         color: "#ec4899" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800) }}
      className="p-1.5 rounded-lg border border-border text-text-muted hover:text-accent hover:border-accent-border transition-all flex-shrink-0"
    >
      {ok ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

// ─── Card de item de memória ──────────────────────────────────────────────────

function ItemCard({
  item, onDelete, onToggleFav, onEdit,
}: {
  item: MemoriaItem
  onDelete: (id: string) => void
  onToggleFav: (id: string, val: boolean) => void
  onEdit: (item: MemoriaItem) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await fetch(`/api/memoria?id=${item.id}`, { method: "DELETE" })
    onDelete(item.id)
  }

  return (
    <div className={cn(
      "bg-card border rounded-xl transition-all",
      item.favorito ? "border-[#d4af37]/40" : "border-border",
    )}>
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => onToggleFav(item.id, !item.favorito)}
          className={cn("flex-shrink-0 mt-0.5 transition-colors", item.favorito ? "text-[#d4af37]" : "text-text-muted hover:text-[#d4af37]")}
        >
          <Heart className={cn("w-3.5 h-3.5", item.favorito ? "fill-current" : "")} />
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 w-full text-left"
          >
            <span className="text-[13px] font-semibold text-text-primary truncate">{item.titulo}</span>
            {expanded
              ? <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0" />
              : <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0" />}
          </button>
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.tags.map(t => (
                <span key={t} className="text-badge font-mono px-1.5 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">{t}</span>
              ))}
            </div>
          )}
          {expanded && (
            <div className="mt-3 text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap bg-background border border-border rounded-lg p-3">
              {item.conteudo}
            </div>
          )}
          <div className="text-[10px] text-text-muted mt-2">{fmtDate(item.criado_em)}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <CopyBtn text={item.conteudo} />
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg border border-border text-text-muted hover:text-blue-400 hover:border-blue-400/40 transition-all">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg border border-border text-text-muted hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-40">
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Card histórico consulta ──────────────────────────────────────────────────

function HistoricoCard({ item }: { item: HistoricoItem }) {
  const [expanded, setExpanded] = useState(false)
  const res = item.resultado as Record<string, string>

  return (
    <div className="bg-card border border-border rounded-xl">
      <button onClick={() => setExpanded(e => !e)} className="flex items-start gap-3 p-4 w-full text-left">
        <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/10 border border-[#a78bfa]/30 flex items-center justify-center flex-shrink-0">
          <History className="w-3.5 h-3.5 text-[#a78bfa]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text-primary">{item.paciente_nome ?? "Consulta sem nome"}</div>
          <div className="text-[11px] text-text-muted mt-0.5">{item.tipo_consulta ?? "Consulta geral"} · {fmtDate(item.created_at)}</div>
        </div>
        {expanded ? <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0 mt-1" /> : <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0 mt-1" />}
      </button>
      {expanded && res.resumo && (
        <div className="px-4 pb-4 space-y-2.5">
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">Resumo</div>
            <p className="text-[12px] text-text-secondary leading-relaxed">{res.resumo}</p>
          </div>
          {res.plano && (
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">Plano</div>
              <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{res.plano}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Modal de criação/edição ──────────────────────────────────────────────────

function EditModal({
  tipo, initial, onSave, onClose,
}: {
  tipo:    Tipo
  initial?: MemoriaItem
  onSave:  (item: MemoriaItem) => void
  onClose: () => void
}) {
  const [titulo,   setTitulo]   = useState(initial?.titulo   ?? "")
  const [conteudo, setConteudo] = useState(initial?.conteudo ?? "")
  const [tags,     setTags]     = useState(initial?.tags?.join(", ") ?? "")
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const aba = ABAS.find(a => a.id === tipo)!

  const save = async () => {
    if (!titulo.trim() || !conteudo.trim()) { setError("Título e conteúdo são obrigatórios."); return }
    setSaving(true)
    const tagsArr = tags.split(",").map(t => t.trim()).filter(Boolean)
    try {
      let res: Response
      if (initial) {
        res = await fetch("/api/memoria", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, titulo, conteudo, tags: tagsArr }),
        })
      } else {
        res = await fetch("/api/memoria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, titulo, conteudo, tags: tagsArr }),
        })
      }
      const data = await res.json() as MemoriaItem
      if (!res.ok) throw new Error((data as unknown as { error: string }).error)
      onSave(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: aba.color + "18", border: `1px solid ${aba.color}40` }}>
              <aba.icon className="w-4 h-4" style={{ color: aba.color }} />
            </div>
            <h3 className="text-[15px] font-semibold text-text-primary">
              {initial ? "Editar" : "Novo"} {aba.label.slice(0, -1)}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Título *</label>
            <input
              value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Protocolo GLP-1 inicial"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Conteúdo *</label>
            <textarea
              value={conteudo} onChange={e => setConteudo(e.target.value)} rows={6}
              placeholder="Conteúdo completo do item..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Tags <span className="normal-case font-normal tracking-normal text-text-muted/60">(separadas por vírgula)</span></label>
            <input
              value={tags} onChange={e => setTags(e.target.value)}
              placeholder="glp-1, emagrecimento, protocolo"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
            />
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-muted text-[13px] hover:border-border-hover transition-all">
              Cancelar
            </button>
            <button
              onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemoriaPage() {
  const [aba,       setAba]      = useState<Tipo>("protocolo")
  const [items,     setItems]    = useState<MemoriaItem[]>([])
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loading,   setLoading]  = useState(true)
  const [search,    setSearch]   = useState("")
  const [modal,     setModal]    = useState<{ open: boolean; item?: MemoriaItem }>({ open: false })

  const fetchData = useCallback(async (tipo: Tipo) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/memoria?tipo=${tipo}`)
      if (!res.ok) throw new Error("API error")
      const data = await res.json()
      if (tipo === "historico") setHistorico(Array.isArray(data) ? data as HistoricoItem[] : [])
      else setItems(Array.isArray(data) ? data as MemoriaItem[] : [])
    } catch (e) { console.error("[memoria] erro ao carregar dados:", e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(aba) }, [aba, fetchData])

  const filtered = items.filter(i =>
    i.titulo.toLowerCase().includes(search.toLowerCase()) ||
    i.conteudo.toLowerCase().includes(search.toLowerCase()) ||
    i.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const handleToggleFav = async (id: string, val: boolean) => {
    await fetch("/api/memoria", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, favorito: val }),
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, favorito: val } : i))
  }

  const handleSave = (saved: MemoriaItem) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [saved, ...prev]
    })
    setModal({ open: false })
  }

  const abaInfo = ABAS.find(a => a.id === aba)!

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Memória Clínica"
        subtitle="PROTOCOLOS · SCRIPTS · CONSULTAS · TEMAS · BASE DE CONHECIMENTO"
        tagline="Guarde protocolos, condutas e anotações clínicas para consultar rapidamente depois."
        actions={
          aba !== "historico" ? (
            <button
              onClick={() => setModal({ open: true })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-background text-[12px] font-bold hover:bg-accent/90 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Novo
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-5">

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex gap-1.5 flex-wrap">
          {ABAS.map(a => (
            <button
              key={a.id}
              onClick={() => { setAba(a.id); setSearch("") }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[12px] font-medium transition-all",
                aba === a.id ? "border-border bg-card shadow-sm" : "border-transparent text-text-muted hover:text-text-secondary",
              )}
            >
              <a.icon className="w-3.5 h-3.5" style={{ color: aba === a.id ? a.color : undefined }} />
              <span className={aba === a.id ? "text-text-primary" : ""}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* ── Section header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: abaInfo.color + "18", border: `1px solid ${abaInfo.color}40` }}>
              <abaInfo.icon className="w-4 h-4" style={{ color: abaInfo.color }} />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-text-primary">{abaInfo.label}</h2>
              <p className="text-[11px] text-text-muted">{abaInfo.desc}</p>
            </div>
          </div>
          {aba !== "historico" && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="bg-background border border-border rounded-lg pl-7 pr-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors w-44"
              />
            </div>
          )}
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        {aba !== "historico" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total",      value: items.length },
              { label: "Favoritos",  value: items.filter(i => i.favorito).length },
              { label: "Com tags",   value: items.filter(i => i.tags?.length).length },
              { label: "Esta semana",value: items.filter(i => new Date(i.criado_em) > new Date(Date.now() - 7 * 86400e3)).length },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-3.5 text-center">
                <div className="text-[22px] font-black text-text-primary">{s.value}</div>
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {aba === "protocolo" && (
          <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/8 text-[11px] text-blue-400">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Protocolos marcados como favoritos <Heart className="w-3 h-3 inline fill-current text-[#d4af37]" /> são injetados automaticamente no Copiloto de Consulta ao gerar a conduta.</span>
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-border" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-border rounded w-48" />
                    <div className="h-3 bg-border rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : aba === "historico" ? (
          <div className="space-y-3">
            {historico.length === 0 ? (
              <div className="text-center py-16 text-text-muted">
                <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-[13px]">Nenhuma consulta registrada ainda.</p>
              </div>
            ) : historico.map(h => <HistoricoCard key={h.id} item={h} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-text-muted">
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-[13px]">
                  {search ? "Nenhum resultado encontrado." : "Nenhum item ainda. Clique em + Novo para começar."}
                </p>
              </div>
            ) : filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onToggleFav={handleToggleFav}
                onEdit={i => setModal({ open: true, item: i })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modal.open && (
        <EditModal
          tipo={aba === "historico" ? "conhecimento" : aba}
          initial={modal.item}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
