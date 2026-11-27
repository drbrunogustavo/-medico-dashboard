"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { CalendarDays, Sparkles, ChevronLeft, ChevronRight, Check, Download, Printer } from "lucide-react"
import { Panel, PxButton, PxModal, Segmented, Field, PxSelect, Tag, PageHeader, CopyButton } from "@/components/px"

interface Post {
  id?: string; dia: number; dia_semana: string; formato: string; pilar: string; tema: string
  gancho: string; legenda: string; cta: string; roteiro: string; stories_sequencia: string[]; hashtags: string[]; publicado?: boolean
}
interface CalendarioResult { mes: string; total_posts: number; posts: Post[]; distribuicao_pilares: Record<string, number>; dica_estrategica: string }
interface MixPct { reel: number; carrossel: number; stories: number; foto: number }

const ESPECIALIDADES = ["Endocrinologia e Nutrologia", "Cardiologia", "Dermatologia", "Ginecologia", "Ortopedia", "Pediatria", "Psiquiatria", "Neurologia", "Oncologia", "Medicina Geral"]
const TEMAS_ESP: Record<string, string[]> = {
  "Endocrinologia e Nutrologia": ["Emagrecimento saudável", "Resistência à insulina", "Tireoide e hormônios", "Longevidade e aging", "Suplementação", "Estresse e cortisol", "Diabetes tipo 2", "Hormônios e qualidade de vida"],
  "Cardiologia": ["Hipertensão arterial", "Colesterol alto", "Coração saudável", "Prevenção de infarto", "Atividade física e coração", "Alimentação cardioprotetora", "Arritmia", "Insuficiência cardíaca"],
  "Dermatologia": ["Cuidados com a pele", "Acne: mitos e verdades", "Envelhecimento cutâneo", "Protetor solar", "Queda de cabelo", "Manchas solares", "Psoríase", "Dermatite atópica"],
  "Ginecologia": ["Saúde da mulher", "Menopausa e TRH", "SOP", "Endometriose", "Rastreio de câncer de mama", "HPV e prevenção", "Contracepção", "Gravidez saudável"],
  "Ortopedia": ["Dor nas costas", "Artrose e qualidade de vida", "Osteoporose", "Lesões esportivas", "Postura no trabalho", "Sarcopenia", "Dor no joelho", "Exercício e articulações"],
  "Pediatria": ["Saúde infantil", "Vacinação infantil", "Alimentação da criança", "Febre: quando ir ao médico", "Sono do bebê", "TDAH na escola", "Amamentação", "Desenvolvimento infantil"],
  "Psiquiatria": ["Saúde mental", "Ansiedade no dia a dia", "Burnout profissional", "Qualidade do sono", "Depressão: sinais de alerta", "TDAH no adulto", "Relacionamentos e saúde mental", "Mindfulness"],
  "Neurologia": ["Enxaqueca", "AVC: sinais de alerta", "Alzheimer", "Parkinson", "Epilepsia", "Saúde do cérebro", "Sono e neurologia", "Prevenção de demência"],
  "Oncologia": ["Prevenção do câncer", "Rastreio oncológico", "Imunoterapia", "Qualidade de vida no câncer", "Alimentação e câncer", "Diagnóstico precoce", "Câncer de pele", "Suporte ao paciente oncológico"],
  "Medicina Geral": ["Prevenção de doenças", "Check-up anual", "Saúde e bem-estar", "Atividade física", "Sono saudável", "Alimentação equilibrada", "Saúde mental", "Vacinação adulto"],
}
const TEMAS_FALLBACK = ["Prevenção de doenças", "Check-up anual", "Saúde e bem-estar", "Atividade física", "Sono saudável", "Alimentação equilibrada"]
const FORMATO_HREF: Record<string, string> = { Reel: "/reels", Carrossel: "/carrossel", Stories: "/stories", Feed: "/legendas", Foto: "/legendas" }
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MIX: { key: keyof MixPct; label: string }[] = [{ key: "reel", label: "Reels" }, { key: "carrossel", label: "Carrossel" }, { key: "stories", label: "Stories" }, { key: "foto", label: "Foto e feed" }]

function DayModal({ post, onClose, onTogglePublicado, falha }: { post: Post; onClose: () => void; onTogglePublicado: (id: string, publicado: boolean) => void; falha: boolean }) {
  const [tab, setTab] = useState<"legenda" | "roteiro" | "stories" | "hashtags">("legenda")
  const tags = (post.hashtags ?? []).map(h => "#" + h.replace(/^#/, "")).join(" ")
  const box = "whitespace-pre-wrap rounded-px-card bg-px-ink/[0.04] p-3 text-[13.5px] leading-relaxed text-px-ink"
  return (
    <PxModal open onClose={onClose} title={post.tema} className="max-w-lg">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag tone="ink">{post.formato}</Tag><Tag tone="neutral">{post.pilar}</Tag>
          <span className="text-[12.5px] text-px-muted">Dia {post.dia}, {post.dia_semana}</span>
        </div>
        <div className="rounded-px-card bg-px-ink/[0.05] p-3">
          <p className="text-[12.5px] font-medium text-px-muted">Gancho</p>
          <p className="mt-0.5 text-[14px] italic leading-relaxed text-px-ink">&ldquo;{post.gancho}&rdquo;</p>
        </div>
        <Segmented label="Parte do conteúdo" value={tab} onChange={setTab}
          options={[{ value: "legenda", label: "Legenda" }, { value: "roteiro", label: "Roteiro" }, { value: "stories", label: "Stories" }, { value: "hashtags", label: "Hashtags" }]} />
        {tab === "legenda" && (<div className="space-y-2"><p className={box}>{post.legenda}</p><p className="text-[13px] text-px-ink/80"><span className="font-medium">CTA:</span> {post.cta}</p><CopyButton text={`${post.legenda}\n\n${post.cta}\n\n${tags}`} /></div>)}
        {tab === "roteiro" && (<div className="space-y-2"><p className={box}>{post.roteiro}</p><CopyButton text={post.roteiro ?? ""} /></div>)}
        {tab === "stories" && (
          <div className="space-y-2">
            {(post.stories_sequencia ?? []).length === 0 ? <p className="text-[13px] text-px-muted">Este post não tem sequência de stories.</p>
              : <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-px-ink">{post.stories_sequencia.map((s, i) => <li key={i}>{s}</li>)}</ol>}
            <CopyButton text={(post.stories_sequencia ?? []).join("\n")} />
          </div>
        )}
        {tab === "hashtags" && (<div className="space-y-2"><p className="text-[13.5px] leading-relaxed text-px-ink/85">{tags || "Sem hashtags."}</p><CopyButton text={tags} /></div>)}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-px-ink/10 pt-3">
          <Link href={`${FORMATO_HREF[post.formato] ?? "/copiloto-conteudo"}?tema=${encodeURIComponent(post.tema)}`}
            className="inline-flex h-10 items-center gap-2 rounded-px-ctl bg-px-ink px-4 text-[13.5px] font-medium text-white hover:bg-px-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-px-ink/40">
            <Sparkles className="h-4 w-4" aria-hidden="true" />Gerar {post.formato} completo
          </Link>
          {post.id && <PxButton variant={post.publicado ? "primary" : "secondary"} leftIcon={Check} onClick={() => onTogglePublicado(post.id!, !post.publicado)}>{post.publicado ? "Publicado" : "Marcar como publicado"}</PxButton>}
        </div>
        {falha && <p role="alert" className="text-[13px] text-px-danger">Não foi possível atualizar o status. A alteração foi desfeita.</p>}
      </div>
    </PxModal>
  )
}

export default function CalendarioPage() {
  const hoje = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [especialidade, setEspecialidade] = useState(ESPECIALIDADES[0])
  const [frequencia, setFrequencia] = useState(5)
  const temasSugeridos = useMemo(() => TEMAS_ESP[especialidade] ?? TEMAS_FALLBACK, [especialidade])
  const [temasSel, setTemasSel] = useState<string[]>([])
  const [mixPct, setMixPct] = useState<MixPct>({ reel: 40, carrossel: 30, stories: 20, foto: 10 })
  const [resultado, setResultado] = useState<CalendarioResult | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [aviso, setAviso] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [falhaStatus, setFalhaStatus] = useState(false)
  const [view, setView] = useState<"grid" | "lista" | "semana">("grid")
  const [semana, setSemana] = useState(0)
  const reqRef = useRef(0)

  const totalMix = mixPct.reel + mixPct.carrossel + mixPct.stories + mixPct.foto
  const anos = [hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1]
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const primeiroDia = new Date(ano, mes - 1, 1).getDay()
  const nSemanas = Math.ceil((primeiroDia + diasNoMes) / 7)
  const selected = selectedId === null ? null : posts.find(p => p.dia === selectedId) ?? null

  useEffect(() => {
    const id = ++reqRef.current
    setSavedLoading(true); setPosts([]); setResultado(null); setSemana(0); setSelectedId(null)
    fetch(`/api/calendario-posts?mes=${mes}&ano=${ano}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (id === reqRef.current && Array.isArray(data)) setPosts(data) })
      .catch(() => {})
      .finally(() => { if (id === reqRef.current) setSavedLoading(false) })
  }, [mes, ano])

  async function gerar() {
    const id = ++reqRef.current
    setLoading(true); setErro(""); setAviso(""); setResultado(null); setPosts([])
    try {
      const resp = await fetch("/api/calendario", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, ano, especialidade, pilares: ["Educativo", "Autoridade", "Vendas", "Relacionamento"], frequencia, temas: temasSel, mix: mixPct }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json() as CalendarioResult
      if (!Array.isArray(data.posts)) throw new Error("sem posts")
      if (id !== reqRef.current) return
      setResultado(data); setPosts(data.posts)
      try {
        const sv = await fetch("/api/calendario-posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mes, ano, posts: data.posts }) })
        if (!sv.ok) throw new Error(`HTTP ${sv.status}`)
        const saved = await sv.json().catch(() => null)
        if (saved?.count) {
          const again = await fetch(`/api/calendario-posts?mes=${mes}&ano=${ano}`)
          const withIds = again.ok ? await again.json() : null
          if (id === reqRef.current && Array.isArray(withIds)) setPosts(withIds)
        }
      } catch (e) {
        console.error("[calendario] erro ao salvar:", e)
        setAviso("O calendário foi gerado, mas não foi salvo. Gere novamente para guardar.")
      }
    } catch (e) {
      console.error("[calendario] erro ao gerar:", e)
      setErro("Não foi possível gerar o calendário. Tente novamente em instantes.")
    } finally { if (id === reqRef.current) setLoading(false) }
  }

  const togglePublicado = async (id: string, publicado: boolean) => {
    setFalhaStatus(false)
    const set = (v: boolean) => setPosts(prev => prev.map(p => p.id === id ? { ...p, publicado: v } : p))
    set(publicado)
    try {
      const r = await fetch("/api/calendario-posts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, publicado }) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
    } catch (e) { console.error("[calendario] erro ao atualizar status:", e); set(!publicado); setFalhaStatus(true) }
  }

  function exportCSV() {
    if (posts.length === 0) return
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const rows = posts.map(p => [p.dia, p.dia_semana, p.formato, p.pilar, q(p.tema), q(p.gancho), q(p.legenda), q(p.cta), q((p.hashtags ?? []).map(h => "#" + h.replace(/^#/, "")).join(" "))].join(","))
    const blob = new Blob(["﻿" + ["Dia,Dia Semana,Formato,Pilar,Tema,Gancho,Legenda,CTA,Hashtags", ...rows].join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `calendario-${MESES[mes - 1]}-${ano}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const porDia = new Map<number, Post>(); posts.forEach(p => porDia.set(p.dia, p))
  const celulas: (number | null)[] = [...Array(primeiroDia).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)]
  while (celulas.length % 7) celulas.push(null)
  const semanaAtual = celulas.slice(semana * 7, semana * 7 + 7)

  function renderCelula(dia: number | null, compacto: boolean, key: number) {
    if (!dia) return <div key={key} className="min-h-[64px] bg-px-ink/[0.03]" />
    const p = porDia.get(dia)
    return (
      <div key={key} className={`${compacto ? "min-h-[64px]" : "min-h-[110px]"} p-1.5`}>
        <p className="text-[12px] font-medium text-px-muted">{dia}</p>
        {p && (
          <button type="button" onClick={() => { setSelectedId(p.dia); setFalhaStatus(false) }} aria-label={`Dia ${dia}: ${p.formato}, ${p.tema}${p.publicado ? ", publicado" : ""}`}
            className="mt-0.5 w-full rounded-px-ctl bg-px-ink/[0.06] p-1 text-left hover:bg-px-ink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-px-ink">{p.formato}{p.publicado && <Check className="h-3 w-3" aria-hidden="true" />}</span>
            <span className="hidden text-[11px] leading-tight text-px-ink/75 line-clamp-2 md:block">{p.tema}</span>
          </button>
        )}
      </div>
    )
  }

  const temPosts = posts.length > 0

  return (
    <div className="animate-fade-in">
      <PageHeader title="Calendário Editorial" caption="Planeje o mês de conteúdo e acompanhe o que já foi publicado"
        actions={temPosts ? <>
          <PxButton variant="secondary" leftIcon={Printer} onClick={() => window.print()}>Imprimir</PxButton>
          <PxButton variant="secondary" leftIcon={Download} onClick={exportCSV}>CSV</PxButton>
        </> : undefined} />
      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel as="section" className="space-y-4 print:hidden">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <Field label="Mês" htmlFor="cal-mes"><PxSelect id="cal-mes" value={mes} onChange={e => setMes(Number(e.target.value))}>{MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</PxSelect></Field>
              <Field label="Ano" htmlFor="cal-ano"><PxSelect id="cal-ano" value={ano} onChange={e => setAno(Number(e.target.value))}>{anos.map(y => <option key={y} value={y}>{y}</option>)}</PxSelect></Field>
            </div>
            <Field label="Especialidade" htmlFor="cal-esp"><PxSelect id="cal-esp" value={especialidade} onChange={e => { setEspecialidade(e.target.value); setTemasSel([]) }}>{ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}</PxSelect></Field>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Frequência</p>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented label="Frequência semanal" value={String(frequencia)} onChange={v => setFrequencia(Number(v))} options={[3, 5, 7].map(f => ({ value: String(f), label: `${f}x por semana` }))} />
              <span className="text-[12.5px] text-px-muted">cerca de {Math.round(frequencia * 4.3)} posts no mês</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-px-ink">Mix de conteúdo</p>
              <p className={`text-[12.5px] ${totalMix !== 100 ? "font-semibold text-px-danger" : "text-px-muted"}`}>Total: {totalMix}%{totalMix !== 100 ? ", ajuste para 100%" : ""}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {MIX.map(({ key, label }) => (
                <div key={key}>
                  <label htmlFor={`mix-${key}`} className="flex justify-between text-[13px] text-px-ink"><span>{label}</span><span className="text-px-muted">{mixPct[key]}%</span></label>
                  <input id={`mix-${key}`} type="range" min={0} max={70} value={mixPct[key]} onChange={e => setMixPct(m => ({ ...m, [key]: Number(e.target.value) }))} className="w-full accent-black" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-px-ink">Temas prioritários <span className="font-normal text-px-muted">(opcional, até 4)</span></p>
            <div role="group" aria-label="Temas prioritários" className="flex flex-wrap gap-2">
              {temasSugeridos.map(t => {
                const ativo = temasSel.includes(t)
                const cheio = !ativo && temasSel.length >= 4
                return (
                  <button key={t} type="button" aria-pressed={ativo} disabled={cheio} onClick={() => setTemasSel(prev => ativo ? prev.filter(x => x !== t) : [...prev, t])}
                    className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${ativo ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>{t}</button>
                )
              })}
            </div>
          </div>
          <PxButton leftIcon={Sparkles} onClick={gerar} loading={loading} disabled={totalMix === 0}>{loading ? "Gerando calendário" : `Gerar ${Math.round(frequencia * 4.3)} posts para ${MESES[mes - 1]}`}</PxButton>
        </Panel>

        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}
        {aviso && <p role="status" className="rounded-px-card bg-px-warn-soft px-4 py-3 text-[13px] text-px-warn">{aviso}</p>}
        {savedLoading && <p role="status" className="text-[13px] text-px-muted">Carregando o calendário salvo</p>}
        {loading && <p role="status" className="py-16 text-center text-[14px] font-medium text-px-ink">Montando o calendário. Pode levar até um minuto.</p>}

        {!loading && !savedLoading && !temPosts && !erro && (
          <Panel className="py-12 text-center">
            <p className="text-[15px] font-semibold text-px-ink">Nenhum calendário para {MESES[mes - 1]} de {ano}</p>
            <p className="mt-1 text-[13px] text-px-muted">Defina o mix e gere o mês.</p>
          </Panel>
        )}

        {!loading && temPosts && (
          <>
            <Panel as="section" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-px-ink"><CalendarDays className="h-4 w-4" aria-hidden="true" />{resultado?.mes ?? `${MESES[mes - 1]} de ${ano}`}<span className="text-[12.5px] font-normal text-px-muted">{posts.length} posts, {posts.filter(p => p.publicado).length} publicados</span></p>
                <Segmented label="Visualização" value={view} onChange={setView} options={[{ value: "grid", label: "Grade" }, { value: "semana", label: "Semana" }, { value: "lista", label: "Lista" }]} />
              </div>
              {resultado && Object.keys(resultado.distribuicao_pilares ?? {}).length > 0 && (
                <p className="text-[13px] text-px-ink/80">Pilares: {Object.entries(resultado.distribuicao_pilares).map(([p, pct]) => `${p} ${pct}%`).join(", ")}</p>
              )}
              {resultado?.dica_estrategica && <p className="rounded-px-card bg-px-ink/[0.05] px-3 py-2 text-[13px] text-px-ink"><span className="font-medium">Sugestão da IA:</span> {resultado.dica_estrategica}</p>}
            </Panel>

            {view === "grid" && (
              <Panel as="section" className="overflow-hidden !p-0">
                <div className="grid grid-cols-7 border-b border-px-ink/10">{DIAS.map(d => <div key={d} className="py-2 text-center text-[12px] font-medium text-px-muted">{d}</div>)}</div>
                <div className="grid grid-cols-7 [&>*]:border-b [&>*]:border-r [&>*]:border-px-ink/10">{celulas.map((d, i) => renderCelula(d, true, i))}</div>
              </Panel>
            )}

            {view === "semana" && (
              <Panel as="section" className="space-y-3">
                <div className="flex items-center justify-between">
                  <PxButton variant="secondary" size="sm" leftIcon={ChevronLeft} aria-label="Semana anterior" disabled={semana === 0} onClick={() => setSemana(s => Math.max(0, s - 1))} />
                  <p className="text-[13.5px] font-semibold text-px-ink">Semana {semana + 1} de {nSemanas}</p>
                  <PxButton variant="secondary" size="sm" leftIcon={ChevronRight} aria-label="Próxima semana" disabled={semana >= nSemanas - 1} onClick={() => setSemana(s => Math.min(nSemanas - 1, s + 1))} />
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DIAS.map(d => <div key={d} className="text-center text-[12px] font-medium text-px-muted">{d}</div>)}
                  {semanaAtual.map((d, i) => <div key={i} className="rounded-px-card border border-px-ink/10">{renderCelula(d, false, i)}</div>)}
                </div>
              </Panel>
            )}

            {view === "lista" && (
              <ul className="space-y-2">
                {[...posts].sort((a, b) => a.dia - b.dia).map(p => (
                  <li key={p.dia}>
                    <button type="button" onClick={() => { setSelectedId(p.dia); setFalhaStatus(false) }} className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 rounded-px-card">
                      <Panel as="article" className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-px-ctl bg-px-ink/[0.06]"><span className="text-[11px] text-px-muted">{(p.dia_semana ?? "").slice(0, 3)}</span><span className="text-[15px] font-semibold leading-none text-px-ink">{p.dia}</span></span>
                        <span className="min-w-0 flex-1 space-y-1">
                          <span className="flex flex-wrap items-center gap-1.5"><Tag tone="ink">{p.formato}</Tag><Tag tone="neutral">{p.pilar}</Tag>{p.publicado && <Tag tone="ok">Publicado</Tag>}</span>
                          <span className="block text-[14px] font-medium text-px-ink">{p.tema}</span>
                          <span className="block text-[12.5px] text-px-muted">{p.gancho}</span>
                        </span>
                      </Panel>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {selected && <DayModal post={selected} onClose={() => setSelectedId(null)} onTogglePublicado={togglePublicado} falha={falhaStatus} />}
    </div>
  )
}
