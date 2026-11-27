'use client'

import { useState, useCallback, useEffect } from "react"
import { Copy, Check, Trash2, ClipboardList } from "lucide-react"
import { PautasModal } from "@/components/PautasModal"
import { pedirJSON, mensagemErroIA } from "@/lib/ia-json"
import { Panel, PxButton, Segmented, Field, PxInput, Tag, PageHeader } from "@/components/px"

type Duracao = "15s" | "30s" | "60s" | "90s"
type Estilo  = "talking-head" | "texto-tela" | "broll" | "misto"
type TipoBloco = "gancho" | "problema" | "conteudo" | "insight" | "cta"
interface Bloco   { id: number; tempo: string; tipo: TipoBloco; fala: string; visual: string; corte: string }
interface Roteiro { titulo: string; blocos: Bloco[]; legenda: string; hashtags: string[]; hook: string }

const TIPO_LABEL: Record<TipoBloco, string> = { gancho: "Gancho", problema: "Problema", conteudo: "Conteúdo", insight: "Insight", cta: "Chamada para ação" }
const DURACOES = [{ v: "15s", l: "15s", d: "Viral curto" }, { v: "30s", l: "30s", d: "Stories" }, { v: "60s", l: "60s", d: "Educativo" }, { v: "90s", l: "90s", d: "Detalhado" }]
const ESTILOS  = [
  { v: "talking-head", l: "Direto para a câmera", d: "Médico falando para a câmera" },
  { v: "texto-tela",   l: "Texto na tela",        d: "Palavras na tela junto com a fala" },
  { v: "broll",        l: "B-roll",               d: "Imagens com narração" },
  { v: "misto",        l: "Misto",                d: "Combinação dos estilos" },
]

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

function Opcao({ ativo, onClick, titulo, desc }: { ativo: boolean; onClick: () => void; titulo: string; desc: string }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={onClick}
      className={`rounded-px-card border p-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${ativo ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>
      <span className="block text-[13.5px] font-semibold">{titulo}</span>
      <span className={`block text-[12px] ${ativo ? "text-white/75" : "text-px-muted"}`}>{desc}</span>
    </button>
  )
}

function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [estado, setEstado] = useState<"" | "ok" | "erro">("")
  async function copiar() {
    try { await navigator.clipboard.writeText(text); setEstado("ok") } catch { setEstado("erro") }
    setTimeout(() => setEstado(""), 1800)
  }
  return (
    <PxButton variant="secondary" size="sm" leftIcon={estado === "ok" ? Check : Copy} onClick={copiar}>
      {estado === "ok" ? "Copiado" : estado === "erro" ? "Não foi possível copiar" : label}
    </PxButton>
  )
}

export default function RoteirosPage() {
  const [tema, setTema] = useState("")
  const [publico, setPublico] = useState("")
  const [duracao, setDuracao] = useState<Duracao>("60s")
  const [estilo, setEstilo] = useState<Estilo>("talking-head")
  const [roteiro, setRoteiro] = useState<Roteiro | null>(null)
  const [loading, setLoading] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editInstr, setEditInstr] = useState("")
  const [regenLoad, setRegenLoad] = useState(false)
  const [activeTab, setActiveTab] = useState<"roteiro" | "legenda" | "hashtags">("roteiro")
  const [showPautas, setShowPautas] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [novaHashtag, setNovaHashtag] = useState("")

  useEffect(() => {
    const urlTema = new URLSearchParams(window.location.search).get("tema")
    if (urlTema) { setTema(urlTema); return }
    try {
      const saved = localStorage.getItem("praxis_roteiro_tema")
      if (saved) { setTema(saved); localStorage.removeItem("praxis_roteiro_tema") }
    } catch { /* armazenamento indisponível */ }
  }, [])

  const gerar = useCallback(async () => {
    if (!tema.trim()) return
    setLoading(true); setErro(null)
    try {
      const prompt = [
        "Você é roteirista médico para Reels do médico usuário — Clínico-Geral, Endocrinologia e Nutrologia.",
        "TEMA: " + tema + (publico ? " | PÚBLICO: " + publico : ""),
        "DURAÇÃO: " + duracao + " | ESTILO: " + estilo,
        "Tom: direto, humano, sem enrolação. Gancho nos primeiros 3 segundos.",
        "",
        "Retorne SOMENTE JSON válido sem markdown:",
        '{"titulo":"título do reel","hook":"gancho abertura max 2 frases","blocos":[{"id":1,"tempo":"0:00-0:03","tipo":"gancho","fala":"texto falado","visual":"o que aparece na tela","corte":"corte seco"}],"legenda":"legenda completa Instagram max 2200 chars","hashtags":["tag1","tag2"]}',
        "",
        "Tipos em ordem: gancho, problema, conteudo (1-3x), insight, cta. Máx 5 hashtags.",
      ].join("\n")
      const json = await pedirJSON<Roteiro>("/api/roteiros", prompt, 2000)
      if (!Array.isArray(json.blocos)) throw new Error("sem blocos")
      setRoteiro({ ...json, hashtags: json.hashtags ?? [], legenda: json.legenda ?? "" })
      setActiveTab("roteiro"); setEditIdx(null)
    } catch (e) {
      console.error("[roteiros] erro ao gerar:", e)
      setErro(mensagemErroIA(e, "A IA devolveu uma resposta inesperada. Tente novamente."))
    } finally { setLoading(false) }
  }, [tema, publico, duracao, estilo])

  const regenBloco = useCallback(async (idx: number) => {
    if (!roteiro || !editInstr.trim()) return
    setRegenLoad(true); setErro(null)
    try {
      const b = roteiro.blocos[idx]
      const prompt = 'Reescreva bloco para o médico usuário. Tom: humano.\ntipo="' + b.tipo + '" | fala="' + b.fala + '"\nINSTRUÇÃO: ' + editInstr + '\nRetorne SOMENTE JSON: {"fala":"...","visual":"...","corte":"..."}'
      const json = await pedirJSON<Partial<Bloco>>("/api/roteiros", prompt, 400)
      setRoteiro(prev => prev ? { ...prev, blocos: prev.blocos.map((bl, i) => i === idx ? { ...bl, ...json } : bl) } : prev)
      setEditInstr(""); setEditIdx(null)
    } catch (e) {
      console.error("[roteiros] erro ao regenerar bloco:", e)
      setErro(mensagemErroIA(e, "Não foi possível reescrever o bloco. Tente novamente."))
    } finally { setRegenLoad(false) }
  }, [roteiro, editInstr])

  const atualizarBloco = (idx: number, campo: "fala" | "visual" | "corte", valor: string) =>
    setRoteiro(prev => prev ? { ...prev, blocos: prev.blocos.map((bl, i) => i === idx ? { ...bl, [campo]: valor } : bl) } : prev)

  const txt = roteiro ? roteiro.blocos.map(b => "[" + b.tempo + "] " + b.tipo.toUpperCase() + "\nFALA: " + b.fala + "\nVISUAL: " + b.visual + "\nCORTE: " + b.corte).join("\n\n") : ""
  const hashtagsTxt = roteiro ? roteiro.hashtags.map(h => "#" + h.replace(/^#/, "")).join(" ") : ""

  function addHashtag() {
    const v = novaHashtag.replace(/#/g, "").trim()
    if (!v) return
    setRoteiro(prev => prev ? { ...prev, hashtags: [...prev.hashtags, v] } : prev)
    setNovaHashtag("")
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Gerador de Roteiros" caption="Roteiros de Reels prontos para gravar, a partir de um tema" />
      {showPautas && <PautasModal onSelect={t => setTema(t)} onClose={() => setShowPautas(false)} />}

      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[300px_1fr]">
        <Panel as="aside" className="space-y-4 self-start">
          <Field label="Tema" htmlFor="rt-tema" hint="Escolha uma pauta ou escreva">
            <textarea id="rt-tema" value={tema} onChange={e => setTema(e.target.value)} rows={3} placeholder="Andropausa e reposição de testosterona" className={areaCls} />
          </Field>
          <PxButton variant="secondary" size="sm" leftIcon={ClipboardList} onClick={() => setShowPautas(true)}>Usar uma pauta do banco</PxButton>
          <Field label="Público (opcional)" htmlFor="rt-pub"><PxInput id="rt-pub" value={publico} onChange={e => setPublico(e.target.value)} placeholder="Homens acima de 40 anos" /></Field>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-px-ink">Duração</p>
            <div role="group" aria-label="Duração" className="grid grid-cols-2 gap-1.5">
              {DURACOES.map(d => <Opcao key={d.v} ativo={duracao === d.v} onClick={() => setDuracao(d.v as Duracao)} titulo={d.l} desc={d.d} />)}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-px-ink">Estilo</p>
            <div role="group" aria-label="Estilo" className="flex flex-col gap-1.5">
              {ESTILOS.map(e => <Opcao key={e.v} ativo={estilo === e.v} onClick={() => setEstilo(e.v as Estilo)} titulo={e.l} desc={e.d} />)}
            </div>
          </div>
          <PxButton fullWidth onClick={gerar} loading={loading} disabled={!tema.trim()}>{loading ? "Gerando" : roteiro ? "Gerar outro roteiro" : "Gerar roteiro"}</PxButton>
        </Panel>

        <div className="min-w-0 space-y-4">
          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}

          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Escrevendo o roteiro</p>}

          {!roteiro && !loading && (
            <Panel className="py-16 text-center">
              <p className="text-[15px] font-semibold text-px-ink">Defina o tema e gere o roteiro</p>
              <p className="mt-1 text-[13px] text-px-muted">Você recebe falas, o que aparece na tela, os cortes, a legenda e as hashtags.</p>
            </Panel>
          )}

          {roteiro && !loading && (
            <>
              <Panel as="section" className="space-y-3">
                <p className="text-[12.5px] text-px-muted">{duracao}, {ESTILOS.find(e => e.v === estilo)?.l.toLowerCase()}</p>
                <h2 className="text-[19px] font-semibold leading-snug text-px-ink">{roteiro.titulo}</h2>
                <div className="rounded-px-card bg-px-ink/[0.05] p-3">
                  <p className="text-[12.5px] font-medium text-px-muted">Gancho de abertura</p>
                  <p className="mt-0.5 text-[14px] italic leading-relaxed text-px-ink">&ldquo;{roteiro.hook}&rdquo;</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Segmented label="Parte do roteiro" value={activeTab} onChange={setActiveTab}
                    options={[{ value: "roteiro", label: "Roteiro" }, { value: "legenda", label: "Legenda" }, { value: "hashtags", label: "Hashtags" }]} />
                  {activeTab === "roteiro" && <CopyBtn text={txt} />}
                </div>
              </Panel>

              {activeTab === "roteiro" && (
                <ol className="space-y-3">
                  {roteiro.blocos.map((b, idx) => {
                    const isEd = editIdx === idx
                    return (
                      <li key={b.id ?? idx}>
                        <Panel as="article" className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Tag tone={b.tipo === "gancho" || b.tipo === "cta" ? "ink" : "neutral"}>{TIPO_LABEL[b.tipo] ?? b.tipo}</Tag>
                            <span className="text-[12.5px] text-px-muted">{b.tempo}</span>
                            <PxButton className="ml-auto" variant="quiet" size="sm" onClick={() => { setEditIdx(isEd ? null : idx); setEditInstr("") }}>{isEd ? "Fechar edição" : "Editar"}</PxButton>
                          </div>
                          <div>
                            <p className="mb-1 text-[12.5px] font-medium text-px-muted">Fala</p>
                            {isEd
                              ? <textarea aria-label="Fala do bloco" value={b.fala} rows={3} onChange={e => atualizarBloco(idx, "fala", e.target.value)} className={areaCls} />
                              : <p className="text-[14px] leading-relaxed text-px-ink">{b.fala}</p>}
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                            <div>
                              <p className="mb-1 text-[12.5px] font-medium text-px-muted">Visual</p>
                              {isEd ? <PxInput aria-label="Visual do bloco" value={b.visual} onChange={e => atualizarBloco(idx, "visual", e.target.value)} /> : <p className="text-[13px] leading-relaxed text-px-ink/80">{b.visual}</p>}
                            </div>
                            <div className="sm:min-w-[140px]">
                              <p className="mb-1 text-[12.5px] font-medium text-px-muted">Corte</p>
                              {isEd ? <PxInput aria-label="Corte do bloco" value={b.corte} onChange={e => atualizarBloco(idx, "corte", e.target.value)} /> : <Tag tone="neutral">{b.corte}</Tag>}
                            </div>
                          </div>
                          {isEd && (
                            <div className="space-y-2 border-t border-px-ink/10 pt-3">
                              <p className="text-[12.5px] font-medium text-px-muted">Reescrever com IA</p>
                              <div className="flex gap-2">
                                <PxInput aria-label="Instrução para reescrever o bloco" className="flex-1" value={editInstr} onChange={e => setEditInstr(e.target.value)}
                                  placeholder="Mais impactante, cite um estudo" onKeyDown={e => { if (e.key === "Enter" && editInstr.trim() && !regenLoad) regenBloco(idx) }} />
                                <PxButton onClick={() => regenBloco(idx)} loading={regenLoad} disabled={!editInstr.trim()}>Reescrever</PxButton>
                              </div>
                            </div>
                          )}
                        </Panel>
                      </li>
                    )
                  })}
                </ol>
              )}

              {activeTab === "legenda" && (
                <Panel as="section" className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[12.5px] ${roteiro.legenda.length > 2200 ? "font-semibold text-px-danger" : "text-px-muted"}`}>{roteiro.legenda.length} de 2200 caracteres</span>
                    <CopyBtn text={roteiro.legenda + "\n\n" + hashtagsTxt} label="Copiar legenda com hashtags" />
                  </div>
                  <textarea aria-label="Legenda" value={roteiro.legenda} rows={14} onChange={e => setRoteiro(prev => prev ? { ...prev, legenda: e.target.value } : prev)} className={areaCls + " leading-relaxed"} />
                </Panel>
              )}

              {activeTab === "hashtags" && (
                <Panel as="section" className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] text-px-muted">{roteiro.hashtags.length} hashtag{roteiro.hashtags.length !== 1 ? "s" : ""}</span>
                    <CopyBtn text={hashtagsTxt} label="Copiar todas" />
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {roteiro.hashtags.map((h, i) => (
                      <li key={h + i} className="flex items-center rounded-full border border-px-ink/15 bg-white pl-3">
                        <span className="text-[13px] font-medium text-px-ink">#{h.replace(/^#/, "")}</span>
                        <button type="button" aria-label={`Remover hashtag ${h}`} onClick={() => setRoteiro(prev => prev ? { ...prev, hashtags: prev.hashtags.filter((_, j) => j !== i) } : prev)}
                          className="flex h-8 w-8 items-center justify-center text-px-muted hover:text-px-danger"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <PxInput aria-label="Nova hashtag" className="flex-1" value={novaHashtag} onChange={e => setNovaHashtag(e.target.value)} placeholder="Adicionar hashtag"
                      onKeyDown={e => { if (e.key === "Enter") addHashtag() }} />
                    <PxButton variant="secondary" onClick={addHashtag} disabled={!novaHashtag.replace(/#/g, "").trim()}>Adicionar</PxButton>
                  </div>
                </Panel>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
