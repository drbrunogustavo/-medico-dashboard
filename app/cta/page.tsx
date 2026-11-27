"use client"

import { useState } from "react"
import { Zap } from "lucide-react"
import { Panel, PxButton, Segmented, Field, PxInput, Tag, PageHeader, CopyButton } from "@/components/px"

interface Cta { texto: string; tipo: string; canal: string }

const OBJETIVOS = ["agendar consulta", "seguir perfil", "comentar", "salvar post", "compartilhar", "ver link na bio", "enviar mensagem"]
const rotulo = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const FORMATOS = ["Reel", "Carrossel", "Feed", "Stories", "Bio"]

export default function CtaPage() {
  const [tema, setTema] = useState("")
  const [objetivo, setObjetivo] = useState("agendar consulta")
  const [formato, setFormato] = useState("Reel")
  const [quantidade, setQuantidade] = useState(10)
  const [loading, setLoading] = useState(false)
  const [ctas, setCtas] = useState<Cta[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const gerar = async () => {
    if (!tema.trim()) { setErro("Informe o tema do conteúdo."); return }
    setErro(null); setLoading(true); setCtas(null)
    try {
      const res = await fetch("/api/cta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tema, objetivo, formato, quantidade }) })
      const data = await res.json().catch(() => ({})) as { ctas?: Cta[]; error?: string }
      if (!res.ok || data.error) throw new Error(data.error || "falha")
      if (!Array.isArray(data.ctas)) throw new Error("sem ctas")
      setCtas(data.ctas)
    } catch (e) {
      console.error("[cta] erro ao gerar:", e)
      setErro("Não foi possível gerar os CTAs. Tente novamente em instantes.")
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Gerador de CTAs" caption="Chamadas para ação para fechar o conteúdo" />
      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[320px_1fr]">
        <Panel as="aside" className="space-y-4 self-start">
          <Field label="Tema do conteúdo" htmlFor="cta-tema">
            <PxInput id="cta-tema" value={tema} onChange={e => setTema(e.target.value)} placeholder="Como reduzir a insulina naturalmente" />
          </Field>
          <div>
            <label htmlFor="cta-qtd" className="mb-1.5 block text-[13px] font-medium text-px-ink">Quantidade: {quantidade}</label>
            <input id="cta-qtd" type="range" min={5} max={20} value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} className="w-full accent-black" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Objetivo</p>
            <div role="group" aria-label="Objetivo do CTA" className="flex flex-col gap-1.5">
              {OBJETIVOS.map(o => (
                <button key={o} type="button" aria-pressed={objetivo === o} onClick={() => setObjetivo(o)}
                  className={`rounded-px-ctl border px-3 py-2 text-left text-[13.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${objetivo === o ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>{rotulo(o)}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Formato</p>
            <Segmented label="Formato" value={formato} onChange={setFormato} options={FORMATOS.map(f => ({ value: f, label: f }))} />
          </div>
          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
          <PxButton fullWidth leftIcon={Zap} onClick={gerar} loading={loading} disabled={!tema.trim()}>{loading ? "Gerando" : ctas ? "Gerar novamente" : "Gerar CTAs"}</PxButton>
        </Panel>

        <div className="min-w-0 space-y-4">
          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Criando os CTAs. Pode levar até um minuto.</p>}
          {!loading && !ctas && (
            <Panel className="py-16 text-center">
              <p className="text-[15px] font-semibold text-px-ink">Defina o tema e o objetivo</p>
              <p className="mt-1 text-[13px] text-px-muted">Você recebe variações de CTA para o formato escolhido.</p>
            </Panel>
          )}
          {!loading && ctas && (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-px-muted">{ctas.length} CTA{ctas.length !== 1 ? "s" : ""} para {formato}</p>
                {ctas.length > 0 && <CopyButton text={ctas.map(c => c.texto).join("\n\n")} label="Copiar todos" />}
              </div>
              {ctas.length === 0
                ? <Panel className="py-10 text-center text-[13px] text-px-muted">A IA não devolveu nenhum CTA. Tente de novo.</Panel>
                : <ul className="space-y-3">
                    {ctas.map((c, i) => (
                      <li key={i}>
                        <Panel as="article" className="flex items-start gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-[14px] leading-relaxed text-px-ink">{c.texto}</p>
                            <div className="flex flex-wrap items-center gap-2"><Tag tone="neutral">{c.tipo}</Tag><span className="text-[12.5px] text-px-muted">{c.canal}</span></div>
                          </div>
                          <CopyButton text={c.texto} />
                        </Panel>
                      </li>
                    ))}
                  </ul>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
