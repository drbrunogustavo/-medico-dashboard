"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Panel, PxButton, Tag, PageHeader } from "@/components/px"
import { RefreshCw, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react"

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

// ── Subcomponentes ────────────────────────────────────────────────────────────

function Vazio({ text, action }: { text: string; action?: { label: string; href: string } }) {
  return (
    <div className="px-5 py-6 text-center">
      <p className="text-[13px] text-px-muted">{text}</p>
      {action && (
        <div className="mt-3 flex justify-center">
          <PxButton size="sm" variant="secondary" href={action.href}>{action.label}</PxButton>
        </div>
      )}
    </div>
  )
}

function Bloco({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Panel tone="light" className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-px-ink">{titulo}</h2>
        {extra}
      </div>
      <div className="border-t border-px-line">{children}</div>
    </Panel>
  )
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  return (
    <div>
      <dt className="text-[12px] text-white/80">{rotulo}</dt>
      <dd className="mt-1 text-[30px] font-semibold leading-none tabular-nums md:text-[34px]">{valor}</dd>
    </div>
  )
}

function LinhaPaciente({ p, tom }: { p: PacItem; tom: "danger" | "warn" }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <Link href={`/pacientes/${p.id}`} className="block truncate text-[13.5px] font-medium text-px-ink hover:underline">
          {p.nome}
        </Link>
        <span className="text-[12px] text-px-muted">{diasLabel(p.dias, p.ultima_consulta)}</span>
      </div>
      <Tag tone={tom}>{tom === "danger" ? "Crítico" : "Atenção"}</Tag>
      {p.ultima_consulta && <span className="flex-shrink-0 text-[12px] text-px-muted tabular-nums">{fmtData(p.ultima_consulta)}</span>}
    </li>
  )
}

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
      <PageHeader
        title="Radar"
        caption="Atenção clínica, financeiro e agenda do dia"
        actions={<PxButton variant="secondary" leftIcon={RefreshCw} loading={loading} disabled={loading} onClick={carregar}>Atualizar</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">

        {loading && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-busy="true">
            {[1, 2, 3, 4].map(i => <div key={i} className="px-glass h-40 animate-pulse rounded-px-panel" />)}
          </div>
        )}

        {erro && !loading && (
          <Panel tone="light" className="flex flex-wrap items-center justify-between gap-3">
            <p role="alert" className="text-[13.5px] text-px-danger">{erro}</p>
            <PxButton variant="secondary" size="sm" onClick={carregar}>Tentar de novo</PxButton>
          </Panel>
        )}

        {data && !loading && (
          <>
            <Panel tone="dark">
              <dl className="grid grid-cols-2 gap-4 text-white md:grid-cols-4">
                <Numero rotulo="Pacientes sem retorno" valor={semRetornoTotal} />
                <Numero rotulo="Pacientes com exame pendente" valor={examesTotal} />
                <Numero rotulo="Receita no mês" valor={fmtBRL(fin?.receita_mes ?? 0)} />
                <Numero rotulo="Consultas hoje" valor={data.agenda !== null ? data.agenda.total : "sem agenda"} />
              </dl>
            </Panel>

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">

              <div className="space-y-4">
                <Bloco
                  titulo="Sem retorno"
                  extra={<Link href="/pacientes" className="flex items-center gap-0.5 text-[12px] text-px-muted hover:text-px-ink">Ver pacientes <ChevronRight className="h-3.5 w-3.5" aria-hidden /></Link>}
                >
                  {semRetornoTotal === 0 ? (
                    data.total_pacientes === 0 ? (
                      <Vazio text="Nenhum paciente cadastrado. Cadastre pacientes para monitorar retornos e exames." action={{ label: "Ir para Pacientes", href: "/pacientes" }} />
                    ) : (
                      <Vazio text="Todos os pacientes tiveram retorno nos últimos 90 dias." />
                    )
                  ) : (
                    <>
                      <ul className="divide-y divide-px-line">
                        {data.sem_retorno.critico.slice(0, 5).map(p => <LinhaPaciente key={p.id} p={p} tom="danger" />)}
                        {data.sem_retorno.atencao.slice(0, 3).map(p => <LinhaPaciente key={p.id} p={p} tom="warn" />)}
                      </ul>
                      {semRetornoTotal > 8 && (
                        <p className="border-t border-px-line px-5 py-3 text-[12.5px] text-px-muted">+ {semRetornoTotal - 8} outros pacientes</p>
                      )}
                    </>
                  )}
                </Bloco>

                <Bloco titulo="Exames da última consulta">
                  {examesTotal === 0 ? (
                    <Vazio text="Nenhum exame solicitado na última consulta registrada." />
                  ) : (
                    <>
                      <ul className="divide-y divide-px-line">
                        {data.exames_pendentes.slice(0, 6).map((e, i) => (
                          <li key={i} className="flex items-start justify-between gap-3 px-5 py-3">
                            <div className="min-w-0">
                              {e.id ? (
                                <Link href={`/pacientes/${e.id}`} className="text-[13.5px] font-medium text-px-ink hover:underline">{e.nome}</Link>
                              ) : (
                                <span className="text-[13.5px] font-medium text-px-ink">{e.nome}</span>
                              )}
                              <p className="mt-0.5 truncate text-[12px] text-px-muted">
                                {e.exames.slice(0, 3).join(", ")}
                                {e.exames.length > 3 ? ` e mais ${e.exames.length - 3}` : ""}
                              </p>
                            </div>
                            <span className="flex-shrink-0 text-[12px] text-px-muted tabular-nums">{fmtData(e.ultima_consulta)}</span>
                          </li>
                        ))}
                      </ul>
                      {examesTotal > 6 && (
                        <p className="border-t border-px-line px-5 py-3 text-[12.5px] text-px-muted">+ {examesTotal - 6} outros pacientes</p>
                      )}
                      <p className="border-t border-px-line px-5 py-3 text-[12px] text-px-muted">
                        Realização não confirmada: são exames pedidos na última consulta, sem retorno depois.
                      </p>
                    </>
                  )}
                </Bloco>
              </div>

              <div className="space-y-4">
                <Panel tone="light" className="space-y-5">
                  <h2 className="text-[15px] font-semibold text-px-ink">Financeiro do mês</h2>
                  {data.total_lancamentos === 0 ? (
                    <Vazio text="Nenhum lançamento registrado. Registre receitas e despesas para acompanhar o financeiro." action={{ label: "Registrar lançamento", href: "/financeiro" }} />
                  ) : (
                    <>
                      <div>
                        <p className="text-[12.5px] text-px-muted">Receita do mês</p>
                        <p className="mt-0.5 text-[34px] font-semibold leading-tight tabular-nums text-px-ink">{fmtBRL(fin?.receita_mes ?? 0)}</p>
                        {varPct !== null && (
                          <p className={`mt-1 flex items-center gap-1 text-[12.5px] font-medium ${varPct > 0 ? "text-px-ok" : varPct < 0 ? "text-px-danger" : "text-px-muted"}`}>
                            {varPct > 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : varPct < 0 ? <TrendingDown className="h-3.5 w-3.5" aria-hidden /> : <Minus className="h-3.5 w-3.5" aria-hidden />}
                            {varPct > 0 ? "+" : ""}{varPct}% sobre o mês anterior
                            <span className="font-normal text-px-muted">({fmtBRL(fin?.receita_ant ?? 0)})</span>
                          </p>
                        )}
                        {varPct === null && fin && fin.receita_ant === 0 && (
                          <p className="mt-1 text-[12.5px] text-px-muted">Sem dados do mês anterior</p>
                        )}
                      </div>

                      {fin && (
                        <div>
                          <div className="mb-1.5 flex justify-between text-[12px] text-px-muted">
                            <span>Dia {fin.dias_dec} de {fin.dias_tot}</span>
                            <span>{Math.round((fin.dias_dec / fin.dias_tot) * 100)}% do mês decorrido</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-px-ink/10" role="progressbar" aria-label="Mês decorrido" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((fin.dias_dec / fin.dias_tot) * 100)}>
                            <div className="h-full rounded-full bg-px-ink" style={{ width: `${Math.min(100, (fin.dias_dec / fin.dias_tot) * 100)}%` }} />
                          </div>
                        </div>
                      )}

                      {fin?.estimativa !== null && fin?.estimativa !== undefined ? (
                        <div className="rounded-px-card bg-px-accent-soft px-4 py-3">
                          <p className="text-[12.5px] text-px-muted">Estimativa ao fim do mês</p>
                          <p className="mt-0.5 text-[24px] font-semibold tabular-nums text-px-accent">{fmtBRL(fin.estimativa)}</p>
                          <p className="mt-0.5 text-[12px] text-px-muted">Projeção linear sobre os {fin.dias_dec} dias decorridos</p>
                        </div>
                      ) : fin && fin.dias_dec < 3 ? (
                        <p className="text-[12.5px] text-px-muted">A estimativa fica disponível a partir do dia 3 do mês.</p>
                      ) : fin && fin.receita_mes === 0 ? (
                        <p className="text-[12.5px] text-px-muted">Sem receita registrada ainda neste mês.</p>
                      ) : null}
                    </>
                  )}
                </Panel>

                <Bloco titulo="Agenda de hoje">
                  {data.agenda === null ? (
                    <Vazio text="Agenda não configurada. Conecte o MedX para ver os agendamentos do dia aqui." action={{ label: "Configurar integração", href: "/configuracoes" }} />
                  ) : data.agenda.total === 0 ? (
                    <Vazio text="Nenhum agendamento hoje. Agenda livre." />
                  ) : (
                    <>
                      <ul className="divide-y divide-px-line">
                        {data.agenda.appts.slice(0, 8).map((a, i) => (
                          <li key={i} className="flex items-center gap-3 px-5 py-3">
                            <span className="w-12 flex-shrink-0 text-[13px] font-semibold tabular-nums text-px-ink">{a.hora}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13.5px] text-px-ink">{a.nome}</p>
                              <p className="truncate text-[12px] text-px-muted">{a.proc}</p>
                            </div>
                            {a.status && <Tag>{a.status}</Tag>}
                          </li>
                        ))}
                      </ul>
                      {data.agenda.total > 8 && (
                        <p className="border-t border-px-line px-5 py-3 text-[12.5px] text-px-muted">+ {data.agenda.total - 8} mais agendamentos</p>
                      )}
                    </>
                  )}
                </Bloco>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  )
}
