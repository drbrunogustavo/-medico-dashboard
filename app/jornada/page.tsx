"use client"

import { useState } from "react"
import { Sparkles, ChevronRight, Check } from "lucide-react"
import { Panel, PxButton, Tag, Field, PageHeader } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Etapa {
  id:        string
  nome:      string
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

// ─── Constantes ──────────────────────────────────────────────────────────────

const ETAPAS_BASE: Etapa[] = [
  { id: "descoberta",   nome: "Descoberta",   desc: "Como o paciente encontra você",     canais: "", mensagens: "", acoes: "", atritos: "" },
  { id: "interesse",    nome: "Interesse",    desc: "Avalia se você é a escolha certa",  canais: "", mensagens: "", acoes: "", atritos: "" },
  { id: "consulta",     nome: "Consulta",     desc: "Da decisão ao atendimento",         canais: "", mensagens: "", acoes: "", atritos: "" },
  { id: "tratamento",   nome: "Tratamento",   desc: "Durante o protocolo",               canais: "", mensagens: "", acoes: "", atritos: "" },
  { id: "fidelizacao",  nome: "Fidelização",  desc: "Transformar paciente em fã",        canais: "", mensagens: "", acoes: "", atritos: "" },
]

const CAMPOS: { key: keyof Omit<Etapa, "id" | "nome" | "desc">; label: string; ph: string }[] = [
  { key: "canais",    label: "Canais de aquisição", ph: "Instagram, indicação, Google Ads" },
  { key: "mensagens", label: "Mensagens-chave",     ph: "Qual promessa ou conteúdo você entrega aqui?" },
  { key: "acoes",     label: "Ações automáticas",   ph: "WhatsApp bot, e-mail, régua de nutrição" },
  { key: "atritos",   label: "Pontos de atrito",    ph: "Onde perde pacientes nessa etapa?" },
]

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white/70 px-3.5 py-2.5 text-[14px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

function completude(e: Etapa) {
  const campos: (keyof Etapa)[] = ["canais", "mensagens", "acoes", "atritos"]
  return campos.filter(c => (e[c] as string).trim().length > 0).length
}

// ─── Página ───────────────────────────────────────────────────────────────────

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
      if (!res.ok || data.error) { setError(data.error ?? "Erro ao analisar a jornada"); return }
      setAnalise(data as AnaliseIA)
    } catch (e) {
      console.error("[jornada] erro ao analisar jornada:", e)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const etapaAtiva = etapas.find(e => e.id === ativa)!
  const idxAtiva   = etapas.findIndex(e => e.id === ativa)
  const totalComp  = etapas.reduce((s, e) => s + completude(e), 0)
  const maxComp    = etapas.length * 4

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Jornada"
        caption="Da descoberta à fidelização do paciente"
        actions={
          <PxButton leftIcon={Sparkles} loading={loading} disabled={loading || totalComp === 0} onClick={analisar}>
            Analisar com IA
          </PxButton>
        }
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel tone="dark">
          <div className="flex flex-col gap-1 text-white sm:flex-row sm:items-baseline sm:gap-4">
            <p className="text-[32px] font-semibold leading-none tabular-nums">{totalComp}<span className="text-[18px] text-white/80"> de {maxComp}</span></p>
            <p className="text-[13px] text-white/85">campos do mapa preenchidos. A análise com IA libera quando houver pelo menos um.</p>
          </div>
        </Panel>

        <nav aria-label="Etapas da jornada">
          <ol className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {etapas.map(e => {
              const comp = completude(e)
              const on = ativa === e.id
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    aria-current={on ? "step" : undefined}
                    onClick={() => setAtiva(e.id)}
                    className="block h-full w-full text-left"
                  >
                    <Panel tone={on ? "strong" : "light"} className={on ? "h-full ring-2 ring-px-ink" : "h-full"}>
                      <span className="block text-[14px] font-semibold text-px-ink">{e.nome}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-px-muted">{e.desc}</span>
                      <span className="mt-3 flex gap-1" aria-hidden>
                        {[0, 1, 2, 3].map(j => (
                          <span key={j} className={j < comp ? "h-1.5 flex-1 rounded-full bg-px-ink" : "h-1.5 flex-1 rounded-full bg-px-ink/15"} />
                        ))}
                      </span>
                      <span className="sr-only">{comp} de 4 campos preenchidos</span>
                    </Panel>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <Panel tone="light" className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold text-px-ink">{etapaAtiva.nome}</h2>
              <p className="text-[13px] text-px-muted">{etapaAtiva.desc}</p>
            </div>
            <Tag tone={completude(etapaAtiva) === 4 ? "ok" : "neutral"}>{completude(etapaAtiva)} de 4 campos</Tag>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CAMPOS.map(c => (
              <Field key={c.key} label={c.label} htmlFor={`jn-${etapaAtiva.id}-${c.key}`}>
                <textarea
                  id={`jn-${etapaAtiva.id}-${c.key}`}
                  value={etapaAtiva[c.key]}
                  onChange={e => updateEtapa(etapaAtiva.id, c.key, e.target.value)}
                  placeholder={c.ph}
                  rows={3}
                  className={areaCls}
                />
              </Field>
            ))}
          </div>
          {idxAtiva < etapas.length - 1 && (
            <div className="flex justify-end">
              <PxButton variant="quiet" rightIcon={ChevronRight} onClick={() => setAtiva(etapas[idxAtiva + 1].id)}>Próxima etapa</PxButton>
            </div>
          )}
        </Panel>

        {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>}

        {analise && (
          <div className="space-y-4">
            {analise.pontos_cegos?.length > 0 && (
              <Panel tone="light" className="space-y-2">
                <h2 className="text-[15px] font-semibold text-px-ink">Pontos cegos na jornada</h2>
                <ul className="list-disc space-y-1.5 pl-5">
                  {analise.pontos_cegos.map((p, i) => <li key={i} className="text-[14px] text-px-ink">{p}</li>)}
                </ul>
              </Panel>
            )}

            {analise.sugestoes_automacao?.length > 0 && (
              <section aria-labelledby="jn-auto" className="space-y-2">
                <h2 id="jn-auto" className="text-[15px] font-semibold text-px-ink">Sugestões de automação</h2>
                <ul className="space-y-2">
                  {analise.sugestoes_automacao.map((s, i) => (
                    <li key={i}>
                      <Panel tone="light" className="flex items-start gap-3">
                        <Tag tone="neutral">{s.etapa}</Tag>
                        <p className="min-w-0 flex-1 text-[14px] text-px-ink">{s.sugestao}</p>
                        <Tag tone={s.impacto === "Alto" ? "danger" : "warn"}>Impacto {s.impacto.toLowerCase()}</Tag>
                      </Panel>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {analise.jornada_ideal_diff?.length > 0 && (
              <section aria-labelledby="jn-diff" className="space-y-2">
                <h2 id="jn-diff" className="text-[15px] font-semibold text-px-ink">Comparação com a jornada ideal</h2>
                <ul className="space-y-2">
                  {analise.jornada_ideal_diff.map((d, i) => (
                    <li key={i}>
                      <Panel tone="light" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <p className="text-[14px] font-semibold text-px-ink">{d.etapa}</p>
                        <div>
                          <p className="mb-1 text-[12px] font-semibold text-px-danger">Atual</p>
                          <p className="text-[13px] text-px-ink">{d.situacao_atual}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-[12px] font-semibold text-px-ok">Ideal</p>
                          <p className="text-[13px] text-px-ink">{d.situacao_ideal}</p>
                        </div>
                      </Panel>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {analise.prioridades?.length > 0 && (
              <section aria-labelledby="jn-prio" className="space-y-2">
                <h2 id="jn-prio" className="text-[15px] font-semibold text-px-ink">Prioridades de implementação</h2>
                <ol className="space-y-2">
                  {analise.prioridades.map(p => (
                    <li key={p.prioridade}>
                      <Panel tone="light" className="flex gap-3">
                        <span className="w-5 flex-shrink-0 text-[15px] font-semibold tabular-nums text-px-accent">{p.prioridade}</span>
                        <div>
                          <p className="text-[14px] font-semibold text-px-ink">{p.acao}</p>
                          <p className="mt-0.5 text-[13px] text-px-muted">{p.justificativa}</p>
                        </div>
                      </Panel>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}

        <Panel tone="light" className="space-y-3">
          <h2 className="text-[15px] font-semibold text-px-ink">Completude por etapa</h2>
          <ul className="space-y-2">
            {etapas.map(e => {
              const comp = completude(e)
              return (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="w-28 flex-shrink-0 text-[13px] text-px-ink">{e.nome}</span>
                  <div
                    role="progressbar"
                    aria-label={`Completude de ${e.nome}`}
                    aria-valuemin={0}
                    aria-valuemax={4}
                    aria-valuenow={comp}
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-px-ink/15"
                  >
                    <div className="h-full rounded-full bg-px-ink transition-all" style={{ width: `${(comp / 4) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-[12px] tabular-nums text-px-muted">{comp} de 4</span>
                  {comp === 4 ? <Check className="h-3.5 w-3.5 flex-shrink-0 text-px-ok" aria-hidden /> : <span className="w-3.5 flex-shrink-0" />}
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
