"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Panel, PxButton, Segmented, Field, PxInput, PxSelect, PxModal, Tag, PillBars, PageHeader } from "@/components/px"

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Lancamento {
  id:               string
  unidade:          string
  tipo:             "receita" | "despesa"
  descricao:        string
  valor:            number
  forma_pagamento?: string
  observacao?:      string
  data:             string
}

type TipoFilter = "todos" | "receita" | "despesa"

// ── Constantes ────────────────────────────────────────────────────────────────

const FORMAS = ["PIX", "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Transferência", "Convênio", "Boleto"]

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

const fmtDate = (s: string) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "Sem data")

function monthRange(year: number, month: number) {
  const pad  = (n: number) => String(n).padStart(2, "0")
  const last = new Date(year, month + 1, 0).getDate()
  return { inicio: `${year}-${pad(month + 1)}-01`, fim: `${year}-${pad(month + 1)}-${pad(last)}` }
}

const soma = (ls: Lancamento[], tipo: "receita" | "despesa") =>
  ls.filter(l => l.tipo === tipo).reduce((s, l) => s + l.valor, 0)

function Kpi({ label, value, sub, negativo = false }: { label: string; value: string; sub?: string; negativo?: boolean }) {
  return (
    <Panel as="div" className="p-4">
      <p className="text-[12.5px] text-px-muted">{label}</p>
      <p className={`mt-1 text-[22px] font-medium leading-none tracking-[-0.02em] ${negativo ? "text-px-danger" : "text-px-ink"}`}>{value}</p>
      {sub && <p className="mt-1.5 text-[12px] text-px-muted">{sub}</p>}
    </Panel>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const now = new Date()

  const [currentYear,  setCurrentYear]  = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const { inicio, fim } = monthRange(currentYear, currentMonth)

  const [unidade,    setUnidade]    = useState("Todas")
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("todos")
  const [viewAll,    setViewAll]    = useState(false)
  const [rawData,    setRawData]    = useState<Lancamento[]>([])
  const [prevData,   setPrevData]   = useState<Lancamento[] | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error,      setError]      = useState("")
  const [modalOpen,  setModalOpen]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [erroModal,  setErroModal]  = useState("")
  const reqId = useRef(0)

  const [form, setForm] = useState({
    unidade:         "",
    tipo:            "receita" as "receita" | "despesa",
    descricao:       "",
    valor:           "",
    forma_pagamento: "PIX",
    observacao:      "",
    data:            now.toISOString().slice(0, 10),
  })

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0) }
    else setCurrentMonth(m => m + 1)
  }

  const fetchData = useCallback(async () => {
    const id = ++reqId.current
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams(viewAll ? {} : { inicio, fim })
      const prevM  = currentMonth === 0 ? 11 : currentMonth - 1
      const prevY  = currentMonth === 0 ? currentYear - 1 : currentYear
      const { inicio: pInicio, fim: pFim } = monthRange(prevY, prevM)
      const [res, resAnt] = await Promise.all([
        fetch(`/api/financeiro?${params}`),
        viewAll ? Promise.resolve(null) : fetch(`/api/financeiro?inicio=${pInicio}&fim=${pFim}`).catch(() => null),
      ])
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.error) throw new Error(json?.error ?? `Erro ${res.status} ao carregar os lançamentos`)
      let ant: Lancamento[] | null = null
      if (resAnt && resAnt.ok) {
        const jsonAnt = await resAnt.json().catch(() => null)
        if (Array.isArray(jsonAnt)) ant = jsonAnt
      }
      if (id !== reqId.current) return
      setRawData(Array.isArray(json) ? json : [])
      setPrevData(ant)
    } catch (e) {
      if (id !== reqId.current) return
      console.error("[financeiro] erro ao carregar:", e)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [inicio, fim, viewAll, currentMonth, currentYear])

  useEffect(() => { fetchData() }, [fetchData])

  const unidades = Array.from(new Set(rawData.map(l => l.unidade).filter(Boolean))).sort()

  // O filtro de unidade vale para os totais e para a lista; o de tipo vale só para a lista.
  const base = rawData.filter(l => unidade === "Todas" || l.unidade === unidade)
  const data = base.filter(l => tipoFilter === "todos" || l.tipo === tipoFilter)

  const valorNum = parseFloat(form.valor)
  const podeSalvar = form.descricao.trim().length > 0 && Number.isFinite(valorNum) && valorNum > 0

  const salvar = async () => {
    if (!podeSalvar) return
    setSaving(true); setErroModal("")
    try {
      const res  = await fetch("/api/financeiro", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, descricao: form.descricao.trim(), valor: valorNum }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) throw new Error(json.error ?? `Erro ${res.status}`)
      setModalOpen(false)
      setForm(f => ({ ...f, descricao: "", valor: "", observacao: "" }))
      fetchData()
    } catch (e) {
      console.error("[financeiro] erro ao salvar:", e)
      setErroModal("Não foi possível salvar o lançamento. Os dados foram mantidos, tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const excluir = async (id: string) => {
    setDeletingId(id); setConfirmDeleteId(null); setError("")
    try {
      const res  = await fetch(`/api/financeiro?id=${id}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) throw new Error(json.error ?? `Erro ${res.status}`)
      fetchData()
    } catch (e) {
      console.error("[financeiro] erro ao excluir:", e)
      setError("Não foi possível excluir o lançamento. Tente novamente.")
    } finally {
      setDeletingId(null)
    }
  }

  // Totais
  const receitas = soma(base, "receita")
  const despesas = soma(base, "despesa")
  const saldo    = receitas - despesas

  // Comparação com o mês anterior e projeção usam a mesma base (unidade escolhida)
  const isCurrentMonth = !viewAll && currentYear === now.getFullYear() && currentMonth === now.getMonth()
  const hoje      = now.getDate()
  const diasNoMes = new Date(currentYear, currentMonth + 1, 0).getDate()
  const projecao  = isCurrentMonth ? (receitas / hoje) * diasNoMes : null
  const receitaAnt = prevData ? soma(prevData.filter(l => unidade === "Todas" || l.unidade === unidade), "receita") : null
  const varPct = !viewAll && receitaAnt !== null && receitaAnt > 0 ? ((receitas - receitaAnt) / receitaAnt) * 100 : null

  const receitaSemanal = [0, 1, 2, 3, 4].flatMap(idx => {
    const weekStart = idx * 7 + 1
    const weekEnd   = Math.min((idx + 1) * 7, diasNoMes)
    if (weekStart > diasNoMes) return []
    const total = base
      .filter(l => {
        const d = new Date(l.data + "T12:00:00")
        return l.tipo === "receita" && d.getDate() >= weekStart && d.getDate() <= weekEnd
          && d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((s, l) => s + l.valor, 0)
    return [{ rotulo: `Semana ${idx + 1}`, valor: total }]
  })

  const porUnidade = unidades.map(u => {
    const rec  = soma(rawData.filter(l => l.unidade === u), "receita")
    const desp = soma(rawData.filter(l => l.unidade === u), "despesa")
    return { unidade: u, rec, desp, saldo: rec - desp }
  }).filter(u => u.rec > 0 || u.desp > 0)
  const maxVal = Math.max(...porUnidade.map(u => Math.max(u.rec, u.desp)), 1)

  const periodo = viewAll ? "todos os períodos" : `${MESES[currentMonth]} de ${currentYear}`
  const limparFiltros = () => { setUnidade("Todas"); setTipoFilter("todos") }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Financeiro"
        caption="Receitas e despesas por unidade"
        actions={<PxButton leftIcon={Plus} onClick={() => { setErroModal(""); setModalOpen(true) }}>Novo lançamento</PxButton>}
      />

      <div className="max-w-6xl space-y-4 px-4 pb-10 md:px-10">

        {/* Período e filtros */}
        <Panel className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <Segmented label="Período" value={viewAll ? "todos" : "mes"} onChange={v => setViewAll(v === "todos")}
            options={[{ value: "mes", label: "Por mês" }, { value: "todos", label: "Todos os períodos" }]} />
          {!viewAll && (
            <div className="flex items-center gap-1">
              <PxButton variant="quiet" size="sm" aria-label="Mês anterior" onClick={prevMonth} leftIcon={ChevronLeft} />
              <span aria-live="polite" className="min-w-[140px] text-center text-[14px] font-medium text-px-ink">{MESES[currentMonth]} de {currentYear}</span>
              <PxButton variant="quiet" size="sm" aria-label="Próximo mês" onClick={nextMonth} leftIcon={ChevronRight} />
            </div>
          )}
          <Segmented label="Tipo" value={tipoFilter} onChange={setTipoFilter}
            options={[{ value: "todos", label: "Todos" }, { value: "receita", label: "Receitas" }, { value: "despesa", label: "Despesas" }]} />
          {unidades.length > 0 && (
            <Segmented label="Unidade" value={unidade} onChange={setUnidade}
              options={[{ value: "Todas", label: "Todas as unidades" }, ...unidades.map(u => ({ value: u, label: u }))]} />
          )}
        </Panel>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">
            <span>{error}</span>
            <PxButton variant="secondary" size="sm" onClick={fetchData}>Tentar de novo</PxButton>
          </div>
        )}

        {/* Totais */}
        <div className={`grid grid-cols-2 gap-3 ${projecao !== null ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
          <Kpi label="Receitas" value={fmt(receitas)}
            sub={varPct !== null ? `${varPct >= 0 ? "+" : ""}${varPct.toFixed(1).replace(".", ",")}% sobre o mês anterior` : `em ${periodo}`} />
          <Kpi label="Despesas" value={fmt(despesas)} sub={`em ${periodo}`} />
          <Kpi label="Saldo" value={fmt(saldo)} negativo={saldo < 0} sub="receitas menos despesas" />
          <Kpi label="Lançamentos" value={String(data.length)} sub={tipoFilter === "todos" ? "na lista abaixo" : `só ${tipoFilter === "receita" ? "receitas" : "despesas"}`} />
          {projecao !== null && <Kpi label="Projeção do mês" value={fmt(projecao)} sub="receita no ritmo atual" />}
        </div>

        {/* Receita semanal */}
        {!viewAll && receitaSemanal.some(s => s.valor > 0) && (
          <Panel as="section" className="space-y-3">
            <h2 className="text-[15px] font-semibold text-px-ink">Receita por semana, {MESES[currentMonth]} de {currentYear}</h2>
            <PillBars data={receitaSemanal} label={`Receita por semana em ${MESES[currentMonth]} de ${currentYear}`} format={fmt} />
          </Panel>
        )}

        {/* Por unidade */}
        {porUnidade.length > 0 && (
          <Panel as="section" className="space-y-4">
            <h2 className="text-[15px] font-semibold text-px-ink">Resultado por unidade, {periodo}</h2>
            <ul className="space-y-4">
              {porUnidade.map(u => (
                <li key={u.unidade}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-medium text-px-ink">{u.unidade}</span>
                    <span className={`text-[13.5px] font-semibold ${u.saldo < 0 ? "text-px-danger" : "text-px-ink"}`}>Saldo {fmt(u.saldo)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="w-[130px] flex-shrink-0 text-[12.5px] text-px-muted">Receitas {fmt(u.rec)}</span>
                      <div aria-hidden="true" className="h-2 flex-1 rounded-full bg-px-ink/[0.06]"><div className="h-full rounded-full bg-px-ink" style={{ width: `${(u.rec / maxVal) * 100}%` }} /></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-[130px] flex-shrink-0 text-[12.5px] text-px-muted">Despesas {fmt(u.desp)}</span>
                      <div aria-hidden="true" className="h-2 flex-1 rounded-full bg-px-ink/[0.06]"><div className="h-full rounded-full bg-px-ink/35" style={{ width: `${(u.desp / maxVal) * 100}%` }} /></div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Lista */}
        <Panel as="section" className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-px-ink/10 px-4 py-3">
            <h2 className="text-[15px] font-semibold text-px-ink">
              {data.length} lançamento{data.length !== 1 ? "s" : ""}
              {unidade !== "Todas" && `, ${unidade}`}
              {tipoFilter !== "todos" && `, ${tipoFilter === "receita" ? "receitas" : "despesas"}`}
            </h2>
            {loading && <span role="status" className="text-[12.5px] text-px-muted">Carregando</span>}
          </div>

          {loading && rawData.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-px-muted">Carregando lançamentos</p>
          ) : error && rawData.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-px-muted">Os lançamentos não puderam ser carregados.</p>
          ) : data.length === 0 && !loading ? (
            rawData.length > 0 ? (
              <div className="py-12 text-center">
                <p className="mb-3 text-[13.5px] text-px-ink">Nenhum lançamento com esses filtros.</p>
                <PxButton variant="secondary" onClick={limparFiltros}>Limpar filtros</PxButton>
              </div>
            ) : viewAll ? (
              <div className="py-12 text-center">
                <p className="text-[14px] font-semibold text-px-ink">Nenhum lançamento registrado</p>
                <p className="mb-4 mt-1 text-[13px] text-px-muted">Registre a primeira receita ou despesa para acompanhar o financeiro da clínica.</p>
                <PxButton leftIcon={Plus} onClick={() => { setErroModal(""); setModalOpen(true) }}>Novo lançamento</PxButton>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="mb-3 text-[13.5px] text-px-ink">Nenhum lançamento em {MESES[currentMonth]}.</p>
                <PxButton variant="secondary" onClick={() => setViewAll(true)}>Ver todos os períodos</PxButton>
              </div>
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-px-ink/10 text-[12px] text-px-muted">
                    <th scope="col" className="px-4 py-2.5 font-medium">Data</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Unidade</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Tipo</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Descrição</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Pagamento</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Valor</th>
                    <th scope="col" className="px-4 py-2.5 font-medium"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-px-ink/10">
                  {data.map(l => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 text-[13px] text-px-muted">{fmtDate(l.data)}</td>
                      <td className="px-3 py-3 text-[13px] text-px-ink/80">{l.unidade || "Sem unidade"}</td>
                      <td className="px-3 py-3"><Tag tone={l.tipo === "receita" ? "ok" : "danger"}>{l.tipo === "receita" ? "Receita" : "Despesa"}</Tag></td>
                      <td className="max-w-[260px] px-3 py-3"><span className="block truncate text-[13.5px] text-px-ink">{l.descricao}</span></td>
                      <td className="px-3 py-3 text-[13px] text-px-muted">{l.forma_pagamento ?? "Não informado"}</td>
                      <td className="px-3 py-3 text-right text-[13.5px] font-semibold text-px-ink">{l.tipo === "despesa" ? "-" : "+"}{fmt(l.valor)}</td>
                      <td className="px-4 py-3">
                        {confirmDeleteId === l.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <PxButton variant="danger" size="sm" onClick={() => excluir(l.id)}>Excluir</PxButton>
                            <PxButton variant="quiet" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</PxButton>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <PxButton variant="quiet" size="sm" leftIcon={Trash2} loading={deletingId === l.id} aria-label={`Excluir lançamento ${l.descricao}`} onClick={() => setConfirmDeleteId(l.id)} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <PxModal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo lançamento" className="max-w-lg">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Tipo</p>
            <Segmented label="Tipo do lançamento" value={form.tipo} onChange={t => setForm(f => ({ ...f, tipo: t }))}
              options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Unidade" htmlFor="fin-un">
              <PxInput id="fin-un" list="unidades-datalist" value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} placeholder="Nome da unidade" />
              <datalist id="unidades-datalist">{unidades.map(u => <option key={u} value={u} />)}</datalist>
            </Field>
            <Field label="Data" htmlFor="fin-data">
              <PxInput id="fin-data" type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
            </Field>
          </div>
          <Field label="Descrição" htmlFor="fin-desc">
            <PxInput id="fin-desc" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Consulta particular" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Valor (R$)" htmlFor="fin-valor" error={form.valor && !(valorNum > 0) ? "Informe um valor maior que zero." : undefined}>
              <PxInput id="fin-valor" type="number" min="0" step="0.01" inputMode="decimal" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" />
            </Field>
            <Field label="Pagamento" htmlFor="fin-pag">
              <PxSelect id="fin-pag" value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}>
                {FORMAS.map(f => <option key={f}>{f}</option>)}
              </PxSelect>
            </Field>
          </div>
          <Field label="Observação (opcional)" htmlFor="fin-obs">
            <PxInput id="fin-obs" value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
          </Field>
          {erroModal && <p role="alert" className="text-[13px] text-px-danger">{erroModal}</p>}
          <div className="flex gap-2 pt-1">
            <PxButton variant="secondary" fullWidth onClick={() => setModalOpen(false)}>Cancelar</PxButton>
            <PxButton fullWidth onClick={salvar} loading={saving} disabled={!podeSalvar}>Salvar lançamento</PxButton>
          </div>
        </div>
      </PxModal>
    </div>
  )
}
