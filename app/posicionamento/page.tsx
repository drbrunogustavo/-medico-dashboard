"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { Toast } from "@/components/Toast"
import type { ToastType } from "@/components/Toast"
import { cn } from "@/lib/utils"
import {
  Target, ChevronRight, ChevronDown, Loader2, AlertTriangle,
  Copy, Check, ArrowRight, RefreshCw, User, MapPin,
  Stethoscope, TrendingUp, Sparkles, BookOpen,
  MessageSquare, Zap, ExternalLink,
} from "lucide-react"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiagnosticoForm {
  especialidade:  string
  tempo_atuacao:  string
  cidade:         string
  atendimento:    string
  ticket_medio:   string
  paciente_ideal: string
  maior_desafio:  string
  diferencial:    string
}

interface PosicionamentoResult {
  nicho_ideal:               { titulo: string; descricao: string; justificativa: string; tamanho_mercado: string }
  publico_alvo:              { avatar_nome: string; demografia: string; psicografia: string; dores_principais: string[]; onde_encontrar: string; como_decide: string }
  diferenciais_competitivos: { diferenciais_atuais: string[]; diferenciais_a_desenvolver: string[]; proposta_de_valor: string }
  posicionamento_mercado:    { posicionamento_atual: string; posicionamento_ideal: string; estrategia_transicao: string; benchmark: string }
  dores_publico:             { dor: string; intensidade: "Alta"|"Média"|"Baixa"; conteudo_sugerido: string }[]
  linha_editorial:           { pilares: { nome: string; descricao: string; percentual: string; exemplos: string[] }[]; frequencia_recomendada: string; formatos_prioritarios: string[] }
  estrategia_comunicacao:    { tom_de_voz: string; palavras_chave: string[]; frases_a_evitar: string[]; storytelling: string }
  top10_temas:               { tema: string; formato: string; justificativa: string; gancho: string }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DESAFIOS = [
  "Agenda vazia",
  "Ticket baixo",
  "Dependência de convênio",
  "Sem posicionamento",
  "Concorrência",
  "Outro",
]

const ATENDIMENTO_OPTS = ["Particular", "Convênio", "Ambos"]

const LOADING_PHRASES = [
  "Mapeando seu posicionamento no mercado...",
  "Identificando seu nicho ideal...",
  "Construindo seu avatar de paciente...",
  "Analisando seus diferenciais competitivos...",
  "Definindo sua linha editorial...",
  "Gerando seus top 10 temas...",
  "Finalizando seu relatório estratégico...",
]

const INTENSIDADE_STYLE: Record<string, string> = {
  "Alta":  "bg-red-50 border-red-200 text-red-700",
  "Média": "bg-amber-50 border-amber-200 text-amber-700",
  "Baixa": "bg-blue-50 border-blue-200 text-blue-700",
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
        done ? "bg-accent-dim border-accent-border text-accent" : "border-border text-text-muted hover:border-accent-border hover:text-accent",
        className,
      )}
    >
      {done ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {done ? "Copiado" : "Copiar"}
    </button>
  )
}

function Section({
  icon: Icon, emoji, title, children, copyText,
}: {
  icon: React.ElementType; emoji: string; title: string; children: React.ReactNode; copyText: string
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.01] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-accent" />
          </div>
          <h3 className="text-[14px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
            {emoji} {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <CopyBtn text={copyText} />
          {open ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
        </div>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  const [phraseIdx] = useState(() => 0)
  const [idx, setIdx] = useState(phraseIdx)

  useState(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_PHRASES.length), 1800)
    return () => clearInterval(t)
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        <div className="absolute inset-[6px] rounded-full bg-accent-dim border border-accent-border flex items-center justify-center">
          <Target className="w-7 h-7 text-accent" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-mono text-accent tracking-widest uppercase mb-2">IA processando</p>
        <p className="text-[14px] text-text-secondary">{LOADING_PHRASES[idx]}</p>
      </div>
      <div className="flex gap-1.5">
        {LOADING_PHRASES.map((_, i) => (
          <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === idx ? "bg-accent" : "bg-border")} />
        ))}
      </div>
    </div>
  )
}

// ─── Step 1: Diagnóstico ──────────────────────────────────────────────────────

function Step1({ form, setForm, onNext }: {
  form:    DiagnosticoForm
  setForm: React.Dispatch<React.SetStateAction<DiagnosticoForm>>
  onNext:  () => void
}) {
  const set = (k: keyof DiagnosticoForm) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const canProceed = form.especialidade.trim() && form.cidade.trim() && form.maior_desafio && form.diferencial.trim()

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-dim border border-accent-border mb-4">
          <span className="text-[10px] font-mono text-accent tracking-widest">ETAPA 1 DE 3 · DIAGNÓSTICO</span>
        </div>
        <h2 className="text-[22px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
          Vamos entender seu cenário atual
        </h2>
        <p className="text-[13px] text-text-secondary mt-2">8 perguntas estratégicas para gerar seu relatório personalizado</p>
      </div>

      {/* Q1 + Q2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">1. Especialidade *</span>
          </div>
          <input
            value={form.especialidade}
            onChange={e => set("especialidade")(e.target.value)}
            placeholder="ex: Endocrinologia, Nutrologia, Cardiologia..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
          />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">2. Tempo de atuação</span>
          </div>
          <input
            value={form.tempo_atuacao}
            onChange={e => set("tempo_atuacao")(e.target.value)}
            placeholder="ex: 5 anos, recém-formado..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
          />
        </div>
      </div>

      {/* Q3 + Q4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">3. Cidade e bairro *</span>
          </div>
          <input
            value={form.cidade}
            onChange={e => set("cidade")(e.target.value)}
            placeholder="ex: Poços de Caldas, MG — Centro"
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
          />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">4. Tipo de atendimento</span>
          </div>
          <div className="flex gap-2">
            {ATENDIMENTO_OPTS.map(o => (
              <button key={o} type="button" onClick={() => set("atendimento")(o)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-[12px] font-medium transition-all",
                  form.atendimento === o
                    ? "bg-accent-dim border-accent-border text-accent"
                    : "border-border text-text-muted hover:border-border-hover",
                )}>
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Q5 */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">5. Ticket médio atual</span>
        </div>
        <input
          value={form.ticket_medio}
          onChange={e => set("ticket_medio")(e.target.value)}
          placeholder="ex: R$ 350 por consulta, R$ 2.000 por protocolo..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
        />
      </div>

      {/* Q6 */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">6. Paciente ideal — descreva</span>
        </div>
        <textarea
          value={form.paciente_ideal}
          onChange={e => set("paciente_ideal")(e.target.value)}
          placeholder="ex: Mulher 35-55 anos, nível socioeconômico B/A, preocupada com saúde hormonal e longevidade, disposta a investir em protocolo..."
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none"
        />
      </div>

      {/* Q7 */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">7. Maior desafio hoje *</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DESAFIOS.map(d => (
            <button key={d} type="button" onClick={() => set("maior_desafio")(d)}
              className={cn(
                "text-[12px] px-3 py-1.5 rounded-full border transition-all",
                form.maior_desafio === d
                  ? "bg-accent-dim border-accent-border text-accent font-medium"
                  : "border-border text-text-muted hover:border-border-hover hover:text-text-secondary",
              )}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Q8 */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wide">8. Seu maior diferencial *</span>
        </div>
        <textarea
          value={form.diferencial}
          onChange={e => set("diferencial")(e.target.value)}
          placeholder="ex: Abordo o paciente de forma integrativa, combino endocrinologia com nutrologia, tenho especialização em envelhecimento saudável e resultados rápidos em reversão de resistência insulínica..."
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none"
        />
      </div>

      <button
        type="button" onClick={onNext}
        disabled={!canProceed}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent text-background text-[15px] font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Gerar Meu Posicionamento <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// ─── Step 3: Relatório ────────────────────────────────────────────────────────

function Step3({ result, onReset, form }: { result: PosicionamentoResult; onReset: () => void; form: DiagnosticoForm }) {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-card border border-accent-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono text-accent tracking-widest uppercase mb-1">Relatório de Posicionamento</div>
            <h2 className="text-[22px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
              {result.diferenciais_competitivos.proposta_de_valor}
            </h2>
            <p className="text-[13px] text-text-secondary mt-1">{form.especialidade} · {form.cidade}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button" onClick={onReset}
              className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refazer
            </button>
            <button
              type="button"
              onClick={() => router.push("/diretor-criativo")}
              className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-lg bg-accent text-background font-semibold hover:bg-accent/90 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Diretor Criativo
            </button>
          </div>
        </div>
      </div>

      {/* 1. Nicho Ideal */}
      <Section icon={Target} emoji="🎯" title="Nicho Ideal de Atuação"
        copyText={`NICHO IDEAL\n\n${result.nicho_ideal.titulo}\n${result.nicho_ideal.descricao}\n\nJustificativa: ${result.nicho_ideal.justificativa}\nMercado: ${result.nicho_ideal.tamanho_mercado}`}>
        <div className="space-y-3">
          <div className="bg-background border border-border rounded-lg p-4">
            <div className="text-[15px] font-bold text-text-primary mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
              {result.nicho_ideal.titulo}
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">{result.nicho_ideal.descricao}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-1">Justificativa</div>
              <p className="text-[12px] text-text-secondary">{result.nicho_ideal.justificativa}</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-1">Tamanho do Mercado</div>
              <p className="text-[12px] text-text-secondary">{result.nicho_ideal.tamanho_mercado}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* 2. Público-Alvo */}
      <Section icon={User} emoji="👥" title="Público-Alvo Ideal"
        copyText={`PÚBLICO-ALVO\n\n${result.publico_alvo.avatar_nome}\nDemografia: ${result.publico_alvo.demografia}\nPsicografia: ${result.publico_alvo.psicografia}\nDores: ${result.publico_alvo.dores_principais.join(", ")}\nOnde encontrar: ${result.publico_alvo.onde_encontrar}\nComo decide: ${result.publico_alvo.como_decide}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-text-primary">{result.publico_alvo.avatar_nome}</div>
              <div className="text-[11px] text-text-muted">{result.publico_alvo.demografia}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Psicografia",        value: result.publico_alvo.psicografia },
              { label: "Onde encontrar",     value: result.publico_alvo.onde_encontrar },
              { label: "Como decide",        value: result.publico_alvo.como_decide },
            ].map(({ label, value }) => (
              <div key={label} className="bg-background border border-border rounded-lg p-3">
                <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-1">{label}</div>
                <p className="text-[12px] text-text-secondary">{value}</p>
              </div>
            ))}
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-2">Dores Principais</div>
              <div className="space-y-1">
                {result.publico_alvo.dores_principais.map((d, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px] text-text-secondary">
                    <ChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Diferenciais */}
      <Section icon={Sparkles} emoji="💎" title="Diferenciais Competitivos"
        copyText={`DIFERENCIAIS\n\nProposta de valor: ${result.diferenciais_competitivos.proposta_de_valor}\n\nDiferenciais atuais:\n${result.diferenciais_competitivos.diferenciais_atuais.map(d=>"- "+d).join("\n")}\n\nA desenvolver:\n${result.diferenciais_competitivos.diferenciais_a_desenvolver.map(d=>"- "+d).join("\n")}`}>
        <div className="space-y-3">
          <div className="bg-accent-dim border border-accent-border rounded-lg p-4">
            <div className="text-[9px] font-mono text-accent uppercase tracking-wide mb-1">Proposta de Valor Única</div>
            <p className="text-[15px] font-bold text-text-primary" style={{ fontFamily: "var(--font-playfair)" }}>
              {result.diferenciais_competitivos.proposta_de_valor}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-2">Diferenciais Atuais</div>
              <div className="space-y-1">
                {result.diferenciais_competitivos.diferenciais_atuais.map((d, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px] text-text-secondary">
                    <ChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" /><span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-2">A Desenvolver</div>
              <div className="space-y-1">
                {result.diferenciais_competitivos.diferenciais_a_desenvolver.map((d, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12px] text-text-secondary">
                    <ChevronRight className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" /><span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 4. Posicionamento */}
      <Section icon={MapPin} emoji="📍" title="Posicionamento de Mercado"
        copyText={`POSICIONAMENTO\n\nAtual: ${result.posicionamento_mercado.posicionamento_atual}\nIdeal: ${result.posicionamento_mercado.posicionamento_ideal}\nTransição: ${result.posicionamento_mercado.estrategia_transicao}\nBenchmark: ${result.posicionamento_mercado.benchmark}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Como é percebido hoje",  value: result.posicionamento_mercado.posicionamento_atual,   accent: false },
            { label: "Como deve ser percebido", value: result.posicionamento_mercado.posicionamento_ideal,   accent: true  },
            { label: "Estratégia de Transição", value: result.posicionamento_mercado.estrategia_transicao,  accent: false },
            { label: "Referências do Mercado",  value: result.posicionamento_mercado.benchmark,             accent: false },
          ].map(({ label, value, accent }) => (
            <div key={label} className={cn("border rounded-lg p-3", accent ? "bg-accent-dim border-accent-border" : "bg-background border-border")}>
              <div className={cn("text-[9px] font-mono uppercase tracking-wide mb-1", accent ? "text-accent" : "text-text-muted")}>{label}</div>
              <p className="text-[12px] text-text-secondary">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Dores */}
      <Section icon={AlertTriangle} emoji="😤" title="Principais Dores do Público"
        copyText={result.dores_publico.map(d => `[${d.intensidade}] ${d.dor}\nConteúdo: ${d.conteudo_sugerido}`).join("\n\n")}>
        <div className="space-y-2.5">
          {result.dores_publico.map((d, i) => (
            <div key={i} className="bg-background border border-border rounded-lg p-3.5">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[12px] font-semibold text-text-primary">{d.dor}</span>
                <span className={cn("text-badge font-mono font-semibold px-2 py-0.5 rounded-full border flex-shrink-0", INTENSIDADE_STYLE[d.intensidade])}>
                  {d.intensidade}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[9px] font-mono text-accent flex-shrink-0 mt-0.5">→</span>
                <span className="text-[11px] text-text-muted">{d.conteudo_sugerido}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Linha Editorial */}
      <Section icon={BookOpen} emoji="📱" title="Linha Editorial Recomendada"
        copyText={`LINHA EDITORIAL\n\nFrequência: ${result.linha_editorial.frequencia_recomendada}\nFormatos: ${result.linha_editorial.formatos_prioritarios.join(", ")}\n\nPilares:\n${result.linha_editorial.pilares.map(p => `${p.nome} (${p.percentual}): ${p.descricao}\nExemplos: ${p.exemplos.join(", ")}`).join("\n\n")}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[11px] text-text-muted">Frequência: <span className="text-text-primary font-medium">{result.linha_editorial.frequencia_recomendada}</span></span>
            <div className="flex gap-1.5">
              {result.linha_editorial.formatos_prioritarios.map(f => (
                <span key={f} className="text-badge font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">{f}</span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {result.linha_editorial.pilares.map((p, i) => (
              <div key={i} className="bg-background border border-border rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-text-primary">{p.nome}</span>
                  <span className="text-[10px] font-mono font-bold text-accent">{p.percentual}</span>
                </div>
                <p className="text-[11px] text-text-secondary mb-2">{p.descricao}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.exemplos.map(e => (
                    <span key={e} className="text-[10px] px-2 py-0.5 rounded-full border border-border text-text-muted">{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 7. Estratégia de Comunicação */}
      <Section icon={MessageSquare} emoji="🗣️" title="Estratégia de Comunicação"
        copyText={`COMUNICAÇÃO\n\nTom de voz: ${result.estrategia_comunicacao.tom_de_voz}\nPalavras-chave: ${result.estrategia_comunicacao.palavras_chave.join(", ")}\nEvitar: ${result.estrategia_comunicacao.frases_a_evitar.join(", ")}\nStorytelling: ${result.estrategia_comunicacao.storytelling}`}>
        <div className="space-y-3">
          <div className="bg-accent-dim border border-accent-border rounded-lg p-3">
            <div className="text-[9px] font-mono text-accent uppercase tracking-wide mb-1">Tom de Voz</div>
            <p className="text-[13px] font-medium text-text-primary">{result.estrategia_comunicacao.tom_de_voz}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-2">Palavras-Chave</div>
              <div className="flex flex-wrap gap-1.5">
                {result.estrategia_comunicacao.palavras_chave.map(p => (
                  <span key={p} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent">{p}</span>
                ))}
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-2">Frases a Evitar</div>
              <div className="space-y-1">
                {result.estrategia_comunicacao.frases_a_evitar.map((f, i) => (
                  <div key={i} className="text-[11px] text-red-400 line-through">{f}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wide mb-1">Storytelling</div>
            <p className="text-[12px] text-text-secondary">{result.estrategia_comunicacao.storytelling}</p>
          </div>
        </div>
      </Section>

      {/* 8. Top 10 Temas */}
      <Section icon={Zap} emoji="🔥" title="Top 10 Temas Prioritários para Conteúdo"
        copyText={result.top10_temas.map((t, i) => `${i+1}. [${t.formato}] ${t.tema}\nGancho: ${t.gancho}\nPor quê: ${t.justificativa}`).join("\n\n")}>
        <div className="space-y-2">
          {result.top10_temas.map((t, i) => (
            <div key={i} className="bg-background border border-border rounded-lg p-3.5">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-accent font-mono w-5">{i + 1}.</span>
                  <span className="text-[13px] font-semibold text-text-primary">{t.tema}</span>
                </div>
                <span className="text-badge font-mono px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent flex-shrink-0">{t.formato}</span>
              </div>
              <div className="ml-7">
                <p className="text-[11px] text-text-secondary mb-1">{t.justificativa}</p>
                <div className="flex items-start gap-1">
                  <span className="text-[9px] font-mono text-accent flex-shrink-0">GANCHO:</span>
                  <span className="text-[11px] text-text-muted italic">{t.gancho}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY_FORM: DiagnosticoForm = {
  especialidade: "", tempo_atuacao: "", cidade: "",
  atendimento: "Particular", ticket_medio: "",
  paciente_ideal: "", maior_desafio: "", diferencial: "",
}

export default function PosicionamentoPage() {
  const [step,      setStep]     = useState<1|2|3>(1)
  const [form,      setForm]     = useState<DiagnosticoForm>(EMPTY_FORM)
  const [resultado, setResultado]= useState<PosicionamentoResult | null>(null)
  const [error,     setError]    = useState<string | null>(null)
  const [toast,     setToast]    = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000)
  }

  const handleGenerate = async () => {
    setStep(2); setError(null)
    try {
      const res = await fetch("/api/posicionamento", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      })
      const data = await res.json() as PosicionamentoResult & { error?: string }
      if (data.error) throw new Error(data.error)
      setResultado(data)
      setStep(3)
      showToast("Relatório de posicionamento gerado!")
    } catch (e) {
      setError("Erro ao gerar posicionamento: " + String(e))
      setStep(1)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Posicionamento Médico"
        subtitle="DIAGNÓSTICO · NICHO · ESTRATÉGIA DE CRESCIMENTO"
        actions={
          step === 1 ? (
            <div className="flex items-center gap-1.5">
              {[1,2,3].map(s => (
                <div key={s} className={cn("w-2 h-2 rounded-full transition-all", step === s ? "bg-accent" : "bg-border")} />
              ))}
            </div>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8">
        {step === 1 && (
          <>
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 max-w-2xl mx-auto">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-700">{error}</p>
              </div>
            )}
            <Step1 form={form} setForm={setForm} onNext={handleGenerate} />
          </>
        )}
        {step === 2 && <LoadingScreen />}
        {step === 3 && resultado && (
          <Step3 result={resultado} onReset={() => { setStep(1); setForm(EMPTY_FORM); setResultado(null) }} form={form} />
        )}
      </div>

      <Toast message={toast?.message ?? null} type={toast?.type} />
    </div>
  )
}
