"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ErrorState } from "@/components/ErrorState"
import { TopBar } from "@/components/TopBar"
import {
  ArrowRight, Activity, BarChart,
  Lightbulb, Users, TrendingUp,
  Megaphone, BarChart3, Sparkles, GraduationCap,
  FileText, Stethoscope, Check, Star, AlertTriangle,
  BookOpen, Trophy, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppContext } from "@/components/AppProvider"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

function fmtDate() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  })
}

function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function useCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>()
  useEffect(() => {
    const start = performance.now()
    const tick  = (now: number) => {
      const t    = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(ease * target))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])
  return value
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALA_SECTIONS = [
  {
    id: "social", icon: Megaphone, title: "PRAXIS Social",
    desc: "Atraia mais pacientes com conteúdo estratégico",
    color: "text-accent", bg: "bg-accent-dim", border: "border-accent-border",
    indicatorColor: "#00c07f",
    links: [
      { label: "Posicionamento", href: "/posicionamento" },
      { label: "Reels",          href: "/reels"          },
      { label: "Calendário",     href: "/calendario"     },
      { label: "Radar IA",       href: "/radar"          },
    ],
  },
  {
    id: "consultorio", icon: Stethoscope, title: "PRAXIS Consultório",
    desc: "Converta leads em pacientes fiéis",
    color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25",
    indicatorColor: "#60a5fa",
    links: [
      { label: "CRM",      href: "/crm"      },
      { label: "Copiloto", href: "/copiloto" },
      { label: "Agenda",   href: "/agenda"   },
      { label: "Scripts",  href: "/scripts"  },
    ],
  },
  {
    id: "executivo", icon: BarChart3, title: "PRAXIS Executivo",
    desc: "Gerencie e escale sua clínica",
    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/25",
    indicatorColor: "#c084fc",
    links: [
      { label: "Financeiro",   href: "/financeiro"   },
      { label: "Precificação", href: "/precificacao" },
      { label: "Indicadores",  href: "/indicadores"  },
      { label: "Consultor",    href: "/consultor"    },
    ],
  },
  {
    id: "ia", icon: Sparkles, title: "PRAXIS IA",
    desc: "Inteligência estratégica para crescer mais rápido",
    color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25",
    indicatorColor: "#fbbf24",
    links: [
      { label: "Posicionamento", href: "/posicionamento"    },
      { label: "Dir. Criativo",  href: "/diretor-criativo"  },
      { label: "Agente",         href: "/agente-executivo"  },
      { label: "Nutrição",       href: "/nutricao-pacientes"},
    ],
  },
  {
    id: "academy", icon: GraduationCap, title: "PRAXIS Academy",
    desc: "Aprenda a construir uma clínica de sucesso",
    color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/25",
    indicatorColor: "#f472b6",
    links: [
      { label: "Academy", href: "/academy" },
    ],
  },
]

const ACOES_DIA = [
  { dica: "Conteúdo de estilo de vida e motivação performa bem hoje. Aproveite o domingo.", acao: { label: "Gerar Roteiro", href: "/roteiros" } },
  { dica: "Segunda: planeje toda a semana com o Agente Executivo para não perder engajamento.", acao: { label: "Abrir Agente", href: "/agente" } },
  { dica: "Terça tem excelente alcance para conteúdo científico e educativo na sua especialidade.", acao: { label: "Explorar Radar", href: "/radar" } },
  { dica: "Quarta é ótima para posts de perguntas e enquetes — maximiza interação.", acao: { label: "Mapa de Objeções", href: "/objecoes" } },
  { dica: "Quinta é ideal para carrosséis aprofundados — maior tempo de leitura e salvamentos.", acao: { label: "Diretor Criativo", href: "/imagens" } },
  { dica: "Depoimentos de pacientes transformam sextas em dias de alta conversão.", acao: { label: "Criar Roteiro", href: "/roteiros" } },
  { dica: "Sábado é ótimo para bastidores da clínica — humaniza sua marca médica.", acao: { label: "Ver Referências", href: "/referencias" } },
]

interface ExecMetrics {
  leads_total:     number
  leads_semana:    number
  nps_score:       number | null
  consultas_mes:   number
  faturamento_mes: number
  leads_origem:    { origem: string; count: number }[]
}

interface AcademyProgresso { aula_id: string; status: string }

// ─── IA Alert ────────────────────────────────────────────────────────────────

function AlertaIA({ metrics, loading }: { metrics: ExecMetrics | null; loading: boolean }) {
  if (loading) return null

  const alertas: { msg: string; href: string; label: string }[] = []

  if (metrics) {
    if (metrics.leads_total > 0 && metrics.consultas_mes === 0)
      alertas.push({ msg: "Você tem leads no CRM sem consultas este mês.", href: "/crm", label: "Ver CRM" })
    if (metrics.nps_score !== null && metrics.nps_score < 7)
      alertas.push({ msg: `NPS em ${metrics.nps_score} — abaixo do ideal. Considere uma campanha de reengajamento.`, href: "/nps", label: "Ver NPS" })
  }
  const diasSemConteudo = 3
  if (diasSemConteudo >= 3)
    alertas.push({ msg: `${diasSemConteudo} dias sem publicar conteúdo. Sua presença digital pode estar caindo.`, href: "/calendario", label: "Calendário" })

  if (alertas.length === 0) return null

  return (
    <div className="rounded-xl border px-5 py-4 space-y-3"
      style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.22)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
        <span className="text-[11px] font-mono font-semibold tracking-widest uppercase" style={{ color: "#f59e0b" }}>
          Alerta PRAXIS IA
        </span>
      </div>
      {alertas.map((a, i) => (
        <div key={i} className="flex items-start gap-3">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{a.msg}</p>
          </div>
          <Link href={a.href}
            className="text-[11px] font-semibold flex-shrink-0 hover:underline"
            style={{ color: "#f59e0b" }}>
            {a.label} →
          </Link>
        </div>
      ))}
    </div>
  )
}

// ─── Academy progress mini card ───────────────────────────────────────────────

function AcademyMiniCard() {
  const [progresso, setProgresso] = useState<AcademyProgresso[]>([])

  useEffect(() => {
    fetch("/api/academy/progresso")
      .then(r => r.ok ? r.json() : [])
      .then((d: unknown) => { if (Array.isArray(d)) setProgresso(d as AcademyProgresso[]) })
      .catch(e => console.error("[dashboard] erro ao carregar progresso da Academy:", e))
  }, [])

  const concluidas = progresso.filter(p => p.status === "concluida").length
  const total = 38
  const pct = Math.round((concluidas / total) * 100)

  return (
    <Link href="/academy"
      className="flex items-center gap-4 px-5 py-4 rounded-xl border transition-all hover:-translate-y-0.5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(244,114,182,0.1)", border: "1px solid rgba(244,114,182,0.25)" }}>
        <GraduationCap className="w-5 h-5" style={{ color: "#f472b6" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>PRAXIS Academy</p>
          <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
            {concluidas}/{total} aulas
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: "#f472b6" }} />
        </div>
        <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
          {pct}% concluído
          {concluidas > 0 && <span className="ml-2 text-pink-400">· Continue de onde parou →</span>}
        </p>
      </div>
      {concluidas >= 10 && (
        <Trophy className="w-4 h-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
      )}
    </Link>
  )
}

interface Pauta { id: number | string; titulo: string; categoria: string; estagio?: string }

interface SugestaoIA { titulo: string; descricao: string; href: string; categoria: string }

// ─── Sugestões IA card ────────────────────────────────────────────────────────

const CATEGORIA_STYLE: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  social:  { color: "#00c07f", bg: "rgba(0,192,127,0.07)",    border: "rgba(0,192,127,0.22)",  dot: "#00c07f" },
  clinica: { color: "#60a5fa", bg: "rgba(96,165,250,0.07)",   border: "rgba(96,165,250,0.22)", dot: "#60a5fa" },
  ia:      { color: "#f59e0b", bg: "rgba(245,158,11,0.07)",   border: "rgba(245,158,11,0.22)", dot: "#f59e0b" },
}

function SugestoesIA({ sugestoes, loading }: { sugestoes: SugestaoIA[]; loading: boolean }) {
  if (!loading && sugestoes.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Sparkles className="w-3 h-3 text-accent" />
        <span className="text-[9px] font-mono text-text-muted tracking-[3px] uppercase">Sugestões PRAXIS IA</span>
        <div className="h-px flex-1 bg-border" />
        {loading && <Loader2 className="w-3 h-3 text-text-muted animate-spin" />}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1].map(i => (
            <div key={i} className="h-[72px] rounded-xl border border-border bg-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sugestoes.map((s, i) => {
            const st = CATEGORIA_STYLE[s.categoria] ?? CATEGORIA_STYLE.ia
            return (
              <Link key={i} href={s.href}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all hover:-translate-y-0.5 group"
                style={{ background: st.bg, borderColor: st.border }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold leading-snug mb-0.5 truncate" style={{ color: st.color }}>
                    {s.titulo}
                  </p>
                  <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">{s.descricao}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: st.color }} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, topColor = "#00c07f", loading = false }: {
  label: string; value: string | number; sub: string; topColor?: string; loading?: boolean
}) {
  const numericTarget = typeof value === "number" ? value : 0
  const animated      = useCounter(numericTarget)
  const display       = typeof value === "number" ? animated : value

  return (
    <div
      className="bg-surface border border-border rounded-xl p-4 md:p-5 transition-all hover:-translate-y-0.5 hover:border-border-hover overflow-hidden relative"
      style={{ borderTop: `3px solid ${topColor}` }}
    >
      {loading ? (
        <div className="space-y-2">
          <div className="h-10 w-20 bg-border/40 rounded animate-pulse" />
          <div className="h-3 w-20 bg-border/30 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <div className="text-[36px] md:text-[40px] font-bold leading-none mb-1.5 tabular-nums" style={{ color: topColor }}>
            {display}
          </div>
          <div className="text-[11px] font-semibold text-text-primary mb-0.5">{label}</div>
          <div className="text-[10px] text-text-muted">{sub}</div>
        </>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [pautasCount,    setPautasCount]    = useState<number>(0)
  const [postsCount,     setPostsCount]     = useState<number>(0)
  const [recentPautas,   setRecentPautas]   = useState<Pauta[]>([])
  const [lastAccess,     setLastAccess]     = useState<string | null>(null)
  const [execMetrics,    setExecMetrics]    = useState<ExecMetrics | null>(null)
  const [execLoading,    setExecLoading]    = useState(true)
  const [execError,      setExecError]      = useState(false)
  const [sugestoesIA,      setSugestoesIA]      = useState<SugestaoIA[]>([])
  const [sugestoesLoad,    setSugestoesLoad]    = useState(true)
  const [semRetornoCount,  setSemRetornoCount]  = useState<number | null>(null)
  const [greet]                             = useState(greeting)
  const [dateStr]                           = useState(fmtDate)
  const ctx           = useAppContext()
  const perfil        = ctx?.perfil  ?? null
  const perfilLoading = ctx?.loading ?? true
  const router       = useRouter()
  const searchParams = useSearchParams()
  const pagamentoSucesso = searchParams.get("pagamento") === "sucesso"

  useEffect(() => {
    if (!perfilLoading && perfil !== null && !perfil.onboarding_completo) {
      router.replace("/onboarding")
    }
  }, [perfil, perfilLoading, router])

  const dica = ACOES_DIA[new Date().getDay()]

  const fetchExecMetrics = useCallback(() => {
    setExecLoading(true)
    setExecError(false)
    fetch("/api/executivo")
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<Record<string, unknown>> })
      .then(data => {
        setExecMetrics({
          leads_total:     (data.leads_total     as number)              ?? 0,
          leads_semana:    (data.leads_semana    as number)              ?? 0,
          nps_score:       (data.nps_score       as number | null)       ?? null,
          consultas_mes:   (data.consultas_mes   as number)              ?? 0,
          faturamento_mes: (data.faturamento_mes as number)              ?? 0,
          leads_origem:    (data.leads_origem    as { origem: string; count: number }[]) ?? [],
        })
      })
      .catch(() => setExecError(true))
      .finally(() => setExecLoading(false))
  }, [])

  useEffect(() => {
    const prev = localStorage.getItem("praxis_last_access")
    if (prev) setLastAccess(prev)
    localStorage.setItem("praxis_last_access", new Date().toLocaleString("pt-BR"))

    // Fetch pautas
    fetch("/api/pautas")
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          const pautas = data as Pauta[]
          setPautasCount(pautas.length)
          setPostsCount(pautas.filter(p => p.estagio === "Publicado").length)
          setRecentPautas(pautas.slice(-3).reverse())
        }
      })
      .catch(e => console.error("[dashboard] erro ao carregar pautas recentes:", e))

    fetchExecMetrics()

    // Sem retorno — fire-and-forget, secondary info
    fetch("/api/pacientes/sem-retorno-count")
      .then(r => r.ok ? r.json() : null)
      .then((d: unknown) => {
        if (d && typeof d === "object" && "count" in d)
          setSemRetornoCount((d as { count: number }).count)
      })
      .catch(() => {})
  }, [fetchExecMetrics])

  useEffect(() => {
    if (execLoading || perfilLoading) return
    fetch("/api/dashboard/sugestoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        especialidade: perfil?.especialidade ?? "",
        pautas: recentPautas.map(p => p.titulo),
        metrics: {
          leads:     execMetrics?.leads_total   ?? 0,
          consultas: execMetrics?.consultas_mes ?? 0,
          nps:       execMetrics?.nps_score     ?? null,
          posts:     postsCount,
        },
      }),
    })
      .then(r => r.ok ? r.json() : { sugestoes: [] })
      .then((d: { sugestoes?: SugestaoIA[] }) => setSugestoesIA(d.sugestoes ?? []))
      .catch(() => setSugestoesIA([]))
      .finally(() => setSugestoesLoad(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execLoading, perfilLoading])

  const npsDisplay = execMetrics?.nps_score !== null && execMetrics?.nps_score !== undefined
    ? execMetrics.nps_score
    : "—"

  const topOrigem = (execMetrics?.leads_origem ?? [])
    .filter(o => o.count > 0)
    .sort((a, b) => b.count - a.count)[0] ?? null

  const activityFeed = [
    ...(recentPautas.map(p => ({
      icon: FileText, color: "text-accent",
      text: `Pauta adicionada: ${p.titulo}`,
      sub: p.categoria,
    }))),
    ...(lastAccess ? [{
      icon: Activity, color: "text-text-muted",
      text: "Última sessão registrada",
      sub: lastAccess,
    }] : []),
    {
      icon: Check, color: "text-blue-400",
      text: "PRAXIS ativado e funcionando",
      sub: "Todos os módulos online",
    },
  ].slice(0, 5)

  return (
    <div className="animate-fade-in">
      <TopBar title="Command Center" subtitle="PRAXIS · DASHBOARD PRINCIPAL" />

      <div className="p-4 md:p-8 space-y-6">

        {/* ── Resumo narrativo ─────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl px-6 py-5">
          <p className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-2">{dateStr}</p>
          {(execLoading || perfilLoading) ? (
            <div className="space-y-2 py-1">
              <div className="h-6 w-52 rounded bg-border/40 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-border/30 animate-pulse mt-3" />
              <div className="h-4 w-2/3 rounded bg-border/30 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-border/30 animate-pulse" />
            </div>
          ) : (
            <>
              <h2
                className="text-[22px] md:text-[26px] font-semibold text-text-primary mb-4 leading-tight"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {greet}, {perfil?.nome ? perfil.nome.replace(/^Dr\.?\s*/i, "Dr. ") : "Doutor"}.
              </h2>
              <div className="space-y-2">
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  {execMetrics && execMetrics.leads_semana > 0 ? (
                    <>↑ <span className="text-text-primary font-medium">{execMetrics.leads_semana} novo{execMetrics.leads_semana !== 1 ? "s leads entraram" : " lead entrou"}</span> no CRM esta semana.</>
                  ) : (
                    <span className="text-text-muted">Nenhum lead novo esta semana ainda.</span>
                  )}
                </p>
                {execMetrics && execMetrics.faturamento_mes > 0 && (
                  <p className="text-[14px] text-text-secondary leading-relaxed">
                    💰 Você faturou <span className="text-text-primary font-medium">{fmtBRL(execMetrics.faturamento_mes)}</span> em consultas este mês.
                  </p>
                )}
                {topOrigem && (
                  <p className="text-[14px] text-text-secondary leading-relaxed">
                    📸 <span className="text-text-primary font-medium">{topOrigem.origem}</span> trouxe{" "}
                    <span className="text-text-primary font-medium">{topOrigem.count} lead{topOrigem.count !== 1 ? "s" : ""}</span> no total.
                  </p>
                )}
                {semRetornoCount !== null && semRetornoCount > 0 && (
                  <p className="text-[14px] text-text-secondary leading-relaxed">
                    ⚠{" "}
                    <Link href="/pacientes" className="text-text-primary font-medium hover:text-amber-400 transition-colors">
                      {semRetornoCount} paciente{semRetornoCount !== 1 ? "s" : ""}
                    </Link>{" "}
                    {semRetornoCount !== 1 ? "estão" : "está"} sem retorno há mais de 6 meses.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── KPIs em destaque ─────────────────────────────────────────────── */}
        {execError ? (
          <ErrorState
            compact
            message="Falha ao carregar métricas. Verifique sua conexão e tente novamente."
            onRetry={fetchExecMetrics}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <MetricCard
              label="Leads no CRM"     value={execMetrics?.leads_total ?? 0}
              sub="total captados"     topColor="#00c07f" loading={execLoading}
            />
            <MetricCard
              label="Consultas/mês"    value={execMetrics?.consultas_mes ?? 0}
              sub="mês atual"          topColor="#3b7fff" loading={execLoading}
            />
            <MetricCard
              label="NPS Score"        value={npsDisplay}
              sub="satisfação"         topColor="#c084fc" loading={execLoading}
            />
            <MetricCard
              label="Banco de Pautas"  value={pautasCount}
              sub="ideias salvas"      topColor="#f59e0b"
            />
            <MetricCard
              label="Posts publicados" value={postsCount}
              sub="conteúdos no ar"    topColor="#f472b6"
            />
          </div>
        )}

        {/* ── Sugestões PRAXIS IA ─────────────────────────────────────────── */}
        <SugestoesIA sugestoes={sugestoesIA} loading={sugestoesLoad} />

        {/* ── Banner depoimento ───────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 rounded-xl border"
          style={{ background: "rgba(184,151,106,0.06)", borderColor: "rgba(184,151,106,0.2)" }}>
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">⭐</span>
            <div>
              <p className="text-[13px] font-semibold text-text-primary">Gostou do PRAXIS?</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Deixe seu depoimento e ajude outros médicos a conhecer a plataforma.
              </p>
            </div>
          </div>
          <a href="/depoimento"
            className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: "rgba(184,151,106,0.14)", color: "#b8976a", border: "1px solid rgba(184,151,106,0.3)", whiteSpace: "nowrap" }}>
            Compartilhar →
          </a>
        </div>

        {/* ── Pagamento sucesso banner ────────────────────────────────────── */}
        {pagamentoSucesso && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl border"
            style={{ background: "rgba(0,192,127,0.06)", borderColor: "rgba(0,192,127,0.25)" }}>
            <Star className="w-4 h-4 text-accent flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-accent">Assinatura ativada com sucesso!</p>
              <p className="text-[11px] text-text-muted">Seus 7 dias grátis começaram. Explore todos os módulos.</p>
            </div>
          </div>
        )}

        {/* ── Status bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-3">
            {perfil?.especialidade && (
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{perfil.especialidade}</span>
            )}
            {perfil?.especialidade && <span className="text-border text-[11px]">·</span>}
            <span className="text-[12px] text-text-secondary">
              <span className="text-text-primary font-medium">{pautasCount}</span>{" "}
              pauta{pautasCount !== 1 ? "s" : ""} salvas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" />
            <span className="text-[10px] font-mono text-accent tracking-widest">PRAXIS ONLINE</span>
          </div>
        </div>

        {/* ── Alerta IA ───────────────────────────────────────────────────── */}
        <AlertaIA metrics={execMetrics} loading={execLoading} />

        {/* ── SEÇÃO 2: Ação recomendada ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
              <Lightbulb className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="text-[12px] font-semibold text-text-primary">Ação Recomendada Hoje</span>
              <span className="ml-auto text-[9px] font-mono text-text-muted uppercase tracking-wider">
                {["DOM","SEG","TER","QUA","QUI","SEX","SÁB"][new Date().getDay()]}
              </span>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-[13px] text-text-secondary leading-relaxed">{dica.dica}</p>
              <Link href={dica.acao.href}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-semibold hover:bg-accent/15 transition-all min-h-[44px]">
                {dica.acao.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ── SEÇÃO 4: Atividade recente ─────────────────────────────────── */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-[12px] font-semibold text-text-primary">Atividade Recente</span>
              </div>
              <Link href="/pautas" className="text-[10px] font-mono text-text-muted hover:text-accent transition-colors">
                Ver pautas →
              </Link>
            </div>
            <div className="divide-y divide-border">
              {activityFeed.length > 0 ? (
                activityFeed.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-3">
                      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0 mt-0.5", item.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-text-secondary truncate">{item.text}</p>
                        <p className="text-[10px] text-text-muted truncate">{item.sub}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Activity className="w-6 h-6 text-text-muted/30" />
                  <p className="text-[11px] text-text-muted">Nenhuma atividade ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 3: 5 Alas ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-mono text-text-muted tracking-[3px] uppercase">Módulos da Plataforma</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {ALA_SECTIONS.map(ala => {
              const AlaIcon = ala.icon
              return (
                <div key={ala.id}
                  className={cn(
                    "bg-surface border rounded-xl p-4 transition-all hover:-translate-y-0.5 group",
                    ala.border,
                  )}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0", ala.bg, ala.border)}>
                      <AlaIcon className={cn("w-4 h-4", ala.color)} />
                    </div>
                    <h3 className={cn("text-[11px] font-bold truncate", ala.color)}>{ala.title}</h3>
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed mb-3">{ala.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {ala.links.map(link => (
                      <Link key={link.href} href={link.href}
                        className={cn(
                          "text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors hover:opacity-80",
                          ala.bg, ala.border, ala.color,
                        )}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Link href={ala.links[0].href}>
                      <ArrowRight className={cn("w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5", ala.color)} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Academy progress ────────────────────────────────────────────── */}
        <AcademyMiniCard />

        {/* ── Última sessão ───────────────────────────────────────────────── */}
        {lastAccess && (
          <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-lg">
            <Activity className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <p className="text-[11px] text-text-muted">
              Última sessão: <span className="text-text-secondary">{lastAccess}</span>
            </p>
            <div className="ml-auto flex items-center gap-1.5">
              <BarChart className="w-3 h-3 text-text-muted" />
              <Link href="/concorrentes" className="text-[10px] text-text-muted hover:text-accent transition-colors font-mono">
                Análise de Concorrentes →
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
