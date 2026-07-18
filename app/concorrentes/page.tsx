"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { EmptyState } from "@/components/EmptyState"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  BarChart2, TrendingUp, Target, Shield, Lightbulb, Eye,
  Copy, Check, Loader2, BookmarkPlus, Users, AlertTriangle,
  RefreshCw, ChevronRight, Video, Zap, Instagram, BarChart,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoAnalise = "estrategia" | "posicionamento" | "pontos_fracos" | "completa"
type Prioridade  = "Alta" | "Média" | "Baixa"
type AbaAtiva    = "concorrente" | "benchmark" | "crescimento"

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
  proposta_valor:      string
  publico_alvo:        string
  tom_comunicacao:     string
  diferenciais:        string[]
  comparacao_com_voce: string
}
interface PontoFraco {
  gap:             string
  oportunidade:    string
  como_aproveitar: string
  prioridade:      Prioridade
}
interface Recomendacao {
  acao:             string
  justificativa:    string
  formato_sugerido: string
  prioridade:       Prioridade
}
interface AnaliseResult {
  visao_geral:         VisaoGeral
  estrategia_conteudo: EstrategiaConteudo
  posicionamento:      Posicionamento
  pontos_fracos:       PontoFraco[]
  recomendacoes:       Recomendacao[]
}

interface ComparativoItem {
  metrica:             string
  seu_valor:           string
  media_especialidade: string
  top10_especialidade: string
  avaliacao:           "Abaixo" | "Na média" | "Acima" | "Destaque"
}
interface BenchmarkResult {
  pontuacao_geral:     string
  posicao_estimada:    string
  nivel:               string
  comparativo:         ComparativoItem[]
  pontos_fortes:       string[]
  lacunas_criticas:    string[]
  acoes_prioritarias:  string[]
  diagnostico:         string
}

interface AcaoPlano {
  semana:  string
  acao:    string
  motivo:  string
  formato: string
}
interface CrescimentoResult {
  pontuacao:               number
  nivel:                   string
  meta_realista:           string
  analise_atual:           string
  bio_otimizada:           string
  acoes_90_dias:           AcaoPlano[]
  temas_que_mais_convertem: string[]
  hashtags_recomendadas:   string[]
  erros_evitar:            string[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS: Record<TipoAnalise, { label: string; desc: string; Icon: React.ElementType }> = {
  estrategia:     { label: "Estratégia de Conteúdo", desc: "Frequência, formatos e temas",   Icon: TrendingUp },
  posicionamento: { label: "Posicionamento",          desc: "Diferenciais, público e tom",    Icon: Target     },
  pontos_fracos:  { label: "Pontos Fracos",           desc: "Gaps e oportunidades de ataque", Icon: Shield     },
  completa:       { label: "Análise Completa",        desc: "Todas as dimensões em detalhe",  Icon: BarChart2  },
}

const PRIO_STYLE: Record<Prioridade, string> = {
  Alta:  "bg-red-50 border-red-200 text-red-700",
  Média: "bg-amber-50 border-amber-200 text-amber-700",
  Baixa: "bg-blue-50 border-blue-200 text-blue-700",
}

const AVAL_STYLE: Record<ComparativoItem["avaliacao"], string> = {
  "Abaixo":   "bg-red-50   border-red-200   text-red-700",
  "Na média": "bg-amber-50 border-amber-200 text-amber-700",
  "Acima":    "bg-green-50 border-green-200 text-green-700",
  "Destaque": "bg-accent-dim border-accent-border text-accent",
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
    <span className={cn("text-badge font-mono font-semibold px-2 py-0.5 rounded-full border flex-shrink-0", PRIO_STYLE[p])}>
      {p}
    </span>
  )
}

function SectionHeader({ icon: Icon, emoji, title, copyText }: { icon: React.ElementType; emoji: string; title: string; copyText: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-accent" />
        </div>
        <h3 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
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
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-accent/[0.07]" />
            <div className={cn("h-4 bg-border rounded", ["w-36","w-48","w-40","w-44","w-52"][i])} />
          </div>
          <div className="space-y-2.5">
            <div className="h-3 bg-border rounded w-full" />
            <div className="h-3 bg-border rounded w-5/6" />
            <div className="h-3 bg-border rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Text serializers ─────────────────────────────────────────────────────────

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
function toTextBenchmark(b: BenchmarkResult) {
  return `BENCHMARK DA ESPECIALIDADE\n\nPontuação: ${b.pontuacao_geral}\nPosição: ${b.posicao_estimada}\nNível: ${b.nivel}\n\n${b.diagnostico}\n\nComparativo:\n${b.comparativo.map(c => `- ${c.metrica}: ${c.seu_valor} | Média: ${c.media_especialidade} | Top 10%: ${c.top10_especialidade} [${c.avaliacao}]`).join("\n")}\n\nAções prioritárias:\n${b.acoes_prioritarias.map((a, i) => `${i + 1}. ${a}`).join("\n")}`
}
function toTextCrescimento(c: CrescimentoResult) {
  return `PLANO DE CRESCIMENTO 90 DIAS\n\nPontuação: ${c.pontuacao}/100 — ${c.nivel}\nMeta: ${c.meta_realista}\n\nBio otimizada:\n${c.bio_otimizada}\n\nPlano semana a semana:\n${c.acoes_90_dias.map(a => `${a.semana}: ${a.acao}\nFormato: ${a.formato}\nPor quê: ${a.motivo}`).join("\n\n")}\n\nHashtags: ${c.hashtags_recomendadas.join(" ")}`
}

// ─── Concorrente Results ───────────────────────────────────────────────────────

function ConcorrenteResults({ resultado, nome, onSavePauta, savingId, router }: {
  resultado:    AnaliseResult
  nome:         string
  onSavePauta:  (rec: Recomendacao, idx: number) => void
  savingId:     number | null
  router:       ReturnType<typeof useRouter>
}) {
  return (
    <div className="space-y-4">
      {/* Visão Geral */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader icon={Eye} emoji="📊" title="Visão Geral" copyText={toTextVisaoGeral(resultado.visao_geral)} />
        <p className="text-[13px] text-text-secondary leading-relaxed mb-4">{resultado.visao_geral.resumo}</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Seguidores", value: resultado.visao_geral.seguidores_estimados },
            { label: "Frequência", value: resultado.visao_geral.frequencia_posting   },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background rounded-lg p-3 border border-border">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-1">{label}</div>
              <div className="text-[12px] font-semibold text-text-primary">{value}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {resultado.visao_geral.formatos_principais.map(f => (
            <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">{f}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-muted">Posicionamento:</span>
          <span className="text-[11px] text-text-secondary">{resultado.visao_geral.especialidade_percebida}</span>
        </div>
      </div>

      {/* Estratégia */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader icon={TrendingUp} emoji="📱" title="Estratégia de Conteúdo" copyText={toTextEstrategia(resultado.estrategia_conteudo)} />
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

      {/* Posicionamento */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader icon={Target} emoji="🎯" title="Posicionamento" copyText={toTextPosicionamento(resultado.posicionamento)} />
        <div className="space-y-3">
          {[
            { label: "Proposta de valor",  value: resultado.posicionamento.proposta_valor  },
            { label: "Público-alvo",       value: resultado.posicionamento.publico_alvo    },
            { label: "Tom de comunicação", value: resultado.posicionamento.tom_comunicacao },
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

      {/* Pontos Fracos */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader icon={Shield} emoji="⚠️" title="Pontos Fracos / Oportunidades" copyText={toTextPontosFragcos(resultado.pontos_fracos)} />
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

      {/* Recomendações */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionHeader icon={Lightbulb} emoji="💡" title="Recomendações para você" copyText={toTextRecomendacoes(resultado.recomendacoes)} />
        <div className="space-y-3">
          {resultado.recomendacoes.map((rec, i) => (
            <div key={i} className="bg-background border border-border rounded-lg p-3.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[13px] font-semibold text-text-primary leading-snug" style={{ fontFamily: "var(--font-playfair)" }}>
                  {rec.acao}
                </span>
                <PrioBadge p={rec.prioridade} />
              </div>
              <p className="text-[11px] text-text-secondary mb-2 leading-relaxed">{rec.justificativa}</p>
              <div className="flex items-start justify-between gap-2 pt-2 border-t border-border flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-text-muted">FORMATO:</span>
                  <span className="text-[10px] font-mono text-accent">{rec.formato_sugerido}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { localStorage.setItem("praxis_roteiro_tema", rec.acao); router.push("/roteiros") }}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-border text-text-muted hover:border-blue-400/50 hover:text-blue-500 transition-all"
                  >
                    <Video className="w-3 h-3" />
                    Criar Roteiro
                  </button>
                  <button
                    type="button"
                    onClick={() => onSavePauta(rec, i)}
                    disabled={savingId === i}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all disabled:opacity-40"
                  >
                    {savingId === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookmarkPlus className="w-3 h-3" />}
                    {savingId === i ? "Salvando..." : "Salvar como Pauta"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Benchmark Results ────────────────────────────────────────────────────────

function BenchmarkResults({ resultado }: { resultado: BenchmarkResult }) {
  const score = parseFloat(resultado.pontuacao_geral.replace(",", "."))
  const pct   = isNaN(score) ? 60 : (score / 10) * 100

  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>📊 Sua pontuação</h3>
          <CopyBtn text={toTextBenchmark(resultado)} />
        </div>
        <div className="flex items-end gap-3 mb-4">
          <div className="text-[42px] font-black text-accent leading-none">{resultado.pontuacao_geral}</div>
          <div>
            <div className="text-[11px] font-semibold text-text-primary">{resultado.nivel}</div>
            <div className="text-[10px] text-text-muted">{resultado.posicao_estimada}</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden mb-4">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <p className="text-[12px] text-text-secondary leading-relaxed">{resultado.diagnostico}</p>
      </div>

      {/* Comparativo */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-4">Comparativo por métrica</div>
        <div className="space-y-2">
          {resultado.comparativo.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 bg-background rounded-lg p-3 border border-border items-start">
              <div>
                <div className="text-[12px] font-semibold text-text-primary mb-1.5">{c.metrica}</div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <div className="text-text-muted font-mono mb-0.5">SEU VALOR</div>
                    <div className="text-text-primary font-semibold">{c.seu_valor}</div>
                  </div>
                  <div>
                    <div className="text-text-muted font-mono mb-0.5">MÉDIA</div>
                    <div className="text-text-secondary">{c.media_especialidade}</div>
                  </div>
                  <div>
                    <div className="text-text-muted font-mono mb-0.5">TOP 10%</div>
                    <div className="text-text-secondary">{c.top10_especialidade}</div>
                  </div>
                </div>
              </div>
              <span className={cn("text-badge font-mono font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5", AVAL_STYLE[c.avaliacao])}>
                {c.avaliacao}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pontos fortes / Lacunas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] font-mono text-green-600 uppercase tracking-widest mb-3">✅ Pontos fortes</div>
          <div className="space-y-2">
            {resultado.pontos_fortes.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-text-secondary">
                <span className="text-green-500 flex-shrink-0">+</span>{p}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] font-mono text-red-600 uppercase tracking-widest mb-3">⚠️ Lacunas críticas</div>
          <div className="space-y-2">
            {resultado.lacunas_criticas.map((l, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-text-secondary">
                <span className="text-red-400 flex-shrink-0">!</span>{l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ações prioritárias */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-4">5 ações para subir no ranking</div>
        <div className="space-y-2">
          {resultado.acoes_prioritarias.map((a, i) => (
            <div key={i} className="flex items-start gap-3 bg-background rounded-lg p-3 border border-border">
              <span className="text-[11px] font-mono text-accent flex-shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[12px] text-text-secondary">{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Crescimento Results ──────────────────────────────────────────────────────

function CrescimentoResults({ resultado, onCopyBio }: { resultado: CrescimentoResult; onCopyBio: (t: string) => void }) {
  const pct = Math.min(Math.max(resultado.pontuacao, 0), 100)
  return (
    <div className="space-y-4">
      {/* Score + bio */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>🚀 Sua pontuação de crescimento</h3>
          <CopyBtn text={toTextCrescimento(resultado)} />
        </div>
        <div className="flex items-end gap-3 mb-3">
          <div className="text-[42px] font-black text-accent leading-none">{pct}</div>
          <div>
            <div className="text-[11px] font-semibold text-text-primary">{resultado.nivel}</div>
            <div className="text-[10px] text-text-muted">de 100 pontos</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden mb-4">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[12px] text-text-secondary leading-relaxed mb-4">{resultado.analise_atual}</p>
        <div className="p-3 rounded-lg bg-accent-dim border border-accent-border">
          <div className="text-[10px] font-mono text-accent uppercase tracking-widest mb-1.5">META REALISTA 90 DIAS</div>
          <p className="text-[12px] font-semibold text-text-primary">{resultado.meta_realista}</p>
        </div>
      </div>

      {/* Bio otimizada */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-mono text-text-muted uppercase tracking-widest">Bio otimizada para o Instagram</div>
          <button
            type="button"
            onClick={() => onCopyBio(resultado.bio_otimizada)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-accent-border bg-accent-dim text-accent transition-all"
          >
            <Copy className="w-3 h-3" /> Copiar bio
          </button>
        </div>
        <div className="bg-background border border-border rounded-lg p-4">
          <p className="text-[14px] text-text-primary leading-relaxed">{resultado.bio_otimizada}</p>
        </div>
      </div>

      {/* Plano 90 dias */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-4">Plano semana a semana — 90 dias</div>
        <div className="space-y-3">
          {resultado.acoes_90_dias.map((a, i) => (
            <div key={i} className="bg-background border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-badge font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">{a.semana}</span>
                <span className="text-[12px] font-semibold text-text-primary">{a.acao}</span>
              </div>
              <p className="text-[11px] text-text-muted mb-1.5">{a.motivo}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-text-muted">FORMATO:</span>
                <span className="text-[10px] font-mono text-accent">{a.formato}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Temas + hashtags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-3">Temas que mais convertem</div>
          <div className="space-y-2">
            {resultado.temas_que_mais_convertem.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-text-secondary">
                <ChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />{t}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-3">Hashtags recomendadas</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {resultado.hashtags_recomendadas.map(h => (
              <span key={h} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">{h}</span>
            ))}
          </div>
          <div className="pt-3 border-t border-border">
            <div className="text-[10px] font-mono text-red-500 uppercase tracking-widest mb-2">❌ Erros a evitar</div>
            <div className="space-y-1.5">
              {resultado.erros_evitar.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-text-secondary">
                  <span className="text-red-400 flex-shrink-0 mt-0.5">×</span>{e}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConcorrentesPage() {
  const router = useRouter()

  // Tab state
  const [aba, setAba] = useState<AbaAtiva>("concorrente")

  // Concorrente form
  const [nome,          setNome]          = useState("")
  const [instagram,     setInstagram]     = useState("")
  const [especialidade, setEspecialidade] = useState("")
  const [tipo,          setTipo]          = useState<TipoAnalise>("completa")
  const [contexto,      setContexto]      = useState("")

  // Benchmark form
  const [bmEspecialidade, setBmEspecialidade] = useState("")
  const [bmCidade,        setBmCidade]        = useState("")
  const [bmSeguidores,    setBmSeguidores]    = useState("")
  const [bmPostsSemana,   setBmPostsSemana]   = useState("")
  const [bmContexto,      setBmContexto]      = useState("")

  // Crescimento form
  const [crInstagram,     setCrInstagram]     = useState("")
  const [crEspecialidade, setCrEspecialidade] = useState("")
  const [crSeguidores,    setCrSeguidores]    = useState("")
  const [crBio,           setCrBio]           = useState("")
  const [crDificuldade,   setCrDificuldade]   = useState("")

  // Shared state
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [savingId,  setSavingId]  = useState<number | null>(null)
  const [toast,     setToast]     = useState<{ message: string; type: ToastType } | null>(null)

  const [resConcorrente, setResConcorrente] = useState<AnaliseResult | null>(null)
  const [resBenchmark,   setResBenchmark]   = useState<BenchmarkResult | null>(null)
  const [resCrescimento, setResCrescimento] = useState<CrescimentoResult | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const analisar = async () => {
    setError(null); setLoading(true)

    let body: Record<string, unknown>
    if (aba === "concorrente") {
      if (!nome.trim()) { setError("Informe o nome do concorrente."); setLoading(false); return }
      body = { nome, instagram, especialidade, tipo, contexto }
      setResConcorrente(null)
    } else if (aba === "benchmark") {
      body = { tipo: "benchmark", especialidade: bmEspecialidade, cidade: bmCidade, seguidores_atuais: bmSeguidores, posts_semana: bmPostsSemana, contexto: bmContexto }
      setResBenchmark(null)
    } else {
      body = { tipo: "crescimento_instagram", instagram: crInstagram, especialidade: crEspecialidade, seguidores_atuais: crSeguidores, bio_atual: crBio, maior_dificuldade: crDificuldade }
      setResCrescimento(null)
    }

    try {
      const res  = await fetch("/api/concorrentes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (aba === "concorrente") setResConcorrente(data as AnaliseResult)
      else if (aba === "benchmark") setResBenchmark(data as BenchmarkResult)
      else setResCrescimento(data as CrescimentoResult)
    } catch (e) {
      setError("Erro: " + String(e))
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
          titulo:    rec.acao,
          conteudo:  `${rec.justificativa}\n\nFormato sugerido: ${rec.formato_sugerido}\n\n— Concorrente analisado: ${nome}`,
          categoria: "concorrentes",
        }),
      })
      if (!res.ok) throw new Error()
      showToast("Salvo no banco de pautas!")
    } catch (e) {
      console.error("[concorrentes] erro ao salvar recomendação:", e)
      showToast("Erro ao salvar. Tente novamente.", "error")
    } finally {
      setSavingId(null)
    }
  }

  const hasResult = aba === "concorrente" ? !!resConcorrente : aba === "benchmark" ? !!resBenchmark : !!resCrescimento

  const ABAS: { id: AbaAtiva; label: string; desc: string; Icon: React.ElementType }[] = [
    { id: "concorrente", label: "Análise de Concorrentes", desc: "Estratégia, gaps e oportunidades",      Icon: Users      },
    { id: "benchmark",   label: "Benchmark da Especialidade", desc: "Compare com os líderes do seu nicho", Icon: BarChart   },
    { id: "crescimento", label: "Crescimento no Instagram",   desc: "Plano de 90 dias com IA",             Icon: Instagram  },
  ]

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Central de Inteligência"
        subtitle="ANÁLISE COMPETITIVA · BENCHMARK · CRESCIMENTO INSTAGRAM"
        actions={
          loading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Analisando com IA...
            </div>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8">

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {ABAS.map(({ id, label, desc, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setAba(id); setError(null) }}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-left transition-all",
                aba === id
                  ? "bg-accent-dim border-accent-border"
                  : "border-border hover:border-border-hover bg-card",
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", aba === id ? "text-accent" : "text-text-muted")} />
              <div>
                <div className={cn("text-[12px] font-semibold leading-tight", aba === id ? "text-accent" : "text-text-primary")}>{label}</div>
                <div className="text-[10px] text-text-muted leading-tight">{desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5 items-start">

          {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* ── CONCORRENTE FORM ── */}
            {aba === "concorrente" && (
              <>
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-text-muted" />
                    <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Perfil do Concorrente</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Nome *</label>
                      <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Dr. João Silva"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Instagram</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-text-muted select-none">@</span>
                        <input value={instagram} onChange={e => setInstagram(e.target.value.replace("@", ""))} placeholder="drjoaosilva"
                          className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Especialidade</label>
                      <input value={especialidade} onChange={e => setEspecialidade(e.target.value)} placeholder="Endocrinologia, Nutrologia..."
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-4">Tipo de Análise</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(TIPOS) as [TipoAnalise, typeof TIPOS[TipoAnalise]][]).map(([id, t]) => (
                      <button key={id} type="button" onClick={() => setTipo(id)}
                        className={cn("text-left p-3 rounded-lg border transition-all",
                          tipo === id ? "bg-accent-dim border-accent-border" : "border-border hover:border-border-hover hover:bg-white/[0.02]")}>
                        <t.Icon className={cn("w-4 h-4 mb-1.5", tipo === id ? "text-accent" : "text-text-muted")} />
                        <div className={cn("text-[11px] font-semibold leading-tight", tipo === id ? "text-accent" : "text-text-primary")}>{t.label}</div>
                        <div className="text-[9px] text-text-muted mt-0.5 leading-snug">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <label className="block text-[11px] font-mono text-text-muted tracking-widest uppercase mb-3">
                    Contexto Adicional <span className="normal-case font-normal tracking-normal ml-2 text-text-muted/60">(opcional)</span>
                  </label>
                  <textarea value={contexto} onChange={e => setContexto(e.target.value)}
                    placeholder="O que você já sabe sobre ele: nicho, público, resultados observados..."
                    rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none" />
                </div>
              </>
            )}

            {/* ── BENCHMARK FORM ── */}
            {aba === "benchmark" && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart className="w-4 h-4 text-text-muted" />
                  <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Seus dados atuais</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Especialidade *", value: bmEspecialidade, onChange: setBmEspecialidade, placeholder: "Endocrinologia, Dermatologia..." },
                    { label: "Cidade",           value: bmCidade,        onChange: setBmCidade,        placeholder: "São Paulo, Rio de Janeiro..." },
                    { label: "Seguidores atuais", value: bmSeguidores,  onChange: setBmSeguidores,    placeholder: "ex: 1.200 ou 5k" },
                    { label: "Posts por semana", value: bmPostsSemana,   onChange: setBmPostsSemana,   placeholder: "ex: 3" },
                  ].map(({ label, value, onChange, placeholder }) => (
                    <div key={label}>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">{label}</label>
                      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Contexto adicional <span className="normal-case font-normal tracking-normal ml-2 text-text-muted/60">(opcional)</span></label>
                    <textarea value={bmContexto} onChange={e => setBmContexto(e.target.value)} placeholder="Formatos que você usa, tempo no Instagram, etc..." rows={3}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* ── CRESCIMENTO FORM ── */}
            {aba === "crescimento" && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-text-muted" />
                  <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Seu perfil no Instagram</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Especialidade *</label>
                    <input value={crEspecialidade} onChange={e => setCrEspecialidade(e.target.value)} placeholder="Endocrinologia, Clínica Geral..."
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Instagram</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-text-muted select-none">@</span>
                      <input value={crInstagram} onChange={e => setCrInstagram(e.target.value.replace("@", ""))} placeholder="seuperfil"
                        className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Seguidores atuais</label>
                    <input value={crSeguidores} onChange={e => setCrSeguidores(e.target.value)} placeholder="ex: 820 ou 2.3k"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Bio atual <span className="normal-case font-normal tracking-normal ml-2 text-text-muted/60">(opcional)</span></label>
                    <textarea value={crBio} onChange={e => setCrBio(e.target.value)} placeholder="Cole aqui sua bio atual do Instagram..." rows={2}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wide mb-1.5">Maior dificuldade <span className="normal-case font-normal tracking-normal ml-2 text-text-muted/60">(opcional)</span></label>
                    <textarea value={crDificuldade} onChange={e => setCrDificuldade(e.target.value)} placeholder="ex: Não sei que tipo de conteúdo fazer, tenho pouco tempo, não apareço..." rows={2}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={analisar}
              disabled={loading || (aba === "concorrente" && !nome.trim()) || (aba === "crescimento" && !crEspecialidade.trim())}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
              ) : aba === "concorrente" ? (
                <><BarChart2 className="w-4 h-4" /> Analisar Concorrente</>
              ) : aba === "benchmark" ? (
                <><BarChart className="w-4 h-4" /> Gerar Benchmark</>
              ) : (
                <><Zap className="w-4 h-4" /> Criar Plano de Crescimento</>
              )}
            </button>

            {hasResult && (
              <button type="button" onClick={analisar} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-text-muted text-[12px] hover:border-accent-border hover:text-accent transition-all disabled:opacity-40">
                <RefreshCw className="w-3.5 h-3.5" /> Reanalisar
              </button>
            )}
          </div>

          {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
          <div>
            {!loading && !hasResult && (
              <EmptyState
                icon={aba === "concorrente" ? BarChart2 : aba === "benchmark" ? BarChart : Zap}
                title={
                  aba === "concorrente" ? "Configure e inicie a análise" :
                  aba === "benchmark"   ? "Veja onde você está no ranking" :
                  "Crie seu plano de 90 dias"
                }
                subtitle={
                  aba === "concorrente" ? "Preencha o perfil do concorrente ao lado e clique em Analisar." :
                  aba === "benchmark"   ? "Informe seus dados atuais para comparar com os líderes da sua especialidade." :
                  "Informe sua especialidade e dados do Instagram para receber um plano personalizado."
                }
              />
            )}

            {loading && <Skeleton />}

            {!loading && aba === "concorrente" && resConcorrente && (
              <ConcorrenteResults resultado={resConcorrente} nome={nome} onSavePauta={salvarPauta} savingId={savingId} router={router} />
            )}

            {!loading && aba === "benchmark" && resBenchmark && (
              <BenchmarkResults resultado={resBenchmark} />
            )}

            {!loading && aba === "crescimento" && resCrescimento && (
              <CrescimentoResults resultado={resCrescimento} onCopyBio={(t) => { navigator.clipboard.writeText(t); showToast("Bio copiada!") }} />
            )}
          </div>
        </div>
      </div>

      <Toast message={toast?.message ?? null} type={toast?.type} />
    </div>
  )
}
