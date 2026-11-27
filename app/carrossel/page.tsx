"use client"

import { useState, useEffect } from "react"
import { LayoutGrid, ClipboardList } from "lucide-react"
import { PautasPickerModal } from "@/components/PautasPickerModal"
import { Panel, PxButton, Segmented, Field, PxInput, PageHeader, CopyButton } from "@/components/px"

interface Slide { numero: number; titulo: string; conteudo: string; dica_visual: string }
interface CarrosselResult { titulo: string; subtitulo: string; slides: Slide[]; cta: string; hashtags: string[]; legenda: string }

const OBJETIVOS = ["Educativo", "Autoridade", "Vendas", "Engajamento", "Inspirador"]
const TONS = ["Profissional", "Próximo", "Científico", "Motivacional", "Didático"]
const tags = (r: CarrosselResult) => r.hashtags.map(h => "#" + h.replace(/^#/, "")).join(" ")

const toCanva = (r: CarrosselResult) =>
  `CARROSSEL: ${r.titulo}\n${r.subtitulo}\n\n` +
  r.slides.map(s => `SLIDE ${s.numero}. ${s.titulo}\n${s.conteudo}`).join("\n\n") +
  `\n\n----------\nCTA: ${r.cta}\nHASHTAGS: ${tags(r)}\n\nLEGENDA:\n${r.legenda}`

const toBriefing = (r: CarrosselResult) => {
  const n = r.slides.length
  const blocos = r.slides.map(s => {
    const linhas = [`=== SLIDE ${s.numero} DE ${n} ===`, `[TÍTULO] ${s.titulo}`, `[CORPO] ${s.conteudo}`]
    if (s.dica_visual?.trim()) linhas.push(`[VISUAL] ${s.dica_visual}`)
    return linhas.join("\n")
  })
  return blocos.join("\n\n") + `\n\n[CTA] ${r.cta}\n[HASHTAGS] ${tags(r)}\n[LEGENDA] ${r.legenda}`
}

export default function CarrosselPage() {
  const [tema, setTema] = useState("")
  const [slides, setSlides] = useState(7)
  const [objetivo, setObjetivo] = useState("Educativo")
  const [tom, setTom] = useState("Profissional")
  const [showPautas, setShowPautas] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<CarrosselResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [exportFmt, setExportFmt] = useState<"canva" | "briefing">("canva")

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tema")
    if (t) setTema(t)
  }, [])

  const gerar = async () => {
    if (!tema.trim()) { setErro("Informe o tema do carrossel."); return }
    setErro(null); setLoading(true); setResultado(null)
    try {
      const res = await fetch("/api/carrossel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tema, slides, objetivo, tom }) })
      const data = await res.json().catch(() => ({})) as Partial<CarrosselResult> & { error?: string }
      if (!res.ok || data.error) throw new Error(data.error || "falha")
      if (!Array.isArray(data.slides)) throw new Error("sem slides")
      setResultado({ titulo: data.titulo ?? "", subtitulo: data.subtitulo ?? "", slides: data.slides, cta: data.cta ?? "", hashtags: data.hashtags ?? [], legenda: data.legenda ?? "" })
    } catch (e) {
      console.error("[carrossel] erro ao gerar:", e)
      setErro("Não foi possível gerar o carrossel. Tente novamente em instantes.")
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Gerador de Carrossel" caption="Capa, slides, chamada final e legenda prontos para diagramar" />
      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[320px_1fr]">
        <Panel as="aside" className="space-y-4 self-start">
          <Field label="Tema" htmlFor="cr-tema">
            <PxInput id="cr-tema" value={tema} onChange={e => setTema(e.target.value)} placeholder="Como emagrecer sem passar fome" />
          </Field>
          <PxButton variant="secondary" size="sm" leftIcon={ClipboardList} onClick={() => setShowPautas(true)}>Usar uma pauta do banco</PxButton>
          <div>
            <label htmlFor="cr-n" className="mb-1.5 block text-[13px] font-medium text-px-ink">Número de slides: {slides}</label>
            <input id="cr-n" type="range" min={3} max={12} value={slides} onChange={e => setSlides(Number(e.target.value))} className="w-full accent-black" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Objetivo</p>
            <Segmented label="Objetivo" value={objetivo} onChange={setObjetivo} options={OBJETIVOS.map(o => ({ value: o, label: o }))} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Tom de voz</p>
            <Segmented label="Tom de voz" value={tom} onChange={setTom} options={TONS.map(t => ({ value: t, label: t }))} />
          </div>
          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
          <PxButton fullWidth leftIcon={LayoutGrid} onClick={gerar} loading={loading} disabled={!tema.trim()}>{loading ? "Gerando" : resultado ? "Gerar novamente" : "Gerar carrossel"}</PxButton>
        </Panel>

        <div className="min-w-0 space-y-4">
          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Criando o carrossel. Pode levar até um minuto.</p>}
          {!loading && !resultado && (
            <Panel className="py-16 text-center">
              <p className="text-[15px] font-semibold text-px-ink">Defina o tema e o número de slides</p>
              <p className="mt-1 text-[13px] text-px-muted">Você recebe texto de todos os slides, CTA, hashtags e legenda.</p>
            </Panel>
          )}
          {!loading && resultado && (
            <>
              <Panel as="section" tone="strong" className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[12.5px] font-medium text-px-muted">Capa</h2>
                  <CopyButton text={`${resultado.titulo}\n${resultado.subtitulo}`} />
                </div>
                <p className="text-[19px] font-semibold leading-snug text-px-ink">{resultado.titulo}</p>
                <p className="text-[13.5px] text-px-ink/80">{resultado.subtitulo}</p>
              </Panel>

              <Panel as="section" className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[12.5px] font-medium text-px-muted">Slides ({resultado.slides.length})</h2>
                  {resultado.slides.length > 0 && <CopyButton text={resultado.slides.map(s => `SLIDE ${s.numero}: ${s.titulo}\n${s.conteudo}`).join("\n\n")} label="Copiar slides" />}
                </div>
                <ol className="space-y-2.5">
                  {resultado.slides.map((s, i) => (
                    <li key={s.numero ?? i} className="flex items-start gap-3 rounded-px-card bg-px-ink/[0.04] p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-px-ink text-[12px] font-semibold text-white" aria-label={`Slide ${s.numero ?? i + 1}`}>{s.numero ?? i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-px-ink">{s.titulo}</p>
                        <p className="mt-0.5 text-[13.5px] leading-relaxed text-px-ink/85">{s.conteudo}</p>
                        {s.dica_visual && <p className="mt-1.5 text-[12.5px] text-px-muted"><span className="font-medium text-px-ink/80">Visual:</span> {s.dica_visual}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel as="section" className="space-y-1.5">
                <div className="flex items-center justify-between gap-3"><h2 className="text-[12.5px] font-medium text-px-muted">Chamada final</h2><CopyButton text={resultado.cta} /></div>
                <p className="text-[14px] font-medium text-px-ink">{resultado.cta}</p>
              </Panel>

              <Panel as="section" className="space-y-1.5">
                <div className="flex items-center justify-between gap-3"><h2 className="text-[12.5px] font-medium text-px-muted">Hashtags</h2>{resultado.hashtags.length > 0 && <CopyButton text={tags(resultado)} />}</div>
                <p className="text-[13px] leading-relaxed text-px-ink/80">{tags(resultado)}</p>
              </Panel>

              <Panel as="section" className="space-y-1.5">
                <div className="flex items-center justify-between gap-3"><h2 className="text-[12.5px] font-medium text-px-muted">Legenda completa</h2><CopyButton text={resultado.legenda} /></div>
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink/85">{resultado.legenda}</p>
              </Panel>

              <Panel as="section" className="flex flex-wrap items-center gap-3">
                <Segmented label="Formato da cópia" value={exportFmt} onChange={setExportFmt} options={[{ value: "canva", label: "Canva" }, { value: "briefing", label: "Briefing" }]} />
                <CopyButton className="ml-auto" text={exportFmt === "canva" ? toCanva(resultado) : toBriefing(resultado)} label="Copiar carrossel completo" />
              </Panel>
            </>
          )}
        </div>
      </div>
      {showPautas && <PautasPickerModal onSelect={t => setTema(t)} onClose={() => setShowPautas(false)} />}
    </div>
  )
}
