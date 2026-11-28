"use client"

import { useState } from "react"
import { Check, Plus, RefreshCw } from "lucide-react"
import { Panel, PxButton, PxInput, Segmented, Field, Tag, PageHeader } from "@/components/px"

type Urgencia = "AGORA" | "EM BREVE" | "PLANEJAMENTO"
type Concorrencia = "Baixa" | "Média" | "Alta"

interface EventoCalendario {
  periodo: string
  evento: string
  oportunidade_conteudo: string
  oportunidade_campanha: string
  urgencia: Urgencia
}
interface Tendencia {
  tema: string
  janela_oportunidade: string
  por_que_agora: string
  concorrencia: Concorrencia
  fonte: string
}
interface Alerta {
  oportunidade: string
  periodo: string
  campanha: string
  formatos: string[]
}
interface Resultado { calendario: EventoCalendario[]; tendencias: Tendencia[]; alertas: Alerta[] }

const JANELAS = [
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
]
const URGENCIA_LABEL: Record<Urgencia, string> = { AGORA: "Agora", "EM BREVE": "Em breve", PLANEJAMENTO: "Planejamento" }
const PRIORIDADE_URGENCIA: Record<Urgencia, string> = { AGORA: "Alta", "EM BREVE": "Média", PLANEJAMENTO: "Baixa" }

interface CtxSalvar {
  salvos: string[]
  salvando: string[]
  erroSalvar: { key: string; msg: string } | null
  salvar: (key: string, pauta: Record<string, unknown>) => void
}

function BotaoSalvar({ k, rotulo, pauta, ctx }: { k: string; rotulo: string; pauta: Record<string, unknown>; ctx: CtxSalvar }) {
  const salvo = ctx.salvos.includes(k)
  return (
    <div className="space-y-2">
      {ctx.erroSalvar?.key === k && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[12.5px] text-px-danger">{ctx.erroSalvar.msg}</p>}
      <PxButton variant={salvo ? "secondary" : "primary"} size="sm" fullWidth leftIcon={salvo ? Check : Plus}
        loading={ctx.salvando.includes(k)} disabled={salvo} onClick={() => ctx.salvar(k, pauta)}>
        {salvo ? "Salva no banco de pautas" : rotulo}
      </PxButton>
    </div>
  )
}

export default function OportunidadesPage() {
  const [especialidade, setEspecialidade] = useState("Endocrinologia e Nutrologia")
  const [localizacao, setLocalizacao] = useState("")
  const [janela, setJanela] = useState("30")
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [janelaGerada, setJanelaGerada] = useState("30")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvos, setSalvos] = useState<string[]>([])
  const [salvando, setSalvando] = useState<string[]>([])
  const [erroSalvar, setErroSalvar] = useState<{ key: string; msg: string } | null>(null)

  async function detectar() {
    if (!especialidade.trim() || loading) return
    setErro(null); setLoading(true); setResultado(null); setSalvos([]); setErroSalvar(null)
    try {
      const res = await fetch("/api/oportunidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ especialidade: especialidade.trim(), localizacao: localizacao.trim(), janela }),
      })
      const data = await res.json().catch(() => ({})) as Partial<Resultado> & { error?: string }
      if (!res.ok || data.error) throw new Error(data.error || "HTTP " + res.status)
      setResultado({ calendario: data.calendario ?? [], tendencias: data.tendencias ?? [], alertas: data.alertas ?? [] })
      setJanelaGerada(janela)
    } catch (e) {
      console.error("[oportunidades] erro ao detectar:", e)
      setErro("Não foi possível detectar oportunidades. Tente novamente.")
    } finally { setLoading(false) }
  }

  async function salvar(key: string, pauta: Record<string, unknown>) {
    if (salvando.includes(key) || salvos.includes(key)) return
    setSalvando(prev => [...prev, key]); setErroSalvar(null)
    try {
      const res = await fetch("/api/pautas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pauta, estagio: "Ideia" }) })
      if (!res.ok) throw new Error("HTTP " + res.status)
      setSalvos(prev => [...prev, key])
    } catch (e) {
      console.error("[oportunidades] erro ao salvar pauta:", e)
      setErroSalvar({ key, msg: "Não foi possível salvar. Tente novamente." })
    } finally { setSalvando(prev => prev.filter(x => x !== key)) }
  }

  const ctx: CtxSalvar = { salvos, salvando, erroSalvar, salvar }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Detector de Oportunidades"
        caption="O que criar e quando, a partir de datas sazonais e temas em alta"
        actions={resultado ? (
          <PxButton variant="secondary" size="sm" leftIcon={RefreshCw} onClick={() => { setResultado(null); setErro(null); setSalvos([]) }}>Nova análise</PxButton>
        ) : undefined}
      />

      <div className="space-y-6 px-4 pb-10 md:px-10">
        <Panel as="section" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Especialidade" htmlFor="op-esp">
              <PxInput id="op-esp" value={especialidade} onChange={e => setEspecialidade(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Localização" htmlFor="op-loc" hint="Opcional. Sem ela, a análise considera o Brasil.">
              <PxInput id="op-loc" value={localizacao} onChange={e => setLocalizacao(e.target.value)} maxLength={120} placeholder="Cidade ou região" />
            </Field>
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-px-ink">Janela de análise</p>
              <Segmented label="Janela de análise" value={janela} onChange={setJanela} options={JANELAS} />
            </div>
          </div>
          <PxButton onClick={detectar} loading={loading} disabled={!especialidade.trim()}>{loading ? "Analisando" : resultado ? "Analisar novamente" : "Detectar oportunidades"}</PxButton>
        </Panel>

        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}
        {loading && <p role="status" className="py-20 text-center text-[14px] font-medium text-px-ink">Pesquisando datas e tendências. Isso pode levar alguns segundos.</p>}

        {!loading && !resultado && !erro && (
          <Panel className="py-14 text-center">
            <p className="text-[15px] font-semibold text-px-ink">Informe a especialidade e escolha a janela</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-px-muted">
              Você recebe as datas sazonais do período, os temas em alta com a fonte consultada e ideias de campanha. Tudo vira pauta com um clique.
            </p>
          </Panel>
        )}

        {!loading && resultado && (
          <div className="space-y-8">
            <p className="text-[12.5px] text-px-muted">
              Análise gerada por IA com pesquisa na web. Confira as fontes e as datas antes de produzir, e mantenha as campanhas dentro das regras de publicidade médica.
            </p>

            {resultado.calendario.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-px-ink">Calendário sazonal</h2>
                  <p className="text-[12.5px] text-px-muted">Datas e eventos nos próximos {janelaGerada} dias</p>
                </div>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {resultado.calendario.map((ev, i) => (
                    <li key={i}>
                      <Panel as="article" className="flex h-full flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[12px] text-px-muted">{ev.periodo}</p>
                            <h3 className="text-[14px] font-semibold leading-snug text-px-ink">{ev.evento}</h3>
                          </div>
                          <Tag tone={ev.urgencia === "AGORA" ? "ink" : "neutral"}>{URGENCIA_LABEL[ev.urgencia]}</Tag>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-[12px] font-medium text-px-muted">Conteúdo</p>
                            <p className="text-[13px] leading-snug text-px-ink">{ev.oportunidade_conteudo}</p>
                          </div>
                          {ev.oportunidade_campanha && (
                            <div>
                              <p className="text-[12px] font-medium text-px-muted">Campanha</p>
                              <p className="text-[13px] leading-snug text-px-ink">{ev.oportunidade_campanha}</p>
                            </div>
                          )}
                        </div>
                        <BotaoSalvar ctx={ctx} k={"cal-" + i} rotulo="Salvar como pauta" pauta={{
                          titulo: ev.oportunidade_conteudo,
                          nota: "Evento: " + ev.evento + " | Período: " + ev.periodo + (ev.oportunidade_campanha ? "\nCampanha associada: " + ev.oportunidade_campanha : ""),
                          categoria: "Calendário Sazonal",
                          prioridade: PRIORIDADE_URGENCIA[ev.urgencia],
                          tags: ["calendario", "sazonal", ev.urgencia.toLowerCase().replace(" ", "-")],
                        }} />
                      </Panel>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {resultado.tendencias.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-px-ink">Temas em alta</h2>
                  <p className="text-[12.5px] text-px-muted">Assuntos com interesse crescente e a concorrência estimada pela IA</p>
                </div>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {resultado.tendencias.map((t, i) => (
                    <li key={i}>
                      <Panel as="article" className="flex h-full flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-[14px] font-semibold leading-snug text-px-ink">{t.tema}</h3>
                          <Tag tone="neutral">Concorrência {t.concorrencia.toLowerCase()}</Tag>
                        </div>
                        {t.janela_oportunidade && <p className="text-[12.5px] text-px-muted">{t.janela_oportunidade}</p>}
                        <p className="flex-1 text-[13px] leading-relaxed text-px-ink">{t.por_que_agora}</p>
                        <p className="text-[12px] text-px-muted">{t.fonte ? "Fonte: " + t.fonte : "Sem fonte citada pela IA. Confirme antes de usar."}</p>
                        <BotaoSalvar ctx={ctx} k={"tend-" + i} rotulo="Salvar como pauta" pauta={{
                          titulo: t.tema,
                          nota: "Janela: " + t.janela_oportunidade + "\nPor que agora: " + t.por_que_agora + (t.fonte ? "\nFonte: " + t.fonte : ""),
                          categoria: "Oportunidade de Tendência",
                          prioridade: "Média",
                          tags: ["oportunidade", "tendencia", "concorrencia-" + t.concorrencia.toLowerCase().replace("é", "e")],
                        }} />
                      </Panel>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {resultado.alertas.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-px-ink">Ideias de campanha</h2>
                  <p className="text-[12.5px] text-px-muted">Serviços e consultas com demanda provável no período</p>
                </div>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {resultado.alertas.map((al, i) => (
                    <li key={i}>
                      <Panel as="article" className="flex h-full flex-col gap-3">
                        <div>
                          <h3 className="text-[14px] font-semibold leading-snug text-px-ink">{al.oportunidade}</h3>
                          {al.periodo && <p className="mt-0.5 text-[12px] text-px-muted">{al.periodo}</p>}
                        </div>
                        <p className="flex-1 text-[13px] leading-relaxed text-px-ink">{al.campanha}</p>
                        {al.formatos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">{al.formatos.map((f, fi) => <Tag key={fi} tone="neutral">{f}</Tag>)}</div>
                        )}
                        <BotaoSalvar ctx={ctx} k={"alerta-" + i} rotulo="Salvar como pauta de campanha" pauta={{
                          titulo: al.oportunidade,
                          nota: "Período: " + al.periodo + "\nCampanha: " + al.campanha + (al.formatos.length ? "\nFormatos: " + al.formatos.join(", ") : ""),
                          categoria: "Oportunidade de Campanha",
                          prioridade: "Média",
                          tags: ["oportunidade", "campanha"],
                        }} />
                      </Panel>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
