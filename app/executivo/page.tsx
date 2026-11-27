"use client"

import { useEffect, useState, useCallback, useMemo, useRef, useId } from "react"
import { useAppContext } from "@/components/AppProvider"
import { Mic, MicOff } from "lucide-react"
import { Panel, PxButton, Segmented, Field, PxInput, PxSelect, PxModal, PillBars, LineSeries, PageHeader } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AbaId = "marketing" | "comercial" | "operacao" | "autoridade"

interface ExecData {
  faturamento_mes:    number
  faturamento_6m:     { mes: string; valor: number }[]
  leads_total:        number
  leads_semana:       number
  leads_por_estagio:  { estagio: string; count: number }[]
  nps_score:          number | null
  nps_6m:             { mes: string; nps: number | null }[]
  consultas_mes:      number
  leads_origem:       { origem: string; count: number }[]
}

interface TopPost { tema: string; formato: string; curtidas: number; comentarios: number }

interface MarketingManual {
  seguidores: number; ganho_semanal: number; alcance_semanal: number; alcance_ant: number
  posts_mes: number; reels_mes: number; stories_mes: number
  ultimo_post: string; horario_melhor: string; top3: TopPost[]
}
interface OperacaoManual { ocupacao_pct: number; faltas_pct: number; ticket_medio: number; retorno_pct: number }
interface AutoridadeManual { google_rating: number; google_link: string; depoimentos_semana: number; indicacoes_ativas: number }

type Sinal = { tipo: "ok" | "warn" | "info"; texto: string }

// ─── Auxiliares ───────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

function getNow() {
  const s = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const s = localStorage.getItem(key)
    return s ? (JSON.parse(s) as T) : fallback
  } catch { return fallback }
}

/** Retorna false se o navegador recusar (modo privado, cota cheia). */
function setLocalStorage(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

const MKTG_DEFAULT: MarketingManual = {
  seguidores: 0, ganho_semanal: 0, alcance_semanal: 0, alcance_ant: 0,
  posts_mes: 0, reels_mes: 0, stories_mes: 0, ultimo_post: "", horario_melhor: "19h", top3: [],
}
const OPS_DEFAULT: OperacaoManual = { ocupacao_pct: 0, faltas_pct: 0, ticket_medio: 0, retorno_pct: 0 }
const AUT_DEFAULT: AutoridadeManual = { google_rating: 0, google_link: "", depoimentos_semana: 0, indicacoes_ativas: 0 }

const ABAS: { value: AbaId; label: string }[] = [
  { value: "marketing",  label: "Marketing" },
  { value: "comercial",  label: "Comercial" },
  { value: "operacao",   label: "Operação" },
  { value: "autoridade", label: "Autoridade" },
]

const titulo = "text-[15px] font-semibold text-px-ink"

// ─── Componentes ──────────────────────────────────────────────────────────────

function Kpi({ label, value, sub, negativo = false }: { label: string; value: string; sub: string; negativo?: boolean }) {
  return (
    <Panel as="div" className="p-4">
      <p className="text-[12.5px] text-px-muted">{label}</p>
      <p className={`mt-1 text-[24px] font-medium leading-none tracking-[-0.02em] ${negativo ? "text-px-danger" : "text-px-ink"}`}>{value}</p>
      <p className="mt-1.5 text-[12px] text-px-muted">{sub}</p>
    </Panel>
  )
}

function Sinais({ itens }: { itens: Sinal[] }) {
  return (
    <ul className="space-y-2 text-[13.5px] leading-relaxed text-px-ink/85">
      {itens.map((s, i) => (
        <li key={i}>{s.tipo === "warn" && <span className="font-semibold text-px-ink">Atenção: </span>}{s.texto}</li>
      ))}
    </ul>
  )
}

function Num({ label, value, onChange, prefix, suffix }: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string
}) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        {prefix && <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-px-muted">{prefix}</span>}
        <PxInput id={id} type="number" min={0} inputMode="decimal" value={value || ""} placeholder="0"
          className={prefix ? "pl-9" : suffix ? "pr-10" : ""}
          onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))} />
        {suffix && <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-px-muted">{suffix}</span>}
      </div>
    </Field>
  )
}

function Cabecalho({ titulo: t, editing, onEdit, onCancel, onSave, aviso }: {
  titulo: string; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: () => void; aviso?: string
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={titulo}>{t}</h2>
        {editing ? (
          <div className="flex gap-2">
            <PxButton variant="secondary" size="sm" onClick={onCancel}>Cancelar</PxButton>
            <PxButton size="sm" onClick={onSave}>Salvar</PxButton>
          </div>
        ) : (
          <PxButton variant="secondary" size="sm" onClick={onEdit}>Editar dados</PxButton>
        )}
      </div>
      {aviso && <p role="alert" className="mt-2 rounded-px-card bg-px-warn-soft px-3 py-2 text-[12.5px] text-px-ink">{aviso}</p>}
    </div>
  )
}

// ─── Aba Marketing ────────────────────────────────────────────────────────────

function AbaMarketing({ mktg, onSave }: { mktg: MarketingManual; onSave: (m: MarketingManual) => boolean }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState<MarketingManual>(mktg)
  const [aviso,   setAviso]   = useState("")

  const diasSemPost = (() => {
    if (!mktg.ultimo_post) return null
    return Math.max(0, Math.floor((Date.now() - new Date(mktg.ultimo_post).getTime()) / 86400000))
  })()
  const alcanceDiff = mktg.alcance_ant > 0 ? Math.round((mktg.alcance_semanal - mktg.alcance_ant) / mktg.alcance_ant * 100) : null

  function save() {
    const ok = onSave(draft)
    setAviso(ok ? "" : "O navegador não permitiu salvar estes dados. Eles valem só até você recarregar a página.")
    setEditing(false)
  }

  function updateTop3(i: number, field: keyof TopPost, val: string | number) {
    const arr = [...(draft.top3 ?? [])]
    if (!arr[i]) arr[i] = { tema: "", formato: "Reel", curtidas: 0, comentarios: 0 }
    arr[i] = { ...arr[i], [field]: val }
    setDraft(d => ({ ...d, top3: arr }))
  }

  const sinais: Sinal[] = []
  if (mktg.posts_mes > 0) {
    if (diasSemPost !== null && diasSemPost >= 3) sinais.push({ tipo: "warn", texto: `Seu último post foi há ${diasSemPost} dias.` })
    if (diasSemPost !== null && diasSemPost < 2) sinais.push({ tipo: "ok", texto: "Você publicou hoje ou ontem." })
    if (alcanceDiff !== null && alcanceDiff <= -15) sinais.push({ tipo: "warn", texto: `O alcance caiu ${Math.abs(alcanceDiff)}% em relação à semana anterior.` })
    if (alcanceDiff !== null && alcanceDiff >= 10) sinais.push({ tipo: "ok", texto: `O alcance cresceu ${alcanceDiff}% em relação à semana anterior.` })
    sinais.push({ tipo: "info", texto: `${mktg.posts_mes} publicação${mktg.posts_mes !== 1 ? "ões" : ""} no mês, sendo ${mktg.reels_mes} Reel${mktg.reels_mes !== 1 ? "s" : ""} e ${mktg.stories_mes} Stor${mktg.stories_mes !== 1 ? "ies" : "y"}.` })
    if (mktg.alcance_semanal > 0 && mktg.seguidores > 0)
      sinais.push({ tipo: "info", texto: `O alcance semanal equivale a ${Math.round(mktg.alcance_semanal / mktg.seguidores * 100)}% dos seguidores.` })
    if (mktg.horario_melhor) sinais.push({ tipo: "info", texto: `Melhor horário para publicar, segundo seus dados: ${mktg.horario_melhor}.` })
  }

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Marketing digital" editing={editing} aviso={aviso}
        onEdit={() => { setDraft({ ...mktg }); setEditing(true) }} onCancel={() => setEditing(false)} onSave={save} />

      {editing ? (
        <Panel className="space-y-5">
          <p className="text-[12.5px] text-px-muted">Informe os dados do seu Instagram. Eles ficam salvos só neste navegador.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Num label="Seguidores totais"       value={draft.seguidores}      onChange={v => setDraft(d => ({ ...d, seguidores: v }))} />
            <Num label="Ganho esta semana"       value={draft.ganho_semanal}   onChange={v => setDraft(d => ({ ...d, ganho_semanal: v }))} />
            <Num label="Alcance semanal"         value={draft.alcance_semanal} onChange={v => setDraft(d => ({ ...d, alcance_semanal: v }))} />
            <Num label="Alcance semana anterior" value={draft.alcance_ant}     onChange={v => setDraft(d => ({ ...d, alcance_ant: v }))} />
            <Num label="Posts no mês"            value={draft.posts_mes}       onChange={v => setDraft(d => ({ ...d, posts_mes: v }))} />
            <Num label="Reels no mês"            value={draft.reels_mes}       onChange={v => setDraft(d => ({ ...d, reels_mes: v }))} />
            <Num label="Stories no mês"          value={draft.stories_mes}     onChange={v => setDraft(d => ({ ...d, stories_mes: v }))} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data do último post" htmlFor="mk-ult"><PxInput id="mk-ult" type="date" value={draft.ultimo_post} onChange={e => setDraft(d => ({ ...d, ultimo_post: e.target.value }))} /></Field>
            <Field label="Melhor horário para publicar" htmlFor="mk-hor"><PxInput id="mk-hor" value={draft.horario_melhor} placeholder="19h" onChange={e => setDraft(d => ({ ...d, horario_melhor: e.target.value }))} /></Field>
          </div>
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-px-ink">Três melhores posts do mês</h3>
            {[0, 1, 2].map(i => (
              <div key={i} className="grid grid-cols-1 gap-2 rounded-px-card bg-px-ink/[0.04] p-3 sm:grid-cols-[1fr_140px_120px]">
                <PxInput aria-label={`Tema do post ${i + 1}`} placeholder={`Tema do post ${i + 1}`} value={draft.top3?.[i]?.tema ?? ""} onChange={e => updateTop3(i, "tema", e.target.value)} />
                <PxSelect aria-label={`Formato do post ${i + 1}`} value={draft.top3?.[i]?.formato ?? "Reel"} onChange={e => updateTop3(i, "formato", e.target.value)}>
                  {["Reel", "Carrossel", "Stories", "Foto"].map(f => <option key={f}>{f}</option>)}
                </PxSelect>
                <PxInput aria-label={`Curtidas do post ${i + 1}`} type="number" min={0} placeholder="Curtidas" value={draft.top3?.[i]?.curtidas || ""} onChange={e => updateTop3(i, "curtidas", Math.max(0, Number(e.target.value) || 0))} />
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi label="Seguidores" value={mktg.seguidores.toLocaleString("pt-BR")} sub={`+${mktg.ganho_semanal} esta semana`} />
            <Kpi label="Alcance semanal" value={mktg.alcance_semanal.toLocaleString("pt-BR")} negativo={alcanceDiff !== null && alcanceDiff < -10}
              sub={alcanceDiff !== null ? `${alcanceDiff >= 0 ? "+" : ""}${alcanceDiff}% sobre a semana anterior` : "pessoas únicas alcançadas"} />
            <Kpi label="Posts no mês" value={String(mktg.posts_mes)} sub={`${mktg.reels_mes} Reels e ${mktg.stories_mes} Stories`} />
          </div>

          <Panel as="section" className="space-y-3">
            <h3 className={titulo}>O que os seus números mostram</h3>
            {mktg.posts_mes === 0
              ? <p className="text-[13.5px] text-px-ink/80">Preencha seus dados em Editar dados para ver a leitura do mês.</p>
              : <Sinais itens={sinais} />}
          </Panel>

          {(mktg.top3 ?? []).some(p => p.tema) && (
            <Panel as="section" className="space-y-3">
              <h3 className={titulo}>Três melhores posts do mês</h3>
              <ol className="space-y-2">
                {(mktg.top3 ?? []).filter(p => p.tema).map((p, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-px-card bg-px-ink/[0.04] px-3 py-2.5">
                    <span className="w-5 flex-shrink-0 text-[13px] font-semibold text-px-ink">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-px-ink">{p.tema}</p>
                      <p className="text-[12.5px] text-px-muted">{p.formato}</p>
                    </div>
                    {p.curtidas > 0 && <span className="flex-shrink-0 text-[13px] text-px-ink/80">{p.curtidas.toLocaleString("pt-BR")} curtidas</span>}
                  </li>
                ))}
              </ol>
            </Panel>
          )}

          <div className="flex flex-wrap gap-2">
            <PxButton variant="secondary" href="/reels">Criar Reel</PxButton>
            <PxButton variant="secondary" href="/calendario">Planejar calendário</PxButton>
            <PxButton variant="secondary" href="/radar">Ver Radar de Tendências</PxButton>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Aba Comercial ────────────────────────────────────────────────────────────

function AbaComercial({ exec }: { exec: Partial<ExecData> }) {
  const porEstagio = exec.leads_por_estagio ?? []
  const n = (e: string) => porEstagio.find(x => x.estagio === e)?.count ?? 0
  const leads     = exec.leads_total ?? 0
  const consultas = exec.consultas_mes ?? 0
  const pacientes = n("Paciente")

  const etapas = [
    { label: "Leads no CRM",     n: leads,     nota: "acumulado" },
    { label: "Consultas no mês", n: consultas, nota: "agenda do mês" },
    { label: "Pacientes",        n: pacientes, nota: "acumulado no CRM" },
  ]
  const maxN = Math.max(...etapas.map(e => e.n), 1)
  const convTotal = leads > 0 ? Math.round(pacientes / leads * 100) : 0
  const aguardando = n("Novo Lead") + n("Contato Feito") + n("Qualificado")

  const sinais: Sinal[] = [{ tipo: "info", texto: `Conversão de leads em pacientes: ${convTotal}% (${pacientes} de ${leads}).` }]
  if (aguardando > 0) sinais.push({ tipo: "warn", texto: `${aguardando} lead${aguardando !== 1 ? "s" : ""} no CRM ainda não chegaram à consulta agendada.` })
  if (consultas > 0) sinais.push({ tipo: "info", texto: `${consultas} consulta${consultas !== 1 ? "s" : ""} registrada${consultas !== 1 ? "s" : ""} neste mês.` })

  return (
    <div className="space-y-4">
      <h2 className={titulo}>Funil comercial</h2>

      <Panel as="section" className="space-y-4">
        <h3 className="text-[13px] font-semibold text-px-ink">De lead a paciente</h3>
        <ul className="space-y-3">
          {etapas.map(e => (
            <li key={e.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-[13.5px] text-px-ink">{e.label} <span className="text-px-muted">({e.nota})</span></span>
                <span className="text-[14px] font-semibold text-px-ink">{e.n}</span>
              </div>
              <div aria-hidden="true" className="h-2 rounded-full bg-px-ink/[0.06]">
                <div className="h-full rounded-full bg-px-ink" style={{ width: `${Math.max((e.n / maxN) * 100, e.n > 0 ? 3 : 0)}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-px-ink/10 pt-3 text-[12.5px] text-px-muted">
          Leads e pacientes são totais do CRM; consultas são só do mês. Por isso as barras não representam uma conversão etapa a etapa.
        </p>
      </Panel>

      {porEstagio.length > 0 && (
        <Panel as="section" className="space-y-3">
          <h3 className={titulo}>Distribuição do CRM</h3>
          <ul className="divide-y divide-px-ink/10">
            {porEstagio.map(e => (
              <li key={e.estagio} className="flex items-center justify-between py-2 text-[13.5px]">
                <span className="text-px-ink/80">{e.estagio}</span>
                <span className="font-semibold text-px-ink">{e.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel as="section" className="space-y-3">
        <h3 className={titulo}>O que os seus números mostram</h3>
        <Sinais itens={sinais} />
      </Panel>

      <div className="flex flex-wrap gap-2">
        <PxButton variant="secondary" href="/crm">Abrir CRM</PxButton>
        <PxButton variant="secondary" href="/nutricao-leads">Nutrir leads</PxButton>
      </div>
    </div>
  )
}

// ─── Aba Operação ─────────────────────────────────────────────────────────────

function AbaOperacao({ ops, onSave, exec }: { ops: OperacaoManual; onSave: (o: OperacaoManual) => boolean; exec: Partial<ExecData> }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState<OperacaoManual>(ops)
  const [aviso,   setAviso]   = useState("")

  function save() {
    const ok = onSave(draft)
    setAviso(ok ? "" : "O navegador não permitiu salvar estes dados. Eles valem só até você recarregar a página.")
    setEditing(false)
  }

  const ticketMedio = ops.ticket_medio > 0
    ? fmt(ops.ticket_medio)
    : (exec.faturamento_mes ?? 0) > 0 && (exec.consultas_mes ?? 0) > 0
      ? fmt(Math.round((exec.faturamento_mes ?? 0) / (exec.consultas_mes ?? 1)))
      : "Sem dados"

  const sinais: Sinal[] = []
  if (ops.faltas_pct > 0) sinais.push({ tipo: ops.faltas_pct > 15 ? "warn" : "ok", texto: `Taxa de faltas em ${ops.faltas_pct}%.${ops.faltas_pct > 15 ? " Uma régua de confirmação pode ajudar." : ""}` })
  if (ops.ocupacao_pct > 0 && ops.ocupacao_pct < 70) sinais.push({ tipo: "info", texto: `Agenda com ${ops.ocupacao_pct}% de ocupação, ainda com espaço para novos pacientes.` })
  if (ops.ocupacao_pct >= 90) sinais.push({ tipo: "warn", texto: `Agenda com ${ops.ocupacao_pct}% de ocupação. Vale considerar mais horários ou lista de espera.` })
  if (ops.retorno_pct > 0) sinais.push({ tipo: "info", texto: `${ops.retorno_pct}% dos pacientes retornaram.` })

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Operação da clínica" editing={editing} aviso={aviso}
        onEdit={() => { setDraft(ops); setEditing(true) }} onCancel={() => setEditing(false)} onSave={save} />

      {editing ? (
        <Panel className="space-y-4">
          <p className="text-[12.5px] text-px-muted">Informe os indicadores operacionais do mês atual. Eles ficam salvos só neste navegador.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Num label="Ocupação da agenda" value={draft.ocupacao_pct} suffix="%" onChange={v => setDraft(d => ({ ...d, ocupacao_pct: Math.min(v, 100) }))} />
            <Num label="Taxa de faltas"     value={draft.faltas_pct}   suffix="%" onChange={v => setDraft(d => ({ ...d, faltas_pct: Math.min(v, 100) }))} />
            <Num label="Ticket médio"       value={draft.ticket_medio} prefix="R$" onChange={v => setDraft(d => ({ ...d, ticket_medio: v }))} />
            <Num label="Taxa de retorno"    value={draft.retorno_pct}  suffix="%" onChange={v => setDraft(d => ({ ...d, retorno_pct: Math.min(v, 100) }))} />
          </div>
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi label="Ocupação da agenda" value={`${ops.ocupacao_pct}%`} sub="capacidade utilizada" />
            <Kpi label="Taxa de faltas" value={`${ops.faltas_pct}%`} negativo={ops.faltas_pct > 15} sub="ausências no período" />
            <Kpi label="Ticket médio" value={ticketMedio} sub={ops.ticket_medio > 0 ? "informado por você" : "receita por consulta no mês"} />
            <Kpi label="Taxa de retorno" value={`${ops.retorno_pct}%`} sub="pacientes que voltaram" />
          </div>

          <Panel as="section" className="space-y-3">
            <h3 className={titulo}>Consultas do mês</h3>
            <p className="text-[28px] font-medium leading-none text-px-ink">{exec.consultas_mes ?? 0}</p>
            <p className="text-[12.5px] text-px-muted">consultas registradas</p>
            {ops.ocupacao_pct > 0 && (
              <div role="progressbar" aria-label="Ocupação da agenda" aria-valuenow={ops.ocupacao_pct} aria-valuemin={0} aria-valuemax={100} className="h-2 rounded-full bg-px-ink/[0.06]">
                <div className="h-full rounded-full bg-px-ink" style={{ width: `${ops.ocupacao_pct}%` }} />
              </div>
            )}
          </Panel>

          <Panel as="section" className="space-y-3">
            <h3 className={titulo}>O que os seus números mostram</h3>
            {sinais.length === 0
              ? <p className="text-[13.5px] text-px-ink/80">Preencha seus dados em Editar dados para ver a leitura do mês.</p>
              : <Sinais itens={sinais} />}
          </Panel>
        </>
      )}
    </div>
  )
}

// ─── Aba Autoridade ───────────────────────────────────────────────────────────

function AbaAutoridade({ exec, aut, onSave }: { exec: Partial<ExecData>; aut: AutoridadeManual; onSave: (a: AutoridadeManual) => boolean }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState<AutoridadeManual>(aut)
  const [aviso,   setAviso]   = useState("")

  function save() {
    const ok = onSave(draft)
    setAviso(ok ? "" : "O navegador não permitiu salvar estes dados. Eles valem só até você recarregar a página.")
    setEditing(false)
  }

  const npsScore = exec.nps_score ?? null
  const faixa = npsScore === null ? "Aguardando respostas"
    : npsScore >= 70 ? "Zona de excelência"
    : npsScore >= 30 ? "Zona de qualidade"
    : "Abaixo da média"
  const serie = (exec.nps_6m ?? []).map(m => ({ rotulo: m.mes, valor: m.nps }))

  const sinais: Sinal[] = []
  if (aut.depoimentos_semana > 0) sinais.push({ tipo: "ok", texto: `${aut.depoimentos_semana} depoimento${aut.depoimentos_semana !== 1 ? "s" : ""} novo${aut.depoimentos_semana !== 1 ? "s" : ""} esta semana. Vale compartilhar no Instagram, com autorização do paciente.` })
  if (aut.indicacoes_ativas > 0) sinais.push({ tipo: "ok", texto: `${aut.indicacoes_ativas} indicaç${aut.indicacoes_ativas !== 1 ? "ões" : "ão"} ativa${aut.indicacoes_ativas !== 1 ? "s" : ""} no programa.` })
  if (npsScore !== null && npsScore < 30) sinais.push({ tipo: "warn", texto: "NPS abaixo de 30. Vale ler as respostas dos detratores e entrar em contato." })

  return (
    <div className="space-y-4">
      <Cabecalho titulo="Autoridade e reputação" editing={editing} aviso={aviso}
        onEdit={() => { setDraft(aut); setEditing(true) }} onCancel={() => setEditing(false)} onSave={save} />

      {editing ? (
        <Panel className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Num label="Avaliação no Google (0 a 5)" value={draft.google_rating} suffix="/5" onChange={v => setDraft(d => ({ ...d, google_rating: Math.min(v, 5) }))} />
            <Num label="Depoimentos esta semana" value={draft.depoimentos_semana} onChange={v => setDraft(d => ({ ...d, depoimentos_semana: v }))} />
            <Num label="Indicações ativas" value={draft.indicacoes_ativas} onChange={v => setDraft(d => ({ ...d, indicacoes_ativas: v }))} />
            <Field label="Link do Google Meu Negócio" htmlFor="au-link" className="sm:col-span-2">
              <PxInput id="au-link" value={draft.google_link} placeholder="https://g.page/..." onChange={e => setDraft(d => ({ ...d, google_link: e.target.value }))} />
            </Field>
          </div>
        </Panel>
      ) : (
        <>
          <Panel as="section" className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-[13px] text-px-muted">Score NPS</h3>
                <p className={`mt-1 text-[44px] font-medium leading-none tracking-[-0.03em] ${npsScore !== null && npsScore < 30 ? "text-px-danger" : "text-px-ink"}`}>{npsScore !== null ? npsScore : "Sem dados"}</p>
                <p className="mt-1.5 text-[12.5px] text-px-muted">{faixa}</p>
              </div>
              {aut.google_rating > 0 && (
                <div className="text-right">
                  <p className="text-[13px] text-px-muted">Google</p>
                  <p className="text-[24px] font-medium text-px-ink">{aut.google_rating}/5</p>
                  {aut.google_link && /^https?:\/\//i.test(aut.google_link) && (
                    <a href={aut.google_link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-px-accent underline underline-offset-2">Ver perfil</a>
                  )}
                </div>
              )}
            </div>
            {serie.some(s => s.valor !== null) && <LineSeries data={serie} label="Evolução do NPS nos últimos 6 meses" min={-100} max={100} />}
          </Panel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Kpi label="Depoimentos na semana" value={String(aut.depoimentos_semana)} sub="coletados esta semana" />
            <Kpi label="Indicações ativas" value={String(aut.indicacoes_ativas)} sub="programa de indicação" />
          </div>

          <Panel as="section" className="space-y-3">
            <h3 className={titulo}>Novidades da semana</h3>
            {sinais.length === 0
              ? <p className="text-[13.5px] text-px-ink/80">Preencha seus dados em Editar dados para ver as novidades.</p>
              : <Sinais itens={sinais} />}
          </Panel>

          <div className="flex flex-wrap gap-2">
            <PxButton variant="secondary" href="/nps">Enviar pesquisa NPS</PxButton>
            <PxButton variant="secondary" href="/nps">Gerar depoimento com IA</PxButton>
            <PxButton variant="secondary" href="/indicacoes">Ver indicações</PxButton>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ExecutivoPage() {
  const appCtx    = useAppContext()
  const [aba,     setAba]     = useState<AbaId>("marketing")
  const [exec,    setExec]    = useState<Partial<ExecData>>({})
  const [loading, setLoading] = useState(true)
  const [erro,    setErro]    = useState<string | null>(null)
  const [mktg,    setMktg]    = useState<MarketingManual>(MKTG_DEFAULT)
  const [ops,     setOps]     = useState<OperacaoManual>(OPS_DEFAULT)
  const [aut,     setAut]     = useState<AutoridadeManual>(AUT_DEFAULT)

  const [analiseMes,     setAnaliseMes]     = useState<string | null>(null)
  const [erroAnalise,    setErroAnalise]    = useState("")
  const [loadingAnalise, setLoadingAnalise] = useState(false)

  const [pergunta,         setPergunta]         = useState("")
  const [voiceConsent,     setVoiceConsent]     = useState<boolean | null>(null)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [isRecording,      setIsRecording]      = useState(false)
  const [isTranscribing,   setIsTranscribing]   = useState(false)
  const [hasMediaRecorder, setHasMediaRecorder] = useState(false)
  const [erroVoz,          setErroVoz]          = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  const montado          = useRef(true)

  const carregarDados = useCallback(() => {
    setLoading(true)
    setErro(null)
    fetch("/api/executivo")
      .then(r => {
        if (!r.ok) throw new Error(`Erro ${r.status}`)
        return r.json() as Promise<ExecData>
      })
      .then(d => setExec(d))
      .catch(e => { console.error("[executivo] erro ao carregar:", e); setErro("Falha ao carregar dados executivos. Tente novamente.") })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setMktg(getLocalStorage("exec_mktg", MKTG_DEFAULT))
    setOps(getLocalStorage("exec_ops", OPS_DEFAULT))
    setAut(getLocalStorage("exec_aut", AUT_DEFAULT))
    carregarDados()
  }, [carregarDados])

  useEffect(() => {
    setHasMediaRecorder(typeof MediaRecorder !== "undefined" && !!navigator?.mediaDevices?.getUserMedia)
  }, [])

  useEffect(() => { setVoiceConsent(appCtx?.perfil?.voz_gravacao_autorizada ?? false) }, [appCtx?.perfil])

  // Ao sair da página, solta o microfone e descarta a gravação em andamento
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
      const rec = mediaRecorderRef.current
      if (rec) rec.onstop = null
      if (rec && rec.state !== "inactive") rec.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Sinais do mês: calculados aqui, sem IA
  const sinais = useMemo(() => {
    const items: Sinal[] = []
    const fat = exec.faturamento_mes ?? 0
    const con = exec.consultas_mes   ?? 0
    if (fat > 0 && con > 0)
      items.push({ tipo: "info", texto: `Ticket estimado: ${fmt(Math.round(fat / con))} por consulta, com ${fmt(fat)} de receita em ${con} consulta${con !== 1 ? "s" : ""}.` })

    const parados = (exec.leads_por_estagio ?? [])
      .filter(e => e.estagio === "Contato Feito" || e.estagio === "Qualificado")
      .reduce((s, e) => s + e.count, 0)
    const totalLeads = exec.leads_total ?? 0
    if (parados > 0)
      items.push({ tipo: "warn", texto: `${parados} lead${parados !== 1 ? "s" : ""} parado${parados !== 1 ? "s" : ""} no funil, em Contato Feito ou Qualificado, sem avançar.` })
    else if (totalLeads > 0)
      items.push({ tipo: "ok", texto: "Nenhum lead parado no funil." })

    const topOrigem = [...(exec.leads_origem ?? [])].filter(o => o.count > 0).sort((a, b) => b.count - a.count)[0]
    if (topOrigem && totalLeads > 0)
      items.push({ tipo: "info", texto: `${topOrigem.origem} é a principal origem de leads: ${topOrigem.count} de ${totalLeads} (${Math.round(topOrigem.count / totalLeads * 100)}%).` })

    const pacientes = (exec.leads_por_estagio ?? []).find(e => e.estagio === "Paciente")?.count ?? 0
    if (totalLeads > 0)
      items.push({ tipo: "info", texto: `Conversão de lead em paciente: ${Math.round(pacientes / totalLeads * 100)}%, ${pacientes} de ${totalLeads} lead${totalLeads !== 1 ? "s" : ""}.` })
    return items
  }, [exec])

  const gerarAnalise = async () => {
    setLoadingAnalise(true); setErroAnalise("")
    try {
      const res  = await fetch("/api/executivo/analise-mes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pergunta: pergunta.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({})) as { analise?: string; error?: string }
      if (!res.ok || data.error || !data.analise) throw new Error(data.error ?? `Erro ${res.status}`)
      setAnaliseMes(data.analise)
    } catch (e) {
      console.error("[executivo] gerarAnalise:", e)
      setErroAnalise("Não foi possível gerar a análise agora. Tente novamente.")
    } finally { setLoadingAnalise(false) }
  }

  async function aceitarConsentimento() {
    const res = await fetch("/api/perfil", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ voz_gravacao_autorizada: true }),
    }).catch(() => null)
    if (!res || !res.ok) {
      setShowConsentModal(false)
      setErroVoz("Não foi possível registrar o consentimento. Tente novamente.")
      return
    }
    appCtx?.refetchPerfil()
    setVoiceConsent(true)
    setShowConsentModal(false)
    iniciarGravacao()
  }

  function handleMicClick() {
    setErroVoz("")
    if (isRecording) { pararGravacao(); return }
    if (!voiceConsent) { setShowConsentModal(true); return }
    iniciarGravacao()
  }

  async function iniciarGravacao() {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : ""
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      audioChunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: rec.mimeType || "audio/webm" })
        await transcrever(blob)
      }
      rec.start()
      mediaRecorderRef.current = rec
      setIsRecording(true)
    } catch (e) {
      console.error("[executivo] microfone:", e)
      setErroVoz("Não foi possível acessar o microfone. Verifique a permissão do navegador.")
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  async function transcrever(blob: Blob) {
    setIsTranscribing(true)
    try {
      const mimeType = blob.type || "audio/webm"
      const ext      = mimeType.includes("mp4") ? "mp4" : "webm"
      const form     = new FormData()
      form.append("audio", blob, `gravacao.${ext}`)
      const res  = await fetch("/api/copiloto/transcricao", { method: "POST", body: form })
      const data = await res.json() as { text?: string; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro na transcrição")
      const texto = data.text?.trim() ?? ""
      if (texto && montado.current) setPergunta(prev => prev ? prev + " " + texto : texto)
    } catch (e) {
      console.error("[executivo] transcrição:", e)
      if (montado.current) setErroVoz("Não foi possível transcrever o áudio. Tente novamente ou digite a pergunta.")
    } finally { if (montado.current) setIsTranscribing(false) }
  }

  const saveMktg = useCallback((m: MarketingManual) => { setMktg(m); return setLocalStorage("exec_mktg", m) }, [])
  const saveOps  = useCallback((o: OperacaoManual)  => { setOps(o);  return setLocalStorage("exec_ops",  o) }, [])
  const saveAut  = useCallback((a: AutoridadeManual) => { setAut(a); return setLocalStorage("exec_aut",  a) }, [])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Painel Executivo" />
        <p role="status" className="px-4 py-24 text-center text-[13.5px] text-px-muted md:px-10">Carregando os dados da clínica</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Painel Executivo" />
        <div className="px-4 py-24 text-center md:px-10">
          <p role="alert" className="mb-3 text-[14px] font-semibold text-px-ink">{erro}</p>
          <PxButton variant="secondary" onClick={carregarDados}>Tentar de novo</PxButton>
        </div>
      </div>
    )
  }

  const receita6m = (exec.faturamento_6m ?? []).map(m => ({ rotulo: m.mes, valor: m.valor }))

  return (
    <div className="animate-fade-in">
      <PageHeader title="Painel Executivo" caption={getNow()} actions={<PxButton variant="secondary" size="sm" href="/diagnostico">Diagnóstico 360</PxButton>} />

      <div className="max-w-6xl space-y-4 px-4 pb-10 md:px-10">

        {/* Análise do mês */}
        <Panel as="section" className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <PxInput aria-label="Contexto ou pergunta para a análise do mês" value={pergunta} onChange={e => setPergunta(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !loadingAnalise) gerarAnalise() }}
              placeholder="Contexto ou pergunta para a análise (opcional)" className="flex-1" />
            <div className="flex gap-2">
              {hasMediaRecorder && (
                <PxButton variant="secondary" leftIcon={isRecording ? MicOff : Mic} onClick={handleMicClick} disabled={isTranscribing}>
                  {isRecording ? "Parar gravação" : "Gravar por voz"}
                </PxButton>
              )}
              <PxButton onClick={gerarAnalise} loading={loadingAnalise}>{loadingAnalise ? "Analisando" : "Analisar mês"}</PxButton>
            </div>
          </div>
          {isRecording && <p role="status" className="text-[12.5px] text-px-ink">Gravando. Clique em Parar gravação quando terminar.</p>}
          {isTranscribing && <p role="status" className="text-[12.5px] text-px-muted">Transcrevendo o áudio</p>}
          {erroVoz && <p role="alert" className="text-[13px] text-px-danger">{erroVoz}</p>}
          {erroAnalise && <p role="alert" className="text-[13px] text-px-danger">{erroAnalise}</p>}
        </Panel>

        {analiseMes !== null && (
          <Panel as="section" className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className={titulo}>Análise do mês</h2>
              <PxButton variant="quiet" size="sm" onClick={() => setAnaliseMes(null)}>Fechar</PxButton>
            </div>
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink/85">{analiseMes}</p>
          </Panel>
        )}

        {/* Números principais */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="Leads no CRM"   value={String(exec.leads_total ?? 0)}   sub={`+${exec.leads_semana ?? 0} esta semana`} />
          <Kpi label="Consultas no mês" value={String(exec.consultas_mes ?? 0)} sub="agenda registrada" />
          <Kpi label="Score NPS"      value={exec.nps_score !== null && exec.nps_score !== undefined ? String(exec.nps_score) : "Sem dados"} sub="satisfação dos pacientes" />
          <Kpi label="Seguidores"     value={mktg.seguidores.toLocaleString("pt-BR")} sub={`+${mktg.ganho_semanal} por semana, dado informado`} />
        </div>

        {sinais.length > 0 && (
          <Panel as="section" className="space-y-3">
            <h2 className={titulo}>Sinais do mês</h2>
            <Sinais itens={sinais} />
          </Panel>
        )}

        {receita6m.some(m => m.valor > 0) && (
          <Panel as="section" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className={titulo}>Receita nos últimos 6 meses</h2>
              <p className="text-[13px] text-px-muted"><span className="font-semibold text-px-ink">{fmt(exec.faturamento_mes ?? 0)}</span> neste mês</p>
            </div>
            <PillBars data={receita6m} label="Receita mensal nos últimos 6 meses" format={fmt} />
          </Panel>
        )}

        <Segmented label="Área" value={aba} onChange={setAba} options={ABAS} />

        {aba === "marketing"  && <AbaMarketing mktg={mktg} onSave={saveMktg} />}
        {aba === "comercial"  && <AbaComercial exec={exec} />}
        {aba === "operacao"   && <AbaOperacao ops={ops} onSave={saveOps} exec={exec} />}
        {aba === "autoridade" && <AbaAutoridade exec={exec} aut={aut} onSave={saveAut} />}
      </div>

      <PxModal open={showConsentModal} onClose={() => setShowConsentModal(false)} title="Autorizar gravação de voz">
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-px-ink/85">
            Sua fala será enviada ao serviço <strong>Groq Whisper</strong> para transcrição automática. O áudio <strong>não é armazenado</strong>; somente o texto transcrito é usado como contexto da análise.
          </p>
          <p className="text-[12.5px] leading-relaxed text-px-muted">Consentimento LGPD. Você pode revogá-lo a qualquer momento nas Configurações do perfil.</p>
          <div className="flex gap-2 pt-1">
            <PxButton variant="secondary" fullWidth onClick={() => setShowConsentModal(false)}>Cancelar</PxButton>
            <PxButton fullWidth onClick={aceitarConsentimento}>Autorizar e gravar</PxButton>
          </div>
        </div>
      </PxModal>
    </div>
  )
}
