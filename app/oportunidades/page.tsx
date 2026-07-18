"use client"

import { useState, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  CircleDollarSign, CalendarDays, TrendingUp, AlertTriangle, Loader2,
  AlertCircle, Check, RefreshCw, ArrowRight, Zap, Clock,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

type Urgencia    = "AGORA" | "EM BREVE" | "PLANEJAMENTO"
type Concorrencia= "Baixa" | "Média" | "Alta"

interface EventoCalendario {
  periodo:              string
  evento:               string
  oportunidade_conteudo:string
  oportunidade_campanha:string
  urgencia:             Urgencia
}

interface TendenciaOportunidade {
  tema:               string
  janela_oportunidade:string
  por_que_agora:      string
  concorrencia:       Concorrencia
  score:              number
}

interface AlertaFaturamento {
  oportunidade: string
  periodo:      string
  campanha:     string
  formatos:     string[]
}

interface OportunidadesResult {
  calendario: EventoCalendario[]
  tendencias: TendenciaOportunidade[]
  alertas:    AlertaFaturamento[]
}

// ─── Config ─────────────────────────────────────────────────────────────────────

const URGENCIA_STYLE: Record<Urgencia, string> = {
  "AGORA":        "bg-red-50 border-red-200 text-red-700",
  "EM BREVE":     "bg-amber-50 border-amber-200 text-amber-700",
  "PLANEJAMENTO": "bg-blue-50 border-blue-200 text-blue-700",
}

const CONCORRENCIA_STYLE: Record<Concorrencia, string> = {
  "Baixa": "text-green-400",
  "Média": "text-amber-400",
  "Alta":  "text-red-400",
}

const JANELA_OPTIONS = [
  { label: "30 dias", value: "30" },
  { label: "60 dias", value: "60" },
  { label: "90 dias", value: "90" },
]

// ─── Mock fallback ──────────────────────────────────────────────────────────────

const MOCK: OportunidadesResult = {
  calendario: [
    { periodo: "Junho/Julho 2026", evento: "Inverno — queda na imunidade e vitamina D", oportunidade_conteudo: "Suplementação de Vitamina D no inverno: quem precisa e quando", oportunidade_campanha: "Checkup de inverno com foco em imunidade e vitaminas", urgencia: "AGORA" },
    { periodo: "Agosto 2026", evento: "Dia dos Pais (2ª semana de agosto)", oportunidade_conteudo: "Saúde masculina: testosterona, andropausa e vitalidade", oportunidade_campanha: "Consulta de saúde masculina completa — presente para o pai", urgencia: "EM BREVE" },
    { periodo: "Outubro 2026", evento: "Outubro Rosa — saúde feminina", oportunidade_conteudo: "Saúde hormonal feminina e prevenção em outubro", oportunidade_campanha: "Rastreamento hormonal completo feminino em outubro", urgencia: "PLANEJAMENTO" },
    { periodo: "Novembro 2026", evento: "Novembro Azul — saúde masculina", oportunidade_conteudo: "Saúde metabólica e hormonal masculina: o que checar", oportunidade_campanha: "Checkup metabólico e hormonal masculino completo", urgencia: "PLANEJAMENTO" },
    { periodo: "Dezembro/Janeiro", evento: "Verão — preparo corporal", oportunidade_conteudo: "Protocolo de emagrecimento para o verão com ciência", oportunidade_campanha: "Programa emagrecimento + qualidade de vida para o verão", urgencia: "PLANEJAMENTO" },
  ],
  tendencias: [
    { tema: "Retatrutida (RET-001)", janela_oportunidade: "Próximas 4-8 semanas", por_que_agora: "Alta expectativa regulatória e interesse crescente do público. Poucos médicos criando conteúdo educativo ainda.", concorrencia: "Baixa", score: 92 },
    { tema: "Longevidade e Saúde Hormonal Masculina", janela_oportunidade: "Janela de 2-3 meses", por_que_agora: "Geração X entrando na andropausa. Demanda crescente por protocolos de testosterona e anti-aging.", concorrencia: "Média", score: 79 },
    { tema: "Climatério e Qualidade de Vida", janela_oportunidade: "Janela perene — crescimento contínuo", por_que_agora: "Millennials femininas entrando no climatério. Alta demanda por conteúdo sem julgamento e embasado.", concorrencia: "Média", score: 84 },
    { tema: "Microbioma e Metabolismo", janela_oportunidade: "Próximas 6-10 semanas", por_que_agora: "Boom de interesse em saúde intestinal pós-antibiótico. Conexão com emagrecimento e energia viraliza.", concorrencia: "Baixa", score: 71 },
  ],
  alertas: [
    { oportunidade: "Alta procura por emagrecimento com GLP-1 antes do verão", periodo: "Junho — Setembro 2026", campanha: "Pacote consulta + protocolo personalizado com GLP-1 ou análogos. Foco em elegibilidade, expectativas realistas e acompanhamento trimestral.", formatos: ["Reel", "Story", "Anúncio"] },
    { oportunidade: "Demanda crescente por reposição hormonal feminina na faixa 45-55 anos", periodo: "Perene — pico em julho e agosto", campanha: "Consulta de rastreamento hormonal completo com análise de sintomas. Posicionar como transformação de qualidade de vida, não apenas menopausa.", formatos: ["Reel", "Carrossel"] },
    { oportunidade: "Interesse em protocolos de longevidade e biomarcadores", periodo: "Crescimento contínuo em 2026", campanha: "Protocolo longevidade personalizado com análise de marcadores de envelhecimento. Público premium, alto ticket.", formatos: ["Carrossel", "Anúncio"] },
  ],
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function OportunidadesPage() {
  const [especialidade, setEspecialidade] = useState("Endocrinologia + Nutrologia")
  const [localizacao,   setLocalizacao]   = useState("")
  const [janela,        setJanela]        = useState("30")
  const [resultado,     setResultado]     = useState<OportunidadesResult | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [savedItems,    setSavedItems]    = useState<string[]>([])
  const [toast,         setToast]         = useState<string | null>(null)

  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  const detectar = async () => {
    setError(null); setLoading(true); setResultado(null); setSavedItems([])

    try {
      const res  = await fetch("/api/oportunidades", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ especialidade, localizacao, janela }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResultado(data)
    } catch (e) {
      console.error("[oportunidades] erro ao detectar oportunidades:", e)
      setError("Erro ao detectar oportunidades. Usando dados de demonstração.")
      setResultado(MOCK)
    } finally {
      setLoading(false)
    }
  }

  const aproveitarTendencia = async (t: TendenciaOportunidade, key: string) => {
    try {
      await fetch("/api/pautas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          titulo:    t.tema,
          nota:      `Janela: ${t.janela_oportunidade}\nPor que agora: ${t.por_que_agora}`,
          categoria: "Oportunidade de Tendência",
          prioridade:"Alta",
          estagio:   "Ideia",
          tags:      ["oportunidade", "tendencia", t.concorrencia.toLowerCase()],
        }),
      })
      setSavedItems(prev => [...prev, key])
      showToast("Oportunidade salva no Banco de Pautas com prioridade Alta!")
    } catch (e) {
      console.error("[oportunidades] erro ao salvar tendência:", e)
      showToast("Erro ao salvar. Tente novamente.")
    }
  }

  const gerarConteudoCalendario = async (ev: EventoCalendario, key: string) => {
    try {
      await fetch("/api/pautas", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          titulo:    ev.oportunidade_conteudo,
          nota:      `Evento: ${ev.evento} | Período: ${ev.periodo}\nCampanha associada: ${ev.oportunidade_campanha}`,
          categoria: "Calendário Sazonal",
          prioridade: ev.urgencia === "AGORA" ? "Alta" : ev.urgencia === "EM BREVE" ? "Média" : "Baixa",
          estagio:   "Ideia",
          tags:      ["calendario", "sazonal", ev.urgencia.toLowerCase()],
        }),
      })
      setSavedItems(prev => [...prev, key])
      showToast("Conteúdo salvo no Banco de Pautas!")
    } catch (e) {
      console.error("[oportunidades] erro ao salvar conteúdo do calendário:", e)
      showToast("Erro ao salvar. Tente novamente.")
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Detector de Oportunidades"
        subtitle="QUANDO E O QUE CRIAR PARA CRESCER E FATURAR · SAZONALIDADE · TENDÊNCIAS"
        actions={
          resultado ? (
            <button
              onClick={() => { setResultado(null); setError(null); setSavedItems([]) }}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Nova análise
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* Input */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div>
            <h3 className="text-[13px] font-semibold text-text-primary">Configurar Análise</h3>
            <p className="text-[11px] text-text-muted mt-0.5">Identifique as melhores oportunidades de conteúdo e faturamento para o seu perfil</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">Especialidade</label>
              <input
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">Localização</label>
              <input
                value={localizacao}
                onChange={e => setLocalizacao(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">Janela de análise</label>
              <div className="flex gap-1">
                {JANELA_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setJanela(opt.value)}
                    className={cn(
                      "flex-1 text-[11px] py-2.5 rounded-lg border transition-all font-medium",
                      janela === opt.value
                        ? "bg-accent-dim border-accent-border text-accent"
                        : "border-border text-text-muted hover:text-text-secondary"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={detectar}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Detectando oportunidades...</>
              : <><CircleDollarSign className="w-4 h-4" /> Detectar Oportunidades</>}
          </button>
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
            <CircleDollarSign className="w-10 h-10 text-accent animate-pulse" />
            <div className="text-center">
              <div className="text-[14px] font-semibold text-text-primary">Detectando oportunidades de crescimento...</div>
              <div className="text-[10px] font-mono text-text-muted tracking-widest mt-1">ANALISANDO SAZONALIDADE · TENDÊNCIAS · FATURAMENTO</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !resultado && !error && (
          <div className="bg-card border border-border rounded-lg py-16 flex flex-col items-center justify-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
              <CircleDollarSign className="w-7 h-7 text-accent" />
            </div>
            <div className="text-center max-w-lg">
              <h3 className="text-[15px] font-semibold text-text-primary mb-2">Detector de Oportunidades de Faturamento</h3>
              <p className="text-[12px] text-text-muted leading-relaxed">
                Configure sua especialidade e localização. O sistema detecta oportunidades sazonais, tendências com janela aberta e alertas de alta demanda — para você criar conteúdo e campanhas no momento certo.
              </p>
            </div>
            <div className="flex gap-3">
              {[CalendarDays, TrendingUp, AlertTriangle].map((Icon, i) => (
                <div key={i} className="w-10 h-10 rounded-xl bg-white/[0.04] border border-border flex items-center justify-center">
                  <Icon className="w-4 h-4 text-text-muted" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && resultado && (
          <div className="space-y-8">

            {/* Seção 1: Calendário Sazonal */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-text-primary">Calendário Sazonal</h2>
                  <p className="text-[10px] text-text-muted">Datas e eventos relevantes nos próximos {janela} dias</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(resultado.calendario ?? []).map((ev, i) => {
                  const key = `cal-${i}`
                  const saved = savedItems.includes(key)
                  return (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono text-text-muted mb-1">{ev.periodo}</div>
                          <p className="text-[12px] font-semibold text-text-primary leading-snug">{ev.evento}</p>
                        </div>
                        <span className={cn("text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border flex-shrink-0", URGENCIA_STYLE[ev.urgencia] ?? URGENCIA_STYLE["PLANEJAMENTO"])}>
                          {ev.urgencia}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div>
                          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-0.5">Conteúdo</div>
                          <p className="text-[11px] text-text-secondary leading-snug">{ev.oportunidade_conteudo}</p>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-0.5">Campanha</div>
                          <p className="text-[11px] text-text-secondary leading-snug">{ev.oportunidade_campanha}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => gerarConteudoCalendario(ev, key)}
                        disabled={saved}
                        className={cn(
                          "flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold border transition-all",
                          saved
                            ? "bg-accent-dim border-accent-border text-accent cursor-default"
                            : "border-border text-text-muted hover:border-accent-border hover:text-accent"
                        )}
                      >
                        {saved ? <><Check className="w-3 h-3" /> Salvo</> : <><ArrowRight className="w-3 h-3" /> Gerar Conteúdo</>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Seção 2: Tendências com Janela de Oportunidade */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-text-primary">Tendências com Janela de Oportunidade</h2>
                  <p className="text-[10px] text-text-muted">Temas em alta com baixa saturação — aproveite agora</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(resultado.tendencias ?? []).map((t, i) => {
                  const key = `tend-${i}`
                  const saved = savedItems.includes(key)
                  return (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[13px] font-semibold text-text-primary leading-snug flex-1">{t.tema}</h3>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[20px] font-bold font-mono text-accent leading-none">{t.score}</div>
                          <div className="text-[8px] font-mono text-text-muted">score</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-text-muted flex-shrink-0" />
                        <span className="text-[10px] text-text-secondary">{t.janela_oportunidade}</span>
                      </div>

                      <p className="text-[11px] text-text-secondary leading-relaxed">{t.por_que_agora}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Concorrência:</span>
                          <span className={cn("text-[10px] font-bold", CONCORRENCIA_STYLE[t.concorrencia] ?? "text-text-secondary")}>{t.concorrencia}</span>
                        </div>
                        <div className="flex-1 mx-3 h-1 bg-background rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", t.score >= 85 ? "bg-accent" : t.score >= 70 ? "bg-amber-400" : "bg-blue-500")}
                            style={{ width: `${t.score}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => aproveitarTendencia(t, key)}
                        disabled={saved}
                        className={cn(
                          "flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold border transition-all",
                          saved
                            ? "bg-accent-dim border-accent-border text-accent cursor-default"
                            : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
                        )}
                      >
                        {saved ? <><Check className="w-3 h-3" /> Salvo na Pauta</> : <><Zap className="w-3 h-3" /> Aproveitar Agora</>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Seção 3: Alertas de Faturamento */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
                  <CircleDollarSign className="w-3.5 h-3.5 text-accent" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-text-primary">Alertas de Faturamento</h2>
                  <p className="text-[10px] text-text-muted">Oportunidades de serviço e consulta com alta demanda</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(resultado.alertas ?? []).map((al, i) => (
                  <div key={i} className="bg-card border border-accent-border/40 rounded-xl p-4 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
                    <div>
                      <p className="text-[13px] font-semibold text-text-primary leading-snug">{al.oportunidade}</p>
                      <div className="text-[10px] font-mono text-text-muted mt-1">{al.periodo}</div>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed flex-1">{al.campanha}</p>
                    <div className="flex flex-wrap gap-1">
                      {(al.formatos ?? []).map((f, fi) => (
                        <span key={fi} className="text-badge font-mono font-semibold px-2 py-0.5 rounded-full border bg-accent-dim border-accent-border text-accent">
                          {f}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => showToast("Módulo Campanha em breve — fique ligado!")}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold border border-accent-border text-accent hover:bg-accent-dim transition-all"
                    >
                      <CircleDollarSign className="w-3 h-3" /> Criar Campanha Completa
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          <Check className="w-3.5 h-3.5" /> {toast}
        </div>
      )}
    </div>
  )
}
