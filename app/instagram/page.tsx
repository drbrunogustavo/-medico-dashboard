"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Instagram, RefreshCw, ExternalLink, Heart, MessageCircle,
  Users, Image, Eye, TrendingUp, Zap, Copy, Check,
  AlertCircle, Loader2, Film, LayoutGrid, CheckCircle2,
  ChevronDown, ChevronUp, Key, Wifi, ShieldAlert,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Metrics {
  username:   string
  biography:  string
  website:    string
  followers:  number
  mediaCount: number
  profilePic?: string
  insights:   Record<string, number[]>
}

interface Post {
  id:             string
  caption?:       string
  media_type:     "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  media_url?:     string
  thumbnail_url?: string
  permalink:      string
  timestamp:      string
  like_count:     number
  comments_count: number
}

interface ErrorDetail {
  message:      string
  errorCode?:   number
  errorType?:   string
  tokenExpired?: boolean
  notConnected?: boolean
  debug?:        Record<string, unknown>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString("pt-BR")
}

function sumArr(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0)
}

function avgArr(arr: number[]) {
  return arr.length ? Math.round(sumArr(arr) / arr.length) : 0
}

function mediaTypeLabel(t: Post["media_type"]) {
  if (t === "VIDEO")          return "REELS"
  if (t === "CAROUSEL_ALBUM") return "CARROSSEL"
  return "FOTO"
}

function mediaTypeColor(t: Post["media_type"]) {
  if (t === "VIDEO")          return { bg: "rgba(239,68,68,0.12)",   text: "#f87171", border: "rgba(239,68,68,0.3)" }
  if (t === "CAROUSEL_ALBUM") return { bg: "rgba(59,127,255,0.12)",  text: "#6ba3ff", border: "rgba(59,127,255,0.3)" }
  return                             { bg: "rgba(0,192,127,0.10)",  text: "#00c07f", border: "rgba(0,192,127,0.25)" }
}

function relativeDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (days === 0) return "hoje"
  if (days === 1) return "ontem"
  if (days < 7)   return `${days}d atrás`
  if (days < 30)  return `${Math.floor(days / 7)}sem atrás`
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon:  React.ElementType
  label: string
  value: string
  sub?:  string
  color: string
}) {
  return (
    <div className="rounded-xl p-4 border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon style={{ width: 14, height: 14, color }} />
        </div>
        <span className="text-[10px] font-mono font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      </div>
      <div className="text-[26px] font-bold leading-none" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{sub}</div>
      )}
    </div>
  )
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post, onTransform }: { post: Post; onTransform: (p: Post) => void }) {
  const c = mediaTypeColor(post.media_type)
  const thumb = post.thumbnail_url ?? post.media_url

  return (
    <div className="rounded-xl border overflow-hidden group"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden"
        style={{ background: "var(--surface)" }}>
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image style={{ width: 28, height: 28, color: "var(--text-muted)" }} />
          </div>
        )}
        {/* Media type badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, backdropFilter: "blur(4px)" }}>
            {mediaTypeLabel(post.media_type)}
          </span>
        </div>
        {/* Permalink */}
        <a href={post.permalink} target="_blank" rel="noopener noreferrer"
          className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <ExternalLink style={{ width: 11, height: 11, color: "#fff" }} />
        </a>
      </div>

      {/* Content */}
      <div className="p-3">
        {post.caption && (
          <p className="text-[11px] leading-relaxed mb-2 line-clamp-2"
            style={{ color: "var(--text-secondary)" }}>
            {post.caption}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
              <Heart style={{ width: 11, height: 11 }} /> {fmt(post.like_count)}
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
              <MessageCircle style={{ width: 11, height: 11 }} /> {fmt(post.comments_count)}
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
            {relativeDate(post.timestamp)}
          </span>
        </div>

        <button
          onClick={() => onTransform(post)}
          className="mt-2.5 w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
          style={{ background: "rgba(0,192,127,0.08)", color: "#00c07f", border: "1px solid rgba(0,192,127,0.2)" }}>
          <Zap style={{ width: 11, height: 11 }} />
          Transformar em pauta
        </button>
      </div>
    </div>
  )
}

// ─── InsightBar ───────────────────────────────────────────────────────────────

function InsightBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="text-[11px] font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstagramPage() {
  const [metrics,     setMetrics]     = useState<Metrics | null>(null)
  const [posts,       setPosts]       = useState<Post[]>([])
  const [loading,     setLoading]     = useState(true)
  const [syncing,     setSyncing]     = useState(false)
  const [errorDetail, setErrorDetail] = useState<ErrorDetail | null>(null)
  const [lastSync,    setLastSync]    = useState<Date | null>(null)
  const [toast,       setToast]       = useState<string | null>(null)
  const [showDebug,   setShowDebug]   = useState(false)

  const fetchData = useCallback(async (isSyncing = false) => {
    if (isSyncing) setSyncing(true)
    else setLoading(true)
    setErrorDetail(null)

    try {
      const [mRes, pRes] = await Promise.all([
        fetch("/api/instagram/metrics"),
        fetch("/api/instagram/posts"),
      ])
      const [mData, pData] = await Promise.all([mRes.json(), pRes.json()])

      if (mData.error) {
        setErrorDetail({
          message:      mData.error,
          errorCode:    mData.errorCode,
          errorType:    mData.errorType,
          tokenExpired: mData.tokenExpired ?? false,
          notConnected: mData.notConnected ?? false,
          debug:        mData.debug,
        })
        return
      }

      setMetrics(mData)
      setPosts(pData.posts ?? [])
      setLastSync(new Date())
    } catch {
      setErrorDetail({ message: "Erro de conexão com o servidor. Verifique sua internet.", errorType: "network" })
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleTransform(post: Post) {
    const caption = post.caption?.slice(0, 100) ?? ""
    const tipo    = mediaTypeLabel(post.media_type)
    const titulo  = `[${tipo}] ${caption}` || `Post de ${relativeDate(post.timestamp)}`

    try {
      await fetch("/api/pautas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          titulo,
          descricao: post.caption ?? "",
          categoria: "Instagram",
          prioridade: "media",
          status: "ideia",
          fonte: post.permalink,
        }),
      })
      showToast("Pauta criada com sucesso!")
    } catch {
      showToast("Erro ao criar pauta.")
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Computed insights ──────────────────────────────────────────────────────

  const impressions   = metrics?.insights?.impressions   ?? []
  const reach         = metrics?.insights?.reach         ?? []
  const profileViews  = metrics?.insights?.profile_views ?? []

  const totalImpressions  = sumArr(impressions)
  const totalReach        = sumArr(reach)
  const totalProfileViews = sumArr(profileViews)
  const avgEngRate        = metrics && metrics.followers > 0
    ? ((posts.reduce((s, p) => s + p.like_count + p.comments_count, 0) / posts.length / metrics.followers) * 100).toFixed(2)
    : "0"

  const insightMax = Math.max(totalImpressions, totalReach, totalProfileViews, 1)

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(225,48,108,0.12)", border: "1px solid rgba(225,48,108,0.25)" }}>
            <Instagram style={{ width: 16, height: 16, color: "#e1306c" }} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>Instagram</h1>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>PRAXIS SOCIAL · ANALYTICS</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#e1306c" }} />
        </div>
      </div>
    )
  }

  // ── Error / Not Connected ─────────────────────────────────────────────────

  if (errorDetail) {
    const isExpired   = errorDetail.tokenExpired
    const isNoConfig  = errorDetail.notConnected
    const isNetwork   = errorDetail.errorType === "network"

    const iconEl = isExpired  ? <Key     style={{ width: 28, height: 28, color: "#f59e0b" }} />
                 : isNoConfig ? <ShieldAlert style={{ width: 28, height: 28, color: "#e1306c" }} />
                 : isNetwork  ? <Wifi    style={{ width: 28, height: 28, color: "#3b7fff" }} />
                              : <AlertCircle style={{ width: 28, height: 28, color: "#ef4444" }} />

    const iconBg = isExpired  ? { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }
                 : isNoConfig ? { background: "rgba(225,48,108,0.08)", border: "1px solid rgba(225,48,108,0.2)" }
                 : isNetwork  ? { background: "rgba(59,127,255,0.08)", border: "1px solid rgba(59,127,255,0.2)" }
                              : { background: "rgba(239,68,68,0.08)",  border: "1px solid rgba(239,68,68,0.2)" }

    const title = isExpired  ? "Token do Instagram expirado"
                : isNoConfig ? "Instagram não configurado"
                : isNetwork  ? "Erro de conexão"
                             : "Erro ao acessar Instagram"

    return (
      <div className="p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(225,48,108,0.12)", border: "1px solid rgba(225,48,108,0.25)" }}>
            <Instagram style={{ width: 16, height: 16, color: "#e1306c" }} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>Instagram</h1>
            <p className="text-[11px] font-mono tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
              PRAXIS SOCIAL · ANALYTICS
            </p>
          </div>
        </div>

        {/* Main error card */}
        <div className="rounded-2xl border p-6 max-w-lg"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={iconBg}>
              {iconEl}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>{title}</h2>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {errorDetail.message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold disabled:opacity-50 transition-all hover:opacity-80"
              style={{ background: "rgba(0,192,127,0.10)", border: "1px solid rgba(0,192,127,0.25)", color: "#00c07f" }}>
              <RefreshCw style={{ width: 13, height: 13 }} className={syncing ? "animate-spin" : ""} />
              Tentar novamente
            </button>
            <button
              onClick={() => setShowDebug(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              {showDebug ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
              {showDebug ? "Ocultar detalhes" : "Ver erro detalhado"}
            </button>
          </div>

          {/* Debug panel */}
          {showDebug && (
            <div className="mt-4 rounded-xl p-4 font-mono text-[11px] leading-relaxed overflow-x-auto"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              {errorDetail.errorCode !== undefined && (
                <div><span style={{ color: "#f59e0b" }}>errorCode:</span> {errorDetail.errorCode}</div>
              )}
              {errorDetail.errorType && (
                <div><span style={{ color: "#f59e0b" }}>errorType:</span> {errorDetail.errorType}</div>
              )}
              {errorDetail.debug && Object.entries(errorDetail.debug).map(([k, v]) => (
                <div key={k}><span style={{ color: "#3b7fff" }}>{k}:</span> {String(v)}</div>
              ))}
            </div>
          )}
        </div>

        {/* Contextual instructions */}
        {isExpired && (
          <div className="rounded-xl border p-5 max-w-lg space-y-3"
            style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.2)" }}>
            <p className="text-[12px] font-bold flex items-center gap-2" style={{ color: "#f59e0b" }}>
              <Key style={{ width: 13, height: 13 }} />
              Como renovar o token do Instagram
            </p>
            <ol className="space-y-2">
              {[
                "Acesse developers.facebook.com → seu app → Ferramentas → Graph API Explorer",
                "Gere um novo User Access Token com os escopos: instagram_basic, instagram_manage_insights",
                `Troque pelo token de longa duração chamando a URL abaixo no servidor:`,
                "Cole o novo token em META_ACCESS_TOKEN no Vercel e faça redeploy",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="rounded-lg p-3 text-[10px] font-mono overflow-x-auto"
              style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
              GET https://graph.facebook.com/oauth/access_token<br />
              &nbsp;&nbsp;?grant_type=fb_exchange_token<br />
              &nbsp;&nbsp;&client_id=&#123;META_APP_ID&#125;<br />
              &nbsp;&nbsp;&client_secret=&#123;META_APP_SECRET&#125;<br />
              &nbsp;&nbsp;&fb_exchange_token=&#123;token_curto&#125;
            </div>
          </div>
        )}

        {isNoConfig && (
          <div className="rounded-xl border p-5 max-w-lg space-y-3"
            style={{ background: "rgba(225,48,108,0.04)", borderColor: "rgba(225,48,108,0.15)" }}>
            <p className="text-[12px] font-bold flex items-center gap-2" style={{ color: "#e1306c" }}>
              <ShieldAlert style={{ width: 13, height: 13 }} />
              Como configurar as variáveis de ambiente
            </p>
            <ol className="space-y-2">
              {[
                "No Vercel, vá em Settings → Environment Variables",
                "Adicione META_ACCESS_TOKEN com o User Access Token de longa duração",
                "Adicione META_IG_USER_ID com o ID numérico da sua conta Instagram Business",
                "Para obter o IG User ID: chame /me/accounts no Graph API Explorer e pegue o instagram_business_account.id da sua página",
                "Faça Redeploy para aplicar as variáveis",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: "rgba(225,48,108,0.12)", color: "#e1306c" }}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {!isExpired && !isNoConfig && !isNetwork && (
          <div className="rounded-xl border p-5 max-w-lg"
            style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.15)" }}>
            <p className="text-[12px] font-bold mb-2 flex items-center gap-2" style={{ color: "#ef4444" }}>
              <AlertCircle style={{ width: 13, height: 13 }} />
              Possíveis causas
            </p>
            <ul className="space-y-1.5">
              {[
                "Token expirado — tokens de teste expiram em 60 dias",
                "META_IG_USER_ID incorreto — deve ser o ID da conta Business, não do perfil pessoal",
                "Permissões insuficientes — o app precisa de instagram_basic e instagram_manage_insights",
                "App em modo de desenvolvimento — apenas usuários do app têm acesso",
              ].map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#ef4444" }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // ── Connected ──────────────────────────────────────────────────────────────

  return (
    <div className="p-8 space-y-8 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold shadow-lg"
          style={{ background: "rgba(0,192,127,0.12)", border: "1px solid rgba(0,192,127,0.3)", color: "#00c07f", backdropFilter: "blur(8px)" }}>
          <CheckCircle2 style={{ width: 14, height: 14 }} />
          {toast}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(225,48,108,0.12)", border: "1px solid rgba(225,48,108,0.25)" }}>
            <Instagram style={{ width: 16, height: 16, color: "#e1306c" }} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>Instagram</h1>
            <p className="text-[11px] font-mono tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
              PRAXIS SOCIAL · ANALYTICS
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={syncing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-50 transition-all hover:opacity-80"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <RefreshCw style={{ width: 13, height: 13 }} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizando..." : "Sincronizar agora"}
        </button>
      </div>

      {/* ── SEÇÃO 1: Status ───────────────────────────────────────────────── */}
      <div className="rounded-xl p-4 flex items-center gap-4"
        style={{ background: "rgba(0,192,127,0.06)", border: "1px solid rgba(0,192,127,0.2)" }}>
        {metrics?.profilePic ? (
          <img src={metrics.profilePic} alt={metrics.username}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            style={{ border: "2px solid rgba(225,48,108,0.4)" }} />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(225,48,108,0.12)", border: "2px solid rgba(225,48,108,0.3)" }}>
            <Instagram style={{ width: 20, height: 20, color: "#e1306c" }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>
              @{metrics?.username}
            </span>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,192,127,0.12)", color: "#00c07f", border: "1px solid rgba(0,192,127,0.25)" }}>
              CONECTADO
            </span>
          </div>
          {metrics?.biography && (
            <p className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>{metrics.biography}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {lastSync && (
            <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              Sync {lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {metrics?.website && (
            <a href={metrics.website} target="_blank" rel="noopener noreferrer"
              className="text-[11px] flex items-center gap-1 justify-end mt-1 hover:opacity-80"
              style={{ color: "#00c07f" }}>
              Site <ExternalLink style={{ width: 10, height: 10 }} />
            </a>
          )}
        </div>
      </div>

      {/* ── SEÇÃO 2: Métricas ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-[11px] font-mono font-semibold tracking-[2px] uppercase mb-3"
          style={{ color: "var(--text-muted)" }}>
          Métricas da Conta
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            icon={Users}
            label="Seguidores"
            value={fmt(metrics?.followers ?? 0)}
            sub="total"
            color="#e1306c"
          />
          <MetricCard
            icon={Image}
            label="Posts"
            value={fmt(metrics?.mediaCount ?? 0)}
            sub="publicados"
            color="#3b7fff"
          />
          <MetricCard
            icon={TrendingUp}
            label="Alcance Médio"
            value={fmt(avgArr(reach))}
            sub="por dia (30d)"
            color="#00c07f"
          />
          <MetricCard
            icon={Heart}
            label="Eng. Estimado"
            value={`${avgEngRate}%`}
            sub="likes+comentários/seg"
            color="#d4af37"
          />
        </div>
      </div>

      {/* ── SEÇÃO 3: Top Posts ────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <div>
          <h2 className="text-[11px] font-mono font-semibold tracking-[2px] uppercase mb-3"
            style={{ color: "var(--text-muted)" }}>
            Últimos Posts
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onTransform={handleTransform} />
            ))}
          </div>
        </div>
      )}

      {/* ── SEÇÃO 4: Insights ─────────────────────────────────────────────── */}
      {(totalImpressions > 0 || totalReach > 0 || totalProfileViews > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Insights de alcance */}
          <div className="rounded-xl p-5 border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <h3 className="text-[12px] font-bold mb-4 flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}>
              <Eye style={{ width: 14, height: 14, color: "#3b7fff" }} />
              Insights (últimos 30 dias)
            </h3>
            <div className="space-y-4">
              <InsightBar
                label="Impressões totais"
                value={totalImpressions}
                max={insightMax}
                color="#e1306c"
              />
              <InsightBar
                label="Alcance total"
                value={totalReach}
                max={insightMax}
                color="#3b7fff"
              />
              <InsightBar
                label="Visualizações do perfil"
                value={totalProfileViews}
                max={insightMax}
                color="#00c07f"
              />
            </div>
          </div>

          {/* Resumo numérico */}
          <div className="rounded-xl p-5 border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <h3 className="text-[12px] font-bold mb-4 flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}>
              <TrendingUp style={{ width: 14, height: 14, color: "#00c07f" }} />
              Resumo do Mês
            </h3>
            <div className="space-y-3">
              {[
                { label: "Impressões",       value: fmt(totalImpressions),  color: "#e1306c" },
                { label: "Alcance",          value: fmt(totalReach),        color: "#3b7fff" },
                { label: "Vis. do perfil",   value: fmt(totalProfileViews), color: "#00c07f" },
                { label: "Likes totais",     value: fmt(posts.reduce((s,p)=>s+p.like_count,0)),     color: "#d4af37" },
                { label: "Comentários",      value: fmt(posts.reduce((s,p)=>s+p.comments_count,0)), color: "#a78bfa" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span className="text-[13px] font-bold font-mono" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SEÇÃO 5: Ações rápidas ────────────────────────────────────────── */}
      <div>
        <h2 className="text-[11px] font-mono font-semibold tracking-[2px] uppercase mb-3"
          style={{ color: "var(--text-muted)" }}>
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/diretor-criativo?contexto=instagram&username=${metrics?.username ?? ""}&topPost=${posts[0]?.permalink ?? ""}`}
            className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:opacity-80 group"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)" }}>
              <Zap style={{ width: 16, height: 16, color: "#d4af37" }} />
            </div>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Gerar conteúdo baseado no melhor post
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Diretor Criativo IA com contexto do seu perfil
              </div>
            </div>
            <div className="ml-auto" style={{ color: "var(--text-muted)" }}>→</div>
          </Link>

          <Link
            href="/radar"
            className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:opacity-80 group"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,192,127,0.10)", border: "1px solid rgba(0,192,127,0.2)" }}>
              <TrendingUp style={{ width: 16, height: 16, color: "#00c07f" }} />
            </div>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Radar de Tendências
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Descubra o que está em alta na sua área
              </div>
            </div>
            <div className="ml-auto" style={{ color: "var(--text-muted)" }}>→</div>
          </Link>
        </div>
      </div>

    </div>
  )
}
