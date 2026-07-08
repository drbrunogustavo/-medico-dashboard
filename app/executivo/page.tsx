"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts"
import {
  BarChart3, Users, Star, Calendar, TrendingUp,
  Loader2, Megaphone, ShoppingBag, Cog, Award,
  ArrowDown, ChevronRight, UserPlus, AlertCircle, Zap,
  Edit3, Check, RefreshCw, MessageSquare, ThumbsUp,
  DollarSign, Clock, Repeat, Activity, Eye, Camera,
  Sparkles, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface TopPost {
  tema:       string
  formato:    string
  curtidas:   number
  comentarios: number
}

interface MarketingManual {
  seguidores:      number
  ganho_semanal:   number
  alcance_semanal: number
  alcance_ant:     number
  posts_mes:       number
  reels_mes:       number
  stories_mes:     number
  ultimo_post:     string
  horario_melhor:  string
  top3:            TopPost[]
}

interface OperacaoManual {
  ocupacao_pct:  number
  faltas_pct:    number
  ticket_medio:  number
  retorno_pct:   number
}

interface AutoridadeManual {
  google_rating:      number
  google_link:        string
  depoimentos_semana: number
  indicacoes_ativas:  number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

function getNow() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

function getLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const s = localStorage.getItem(key)
    return s ? (JSON.parse(s) as T) : fallback
  } catch { return fallback }
}

const MKTG_DEFAULT: MarketingManual = {
  seguidores: 0, ganho_semanal: 0, alcance_semanal: 0, alcance_ant: 0,
  posts_mes: 0, reels_mes: 0, stories_mes: 0,
  ultimo_post: "", horario_melhor: "19h",
  top3: [],
}

const OPS_DEFAULT: OperacaoManual = {
  ocupacao_pct: 0, faltas_pct: 0, ticket_medio: 0, retorno_pct: 0,
}

const AUT_DEFAULT: AutoridadeManual = {
  google_rating: 0, google_link: "", depoimentos_semana: 0, indicacoes_ativas: 0,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color = "text-accent",
}: { label: string; value: string; sub: string; icon: React.ElementType; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest leading-tight">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent-dim flex-shrink-0">
          <Icon className={cn("w-3.5 h-3.5", color)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
      <p className="text-[11px] text-text-muted">{sub}</p>
    </div>
  )
}

function InsightBullet({ text, type = "info" }: { text: string; type?: "info" | "warn" | "ok" }) {
  const colors = {
    info: "text-blue-700 bg-blue-50 border-blue-200",
    warn: "text-amber-700 bg-amber-50 border-amber-200",
    ok:   "text-green-700 bg-green-50 border-green-200",
  }
  const icons = { info: Zap, warn: AlertCircle, ok: Check }
  const Ic = icons[type]
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg px-3 py-2.5 border text-[12px] leading-relaxed", colors[type])}>
      <Ic className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  )
}

function EditableField({
  label, value, prefix = "", suffix = "",
  onChange,
}: {
  label: string; value: number; prefix?: string; suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-[12px] text-text-muted font-mono">{prefix}</span>}
        <input
          type="number"
          value={value || ""}
          onChange={e => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          className={cn(
            "w-full bg-background border border-border rounded-lg py-2 text-[13px] text-text-primary font-mono focus:outline-none focus:border-accent/50 transition-colors",
            prefix ? "pl-7 pr-3" : suffix ? "pl-3 pr-8" : "px-3",
          )}
        />
        {suffix && <span className="absolute right-3 text-[12px] text-text-muted font-mono">{suffix}</span>}
      </div>
    </div>
  )
}

// ─── ABA MARKETING ───────────────────────────────────────────────────────────

function AbaMarketing({ mktg, onSave }: {
  mktg: MarketingManual
  onSave: (m: MarketingManual) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState<MarketingManual>(mktg)

  // days since last post
  const diasSemPost = (() => {
    if (!mktg.ultimo_post) return null
    const diff = Date.now() - new Date(mktg.ultimo_post).getTime()
    return Math.floor(diff / 86400000)
  })()

  const alcanceDiff = mktg.alcance_ant > 0
    ? Math.round((mktg.alcance_semanal - mktg.alcance_ant) / mktg.alcance_ant * 100)
    : null

  function save() { onSave(draft); setEditing(false) }

  function updateTop3(i: number, field: keyof TopPost, val: string | number) {
    const arr = [...(draft.top3 ?? [])]
    if (!arr[i]) arr[i] = { tema: "", formato: "Reel", curtidas: 0, comentarios: 0 }
    arr[i] = { ...arr[i], [field]: val }
    setDraft(d => ({ ...d, top3: arr }))
  }

  return (
    <div className="space-y-6">
      {/* Header + edit button */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Marketing Digital</h2>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors">Cancelar</button>
            <button onClick={save} className="text-[12px] px-3 py-1.5 rounded-lg bg-accent/90 text-white font-semibold hover:bg-accent transition-colors flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Salvar
            </button>
          </div>
        ) : (
          <button onClick={() => { setDraft({ ...mktg }); setEditing(true) }}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> Editar dados
          </button>
        )}
      </div>

      {editing ? (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-5">
          <p className="text-[11px] text-text-muted">Insira seus dados do Instagram. Dados salvos localmente no navegador.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <EditableField label="Seguidores totais"       value={draft.seguidores}      onChange={v => setDraft(d => ({...d, seguidores: v}))} />
            <EditableField label="Ganho esta semana"       value={draft.ganho_semanal}   onChange={v => setDraft(d => ({...d, ganho_semanal: v}))} />
            <EditableField label="Alcance semanal"         value={draft.alcance_semanal} onChange={v => setDraft(d => ({...d, alcance_semanal: v}))} />
            <EditableField label="Alcance semana anterior" value={draft.alcance_ant}     onChange={v => setDraft(d => ({...d, alcance_ant: v}))} />
            <EditableField label="Posts no mês"            value={draft.posts_mes}       onChange={v => setDraft(d => ({...d, posts_mes: v}))} />
            <EditableField label="Reels no mês"            value={draft.reels_mes}       onChange={v => setDraft(d => ({...d, reels_mes: v}))} />
            <EditableField label="Stories no mês"          value={draft.stories_mes}     onChange={v => setDraft(d => ({...d, stories_mes: v}))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Data último post</label>
              <input type="date" value={draft.ultimo_post}
                onChange={e => setDraft(d => ({...d, ultimo_post: e.target.value}))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Melhor horário para publicar</label>
              <input type="text" value={draft.horario_melhor} placeholder="ex: 19h"
                onChange={e => setDraft(d => ({...d, horario_melhor: e.target.value}))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Top 3 Posts */}
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-3">Top 3 Posts do Mês</p>
            <div className="space-y-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-lg border border-border bg-background p-3 space-y-2">
                  <p className="text-[10px] font-mono text-text-muted">Post #{i + 1}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <input placeholder="Tema do post"
                        value={draft.top3?.[i]?.tema ?? ""}
                        onChange={e => updateTop3(i, "tema", e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-accent/50"
                      />
                    </div>
                    <select value={draft.top3?.[i]?.formato ?? "Reel"}
                      onChange={e => updateTop3(i, "formato", e.target.value)}
                      className="bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] text-text-primary focus:outline-none">
                      {["Reel","Carrossel","Stories","Foto"].map(f => <option key={f}>{f}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <input type="number" placeholder="❤️"
                        value={draft.top3?.[i]?.curtidas ?? ""}
                        onChange={e => updateTop3(i, "curtidas", Number(e.target.value))}
                        className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] text-text-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard label="Seguidores" value={mktg.seguidores.toLocaleString("pt-BR")}
              sub={`+${mktg.ganho_semanal} esta semana`} icon={Users} color="text-pink-600" />
            <StatCard label="Alcance Semanal" value={mktg.alcance_semanal.toLocaleString("pt-BR")}
              sub={alcanceDiff !== null ? `${alcanceDiff >= 0 ? "+" : ""}${alcanceDiff}% vs semana anterior` : "pessoas únicas alcançadas"} icon={Eye}
              color={alcanceDiff !== null && alcanceDiff < -10 ? "text-red-600" : "text-blue-600"} />
            <StatCard label="Posts no Mês" value={String(mktg.posts_mes)}
              sub={`${mktg.reels_mes} reels · ${mktg.stories_mes} stories`} icon={Camera} color="text-purple-600" />
          </div>

          {/* Diagnóstico IA */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-4">Diagnóstico IA</h3>
            <div className="space-y-2.5">
              {mktg.posts_mes === 0 ? (
                <InsightBullet text="Configure seus dados de marketing clicando em 'Editar dados' acima" type="info" />
              ) : (
                <>
                  {diasSemPost !== null && diasSemPost >= 3 && (
                    <InsightBullet text={`Não publicou há ${diasSemPost} dias — cada dia sem post reduz seu alcance orgânico em ~8%`} type="warn" />
                  )}
                  {diasSemPost !== null && diasSemPost < 2 && (
                    <InsightBullet text="Publicou hoje ou ontem — ótima consistência! Continue para manter o alcance crescendo" type="ok" />
                  )}
                  {alcanceDiff !== null && alcanceDiff < -15 && (
                    <InsightBullet text={`Alcance caiu ${Math.abs(alcanceDiff)}% em relação à semana anterior — publicar Reels hoje pode reverter a queda`} type="warn" />
                  )}
                  {alcanceDiff !== null && alcanceDiff >= 10 && (
                    <InsightBullet text={`Alcance cresceu ${alcanceDiff}% vs semana anterior — mantenha o ritmo de publicações`} type="ok" />
                  )}
                  {mktg.horario_melhor && (
                    <InsightBullet text={`Melhor horário para publicar: ${mktg.horario_melhor} — posts neste horário recebem até 2x mais engajamento`} type="info" />
                  )}
                  {mktg.posts_mes > 0 && mktg.posts_mes < 8 && (
                    <InsightBullet text={`Você publicou ${mktg.posts_mes} conteúdos este mês — abaixo de 12 posts/mês o algoritmo reduz seu alcance`} type="warn" />
                  )}
                  {mktg.reels_mes > 0 && mktg.reels_mes >= mktg.posts_mes * 0.4 && (
                    <InsightBullet text={`${mktg.reels_mes} Reels este mês — excelente! Reels têm 5x mais alcance que posts estáticos`} type="ok" />
                  )}
                  {mktg.alcance_semanal > 0 && mktg.seguidores > 0 && (
                    <InsightBullet
                      text={`Taxa de alcance: ${Math.round(mktg.alcance_semanal / mktg.seguidores * 100)}% dos seguidores — média saudável é 20%+`}
                      type={mktg.alcance_semanal / mktg.seguidores >= 0.2 ? "ok" : "info"} />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Top 3 Posts */}
          {(mktg.top3 ?? []).some(p => p.tema) && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-4">Top 3 Posts do Mês</h3>
              <div className="space-y-2.5">
                {(mktg.top3 ?? []).filter(p => p.tema).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-background border border-border px-3 py-2.5">
                    <span className="text-[11px] font-mono font-bold text-accent w-5 flex-shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-text-primary truncate">{p.tema}</p>
                      <p className="text-[10px] text-text-muted font-mono">{p.formato}</p>
                    </div>
                    {p.curtidas > 0 && (
                      <span className="text-[11px] font-mono text-text-secondary flex-shrink-0">❤️ {p.curtidas.toLocaleString("pt-BR")}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Criar Reel",          href: "/reels",      color: "text-red-600 bg-red-50 border-red-200" },
              { label: "Planejar Calendário", href: "/calendario", color: "text-blue-600 bg-blue-50 border-blue-200" },
              { label: "Ver Radar de Tendências", href: "/radar",  color: "text-accent bg-accent-dim border-accent-border" },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className={cn("rounded-xl border px-4 py-3 text-[12px] font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity", a.color)}>
                <ChevronRight className="w-3.5 h-3.5" />
                {a.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── ABA COMERCIAL ───────────────────────────────────────────────────────────

function AbaComercial({ exec }: { exec: Partial<ExecData> }) {
  const estagioPaciente  = exec.leads_por_estagio?.find(e => e.estagio === "Paciente")?.count ?? 0
  const leads            = exec.leads_total ?? 0
  const agendamentos     = exec.consultas_mes ?? 0
  const consultas        = Math.round(agendamentos * 0.85)
  const pacientesAtivos  = estagioPaciente

  const etapas = [
    { label: "Leads",              n: leads,           cor: "#b8976a" },
    { label: "Agendamentos",       n: agendamentos,    cor: "#c9a86c" },
    { label: "Consultas",          n: consultas,       cor: "#d9bc8e" },
    { label: "Pacientes Ativos",   n: pacientesAtivos, cor: "#e8d0b0" },
  ].filter(e => e.n >= 0)

  const maxN = Math.max(...etapas.map(e => e.n), 1)

  function pctConv(a: number, b: number) {
    if (!a) return "—"
    return `${Math.round(b / a * 100)}%`
  }

  const leadsParados = (exec.leads_por_estagio ?? [])
    .filter(e => e.estagio !== "Paciente" && e.estagio !== "Consulta Agendada")
    .reduce((s, e) => s + e.count, 0)

  const convTotal = leads > 0 ? Math.round(pacientesAtivos / leads * 100) : 0

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-text-primary">Funil Comercial</h2>

      {/* Funil visual */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-5">Jornada Lead → Paciente</h3>
        <div className="space-y-2">
          {etapas.map((e, i) => (
            <div key={e.label}>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-28 text-[11px] text-text-secondary font-medium flex-shrink-0">{e.label}</div>
                <div className="flex-1 relative h-8 rounded-lg overflow-hidden bg-background border border-border">
                  <div
                    className="h-full rounded-lg transition-all duration-700"
                    style={{ width: `${Math.max((e.n / maxN) * 100, e.n > 0 ? 8 : 0)}%`, background: e.cor }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-[12px] font-mono font-bold text-text-primary">{e.n}</span>
                </div>
              </div>
              {i < etapas.length - 1 && (
                <div className="flex items-center gap-1 ml-28 pl-3 mb-1">
                  <ArrowDown className="w-3 h-3 text-text-muted flex-shrink-0" />
                  <span className="text-[10px] font-mono text-text-muted">
                    {pctConv(e.n, etapas[i + 1].n)} de conversão
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-text-muted">Taxa de conversão total (leads → pacientes ativos)</span>
          <span className="text-lg font-bold text-text-primary font-mono">{convTotal}%</span>
        </div>
      </div>

      {/* Leads por estágio */}
      {(exec.leads_por_estagio ?? []).length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-4">Distribuição do CRM</h3>
          <div className="space-y-2.5">
            {(exec.leads_por_estagio ?? []).map((e, i) => {
              const colors = ["#b8976a","#3b7fff","#a855f7","#f59e0b","#ec4899"]
              return (
                <div key={e.estagio} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                  <span className="text-[12px] text-text-secondary flex-1 truncate">{e.estagio}</span>
                  <span className="text-[12px] font-mono font-semibold text-text-primary">{e.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-3">Insights Comerciais</h3>
        <div className="space-y-2.5">
          <InsightBullet
            text={`Conversão de leads: ${convTotal}% — a média de clínicas de alta performance é 15-20%`}
            type={convTotal >= 15 ? "ok" : convTotal >= 8 ? "info" : "warn"}
          />
          {leadsParados > 0 && (
            <InsightBullet
              text={`${leadsParados} leads no CRM aguardam follow-up — atuar agora pode gerar ${Math.round(leadsParados * 0.15)} novas consultas`}
              type="warn"
            />
          )}
          {agendamentos > 0 && (
            <InsightBullet
              text={`${agendamentos} agendamentos este mês — boa cadência de aquisição`}
              type="info"
            />
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/crm" className="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 text-[12px] font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Users className="w-3.5 h-3.5" /> Abrir CRM
        </Link>
        <Link href="/nutricao-leads" className="rounded-xl border border-border bg-surface text-text-secondary px-4 py-3 text-[12px] font-semibold flex items-center gap-2 hover:text-text-primary transition-colors">
          <MessageSquare className="w-3.5 h-3.5" /> Nutrir Leads
        </Link>
      </div>
    </div>
  )
}

// ─── ABA OPERAÇÃO ────────────────────────────────────────────────────────────

function AbaOperacao({ ops, onSave, exec }: {
  ops: OperacaoManual
  onSave: (o: OperacaoManual) => void
  exec: Partial<ExecData>
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState<OperacaoManual>(ops)

  function save() { onSave(draft); setEditing(false) }

  const ticketMedio = ops.ticket_medio > 0
    ? fmt(ops.ticket_medio)
    : (exec.faturamento_mes ?? 0) > 0 && (exec.consultas_mes ?? 0) > 0
      ? fmt(Math.round((exec.faturamento_mes ?? 0) / (exec.consultas_mes ?? 1)))
      : "—"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Operação da Clínica</h2>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors">Cancelar</button>
            <button onClick={save} className="text-[12px] px-3 py-1.5 rounded-lg bg-accent/90 text-white font-semibold hover:bg-accent transition-colors flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Salvar
            </button>
          </div>
        ) : (
          <button onClick={() => { setDraft(ops); setEditing(true) }}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> Editar dados
          </button>
        )}
      </div>

      {editing ? (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-[11px] text-text-muted mb-4">Insira os indicadores operacionais do mês atual</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditableField label="Ocupação da agenda %" value={draft.ocupacao_pct}  onChange={v => setDraft(d => ({...d, ocupacao_pct: Math.min(v, 100)}))} suffix="%" />
            <EditableField label="Taxa de faltas %"     value={draft.faltas_pct}    onChange={v => setDraft(d => ({...d, faltas_pct: Math.min(v, 100)}))} suffix="%" />
            <EditableField label="Ticket médio (R$)"    value={draft.ticket_medio}  onChange={v => setDraft(d => ({...d, ticket_medio: v}))} prefix="R$" />
            <EditableField label="Taxa de retorno %"    value={draft.retorno_pct}   onChange={v => setDraft(d => ({...d, retorno_pct: Math.min(v, 100)}))} suffix="%" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Ocupação Agenda" value={`${ops.ocupacao_pct}%`}
              sub="capacidade utilizada" icon={Calendar} color="text-accent" />
            <StatCard label="Taxa de Faltas" value={`${ops.faltas_pct}%`}
              sub="ausências no período" icon={Clock}
              color={ops.faltas_pct > 15 ? "text-red-600" : "text-green-600"} />
            <StatCard label="Ticket Médio" value={ticketMedio}
              sub="receita por consulta" icon={DollarSign} color="text-purple-600" />
            <StatCard label="Taxa de Retorno" value={`${ops.retorno_pct}%`}
              sub="pacientes que voltaram" icon={Repeat} color="text-blue-600" />
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-4">Consultas do Mês</h3>
            <div className="flex items-end gap-6">
              <div>
                <p className="text-3xl font-bold text-text-primary">{exec.consultas_mes ?? 0}</p>
                <p className="text-[11px] text-text-muted mt-1">consultas registradas</p>
              </div>
              {ops.ocupacao_pct > 0 && (
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-text-muted mb-1.5">
                    <span>Ocupação</span>
                    <span className="font-mono font-semibold text-text-primary">{ops.ocupacao_pct}%</span>
                  </div>
                  <div className="h-2 bg-background border border-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all duration-700"
                      style={{ width: `${ops.ocupacao_pct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-3">Insights Operacionais</h3>
            <div className="space-y-2.5">
              {ops.faltas_pct > 15 && (
                <InsightBullet text={`Taxa de faltas em ${ops.faltas_pct}% — acima de 15% indica necessidade de régua de confirmação`} type="warn" />
              )}
              {ops.faltas_pct > 0 && ops.faltas_pct <= 15 && (
                <InsightBullet text={`Taxa de faltas em ${ops.faltas_pct}% — dentro do padrão saudável (≤15%)`} type="ok" />
              )}
              {ops.ocupacao_pct > 0 && ops.ocupacao_pct < 70 && (
                <InsightBullet text={`Agenda com ${ops.ocupacao_pct}% de ocupação — há espaço para captar mais pacientes`} type="info" />
              )}
              {ops.ocupacao_pct >= 90 && (
                <InsightBullet text={`Agenda com ${ops.ocupacao_pct}% de ocupação — considere expandir horários ou criar lista de espera`} type="warn" />
              )}
              {ops.retorno_pct >= 40 && (
                <InsightBullet text={`Retorno de ${ops.retorno_pct}% — excelente fidelização de pacientes`} type="ok" />
              )}
              {ops.retorno_pct > 0 && ops.retorno_pct < 30 && (
                <InsightBullet text={`Retorno em ${ops.retorno_pct}% — estratégias de follow-up podem aumentar esse número`} type="info" />
              )}
              {ops.ocupacao_pct === 0 && ops.faltas_pct === 0 && (
                <InsightBullet text="Configure os dados operacionais clicando em 'Editar dados' acima" type="info" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── ABA AUTORIDADE ──────────────────────────────────────────────────────────

function AbaAutoridade({ exec, aut, onSave }: {
  exec: Partial<ExecData>
  aut: AutoridadeManual
  onSave: (a: AutoridadeManual) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState<AutoridadeManual>(aut)
  const [linkDraft, setLinkDraft] = useState(aut.google_link)

  function save() { onSave({ ...draft, google_link: linkDraft }); setEditing(false) }

  const npsScore = exec.nps_score ?? null
  const npsColor = npsScore === null ? "text-text-muted"
    : npsScore >= 70 ? "text-green-600"
    : npsScore >= 30 ? "text-amber-600"
    : "text-red-600"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Autoridade e Reputação</h2>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors">Cancelar</button>
            <button onClick={save} className="text-[12px] px-3 py-1.5 rounded-lg bg-accent/90 text-white font-semibold hover:bg-accent transition-colors flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Salvar
            </button>
          </div>
        ) : (
          <button onClick={() => { setDraft(aut); setLinkDraft(aut.google_link); setEditing(true) }}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> Editar dados
          </button>
        )}
      </div>

      {editing ? (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditableField label="Avaliação Google (0-5)" value={draft.google_rating} onChange={v => setDraft(d => ({...d, google_rating: Math.min(v, 5)}))} suffix="/5" />
            <EditableField label="Depoimentos esta semana" value={draft.depoimentos_semana} onChange={v => setDraft(d => ({...d, depoimentos_semana: v}))} />
            <EditableField label="Indicações ativas" value={draft.indicacoes_ativas} onChange={v => setDraft(d => ({...d, indicacoes_ativas: v}))} />
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Link Google Meu Negócio</label>
              <input
                value={linkDraft}
                onChange={e => setLinkDraft(e.target.value)}
                placeholder="https://g.page/..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* NPS destaque */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-3">Score NPS</h3>
                <p className={cn("text-5xl font-bold font-mono", npsColor)}>
                  {npsScore !== null ? npsScore : "—"}
                </p>
                <p className="text-[11px] text-text-muted mt-1">
                  {npsScore === null ? "Aguardando respostas"
                    : npsScore >= 70 ? "Excelente — zona de excelência"
                    : npsScore >= 30 ? "Bom — zona de qualidade"
                    : "Atenção — abaixo da média"}
                </p>
              </div>
              <div className="text-right space-y-2">
                {aut.google_rating > 0 && (
                  <div>
                    <p className="text-[10px] font-mono text-text-muted uppercase">Google</p>
                    <p className="text-xl font-bold text-amber-600">⭐ {aut.google_rating}/5</p>
                    {aut.google_link && (
                      <a href={aut.google_link} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-accent hover:underline">Ver perfil →</a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* NPS evolution chart */}
            {(exec.nps_6m ?? []).some(m => m.nps !== null) && (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={exec.nps_6m ?? []}>
                    <XAxis dataKey="mes" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[-100, 100]} hide />
                    <Tooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [v !== null && v !== undefined ? v : "—", "NPS"]}
                    />
                    <Line type="monotone" dataKey="nps" stroke="#b8976a" strokeWidth={2} dot={{ fill: "#b8976a", r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* KPIs autoridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Depoimentos (semana)" value={String(aut.depoimentos_semana)}
              sub="coletados esta semana" icon={ThumbsUp} color="text-green-600" />
            <StatCard label="Indicações Ativas" value={String(aut.indicacoes_ativas)}
              sub="programa member get member" icon={UserPlus} color="text-blue-600" />
            <StatCard label="Respostas NPS" value={String((exec.nps_6m ?? []).filter(m => m.nps !== null).length * 5)}
              sub="estimativa últimos 6 meses" icon={Star} color="text-amber-600" />
            <StatCard label="Score NPS" value={npsScore !== null ? String(npsScore) : "—"}
              sub="Net Promoter Score" icon={Activity} color={npsScore !== null && npsScore >= 70 ? "text-green-600" : "text-amber-600"} />
          </div>

          {/* Insights */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-3">Novidades da Semana</h3>
            <div className="space-y-2.5">
              {aut.depoimentos_semana > 0 && (
                <InsightBullet text={`Você recebeu ${aut.depoimentos_semana} novos depoimentos esta semana — compartilhe no Instagram`} type="ok" />
              )}
              {aut.indicacoes_ativas > 0 && (
                <InsightBullet text={`${aut.indicacoes_ativas} indicações ativas no programa — pacientes satisfeitos indicam em média 3 novos`} type="ok" />
              )}
              {npsScore !== null && npsScore < 30 && (
                <InsightBullet text="NPS abaixo de 30 — analise as respostas negativas e entre em contato com os detratores" type="warn" />
              )}
              {aut.depoimentos_semana === 0 && aut.indicacoes_ativas === 0 && (
                <InsightBullet text="Configure seus dados de autoridade clicando em 'Editar dados' acima" type="info" />
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/nps" className="rounded-xl border border-accent-border bg-accent-dim text-accent px-4 py-3 text-[12px] font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Star className="w-3.5 h-3.5" /> Enviar pesquisa NPS
            </Link>
            <Link href="/nps" className="rounded-xl border border-border bg-surface text-text-secondary px-4 py-3 text-[12px] font-semibold flex items-center gap-2 hover:text-text-primary transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" /> Gerar depoimento com IA
            </Link>
            <Link href="/indicacoes" className="rounded-xl border border-border bg-surface text-text-secondary px-4 py-3 text-[12px] font-semibold flex items-center gap-2 hover:text-text-primary transition-colors">
              <UserPlus className="w-3.5 h-3.5" /> Ver indicações
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ABAS: { id: AbaId; label: string; icon: React.ElementType }[] = [
  { id: "marketing",  label: "Marketing",  icon: Megaphone  },
  { id: "comercial",  label: "Comercial",  icon: ShoppingBag},
  { id: "operacao",   label: "Operação",   icon: Cog        },
  { id: "autoridade", label: "Autoridade", icon: Award      },
]

export default function ExecutivoPage() {
  const [aba,     setAba]     = useState<AbaId>("marketing")
  const [exec,    setExec]    = useState<Partial<ExecData>>({})
  const [loading, setLoading] = useState(true)
  const [mktg,    setMktg]    = useState<MarketingManual>(MKTG_DEFAULT)
  const [ops,     setOps]     = useState<OperacaoManual>(OPS_DEFAULT)
  const [aut,     setAut]     = useState<AutoridadeManual>(AUT_DEFAULT)

  const [analiseMes,     setAnaliseMes]     = useState<string | null>(null)
  const [loadingAnalise, setLoadingAnalise] = useState(false)

  useEffect(() => {
    setMktg(getLocalStorage("exec_mktg", MKTG_DEFAULT))
    setOps(getLocalStorage("exec_ops", OPS_DEFAULT))
    setAut(getLocalStorage("exec_aut", AUT_DEFAULT))

    fetch("/api/executivo")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setExec(d) })
      .catch(e => console.error("[executivo] erro ao carregar dados executivos:", e))
      .finally(() => setLoading(false))
  }, [])

  // ─── Sinais do mês — calculados no client, sem IA, sem especulação ──────────
  const sinais = useMemo(() => {
    const items: { tipo: "ok" | "warn" | "info"; texto: string }[] = []

    // 1. Ticket médio estimado
    const fat = exec.faturamento_mes ?? 0
    const con = exec.consultas_mes   ?? 0
    if (fat > 0 && con > 0) {
      items.push({
        tipo:  "info",
        texto: `Ticket estimado: ${fmt(Math.round(fat / con))}/consulta — ${fmt(fat)} de receita em ${con} consulta${con !== 1 ? "s" : ""}`,
      })
    }

    // 2. Leads parados no funil (Contato Feito + Qualificado)
    const parados = (exec.leads_por_estagio ?? [])
      .filter(e => e.estagio === "Contato Feito" || e.estagio === "Qualificado")
      .reduce((s, e) => s + e.count, 0)
    if (parados > 0) {
      items.push({
        tipo:  "warn",
        texto: `${parados} lead${parados !== 1 ? "s" : ""} parado${parados !== 1 ? "s" : ""} no funil — "Contato Feito" ou "Qualificado" sem avançar`,
      })
    } else if ((exec.leads_total ?? 0) > 0) {
      items.push({ tipo: "ok", texto: "Nenhum lead parado no funil — cadência de follow-up em dia" })
    }

    // 3. Principal origem de leads
    const totalLeads = exec.leads_total ?? 0
    const topOrigem  = [...(exec.leads_origem ?? [])]
      .filter(o => o.count > 0)
      .sort((a, b) => b.count - a.count)[0]
    if (topOrigem && totalLeads > 0) {
      const pct = Math.round(topOrigem.count / totalLeads * 100)
      items.push({
        tipo:  "info",
        texto: `${topOrigem.origem} é sua principal origem de leads — ${topOrigem.count} de ${totalLeads} (${pct}%)`,
      })
    }

    // 4. Taxa de conversão lead→paciente
    const pacientes = (exec.leads_por_estagio ?? []).find(e => e.estagio === "Paciente")?.count ?? 0
    if (totalLeads > 0) {
      const conv = Math.round(pacientes / totalLeads * 100)
      items.push({
        tipo:  conv >= 15 ? "ok" : conv >= 8 ? "info" : "warn",
        texto: `Conversão lead→paciente: ${conv}% — ${pacientes} de ${totalLeads} lead${totalLeads !== 1 ? "s" : ""} convertido${pacientes !== 1 ? "s" : ""}`,
      })
    }

    return items
  }, [exec])

  const gerarAnalise = async () => {
    setLoadingAnalise(true)
    try {
      const res  = await fetch("/api/executivo/analise-mes", { method: "POST" })
      const data = await res.json() as { analise?: string }
      setAnaliseMes(data.analise ?? "")
    } catch (e) { console.error("[executivo] gerarAnalise:", e) }
    finally { setLoadingAnalise(false) }
  }

  const saveMktg = useCallback((m: MarketingManual) => {
    setMktg(m)
    localStorage.setItem("exec_mktg", JSON.stringify(m))
  }, [])

  const saveOps = useCallback((o: OperacaoManual) => {
    setOps(o)
    localStorage.setItem("exec_ops", JSON.stringify(o))
  }, [])

  const saveAut = useCallback((a: AutoridadeManual) => {
    setAut(a)
    localStorage.setItem("exec_aut", JSON.stringify(a))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Painel Executivo" />
      {/* Header */}
      <div className="px-4 md:px-8 pt-4 md:pt-8 pb-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Centro de Comando</h1>
            <p className="text-[11px] text-text-muted mt-1 font-mono capitalize">{getNow()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={gerarAnalise}
              disabled={loadingAnalise}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:border-accent-border hover:text-accent transition-colors disabled:opacity-50"
            >
              {loadingAnalise ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-accent" />}
              Analisar mês
            </button>
            <Link href="/diagnostico"
              className="text-[12px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Diagnóstico 360°
            </Link>
          </div>
        </div>

        {analiseMes !== null && (
          <div className="mt-4 bg-card border border-accent-border rounded-lg p-5 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-[11px] font-mono text-accent tracking-widest uppercase">Análise do mês</span>
              </div>
              <button onClick={() => setAnaliseMes(null)} className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-[13px] text-text-primary leading-relaxed whitespace-pre-line">{analiseMes}</p>
          </div>
        )}

        {/* KPIs rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
          <StatCard label="Leads no CRM"    value={String(exec.leads_total ?? 0)} sub={`+${exec.leads_semana ?? 0} esta semana`}  icon={Users}    color="text-blue-600" />
          <StatCard label="Consultas/Mês"   value={String(exec.consultas_mes ?? 0)} sub="agenda registrada"                       icon={Calendar} color="text-accent" />
          <StatCard label="Score NPS"       value={exec.nps_score !== null && exec.nps_score !== undefined ? String(exec.nps_score) : "—"} sub="satisfação" icon={Star}  color="text-amber-600" />
          <StatCard label="Seguidores"      value={mktg.seguidores.toLocaleString("pt-BR")} sub={`+${mktg.ganho_semanal}/semana`} icon={TrendingUp} color="text-pink-600" />
        </div>
      </div>

      {/* ── Sinais do mês (calculados, sem IA) + tendência de receita ──────── */}
      <div className="px-4 md:px-8 pb-4 space-y-4">

        {/* Sinais do mês */}
        {sinais.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3">Sinais do mês</p>
            <div className="space-y-2">
              {sinais.map((s, i) => (
                <InsightBullet key={i} text={s.texto} type={s.tipo} />
              ))}
            </div>
          </div>
        )}

        {/* Tendência de receita — faturamento_6m */}
        {(exec.faturamento_6m ?? []).some(m => m.valor > 0) && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest">Receita — últimos 6 meses</p>
              <p className="text-[11px] font-mono font-semibold text-text-primary">
                {fmt(exec.faturamento_mes ?? 0)}
                <span className="text-text-muted font-normal"> este mês</span>
              </p>
            </div>
            <ResponsiveContainer width="100%" height={88}>
              <BarChart data={exec.faturamento_6m ?? []} barSize={18}>
                <XAxis
                  dataKey="mes"
                  tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(v) => [typeof v === "number" ? fmt(v) : "—", "Receita"]}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {(exec.faturamento_6m ?? []).map((entry, i, arr) => (
                    <Cell
                      key={i}
                      fill={i === arr.length - 1 ? "var(--accent)" : "var(--border-hover)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tab pills */}
      <div className="px-4 md:px-8 pb-2">
        <div className="flex items-center gap-1 md:gap-2 border-b border-border pb-0 overflow-x-auto scrollbar-none">
          {ABAS.map(a => {
            const active = aba === a.id
            return (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-all -mb-px",
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-secondary hover:border-border"
                )}
              >
                <a.icon className="w-3.5 h-3.5" />
                {a.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-8 pt-4 md:pt-6">
        {aba === "marketing"  && <AbaMarketing mktg={mktg} onSave={saveMktg} />}
        {aba === "comercial"  && <AbaComercial exec={exec} />}
        {aba === "operacao"   && <AbaOperacao ops={ops} onSave={saveOps} exec={exec} />}
        {aba === "autoridade" && <AbaAutoridade exec={exec} aut={aut} onSave={saveAut} />}
      </div>
    </div>
  )
}
