"use client"

import { useState, useRef } from "react"
import { Panel, PxButton, Tag, Segmented, PxInput, PxCheckbox, PxModal, PageHeader } from "@/components/px"
import { Toast, type ToastType } from "@/components/Toast"
import { BookOpen, RefreshCw, ShieldQuestion, MessageSquare, Zap, Check } from "lucide-react"

// ─── Tipos ─────────────────────────────────────────────────────────────────────

type ObjCategoria = "MEDO" | "CUSTO/ACESSO" | "EFICACIA" | "EFEITOS" | "DEPENDENCIA"
type FormatoTab   = "reel" | "story" | "carrossel" | "faq"

interface Objecao {
  id:        number
  texto:     string
  categoria: ObjCategoria
}

interface ReelFmt     { titulo: string; gancho: string; estrutura: string[] }
interface StoryFmt    { titulo: string; slides: string[] }
interface CarrosselFmt{ titulo: string; slides: string[] }
interface FaqFmt      { titulo: string; resposta: string }

interface TransformResult {
  reel:      ReelFmt
  story:     StoryFmt
  carrossel: CarrosselFmt
  faq:       FaqFmt
}

interface Pauta {
  id:        number | string
  titulo:    string
  categoria: string
}

// ─── Configuração ──────────────────────────────────────────────────────────────

const CAT_LABEL: Record<ObjCategoria, string> = {
  "MEDO":         "Medo",
  "CUSTO/ACESSO": "Custo e acesso",
  "EFICACIA":     "Eficácia",
  "EFEITOS":      "Efeitos colaterais",
  "DEPENDENCIA":  "Dependência e duração",
}

const FORMATO_LABEL: Record<FormatoTab, string> = {
  reel: "Reel", story: "Story", carrossel: "Carrossel", faq: "FAQ",
}
const FORMATOS: FormatoTab[] = ["reel", "story", "carrossel", "faq"]

const CATEGORIAS: ObjCategoria[] = ["MEDO", "CUSTO/ACESSO", "EFICACIA", "EFEITOS", "DEPENDENCIA"]

// ─── Exemplos de demonstração (só quando o mapeamento falha) ───────────────────

const MOCK_OBJECOES: Objecao[] = [
  { id:  1, texto: "Hormônio causa câncer de mama?",               categoria: "MEDO"         },
  { id:  2, texto: "Tenho medo de ter trombose",                   categoria: "MEDO"         },
  { id:  3, texto: "Pode causar infarto?",                         categoria: "MEDO"         },
  { id:  4, texto: "Vou ficar mais agressiva com hormônio?",       categoria: "MEDO"         },
  { id:  5, texto: "Minha mãe teve câncer, não posso usar",       categoria: "MEDO"         },
  { id:  6, texto: "É muito caro pagar a consulta todo mês",      categoria: "CUSTO/ACESSO" },
  { id:  7, texto: "Meu plano não cobre esse tipo de consulta",   categoria: "CUSTO/ACESSO" },
  { id:  8, texto: "Os exames são muito caros",                   categoria: "CUSTO/ACESSO" },
  { id:  9, texto: "Não tenho como pagar os medicamentos",        categoria: "CUSTO/ACESSO" },
  { id: 10, texto: "Será que posso encontrar mais barato?",       categoria: "CUSTO/ACESSO" },
  { id: 11, texto: "Realmente funciona para todo mundo?",         categoria: "EFICACIA"     },
  { id: 12, texto: "Já tentei tudo e nada resolve",               categoria: "EFICACIA"     },
  { id: 13, texto: "Vi que tem estudos contra também",            categoria: "EFICACIA"     },
  { id: 14, texto: "Minha amiga usou e não deu resultado",        categoria: "EFICACIA"     },
  { id: 15, texto: "E se não funcionar para mim?",                categoria: "EFICACIA"     },
  { id: 16, texto: "Vou engordar com o tratamento?",              categoria: "EFEITOS"      },
  { id: 17, texto: "Pode causar queda de cabelo?",                categoria: "EFEITOS"      },
  { id: 18, texto: "Vou ficar retendo líquido?",                  categoria: "EFEITOS"      },
  { id: 19, texto: "Posso ter acne com hormônio?",                categoria: "EFEITOS"      },
  { id: 20, texto: "Vai afetar meu humor?",                       categoria: "EFEITOS"      },
  { id: 21, texto: "Vou ter que tomar para sempre?",              categoria: "DEPENDENCIA"  },
  { id: 22, texto: "Se parar de tomar, fico pior?",               categoria: "DEPENDENCIA"  },
  { id: 23, texto: "Pode se tornar uma dependência?",             categoria: "DEPENDENCIA"  },
  { id: 24, texto: "Por quanto tempo preciso fazer o tratamento?",categoria: "DEPENDENCIA"  },
  { id: 25, texto: "E se quiser parar? Como faço?",               categoria: "DEPENDENCIA"  },
]

// ─── Página ─────────────────────────────────────────────────────────────────────

function Rotulo({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[12px] text-px-muted">{children}</p>
}

export default function ObecoesPage() {
  const [tema,            setTema]            = useState("")
  const [objecoes,        setObjecoes]        = useState<Objecao[]>([])
  const [demo,            setDemo]            = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [selectedIds,     setSelectedIds]     = useState<number[]>([])
  const [savedIds,        setSavedIds]        = useState<number[]>([])
  const [activeObjecao,   setActiveObjecao]   = useState<Objecao | null>(null)
  const [transformResult, setTransformResult] = useState<TransformResult | null>(null)
  const [transformError,  setTransformError]  = useState(false)
  const [loadingTransform,setLoadingTransform]= useState(false)
  const [activeTab,       setActiveTab]       = useState<FormatoTab>("reel")
  const [savedFormats,    setSavedFormats]    = useState<FormatoTab[]>([])
  const [savingFormat,    setSavingFormat]    = useState(false)
  const [bulkLoading,     setBulkLoading]     = useState(false)
  const [toast,           setToast]           = useState<string | null>(null)
  const [toastType,       setToastType]       = useState<ToastType>("success")
  const [modalOpen,       setModalOpen]       = useState(false)
  const [pautas,          setPautas]          = useState<Pauta[]>([])
  const [loadingPautas,   setLoadingPautas]   = useState(false)
  const [pautaSearch,     setPautaSearch]     = useState("")

  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string, type: ToastType = "success") => {
    setToastType(type)
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  const limparMapa = () => {
    setObjecoes([]); setSelectedIds([]); setSavedIds([]); setError(null); setActiveObjecao(null); setDemo(false)
  }

  const mapearObjecoes = async () => {
    if (!tema.trim()) { setError("Digite o tratamento ou tema antes de mapear."); return }
    setError(null); setLoading(true); setObjecoes([]); setSelectedIds([]); setSavedIds([]); setActiveObjecao(null); setDemo(false)

    try {
      const res  = await fetch("/api/objecoes/mapear", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tema }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setObjecoes(data.objecoes ?? [])
    } catch (e) {
      console.error("[objecoes] erro ao mapear objeções:", e)
      setError("Não foi possível mapear as objeções deste tema. A lista abaixo é um exemplo de demonstração, não foi gerada para o seu tema.")
      setObjecoes(MOCK_OBJECOES)
      setDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAll = () => {
    setSelectedIds(selectedIds.length === objecoes.length ? [] : objecoes.map(o => o.id))
  }

  const transformarObjecao = async (ob: Objecao) => {
    setActiveObjecao(ob)
    setTransformResult(null)
    setTransformError(false)
    setSavedFormats([])
    setActiveTab("reel")
    setLoadingTransform(true)

    try {
      const res  = await fetch("/api/objecoes/transformar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ objecao: ob.texto, tema }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "falha")
      setTransformResult(data)
    } catch (e) {
      console.error("[objecoes] erro ao transformar objeção:", e)
      setTransformError(true)
    } finally {
      setLoadingTransform(false)
    }
  }

  const salvarPauta = async (payload: object) => {
    const r = await fetch("/api/pautas", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
  }

  const salvarFormato = async (formato: FormatoTab) => {
    if (!transformResult || !activeObjecao) return
    const map = {
      reel:      { titulo: transformResult.reel.titulo,      nota: `REEL\nGancho: ${transformResult.reel.gancho}\n\nEstrutura:\n${transformResult.reel.estrutura.join('\n')}` },
      story:     { titulo: transformResult.story.titulo,     nota: `STORY\n${transformResult.story.slides.join('\n')}` },
      carrossel: { titulo: transformResult.carrossel.titulo, nota: `CARROSSEL\n${transformResult.carrossel.slides.join('\n')}` },
      faq:       { titulo: transformResult.faq.titulo,       nota: `FAQ/LEGENDA\n${transformResult.faq.resposta}` },
    }
    setSavingFormat(true)
    try {
      await salvarPauta({
        titulo:    map[formato].titulo,
        nota:      map[formato].nota,
        categoria: "Resposta a Objeção",
        prioridade:"Alta",
        estagio:   "Ideia",
        tags:      ["objecao", formato, tema.toLowerCase()],
      })
      setSavedFormats(prev => [...prev, formato])
      showToast("Salvo no Banco de Pautas")
    } catch (e) {
      console.error("[objecoes] erro ao salvar formato:", e)
      showToast("Erro ao salvar. Tente novamente.", "error")
    } finally {
      setSavingFormat(false)
    }
  }

  const transformarEmLote = async () => {
    if (selectedIds.length === 0) return
    setBulkLoading(true)
    const selecionadas = objecoes.filter(o => selectedIds.includes(o.id))
    let saved = 0
    let failed = 0
    const okIds: number[] = []
    for (const ob of selecionadas) {
      try {
        await salvarPauta({
          titulo:    `Responder objeção: ${ob.texto}`,
          nota:      `Categoria: ${CAT_LABEL[ob.categoria] ?? ob.categoria}\nTema: ${tema}`,
          categoria: "Resposta a Objeção",
          prioridade:"Alta",
          estagio:   "Ideia",
          tags:      ["objecao", ob.categoria.toLowerCase(), tema.toLowerCase()],
        })
        okIds.push(ob.id)
        saved++
      } catch (e) {
        console.error("[objecoes] erro ao salvar objeção em lote:", e)
        failed++
      }
    }
    setSavedIds(prev => [...prev, ...okIds])
    setBulkLoading(false)
    if (failed === 0) {
      showToast(`${saved} ${saved === 1 ? "objeção salva" : "objeções salvas"} no Banco de Pautas`)
      setSelectedIds([])
    } else {
      showToast(`${saved} salvas, ${failed} com erro. As que falharam continuam selecionadas.`, "error")
      setSelectedIds(selectedIds.filter(id => !okIds.includes(id)))
    }
  }

  const abrirModal = async () => {
    setModalOpen(true); setPautaSearch("")
    if (pautas.length > 0) return
    setLoadingPautas(true)
    try {
      const res  = await fetch("/api/pautas")
      const data = await res.json()
      setPautas(Array.isArray(data) ? data : [])
    } catch { setPautas([]) }
    finally  { setLoadingPautas(false) }
  }

  const objecoesByCategoria = CATEGORIAS.reduce<Record<ObjCategoria, Objecao[]>>((acc, cat) => {
    acc[cat] = objecoes.filter(o => o.categoria === cat)
    return acc
  }, {} as Record<ObjCategoria, Objecao[]>)

  const tabSalva = savedFormats.includes(activeTab)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Objeções"
        caption="Dúvidas de pacientes viram conteúdo educativo"
        actions={objecoes.length > 0 ? <PxButton variant="secondary" leftIcon={RefreshCw} onClick={limparMapa}>Novo mapa</PxButton> : undefined}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">

        <Panel tone="light" className="space-y-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-[14px] font-semibold text-px-ink">Tratamento ou tema</h2>
              <p className="mt-0.5 text-[12px] text-px-muted">Gera as objeções mais comuns de pacientes sobre o tema, agrupadas por tipo de medo.</p>
            </div>
            <PxButton size="sm" variant="secondary" leftIcon={BookOpen} onClick={abrirModal}>Importar pauta</PxButton>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <PxInput
              aria-label="Tratamento ou tema"
              value={tema}
              onChange={e => setTema(e.target.value)}
              onKeyDown={e => e.key === "Enter" && mapearObjecoes()}
              placeholder="Ex: reposição hormonal, tirzepatida, emagrecimento com GLP-1"
              className="flex-1"
            />
            <PxButton leftIcon={ShieldQuestion} loading={loading} disabled={loading || !tema.trim()} onClick={mapearObjecoes}>
              {loading ? "Mapeando" : "Mapear objeções"}
            </PxButton>
          </div>
        </Panel>

        {error && (
          <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] leading-relaxed text-px-danger">{error}</p>
        )}

        {loading && (
          <Panel tone="light" className="py-14 text-center">
            <p role="status" className="text-[14px] text-px-ink">Mapeando as objeções deste tema. Leva alguns segundos.</p>
          </Panel>
        )}

        {!loading && objecoes.length === 0 && !error && (
          <Panel tone="light" className="py-14 text-center">
            <p className="mx-auto max-w-lg text-[13px] leading-relaxed text-px-ink">
              Digite um tratamento ou tema e mapeie as objeções reais de pacientes. Cada uma pode virar Reel, Story, Carrossel ou FAQ, ou ir direto para o Banco de Pautas em lote.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {CATEGORIAS.map(cat => <Tag key={cat} tone="neutral">{CAT_LABEL[cat]}</Tag>)}
            </div>
          </Panel>
        )}

        {!loading && objecoes.length > 0 && (
          <div className={activeObjecao ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_480px]" : "grid gap-4"}>

            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <PxCheckbox
                  label={selectedIds.length === 0 ? "Selecionar todas" : `${selectedIds.length} ${selectedIds.length === 1 ? "selecionada" : "selecionadas"}`}
                  checked={selectedIds.length === objecoes.length}
                  onChange={selectAll}
                />
                {selectedIds.length > 0 && (
                  <PxButton leftIcon={Zap} loading={bulkLoading} disabled={bulkLoading} onClick={transformarEmLote}>
                    {bulkLoading ? "Salvando" : "Salvar selecionadas no Banco de Pautas"}
                  </PxButton>
                )}
              </div>

              {CATEGORIAS.map(cat => {
                const items = objecoesByCategoria[cat] ?? []
                if (items.length === 0) return null
                return (
                  <Panel key={cat} tone="light" className="overflow-hidden p-0">
                    <div className="flex items-baseline justify-between border-b border-px-line px-5 py-3">
                      <h3 className="text-[14px] font-semibold text-px-ink">{CAT_LABEL[cat]}</h3>
                      <span className="text-[12px] text-px-muted">{items.length} {items.length === 1 ? "objeção" : "objeções"}</span>
                    </div>
                    <ul className="divide-y divide-px-line">
                      {items.map(ob => {
                        const isSaved  = savedIds.includes(ob.id)
                        const isActive = activeObjecao?.id === ob.id
                        return (
                          <li key={ob.id} className={isActive ? "flex items-center gap-3 bg-px-ink/[0.05] px-5 py-3" : "flex items-center gap-3 px-5 py-3"}>
                            <div className="min-w-0 flex-1">
                              <PxCheckbox label={ob.texto} checked={selectedIds.includes(ob.id)} onChange={() => toggleSelect(ob.id)} />
                            </div>
                            {isSaved ? (
                              <Tag tone="ok">Salvo</Tag>
                            ) : (
                              <PxButton size="sm" variant="secondary" leftIcon={MessageSquare} aria-label={`Transformar em conteúdo: ${ob.texto}`} onClick={() => transformarObjecao(ob)}>
                                Transformar
                              </PxButton>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </Panel>
                )
              })}
            </div>

            {activeObjecao && (
              <Panel tone="light" className="flex max-h-[85vh] flex-col overflow-hidden p-0 lg:sticky lg:top-6">
                <div className="flex items-start justify-between gap-3 border-b border-px-line px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[12px] text-px-muted">Transformando a objeção</p>
                    <h3 className="mt-0.5 text-[14px] font-semibold leading-snug text-px-ink">{activeObjecao.texto}</h3>
                  </div>
                  <PxButton size="sm" variant="quiet" onClick={() => setActiveObjecao(null)}>Fechar</PxButton>
                </div>

                {loadingTransform ? (
                  <p role="status" className="px-5 py-16 text-center text-[13px] text-px-ink">Gerando os 4 formatos.</p>
                ) : transformError ? (
                  <div className="space-y-3 px-5 py-10 text-center">
                    <p role="alert" className="text-[13px] text-px-danger">Não foi possível gerar o conteúdo desta objeção.</p>
                    <PxButton variant="secondary" onClick={() => transformarObjecao(activeObjecao)}>Tentar de novo</PxButton>
                  </div>
                ) : transformResult ? (
                  <>
                    <div className="px-5 pt-4">
                      <Segmented
                        label="Formato"
                        value={activeTab}
                        onChange={setActiveTab}
                        options={FORMATOS.map(f => ({ value: f, label: savedFormats.includes(f) ? `${FORMATO_LABEL[f]} (salvo)` : FORMATO_LABEL[f] }))}
                      />
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4 pt-4">
                      {activeTab === "reel" && (
                        <>
                          <div><Rotulo>Título</Rotulo><p className="text-[13px] font-semibold text-px-ink">{transformResult.reel.titulo}</p></div>
                          <div><Rotulo>Gancho de abertura</Rotulo><p className="whitespace-pre-wrap text-[13px] italic leading-relaxed text-px-ink">{transformResult.reel.gancho}</p></div>
                          <div>
                            <Rotulo>Estrutura (60 segundos)</Rotulo>
                            <ol className="space-y-1.5">
                              {(transformResult.reel.estrutura ?? []).map((p, i) => (
                                <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-px-ink">
                                  <span className="w-4 flex-shrink-0 font-semibold tabular-nums text-px-accent">{i + 1}</span>
                                  <span>{p.replace(/^\d+\.\s*/, "")}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </>
                      )}
                      {activeTab === "story" && (
                        <>
                          <div><Rotulo>Título</Rotulo><p className="text-[13px] font-semibold text-px-ink">{transformResult.story.titulo}</p></div>
                          <ul className="space-y-2">
                            {(transformResult.story.slides ?? []).map((slide, i) => (
                              <li key={i} className="rounded-px-card border border-px-line bg-white/50 px-3 py-2.5">
                                <Rotulo>Slide {i + 1}</Rotulo>
                                <p className="text-[13px] leading-relaxed text-px-ink">{slide}</p>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {activeTab === "carrossel" && (
                        <>
                          <div><Rotulo>Título</Rotulo><p className="text-[13px] font-semibold text-px-ink">{transformResult.carrossel.titulo}</p></div>
                          <ul className="space-y-2">
                            {(transformResult.carrossel.slides ?? []).map((slide, i, arr) => (
                              <li key={i} className="rounded-px-card border border-px-line bg-white/50 px-3 py-2.5">
                                <Rotulo>{i === 0 ? "Capa" : i === arr.length - 1 ? "Chamada final" : `Slide ${i + 1}`}</Rotulo>
                                <p className="text-[13px] leading-relaxed text-px-ink">{slide}</p>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {activeTab === "faq" && (
                        <>
                          <div><Rotulo>Título e pergunta</Rotulo><p className="text-[13px] font-semibold text-px-ink">{transformResult.faq.titulo}</p></div>
                          <div><Rotulo>Resposta completa</Rotulo><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-px-ink">{transformResult.faq.resposta}</p></div>
                        </>
                      )}
                    </div>

                    <div className="border-t border-px-line px-5 py-4">
                      <PxButton fullWidth variant={tabSalva ? "secondary" : "primary"} leftIcon={tabSalva ? Check : undefined} loading={savingFormat} disabled={tabSalva || savingFormat} onClick={() => salvarFormato(activeTab)}>
                        {tabSalva ? "Salvo no Banco de Pautas" : "Salvar no Banco de Pautas"}
                      </PxButton>
                    </div>
                  </>
                ) : null}
              </Panel>
            )}
          </div>
        )}
      </div>

      <Toast message={toast} type={toastType} />

      <PxModal open={modalOpen} onClose={() => setModalOpen(false)} title="Importar do Banco de Pautas" className="max-w-lg">
        <div className="space-y-3">
          <PxInput aria-label="Buscar pauta" autoFocus value={pautaSearch} onChange={e => setPautaSearch(e.target.value)} placeholder="Buscar pauta" />
          <div className="max-h-[50vh] overflow-y-auto">
            {loadingPautas ? (
              <p role="status" className="py-10 text-center text-[13px] text-px-ink">Carregando pautas.</p>
            ) : pautas.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-px-ink">Nenhuma pauta encontrada.</p>
            ) : (
              <ul className="space-y-1">
                {pautas
                  .filter(pt => !pautaSearch || pt.titulo.toLowerCase().includes(pautaSearch.toLowerCase()))
                  .map(pauta => (
                    <li key={pauta.id}>
                      <button
                        type="button"
                        onClick={() => { setTema(pauta.titulo); setModalOpen(false) }}
                        className="w-full rounded-px-card px-4 py-3 text-left hover:bg-px-ink/[0.06]"
                      >
                        <span className="block text-[13px] font-medium text-px-ink">{pauta.titulo}</span>
                        <span className="mt-1 inline-block text-[12px] text-px-muted">{pauta.categoria}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </PxModal>
    </div>
  )
}
