"use client"

import { useRef, useState } from "react"
import { Panel, PxButton, PxModal, Segmented, Field, PxInput, PxSelect, Tag, PageHeader, CopyButton } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Roteiro { titulo: string; gancho: string; estrutura: string; cta: string; promptImagem: string }
interface Beneficio { titulo: string; descricao: string }
interface FaqItem { pergunta: string; resposta: string }
interface LandingPage {
  headline: string; subtitulo: string; beneficios: Beneficio[]; provaSocial: string
  ctaTexto: string; ctaUrgencia: string; faq: FaqItem[]; ctaSecundario: string
}
interface Anuncio { variacao: string; headline: string; texto: string; cta: string }
interface AnunciosFormatos { feed: Anuncio[]; stories: Anuncio[]; reels: Anuncio[] }
interface StoryDia { dia: number; tipo: string; texto: string; sugestaoVisual: string; sticker: string }
interface FollowUp { dia: number; mensagem: string }
interface WhatsApp { abertura: string; followUps: FollowUp[]; fechamento: string; respostaObjecao: string }
interface Campanha { roteiros: Roteiro[]; landingPage: LandingPage; anuncios: AnunciosFormatos; stories: StoryDia[]; whatsapp: WhatsApp }

type TabKey = "roteiros" | "landing" | "anuncios" | "stories" | "whatsapp"

// ─── Constantes ───────────────────────────────────────────────────────────────

const SAZONAIS = [
  { label: "Verão", sub: "Emagrecimento e corpo", tema: "Campanha de Verão: Emagrecimento e Definição Corporal", publico: "Adultos que querem emagrecer antes do verão", objetivo: "Atrair Pacientes", tom: "Urgente" },
  { label: "Dia da Mulher", sub: "Saúde feminina", tema: "Dia Internacional da Mulher: Saúde Feminina em Foco", publico: "Mulheres 30-55 anos interessadas em saúde preventiva", objetivo: "Awareness", tom: "Empático" },
  { label: "Inverno", sub: "Imunidade e energia", tema: "Campanha de Inverno: Imunidade e Energia", publico: "Adultos que sofrem com gripes e baixa energia no inverno", objetivo: "Atrair Pacientes", tom: "Educativo" },
  { label: "Climatério", sub: "Menopausa e hormônios", tema: "Climatério e Menopausa: Viva Melhor Essa Fase", publico: "Mulheres 45-60 anos em fase de menopausa", objetivo: "Atrair Pacientes", tom: "Empático" },
  { label: "Ano Novo", sub: "Mudança de hábitos", tema: "Ano Novo, Saúde Nova: Mudança de Hábitos com Acompanhamento", publico: "Adultos 30-50 anos com metas de saúde para o ano", objetivo: "Lançar Protocolo", tom: "Autoridade" },
  { label: "Semana da Saúde", sub: "Prevenção", tema: "Semana da Saúde: Prevenção É o Melhor Tratamento", publico: "Adultos de todas as idades interessados em prevenção", objetivo: "Educar", tom: "Educativo" },
  { label: "Volta às Aulas", sub: "Saúde infantil e familiar", tema: "Volta às Aulas: Cuide da Saúde da Família", publico: "Pais de crianças e adolescentes em idade escolar", objetivo: "Atrair Pacientes", tom: "Empático" },
  { label: "Janeiro Branco", sub: "Saúde mental", tema: "Janeiro Branco: Cuidar da Mente É Cuidar da Vida", publico: "Adultos interessados em saúde mental e bem-estar emocional", objetivo: "Awareness", tom: "Empático" },
]

const OBJETIVOS = ["Atrair Pacientes", "Educar", "Vender Consulta", "Lançar Protocolo", "Awareness"]
const DURACOES = ["7 dias", "15 dias", "30 dias"]
const TONS = ["Autoridade", "Empático", "Urgente", "Educativo"]

const TABS: { value: TabKey; label: string }[] = [
  { value: "roteiros", label: "Roteiros" },
  { value: "landing", label: "Landing page" },
  { value: "anuncios", label: "Anúncios" },
  { value: "stories", label: "Stories" },
  { value: "whatsapp", label: "WhatsApp" },
]

const ERRO_PADRAO = "Não foi possível gerar a campanha. Seus dados continuam no formulário, tente de novo."

// ─── Funções auxiliares ───────────────────────────────────────────────────────

function ehLista(x: unknown): x is unknown[] { return Array.isArray(x) && x.length > 0 }

/** Só aceita a resposta da IA se todas as partes vieram. Nada é substituído por conteúdo de exemplo. */
function montarCampanha(d1: any, d2: any): Campanha | null {
  if (!d1 || !d2) return null
  const ok =
    ehLista(d1.roteiros) && d1.landingPage && typeof d1.landingPage === "object" &&
    d2.anuncios && ehLista(d2.anuncios.feed) && ehLista(d2.anuncios.stories) && ehLista(d2.anuncios.reels) &&
    ehLista(d2.stories) && d2.whatsapp && typeof d2.whatsapp === "object"
  if (!ok) return null
  return {
    roteiros: d1.roteiros,
    landingPage: { ...d1.landingPage, beneficios: d1.landingPage.beneficios ?? [], faq: d1.landingPage.faq ?? [] },
    anuncios: d2.anuncios,
    stories: d2.stories,
    whatsapp: { ...d2.whatsapp, followUps: Array.isArray(d2.whatsapp.followUps) ? d2.whatsapp.followUps : [] },
  }
}

function roteiroTexto(r: Roteiro): string {
  return `${r.titulo}\n\nGancho: ${r.gancho}\n\nEstrutura:\n${r.estrutura}\n\nCTA: ${r.cta}\n\nPrompt de imagem:\n${r.promptImagem}`
}

function buildTabText(tab: TabKey, c: Campanha): string {
  const sep = "\n\n" + "-".repeat(40) + "\n\n"
  switch (tab) {
    case "roteiros":
      return c.roteiros.map((r, i) => `ROTEIRO ${i + 1}: ${roteiroTexto(r)}`).join(sep)
    case "landing": {
      const lp = c.landingPage
      return [
        `HEADLINE: ${lp.headline}`,
        `SUBTÍTULO: ${lp.subtitulo}`,
        `BENEFÍCIOS:\n${lp.beneficios.map(b => `- ${b.titulo}: ${b.descricao}`).join("\n")}`,
        `PROVA SOCIAL:\n${lp.provaSocial}`,
        `CTA PRINCIPAL: ${lp.ctaTexto}\nURGÊNCIA: ${lp.ctaUrgencia}`,
        `FAQ:\n${lp.faq.map(f => `P: ${f.pergunta}\nR: ${f.resposta}`).join("\n\n")}`,
        `CTA SECUNDÁRIO: ${lp.ctaSecundario}`,
      ].join(sep)
    }
    case "anuncios":
      return [
        { label: "FEED", items: c.anuncios.feed },
        { label: "STORIES", items: c.anuncios.stories },
        { label: "REELS", items: c.anuncios.reels },
      ].map(fmt => `ANÚNCIOS, ${fmt.label}:\n\n${fmt.items.map(a => `[${a.variacao}]\nHeadline: ${a.headline}\nTexto: ${a.texto}\nCTA: ${a.cta}`).join("\n\n")}`).join(sep)
    case "stories":
      return c.stories.map(s => `DIA ${s.dia}, ${s.tipo}\n${s.texto}\nVisual: ${s.sugestaoVisual}\nSticker: ${s.sticker}`).join("\n\n")
    case "whatsapp": {
      const wa = c.whatsapp
      return [
        `ABERTURA:\n${wa.abertura}`,
        `FOLLOW-UPS:\n${wa.followUps.map(f => `Dia ${f.dia}: ${f.mensagem}`).join("\n\n")}`,
        `FECHAMENTO:\n${wa.fechamento}`,
        `RESPOSTA A OBJEÇÃO:\n${wa.respostaObjecao}`,
      ].join(sep)
    }
  }
}

const VARIACAO_TOM: Record<string, "neutral" | "accent" | "warn"> = { Conservador: "neutral", Equilibrado: "accent", Agressivo: "warn" }
const TEXTAREA = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

// ─── Página ───────────────────────────────────────────────────────────────────

export default function OfertasPage() {
  const [stage, setStage] = useState<"briefing" | "resultado">("briefing")
  const [tema, setTema] = useState("")
  const [publico, setPublico] = useState("")
  const [objetivo, setObjetivo] = useState("Atrair Pacientes")
  const [duracao, setDuracao] = useState("15 dias")
  const [tom, setTom] = useState("Autoridade")
  const [campanha, setCampanha] = useState<Campanha | null>(null)
  const [loading, setLoading] = useState(false)
  const [progresso, setProgresso] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("roteiros")
  const [expanded, setExpanded] = useState<number[]>([0])
  const [aviso, setAviso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [landingHtml, setLandingHtml] = useState<string | null>(null)
  const [originalHtml, setOriginalHtml] = useState<string | null>(null)
  const [editedHtml, setEditedHtml] = useState("")
  const [loadingLanding, setLoadingLanding] = useState(false)
  const [erroLanding, setErroLanding] = useState<string | null>(null)
  const [showHtmlEditor, setShowHtmlEditor] = useState(false)
  const [telaCheia, setTelaCheia] = useState(false)
  const landingGenRef = useRef(0)

  const [showImport, setShowImport] = useState(false)
  const [pautasList, setPautasList] = useState<{ id: number | string; titulo: string }[]>([])
  const [loadingPautas, setLoadingPautas] = useState(false)
  const [erroPautas, setErroPautas] = useState<string | null>(null)

  const avisoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  function mostrarAviso(msg: string) {
    if (avisoRef.current) clearTimeout(avisoRef.current)
    setAviso(msg)
    avisoRef.current = setTimeout(() => setAviso(null), 4000)
  }

  async function openImport() {
    setShowImport(true)
    setLoadingPautas(true)
    setErroPautas(null)
    try {
      const r = await fetch("/api/pautas")
      const data = await r.json().catch(() => null)
      if (!r.ok || !Array.isArray(data)) throw new Error("falha")
      setPautasList(data)
    } catch {
      setErroPautas("Não foi possível carregar o Banco de Pautas.")
    } finally {
      setLoadingPautas(false)
    }
  }

  async function chamar(parte: 1 | 2, payload: Record<string, string>) {
    const r = await fetch("/api/ofertas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, parte }) })
    const data = await r.json().catch(() => null)
    if (!r.ok || !data) throw new Error(typeof data?.error === "string" ? data.error : ERRO_PADRAO)
    return data
  }

  async function gerar() {
    if (!tema.trim() || !publico.trim()) {
      setErro("Preencha o tema e o público-alvo.")
      return
    }
    setErro(null)
    setLoading(true)
    const payload = { tema, publico, objetivo, duracao, tom }
    try {
      setProgresso("Gerando roteiros e landing page")
      const d1 = await chamar(1, payload)
      setProgresso("Gerando anúncios, Stories e WhatsApp")
      const d2 = await chamar(2, payload)
      const camp = montarCampanha(d1, d2)
      if (!camp) throw new Error("A IA devolveu um resultado incompleto. Tente de novo.")
      setCampanha(camp)
      setStage("resultado")
      setActiveTab("roteiros")
      setExpanded([0])
      setShowHtmlEditor(false)
      landingGenRef.current += 1
      gerarLandingHtml(camp.landingPage, landingGenRef.current)
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : ERRO_PADRAO)
    } finally {
      setLoading(false)
      setProgresso("")
    }
  }

  async function gerarLandingHtml(lp: LandingPage, genId: number) {
    setLoadingLanding(true)
    setErroLanding(null)
    setLandingHtml(null)
    setOriginalHtml(null)
    setEditedHtml("")
    try {
      const r = await fetch("/api/ofertas/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, publico, objetivo, tom, landingPage: lp }),
      })
      const data = await r.json().catch(() => null)
      if (landingGenRef.current !== genId) return
      if (!r.ok || !data || typeof data.html !== "string" || !data.html.trim()) throw new Error("falha")
      setLandingHtml(data.html)
      setOriginalHtml(data.html)
      setEditedHtml(data.html)
    } catch {
      if (landingGenRef.current === genId) setErroLanding("Não foi possível montar a página em HTML. Os textos da landing continuam disponíveis em Copiar aba.")
    } finally {
      if (landingGenRef.current === genId) setLoadingLanding(false)
    }
  }

  async function salvarNoPautas() {
    if (!campanha || salvando) return
    setSalvando(true)
    let saved = 0
    for (const r of campanha.roteiros) {
      try {
        const res = await fetch("/api/pautas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: r.titulo, categoria: "Oferta" }) })
        if (res.ok) saved++
      } catch { /* conta como não salvo */ }
    }
    setSalvando(false)
    const total = campanha.roteiros.length
    mostrarAviso(saved === total
      ? `${saved} ${saved === 1 ? "roteiro salvo" : "roteiros salvos"} no Banco de Pautas.`
      : `${saved} de ${total} roteiros salvos no Banco de Pautas. Os outros falharam.`)
  }

  async function copiarAba() {
    if (!campanha) return
    const text = activeTab === "landing" && landingHtml ? landingHtml : buildTabText(activeTab, campanha)
    try {
      await navigator.clipboard.writeText(text)
      mostrarAviso(activeTab === "landing" && landingHtml ? "HTML da landing page copiado." : "Aba copiada.")
    } catch {
      mostrarAviso("Não foi possível copiar.")
    }
  }

  function exportarHtml() {
    if (!landingHtml) return
    const blob = new Blob([landingHtml], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const slug = tema.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30).replace(/-$/, "")
    a.href = url
    a.download = `landing-${slug}-${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    mostrarAviso("Landing page exportada.")
  }

  function novaCampanha() {
    landingGenRef.current += 1
    setStage("briefing")
    setCampanha(null)
    setLandingHtml(null)
    setOriginalHtml(null)
    setEditedHtml("")
    setLoadingLanding(false)
    setErroLanding(null)
    setShowHtmlEditor(false)
    setErro(null)
  }

  // ── Abas ────────────────────────────────────────────────────────────────────

  function renderRoteiros(c: Campanha) {
    return (
      <div className="space-y-3">
        {c.roteiros.map((r, i) => {
          const open = expanded.includes(i)
          return (
            <Panel as="article" key={i} className="!p-0">
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded(prev => open ? prev.filter(x => x !== i) : [...prev, i])}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-[14.5px] font-semibold text-px-ink">{r.titulo}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-px-muted">{r.gancho}</span>
                </button>
                <CopyButton text={roteiroTexto(r)} />
              </div>
              {open && (
                <div className="space-y-4 border-t border-px-line px-5 pb-5">
                  {[
                    { label: "Gancho de abertura", text: r.gancho },
                    { label: "Estrutura completa", text: r.estrutura },
                    { label: "CTA final", text: r.cta },
                    { label: "Prompt de imagem da capa", text: r.promptImagem },
                  ].map(s => (
                    <div key={s.label} className="pt-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-px-ink">{s.label}</span>
                        <CopyButton text={s.text} />
                      </div>
                      <p className="whitespace-pre-line rounded-px-card border border-px-line bg-white/60 p-3 text-[13.5px] leading-relaxed text-px-ink">{s.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )
        })}
      </div>
    )
  }

  function renderLanding(c: Campanha) {
    if (loadingLanding) return <p role="status" className="text-[13.5px] text-px-muted">Montando a página em HTML. Isso leva alguns instantes.</p>

    if (!landingHtml) {
      return (
        <Panel as="div" className="space-y-3">
          <p role="alert" className="text-[13.5px] text-px-danger">{erroLanding ?? "A página em HTML ainda não foi gerada."}</p>
          <p className="text-[13.5px] text-px-muted">Headline da campanha: {c.landingPage.headline}</p>
          <PxButton variant="secondary" size="sm" onClick={() => { landingGenRef.current += 1; gerarLandingHtml(c.landingPage, landingGenRef.current) }}>
            Gerar a página de novo
          </PxButton>
        </Panel>
      )
    }

    return (
      <div className="space-y-3">
        <p role="note" className="rounded-px-card bg-px-warn-soft px-4 py-3 text-[13.5px] text-px-warn">
          Revise antes de publicar. A página gerada traz depoimentos de exemplo e pode trazer promessas de resultado. Substitua ou remova esses trechos e confira a conformidade com a Resolução CFM 2.336/2023.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <PxButton variant="secondary" size="sm" onClick={() => setTelaCheia(true)}>Tela cheia</PxButton>
          <PxButton variant="secondary" size="sm" onClick={() => setShowHtmlEditor(v => !v)}>{showHtmlEditor ? "Ver preview" : "Editar HTML"}</PxButton>
          <PxButton size="sm" onClick={exportarHtml}>Exportar HTML</PxButton>
        </div>

        {!showHtmlEditor && (
          <Panel as="div" className="overflow-hidden !p-0" >
            <iframe key={landingHtml.length} srcDoc={landingHtml} className="h-[620px] w-full border-0 bg-white" sandbox="allow-scripts" title="Pré-visualização da landing page" />
          </Panel>
        )}

        {showHtmlEditor && (
          <div className="space-y-3">
            <Panel as="div" className="space-y-2">
              <label htmlFor="ofertas-html" className="flex items-center justify-between text-[13px] font-medium text-px-ink">
                <span>Editor de HTML</span>
                <span className="font-normal text-px-muted">{editedHtml.length.toLocaleString("pt-BR")} caracteres</span>
              </label>
              <textarea id="ofertas-html" value={editedHtml} onChange={e => setEditedHtml(e.target.value)} spellCheck={false}
                className={`${TEXTAREA} h-[500px] font-mono text-[12.5px] leading-relaxed`} />
            </Panel>
            <div className="flex flex-wrap items-center gap-2">
              <PxButton size="sm" onClick={() => setLandingHtml(editedHtml)}>Atualizar preview</PxButton>
              <PxButton variant="secondary" size="sm" onClick={() => { setEditedHtml(originalHtml ?? ""); setLandingHtml(originalHtml) }}>Voltar ao original</PxButton>
            </div>
          </div>
        )}

        <PxModal open={telaCheia} onClose={() => setTelaCheia(false)} title="Landing page" className="max-w-5xl">
          <iframe srcDoc={landingHtml} className="h-[75vh] w-full rounded-px-card border border-px-line bg-white" sandbox="allow-scripts" title="Landing page em tela cheia" />
        </PxModal>
      </div>
    )
  }

  function renderAnuncios(c: Campanha) {
    const FORMATS = [
      { key: "feed", label: "Feed", items: c.anuncios.feed },
      { key: "stories", label: "Stories", items: c.anuncios.stories },
      { key: "reels", label: "Reels", items: c.anuncios.reels },
    ] as const
    return (
      <div className="space-y-6">
        {FORMATS.map(fmt => (
          <section key={fmt.key} className="space-y-3" aria-label={`Anúncios para ${fmt.label}`}>
            <h3 className="text-[15px] font-semibold text-px-ink">{fmt.label}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {fmt.items.map((a, i) => (
                <Panel as="article" key={i} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <Tag tone={VARIACAO_TOM[a.variacao] ?? "neutral"}>{a.variacao}</Tag>
                    <CopyButton text={`Headline: ${a.headline}\nTexto: ${a.texto}\nCTA: ${a.cta}`} />
                  </div>
                  <p className="text-[14.5px] font-semibold leading-snug text-px-ink">{a.headline}</p>
                  <p className="flex-1 text-[13.5px] leading-relaxed text-px-muted">{a.texto}</p>
                  <p className="border-t border-px-line pt-2 text-[13px] font-medium text-px-accent">{a.cta}</p>
                </Panel>
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  function renderStories(c: Campanha) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {c.stories.map(s => (
          <Panel as="article" key={s.dia} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-px-ink">Dia {s.dia}</span>
                <Tag tone={s.tipo === "Oferta" ? "accent" : "neutral"}>{s.tipo}</Tag>
              </div>
              <CopyButton text={`DIA ${s.dia}, ${s.tipo}\n${s.texto}\nVisual: ${s.sugestaoVisual}\nSticker: ${s.sticker}`} />
            </div>
            <p className="flex-1 whitespace-pre-line rounded-px-card border border-px-line bg-white/60 p-3 text-[13.5px] leading-relaxed text-px-ink">{s.texto}</p>
            <div className="space-y-1 text-[13px]">
              <p><span className="font-medium text-px-ink">Visual: </span><span className="text-px-muted">{s.sugestaoVisual}</span></p>
              <p><span className="font-medium text-px-ink">Sticker: </span><span className="text-px-muted">{s.sticker}</span></p>
            </div>
          </Panel>
        ))}
      </div>
    )
  }

  function renderWhatsapp(c: Campanha) {
    const wa = c.whatsapp
    const msgs = [
      { label: "Abertura", text: wa.abertura },
      ...wa.followUps.map(f => ({ label: `Follow-up do dia ${f.dia}`, text: f.mensagem })),
      { label: "Fechamento", text: wa.fechamento },
      { label: "Resposta a objeção de preço", text: wa.respostaObjecao },
    ]
    return (
      <div className="max-w-2xl space-y-3">
        {msgs.map((m, i) => (
          <Panel as="article" key={i} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[14.5px] font-semibold text-px-ink">{m.label}</h3>
              <CopyButton text={m.text} />
            </div>
            <p className="whitespace-pre-line rounded-px-card border border-px-line bg-white/70 p-4 text-[13.5px] leading-relaxed text-px-ink">{m.text}</p>
          </Panel>
        ))}
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gerador de Ofertas"
        caption="Roteiros, landing page, anúncios, Stories e mensagens de WhatsApp para uma campanha"
        actions={stage === "resultado" ? (
          <div className="flex flex-wrap items-center gap-2">
            <PxButton variant="secondary" size="sm" loading={salvando} onClick={salvarNoPautas}>Salvar roteiros nas Pautas</PxButton>
            <PxButton variant="secondary" size="sm" onClick={copiarAba}>Copiar aba</PxButton>
            <PxButton size="sm" onClick={novaCampanha}>Nova campanha</PxButton>
          </div>
        ) : undefined}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        {aviso && <p role="status" className="rounded-px-card bg-px-ok-soft px-3 py-2 text-[13px] text-px-ok">{aviso}</p>}

        {stage === "briefing" && (
          <div className="max-w-3xl space-y-5">
            <section className="space-y-3" aria-label="Campanhas sazonais">
              <h2 className="text-[15px] font-semibold text-px-ink">Campanhas sazonais</h2>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {SAZONAIS.map(s => {
                  const ativo = tema === s.tema
                  return (
                    <button
                      key={s.label}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => { setTema(s.tema); setPublico(s.publico); setObjetivo(s.objetivo); setTom(s.tom) }}
                      className={ativo
                        ? "rounded-px-card bg-px-ink p-3 text-left text-white"
                        : "px-glass rounded-px-card p-3 text-left text-px-ink hover:bg-white/90"}
                    >
                      <span className="block text-[13.5px] font-semibold leading-snug">{s.label}</span>
                      <span className={ativo ? "block text-[12.5px] leading-snug text-white/80" : "block text-[12.5px] leading-snug text-px-muted"}>{s.sub}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <Panel as="section" className="space-y-4">
              <h2 className="text-[15px] font-semibold text-px-ink">Ou descreva a campanha</h2>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="of-tema" className="text-[13px] font-medium text-px-ink">Tema da campanha</label>
                  <button type="button" onClick={openImport} className="text-[13px] text-px-accent underline underline-offset-2">Importar do Banco de Pautas</button>
                </div>
                <textarea id="of-tema" value={tema} onChange={e => setTema(e.target.value)} rows={2} className={TEXTAREA}
                  placeholder="Ex: Campanha de emagrecimento para o verão, protocolo hormonal feminino" />
              </div>
              <Field label="Público-alvo" htmlFor="of-publico">
                <PxInput id="of-publico" value={publico} onChange={e => setPublico(e.target.value)} placeholder="Ex: Mulheres 40-55 anos com dificuldade para emagrecer" />
              </Field>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Objetivo" htmlFor="of-obj"><PxSelect id="of-obj" value={objetivo} onChange={e => setObjetivo(e.target.value)}>{OBJETIVOS.map(o => <option key={o}>{o}</option>)}</PxSelect></Field>
                <Field label="Duração" htmlFor="of-dur"><PxSelect id="of-dur" value={duracao} onChange={e => setDuracao(e.target.value)}>{DURACOES.map(d => <option key={d}>{d}</option>)}</PxSelect></Field>
                <Field label="Tom" htmlFor="of-tom"><PxSelect id="of-tom" value={tom} onChange={e => setTom(e.target.value)}>{TONS.map(t => <option key={t}>{t}</option>)}</PxSelect></Field>
              </div>
              {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
              {loading && progresso && <p role="status" className="text-[13px] text-px-muted">{progresso}</p>}
              <PxButton fullWidth loading={loading} onClick={gerar}>Gerar campanha completa</PxButton>
            </Panel>
          </div>
        )}

        {stage === "resultado" && campanha && (
          <div className="space-y-4">
            <p role="note" className="rounded-px-card bg-px-warn-soft px-4 py-3 text-[13.5px] text-px-warn">
              Conteúdo gerado por IA. Revise antes de usar: promessas de resultado, depoimentos inventados e escassez artificial costumam violar as regras de publicidade médica do CFM.
            </p>
            <div className="overflow-x-auto">
              <Segmented label="Parte da campanha" value={activeTab} onChange={setActiveTab} options={TABS} />
            </div>
            <div>
              {activeTab === "roteiros" && renderRoteiros(campanha)}
              {activeTab === "landing" && renderLanding(campanha)}
              {activeTab === "anuncios" && renderAnuncios(campanha)}
              {activeTab === "stories" && renderStories(campanha)}
              {activeTab === "whatsapp" && renderWhatsapp(campanha)}
            </div>
          </div>
        )}
      </div>

      <PxModal open={showImport} onClose={() => setShowImport(false)} title="Importar do Banco de Pautas" className="max-w-md">
        <div className="max-h-80 overflow-y-auto">
          {loadingPautas ? <p role="status" className="py-6 text-center text-[13px] text-px-muted">Carregando pautas</p>
            : erroPautas ? <p role="alert" className="py-6 text-center text-[13px] text-px-danger">{erroPautas}</p>
            : pautasList.length === 0 ? <p className="py-6 text-center text-[13px] text-px-muted">Nenhuma pauta encontrada.</p>
            : <ul className="divide-y divide-px-line">{pautasList.map(p => (
                <li key={p.id}>
                  <button type="button" onClick={() => { setTema(String(p.titulo)); setShowImport(false) }}
                    className="w-full px-2 py-3 text-left text-[13.5px] text-px-ink hover:bg-px-ink/5">{p.titulo}</button>
                </li>
              ))}</ul>}
        </div>
      </PxModal>
    </div>
  )
}
