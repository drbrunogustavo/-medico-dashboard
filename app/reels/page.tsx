"use client"

import { useState } from "react"
import { Play, ClipboardList } from "lucide-react"
import { PautasPickerModal } from "@/components/PautasPickerModal"
import { Panel, PxButton, Segmented, Field, PxInput, Tag, PageHeader, CopyButton } from "@/components/px"

interface IdeiaReel {
  titulo: string
  gancho: string
  estrutura: string[]
  duracao: string
  formato: string
  potencial_viral: "Alto" | "Médio" | "Baixo"
  razao_viral: string
}

const CATEGORIAS = ["Educativo", "Autoridade", "Engajamento", "Vendas", "Motivacional", "Polêmico"]

const ideiaToText = (i: IdeiaReel) =>
  `${i.titulo}\n\nGancho: ${i.gancho}\n\nEstrutura:\n${(i.estrutura ?? []).map((s, n) => `${n + 1}. ${s}`).join("\n")}\n\nDuração: ${i.duracao} | Formato: ${i.formato}\nPotencial estimado: ${i.potencial_viral}. ${i.razao_viral}`

export default function ReelsPage() {
  const [tema, setTema] = useState("")
  const [categoria, setCategoria] = useState("Educativo")
  const [quantidade, setQuantidade] = useState(8)
  const [showPautas, setShowPautas] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ideias, setIdeias] = useState<IdeiaReel[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const gerar = async () => {
    if (!tema.trim()) { setErro("Informe o tema dos reels."); return }
    setErro(null); setLoading(true); setIdeias(null)
    try {
      const res = await fetch("/api/reels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tema, categoria, quantidade }) })
      const data = await res.json().catch(() => ({})) as { ideias?: IdeiaReel[]; error?: string }
      if (!res.ok || data.error) throw new Error(data.error || "falha")
      if (!Array.isArray(data.ideias)) throw new Error("sem ideias")
      setIdeias(data.ideias)
    } catch (e) {
      console.error("[reels] erro ao gerar:", e)
      setErro("Não foi possível gerar as ideias. Tente novamente em instantes.")
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Ideias para Reels" caption="Gancho, estrutura e duração para cada ideia" />
      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[320px_1fr]">
        <Panel as="aside" className="space-y-4 self-start">
          <Field label="Tema geral" htmlFor="rl-tema">
            <PxInput id="rl-tema" value={tema} onChange={e => setTema(e.target.value)} placeholder="Emagrecimento, longevidade, hormônios" />
          </Field>
          <PxButton variant="secondary" size="sm" leftIcon={ClipboardList} onClick={() => setShowPautas(true)}>Usar uma pauta do banco</PxButton>
          <div>
            <label htmlFor="rl-qtd" className="mb-1.5 block text-[13px] font-medium text-px-ink">Quantidade: {quantidade}</label>
            <input id="rl-qtd" type="range" min={4} max={15} value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} className="w-full accent-black" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Categoria</p>
            <Segmented label="Categoria" value={categoria} onChange={setCategoria} options={CATEGORIAS.map(c => ({ value: c, label: c }))} />
          </div>
          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
          <PxButton fullWidth leftIcon={Play} onClick={gerar} loading={loading} disabled={!tema.trim()}>{loading ? "Gerando" : ideias ? "Gerar novamente" : "Gerar ideias"}</PxButton>
        </Panel>

        <div className="min-w-0 space-y-4">
          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Criando as ideias. Pode levar até um minuto.</p>}
          {!loading && !ideias && (
            <Panel className="py-16 text-center">
              <p className="text-[15px] font-semibold text-px-ink">Defina o tema e a categoria</p>
              <p className="mt-1 text-[13px] text-px-muted">Cada ideia vem com gancho de 3 segundos e roteiro em tópicos.</p>
            </Panel>
          )}
          {!loading && ideias && (
            <>
              <p className="text-[13px] text-px-muted">{ideias.length} ideia{ideias.length !== 1 ? "s" : ""}. O potencial é uma estimativa da IA, sem dados de desempenho do seu perfil.</p>
              {ideias.length === 0 && <Panel className="py-10 text-center text-[13px] text-px-muted">A IA não devolveu nenhuma ideia. Tente de novo.</Panel>}
              <ul className="space-y-3">
                {ideias.map((i, n) => (
                  <li key={n}>
                    <Panel as="article" className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-[16px] font-semibold leading-snug text-px-ink">{i.titulo}</h2>
                        <CopyButton text={ideiaToText(i)} />
                      </div>
                      <div className="rounded-px-card bg-px-ink/[0.05] p-3">
                        <p className="text-[12.5px] font-medium text-px-muted">Gancho dos 3 primeiros segundos</p>
                        <p className="mt-0.5 text-[14px] font-medium text-px-ink">{i.gancho}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[12.5px] font-medium text-px-muted">Estrutura</p>
                        <ol className="list-decimal space-y-1 pl-5 text-[13.5px] leading-relaxed text-px-ink/85">
                          {(i.estrutura ?? []).map((p, j) => <li key={j}>{p}</li>)}
                        </ol>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t border-px-ink/10 pt-3">
                        <Tag tone="neutral">{i.duracao}</Tag>
                        <Tag tone="neutral">{i.formato}</Tag>
                        <Tag tone={i.potencial_viral === "Alto" ? "ink" : "neutral"}>Potencial {String(i.potencial_viral).toLowerCase()}</Tag>
                      </div>
                      {i.razao_viral && <p className="text-[12.5px] leading-relaxed text-px-muted">{i.razao_viral}</p>}
                    </Panel>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      {showPautas && <PautasPickerModal onSelect={t => setTema(t)} onClose={() => setShowPautas(false)} />}
    </div>
  )
}
