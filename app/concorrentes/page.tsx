"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  BarChart2, TrendingUp, Target, Shield, Lightbulb, Eye,
  Copy, Check, Loader2, BookmarkPlus, Users, AlertTriangle,
  RefreshCw, ChevronRight,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoAnalise = "estrategia" | "posicionamento" | "pontos_fracos" | "completa"
type Prioridade  = "Alta" | "Média" | "Baixa"

interface FormatoConteudo {
  tipo:       string
  percentual: string
  observacao: string
}

interface VisaoGeral {
  resumo:                  string
  seguidores_estimados:    string
  frequencia_posting:      string
  formatos_principais:     string[]
  especialidade_percebida: string
}

interface EstrategiaConteudo {
  frequencia:        string
  formatos:          FormatoConteudo[]
  temas_recorrentes: string[]
  ganchos_tipicos:   string[]
  analise_geral:     string
}

interface Posicionamento {
  proposta_valor:       string
  publico_alvo:         string
  tom_comunicacao:      string
  diferenciais:         string[]
  comparacao_com_voce:  string
}

interface PontoFraco {
  gap:             string
  oportunidade:    string
  como_aproveitar: string
  prioridade:      Prioridade
}

interface Recomendacao {
  acao:              string
  justificativa:     string
  formato_sugerido:  string
  prioridade:        Prioridade
}

interface AnaliseResult {
  visao_geral:        VisaoGeral
  estrategia_conteudo: EstrategiaConteudo
  posicionamento:     Posicionamento
  pontos_fracos:      PontoFraco[]
  recomendacoes:      Recomendacao[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS: Record<TipoAnalise, { label: string; desc: string; Icon: React.ElementType }> = {
  estrategia:     { label: "Estratégia de Conteúdo", desc: "Frequência, formatos e temas",  Icon: TrendingUp },
  posicionamento: { label: "Posicionamento",          desc: "Diferenciais, público e tom",   Icon: Target     },
  pontos_fracos:  { label: "Pontos Fracos",           desc: "Gaps e oportunidades de ataque", Icon: Shield    },
  completa:       { label: "Análise Completa",        desc: "Todas as dimensões em detalhe",  Icon: BarChart2 },
}

const PRIO_STYLE: Record<Prioridade, string> = {
  Alta:  "bg-red-950/60 border-red-500/40 text-red-400",
  Média: "bg-amber-950/60 border-amber-500/40 text-amber-400",
  Baixa: "bg-blue-950/60 border-blue-500/40 text-blue-400",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800) }}
      className={cn(
        "flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all flex-shrink-0",
        done
          ? "bg-accent-dim border-accent-border text-accent"
          : "border-border text-text-muted hover:border-accent-border hover:text-accent",
        className,
      )}
    >
      {done ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {done ? "Copiado" : "Copiar"}
    </button>
  )
}

function PrioBadge({ p }: { p: Prioridade }) {
  return (
    <span className={cn(
      "text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border flex-shrink-0",
      PRIO_STYLE[p],
    )}>
      {p}
    </span>
  )
}

function SectionHeader({
  icon: Icon, emoji, title, copyText,
}: {
  icon: React.ElementType; emoji: string; title: string; copyText: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-accent" />
        </div>
        <h3
          className="text-[15px] font-semibold text-text-primary"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {emoji} {title}
        </h3>
      </div>
      <CopyBtn text={copyText} />
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[
        { w: "w-36" }, { w: "w-48" }, { w: "w-40" }, { w: "w-44" }, { w: "w-52" },
      ].map(({ w }, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-accent/[0.07]" />
            <div className={cn("h-4 bg-border rounded", w)} />
          </div>
          <div className="space-y-2.5">
            <div className="h-3 bg-border rounded w-full" />
            <div className="h-3 bg-border rounded w-5/6" />
            <div className="h-3 bg-border rounded w-4/6" />
            {i >= 3 && (
              <>
                <div className="h-3 bg-border rounded w-full mt-1" />
                <div className="h-3 bg-border rounded w-3/4" />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Text serializers for copy ────────────────────────────────────────────────

function toTextVisaoGeral(v: VisaoGeral) {
  return `VISÃO GERAL\n\n${v.resumo}\n\nSeguidores: ${v.seguidores_estimados}\nFrequência: ${v.frequencia_posting}\nFormatos: ${v.formatos_principais.join(", ")}\nEspecialidade: ${v.especialidade_percebida}`
}
function toTextEstrategia(e: EstrategiaConteudo) {
  return `ESTRATÉGIA DE CONTEÚDO\n\nFrequência: ${e.frequencia}\n\nFormatos:\n${e.formatos.map(f => `- ${f.tipo} (${f.percentual}): ${f.observacao}`).join("\n")}\n\nTemas:\n${e.temas_recorrentes.map(t => `- ${t}`).join("\n")}\n\nGanchos:\n${e.ganchos_tipicos.map(g => `- ${g}`).join("\n")}\n\nAnálise: ${e.analise_geral}`
}
function toTextPosicionamento(p: Posicionamento) {
  return `POSICIONAMENTO\n\nProposta de valor: ${p.proposta_valor}\nPúblico-alvo: ${p.publico_alvo}\nTom: ${p.tom_comunicacao}\n\nDiferenciais:\n${p.diferenciais.map(d => `- ${d}`).join("\n")}\n\nComparação: ${p.comparacao_com_voce}`
}
function toTextPontosFragcos(pf: PontoFraco[]) {
  return `PONTOS FRACOS / OPORTUNIDADES\n\n${pf.map((p, i) => `${i + 1}. ${p.gap} [${p.prioridade}]\nOportunidade: ${p.oportunidade}\nComo aproveitar: ${p.como_aproveitar}`).join("\n\n")}`
}
function toTextRecomendacoes(rs: Recomendacao[]) {
  return `RECOMENDAÇÕES\n\n${rs.map((r, i) => `${i + 1}. ${r.acao} [${r.prioridade}]\n${r.justificativa}\nFormato sugerido: ${r.formato_sugerido}`).join("\n\n")}`
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConcorrentesPage() {
  const [nome,          setNome]          = useState("")
  const [instagram,     setInstagram]     = useState("")
  const [especialidade, setEspecialidade] = useState("")
  const [tipo,          setTipo]          = useState<TipoAnalise>("completa")
  const [contexto,      setContexto]      = useState("")
  const [loading,       setLoading]       = useState(false)
  const [resultado,     setResultado]     = useState<AnaliseResult | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [toast,         setToast]         = useState<{ message: string; type: ToastType } | null>(null)
  const [savingId,      setSavingId]      = useState<number | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const analisar = async () => {
    if (!nome.trim()) { setError("Informe o nome do concorrente."); return }
    setError(null); setLoading(true); setResultado(null)
    try {
      const res  = await fetch("/api/concorrentes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nome, instagram, especialidade, tipo, contexto }),
      })
      const data = await res.json() as AnaliseResult & { error?: string }
      if (data.error) throw new Error(data.error)
      setResultado(data)
    } catch (e) {
      setError("Erro ao analisar: " + String(e))
    } finally {
      setLoading(false)
    }
  }

  const salvarPauta = async (rec: Recomendacao, idx: number) => {
    setSavingId(idx)
    try {
      const res = await fetch("/api/pautas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo:     rec.acao,
          categoria:  "Estratégia de Conteúdo",
          prioridade: rec.prioridade,
          estagio:    "Ideia",
          nota:       `${rec.justificativa}\n\nFormato sugerido: ${rec.formato_sugerido}\n\n— Gerado pela Análise de Concorrentes (${nome})`,
        }),
      })
      if (!res.ok) throw new Error()
      showToast("Pauta salva com sucesso!")
    } catch {
      showToast("Erro ao salvar pauta", "error")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Análise de Concorrentes"
        subtitle="INTELIGÊNCIA COMPETITIVA · GAPS DE CONTEÚDO · OPORTUNIDADES"
        actions={
          loading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Analisando concorrente...
            </div>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 items-start">

          {/* ── PAINEL ESQUERDO ─── */}
          <div className="space-y-4">

            {/* Perfil do concorrente */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-text-muted" />
                <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Perfil do Concorrente</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">
                    Nome *
                  </label>
                  <input
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Dr. João Silva"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">
                    Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-text-muted select-none">@</span>
                    <input
                      value={instagram}
                      onChange={e => setInstagram(e.target.value.replace("@", ""))}
                      placeholder="drjoaosilva"
                      className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">
                    Especialidade
                  </label>
                  <input
                    value={especialidade}
                    onChange={e => setEspecialidade(e.target.value)}
                    placeholder="Endocrinologia, Nutrologia..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Tipo de análise */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-4">
                Tipo de Análise
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TIPOS) as [TipoAnalise, typeof TIPOS[TipoAnalise]][]).map(([id, t]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTipo(id)}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-all",
                      tipo === id
                        ? "bg-accent-dim border-accent-border"
                        : "border-border hover:border-border-hover hover:bg-white/[0.02]",
                    )}
                  >
                    <t.Icon className={cn("w-4 h-4 mb-1.5", tipo === id ? "text-accent" : "text-text-muted")} />
                    <div className={cn("text-[11px] font-semibold leading-tight", tipo === id ? "text-accent" : "text-text-primary")}>
                      {t.label}
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5 leading-snug">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contexto adicional */}
            <div className="bg-card border border-border rounded-xl p-5">
              <label className="block text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">
                Contexto Adicional
                <span className="normal-case font-normal tracking-normal ml-2 text-text-muted/60">(opcional)</span>
              </label>
              <textarea
                value={contexto}
                onChange={e => setContexto(e.target.value)}
                placeholder="O que você já sabe sobre ele: nicho, público, resultados que já observou, estratégias que usa..."
                rows={4}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={analisar}
              disabled={loading || !nome.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
                : <><BarChart2 className="w-4 h-4" /> Analisar Concorrente</>
              }
            </button>

            {resultado && (
              <button
                type="button"
                onClick={analisar}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-text-muted text-[12px] hover:border-accent-border hover:text-accent transition-all disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reanalisar
              </button>
            )}
          </div>

          {/* ── PAINEL DIREITO ─── */}
          <div>
            {/* Empty state */}
            {!loading && !resultado && (
              <EmptyState
                icon={BarChart2}
                title="Configure e inicie a análise"
                subtitle="Preencha o perfil do concorrente ao lado, escolha o tipo de análise e clique em Analisar. Claude irá identificar estratégias, gaps e oportunidades."
              />
            )}

            {/* Loading */}
            {loading && <Skeleton />}

            {/* Results */}
            {resultado && !loading && (
              <div className="space-y-4">

                {/* 1. Visão Geral */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <SectionHeader
                    icon={Eye}
                    emoji="📊"
                    title="Visão Geral"
                    copyText={toTextVisaoGeral(resultado.visao_geral)}
                  />
                  <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
                    {resultado.visao_geral.resumo}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: "Seguidores",  value: resultado.visao_geral.seguidores_estimados },
                      { label: "Frequência",  value: resultado.visao_geral.frequencia_posting   },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-background rounded-lg p-3 border border-border">
                        <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-1">{label}</div>
                        <div className="text-[12px] font-semibold text-text-primary">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {resultado.visao_geral.formatos_principais.map(f => (
                      <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-text-muted">Posicionamento:</span>
                    <span className="text-[11px] text-text-secondary">{resultado.visao_geral.especialidade_percebida}</span>
                  </div>
                </div>

                {/* 2. Estratégia de Conteúdo */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <SectionHeader
                    icon={TrendingUp}
                    emoji="📱"
                    title="Estratégia de Conteúdo"
                    copyText={toTextEstrategia(resultado.estrategia_conteudo)}
                  />
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-2">Frequência</div>
                      <p className="text-[12px] text-text-secondary">{resultado.estrategia_conteudo.frequencia}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-2">Formatos</div>
                      <div className="space-y-1.5">
                        {resultado.estrategia_conteudo.formatos.map((f, i) => (
                          <div key={i} className="flex items-start gap-2.5 bg-background rounded-lg p-2.5 border border-border">
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-accent-dim text-accent flex-shrink-0">{f.percentual}</span>
                            <div>
                              <span className="text-[11px] font-semibold text-text-primary">{f.tipo}</span>
                              <span className="text-[11px] text-text-muted ml-1.5">— {f.observacao}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-2">Temas recorrentes</div>
                      <div className="flex flex-wrap gap-1.5">
                        {resultado.estrategia_conteudo.temas_recorrentes.map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-border text-text-secondary">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-2">Ganchos típicos</div>
                      <div className="space-y-1">
                        {resultado.estrategia_conteudo.ganchos_tipicos.map((g, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px] text-text-secondary">
                            <ChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                            <span>{g}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-1 border-t border-border">
                      <p className="text-[12px] text-text-secondary italic">{resultado.estrategia_conteudo.analise_geral}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Posicionamento */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <SectionHeader
                    icon={Target}
                    emoji="🎯"
                    title="Posicionamento"
                    copyText={toTextPosicionamento(resultado.posicionamento)}
                  />
                  <div className="space-y-3">
                    {[
                      { label: "Proposta de valor",  value: resultado.posicionamento.proposta_valor     },
                      { label: "Público-alvo",       value: resultado.posicionamento.publico_alvo       },
                      { label: "Tom de comunicação", value: resultado.posicionamento.tom_comunicacao    },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1">{label}</div>
                        <p className="text-[12px] text-text-secondary">{value}</p>
                      </div>
                    ))}
                    <div>
                      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-2">Diferenciais</div>
                      <div className="space-y-1">
                        {resultado.posicionamento.diferenciais.map((d, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px] text-text-secondary">
                            <ChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1">Comparação com você</div>
                      <p className="text-[12px] text-text-secondary">{resultado.posicionamento.comparacao_com_voce}</p>
                    </div>
                  </div>
                </div>

                {/* 4. Pontos Fracos */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <SectionHeader
                    icon={Shield}
                    emoji="⚠️"
                    title="Pontos Fracos / Oportunidades"
                    copyText={toTextPontosFragcos(resultado.pontos_fracos)}
                  />
                  <div className="space-y-3">
                    {resultado.pontos_fracos.map((pf, i) => (
                      <div key={i} className="bg-background border border-border rounded-lg p-3.5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[12px] font-semibold text-text-primary">{pf.gap}</span>
                          <PrioBadge p={pf.prioridade} />
                        </div>
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-[10px] font-mono text-text-muted">Oportunidade: </span>
                            <span className="text-[11px] text-text-secondary">{pf.oportunidade}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-[10px] font-mono text-accent flex-shrink-0 mt-0.5">→</span>
                            <span className="text-[11px] text-text-secondary">{pf.como_aproveitar}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Recomendações */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <SectionHeader
                    icon={Lightbulb}
                    emoji="💡"
                    title="Recomendações para Dr. Bruno"
                    copyText={toTextRecomendacoes(resultado.recomendacoes)}
                  />
                  <div className="space-y-3">
                    {resultado.recomendacoes.map((rec, i) => (
                      <div key={i} className="bg-background border border-border rounded-lg p-3.5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span
                            className="text-[13px] font-semibold text-text-primary leading-snug"
                            style={{ fontFamily: "var(--font-playfair)" }}
                          >
                            {rec.acao}
                          </span>
                          <PrioBadge p={rec.prioridade} />
                        </div>
                        <p className="text-[11px] text-text-secondary mb-2 leading-relaxed">{rec.justificativa}</p>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-text-muted">FORMATO:</span>
                            <span className="text-[10px] font-mono text-accent">{rec.formato_sugerido}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => salvarPauta(rec, i)}
                            disabled={savingId === i}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all disabled:opacity-40 flex-shrink-0"
                          >
                            {savingId === i
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <BookmarkPlus className="w-3 h-3" />
                            }
                            {savingId === i ? "Salvando..." : "Salvar como Pauta"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast?.message ?? null} type={toast?.type} />
    </div>
  )
}
