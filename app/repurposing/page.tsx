"use client"

import { useState } from "react"
import { Repeat2 } from "lucide-react"
import { Panel, PxButton, Field, PxCheckbox, PageHeader, CopyButton } from "@/components/px"

interface RepurposingResult {
  carrossel?: { titulo: string; slides: string[]; cta: string }
  story?: { slides: string[] }
  legenda?: string
  whatsapp?: string
  tweet?: string
  email?: string
}
type Formato = "carrossel" | "story" | "legenda" | "whatsapp" | "tweet" | "email"

const FORMATOS: { id: Formato; label: string; desc: string }[] = [
  { id: "carrossel", label: "Carrossel", desc: "Slides para Instagram" },
  { id: "story",     label: "Stories",   desc: "Sequência de stories" },
  { id: "legenda",   label: "Legenda",   desc: "Post para o feed" },
  { id: "whatsapp",  label: "WhatsApp",  desc: "Mensagem informal" },
  { id: "tweet",     label: "Tweet/X",   desc: "Post de até 280 caracteres" },
  { id: "email",     label: "E-mail",    desc: "Newsletter ou lista" },
]

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

function Saida({ titulo, copia, children }: { titulo: string; copia: string; children: React.ReactNode }) {
  return (
    <Panel as="section" className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-semibold text-px-ink">{titulo}</h2>
        <CopyButton text={copia} />
      </div>
      {children}
    </Panel>
  )
}

export default function RepurposingPage() {
  const [conteudo, setConteudo] = useState("")
  const [formatos, setFormatos] = useState<Formato[]>(["carrossel", "story", "legenda", "whatsapp"])
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState<RepurposingResult | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const toggle = (id: Formato) => setFormatos(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id])

  const gerar = async () => {
    if (!conteudo.trim()) { setErro("Cole o conteúdo original."); return }
    if (formatos.length === 0) { setErro("Selecione ao menos um formato."); return }
    setErro(null); setLoading(true); setRes(null)
    try {
      const r = await fetch("/api/repurposing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conteudo, formatos }) })
      const data = await r.json().catch(() => null) as (RepurposingResult & { error?: string }) | null
      if (!r.ok || !data || data.error) throw new Error(data?.error || "falha")
      setRes(data)
    } catch (e) {
      console.error("[repurposing] erro:", e)
      setErro("Não foi possível adaptar o conteúdo. Tente novamente em instantes.")
    } finally { setLoading(false) }
  }

  const vazio = res && !res.carrossel && !res.story && !res.legenda && !res.whatsapp && !res.tweet && !res.email

  return (
    <div className="animate-fade-in">
      <PageHeader title="Repurposing de Conteúdo" caption="Adapte um conteúdo pronto para outros formatos" />
      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[380px_1fr]">
        <Panel as="aside" className="space-y-4 self-start">
          <Field label="Conteúdo original" htmlFor="rp-conteudo" hint={conteudo.trim() ? `${conteudo.length} caracteres` : "Roteiro, legenda, artigo ou transcrição"}>
            <textarea id="rp-conteudo" value={conteudo} onChange={e => setConteudo(e.target.value)} rows={10} placeholder="Cole aqui o texto que você quer adaptar" className={areaCls} />
          </Field>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-[13px] font-medium text-px-ink">Formatos de saída</legend>
            {FORMATOS.map(f => (
              <PxCheckbox key={f.id} label={`${f.label}: ${f.desc}`} checked={formatos.includes(f.id)} onChange={() => toggle(f.id)} />
            ))}
          </fieldset>
          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
          <PxButton fullWidth leftIcon={Repeat2} onClick={gerar} loading={loading} disabled={!conteudo.trim() || formatos.length === 0}>{loading ? "Adaptando" : res ? "Adaptar novamente" : "Adaptar conteúdo"}</PxButton>
        </Panel>

        <div className="min-w-0 space-y-3">
          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Adaptando o conteúdo. Pode levar até um minuto.</p>}
          {!loading && !res && (
            <Panel className="py-16 text-center">
              <p className="text-[15px] font-semibold text-px-ink">Cole o conteúdo e escolha os formatos</p>
              <p className="mt-1 text-[13px] text-px-muted">Cada formato sai adaptado ao tamanho e ao tom da plataforma.</p>
            </Panel>
          )}
          {!loading && vazio && <Panel className="py-10 text-center text-[13px] text-px-muted">A IA não devolveu nenhum formato. Tente de novo.</Panel>}
          {!loading && res && (
            <>
              {res.carrossel && (
                <Saida titulo="Carrossel" copia={`${res.carrossel.titulo}\n\n${(res.carrossel.slides ?? []).join("\n\n")}\n\nCTA: ${res.carrossel.cta}`}>
                  <p className="text-[14px] font-semibold text-px-ink">{res.carrossel.titulo}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-[13.5px] leading-relaxed text-px-ink/85">
                    {(res.carrossel.slides ?? []).map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                  <p className="border-t border-px-ink/10 pt-2 text-[13px] text-px-accent">CTA: {res.carrossel.cta}</p>
                </Saida>
              )}
              {res.story && (
                <Saida titulo="Stories" copia={(res.story.slides ?? []).join("\n\n---\n\n")}>
                  <ol className="space-y-2">
                    {(res.story.slides ?? []).map((s, i) => (
                      <li key={i} className="rounded-px-card bg-px-ink/[0.04] p-3">
                        <p className="text-[12.5px] font-medium text-px-muted">Story {i + 1}</p>
                        <p className="text-[13.5px] text-px-ink">{s}</p>
                      </li>
                    ))}
                  </ol>
                </Saida>
              )}
              {res.legenda && <Saida titulo="Legenda do feed" copia={res.legenda}><p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink/85">{res.legenda}</p></Saida>}
              {res.whatsapp && <Saida titulo="WhatsApp" copia={res.whatsapp}><p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink/85">{res.whatsapp}</p></Saida>}
              {res.tweet && (
                <Saida titulo="Tweet/X" copia={res.tweet}>
                  <p className="text-[13.5px] leading-relaxed text-px-ink/85">{res.tweet}</p>
                  <p className={`text-right text-[12.5px] ${res.tweet.length > 280 ? "font-semibold text-px-danger" : "text-px-muted"}`}>{res.tweet.length} de 280 caracteres</p>
                </Saida>
              )}
              {res.email && <Saida titulo="E-mail" copia={res.email}><p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink/85">{res.email}</p></Saida>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
