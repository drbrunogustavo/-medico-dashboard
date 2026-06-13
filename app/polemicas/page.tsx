"use client"

import { useState, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Flame, BookOpen, Loader2, AlertCircle,
  X, Search, Plus, Check, RefreshCw,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Abordagem {
  tipo:      "conservadora" | "equilibrada" | "polemica" | "viral"
  titulo:    string
  gancho:    string
  estrutura: string[]
  risco:     "Baixo" | "Médio" | "Alto"
  score:     number
}

interface Pauta {
  id:        number | string
  titulo:    string
  categoria: string
  nota?:     string
}

// ─── Config ─────────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<Abordagem["tipo"], {
  label: string; desc: string
  color: string; bg: string; border: string; headerBorder: string
}> = {
  conservadora: {
    label: "Conservadora",         desc: "Tom seguro, baseado em evidências",
    color: "text-blue-700",        bg: "bg-blue-50",
    border: "border-blue-200",     headerBorder: "border-blue-200",
  },
  equilibrada: {
    label: "Equilibrada",          desc: "Dois lados, estimula reflexão",
    color: "text-amber-700",       bg: "bg-amber-50",
    border: "border-amber-200",    headerBorder: "border-amber-200",
  },
  polemica: {
    label: "Polêmica Controlada",  desc: "Questiona consensos com ciência",
    color: "text-orange-700",      bg: "bg-orange-50",
    border: "border-orange-200",   headerBorder: "border-orange-200",
  },
  viral: {
    label: "Altamente Viral",      desc: "Máximo impacto emocional",
    color: "text-red-700",         bg: "bg-red-50",
    border: "border-red-200",      headerBorder: "border-red-200",
  },
}

const RISCO_STYLE: Record<Abordagem["risco"], string> = {
  "Baixo": "bg-green-50 border-green-200 text-green-700",
  "Médio": "bg-amber-50 border-amber-200 text-amber-700",
  "Alto":  "bg-red-50 border-red-200 text-red-700",
}

// ─── Mock fallback ──────────────────────────────────────────────────────────────

const MOCK_ABORDAGENS: Abordagem[] = [
  {
    tipo: "conservadora",
    titulo: "Resistência à insulina: o que os estudos de 2025 revelam",
    gancho: "Você provavelmente já ouviu falar em resistência à insulina.\nMas o que a ciência mais recente realmente nos diz sobre esse tema?\nVou compartilhar os dados mais atualizados e o que isso muda na prática clínica.",
    estrutura: [
      "1. O que é resistência à insulina e como ela se desenvolve no organismo",
      "2. Marcadores laboratoriais atualizados e como interpretar os resultados",
      "3. Fatores dietéticos com maior nível de evidência científica",
      "4. Intervenções de estilo de vida validadas em estudos randomizados",
      "5. Quando considerar tratamento farmacológico e quais as opções atuais",
    ],
    risco: "Baixo",
    score: 44,
  },
  {
    tipo: "equilibrada",
    titulo: "Jejum intermitente: médicos pró e contra — quem tem razão?",
    gancho: "Há médicos com estudos robustos defendendo o jejum.\nHá médicos com estudos igualmente robustos contra.\nAmbo estão certos — e aqui está o porquê.",
    estrutura: [
      "1. Os benefícios reais documentados em estudos de longa duração",
      "2. As contraindicações absolutas que raramente aparecem nas redes",
      "3. Populações que se beneficiam mais — e aquelas com risco aumentado",
      "4. O que acontece com hormônios e metabolismo nas primeiras 72h",
      "5. Como personalizar o protocolo com base no perfil metabólico individual",
    ],
    risco: "Baixo",
    score: 67,
  },
  {
    tipo: "polemica",
    titulo: "Por que seu médico nunca pediu ESSE exame de testosterona",
    gancho: "Existe um exame que eu peço em 100% dos meus pacientes com suspeita de andropausa.\nA maioria dos médicos nunca solicita.\nIsso está atrasando o diagnóstico de hipogonadismo em anos.",
    estrutura: [
      "1. A diferença crítica entre testosterona total, livre e biodisponível",
      "2. Por que o valor de referência do laboratório está desatualizado",
      "3. O que os guidelines europeus já recomendam desde 2022",
      "4. Como interpretar o resultado no contexto clínico completo do paciente",
      "5. O que muda no tratamento quando você pede o exame correto",
    ],
    risco: "Médio",
    score: 83,
  },
  {
    tipo: "viral",
    titulo: "Analisei 47 estudos de semaglutida. Encontrei algo que ninguém está falando.",
    gancho: "Passei 3 semanas revisando cada estudo pivotal de semaglutida publicado.\nEncontrei um dado que nenhum médico está destacando nas redes sociais.\nE ele muda completamente a conversa sobre esse medicamento.",
    estrutura: [
      "1. Os dados de descontinuação que os estudos patrocinados não destacam",
      "2. O que acontece com a composição corporal quando se interrompe o uso",
      "3. O viés de publicação sistemático que favorece resultados positivos",
      "4. Alternativas com evidência comparável mas custo 10 vezes menor",
      "5. Minha abordagem honesta com os pacientes sobre expectativas reais",
    ],
    risco: "Alto",
    score: 95,
  },
]

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function PolemicasPage() {
  const [tema,          setTema]          = useState("")
  const [abordagens,    setAbordagens]    = useState<Abordagem[]>([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [savedCards,    setSavedCards]    = useState<number[]>([])
  const [toast,         setToast]         = useState<string | null>(null)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [pautas,        setPautas]        = useState<Pauta[]>([])
  const [loadingPautas, setLoadingPautas] = useState(false)
  const [pautaSearch,   setPautaSearch]   = useState("")

  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 2800)
  }

  // ── Generate abordagens ────────────────────────────────────────────────────

  const gerarAbordagens = async () => {
    if (!tema.trim()) { setError("Digite um tema antes de gerar as abordagens."); return }
    setError(null); setLoading(true); setAbordagens([]); setSavedCards([])

    try {
      const res  = await fetch("/api/polemicas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tema }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAbordagens(data.abordagens ?? [])
    } catch (e) {
      setError("Erro ao gerar abordagens. Usando exemplos de demonstração.")
      setAbordagens(MOCK_ABORDAGENS)
    } finally {
      setLoading(false)
    }
  }

  // ── Pauta modal ────────────────────────────────────────────────────────────

  const abrirModal = async () => {
    setModalOpen(true); setPautaSearch("")
    if (pautas.length > 0) return
    setLoadingPautas(true)
    try {
      const res  = await fetch("/api/pautas")
      const data = await res.json()
      setPautas(Array.isArray(data) ? data : [])
    } catch { setPautas([]) }
    finally  { setLoadingPautas(false) }
  }

  const selecionarPauta = (p: Pauta) => {
    setTema(p.titulo)
    setModalOpen(false)
  }

  // ── Save to Banco de Pautas ────────────────────────────────────────────────

  const usarAbordagem = async (ab: Abordagem, idx: number) => {
    try {
      const res = await fetch("/api/pautas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          titulo:     ab.titulo,
          nota:       `[${TIPO_CONFIG[ab.tipo].label.toUpperCase()}] ${ab.gancho.replace(/\n/g, ' ')}\n\nEstrutura:\n${ab.estrutura.join('\n')}`,
          categoria:  "Oportunidade de Conteúdo",
          prioridade: ab.score >= 80 ? "Alta" : ab.score >= 60 ? "Média" : "Baixa",
          estagio:    "Ideia",
          tags:       [ab.tipo, `risco-${ab.risco.toLowerCase()}`],
        }),
      })
      if (!res.ok) throw new Error()
      setSavedCards(prev => [...prev, idx])
      showToast("Abordagem salva no Banco de Pautas!")
    } catch {
      showToast("Erro ao salvar. Tente novamente.")
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Polêmicas Controladas"
        subtitle="VIRALIZAÇÃO ÉTICA · ABORDAGENS · ESTRATÉGIA DE CONTEÚDO MÉDICO"
        actions={
          abordagens.length > 0 ? (
            <button
              onClick={() => { setAbordagens([]); setError(null) }}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Nova análise
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* Input */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary">Tema do Conteúdo</h3>
              <p className="text-[11px] text-text-muted mt-0.5">Digite o tema e o Claude gerará 4 abordagens com níveis crescentes de impacto</p>
            </div>
            <button
              onClick={abrirModal}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all flex-shrink-0"
            >
              <BookOpen className="w-3 h-3" /> Importar Pauta
            </button>
          </div>
          <div className="flex gap-3">
            <input
              value={tema}
              onChange={e => setTema(e.target.value)}
              onKeyDown={e => e.key === "Enter" && gerarAbordagens()}
              placeholder="Ex: resistência à insulina, testosterona e andropausa, GLP-1 para não diabéticos..."
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
            />
            <button
              onClick={gerarAbordagens}
              disabled={loading || !tema.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
                : <><Flame className="w-4 h-4" /> Gerar Abordagens</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Flame className="w-10 h-10 text-accent animate-pulse" />
            <div className="text-center">
              <div className="text-[14px] font-semibold text-text-primary">Analisando estratégias de viralização...</div>
              <div className="text-[10px] font-mono text-text-muted tracking-widest mt-1">CLAUDE ELABORANDO 4 ABORDAGENS</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && abordagens.length === 0 && !error && (
          <div className="bg-card border border-border rounded-lg py-16 flex flex-col items-center justify-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
              <Flame className="w-7 h-7 text-accent" />
            </div>
            <div className="text-center max-w-lg">
              <h3 className="text-[15px] font-semibold text-text-primary mb-2">Gerador de Polêmicas Controladas</h3>
              <p className="text-[12px] text-text-muted leading-relaxed">
                Digite qualquer tema médico e receba 4 abordagens calibradas — da mais conservadora à mais viral — com gancho, estrutura de roteiro e score de viralização. Tudo com responsabilidade ética.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-lg">
              {(["conservadora", "equilibrada", "polemica", "viral"] as const).map(t => {
                const c = TIPO_CONFIG[t]
                return (
                  <div key={t} className={cn("rounded-lg p-3 text-center border", c.bg, c.border)}>
                    <div className={cn("text-[10px] font-semibold leading-tight", c.color)}>{c.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cards */}
        {!loading && abordagens.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {abordagens.map((ab, idx) => {
              const c    = TIPO_CONFIG[ab.tipo] ?? TIPO_CONFIG.conservadora
              const sent = savedCards.includes(idx)
              return (
                <div key={idx} className={cn("rounded-xl border flex flex-col transition-all hover:-translate-y-0.5", c.bg, c.border)}>

                  {/* Card header */}
                  <div className={cn("px-4 py-3 border-b", c.headerBorder)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", c.color)}>
                        {c.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full border", RISCO_STYLE[ab.risco])}>
                          {ab.risco}
                        </span>
                        <span className={cn("text-[11px] font-bold font-mono tabular-nums", c.color)}>
                          {ab.score}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-text-muted">{c.desc}</p>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 space-y-3">

                    {/* Título */}
                    <div>
                      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Título sugerido</div>
                      <p className="text-[12px] font-semibold text-text-primary leading-snug">{ab.titulo}</p>
                    </div>

                    {/* Gancho */}
                    <div>
                      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Gancho de abertura</div>
                      <p className="text-[11px] text-text-secondary leading-relaxed italic whitespace-pre-line">{ab.gancho}</p>
                    </div>

                    {/* Estrutura */}
                    <div>
                      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Estrutura do roteiro</div>
                      <div className="space-y-1">
                        {(ab.estrutura ?? []).map((ponto, pi) => (
                          <div key={pi} className="flex items-start gap-2">
                            <span className={cn("text-[9px] font-bold font-mono flex-shrink-0 mt-0.5", c.color)}>
                              {pi + 1}
                            </span>
                            <p className="text-[10px] text-text-secondary leading-snug">{ponto.replace(/^\d+\.\s*/, "")}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Score bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Viralização estimada</span>
                        <span className={cn("text-[11px] font-bold font-mono", c.color)}>{ab.score}/100</span>
                      </div>
                      <div className="h-1 bg-background rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            ab.score >= 85 ? "bg-red-500" :
                            ab.score >= 70 ? "bg-orange-400" :
                            ab.score >= 55 ? "bg-amber-400" : "bg-blue-500"
                          )}
                          style={{ width: `${ab.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => usarAbordagem(ab, idx)}
                      disabled={savedCards.includes(idx)}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-semibold transition-all border",
                        sent
                          ? "bg-accent-dim border-accent-border text-accent cursor-default"
                          : `${c.bg} ${c.border} ${c.color} hover:bg-opacity-70`
                      )}
                    >
                      {sent
                        ? <><Check className="w-3.5 h-3.5" /> Salvo na Pauta</>
                        : <><Plus className="w-3.5 h-3.5" /> Usar este</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          <Check className="w-3.5 h-3.5" /> {toast}
        </div>
      )}

      {/* Pauta import modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,9,14,0.88)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-lg rounded-xl border flex flex-col"
            style={{ background: "var(--surface)", borderColor: "var(--border)", maxHeight: "80vh" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <span className="text-[13px] font-semibold text-text-primary">Importar do Banco de Pautas</span>
              </div>
              <button onClick={() => setModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-text-muted hover:text-text-primary transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  autoFocus
                  value={pautaSearch}
                  onChange={e => setPautaSearch(e.target.value)}
                  placeholder="Buscar pauta..."
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {loadingPautas ? (
                <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[12px] font-mono">Carregando pautas...</span>
                </div>
              ) : pautas.length === 0 ? (
                <p className="text-center py-12 text-[12px] text-text-muted">Nenhuma pauta encontrada.</p>
              ) : (
                <div className="space-y-1">
                  {pautas
                    .filter(p => !pautaSearch || p.titulo.toLowerCase().includes(pautaSearch.toLowerCase()))
                    .map(pauta => (
                      <button key={pauta.id} onClick={() => selecionarPauta(pauta)}
                        className="w-full text-left px-4 py-3 rounded-lg border border-transparent hover:border-accent-border hover:bg-accent-dim/30 transition-all group">
                        <p className="text-[12px] font-medium text-text-primary leading-snug group-hover:text-accent transition-colors">
                          {pauta.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">
                            {pauta.categoria}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
