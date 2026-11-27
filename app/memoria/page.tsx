"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Brain, History, Plus, Trash2, Pencil, Check, Heart,
  Copy, ChevronDown, ChevronRight,
} from "lucide-react"
import { Panel, PxButton, Segmented, Field, PxInput, PxModal, Tag, PageHeader } from "@/components/px"

// ─── Tipos ───────────────────────────────────────────────────────────────────

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

// ─── Constantes ──────────────────────────────────────────────────────────────

const ABAS: { id: Tipo; label: string; novo: string; desc: string }[] = [
  { id: "protocolo",    label: "Protocolos",          novo: "protocolo",            desc: "Protocolos clínicos salvos" },
  { id: "script",       label: "Scripts",             novo: "script",               desc: "Scripts e textos favoritos" },
  { id: "historico",    label: "Histórico",           novo: "item",                 desc: "Consultas recentes" },
  { id: "tema",         label: "Temas de conteúdo",   novo: "tema de conteúdo",     desc: "Temas para redes sociais" },
  { id: "conhecimento", label: "Base de conhecimento", novo: "item de conhecimento", desc: "Conhecimento da clínica" },
]

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
const iconBtn = "flex h-9 w-9 shrink-0 items-center justify-center rounded-px-ctl border border-px-line bg-white/60 text-px-ink hover:bg-white/90 disabled:opacity-40"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      aria-label={ok ? "Copiado" : label}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setOk(true)
          setTimeout(() => setOk(false), 1800)
        }).catch(() => { /* área de transferência indisponível */ })
      }}
      className={iconBtn}
    >
      {ok ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}

// ─── Card de item de memória ─────────────────────────────────────────────────

function ItemCard({
  item, onDelete, onToggleFav, onEdit,
}: {
  item: MemoriaItem
  onDelete: (id: string) => Promise<void>
  onToggleFav: (id: string, val: boolean) => void
  onEdit: (item: MemoriaItem) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
    setConfirmando(false)
  }

  return (
    <Panel as="article" className="p-0">
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          aria-pressed={item.favorito}
          aria-label={item.favorito ? `Remover ${item.titulo} dos favoritos` : `Favoritar ${item.titulo}`}
          onClick={() => onToggleFav(item.id, !item.favorito)}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-px-ink hover:bg-px-ink/10"
        >
          <Heart className={cn("h-4 w-4", item.favorito && "fill-current")} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded(e => !e)}
            className="flex w-full items-center gap-1.5 text-left"
          >
            <span className="truncate text-[14px] font-semibold text-px-ink">{item.titulo}</span>
            {expanded
              ? <ChevronDown className="h-4 w-4 shrink-0 text-px-muted" aria-hidden="true" />
              : <ChevronRight className="h-4 w-4 shrink-0 text-px-muted" aria-hidden="true" />}
          </button>
          {item.tags?.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.tags.map(t => <Tag key={t} tone="accent">{t}</Tag>)}
            </div>
          )}
          {expanded && (
            <div className="mt-3 whitespace-pre-wrap rounded-px-card bg-px-ink/[0.05] p-3.5 text-[13px] leading-relaxed text-px-ink/80">
              {item.conteudo}
            </div>
          )}
          <p className="mt-2 text-[12px] text-px-muted">{fmtDate(item.criado_em)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <CopyBtn text={item.conteudo} label={`Copiar ${item.titulo}`} />
          <button type="button" aria-label={`Editar ${item.titulo}`} onClick={() => onEdit(item)} className={iconBtn}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" aria-label={`Excluir ${item.titulo}`} onClick={() => setConfirmando(true)} disabled={deleting} className={iconBtn}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {confirmando && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-px-ink/10 px-4 py-3">
          <p className="text-[13px] text-px-ink">Excluir este item? Não dá para desfazer.</p>
          <div className="flex gap-2">
            <PxButton size="sm" variant="secondary" onClick={() => setConfirmando(false)} disabled={deleting}>Cancelar</PxButton>
            <PxButton size="sm" variant="danger" onClick={handleDelete} loading={deleting}>Excluir</PxButton>
          </div>
        </div>
      )}
    </Panel>
  )
}

// ─── Card histórico de consulta ──────────────────────────────────────────────

function HistoricoCard({ item }: { item: HistoricoItem }) {
  const [expanded, setExpanded] = useState(false)
  const res = item.resultado as Record<string, string>

  return (
    <Panel as="article" className="p-0">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-px-ink">{item.paciente_nome ?? "Consulta sem nome"}</p>
          <p className="mt-0.5 text-[12.5px] text-px-muted">{item.tipo_consulta ?? "Consulta geral"}, {fmtDate(item.created_at)}</p>
        </div>
        {expanded
          ? <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-px-muted" aria-hidden="true" />
          : <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-px-muted" aria-hidden="true" />}
      </button>
      {expanded && res.resumo && (
        <div className="space-y-2.5 px-4 pb-4">
          <div className="rounded-px-card bg-px-ink/[0.05] p-3.5">
            <p className="mb-1 text-[12px] font-medium text-px-muted">Resumo</p>
            <p className="text-[13px] leading-relaxed text-px-ink/80">{res.resumo}</p>
          </div>
          {res.plano && (
            <div className="rounded-px-card bg-px-ink/[0.05] p-3.5">
              <p className="mb-1 text-[12px] font-medium text-px-muted">Plano</p>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-px-ink/80">{res.plano}</p>
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

// ─── Modal de criação e edição ───────────────────────────────────────────────

function EditModal({
  tipo, initial, onSave, onClose,
}: {
  tipo:     Tipo
  initial?: MemoriaItem
  onSave:   (item: MemoriaItem) => void
  onClose:  () => void
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
    setError(null)
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
      const data = await res.json().catch(() => null) as (MemoriaItem & { error?: string }) | null
      if (!res.ok || !data) throw new Error(data?.error || "Não foi possível salvar. Tente novamente.")
      onSave(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PxModal open onClose={onClose} title={`${initial ? "Editar" : "Novo"} ${aba.novo}`} className="max-w-lg">
      <div className="space-y-3">
        <Field label="Título (obrigatório)" htmlFor="mem-titulo">
          <PxInput id="mem-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Protocolo GLP-1 inicial" />
        </Field>
        <Field label="Conteúdo (obrigatório)" htmlFor="mem-conteudo">
          <textarea
            id="mem-conteudo"
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            rows={6}
            placeholder="Conteúdo completo do item"
            className={areaCls}
          />
        </Field>
        <Field label="Tags" hint="Separadas por vírgula" htmlFor="mem-tags">
          <PxInput id="mem-tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="glp-1, emagrecimento, protocolo" />
        </Field>
        {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>}
        <div className="flex gap-2 pt-1">
          <PxButton variant="secondary" fullWidth onClick={onClose}>Cancelar</PxButton>
          <PxButton fullWidth onClick={save} loading={saving}>{saving ? "Salvando" : "Salvar"}</PxButton>
        </div>
      </div>
    </PxModal>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function MemoriaPage() {
  const [aba,       setAba]       = useState<Tipo>("protocolo")
  const [items,     setItems]     = useState<MemoriaItem[]>([])
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [aviso,     setAviso]     = useState("")
  const [search,    setSearch]    = useState("")
  const [modal,     setModal]     = useState<{ open: boolean; item?: MemoriaItem }>({ open: false })

  const fetchData = useCallback(async (tipo: Tipo) => {
    setLoading(true)
    setLoadError(false)
    try {
      const res  = await fetch(`/api/memoria?tipo=${tipo}`)
      if (!res.ok) throw new Error("API error")
      const data = await res.json()
      if (tipo === "historico") setHistorico(Array.isArray(data) ? data as HistoricoItem[] : [])
      else setItems(Array.isArray(data) ? data as MemoriaItem[] : [])
    } catch (e) {
      console.error("[memoria] erro ao carregar dados:", e)
      setLoadError(true)
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(aba) }, [aba, fetchData])

  const termo = search.toLowerCase()
  const filtered = items.filter(i =>
    i.titulo.toLowerCase().includes(termo) ||
    i.conteudo.toLowerCase().includes(termo) ||
    i.tags?.some(t => t.toLowerCase().includes(termo))
  )

  const handleDelete = async (id: string) => {
    setAviso("")
    try {
      const res = await fetch(`/api/memoria?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("falhou")
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {
      setAviso("Não foi possível excluir o item. Ele continua na lista.")
    }
  }

  const handleToggleFav = async (id: string, val: boolean) => {
    setAviso("")
    try {
      const res = await fetch("/api/memoria", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, favorito: val }),
      })
      if (!res.ok) throw new Error("falhou")
      setItems(prev => prev.map(i => i.id === id ? { ...i, favorito: val } : i))
    } catch {
      setAviso("Não foi possível atualizar o favorito. Tente novamente.")
    }
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
  const semana = items.filter(i => new Date(i.criado_em) > new Date(Date.now() - 7 * 86400e3)).length

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Memória Clínica"
        caption="Protocolos, condutas e anotações para consultar rápido"
        actions={
          aba !== "historico" ? (
            <PxButton size="sm" leftIcon={Plus} onClick={() => setModal({ open: true })}>Novo item</PxButton>
          ) : undefined
        }
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <div className="overflow-x-auto">
          <Segmented
            label="Tipo de memória"
            value={aba}
            onChange={v => { setAba(v); setSearch(""); setAviso("") }}
            options={ABAS.map(a => ({ value: a.id, label: a.label }))}
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-px-ink">{abaInfo.label}</h2>
            <p className="text-[13px] text-px-muted">
              {aba === "historico"
                ? abaInfo.desc
                : `${abaInfo.desc}, ${items.length} ${items.length === 1 ? "item" : "itens"}, ${items.filter(i => i.favorito).length} favoritos, ${semana} nesta semana`}
            </p>
          </div>
          {aba !== "historico" && (
            <PxInput
              type="search"
              aria-label="Buscar na aba atual"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar"
              className="w-full sm:w-56"
            />
          )}
        </div>

        {aba === "protocolo" && (
          <p className="rounded-px-card bg-px-ink/[0.06] px-4 py-3 text-[13px] text-px-ink">
            Os protocolos favoritados entram automaticamente no Copiloto de Consulta quando ele gera a conduta.
          </p>
        )}

        {aviso && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{aviso}</p>}

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Carregando">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-glass h-[76px] animate-pulse rounded-px-panel" />
            ))}
          </div>
        ) : loadError ? (
          <Panel className="py-10 text-center">
            <p className="mb-3 text-[14px] text-px-ink">Não foi possível carregar esta lista.</p>
            <PxButton variant="secondary" onClick={() => fetchData(aba)}>Tentar de novo</PxButton>
          </Panel>
        ) : aba === "historico" ? (
          <div className="space-y-3">
            {historico.length === 0 ? (
              <Panel className="py-12 text-center">
                <History className="mx-auto mb-3 h-8 w-8 text-px-muted" aria-hidden="true" />
                <p className="text-[14px] text-px-ink">Nenhuma consulta registrada ainda.</p>
              </Panel>
            ) : historico.map(h => <HistoricoCard key={h.id} item={h} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Panel className="py-12 text-center">
                <Brain className="mx-auto mb-3 h-8 w-8 text-px-muted" aria-hidden="true" />
                <p className="text-[14px] text-px-ink">
                  {search ? "Nenhum resultado para essa busca." : "Nenhum item ainda. Toque em Novo item para começar."}
                </p>
              </Panel>
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
