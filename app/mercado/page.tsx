"use client"

import { useState } from "react"
import { TrendingUp, Sparkles, RefreshCw } from "lucide-react"
import { Panel, PxButton, Field, PxInput, Tag, PageHeader } from "@/components/px"

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Tendencia {
  topico:          string
  crescimento_pct: number
  descricao:       string
  urgencia:        string
  tipo:            string
}

interface OportunidadeConteudo {
  titulo:        string
  formato:       string
  pilar:         string
  justificativa: string
  potencial:     string
}

interface PerguntaPaciente {
  pergunta:        string
  volume_estimado: string
  resposta_curta:  string
}

interface ConcorrenteDestaque {
  tipo:         string
  estrategia:   string
  oportunidade: string
}

interface MercadoData {
  semana:                 string
  especialidade:          string
  tendencias:             Tendencia[]
  oportunidades_conteudo: OportunidadeConteudo[]
  perguntas_pacientes:    PerguntaPaciente[]
  concorrentes_destaque:  ConcorrenteDestaque[]
  resumo_executivo:       string
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const ESPECIALIDADES = [
  "Endocrinologia e Nutrologia",
  "Cardiologia",
  "Dermatologia",
  "Ginecologia",
  "Ortopedia",
  "Pediatria",
  "Psiquiatria",
  "Neurologia",
  "Oncologia",
  "Medicina Geral",
]

type Tone = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"

const URGENCIA_TONE:  Record<string, Tone> = { Alta: "danger", Média: "warn", Baixa: "ok" }
const POTENCIAL_TONE: Record<string, Tone> = { Alto: "ok" }
const VOLUME_TONE:    Record<string, Tone> = { Alto: "accent" }

// Mensagem de erro legível: a API pode devolver JSON com "error" ou texto puro.
function mensagemDeErro(texto: string): string {
  try {
    const j = JSON.parse(texto) as { error?: unknown }
    if (typeof j.error === "string" && j.error) return j.error
  } catch { /* texto puro */ }
  return texto || "Não foi possível analisar o mercado agora. Tente novamente."
}

function Secao({ id, titulo, total, children }: { id: string; titulo: string; total?: number; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-[15px] font-semibold text-px-ink">{titulo}</h2>
        {total !== undefined && (
          <span className="text-[12px] text-px-muted">{total} {total === 1 ? "item" : "itens"}</span>
        )}
      </div>
      {children}
    </section>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function MercadoPage() {
  const [especialidade, setEspecialidade] = useState(ESPECIALIDADES[0])
  const [dados,   setDados]   = useState<MercadoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  async function analisar() {
    setLoading(true)
    setError("")
    try {
      const resp = await fetch("/api/mercado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ especialidade }),
      })
      if (!resp.ok) throw new Error(mensagemDeErro(await resp.text()))
      setDados(await resp.json() as MercadoData)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Inteligência de Mercado"
        caption="Tendências do seu nicho e oportunidades de conteúdo, com análise semanal"
      />

      <div className="space-y-5 px-4 pb-10 md:px-10">
        <Panel tone="light">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Field label="Especialidade" htmlFor="mercado-esp" className="flex-1 sm:max-w-sm">
              <PxInput
                id="mercado-esp"
                type="text"
                list="especialidades-list"
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                placeholder="Ex.: Endocrinologia, Dermatologia"
              />
              <datalist id="especialidades-list">
                {ESPECIALIDADES.map(e => <option key={e} value={e} />)}
              </datalist>
            </Field>
            <div className="flex flex-wrap gap-2">
              <PxButton onClick={analisar} loading={loading} disabled={!especialidade.trim()} leftIcon={Sparkles}>
                {loading ? "Analisando" : "Analisar mercado"}
              </PxButton>
              {dados && !loading && (
                <PxButton variant="secondary" onClick={analisar} leftIcon={RefreshCw}>Atualizar</PxButton>
              )}
            </div>
          </div>
          <p className="mt-3 text-[12.5px] text-px-muted">
            A análise fica guardada por 7 dias, para evitar chamadas repetidas à API.
          </p>
        </Panel>

        {error && (
          <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>
        )}

        {dados && (
          <>
            <Panel tone="dark">
              <p className="text-[12.5px] text-white/70">Resumo da semana</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white">{dados.resumo_executivo}</p>
              <p className="mt-3 text-[12px] text-white/70">{dados.especialidade}, {dados.semana}</p>
            </Panel>

            <Secao id="mercado-tend" titulo="Tópicos em alta" total={dados.tendencias?.length}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(dados.tendencias ?? []).map((t, i) => (
                  <Panel key={i} as="article" className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[14px] font-semibold leading-snug text-px-ink">{t.topico}</h3>
                      {typeof t.crescimento_pct === "number" && (
                        <div className="shrink-0 text-right">
                          <p className="text-[18px] font-semibold text-px-accent">+{t.crescimento_pct}%</p>
                          <p className="text-[11px] text-px-muted">de crescimento</p>
                        </div>
                      )}
                    </div>
                    <p className="text-[13px] leading-relaxed text-px-ink/75">{t.descricao}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag tone={URGENCIA_TONE[t.urgencia] ?? "neutral"}>Urgência {t.urgencia?.toLowerCase()}</Tag>
                      <Tag>{t.tipo}</Tag>
                    </div>
                  </Panel>
                ))}
              </div>
            </Secao>

            <Secao id="mercado-op" titulo="Oportunidades de conteúdo" total={dados.oportunidades_conteudo?.length}>
              <div className="space-y-3">
                {(dados.oportunidades_conteudo ?? []).map((o, i) => (
                  <Panel key={i} as="article">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="text-[14px] font-semibold text-px-ink">{o.titulo}</h3>
                        <p className="text-[13px] leading-relaxed text-px-ink/75">{o.justificativa}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Tag tone={POTENCIAL_TONE[o.potencial] ?? "neutral"}>Potencial {o.potencial?.toLowerCase()}</Tag>
                        <Tag>{o.formato}</Tag>
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            </Secao>

            <Secao id="mercado-perg" titulo="Perguntas frequentes dos pacientes" total={dados.perguntas_pacientes?.length}>
              <div className="space-y-3">
                {(dados.perguntas_pacientes ?? []).map((p, i) => (
                  <Panel key={i} as="article" className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[14px] font-semibold text-px-ink">{p.pergunta}</h3>
                      <Tag tone={VOLUME_TONE[p.volume_estimado] ?? "neutral"}>Volume {p.volume_estimado?.toLowerCase()}</Tag>
                    </div>
                    <div className="rounded-px-card bg-px-ink/[0.05] px-4 py-3">
                      <p className="mb-1 text-[12px] font-medium text-px-muted">Resposta sugerida</p>
                      <p className="text-[13px] leading-relaxed text-px-ink/75">{p.resposta_curta}</p>
                    </div>
                  </Panel>
                ))}
              </div>
            </Secao>

            <Secao id="mercado-conc" titulo="Análise competitiva" total={dados.concorrentes_destaque?.length}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(dados.concorrentes_destaque ?? []).map((c, i) => (
                  <Panel key={i} as="article" className="space-y-3">
                    <h3 className="text-[14px] font-semibold text-px-ink">{c.tipo}</h3>
                    <div>
                      <p className="mb-1 text-[12px] font-medium text-px-muted">O que fazem bem</p>
                      <p className="text-[13px] leading-relaxed text-px-ink/75">{c.estrategia}</p>
                    </div>
                    <div className="rounded-px-card bg-px-accent-soft px-4 py-3">
                      <p className="mb-1 text-[12px] font-medium text-px-accent">Sua oportunidade</p>
                      <p className="text-[13px] leading-relaxed text-px-ink">{c.oportunidade}</p>
                    </div>
                  </Panel>
                ))}
              </div>
            </Secao>
          </>
        )}

        {!dados && !loading && !error && (
          <Panel className="py-12 text-center">
            <TrendingUp className="mx-auto mb-4 h-9 w-9 text-px-muted" aria-hidden="true" />
            <h2 className="mb-2 text-[15px] font-semibold text-px-ink">Nenhuma análise ainda</h2>
            <p className="mx-auto max-w-sm text-[13px] text-px-muted">
              Escolha a especialidade e toque em Analisar mercado para ver tendências, oportunidades e perguntas desta semana.
            </p>
          </Panel>
        )}
      </div>
    </div>
  )
}
