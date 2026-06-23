"use client"

import { useState } from "react"
import { MapPin, Sparkles, Loader2, ChevronRight, AlertTriangle, Zap, ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Etapa {
  id:        string
  nome:      string
  emoji:     string
  desc:      string
  canais:    string
  mensagens: string
  acoes:     string
  atritos:   string
}

interface AnaliseIA {
  pontos_cegos:          string[]
  sugestoes_automacao:   { etapa: string; sugestao: string; impacto: string }[]
  jornada_ideal_diff:    { etapa: string; situacao_atual: string; situacao_ideal: string }[]
  prioridades:           { prioridade: number; acao: string; justificativa: string }[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ETAPAS_BASE: Etapa[] = [
  { id: "descoberta",   nome: "Descoberta",   emoji: "🔍", desc: "Como o paciente encontra você", canais: "", mensagens: "", acoes: "", atritos: "" },
  { id: "interesse",    nome: "Interesse",    emoji: "💡", desc: "Avalia se você é a escolha certa", canais: "", mensagens: "", acoes: "", atritos: "" },
  { id: "consulta",     nome: "Consulta",     emoji: "🩺", desc: "Da decisão ao atendimento", canais: "", mensagens: "", acoes: "", atritos: "" },
  { id: "tratamento",   nome: "Tratamento",   emoji: "💊", desc: "Durante o protocolo", canais: "", mensagens: "", acoes: "", atritos: "" },
  { id: "fidelizacao",  nome: "Fidelização",  emoji: "❤️", desc: "Transformar paciente em fã", canais: "", mensagens: "", acoes: "", atritos: "" },
]

const CAMPOS: { key: keyof Omit<Etapa,"id"|"nome"|"emoji"|"desc">; label: string; ph: string }[] = [
  { key: "canais",    label: "Canais de aquisição",    ph: "Instagram, indicação, Google Ads..." },
  { key: "mensagens", label: "Mensagens-chave",        ph: "Qual promessa/conteúdo você entrega aqui?" },
  { key: "acoes",     label: "Ações automáticas",      ph: "WhatsApp bot, e-mail, régua de nurturing..." },
  { key: "atritos",   label: "Pontos de atrito",       ph: "Onde perde pacientes nessa etapa?" },
]

// ─── Completude ───────────────────────────────────────────────────────────────

function completude(e: Etapa) {
  const campos: (keyof Etapa)[] = ["canais","mensagens","acoes","atritos"]
  return campos.filter(c => (e[c] as string).trim().length > 0).length
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JornadaPage() {
  const [etapas,   setEtapas]   = useState<Etapa[]>(ETAPAS_BASE)
  const [ativa,    setAtiva]    = useState("descoberta")
  const [analise,  setAnalise]  = useState<AnaliseIA | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  function updateEtapa(id: string, key: keyof Etapa, val: string) {
    setEtapas(prev => prev.map(e => e.id === id ? { ...e, [key]: val } : e))
  }

  async function analisar() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/jornada", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapas }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? "Erro"); return }
      setAnalise(data as AnaliseIA)
    } catch (e) {
      console.error("[jornada] erro ao analisar jornada:", e)
      setError("Erro de conexão.")
    } finally {
      setLoading(false)
    }
  }

  const etapaAtiva = etapas.find(e => e.id === ativa)!
  const totalComp  = etapas.reduce((s, e) => s + completude(e), 0)
  const maxComp    = etapas.length * 4

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 md:p-8 pb-0 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Jornada do Paciente</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">CONSULTÓRIO · MAPA DE EXPERIÊNCIA</p>
          <p className="text-[12px] text-text-secondary mt-1.5">Mapeie cada etapa da experiência do paciente, da descoberta ao pós-consulta.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-text-muted">
            {totalComp}/{maxComp} campos preenchidos
          </div>
          <button
            onClick={analisar}
            disabled={loading || totalComp === 0}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors",
              !loading && totalComp > 0
                ? "bg-accent/10 border border-accent/30 text-accent hover:bg-accent/15"
                : "border border-[--border] text-text-muted cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analisar com IA
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* Mapa visual */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {etapas.map((e, i) => {
            const comp = completude(e)
            const isActive = ativa === e.id
            return (
              <div key={e.id} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setAtiva(e.id)}
                  className={cn(
                    "rounded-xl border p-3 w-32 text-left transition-all",
                    isActive
                      ? "border-accent/40 bg-accent/5"
                      : "border-[--border] bg-[--surface] hover:border-[--border-hover]"
                  )}
                >
                  <div className="text-lg mb-1">{e.emoji}</div>
                  <p className={cn("text-xs font-semibold", isActive ? "text-accent" : "text-text-primary")}>{e.nome}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{e.desc}</p>
                  <div className="flex gap-0.5 mt-2">
                    {[0,1,2,3].map(j => (
                      <div key={j} className={cn("h-1 flex-1 rounded-full", j < comp ? "bg-accent" : "bg-[--border]")} />
                    ))}
                  </div>
                </button>
                {i < etapas.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Formulário etapa ativa */}
        <div className="rounded-xl border border-accent/20 bg-[--surface] p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xl">{etapaAtiva.emoji}</span>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{etapaAtiva.nome}</h3>
              <p className="text-[11px] text-text-muted">{etapaAtiva.desc}</p>
            </div>
            <div className="ml-auto text-[10px] font-mono text-text-muted">
              {completude(etapaAtiva)}/4 campos
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CAMPOS.map(c => (
              <div key={c.key} className="space-y-1">
                <label className="text-[11px] font-mono text-text-muted uppercase">{c.label}</label>
                <textarea
                  value={etapaAtiva[c.key]}
                  onChange={e => updateEtapa(etapaAtiva.id, c.key, e.target.value)}
                  placeholder={c.ph}
                  rows={3}
                  className="w-full bg-[--background] border border-[--border] rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            {ativa !== "fidelizacao" && (
              <button
                onClick={() => {
                  const idx = etapas.findIndex(e => e.id === ativa)
                  if (idx < etapas.length - 1) setAtiva(etapas[idx + 1].id)
                }}
                className="flex items-center gap-1.5 text-xs font-mono text-accent hover:text-accent/80 transition-colors"
              >
                Próxima etapa <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Erro */}
        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        {/* Análise IA */}
        {analise && (
          <div className="space-y-4">
            {/* Pontos cegos */}
            {analise.pontos_cegos?.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-mono text-amber-400 uppercase tracking-widest">Pontos Cegos na Jornada</h3>
                </div>
                <ul className="space-y-2">
                  {analise.pontos_cegos.map((p, i) => (
                    <li key={i} className="text-sm text-amber-300/80 flex gap-2">
                      <span className="flex-shrink-0">•</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Automações */}
            {analise.sugestoes_automacao?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-text-muted" />
                  <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Sugestões de Automação</h3>
                </div>
                {analise.sugestoes_automacao.map((s, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-[--surface] border border-[--border]">
                    <span className="text-[10px] font-mono text-accent border border-accent/30 px-1.5 py-0.5 rounded h-fit flex-shrink-0">{s.etapa}</span>
                    <p className="text-sm text-text-secondary flex-1">{s.sugestao}</p>
                    <span className={cn(
                      "text-[9px] font-mono px-1.5 rounded-full border h-fit flex-shrink-0",
                      s.impacto === "Alto" ? "border-red-500/30 text-red-400" : "border-amber-500/30 text-amber-400"
                    )}>{s.impacto}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Comparação com ideal */}
            {analise.jornada_ideal_diff?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Comparação com Jornada Ideal</h3>
                {analise.jornada_ideal_diff.map((d, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-[--border] bg-[--surface] p-4">
                    <div>
                      <p className="text-[10px] font-mono text-text-muted mb-1">{d.etapa}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-red-400 mb-1">Atual</p>
                      <p className="text-xs text-text-secondary">{d.situacao_atual}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-accent mb-1">Ideal</p>
                      <p className="text-xs text-text-secondary">{d.situacao_ideal}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Prioridades */}
            {analise.prioridades?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-text-muted" />
                  <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">Prioridades de Implementação</h3>
                </div>
                {analise.prioridades.map(p => (
                  <div key={p.prioridade} className="flex gap-3 p-4 rounded-xl border border-[--border] bg-[--surface]">
                    <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-mono font-bold text-accent flex-shrink-0">
                      {p.prioridade}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{p.acao}</p>
                      <p className="text-xs text-text-muted mt-0.5">{p.justificativa}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completude por etapa */}
        <div className="rounded-xl border border-[--border] bg-[--surface] p-5">
          <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">Completude do Mapa</h3>
          <div className="space-y-2">
            {etapas.map(e => {
              const comp = completude(e)
              return (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="text-sm w-24 flex-shrink-0">{e.emoji} {e.nome}</span>
                  <div className="flex-1 h-1.5 bg-[--border] rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(comp / 4) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-text-muted w-8">{comp}/4</span>
                  {comp === 4 && <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
