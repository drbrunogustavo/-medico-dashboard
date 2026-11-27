"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import { Panel, PxButton, Segmented, Field, PxCheckbox, PageHeader, CopyButton } from "@/components/px"

const FORMATOS = [
  { id: "carrossel", label: "Carrossel", desc: "Sequência de slides educativos" },
  { id: "reels",     label: "Reels",     desc: "Vídeo curto e dinâmico" },
  { id: "feed",      label: "Feed",      desc: "Post único informativo" },
  { id: "stories",   label: "Stories",   desc: "Conteúdo rápido e direto" },
]
const TONS = ["Educativo", "Inspirador", "Científico", "Casual", "Urgente"]

interface Pauta { id: string; titulo: string; categoria: string; nota: string; fonte?: string }
interface Legenda { gancho: string; desenvolvimento: string; cta: string; hashtags: string; completa: string }

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Panel as="section" className="space-y-1.5">
      <h2 className="text-[12.5px] font-medium text-px-muted">{titulo}</h2>
      {children}
    </Panel>
  )
}

export default function LegendaPage() {
  const [pautas, setPautas] = useState<Pauta[]>([])
  const [pautasErro, setPautasErro] = useState(false)
  const [pautaSel, setPautaSel] = useState<Pauta | null>(null)
  const [formato, setFormato] = useState("carrossel")
  const [tom, setTom] = useState("Educativo")
  const [emojis, setEmojis] = useState(true)
  const [loading, setLoading] = useState(false)
  const [legenda, setLegenda] = useState<Legenda | null>(null)
  const [topico, setTopico] = useState("")
  const [usarPauta, setUsarPauta] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tema")
    if (t) { setTopico(t); setUsarPauta(false) }
  }, [])

  useEffect(() => {
    fetch("/api/pautas")
      .then(r => { if (!r.ok) throw new Error("falha"); return r.json() })
      .then(data => setPautas(Array.isArray(data) ? data : []))
      .catch(() => setPautasErro(true))
  }, [])

  const tema = usarPauta ? pautaSel?.titulo : topico

  const gerarLegenda = async () => {
    if (!tema?.trim()) { setErro("Selecione uma pauta ou digite um tema."); return }
    setLoading(true); setLegenda(null); setErro(null)
    const contexto = usarPauta && pautaSel
      ? `Título: ${pautaSel.titulo}\nCategoria: ${pautaSel.categoria}\nNotas: ${pautaSel.nota || "Nenhuma"}\nFonte: ${pautaSel.fonte || "Não informada"}`
      : `Tema: ${topico}`
    try {
      const res = await fetch("/api/legendas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tema, contexto, formato, tom, emojis }) })
      const data = await res.json().catch(() => ({})) as Partial<Legenda> & { error?: string }
      if (!res.ok || data.error) throw new Error(data.error || "falha")
      if (typeof data.completa !== "string") throw new Error("resposta incompleta")
      setLegenda({ gancho: data.gancho ?? "", desenvolvimento: data.desenvolvimento ?? "", cta: data.cta ?? "", hashtags: data.hashtags ?? "", completa: data.completa })
    } catch (e) {
      console.error("[legendas] erro ao gerar:", e)
      setErro("Não foi possível gerar a legenda. Tente novamente em instantes.")
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Gerador de Legendas" caption="Legendas para Instagram a partir de um tema ou de uma pauta" />
      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[360px_1fr]">
        <Panel as="aside" className="space-y-4 self-start">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Origem do tema</p>
            <Segmented label="Origem do tema" value={usarPauta ? "pauta" : "tema"} onChange={v => setUsarPauta(v === "pauta")}
              options={[{ value: "tema", label: "Digitar tema" }, { value: "pauta", label: "Banco de pautas" }]} />
          </div>

          {!usarPauta ? (
            <Field label="Tema" htmlFor="lg-tema">
              <textarea id="lg-tema" value={topico} onChange={e => setTopico(e.target.value)} rows={3} placeholder="Resistência insulínica em pessoas magras" className={areaCls} />
            </Field>
          ) : (
            <div role="group" aria-label="Pautas" className="max-h-56 space-y-1.5 overflow-y-auto">
              {pautasErro
                ? <p role="alert" className="text-[13px] text-px-danger">As pautas não puderam ser carregadas.</p>
                : pautas.length === 0
                  ? <p className="py-3 text-center text-[13px] text-px-muted">Nenhuma pauta no banco.</p>
                  : pautas.map(p => (
                    <button key={p.id} type="button" aria-pressed={pautaSel?.id === p.id} onClick={() => setPautaSel(p)}
                      className={`w-full rounded-px-ctl border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${pautaSel?.id === p.id ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>
                      <span className="block text-[13.5px] font-medium leading-snug">{p.titulo}</span>
                      <span className={`block text-[12px] ${pautaSel?.id === p.id ? "text-white/75" : "text-px-muted"}`}>{p.categoria}</span>
                    </button>
                  ))}
            </div>
          )}

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-px-ink">Formato</p>
            <div role="group" aria-label="Formato do post" className="grid grid-cols-2 gap-1.5">
              {FORMATOS.map(f => (
                <button key={f.id} type="button" aria-pressed={formato === f.id} onClick={() => setFormato(f.id)}
                  className={`rounded-px-card border p-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${formato === f.id ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>
                  <span className="block text-[13.5px] font-semibold">{f.label}</span>
                  <span className={`block text-[12px] ${formato === f.id ? "text-white/75" : "text-px-muted"}`}>{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Tom de voz</p>
            <Segmented label="Tom de voz" value={tom} onChange={setTom} options={TONS.map(t => ({ value: t, label: t }))} />
          </div>
          <PxCheckbox label="Incluir emojis na legenda" checked={emojis} onChange={e => setEmojis(e.target.checked)} />

          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
          <PxButton fullWidth leftIcon={Sparkles} onClick={gerarLegenda} loading={loading} disabled={!tema?.trim()}>{loading ? "Gerando" : legenda ? "Gerar outra versão" : "Gerar legenda"}</PxButton>
        </Panel>

        <div className="min-w-0 space-y-3">
          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Escrevendo a legenda</p>}
          {!legenda && !loading && (
            <Panel className="py-16 text-center">
              <p className="text-[15px] font-semibold text-px-ink">Escolha o tema e gere a legenda</p>
              <p className="mt-1 text-[13px] text-px-muted">Você recebe gancho, desenvolvimento, CTA, hashtags e o texto completo para copiar.</p>
            </Panel>
          )}
          {legenda && !loading && (
            <>
              <Bloco titulo="Gancho"><p className="text-[14px] font-medium leading-relaxed text-px-ink">{legenda.gancho}</p></Bloco>
              <Bloco titulo="Desenvolvimento"><p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink/80">{legenda.desenvolvimento}</p></Bloco>
              <Bloco titulo="Chamada para ação"><p className="text-[14px] font-medium leading-relaxed text-px-ink">{legenda.cta}</p></Bloco>
              <Bloco titulo="Hashtags"><p className="text-[13px] leading-relaxed text-px-ink/80">{legenda.hashtags}</p></Bloco>
              <Panel as="section" tone="strong" className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[12.5px] font-medium text-px-muted">Legenda completa</h2>
                  <CopyButton text={legenda.completa} label="Copiar tudo" />
                </div>
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink">{legenda.completa}</p>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
