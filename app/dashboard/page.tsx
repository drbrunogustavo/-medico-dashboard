"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ErrorState } from "@/components/ErrorState"
import { useAppContext } from "@/components/AppProvider"
import { Panel, Tag, PageHeader, ColumnChart, LineSeries, BarList } from "@/components/px"
import { cn } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

function fmtDate() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
}

function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

interface ExecMetrics {
  leads_total:       number
  leads_semana:      number
  nps_score:         number | null
  consultas_mes:     number
  faturamento_mes:   number
  leads_origem:      { origem: string; count: number }[]
  faturamento_6m:    { mes: string; valor: number }[]
  nps_6m:            { mes: string; nps: number | null }[]
  leads_por_estagio: { estagio: string; count: number }[]
}

interface AcademyProgresso { aula_id: string; status: string }
interface Pauta { id: number | string; titulo: string; categoria: string; estagio?: string }
interface SugestaoIA { titulo: string; descricao: string; href: string; categoria: string }

const CATEGORIA_LABEL: Record<string, string> = { social: "Conteúdo", clinica: "Clínica", ia: "Estratégia" }

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-px-ctl bg-px-ink/10", className)} />
}

function BlockTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-semibold text-px-ink">{children}</h2>
      {aside}
    </div>
  )
}

// ─── Blocos ───────────────────────────────────────────────────────────────────

function Atalho({ href, valor, rotulo, loading }: { href: string; valor: string; rotulo: string; loading: boolean }) {
  return (
    <Link href={href} className="block rounded-px-card bg-white/70 p-4 transition-colors hover:bg-white">
      {loading ? (
        <>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="mt-2 h-4 w-24" />
        </>
      ) : (
        <>
          <div className="text-[30px] font-semibold leading-none tabular-nums text-px-ink">{valor}</div>
          <div className="mt-2 text-[13px] text-px-muted">{rotulo}</div>
        </>
      )}
    </Link>
  )
}

function Alertas({ metrics, loading }: { metrics: ExecMetrics | null; loading: boolean }) {
  if (loading || !metrics) return null
  const itens: { msg: string; href: string; label: string }[] = []
  if (metrics.leads_total > 0 && metrics.consultas_mes === 0)
    itens.push({ msg: "Há leads no CRM e nenhuma consulta registrada neste mês.", href: "/crm", label: "Abrir CRM" })
  if (metrics.nps_score !== null && metrics.nps_score < 7)
    itens.push({ msg: `O NPS está em ${metrics.nps_score}, abaixo do ideal.`, href: "/nps", label: "Ver NPS" })
  if (itens.length === 0) return null
  return (
    <Panel tone="light" aria-label="Pontos de atenção">
      <BlockTitle>Pontos de atenção</BlockTitle>
      <ul className="space-y-3">
        {itens.map((a, i) => (
          <li key={i} className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px] text-px-ink">{a.msg}</span>
            <Link href={a.href} className="text-[13px] font-semibold text-px-accent underline-offset-4 hover:underline">{a.label}</Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Sugestoes({ sugestoes, loading }: { sugestoes: SugestaoIA[]; loading: boolean }) {
  if (!loading && sugestoes.length === 0) return null
  return (
    <Panel tone="light" aria-label="Sugestões">
      <BlockTitle>O que fazer a seguir</BlockTitle>
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
      ) : (
        <ul className="divide-y divide-px-line">
          {sugestoes.map((s, i) => (
            <li key={i}>
              <Link href={s.href} className="flex items-start justify-between gap-4 py-3 hover:opacity-80">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-px-ink">{s.titulo}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-px-muted">{s.descricao}</p>
                </div>
                <Tag tone="neutral">{CATEGORIA_LABEL[s.categoria] ?? "Estratégia"}</Tag>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function AcademyBloco() {
  const [progresso, setProgresso] = useState<AcademyProgresso[]>([])
  useEffect(() => {
    fetch("/api/academy/progresso")
      .then(r => (r.ok ? r.json() : []))
      .then((d: unknown) => { if (Array.isArray(d)) setProgresso(d as AcademyProgresso[]) })
      .catch(e => console.error("[dashboard] erro ao carregar progresso da Academy:", e))
  }, [])
  const concluidas = progresso.filter(p => p.status === "concluida").length
  const total = 38
  const pct = Math.round((concluidas / total) * 100)
  return (
    <Panel tone="light" aria-label="Academy">
      <BlockTitle aside={<Link href="/academy" className="text-[13px] font-semibold text-px-accent underline-offset-4 hover:underline">{concluidas > 0 ? "Continuar" : "Começar"}</Link>}>
        Academy
      </BlockTitle>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-px-muted">{concluidas} de {total} aulas concluídas</span>
        <span className="font-semibold tabular-nums text-px-ink">{pct}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-px-ink/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso na Academy">
        <div className="h-2 rounded-full bg-px-ink" style={{ width: `${pct}%` }} />
      </div>
    </Panel>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [consultasHoje,    setConsultasHoje]    = useState<number | null>(null)
  const [leadsNaoLidos,    setLeadsNaoLidos]    = useState<number | null>(null)
  const [receitaHoje,      setReceitaHoje]      = useState<number | null>(null)
  const [rotinaLoading,    setRotinaLoading]    = useState(true)
  const [greet]                             = useState(greeting)
  const [dateStr]                           = useState(fmtDate)
  const ctx           = useAppContext()
  const perfil        = ctx?.perfil  ?? null
  const perfilLoading = ctx?.loading ?? true
  const router       = useRouter()
  const searchParams = useSearchParams()
  const pagamentoSucesso = searchParams.get("pagamento") === "sucesso"
  const semAcesso        = searchParams.get("sem-acesso") === "1"

  useEffect(() => {
    if (!perfilLoading && perfil !== null && !perfil.onboarding_completo) {
      router.replace("/onboarding")
    }
  }, [perfil, perfilLoading, router])

  const fetchExecMetrics = useCallback(() => {
    setExecLoading(true)
    setExecError(false)
    fetch("/api/executivo")
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<Record<string, unknown>> })
      .then(data => {
        setExecMetrics({
          leads_total:       (data.leads_total       as number)                               ?? 0,
          leads_semana:      (data.leads_semana      as number)                               ?? 0,
          nps_score:         (data.nps_score         as number | null)                        ?? null,
          consultas_mes:     (data.consultas_mes     as number)                               ?? 0,
          faturamento_mes:   (data.faturamento_mes   as number)                               ?? 0,
          leads_origem:      (data.leads_origem      as { origem: string; count: number }[])  ?? [],
          faturamento_6m:    (data.faturamento_6m    as { mes: string; valor: number }[])     ?? [],
          nps_6m:            (data.nps_6m            as { mes: string; nps: number | null }[]) ?? [],
          leads_por_estagio: (data.leads_por_estagio as { estagio: string; count: number }[]) ?? [],
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

    // Rotina de hoje — 3 chamadas paralelas
    const hoje = new Date().toISOString().split("T")[0]
    setRotinaLoading(true)
    Promise.all([
      fetch(`/api/agenda?action=agenda&inicio=${hoje}&fim=${hoje}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/crm/nao-lidos").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/financeiro?inicio=${hoje}&fim=${hoje}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([agendaData, naoLidosData, financeiroData]) => {
      setConsultasHoje(Array.isArray(agendaData) ? agendaData.length : 0)
      setLeadsNaoLidos((naoLidosData as { count?: number } | null)?.count ?? 0)
      const lancamentos = Array.isArray(financeiroData) ? financeiroData as { tipo: string; valor: number | string }[] : []
      const receita = lancamentos
        .filter(l => l.tipo === "receita")
        .reduce((acc, l) => acc + Number(l.valor), 0)
      setReceitaHoje(receita)
    }).catch(() => {
      setConsultasHoje(null)
      setLeadsNaoLidos(null)
      setReceitaHoje(null)
    }).finally(() => setRotinaLoading(false))
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


  const topOrigem = (execMetrics?.leads_origem ?? [])
    .filter(o => o.count > 0)
    .sort((a, b) => b.count - a.count)[0] ?? null

  const isNewUser = !execLoading && execMetrics !== null
    && execMetrics.leads_total     === 0
    && execMetrics.consultas_mes   === 0
    && execMetrics.faturamento_mes === 0

  const fat6m  = execMetrics?.faturamento_6m ?? []
  const varPct = fat6m.length >= 2 && fat6m[fat6m.length - 2].valor > 0
    ? (fat6m[fat6m.length - 1].valor - fat6m[fat6m.length - 2].valor) / fat6m[fat6m.length - 2].valor * 100
    : null

  const nome = perfil?.nome ? perfil.nome.replace(/^Dr\.?\s*/i, "Dr. ") : "Doutor"
  const novos = execMetrics?.leads_semana ?? 0

  return (
    <div className="px px-ambient min-h-screen animate-fade-in">
      <PageHeader title={`${greet}, ${nome}`} caption={dateStr} />

      <div className="space-y-4 px-5 pb-10 pt-4 md:px-10">

        {semAcesso && (
          <Panel tone="strong" role="alert" className="border border-px-danger/30">
            <p className="text-[14px] font-medium text-px-danger">Você não tem permissão para acessar esse módulo.</p>
          </Panel>
        )}
        {pagamentoSucesso && (
          <Panel tone="strong" role="status" className="border border-px-ok/30">
            <p className="text-[14px] font-semibold text-px-ok">Assinatura ativada.</p>
            <p className="mt-0.5 text-[13px] text-px-muted">Seus 7 dias grátis começaram. Todos os módulos estão liberados.</p>
          </Panel>
        )}

        {/* Hoje */}
        <section aria-label="Hoje" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Atalho href="/agenda" loading={rotinaLoading} valor={String(consultasHoje ?? "—")} rotulo={consultasHoje === 1 ? "consulta hoje" : "consultas hoje"} />
          <Atalho href="/crm" loading={rotinaLoading} valor={String(leadsNaoLidos ?? "—")} rotulo={leadsNaoLidos === 1 ? "lead sem leitura" : "leads sem leitura"} />
          <Atalho href="/pacientes" loading={rotinaLoading} valor={String(semRetornoCount ?? "—")} rotulo="pacientes sem retorno há 6 meses" />
          <Atalho href="/financeiro" loading={rotinaLoading} valor={receitaHoje !== null ? fmtBRL(receitaHoje) : "—"} rotulo="receita de hoje" />
        </section>

        {execError ? (
          <ErrorState compact message="Falha ao carregar as métricas. Verifique a conexão e tente de novo." onRetry={fetchExecMetrics} />
        ) : isNewUser ? (
          <Panel tone="light" aria-label="Primeiros passos">
            <BlockTitle>Primeiros passos</BlockTitle>
            <p className="mb-4 max-w-xl text-[14px] text-px-muted">Os números aparecem aqui assim que houver pacientes, leads ou consultas registrados.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { href: "/pacientes", t: "Cadastrar o primeiro paciente", s: "Comece pelo prontuário" },
                { href: "/crm", t: "Adicionar um lead no CRM", s: "Registre quem chegou até você" },
                { href: "/copiloto", t: "Testar o Copiloto", s: "Prontuário SOAP a partir da conversa" },
              ].map(i => (
                <Link key={i.href} href={i.href} className="rounded-px-card bg-white/70 p-4 transition-colors hover:bg-white">
                  <p className="text-[14px] font-semibold text-px-ink">{i.t}</p>
                  <p className="mt-1 text-[13px] text-px-muted">{i.s}</p>
                </Link>
              ))}
            </div>
          </Panel>
        ) : (
          <>
            {/* Resumo do mês */}
            <section aria-label="Resumo" className="grid gap-4 lg:grid-cols-3">
              <Panel tone="dark" className="lg:col-span-1">
                <p className="text-[13px] text-white/80">Faturamento do mês</p>
                {execLoading ? (
                  <Skeleton className="mt-3 h-10 w-40 bg-white/20" />
                ) : (
                  <p className="mt-2 text-[34px] font-semibold leading-none tabular-nums text-white">{fmtBRL(execMetrics?.faturamento_mes ?? 0)}</p>
                )}
                {varPct !== null && !execLoading && (
                  <p className="mt-3 text-[13px] text-white/80">{varPct >= 0 ? "Alta" : "Queda"} de {Math.abs(varPct).toFixed(1).replace(".", ",")}% sobre o mês anterior</p>
                )}
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-4 text-[13px]">
                  <div><dt className="text-white/70">Consultas no mês</dt><dd className="mt-1 text-[20px] font-semibold tabular-nums text-white">{execLoading ? "—" : execMetrics?.consultas_mes ?? 0}</dd></div>
                  <div><dt className="text-white/70">Leads na semana</dt><dd className="mt-1 text-[20px] font-semibold tabular-nums text-white">{execLoading ? "—" : novos}</dd></div>
                </dl>
              </Panel>

              <Panel tone="light" className="lg:col-span-2">
                <BlockTitle aside={<Link href="/financeiro" className="text-[13px] font-semibold text-px-accent underline-offset-4 hover:underline">Financeiro</Link>}>Receita nos últimos 6 meses</BlockTitle>
                {execLoading ? <Skeleton className="h-[190px]" /> : fat6m.length > 0 ? (
                  <ColumnChart label="Receita mensal dos últimos seis meses" data={fat6m.map(d => ({ rotulo: d.mes, valor: d.valor }))} />
                ) : <p className="text-[14px] text-px-muted">Ainda não há receita registrada no período.</p>}
              </Panel>
            </section>

            <section aria-label="Pacientes e leads" className="grid gap-4 lg:grid-cols-3">
              <Panel tone="light">
                <BlockTitle aside={<span className="text-[13px] tabular-nums text-px-muted">{execLoading || execMetrics?.nps_score == null ? "" : `atual ${execMetrics.nps_score}`}</span>}>Satisfação (NPS)</BlockTitle>
                {execLoading ? <Skeleton className="h-[170px]" /> : (execMetrics?.nps_6m ?? []).some(d => d.nps !== null) ? (
                  <LineSeries label="NPS dos últimos seis meses" data={(execMetrics?.nps_6m ?? []).map(d => ({ rotulo: d.mes, valor: d.nps }))} />
                ) : <p className="text-[14px] text-px-muted">Sem respostas de NPS no período.</p>}
              </Panel>

              <Panel tone="light">
                <BlockTitle aside={<Link href="/crm" className="text-[13px] font-semibold text-px-accent underline-offset-4 hover:underline">CRM</Link>}>Leads por estágio</BlockTitle>
                {execLoading ? <Skeleton className="h-[170px]" /> : (execMetrics?.leads_por_estagio ?? []).length > 0 ? (
                  <BarList data={(execMetrics?.leads_por_estagio ?? []).map(d => ({ rotulo: d.estagio, valor: d.count }))} />
                ) : <p className="text-[14px] text-px-muted">Nenhum lead no funil.</p>}
              </Panel>

              <Panel tone="light">
                <BlockTitle>De onde vêm os leads</BlockTitle>
                {execLoading ? <Skeleton className="h-[170px]" /> : topOrigem ? (
                  <BarList data={(execMetrics?.leads_origem ?? []).filter(o => o.count > 0).sort((a, b) => b.count - a.count).slice(0, 5).map(o => ({ rotulo: o.origem, valor: o.count }))} />
                ) : <p className="text-[14px] text-px-muted">Sem origem registrada nos leads.</p>}
              </Panel>
            </section>

            <Alertas metrics={execMetrics} loading={execLoading} />
          </>
        )}

        <Sugestoes sugestoes={sugestoesIA} loading={sugestoesLoad} />

        <div className="grid gap-4 md:grid-cols-2">
          <Panel tone="light" aria-label="Conteúdo">
            <BlockTitle aside={<Link href="/pautas" className="text-[13px] font-semibold text-px-accent underline-offset-4 hover:underline">Banco de pautas</Link>}>Conteúdo</BlockTitle>
            <p className="text-[14px] text-px-ink"><span className="font-semibold tabular-nums">{pautasCount}</span> {pautasCount === 1 ? "pauta salva" : "pautas salvas"}, <span className="font-semibold tabular-nums">{postsCount}</span> {postsCount === 1 ? "publicada" : "publicadas"}.</p>
            {recentPautas.length > 0 && (
              <ul className="mt-3 divide-y divide-px-line text-[13px]">
                {recentPautas.map(p => (
                  <li key={p.id} className="flex items-baseline justify-between gap-3 py-2"><span className="truncate text-px-ink">{p.titulo}</span><span className="shrink-0 text-px-muted">{p.categoria}</span></li>
                ))}
              </ul>
            )}
          </Panel>
          <AcademyBloco />
        </div>

        {lastAccess && <p className="px-1 text-[12px] text-px-muted">Último acesso: {lastAccess}</p>}
      </div>
    </div>
  )
}
