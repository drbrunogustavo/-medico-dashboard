"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { TopBar } from "@/components/TopBar"
import { SkeletonCard } from "@/components/LoadingPulse"
import { EmptyState }   from "@/components/EmptyState"
import { ErrorState }   from "@/components/ErrorState"
import {
  Clock, FlaskConical, TrendingUp, TrendingDown,
  Minus, Calendar, ChevronRight, RefreshCw,
  Users, CircleDollarSign, Plug,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

interface PacItem {
  id:              string
  nome:            string
  ultima_consulta: string | null
  dias:            number
}

interface ExamItem {
  id:              string | null
  nome:            string
  ultima_consulta: string
  exames:          string[]
}

interface AgendaAppt {
  hora:   string
  nome:   string
  proc:   string
  status: string
}

interface RadarData {
  sem_retorno: {
    critico: PacItem[]
    atencao: PacItem[]
  }
  exames_pendentes:  ExamItem[]
  financeiro: {
    receita_mes: number
    receita_ant: number
    dias_dec:    number
    dias_tot:    number
    estimativa:  number | null
  }
  agenda:            { total: number; appts: AgendaAppt[] } | null
  total_pacientes:   number
  total_lancamentos: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL",
    minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtData(iso: string | null) {
  if (!iso) return "nunca"
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

function diasLabel(dias: number, ultima: string | null): string {
  if (ultima === null) return "Sem consulta registrada"
  if (dias === 9999)   return "Sem consulta registrada"
  return `${dias} dias sem retorno`
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="text-[9px] font-mono font-semibold tracking-[2px] uppercase text-text-muted">
      {text}
    </div>
  )
}

type ChipColor = "red" | "amber" | "blue" | "green" | "purple" | "muted"
const CHIP_STYLE: Record<ChipColor, string> = {
  red:    "bg-red-500/10 border-red-500/25 text-red-400",
  amber:  "bg-amber-500/10 border-amber-500/25 text-amber-400",
  blue:   "bg-blue-500/10 border-blue-500/25 text-blue-400",
  green:  "bg-accent-dim border-accent-border text-accent",
  purple: "bg-purple-500/10 border-purple-500/25 text-purple-400",
  muted:  "bg-card border-border text-text-muted",
}

function Chip({ label, color, icon }: { label: string; color: ChipColor; icon?: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium", CHIP_STYLE[color])}>
      {icon}
      {label}
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-4 py-5 text-center text-[12px] text-text-muted">{text}</div>
}

function CardHeader({ icon, label, action }: {
  icon:    React.ReactNode
  label:   string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12px] font-semibold text-text-primary">{label}</span>
      </div>
      {action}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RadarClinicaPage() {
  const [data,    setData]    = useState<RadarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro,    setErro]    = useState<string | null>(null)

  function carregar() {
    setLoading(true)
    setErro(null)
    fetch("/api/radar-clinica")
      .then(r => r.ok ? r.json() as Promise<RadarData> : Promise.reject(r.status))
      .then(d => setData(d))
      .catch(() => setErro("Falha ao carregar dados do radar. Tente atualizar."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar() }, [])

  const semRetornoTotal = (data?.sem_retorno.critico.length ?? 0) + (data?.sem_retorno.atencao.length ?? 0)
  const examesTotal     = data?.exames_pendentes.length ?? 0
  const fin             = data?.financeiro

  const varPct = fin && fin.receita_ant > 0
    ? Math.round(((fin.receita_mes - fin.receita_ant) / fin.receita_ant) * 100)
    : null

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Radar da Clínica"
        subtitle="OPERACIONAL · PRAXIS"
        tagline="Visão consolidada de atenção clínica, financeiro e agenda do dia."
        actions={
          <button
            onClick={carregar}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[12px] text-text-muted hover:text-text-primary hover:border-border-hover transition-all disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Atualizar
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-6">

        {/* Loading — 4 skeleton cards no layout real */}
        {loading && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && !loading && (
          <ErrorState message={erro} onRetry={carregar} />
        )}

        {data && !loading && (
          <>

            {/* ── Chips de resumo ── */}
            <div className="flex flex-wrap gap-3">
              <Chip
                label={semRetornoTotal === 0
                  ? "Todos com retorno recente"
                  : `${semRetornoTotal} sem retorno`}
                color={semRetornoTotal > 0 ? "red" : "muted"}
                icon={<Clock className="w-3 h-3" />}
              />
              <Chip
                label={examesTotal === 0
                  ? "Nenhum exame pendente"
                  : `${examesTotal} exame${examesTotal !== 1 ? "s" : ""} pendente${examesTotal !== 1 ? "s" : ""}`}
                color={examesTotal > 0 ? "blue" : "muted"}
                icon={<FlaskConical className="w-3 h-3" />}
              />
              <Chip
                label={fmtBRL(fin?.receita_mes ?? 0) + " no mês"}
                color="green"
                icon={<TrendingUp className="w-3 h-3" />}
              />
              {data.agenda !== null && (
                <Chip
                  label={`${data.agenda.total} consulta${data.agenda.total !== 1 ? "s" : ""} hoje`}
                  color="purple"
                  icon={<Calendar className="w-3 h-3" />}
                />
              )}
            </div>

            {/* ── Grid principal ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

              {/* ── Coluna esquerda: Atenção ── */}
              <div className="space-y-4">
                <SectionLabel text="ATENÇÃO NECESSÁRIA" />

                {/* Sem retorno */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <CardHeader
                    icon={<Clock className="w-3.5 h-3.5 text-red-400" />}
                    label="Sem retorno"
                    action={
                      <Link
                        href="/pacientes"
                        className="flex items-center gap-0.5 text-[10px] text-text-muted hover:text-accent transition-colors"
                      >
                        Ver pacientes <ChevronRight className="w-3 h-3" />
                      </Link>
                    }
                  />
                  <div className="divide-y divide-border/40">
                    {semRetornoTotal === 0 ? (
                      data.total_pacientes === 0 ? (
                        <EmptyState
                          icon={Users}
                          title="Nenhum paciente cadastrado"
                          subtitle="Cadastre seus pacientes para monitorar retornos e exames pendentes."
                          action={{ label: "Ir para Pacientes", href: "/pacientes" }}
                          className="py-10"
                        />
                      ) : (
                        <EmptyRow text="Todos os pacientes com retorno nos últimos 90 dias" />
                      )
                    ) : (
                      <>
                        {/* Crítico: > 180 dias */}
                        {data.sem_retorno.critico.slice(0, 5).map(p => (
                          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-red-400" />
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/pacientes/${p.id}`}
                                className="text-[12px] font-medium text-text-primary hover:text-accent transition-colors truncate block"
                              >
                                {p.nome}
                              </Link>
                              <div className="text-[10px] text-red-400/70">
                                {diasLabel(p.dias, p.ultima_consulta)}
                              </div>
                            </div>
                            {p.ultima_consulta && (
                              <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                                {fmtData(p.ultima_consulta)}
                              </span>
                            )}
                          </div>
                        ))}
                        {/* Atenção: 90–180 dias */}
                        {data.sem_retorno.atencao.slice(0, 3).map(p => (
                          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-400" />
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/pacientes/${p.id}`}
                                className="text-[12px] font-medium text-text-primary hover:text-accent transition-colors truncate block"
                              >
                                {p.nome}
                              </Link>
                              <div className="text-[10px] text-amber-400/70">
                                {diasLabel(p.dias, p.ultima_consulta)}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                              {fmtData(p.ultima_consulta)}
                            </span>
                          </div>
                        ))}
                        {semRetornoTotal > 8 && (
                          <div className="px-4 py-2 text-[11px] text-text-muted border-t border-border/40">
                            + {semRetornoTotal - 8} outros pacientes
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Exames pendentes */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <CardHeader
                    icon={<FlaskConical className="w-3.5 h-3.5 text-blue-400" />}
                    label="Exames da última consulta"
                  />
                  <div className="divide-y divide-border/40">
                    {examesTotal === 0 ? (
                      <EmptyRow text="Nenhum exame solicitado na última consulta registrada" />
                    ) : (
                      <>
                        {data.exames_pendentes.slice(0, 6).map((e, i) => (
                          <div key={i} className="flex items-start justify-between gap-3 px-4 py-2.5">
                            <div className="min-w-0">
                              {e.id ? (
                                <Link
                                  href={`/pacientes/${e.id}`}
                                  className="text-[12px] font-medium text-text-primary hover:text-accent transition-colors"
                                >
                                  {e.nome}
                                </Link>
                              ) : (
                                <span className="text-[12px] font-medium text-text-primary">{e.nome}</span>
                              )}
                              <div className="text-[10px] text-text-muted mt-0.5 truncate">
                                {e.exames.slice(0, 3).join(" · ")}
                                {e.exames.length > 3 ? ` +${e.exames.length - 3}` : ""}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                              {fmtData(e.ultima_consulta)}
                            </span>
                          </div>
                        ))}
                        {examesTotal > 6 && (
                          <div className="px-4 py-2 text-[11px] text-text-muted border-t border-border/40">
                            + {examesTotal - 6} outros pacientes
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {examesTotal > 0 && (
                    <div className="px-4 py-2.5 border-t border-border/50 bg-blue-500/5">
                      <p className="text-[10px] text-text-muted">
                        Realização não confirmada — exames solicitados na última consulta sem retorno posterior.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Coluna direita: Financeiro + Agenda ── */}
              <div className="space-y-4">
                <SectionLabel text="FINANCEIRO" />

                <div className="bg-card border border-border rounded-xl p-5 space-y-5">
                  {data.total_lancamentos === 0 ? (
                    <EmptyState
                      icon={CircleDollarSign}
                      title="Nenhum lançamento registrado"
                      subtitle="Registre receitas e despesas para acompanhar o financeiro da clínica."
                      action={{ label: "Registrar lançamento", href: "/financeiro" }}
                      className="py-6"
                    />
                  ) : (
                    <>
                      {/* Receita principal */}
                      <div>
                        <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                          Receita do mês
                        </div>
                        <div className="text-[32px] font-bold text-text-primary mt-0.5 leading-tight">
                          {fmtBRL(fin?.receita_mes ?? 0)}
                        </div>
                        {varPct !== null && (
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-[11px] font-medium",
                            varPct > 0 ? "text-accent" : varPct < 0 ? "text-red-400" : "text-text-muted"
                          )}>
                            {varPct > 0
                              ? <TrendingUp  className="w-3 h-3" />
                              : varPct < 0
                                ? <TrendingDown className="w-3 h-3" />
                                : <Minus className="w-3 h-3" />}
                            {varPct > 0 ? "+" : ""}{varPct}% vs mês anterior
                            <span className="text-text-muted font-normal">
                              ({fmtBRL(fin?.receita_ant ?? 0)})
                            </span>
                          </div>
                        )}
                        {varPct === null && fin && fin.receita_ant === 0 && (
                          <div className="text-[11px] text-text-muted mt-1">Sem dados do mês anterior</div>
                        )}
                      </div>

                      {/* Barra de progresso do mês */}
                      {fin && (
                        <div>
                          <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
                            <span>Dia {fin.dias_dec} de {fin.dias_tot}</span>
                            <span>{Math.round((fin.dias_dec / fin.dias_tot) * 100)}% do mês decorrido</span>
                          </div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{ width: `${Math.min(100, (fin.dias_dec / fin.dias_tot) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Estimativa */}
                      {fin?.estimativa !== null && fin?.estimativa !== undefined ? (
                        <div className="bg-accent-dim border border-accent-border rounded-lg px-4 py-3">
                          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                            Estimativa ao fim do mês
                          </div>
                          <div className="text-[22px] font-bold text-accent mt-0.5">
                            {fmtBRL(fin.estimativa)}
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5">
                            Projeção linear — baseada nos {fin.dias_dec} dias decorridos
                          </div>
                        </div>
                      ) : fin && fin.dias_dec < 3 ? (
                        <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2.5 text-[11px] text-text-muted">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          Estimativa disponível a partir do dia 3 do mês
                        </div>
                      ) : fin && fin.receita_mes === 0 ? (
                        <div className="text-[11px] text-text-muted">
                          Sem receita registrada ainda este mês
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                {/* ── Agenda ── */}
                <SectionLabel text="AGENDA HOJE" />
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {data.agenda === null ? (
                    // MedX não configurado — explica e oferece CTA
                    <EmptyState
                      icon={Plug}
                      title="Agenda não configurada"
                      subtitle="Conecte o MedX para visualizar seus agendamentos do dia diretamente aqui."
                      action={{ label: "Configurar integração", href: "/integracoes" }}
                      className="py-10"
                    />
                  ) : (
                    <>
                      <CardHeader
                        icon={<Calendar className="w-3.5 h-3.5 text-purple-400" />}
                        label={
                          data.agenda.total === 0
                            ? "Nenhum agendamento hoje"
                            : `${data.agenda.total} consulta${data.agenda.total !== 1 ? "s" : ""} agendada${data.agenda.total !== 1 ? "s" : ""}`
                        }
                      />
                      {data.agenda.total === 0 ? (
                        <EmptyRow text="Agenda livre hoje" />
                      ) : (
                        <div className="divide-y divide-border/40">
                          {data.agenda.appts.slice(0, 8).map((a, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="text-[11px] font-mono text-text-muted w-12 flex-shrink-0">
                                {a.hora}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] text-text-primary truncate">{a.nome}</div>
                                <div className="text-[10px] text-text-muted truncate">{a.proc}</div>
                              </div>
                              {a.status && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-border text-text-muted flex-shrink-0">
                                  {a.status}
                                </span>
                              )}
                            </div>
                          ))}
                          {data.agenda.total > 8 && (
                            <div className="px-4 py-2 text-[11px] text-text-muted border-t border-border/40">
                              + {data.agenda.total - 8} mais agendamentos
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  )
}
