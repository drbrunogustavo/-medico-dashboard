"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Sparkles, Trash2 } from "lucide-react"
import { Panel, PxButton, PxModal, Segmented, Field, PxInput, PxSelect, Tag, PageHeader } from "@/components/px"

const CATEGORIAS = ["Nutrologia", "Endocrinologia", "Longevidade", "Metabolismo", "Microbioma", "Hormônios", "Anti-aging", "Genômica"]
const PRIORIDADES = ["Alta", "Média", "Baixa"]
const ESTAGIOS = ["Ideia", "Em produção", "Revisão", "Pronto", "Publicado"]
const FORMATOS = [
  { label: "Imagens", path: "/imagens" }, { label: "Roteiro", path: "/roteiros" }, { label: "Carrossel", path: "/carrossel" },
  { label: "Reels", path: "/reels" }, { label: "Stories", path: "/stories" }, { label: "Legenda", path: "/legendas" },
]
const PRI_TONE: Record<string, "danger" | "warn" | "ok"> = { Alta: "danger", Média: "warn", Baixa: "ok" }

interface IdeiaConsultorio { titulo: string; formato: "reel" | "carrossel" | "post"; categoria: string; justificativa: string }
interface Pauta { id: string; titulo: string; categoria: string; prioridade: string; estagio: string; tags: string[]; nota: string; fonte?: string; criada_em: string }

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
const FORMATO_ROTULO: Record<string, string> = { reel: "Reel", carrossel: "Carrossel", post: "Post" }

export default function PautasPage() {
  const router = useRouter()
  const [pautas, setPautas] = useState<Pauta[]>([])
  const [loading, setLoading] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [filterCat, setFilterCat] = useState("")
  const [filterPri, setFilterPri] = useState("")
  const [filterEst, setFilterEst] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [ideias, setIdeias] = useState<IdeiaConsultorio[]>([])
  const [showIdeias, setShowIdeias] = useState(false)
  const [loadingIdeias, setLoadingIdeias] = useState(false)
  const [adicionando, setAdicionando] = useState<string | null>(null)
  const [newTitulo, setNewTitulo] = useState("")
  const [newCat, setNewCat] = useState("Nutrologia")
  const [newPri, setNewPri] = useState("Média")
  const [newNota, setNewNota] = useState("")
  const [newFonte, setNewFonte] = useState("")
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null)

  const fetchPautas = useCallback(async () => {
    setLoading(true); setErroCarga(false)
    try {
      const res = await fetch("/api/pautas")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setPautas(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("[pautas] erro ao carregar:", e)
      setErroCarga(true)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPautas() }, [fetchPautas])

  const termo = search.trim().toLowerCase()
  const filtered = pautas.filter(p =>
    (!filterCat || p.categoria === filterCat) && (!filterPri || p.prioridade === filterPri) &&
    (!filterEst || p.estagio === filterEst) && (!termo || p.titulo.toLowerCase().includes(termo)))
  const filtrando = !!(filterCat || filterPri || filterEst || termo)

  const addPauta = async () => {
    if (!newTitulo.trim()) return
    setSaving(true); setAviso(null)
    try {
      const res = await fetch("/api/pautas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: newTitulo, categoria: newCat, prioridade: newPri, estagio: "Ideia", tags: [], nota: newNota, fonte: newFonte }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setNewTitulo(""); setNewNota(""); setNewFonte(""); setShowForm(false)
      setAviso({ tipo: "ok", texto: "Pauta salva." })
      fetchPautas()
    } catch (e) {
      console.error("[pautas] erro ao salvar:", e)
      setAviso({ tipo: "erro", texto: "Não foi possível salvar a pauta." })
    } finally { setSaving(false) }
  }

  const removePauta = async (id: string) => {
    setAviso(null)
    try {
      const res = await fetch("/api/pautas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPautas(prev => prev.filter(p => p.id !== id))
      setAviso({ tipo: "ok", texto: "Pauta removida." })
    } catch (e) {
      console.error("[pautas] erro ao remover:", e)
      setAviso({ tipo: "erro", texto: "Não foi possível remover a pauta." })
    } finally { setConfirmando(null) }
  }

  const gerarIdeias = async () => {
    setLoadingIdeias(true); setAviso(null)
    try {
      const res = await fetch("/api/pautas/ideias-consultorio", { method: "POST" })
      const data = await res.json().catch(() => null) as { sugestoes?: IdeiaConsultorio[]; aviso?: string } | null
      if (!res.ok || !data) throw new Error(`HTTP ${res.status}`)
      if (data.aviso) { setAviso({ tipo: "erro", texto: data.aviso }); return }
      setIdeias(data.sugestoes ?? []); setShowIdeias(true)
      if (!data.sugestoes?.length) setAviso({ tipo: "erro", texto: "Ainda não há consultas suficientes para sugerir ideias." })
    } catch (e) {
      console.error("[pautas] gerarIdeias:", e)
      setAviso({ tipo: "erro", texto: "Não foi possível gerar as ideias do consultório." })
    } finally { setLoadingIdeias(false) }
  }

  const adicionarIdeia = async (ideia: IdeiaConsultorio) => {
    setAdicionando(ideia.titulo); setAviso(null)
    try {
      const res = await fetch("/api/pautas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: ideia.titulo, categoria: ideia.categoria, prioridade: "Média", estagio: "Ideia", tags: [], nota: `[${ideia.formato.toUpperCase()}] ${ideia.justificativa}` }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setIdeias(prev => prev.filter(i => i.titulo !== ideia.titulo))
      setAviso({ tipo: "ok", texto: "Pauta adicionada ao banco." })
      await fetchPautas()
    } catch (e) {
      console.error("[pautas] adicionarIdeia:", e)
      setAviso({ tipo: "erro", texto: "Não foi possível adicionar a ideia." })
    } finally { setAdicionando(null) }
  }

  const fmtData = (d: string) => { const dt = new Date(d); return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("pt-BR") }
  const alta = pautas.filter(p => p.prioridade === "Alta").length
  const producao = pautas.filter(p => p.estagio === "Em produção").length

  return (
    <div className="animate-fade-in">
      <PageHeader title="Banco de Pautas" caption="Repositório de ideias clínicas para virar conteúdo"
        actions={<>
          <PxButton variant="secondary" leftIcon={Sparkles} onClick={gerarIdeias} loading={loadingIdeias}>Ideias do consultório</PxButton>
          <PxButton leftIcon={Plus} onClick={() => setShowForm(true)}>Nova pauta</PxButton>
        </>} />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        {aviso && <p role={aviso.tipo === "erro" ? "alert" : "status"} className={`rounded-px-card px-4 py-3 text-[13px] ${aviso.tipo === "erro" ? "bg-px-danger-soft text-px-danger" : "bg-px-ok-soft text-px-ok"}`}>{aviso.texto}</p>}

        {showIdeias && ideias.length > 0 && (
          <Panel as="section" tone="strong" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-px-ink">Ideias do consultório</h2>
                <p className="text-[12.5px] text-px-muted">Sugeridas a partir dos resumos das suas últimas consultas no Copiloto.</p>
              </div>
              <PxButton variant="quiet" size="sm" onClick={() => setShowIdeias(false)}>Fechar</PxButton>
            </div>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {ideias.map(ideia => (
                <li key={ideia.titulo} className="flex flex-col gap-2 rounded-px-card bg-white/70 p-4">
                  <div className="flex flex-wrap gap-1.5"><Tag tone="ink">{FORMATO_ROTULO[ideia.formato] ?? ideia.formato}</Tag><Tag tone="neutral">{ideia.categoria}</Tag></div>
                  <p className="text-[14px] font-semibold leading-snug text-px-ink">{ideia.titulo}</p>
                  <p className="flex-1 text-[12.5px] leading-relaxed text-px-muted">{ideia.justificativa}</p>
                  <PxButton variant="secondary" size="sm" leftIcon={Plus} onClick={() => adicionarIdeia(ideia)} loading={adicionando === ideia.titulo} disabled={adicionando !== null}>Adicionar ao banco</PxButton>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel as="section" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_160px]">
            <PxInput type="search" aria-label="Buscar pauta" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pauta pelo título" />
            <PxSelect aria-label="Categoria" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">Todas as categorias</option>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </PxSelect>
            <PxSelect aria-label="Prioridade" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
              <option value="">Toda prioridade</option>{PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
            </PxSelect>
          </div>
          <Segmented label="Estágio" value={filterEst} onChange={setFilterEst} options={[{ value: "", label: "Todos" }, ...ESTAGIOS.map(e => ({ value: e, label: e }))]} />
          {!loading && !erroCarga && (
            <p className="text-[12.5px] text-px-muted">
              {filtrando ? `${filtered.length} de ${pautas.length} pautas` : `${pautas.length} pauta${pautas.length !== 1 ? "s" : ""}`}
              {pautas.length > 0 && `. ${alta} com prioridade alta, ${producao} em produção.`}
            </p>
          )}
        </Panel>

        {loading ? (
          <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando pautas</p>
        ) : erroCarga ? (
          <Panel className="py-14 text-center">
            <p role="alert" className="text-[15px] font-semibold text-px-ink">Não foi possível carregar as pautas</p>
            <PxButton className="mt-3" variant="secondary" onClick={fetchPautas}>Tentar de novo</PxButton>
          </Panel>
        ) : filtered.length === 0 ? (
          <Panel className="py-14 text-center">
            <p className="text-[15px] font-semibold text-px-ink">{pautas.length === 0 ? "O banco ainda está vazio" : "Nenhuma pauta com esses filtros"}</p>
            <p className="mt-1 text-[13px] text-px-muted">{pautas.length === 0 ? "Use Nova pauta para começar." : "Ajuste a busca ou limpe os filtros."}</p>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {filtered.map(p => (
              <li key={p.id}>
                <Panel as="article" className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag tone={PRI_TONE[p.prioridade] ?? "neutral"}>{p.prioridade}</Tag>
                    <Tag tone="neutral">{p.estagio}</Tag>
                    <Tag tone="neutral">{p.categoria}</Tag>
                    {p.fonte && <span className="text-[12px] text-px-muted">via {p.fonte}</span>}
                  </div>
                  <h2 className="break-words text-[15px] font-semibold leading-snug text-px-ink">{p.titulo}</h2>
                  {p.nota && <p className="break-words text-[13px] leading-relaxed text-px-ink/80">{p.nota}</p>}
                  {p.tags?.length > 0 && <p className="text-[12.5px] text-px-muted">{p.tags.map(t => "#" + t).join(" ")}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-px-ink/10 pt-3">
                    <span className="text-[12px] text-px-muted">{fmtData(p.criada_em) && `Criada em ${fmtData(p.criada_em)}`}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <PxSelect aria-label={`Criar conteúdo a partir de ${p.titulo}`} className="!h-9 w-auto text-[13px]" value=""
                        onChange={e => { if (e.target.value) router.push(e.target.value + "?tema=" + encodeURIComponent(p.titulo)) }}>
                        <option value="">Criar conteúdo</option>
                        {FORMATOS.map(f => <option key={f.path} value={f.path}>{f.label}</option>)}
                      </PxSelect>
                      {confirmando === p.id ? (
                        <>
                          <span className="text-[12.5px] text-px-ink">Remover esta pauta?</span>
                          <PxButton variant="danger" size="sm" onClick={() => removePauta(p.id)}>Remover</PxButton>
                          <PxButton variant="quiet" size="sm" onClick={() => setConfirmando(null)}>Cancelar</PxButton>
                        </>
                      ) : (
                        <PxButton variant="quiet" size="sm" leftIcon={Trash2} aria-label={`Remover pauta ${p.titulo}`} onClick={() => setConfirmando(p.id)} />
                      )}
                    </div>
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PxModal open={showForm} onClose={() => setShowForm(false)} title="Nova pauta" className="max-w-xl">
        <div className="space-y-3">
          <Field label="Título" htmlFor="np-titulo"><PxInput id="np-titulo" value={newTitulo} onChange={e => setNewTitulo(e.target.value)} placeholder="Título da pauta" /></Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Categoria" htmlFor="np-cat"><PxSelect id="np-cat" value={newCat} onChange={e => setNewCat(e.target.value)}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</PxSelect></Field>
            <Field label="Prioridade" htmlFor="np-pri"><PxSelect id="np-pri" value={newPri} onChange={e => setNewPri(e.target.value)}>{PRIORIDADES.map(p => <option key={p}>{p}</option>)}</PxSelect></Field>
            <Field label="Fonte" htmlFor="np-fonte"><PxInput id="np-fonte" value={newFonte} onChange={e => setNewFonte(e.target.value)} placeholder="PubMed" /></Field>
          </div>
          <Field label="Notas" htmlFor="np-nota"><textarea id="np-nota" value={newNota} onChange={e => setNewNota(e.target.value)} rows={3} placeholder="Referências, ideias de formato" className={areaCls} /></Field>
          <div className="flex justify-end gap-2">
            <PxButton variant="quiet" onClick={() => setShowForm(false)}>Cancelar</PxButton>
            <PxButton onClick={addPauta} loading={saving} disabled={!newTitulo.trim()}>Salvar pauta</PxButton>
          </div>
        </div>
      </PxModal>
    </div>
  )
}
