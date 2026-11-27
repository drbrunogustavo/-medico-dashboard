"use client"

import { useState, useEffect, useCallback } from "react"
import { Heart, MessageCircle, Plus, ChevronDown, ChevronUp, Send, Pin } from "lucide-react"
import { Panel, PxButton, Segmented, Field, PxInput, PxModal, Tag, PageHeader } from "@/components/px"

// ── Tipos ────────────────────────────────────────────────────────────────────

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

// ── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { key: "todos",        label: "Todos"        },
  { key: "protocolo",    label: "Protocolo"    },
  { key: "caso_clinico", label: "Caso clínico" },
  { key: "experiencia",  label: "Experiência"  },
  { key: "duvida",       label: "Dúvida"       },
  { key: "resultado",    label: "Resultado"    },
]

const CAT_LABELS: Record<string, string> = {
  protocolo:    "Protocolo",
  caso_clinico: "Caso clínico",
  experiencia:  "Experiência",
  duvida:       "Dúvida",
  resultado:    "Resultado",
  geral:        "Geral",
}

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return "agora"
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`
  return `${Math.floor(diff / 86400)} d`
}

function Avatar({ nome }: { nome: string }) {
  const initials = nome.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
  return (
    <div aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-px-ink/[0.07] text-[11px] font-semibold text-px-ink">
      {initials}
    </div>
  )
}

// ── Post ─────────────────────────────────────────────────────────────────────

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const [expanded,        setExpanded]        = useState(false)
  const [showComments,    setShowComments]    = useState(false)
  const [comentarios,     setComentarios]     = useState<Comentario[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError,   setCommentsError]   = useState("")
  const [novoComentario,  setNovoComentario]  = useState("")
  const [sendingComment,  setSendingComment]  = useState(false)
  const [sendError,       setSendError]       = useState("")

  const loadComments = useCallback(async () => {
    if (loadingComments) return
    setLoadingComments(true)
    setCommentsError("")
    try {
      const res = await fetch(`/api/comunidade/comentarios?post_id=${post.id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { comentarios?: Comentario[] }
      setComentarios(data.comentarios ?? [])
    } catch (e) {
      console.error("[comunidade] erro ao carregar comentários:", e)
      setCommentsError("Não foi possível carregar os comentários.")
    } finally { setLoadingComments(false) }
  }, [post.id, loadingComments])

  const toggleComments = () => {
    if (!showComments && comentarios.length === 0) loadComments()
    setShowComments(s => !s)
  }

  const addComment = async () => {
    if (!novoComentario.trim() || sendingComment) return
    setSendingComment(true)
    setSendError("")
    try {
      const res = await fetch("/api/comunidade/comentarios", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, conteudo: novoComentario.trim() }),
      })
      const data = await res.json().catch(() => ({})) as { comentario?: Comentario; error?: string }
      if (!res.ok || !data.comentario) throw new Error(data.error ?? `HTTP ${res.status}`)
      setComentarios(c => [...c, data.comentario!])
      setNovoComentario("")
    } catch (e) {
      console.error("[comunidade] erro ao comentar:", e)
      setSendError("Não foi possível enviar o comentário. Tente novamente.")
    } finally { setSendingComment(false) }
  }

  const conteudoLongo = post.conteudo.length > 240
  const conteudoVis   = conteudoLongo && !expanded ? post.conteudo.slice(0, 240) + "…" : post.conteudo

  return (
    <Panel as="article" className="overflow-hidden p-0">
      <div className="flex items-start gap-3 px-5 pb-2 pt-4">
        <Avatar nome={post.autor_nome} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-px-ink">{post.autor_nome}</span>
            {post.fixado && (
              <Tag tone="ink"><Pin className="mr-1 inline-block h-3 w-3 align-[-0.12em]" aria-hidden="true" />Fixado</Tag>
            )}
            <Tag tone={post.categoria === "resultado" ? "accent" : "neutral"}>{CAT_LABELS[post.categoria] ?? post.categoria}</Tag>
            <span className="ml-auto text-[12px] text-px-muted">{timeAgo(post.created_at)}</span>
          </div>
          <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-px-ink">{post.titulo}</h3>
        </div>
      </div>

      <div className="px-5 pb-3">
        <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink/80">{conteudoVis}</p>
        {conteudoLongo && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded(e => !e)}
            className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-px-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
          >
            {expanded ? <><ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />Ver menos</> : <><ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />Ver mais</>}
          </button>
        )}
      </div>

      <div className="flex items-center gap-5 border-t border-px-ink/10 px-5 py-2.5">
        <button
          type="button"
          aria-pressed={post.meu_like}
          aria-label={`Curtir, ${post.likes} curtidas`}
          onClick={() => onLike(post.id)}
          className={`inline-flex items-center gap-1.5 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 ${post.meu_like ? "font-semibold text-px-ink" : "text-px-muted hover:text-px-ink"}`}
        >
          <Heart className={`h-4 w-4 ${post.meu_like ? "fill-px-ink text-px-ink" : ""}`} aria-hidden="true" />
          {post.likes}
        </button>
        <button
          type="button"
          aria-expanded={showComments}
          onClick={toggleComments}
          className="inline-flex items-center gap-1.5 text-[13px] text-px-muted hover:text-px-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {comentarios.length > 0 ? `${comentarios.length} comentários` : "Comentar"}
        </button>
      </div>

      {showComments && (
        <div className="space-y-3 border-t border-px-ink/10 bg-px-ink/[0.03] px-5 py-4">
          {loadingComments && <p role="status" className="text-[12.5px] text-px-muted">Carregando comentários</p>}
          {commentsError && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-px-card bg-px-danger-soft px-3 py-2 text-[12.5px] text-px-danger">
              <span>{commentsError}</span>
              <PxButton size="sm" variant="secondary" onClick={loadComments}>Tentar de novo</PxButton>
            </div>
          )}
          {comentarios.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar nome={c.autor_nome} />
              <div className="flex-1 rounded-px-card bg-white/70 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-semibold text-px-ink">{c.autor_nome}</span>
                  <span className="text-[12px] text-px-muted">{timeAgo(c.created_at)}</span>
                </div>
                <p className="mt-0.5 text-[13px] text-px-ink/80">{c.conteudo}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <PxInput
              aria-label="Adicionar comentário"
              value={novoComentario}
              onChange={e => setNovoComentario(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment() } }}
              placeholder="Adicionar comentário"
            />
            <PxButton
              aria-label="Enviar comentário"
              onClick={addComment}
              loading={sendingComment}
              disabled={!novoComentario.trim()}
              leftIcon={Send}
            >
              Enviar
            </PxButton>
          </div>
          {sendError && <p role="alert" className="text-[12.5px] text-px-danger">{sendError}</p>}
        </div>
      )}
    </Panel>
  )
}

// ── Novo post ────────────────────────────────────────────────────────────────

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
      const data = await res.json().catch(() => ({})) as { post?: Post; error?: string }
      if (data.error) { setErro(data.error); return }
      if (!res.ok || !data.post) { setErro("Erro ao publicar. Tente novamente."); return }
      onCreated(data.post)
    } catch { setErro("Erro ao publicar. Tente novamente.") }
    finally { setLoading(false) }
  }

  return (
    <PxModal open onClose={onClose} title="Novo post na comunidade" className="max-w-lg">
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-px-ink">Categoria</p>
          <Segmented
            label="Categoria do post"
            value={categoria}
            onChange={setCategoria}
            options={CATEGORIAS.filter(c => c.key !== "todos").map(c => ({ value: c.key, label: c.label }))}
          />
        </div>

        <Field label="Título" htmlFor="post-titulo">
          <PxInput id="post-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Protocolo para disfunção tireoidiana em mulheres" />
        </Field>

        <Field label="Conteúdo" htmlFor="post-conteudo">
          <textarea id="post-conteudo" value={conteudo} onChange={e => setConteudo(e.target.value)} rows={5} placeholder="Compartilhe seu conhecimento, dúvida ou experiência" className={areaCls} />
        </Field>

        {erro && <p role="alert" className="text-[13px] text-px-danger">{erro}</p>}

        <PxButton fullWidth onClick={submit} loading={loading} disabled={!titulo.trim() || !conteudo.trim()} leftIcon={Plus}>
          {loading ? "Publicando" : "Publicar"}
        </PxButton>
      </div>
    </PxModal>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────

export default function ComunidadePage() {
  const [posts,     setPosts]     = useState<Post[]>([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filtro,    setFiltro]    = useState("todos")
  const [showModal, setShowModal] = useState(false)
  const [aviso,     setAviso]     = useState("")

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch("/api/comunidade/posts")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { posts?: Post[] }
      setPosts(data.posts ?? [])
    } catch (e) {
      console.error("[comunidade] erro ao carregar posts:", e)
      setLoadError(true)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  const alternarLike = (postId: string) =>
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, meu_like: !p.meu_like, likes: p.meu_like ? p.likes - 1 : p.likes + 1 } : p
    ))

  const handleLike = async (postId: string) => {
    setAviso("")
    alternarLike(postId)
    try {
      const res = await fetch("/api/comunidade/likes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      console.error("[comunidade] erro ao curtir:", e)
      alternarLike(postId)
      setAviso("Não foi possível registrar a curtida. Tente novamente.")
    }
  }

  const handleCreated = (p: Post) => {
    setPosts(prev => [p, ...prev])
    setShowModal(false)
  }

  const postsFiltrados = filtro === "todos" ? posts : posts.filter(p => p.categoria === filtro)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Comunidade"
        caption="Troca de experiências entre médicos"
        actions={<PxButton onClick={() => setShowModal(true)} leftIcon={Plus}>Novo post</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Segmented
          label="Filtrar por categoria"
          value={filtro}
          onChange={setFiltro}
          options={CATEGORIAS.map(c => ({ value: c.key, label: c.label }))}
        />

        {aviso && <p role="alert" className="max-w-2xl rounded-px-card bg-px-danger-soft px-4 py-2.5 text-[13px] text-px-danger">{aviso}</p>}

        {loading ? (
          <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando posts</p>
        ) : loadError ? (
          <Panel className="max-w-2xl py-10 text-center">
            <p role="alert" className="mb-3 text-[14px] font-semibold text-px-ink">Não foi possível carregar os posts</p>
            <PxButton variant="secondary" onClick={loadPosts}>Tentar de novo</PxButton>
          </Panel>
        ) : postsFiltrados.length === 0 ? (
          <Panel className="max-w-2xl py-10 text-center">
            <p className="text-[14px] font-semibold text-px-ink">Nenhum post nesta categoria</p>
            <p className="mb-4 mt-1 text-[13px] text-px-muted">Seja o primeiro a compartilhar.</p>
            <PxButton onClick={() => setShowModal(true)} leftIcon={Plus}>Novo post</PxButton>
          </Panel>
        ) : (
          <div className="max-w-2xl space-y-3">
            {postsFiltrados.map(post => <PostCard key={post.id} post={post} onLike={handleLike} />)}
          </div>
        )}
      </div>

      {showModal && <NovoPostModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  )
}
