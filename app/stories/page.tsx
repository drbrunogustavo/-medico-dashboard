"use client"

import { useState } from "react"
import { Smartphone, ClipboardList } from "lucide-react"
import { PautasPickerModal } from "@/components/PautasPickerModal"
import { Panel, PxButton, Segmented, Field, PxInput, Tag, PageHeader, CopyButton } from "@/components/px"

interface Story { numero: number; texto: string; tipo: string; dica_visual: string; sticker?: string }
interface StoriesResult { sequencia_titulo: string; stories: Story[]; hashtags: string[] }

const TONS = ["Educativo", "Motivacional", "Casual", "Científico", "Polêmico"]
const N_SLIDES = [3, 5, 7, 10]

export default function StoriesPage() {
  const [tema, setTema] = useState("")
  const [slides, setSlides] = useState(5)
  const [tom, setTom] = useState("Educativo")
  const [showPautas, setShowPautas] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<StoriesResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const gerar = async () => {
    if (!tema.trim()) { setErro("Informe o tema dos stories."); return }
    setErro(null); setLoading(true); setResultado(null)
    try {
      const res = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tema, slides, tom }) })
      const data = await res.json().catch(() => ({})) as Partial<StoriesResult> & { error?: string }
      if (!res.ok || data.error) throw new Error(data.error || "falha")
      if (!Array.isArray(data.stories)) throw new Error("sem stories")
      setResultado({ sequencia_titulo: data.sequencia_titulo ?? "Sequência de stories", stories: data.stories, hashtags: data.hashtags ?? [] })
    } catch (e) {
      console.error("[stories] erro ao gerar:", e)
      setErro("Não foi possível gerar os stories. Tente novamente em instantes.")
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Gerador de Stories" caption="Sequência com gancho, conteúdo, stickers e chamada final" />
      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[320px_1fr]">
        <Panel as="aside" className="space-y-4 self-start">
          <Field label="Tema" htmlFor="st-tema">
            <PxInput id="st-tema" value={tema} onChange={e => setTema(e.target.value)} placeholder="Resistência à insulina: sinais que você ignora" />
          </Field>
          <PxButton variant="secondary" size="sm" leftIcon={ClipboardList} onClick={() => setShowPautas(true)}>Usar uma pauta do banco</PxButton>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Número de stories</p>
            <Segmented label="Número de stories" value={String(slides)} onChange={v => setSlides(Number(v))} options={N_SLIDES.map(n => ({ value: String(n), label: String(n) }))} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Tom</p>
            <Segmented label="Tom" value={tom} onChange={setTom} options={TONS.map(t => ({ value: t, label: t }))} />
          </div>
          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
          <PxButton fullWidth leftIcon={Smartphone} onClick={gerar} loading={loading} disabled={!tema.trim()}>{loading ? "Gerando" : resultado ? "Gerar novamente" : "Gerar stories"}</PxButton>
        </Panel>

        <div className="min-w-0 space-y-4">
          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Criando a sequência</p>}
          {!loading && !resultado && (
            <Panel className="py-16 text-center">
              <p className="text-[15px] font-semibold text-px-ink">Defina o tema e o tamanho da sequência</p>
              <p className="mt-1 text-[13px] text-px-muted">Cada story vem com texto, dica visual e sticker quando couber.</p>
            </Panel>
          )}
          {!loading && resultado && (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[18px] font-semibold leading-snug text-px-ink">{resultado.sequencia_titulo}</h2>
                {resultado.stories.length > 0 && <CopyButton text={resultado.stories.map(s => `Story ${s.numero}: ${s.texto}`).join("\n\n")} label="Copiar sequência" />}
              </div>
              {resultado.stories.length === 0 && <Panel className="py-10 text-center text-[13px] text-px-muted">A IA não devolveu nenhum story. Tente de novo.</Panel>}
              <ol className="space-y-3">
                {resultado.stories.map((s, i) => (
                  <li key={s.numero ?? i}>
                    <Panel as="article" className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-px-ink text-[13px] font-semibold text-white" aria-label={`Story ${s.numero ?? i + 1}`}>{s.numero ?? i + 1}</span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <Tag tone={s.tipo === "Gancho" || s.tipo === "CTA" ? "ink" : "neutral"}>{s.tipo}</Tag>
                        <p className="text-[14px] leading-relaxed text-px-ink">{s.texto}</p>
                        <p className="text-[12.5px] leading-relaxed text-px-muted"><span className="font-medium text-px-ink/80">Visual:</span> {s.dica_visual}</p>
                        {s.sticker && <p className="text-[12.5px] leading-relaxed text-px-muted"><span className="font-medium text-px-accent">Sticker:</span> {s.sticker}</p>}
                      </div>
                      <CopyButton text={s.texto} />
                    </Panel>
                  </li>
                ))}
              </ol>
              {resultado.hashtags.length > 0 && (
                <Panel as="section" className="space-y-2">
                  <h2 className="text-[12.5px] font-medium text-px-muted">Hashtags</h2>
                  <p className="text-[13px] leading-relaxed text-px-ink/80">{resultado.hashtags.map(h => "#" + h.replace(/^#/, "")).join(" ")}</p>
                </Panel>
              )}
            </>
          )}
        </div>
      </div>
      {showPautas && <PautasPickerModal onSelect={t => setTema(t)} onClose={() => setShowPautas(false)} />}
    </div>
  )
}
