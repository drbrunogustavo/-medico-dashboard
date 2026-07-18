"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Heart, MessageCircle, Plus, X, ChevronDown, ChevronUp,
  Loader2, Send, Pin,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
  id:         string
  user_id:    string
  autor_nome: string
  categoria:  string
  titulo:     string
  conteudo:   string
  likes:      number
  fixado:     boolean
  created_at: string
  meu_like:   boolean
}

interface Comentario {
  id:         string
  post_id:    string
  autor_nome: string
  conteudo:   string
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { key: "todos",        label: "Todos"        },
  { key: "protocolo",    label: "Protocolo"    },
  { key: "caso_clinico", label: "Caso Clínico" },
  { key: "experiencia",  label: "Experiência"  },
  { key: "duvida",       label: "Dúvida"       },
  { key: "resultado",    label: "Resultado"    },
]

const CAT_STYLE: Record<string, string> = {
  protocolo:    "bg-blue-500/10 border-blue-500/25 text-blue-400",
  caso_clinico: "bg-violet-500/10 border-violet-500/25 text-violet-400",
  experiencia:  "bg-green-500/10 border-green-500/25 text-green-400",
  duvida:       "bg-amber-500/10 border-amber-500/25 text-amber-400",
  resultado:    "bg-accent-dim border-accent-border text-accent",
  geral:        "bg-surface border-border text-text-muted",
}

const CAT_LABELS: Record<string, string> = {
  protocolo:    "Protocolo",
  caso_clinico: "Caso Clínico",
  experiencia:  "Experiência",
  duvida:       "Dúvida",
  resultado:    "Resultado",
  geral:        "Geral",
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)  return "agora"
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function Avatar({ nome }: { nome: string }) {
  const initials = nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-mono font-bold text-accent">{initials}</span>
    </div>
  )
}

// ── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const [expanded,      setExpanded]      = useState(false)
  const [showComments,  setShowComments]  = useState(false)
  const [comentarios,   setComentarios]   = useState<Comentario[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [novoComentario,  setNovoComentario]  = useState("")
  const [sendingComment,  setSendingComment]  = useState(false)

  const loadComments = useCallback(async () => {
    if (loadingComments) return
    setLoadingComments(true)
    try {
      const res  = await fetch(`/api/comunidade/comentarios?post_id=${post.id}`)
      const data = await res.json() as { comentarios?: Comentario[] }
      setComentarios(data.comentarios ?? [])
    } catch { /* silencioso */ }
    finally { setLoadingComments(false) }
  }, [post.id, loadingComments])

  const toggleComments = () => {
    if (!showComments && comentarios.length === 0) loadComments()
    setShowComments(s => !s)
  }

  const addComment = async () => {
    if (!novoComentario.trim() || sendingComment) return
    setSendingComment(true)
    try {
      const res  = await fetch("/api/comunidade/comentarios", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, conteudo: novoComentario.trim() }),
      })
      const data = await res.json() as { comentario?: Comentario }
      if (data.comentario) {
        setComentarios(c => [...c, data.comentario!])
        setNovoComentario("")
      }
    } catch { /* silencioso */ }
    finally { setSendingComment(false) }
  }

  const conteudoLongo = post.conteudo.length > 240
  const conteudoVis   = conteudoLongo && !expanded ? post.conteudo.slice(0, 240) + "…" : post.conteudo

  return (
    <div className={cn("bg-card border rounded-xl overflow-hidden", post.fixado ? "border-accent-border" : "border-border")}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start gap-3">
        <Avatar nome={post.autor_nome} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-semibold text-text-primary">{post.autor_nome}</span>
            {post.fixado && <Pin className="w-3 h-3 text-accent" />}
            <span className={cn("text-badge font-mono font-semibold px-1.5 py-0.5 rounded-full border", CAT_STYLE[post.categoria] ?? CAT_STYLE.geral)}>
              {CAT_LABELS[post.categoria] ?? post.categoria}
            </span>
            <span className="text-[10px] text-text-muted ml-auto">{timeAgo(post.created_at)}</span>
          </div>
          <p className="text-[13px] font-semibold text-text-primary mt-1">{post.titulo}</p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-3">
        <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{conteudoVis}</p>
        {conteudoLongo && (
          <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 text-[10px] text-accent mt-1.5">
            {expanded ? <><ChevronUp className="w-3 h-3" />Menos</> : <><ChevronDown className="w-3 h-3" />Ver mais</>}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-4 border-t border-border pt-2.5">
        <button
          onClick={() => onLike(post.id)}
          className={cn("flex items-center gap-1.5 text-[11px] transition-colors", post.meu_like ? "text-red-400" : "text-text-muted hover:text-red-400")}
        >
          <Heart className={cn("w-3.5 h-3.5", post.meu_like && "fill-current")} />
          {post.likes}
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {comentarios.length > 0 ? comentarios.length : "Comentar"}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border bg-surface/50 px-4 py-3 space-y-3">
          {loadingComments && (
            <div className="flex items-center gap-2 text-text-muted">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[11px]">Carregando...</span>
            </div>
          )}
          {comentarios.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar nome={c.autor_nome} />
              <div className="flex-1 bg-card border border-border rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-text-primary">{c.autor_nome}</span>
                  <span className="text-[10px] text-text-muted">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">{c.conteudo}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <input
              value={novoComentario}
              onChange={e => setNovoComentario(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment() } }}
              placeholder="Adicionar comentário..."
              className="flex-1 bg-card border border-border rounded-lg px-3 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors"
            />
            <button
              onClick={addComment}
              disabled={!novoComentario.trim() || sendingComment}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-background disabled:opacity-40 flex-shrink-0 hover:bg-accent/90 transition-colors"
            >
              {sendingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── NovoPostModal ─────────────────────────────────────────────────────────────

function NovoPostModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Post) => void }) {
  const [titulo,    setTitulo]    = useState("")
  const [conteudo,  setConteudo]  = useState("")
  const [categoria, setCategoria] = useState("geral")
  const [loading,   setLoading]   = useState(false)
  const [erro,      setErro]      = useState("")

  const submit = async () => {
    if (!titulo.trim() || !conteudo.trim()) { setErro("Preencha título e conteúdo."); return }
    setLoading(true); setErro("")
    try {
      const res  = await fetch("/api/comunidade/posts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, conteudo, categoria }),
      })
      const data = await res.json() as { post?: Post; error?: string }
      if (data.error) { setErro(data.error); return }
      if (data.post) onCreated(data.post)
    } catch { setErro("Erro ao publicar. Tente novamente.") }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <span className="text-[13px] font-semibold text-text-primary">Novo post na comunidade</span>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.filter(c => c.key !== "todos").map(c => (
                <button
                  key={c.key}
                  onClick={() => setCategoria(c.key)}
                  className={cn(
                    "text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all",
                    categoria === c.key
                      ? (CAT_STYLE[c.key] ?? "bg-surface border-border text-text-muted")
                      : "border-border text-text-muted hover:text-text-secondary"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Título *</label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Protocolo para disfunção tireoidiana em mulheres"
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Conteúdo *</label>
            <textarea
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              rows={5}
              placeholder="Compartilhe seu conhecimento, dúvida ou experiência..."
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none resize-none transition-colors leading-relaxed"
            />
          </div>

          {erro && <p className="text-[11px] text-red-400">{erro}</p>}

          <button
            onClick={submit}
            disabled={loading || !titulo.trim() || !conteudo.trim()}
            className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold rounded-xl py-2.5 bg-accent text-background hover:bg-accent/90 disabled:opacity-40 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ComunidadePage() {
  const [posts,       setPosts]       = useState<Post[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filtro,      setFiltro]      = useState("todos")
  const [showModal,   setShowModal]   = useState(false)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/comunidade/posts")
      const data = await res.json() as { posts?: Post[] }
      setPosts(data.posts ?? [])
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, meu_like: !p.meu_like, likes: p.meu_like ? p.likes - 1 : p.likes + 1 }
        : p
    ))
    try {
      await fetch("/api/comunidade/likes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      })
    } catch { /* reverte se falhar */ loadPosts() }
  }

  const handleCreated = (p: Post) => {
    setPosts(prev => [p, ...prev])
    setShowModal(false)
  }

  const postsFiltrados = filtro === "todos" ? posts : posts.filter(p => p.categoria === filtro)

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Comunidade"
        subtitle="MÉDICOS · TROCA DE EXPERIÊNCIAS"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 text-[12px] font-semibold px-3.5 py-1.5 rounded-lg bg-accent text-background hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo post
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-5">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map(c => (
            <button
              key={c.key}
              onClick={() => setFiltro(c.key)}
              className={cn(
                "text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all",
                filtro === c.key
                  ? "bg-accent-dim border-accent-border text-accent font-medium"
                  : "border-border text-text-muted hover:text-text-secondary"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-muted gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[12px]">Carregando posts...</span>
          </div>
        ) : postsFiltrados.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-[13px] text-text-secondary">Nenhum post encontrado.</p>
            <p className="text-[11px] text-text-muted">Seja o primeiro a compartilhar!</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {postsFiltrados.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} />
            ))}
          </div>
        )}
      </div>

      {showModal && <NovoPostModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  )
}
