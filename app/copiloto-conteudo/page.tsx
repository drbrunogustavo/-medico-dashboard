"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, BookmarkPlus, CalendarPlus } from "lucide-react"
import { Panel, PxButton, PxInput, Field, Tag, PageHeader, CopyButton } from "@/components/px"

interface ReelData { titulo: string; gancho: string; roteiro: string; legenda: string; cta: string; hashtags: string[] }
interface CarrosselSlide { numero: number; titulo: string; texto: string }
interface CarrosselData { titulo: string; slides: CarrosselSlide[]; legenda: string; hashtags: string[] }
interface StoriesCard { numero: number; tipo: string; texto: string; interacao: string }
interface StoriesData { sequencia: StoriesCard[] }
interface LegendaAlt { versao: string; cta: string; hashtags: string[] }
interface ConteudoData { topico: string; reel: ReelData; carrossel: CarrosselData; stories: StoriesData; legenda_alternativa: LegendaAlt }

const tagsTexto = (tags?: string[]) => (tags ?? []).map(h => "#" + h.replace(/^#/, "")).join(" ")

const TOPICOS_SUGERIDOS = [
  "Resistência à insulina", "Menopausa", "GLP-1", "Longevidade", "Qualidade do sono", "Jejum intermitente", "Vitamina D e imunidade",
]

function Bloco({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-[12.5px] font-medium text-px-muted">{label}</p>
      <p className="whitespace-pre-wrap rounded-px-card bg-px-ink/[0.04] p-3 text-[13.5px] leading-relaxed text-px-ink">{value}</p>
    </div>
  )
}

function Hashtags({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="space-y-1.5">
      <p className="text-[12.5px] font-medium text-px-muted">Hashtags</p>
      <p className="text-[13.5px] leading-relaxed text-px-ink/85">{tagsTexto(tags)}</p>
      <CopyButton text={tagsTexto(tags)} label="Copiar hashtags" />
    </div>
  )
}

function Cartao({ titulo, copia, rotulo, children }: { titulo: string; copia: string; rotulo: string; children: React.ReactNode }) {
  return (
    <Panel as="article" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-px-ink">{titulo}</h3>
        <CopyButton text={copia} label={rotulo} />
      </div>
      {children}
    </Panel>
  )
}

export default function CopilotoConteudoPage() {
  const [topico, setTopico] = useState("")
  const [contexto, setContexto] = useState("")
  const [dados, setDados] = useState<ConteudoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [pautaMsg, setPautaMsg] = useState<{ ok: boolean; texto: string } | null>(null)

  async function salvarEmPautas() {
    if (!dados) return
    setSalvando(true); setPautaMsg(null)
    try {
      const r = await fetch("/api/pautas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: dados.topico, categoria: "Conteúdo", prioridade: "Alta", estagio: "Ideia", tags: [], nota: "Pacote gerado pelo Copiloto: Reel, Carrossel, Stories e legenda alternativa." }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setPautaMsg({ ok: true, texto: "Pauta salva no Banco de Pautas." })
    } catch (e) {
      console.error("[copiloto-conteudo] erro ao salvar pauta:", e)
      setPautaMsg({ ok: false, texto: "Não foi possível salvar a pauta. Tente novamente." })
    } finally { setSalvando(false) }
  }

  async function gerar() {
    if (!topico.trim() || loading) return
    setLoading(true); setError(""); setDados(null); setPautaMsg(null)
    try {
      const resp = await fetch("/api/copiloto-conteudo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topico: topico.trim(), contexto }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const json = await resp.json() as ConteudoData
      if (!json || (!json.reel && !json.carrossel && !json.stories && !json.legenda_alternativa)) throw new Error("resposta vazia")
      setDados(json)
    } catch (e) {
      console.error("[copiloto-conteudo] erro ao gerar:", e)
      setError("Não foi possível gerar o pacote. Tente novamente em instantes.")
    } finally { setLoading(false) }
  }

  const reel = dados?.reel, car = dados?.carrossel, sto = dados?.stories, alt = dados?.legenda_alternativa

  return (
    <div className="animate-fade-in">
      <PageHeader title="Copiloto de Conteúdo" caption="Reel, carrossel, stories e legenda a partir de um único tópico" />
      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel as="section" className="space-y-4">
          <form onSubmit={e => { e.preventDefault(); gerar() }} className="space-y-4">
            <Field label="Tópico do conteúdo" htmlFor="cc-topico">
              <PxInput id="cc-topico" value={topico} onChange={e => setTopico(e.target.value)} placeholder="Ex: resistência à insulina, jejum intermitente" />
            </Field>
            <Field label="Contexto adicional" hint="Opcional" htmlFor="cc-contexto">
              <textarea id="cc-contexto" value={contexto} onChange={e => setContexto(e.target.value)} rows={2}
                placeholder="Ex: para pacientes com hipotireoidismo, baseado em estudo recente, abordagem para iniciantes"
                className="w-full resize-none rounded-px-ctl border border-px-ink/15 bg-white px-3 py-2.5 text-[14px] text-px-ink placeholder:text-px-muted focus:outline focus:outline-2 focus:outline-px-ink/40" />
            </Field>
            <div className="space-y-2">
              <p className="text-[13px] font-medium text-px-ink">Sugestões</p>
              <div role="group" aria-label="Sugestões de tópico" className="flex flex-wrap gap-2">
                {TOPICOS_SUGERIDOS.map(t => (
                  <button key={t} type="button" aria-pressed={topico === t} onClick={() => setTopico(t)}
                    className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${topico === t ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>{t}</button>
                ))}
              </div>
            </div>
            <PxButton type="submit" leftIcon={Sparkles} loading={loading} disabled={!topico.trim()}>{loading ? "Gerando pacote" : "Gerar pacote de conteúdo"}</PxButton>
          </form>
        </Panel>

        {loading && <p role="status" className="py-12 text-center text-[14px] font-medium text-px-ink">Gerando Reel, carrossel, stories e legenda. Pode levar até um minuto.</p>}
        {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>}

        {dados && !loading && (
          <section className="space-y-4" aria-label="Pacote gerado">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[16px] font-semibold text-px-ink">Pacote: {dados.topico}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <PxButton variant="secondary" size="sm" leftIcon={BookmarkPlus} loading={salvando} onClick={salvarEmPautas}>Salvar em pautas</PxButton>
                <PxButton variant="secondary" size="sm" leftIcon={CalendarPlus} href="/calendario">Abrir calendário</PxButton>
                <PxButton variant="quiet" size="sm" onClick={() => { setDados(null); setPautaMsg(null) }}>Limpar</PxButton>
              </div>
            </div>
            {pautaMsg && (pautaMsg.ok
              ? <p role="status" className="text-[13px] text-px-ok">{pautaMsg.texto} <Link href="/pautas" className="underline">Ver pautas</Link></p>
              : <p role="alert" className="text-[13px] text-px-danger">{pautaMsg.texto}</p>)}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {reel && (
                <Cartao titulo="Reel" rotulo="Copiar tudo" copia={`${reel.roteiro}\n\n${reel.legenda}\n\n${reel.cta}\n\n${tagsTexto(reel.hashtags)}`}>
                  <p className="text-[14px] font-medium text-px-ink">{reel.titulo}</p>
                  <div className="rounded-px-card bg-px-ink/[0.05] p-3">
                    <p className="text-[12.5px] font-medium text-px-muted">Gancho</p>
                    <p className="mt-0.5 text-[14px] italic leading-relaxed text-px-ink">&ldquo;{reel.gancho}&rdquo;</p>
                  </div>
                  <Bloco label="Roteiro" value={reel.roteiro} /><Bloco label="Legenda" value={reel.legenda} /><Bloco label="CTA" value={reel.cta} />
                  <Hashtags tags={reel.hashtags} />
                </Cartao>
              )}
              {car && (
                <Cartao titulo="Carrossel" rotulo="Copiar tudo"
                  copia={`${(car.slides ?? []).map(s => `SLIDE ${s.numero}. ${s.titulo}\n${s.texto}`).join("\n\n")}\n\n${car.legenda}\n\n${tagsTexto(car.hashtags)}`}>
                  <p className="text-[14px] font-medium text-px-ink">{car.titulo}</p>
                  <ol className="space-y-2">
                    {(car.slides ?? []).map(s => (
                      <li key={s.numero} className="flex gap-3 rounded-px-card bg-px-ink/[0.04] p-3">
                        <span className="w-5 shrink-0 text-[13px] font-semibold text-px-ink">{s.numero}</span>
                        <span><span className="block text-[13.5px] font-medium text-px-ink">{s.titulo}</span><span className="mt-0.5 block text-[13px] leading-relaxed text-px-ink/80">{s.texto}</span></span>
                      </li>
                    ))}
                  </ol>
                  <Bloco label="Legenda" value={car.legenda} /><Hashtags tags={car.hashtags} />
                </Cartao>
              )}
              {sto && (
                <Cartao titulo="Stories" rotulo="Copiar sequência"
                  copia={(sto.sequencia ?? []).map(s => `CARD ${s.numero}, ${s.tipo}\n${s.texto}${s.interacao ? `\nInteração: ${s.interacao}` : ""}`).join("\n\n")}>
                  <ol className="space-y-2">
                    {(sto.sequencia ?? []).map(s => (
                      <li key={s.numero} className="flex gap-3 rounded-px-card bg-px-ink/[0.04] p-3">
                        <span className="w-5 shrink-0 text-[13px] font-semibold text-px-ink">{s.numero}</span>
                        <span className="space-y-1"><Tag tone="neutral">{s.tipo}</Tag><span className="block text-[13.5px] leading-relaxed text-px-ink">{s.texto}</span>
                          {s.interacao && <span className="block text-[12.5px] text-px-muted">Interação: {s.interacao}</span>}</span>
                      </li>
                    ))}
                  </ol>
                </Cartao>
              )}
              {alt && (
                <Cartao titulo="Legenda alternativa" rotulo="Copiar tudo" copia={`${alt.versao}\n\n${alt.cta}\n\n${tagsTexto(alt.hashtags)}`}>
                  <Bloco label="Versão curta" value={alt.versao} /><Bloco label="CTA" value={alt.cta} /><Hashtags tags={alt.hashtags} />
                </Cartao>
              )}
            </div>
          </section>
        )}

        {!dados && !loading && !error && (
          <Panel className="py-12 text-center">
            <p className="text-[15px] font-semibold text-px-ink">Nenhum pacote gerado</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-px-muted">Informe um tópico médico para receber roteiro de Reel, slides de carrossel, sequência de stories e legenda alternativa.</p>
          </Panel>
        )}
      </div>
    </div>
  )
}
