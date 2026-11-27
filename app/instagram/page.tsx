"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { RefreshCw, ExternalLink, Heart, MessageCircle, Zap } from "lucide-react"
import { Panel, PxButton, Tag, PageHeader } from "@/components/px"

interface Metrics { username: string; biography: string; website: string; followers: number; mediaCount: number; profilePic?: string; insights: Record<string, number[]> }
interface Post { id: string; caption?: string; media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"; media_url?: string; thumbnail_url?: string; permalink: string; timestamp: string; like_count: number; comments_count: number }
interface ErrorDetail { message: string; errorCode?: number; errorType?: string; tokenExpired?: boolean; notConnected?: boolean; debug?: Record<string, unknown> }

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " mi"
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".", ",") + " mil"
  return n.toLocaleString("pt-BR")
}
const sumArr = (a: number[]) => a.reduce((x, y) => x + y, 0)
const avgArr = (a: number[]) => (a.length ? Math.round(sumArr(a) / a.length) : 0)
const tipoLabel = (t: Post["media_type"]) => (t === "VIDEO" ? "Reel" : t === "CAROUSEL_ALBUM" ? "Carrossel" : "Foto")

function relativeDate(iso: string) {
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return "hoje"
  if (days === 1) return "ontem"
  if (days < 7) return `há ${days} dias`
  if (days < 30) return `há ${Math.floor(days / 7)} sem.`
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

const TITULOS: Record<string, string> = { token: "Token do Instagram expirado", config: "Instagram não configurado", network: "Erro de conexão", other: "Erro ao acessar o Instagram" }
const PASSOS: Record<string, { titulo: string; itens: string[] }> = {
  token: { titulo: "Como renovar o token", itens: [
    "Acesse developers.facebook.com, abra o app e vá em Ferramentas, Graph API Explorer.",
    "Gere um novo User Access Token com os escopos instagram_basic e instagram_manage_insights.",
    "Troque pelo token de longa duração chamando, no servidor, https://graph.facebook.com/oauth/access_token com grant_type=fb_exchange_token, client_id, client_secret e fb_exchange_token.",
    "Cole o novo valor em META_ACCESS_TOKEN no Vercel e faça redeploy.",
  ] },
  config: { titulo: "Como configurar as variáveis de ambiente", itens: [
    "No Vercel, abra Settings, Environment Variables.",
    "Adicione META_ACCESS_TOKEN com o User Access Token de longa duração.",
    "Adicione META_IG_USER_ID com o ID numérico da conta Instagram Business (chame /me/accounts no Graph API Explorer e use instagram_business_account.id).",
    "Faça redeploy para aplicar as variáveis.",
  ] },
  other: { titulo: "Possíveis causas", itens: [
    "Token expirado: tokens de teste duram 60 dias.",
    "META_IG_USER_ID incorreto: deve ser o ID da conta Business, não do perfil pessoal.",
    "Permissões insuficientes: o app precisa de instagram_basic e instagram_manage_insights.",
    "App em modo de desenvolvimento: só usuários do app têm acesso.",
  ] },
}

function Cabecalho({ acao }: { acao?: React.ReactNode }) {
  return <PageHeader title="Instagram" caption="Desempenho da conta e dos últimos posts" actions={acao} />
}

export default function InstagramPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [postsErro, setPostsErro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [errorDetail, setErrorDetail] = useState<ErrorDetail | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [criando, setCriando] = useState<string | null>(null)

  const fetchData = useCallback(async (isSyncing = false) => {
    if (isSyncing) setSyncing(true); else setLoading(true)
    setErrorDetail(null); setPostsErro(false)
    try {
      const [mRes, pRes] = await Promise.all([fetch("/api/instagram/metrics"), fetch("/api/instagram/posts")])
      const mData = await mRes.json().catch(() => ({ error: "Resposta inválida do servidor." }))
      const pData = pRes.ok ? await pRes.json().catch(() => null) : null
      if (mData.error || !mRes.ok) {
        setErrorDetail({ message: mData.error ?? "Não foi possível ler as métricas.", errorCode: mData.errorCode, errorType: mData.errorType, tokenExpired: mData.tokenExpired ?? false, notConnected: mData.notConnected ?? false, debug: mData.debug })
        return
      }
      setMetrics(mData)
      setPosts(Array.isArray(pData?.posts) ? pData.posts : [])
      setPostsErro(!Array.isArray(pData?.posts))
      setLastSync(new Date())
    } catch {
      setErrorDetail({ message: "Não foi possível falar com o servidor. Verifique a conexão.", errorType: "network" })
    } finally { setLoading(false); setSyncing(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleTransform(post: Post) {
    const base = (post.caption ?? "").replace(/\s+/g, " ").trim().slice(0, 100)
    const titulo = `${tipoLabel(post.media_type)}: ${base || `post de ${relativeDate(post.timestamp)}`}`
    setCriando(post.id); setAviso(null)
    try {
      const r = await fetch("/api/pautas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, categoria: "Instagram", prioridade: "Média", estagio: "Ideia", tags: [], nota: post.caption ?? "", fonte: post.permalink }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setAviso({ ok: true, texto: "Pauta criada no Banco de Pautas." })
    } catch (e) {
      console.error("[instagram] erro ao criar pauta:", e)
      setAviso({ ok: false, texto: "Não foi possível criar a pauta. Tente novamente." })
    } finally { setCriando(null) }
  }

  const impressions = metrics?.insights?.impressions ?? []
  const reach = metrics?.insights?.reach ?? []
  const profileViews = metrics?.insights?.profile_views ?? []
  const totalImp = sumArr(impressions), totalReach = sumArr(reach), totalPv = sumArr(profileViews)
  const totalLikes = posts.reduce((s, p) => s + p.like_count, 0)
  const totalComm = posts.reduce((s, p) => s + p.comments_count, 0)
  const engRate = metrics && metrics.followers > 0 && posts.length > 0 ? (((totalLikes + totalComm) / posts.length / metrics.followers) * 100).toFixed(2).replace(".", ",") : null
  const insightMax = Math.max(totalImp, totalReach, totalPv, 1)

  if (loading) return (<div className="animate-fade-in"><Cabecalho /><p role="status" className="px-4 py-16 text-center text-[14px] text-px-muted md:px-10">Carregando dados do Instagram</p></div>)

  if (errorDetail) {
    const tipo = errorDetail.tokenExpired ? "token" : errorDetail.notConnected ? "config" : errorDetail.errorType === "network" ? "network" : "other"
    const passos = PASSOS[tipo]
    return (
      <div className="animate-fade-in">
        <Cabecalho />
        <div className="max-w-2xl space-y-4 px-4 pb-10 md:px-10">
          <Panel as="section" className="space-y-3">
            <h2 role="alert" className="text-[16px] font-semibold text-px-ink">{TITULOS[tipo]}</h2>
            <p className="text-[13.5px] leading-relaxed text-px-ink/85">{errorDetail.message}</p>
            <div className="flex flex-wrap gap-2">
              <PxButton leftIcon={RefreshCw} loading={syncing} onClick={() => fetchData(true)}>Tentar novamente</PxButton>
              <PxButton variant="secondary" aria-expanded={showDebug} onClick={() => setShowDebug(v => !v)}>{showDebug ? "Ocultar detalhes" : "Ver erro detalhado"}</PxButton>
            </div>
            {showDebug && (
              <div className="overflow-x-auto rounded-px-card bg-px-ink/[0.04] p-3 font-mono text-[12px] leading-relaxed text-px-ink/80">
                {errorDetail.errorCode !== undefined && <div>errorCode: {errorDetail.errorCode}</div>}
                {errorDetail.errorType && <div>errorType: {errorDetail.errorType}</div>}
                {errorDetail.debug && Object.entries(errorDetail.debug).map(([k, v]) => <div key={k}>{k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}</div>)}
                {errorDetail.errorCode === undefined && !errorDetail.errorType && !errorDetail.debug && <div>Sem detalhes adicionais.</div>}
              </div>
            )}
          </Panel>
          {tipo !== "network" && passos && (
            <Panel as="section" className="space-y-2">
              <h3 className="text-[14px] font-semibold text-px-ink">{passos.titulo}</h3>
              <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-px-ink/85">{passos.itens.map((p, i) => <li key={i}>{p}</li>)}</ol>
            </Panel>
          )}
        </div>
      </div>
    )
  }

  const kpis = [
    { label: "Seguidores", value: fmt(metrics?.followers ?? 0), sub: "total da conta" },
    { label: "Publicações", value: fmt(metrics?.mediaCount ?? 0), sub: "no perfil" },
    { label: "Alcance médio", value: reach.length ? fmt(avgArr(reach)) : "Sem dados", sub: "por dia, últimos 30 dias" },
    { label: "Engajamento por post", value: engRate ? `${engRate}%` : "Sem dados", sub: `curtidas e comentários, média dos últimos ${posts.length} posts, sobre seguidores` },
  ]

  return (
    <div className="animate-fade-in">
      <Cabecalho acao={<PxButton variant="secondary" leftIcon={RefreshCw} loading={syncing} onClick={() => fetchData(true)}>{syncing ? "Sincronizando" : "Sincronizar"}</PxButton>} />
      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel as="section" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {metrics?.profilePic
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={metrics.profilePic} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
            : <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-px-ink/[0.08] text-[16px] font-semibold text-px-ink">{(metrics?.username ?? "?").slice(0, 1).toUpperCase()}</span>}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-px-ink">@{metrics?.username}</p>
            {metrics?.biography && <p className="truncate text-[13px] text-px-muted">{metrics.biography}</p>}
          </div>
          <div className="text-[12.5px] text-px-muted sm:text-right">
            {lastSync && <p>Atualizado às {lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>}
            {metrics?.website && <a href={metrics.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-px-accent underline">Site<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>}
          </div>
        </Panel>

        {aviso && <p role={aviso.ok ? "status" : "alert"} className={aviso.ok ? "text-[13px] text-px-ok" : "text-[13px] text-px-danger"}>{aviso.texto}{aviso.ok && <> <Link href="/pautas" className="underline">Ver pautas</Link></>}</p>}

        <section aria-label="Métricas da conta" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map(k => (
            <Panel key={k.label} as="article" className="space-y-1">
              <p className="text-[12.5px] font-medium text-px-muted">{k.label}</p>
              <p className="text-[24px] font-semibold leading-none text-px-ink">{k.value}</p>
              <p className="text-[12px] leading-snug text-px-muted">{k.sub}</p>
            </Panel>
          ))}
        </section>

        <section aria-label="Últimos posts" className="space-y-3">
          <h2 className="text-[15px] font-semibold text-px-ink">Últimos posts</h2>
          {postsErro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">Não foi possível carregar os posts. Use Sincronizar para tentar de novo.</p>}
          {!postsErro && posts.length === 0 && <Panel className="py-10 text-center text-[13px] text-px-muted">Nenhum post retornado pela conta.</Panel>}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {posts.map(post => {
              const thumb = post.thumbnail_url ?? post.media_url
              return (
                <Panel key={post.id} as="article" className="overflow-hidden !p-0">
                  <div className="relative aspect-square bg-px-ink/[0.06]">
                    {thumb
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={thumb} alt="" className="h-full w-full object-cover" />
                      : <span className="flex h-full items-center justify-center text-[12.5px] text-px-muted">Sem imagem</span>}
                    <span className="absolute left-2 top-2"><Tag tone="ink">{tipoLabel(post.media_type)}</Tag></span>
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer" aria-label="Abrir post no Instagram" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-px-ink hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                  <div className="space-y-2 p-3">
                    {post.caption && <p className="line-clamp-2 text-[12.5px] leading-relaxed text-px-ink/80">{post.caption}</p>}
                    <div className="flex items-center justify-between text-[12.5px] text-px-muted">
                      <span className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Curtidas:</span>{fmt(post.like_count)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Comentários:</span>{fmt(post.comments_count)}</span>
                      </span>
                      <span>{relativeDate(post.timestamp)}</span>
                    </div>
                    <PxButton variant="secondary" size="sm" fullWidth leftIcon={Zap} loading={criando === post.id} onClick={() => handleTransform(post)}>Transformar em pauta</PxButton>
                  </div>
                </Panel>
              )
            })}
          </div>
        </section>

        {(totalImp > 0 || totalReach > 0 || totalPv > 0) && (
          <section aria-label="Insights dos últimos 30 dias" className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Panel className="space-y-4">
              <h2 className="text-[15px] font-semibold text-px-ink">Alcance nos últimos 30 dias</h2>
              <ul className="space-y-3.5">
                {[["Impressões", totalImp], ["Alcance", totalReach], ["Visitas ao perfil", totalPv]].map(([rot, v]) => (
                  <li key={rot as string}>
                    <div className="mb-1.5 flex items-baseline justify-between text-[13px] text-px-ink"><span>{rot}</span><span className="font-semibold tabular-nums">{fmt(v as number)}</span></div>
                    <div className="h-2 rounded-full bg-px-ink/10" aria-hidden="true"><div className="h-2 rounded-full bg-px-ink" style={{ width: `${Math.max(3, ((v as number) / insightMax) * 100)}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">Interações nos últimos {posts.length} posts</h2>
              <dl className="space-y-2.5 text-[13.5px]">
                <div className="flex justify-between"><dt className="text-px-muted">Curtidas</dt><dd className="font-semibold tabular-nums text-px-ink">{fmt(totalLikes)}</dd></div>
                <div className="flex justify-between"><dt className="text-px-muted">Comentários</dt><dd className="font-semibold tabular-nums text-px-ink">{fmt(totalComm)}</dd></div>
              </dl>
            </Panel>
          </section>
        )}

        <section aria-label="Próximos passos" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/diretor-criativo" className="rounded-px-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">
            <Panel className="h-full"><p className="text-[14px] font-semibold text-px-ink">Gerar conteúdo com o Diretor Criativo</p><p className="mt-0.5 text-[12.5px] text-px-muted">Abre o Diretor Criativo para planejar o próximo post.</p></Panel>
          </Link>
          <Link href="/radar" className="rounded-px-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">
            <Panel className="h-full"><p className="text-[14px] font-semibold text-px-ink">Radar de Tendências</p><p className="mt-0.5 text-[12.5px] text-px-muted">Veja o que está em alta na sua área.</p></Panel>
          </Link>
        </section>
      </div>
    </div>
  )
}
