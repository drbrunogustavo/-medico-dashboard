"use client"

import { useState } from "react"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"
import {
  FileBarChart, Play, Loader2, Download, TrendingUp,
  DollarSign, Users, Star, Lightbulb, AlertTriangle,
  Target, CheckCircle2, BarChart3, FileText,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Metricas {
  totalLeads:       number
  leadsConvertidos: number
  taxaConversao:    number
  totalReceitas:    number
  totalDespesas:    number
  lucroLiquido:     number
  npsScore:         number | null
  npsMedia:         string
  npsNotas:         number
  pautasCriadas:    number
  pautasPublicadas: number
  origemLeads:      Record<string, number>
}

interface Analise {
  resumoExecutivo: string
  financeiro:      { avaliacao: string; pontosFortes: string[]; atencao: string }
  marketing:       { avaliacao: string; pontosFortes: string[]; atencao: string }
  clinico:         { avaliacao: string; pontosFortes: string[]; atencao: string }
  destaques:       string[]
  pontosAtencao:   string[]
  recomendacoes:   string[]
}

interface Relatorio {
  mes:      number
  ano:      number
  metricas: Metricas
  analise:  Analise
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
]

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtN(v: number) {
  return v.toLocaleString("pt-BR")
}

const LOADING_MSGS = [
  "Coletando dados do mês...",
  "Analisando leads e conversões...",
  "Processando indicadores financeiros...",
  "Avaliando NPS e relacionamento...",
  "Consultando IA estratégica...",
  "Gerando insights personalizados...",
  "Finalizando recomendações...",
]

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, color, children }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ background: `${color}08`, borderBottom: "1px solid var(--border)" }}>
        <Icon style={{ width: 15, height: 15, color }} />
        <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{title}</span>
      </div>
      <div className="p-5" style={{ background: "var(--card)" }}>{children}</div>
    </div>
  )
}

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl text-center"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="text-[18px] font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] font-mono mt-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  )
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-1.5 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
          {item}
        </li>
      ))}
    </ul>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RelatorioPage() {
  const now   = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [relatorio,  setRelatorio]  = useState<Relatorio | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0])
  const [error,      setError]      = useState<string | null>(null)

  async function gerar() {
    setLoading(true)
    setError(null)
    setRelatorio(null)

    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[i])
    }, 1800)

    try {
      const res  = await fetch("/api/relatorio", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mes, ano }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setRelatorio(data)
    } catch (e) {
      console.error("[relatorio] erro ao gerar relatório:", e)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  function exportar() {
    window.print()
  }

  const r = relatorio
  const m = r?.metricas

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Relatório Mensal" />
      <div className="p-4 md:p-8 space-y-6 print:p-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)" }}>
            <FileBarChart style={{ width: 16, height: 16, color: "#a78bfa" }} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>Relatório Mensal</h1>
            <p className="text-[11px] font-mono tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
              PRAXIS EXECUTIVO · ANÁLISE AUTOMÁTICA COM IA
            </p>
          </div>
        </div>
        {r && (
          <button onClick={exportar}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa" }}>
            <Download style={{ width: 13, height: 13 }} />
            Exportar PDF
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 print:hidden">
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Mês</label>
          <select
            value={mes}
            onChange={e => setMes(parseInt(e.target.value))}
            className="px-3 py-2 rounded-xl text-[13px] outline-none appearance-none"
            style={{
              background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--text-primary)", minWidth: 140,
            }}>
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Ano</label>
          <select
            value={ano}
            onChange={e => setAno(parseInt(e.target.value))}
            className="px-3 py-2 rounded-xl text-[13px] outline-none appearance-none"
            style={{
              background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--text-primary)", minWidth: 100,
            }}>
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={gerar}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl text-[13px] font-bold disabled:opacity-50 transition-all hover:opacity-80"
          style={{ background: "#a78bfa", color: "#080808" }}>
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Play style={{ width: 14, height: 14 }} />
          }
          {loading ? "Gerando..." : "Gerar Relatório"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertTriangle style={{ width: 16, height: 16, color: "#ef4444", flexShrink: 0 }} />
          <p className="text-[13px]" style={{ color: "#f87171" }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)" }}>
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#a78bfa" }} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: "var(--text-secondary)" }}>{loadingMsg}</p>
          <div className="flex gap-1">
            {LOADING_MSGS.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background: loadingMsg === LOADING_MSGS[i] ? "#a78bfa" : "var(--border)",
                  transform:  loadingMsg === LOADING_MSGS[i] ? "scale(1.3)" : "scale(1)",
                }} />
            ))}
          </div>
        </div>
      )}

      {/* Report */}
      {r && m && (
        <div className="space-y-5">
          {/* Print header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-[22px] font-bold">Relatório Mensal PRAXIS</h1>
            <p className="text-[14px] text-gray-500">{MESES[r.mes - 1]} de {r.ano}</p>
            <hr className="mt-3" />
          </div>

          {/* Resumo Executivo */}
          <Section icon={BarChart3} title="Resumo Executivo" color="#a78bfa">
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {r.analise.resumoExecutivo}
            </p>
          </Section>

          {/* KPIs rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <MetricPill label="Receita"      value={fmtBRL(m.totalReceitas)}   color="#00c07f" />
            <MetricPill label="Lucro Liq."   value={fmtBRL(m.lucroLiquido)}    color={m.lucroLiquido >= 0 ? "#00c07f" : "#ef4444"} />
            <MetricPill label="Leads"        value={fmtN(m.totalLeads)}         color="#3b7fff" />
            <MetricPill label="Conversão"    value={`${m.taxaConversao}%`}      color="#3b7fff" />
            <MetricPill label="NPS"          value={m.npsScore !== null ? `${m.npsScore}` : "N/A"} color="#d4af37" />
            <MetricPill label="Pautas pub."  value={fmtN(m.pautasPublicadas)}   color="#a78bfa" />
          </div>

          {/* Financeiro */}
          <Section icon={DollarSign} title="Financeiro" color="#00c07f">
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              {r.analise.financeiro.avaliacao}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <MetricPill label="Receita bruta" value={fmtBRL(m.totalReceitas)} color="#00c07f" />
              <MetricPill label="Despesas"      value={fmtBRL(m.totalDespesas)} color="#ef4444" />
              <MetricPill label="Lucro líquido" value={fmtBRL(m.lucroLiquido)}  color={m.lucroLiquido >= 0 ? "#00c07f" : "#ef4444"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-mono font-semibold mb-1" style={{ color: "#00c07f" }}>PONTOS FORTES</p>
                <BulletList items={r.analise.financeiro.pontosFortes} color="#00c07f" />
              </div>
              <div>
                <p className="text-[11px] font-mono font-semibold mb-1" style={{ color: "#f59e0b" }}>ATENÇÃO</p>
                <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{r.analise.financeiro.atencao}</p>
              </div>
            </div>
          </Section>

          {/* Marketing */}
          <Section icon={TrendingUp} title="Marketing e Leads" color="#3b7fff">
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              {r.analise.marketing.avaliacao}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <MetricPill label="Total leads"   value={fmtN(m.totalLeads)}         color="#3b7fff" />
              <MetricPill label="Convertidos"   value={fmtN(m.leadsConvertidos)}    color="#00c07f" />
              <MetricPill label="Taxa conv."    value={`${m.taxaConversao}%`}        color="#3b7fff" />
            </div>
            {Object.keys(m.origemLeads).length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-mono font-semibold mb-2" style={{ color: "var(--text-muted)" }}>ORIGEM DOS LEADS</p>
                <div className="space-y-1.5">
                  {Object.entries(m.origemLeads).sort((a,b)=>b[1]-a[1]).map(([origem, qtd]) => {
                    const pct = m.totalLeads > 0 ? Math.round((qtd / m.totalLeads) * 100) : 0
                    return (
                      <div key={origem} className="flex items-center gap-3">
                        <span className="text-[12px] w-28 truncate" style={{ color: "var(--text-secondary)" }}>{origem}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#3b7fff" }} />
                        </div>
                        <span className="text-[11px] font-mono w-8 text-right" style={{ color: "var(--text-muted)" }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-mono font-semibold mb-1" style={{ color: "#3b7fff" }}>PONTOS FORTES</p>
                <BulletList items={r.analise.marketing.pontosFortes} color="#3b7fff" />
              </div>
              <div>
                <p className="text-[11px] font-mono font-semibold mb-1" style={{ color: "#f59e0b" }}>OPORTUNIDADE</p>
                <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{r.analise.marketing.atencao}</p>
              </div>
            </div>
          </Section>

          {/* Clínico / NPS */}
          <Section icon={Star} title="Clínico · NPS" color="#d4af37">
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              {r.analise.clinico.avaliacao}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <MetricPill label="NPS Score"     value={m.npsScore !== null ? `${m.npsScore}` : "N/A"} color="#d4af37" />
              <MetricPill label="Nota média"    value={m.npsMedia}     color="#d4af37" />
              <MetricPill label="Respostas"     value={fmtN(m.npsNotas)} color="#d4af37" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-mono font-semibold mb-1" style={{ color: "#d4af37" }}>POSITIVO</p>
                <BulletList items={r.analise.clinico.pontosFortes} color="#d4af37" />
              </div>
              <div>
                <p className="text-[11px] font-mono font-semibold mb-1" style={{ color: "#f59e0b" }}>ATENÇÃO</p>
                <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{r.analise.clinico.atencao}</p>
              </div>
            </div>
          </Section>

          {/* Destaques + Atenção + Recomendações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Section icon={CheckCircle2} title="Destaques do Mês" color="#00c07f">
              <BulletList items={r.analise.destaques} color="#00c07f" />
            </Section>
            <Section icon={AlertTriangle} title="Pontos de Atenção" color="#f59e0b">
              <BulletList items={r.analise.pontosAtencao} color="#f59e0b" />
            </Section>
            <Section icon={Lightbulb} title="Recomendações" color="#a78bfa">
              <BulletList items={r.analise.recomendacoes} color="#a78bfa" />
            </Section>
          </div>

          {/* Footer */}
          <div className="text-center py-4">
            <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
              Relatório gerado automaticamente pela PRAXIS IA · {MESES[r.mes - 1]} {r.ano}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!r && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <FileBarChart style={{ width: 28, height: 28, color: "#a78bfa" }} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: "var(--text-secondary)" }}>
            Selecione o mês e clique em <strong>Gerar Relatório</strong>
          </p>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            A IA vai analisar seus dados e gerar um relatório completo em segundos
          </p>
        </div>
      )}
      </div>
    </div>
  )
}