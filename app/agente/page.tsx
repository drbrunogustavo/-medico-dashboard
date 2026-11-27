"use client"

import { useState } from "react"
import { Panel, PxButton, PxModal, Segmented, Field, PxInput, Tag, PageHeader, CopyButton } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Stage = "briefing" | "planejamento" | "entrega"
type ContentSection = "reel" | "imagem" | "legenda" | "story"

interface CalCell { dia: number; tema: string; formato: string }
interface Plano {
  tema: string
  pilares: string[]
  distribuicao: { reels: number; stories: number; carrosseis: number }
  calendario: CalCell[]
}
interface DiaConteudo {
  dia: number
  reel: { titulo: string; gancho: string; roteiro: string[]; cta: string }
  imagem: { headline: string; prompt: string; estilo: string }
  legenda: { texto: string; hashtags: string[] }
  story: { slides: string[] }
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const EXEMPLOS = [
  "7 dias de conteúdo sobre resistência à insulina",
  "Campanha de 15 dias para menopausa e climatério",
  "30 Reels sobre emagrecimento masculino após os 40",
  "Semana de conteúdo educativo sobre tirzepatida",
]

const VOLUMES = [7, 15, 30]
const LOTE = 7

const SECTIONS: { value: ContentSection; label: string }[] = [
  { value: "reel", label: "Reel" },
  { value: "imagem", label: "Imagem" },
  { value: "legenda", label: "Legenda" },
  { value: "story", label: "Story" },
]

const TEXTAREA = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

// ─── Funções auxiliares ───────────────────────────────────────────────────────

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

function planoValido(p: any): p is Plano {
  return !!p && typeof p.tema === "string" && Array.isArray(p.calendario) && p.calendario.length > 0
}

function diaValido(d: any): d is DiaConteudo {
  return !!d && typeof d.dia === "number" &&
    d.reel && typeof d.reel.titulo === "string" && Array.isArray(d.reel.roteiro) &&
    d.imagem && typeof d.imagem.prompt === "string" &&
    d.legenda && typeof d.legenda.texto === "string" && Array.isArray(d.legenda.hashtags) &&
    d.story && Array.isArray(d.story.slides)
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}
const br = (s: string) => esc(s).replace(/\n/g, "<br>")

function diaTexto(d: DiaConteudo): string {
  return [
    `DIA ${d.dia}`,
    "",
    "REEL", `Título: ${d.reel.titulo}`, `Gancho:\n${d.reel.gancho}`, `Roteiro:\n${d.reel.roteiro.join("\n")}`, `CTA: ${d.reel.cta}`,
    "",
    "IMAGEM", `Headline: ${d.imagem.headline}`, `Prompt: ${d.imagem.prompt}`, `Estilo: ${d.imagem.estilo}`,
    "",
    "LEGENDA", d.legenda.texto, d.legenda.hashtags.join(" "),
    "",
    "STORY", ...d.story.slides.map((s, i) => `Slide ${i + 1}: ${s}`),
  ].join("\n")
}

/** Documento para impressão. Todo texto vindo da IA ou do formulário passa por esc(). */
function montarHtmlImpressao(opts: { titulo: string; briefing: string; publico: string; volume: number; plano: Plano | null; dias: DiaConteudo[]; calendario: boolean }): string {
  const { titulo, briefing, publico, volume, plano, dias, calendario } = opts
  let corpo = `<h1>${esc(titulo)}</h1><p><b>Briefing:</b> ${esc(briefing)}</p><p><b>Público:</b> ${esc(publico)}</p><p><b>Volume:</b> ${volume} dias</p>`
  if (plano?.pilares?.length) corpo += `<p><b>Pilares:</b> ${plano.pilares.map(esc).join(" · ")}</p>`
  if (calendario && plano) {
    const semanas = chunk(Array.from({ length: volume }, (_, i) => i + 1), 7)
    corpo += semanas.map((sem, si) => `<h3>Semana ${si + 1}</h3><table class="cal"><tr>${sem.map(n => {
      const c = plano.calendario.find(x => x.dia === n)
      return `<td><div class="n">Dia ${n}</div><div>${esc(c?.tema ?? "")}</div><div class="f">${esc((c?.formato ?? "").toUpperCase())}</div></td>`
    }).join("")}</tr></table>`).join("")
  }
  for (const d of dias) {
    const cal = plano?.calendario.find(c => c.dia === d.dia)
    corpo += `<div class="dia"><h2>Dia ${d.dia}${cal ? `: ${esc(cal.tema)}` : ""}</h2>` +
      `<h3>Reel</h3><p><b>${esc(d.reel.titulo)}</b></p><p><i>${br(d.reel.gancho)}</i></p><ul>${d.reel.roteiro.map(r => `<li>${esc(r)}</li>`).join("")}</ul><p><b>CTA:</b> ${esc(d.reel.cta)}</p>` +
      `<h3>Imagem</h3><p><b>${esc(d.imagem.headline)}</b></p><p>${esc(d.imagem.prompt)}</p><p><b>Estilo:</b> ${esc(d.imagem.estilo)}</p>` +
      `<h3>Legenda</h3><p>${br(d.legenda.texto)}</p><p class="ht">${esc(d.legenda.hashtags.join(" "))}</p>` +
      `<h3>Story</h3><ul>${d.story.slides.map((s, i) => `<li><b>Slide ${i + 1}:</b> ${br(s)}</li>`).join("")}</ul></div>`
  }
  const css = `body{font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:860px;margin:32px auto;color:#111;padding:0 20px}h1{font-size:22px;border-bottom:2px solid #111;padding-bottom:10px}h2{font-size:16px;background:#f3efe9;padding:8px 14px;border-radius:6px;margin-top:28px}h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#5c5650;margin:16px 0 6px}.dia{break-inside:avoid;margin-bottom:28px;border:1px solid #ddd;border-radius:8px;padding:18px}p{line-height:1.65;margin:4px 0}ul{padding-left:20px}li{margin:4px 0}.cal{border-collapse:collapse;width:100%;table-layout:fixed;margin-bottom:12px}.cal td{border:1px solid #ddd;padding:8px;vertical-align:top;font-size:12px}.cal .n{font-size:11px;color:#5c5650;margin-bottom:4px}.cal .f{font-size:10px;font-weight:700;margin-top:4px}.ht{color:#5c5650}`
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>${css}</style></head><body>${corpo}</body></html>`
}

// ─── Conteúdo de um dia (usado na lista e no modal do calendário) ────────────

function Bloco({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[13px] font-medium text-px-ink">{label}</p>
      {children}
    </div>
  )
}

function DiaView({ d, section }: { d: DiaConteudo; section: ContentSection }) {
  const caixa = "whitespace-pre-line rounded-px-card border border-px-line bg-white/60 p-3 text-[13.5px] leading-relaxed text-px-ink"
  if (section === "reel") return (
    <div className="space-y-4">
      <Bloco label="Título do Reel"><p className="text-[15px] font-semibold text-px-ink">{d.reel.titulo}</p></Bloco>
      <Bloco label="Gancho de abertura"><p className={`${caixa} italic`}>{d.reel.gancho}</p></Bloco>
      <Bloco label="Roteiro">
        <ol className="space-y-1.5">
          {d.reel.roteiro.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug text-px-ink">
              <span className="w-4 flex-shrink-0 text-px-muted">{i + 1}</span>
              <span>{p.replace(/^\d+\.\s*/, "")}</span>
            </li>
          ))}
        </ol>
      </Bloco>
      <Bloco label="CTA"><p className="rounded-px-card bg-px-accent-soft px-3 py-2 text-[13.5px] text-px-accent">{d.reel.cta}</p></Bloco>
    </div>
  )
  if (section === "imagem") return (
    <div className="space-y-4">
      <Bloco label="Headline da arte"><p className="text-[19px] font-semibold leading-tight text-px-ink">{d.imagem.headline}</p></Bloco>
      <Bloco label="Prompt para gerar a imagem">
        <p className={caixa}>{d.imagem.prompt}</p>
        <CopyButton text={d.imagem.prompt} label="Copiar prompt" />
      </Bloco>
      <Bloco label="Estilo recomendado"><Tag tone="neutral">{d.imagem.estilo}</Tag></Bloco>
    </div>
  )
  if (section === "legenda") return (
    <div className="space-y-4">
      <Bloco label="Legenda">
        <p className={caixa}>{d.legenda.texto}</p>
        <CopyButton text={`${d.legenda.texto}\n\n${d.legenda.hashtags.join(" ")}`} label="Copiar legenda" />
      </Bloco>
      <Bloco label="Hashtags">
        <div className="flex flex-wrap gap-1.5">{d.legenda.hashtags.map((h, i) => <Tag key={i} tone="neutral">{h}</Tag>)}</div>
      </Bloco>
    </div>
  )
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-px-muted">Sequência de {d.story.slides.length} slides</p>
      {d.story.slides.map((s, i) => (
        <Bloco key={i} label={`Slide ${i + 1}`}><p className={caixa}>{s}</p></Bloco>
      ))}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AgentePage() {
  const [stage, setStage] = useState<Stage>("briefing")
  const [briefing, setBriefing] = useState("")
  const [volume, setVolume] = useState(7)
  const [publico, setPublico] = useState("Mulheres 40-55 anos, climatério e emagrecimento")
  const [plano, setPlano] = useState<Plano | null>(null)
  const [planejando, setPlanejando] = useState(false)
  const [planoError, setPlanoError] = useState<string | null>(null)
  const [dias, setDias] = useState<DiaConteudo[]>([])
  const [generating, setGenerating] = useState(false)
  const [currentBatch, setCurrentBatch] = useState("")
  const [faltando, setFaltando] = useState<number[]>([])
  const [expandedDays, setExpandedDays] = useState<number[]>([])
  const [activeSections, setActiveSections] = useState<Record<number, ContentSection>>({})
  const [saving, setSaving] = useState(false)
  const [salvos, setSalvos] = useState<number[]>([])
  const [aviso, setAviso] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"lista" | "calendario">("lista")
  const [calendarDay, setCalendarDay] = useState<DiaConteudo | null>(null)
  const [calModalSec, setCalModalSec] = useState<ContentSection>("reel")

  function toggleDay(n: number) {
    setExpandedDays(prev => prev.includes(n) ? prev.filter(d => d !== n) : [...prev, n])
  }

  // ── Etapa 1 para 2: plano ────────────────────────────────────────────────────

  async function executarMissao() {
    if (!briefing.trim()) return
    setPlanoError(null)
    setPlanejando(true)
    setStage("planejamento")
    setPlano(null)
    try {
      const res = await fetch("/api/agente/planejar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefing, volume, publico }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !planoValido(data)) throw new Error("falha")
      setPlano({ ...data, pilares: data.pilares ?? [], distribuicao: data.distribuicao ?? { reels: 0, stories: 0, carrosseis: 0 } })
    } catch {
      setPlanoError("Não foi possível montar o plano. Seu briefing foi mantido, tente de novo.")
    } finally {
      setPlanejando(false)
    }
  }

  // ── Etapa 2 para 3: conteúdo ────────────────────────────────────────────────

  async function gerarLotes(lotes: number[][], acumulado: DiaConteudo[]) {
    if (!plano) return
    setGenerating(true)
    setFaltando([])
    let todos = [...acumulado]
    const sem: number[] = []
    try {
      for (const lote of lotes) {
        setCurrentBatch(`Gerando ${lote.length === 1 ? `o dia ${lote[0]}` : `os dias ${lote[0]} a ${lote[lote.length - 1]}`}`)
        try {
          const res = await fetch("/api/agente/gerar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plano, dias: lote, publico, briefing }),
          })
          const data = await res.json().catch(() => null)
          if (!res.ok || !data) throw new Error("falha")
          const validos: DiaConteudo[] = (Array.isArray(data.dias) ? data.dias : []).filter(diaValido).filter((d: DiaConteudo) => lote.includes(d.dia))
          todos = [...todos.filter(d => !validos.some(v => v.dia === d.dia)), ...validos]
          lote.forEach(n => { if (!validos.some(v => v.dia === n)) sem.push(n) })
        } catch {
          sem.push(...lote)
        }
        todos.sort((a, b) => a.dia - b.dia)
        setDias([...todos])
      }
    } finally {
      setGenerating(false)
      setCurrentBatch("")
      setFaltando(sem)
      if (acumulado.length === 0 && todos.length > 0) setExpandedDays([todos[0].dia])
    }
  }

  function gerarTudo() {
    if (!plano) return
    setStage("entrega")
    setDias([])
    setSalvos([])
    setExpandedDays([])
    setViewMode("lista")
    gerarLotes(chunk(Array.from({ length: volume }, (_, i) => i + 1), LOTE), [])
  }

  function tentarFaltantes() {
    gerarLotes(chunk(faltando, LOTE), dias)
  }

  // ── Salvar, exportar, copiar ────────────────────────────────────────────────

  function mostrarAviso(msg: string) {
    setAviso(msg)
    setTimeout(() => setAviso(null), 4000)
  }

  async function saveAllToPautas() {
    const pendentes = dias.filter(d => !salvos.includes(d.dia))
    if (!pendentes.length) return
    setSaving(true)
    const ok: number[] = []
    for (const d of pendentes) {
      const calItem = plano?.calendario.find(c => c.dia === d.dia)
      try {
        const res = await fetch("/api/pautas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: `Dia ${d.dia}: ${d.reel.titulo}`,
            nota: `Campanha: ${plano?.tema ?? ""}\nGancho: ${d.reel.gancho}\n\nLegenda:\n${d.legenda.texto}`,
            categoria: "Agente Executivo",
            prioridade: "Alta",
            estagio: "Ideia",
            tags: ["agente", calItem?.formato.toLowerCase() ?? "reel"],
          }),
        })
        if (res.ok) ok.push(d.dia)
      } catch { /* conta como não salvo */ }
    }
    setSalvos(prev => [...prev, ...ok])
    setSaving(false)
    mostrarAviso(ok.length === pendentes.length
      ? `${ok.length} ${ok.length === 1 ? "dia salvo" : "dias salvos"} no Banco de Pautas.`
      : `${ok.length} de ${pendentes.length} dias salvos. Os outros falharam, tente de novo.`)
  }

  async function copyAll() {
    const linhas: string[] = [`PLANO DE CONTEÚDO: ${plano?.tema ?? ""}`, ""]
    if (plano?.pilares?.length) linhas.push(`Pilares: ${plano.pilares.join(" | ")}`, "")
    for (const d of dias) linhas.push("-".repeat(50), diaTexto(d), "")
    try {
      await navigator.clipboard.writeText(linhas.join("\n"))
      mostrarAviso("Conteúdo completo copiado.")
    } catch {
      mostrarAviso("Não foi possível copiar.")
    }
  }

  function exportar(calendario: boolean) {
    const html = montarHtmlImpressao({
      titulo: calendario ? `Calendário de conteúdo: ${plano?.tema ?? ""}` : `Plano: ${plano?.tema ?? "Plano de conteúdo"}`,
      briefing, publico, volume, plano, dias, calendario,
    })
    const win = window.open("", "_blank")
    if (!win) { mostrarAviso("O navegador bloqueou a nova janela. Permita pop-ups para exportar."); return }
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  function resetar() {
    setStage("briefing"); setPlano(null); setDias([]); setFaltando([])
    setPlanoError(null); setSalvos([]); setExpandedDays([])
    setViewMode("lista"); setCalendarDay(null)
  }

  const todosSalvos = dias.length > 0 && dias.every(d => salvos.includes(d.dia))
  const pct = Math.round((dias.length / volume) * 100)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Agente Executivo"
        caption="Descreva a campanha, aprove o plano e receba roteiros, capas, legendas e Stories"
        actions={stage !== "briefing" ? <PxButton variant="secondary" size="sm" onClick={resetar}>Nova missão</PxButton> : undefined}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        {aviso && <p role="status" className="rounded-px-card bg-px-ok-soft px-3 py-2 text-[13px] text-px-ok">{aviso}</p>}

        {/* ETAPA 1: BRIEFING */}
        {stage === "briefing" && (
          <div className="max-w-3xl space-y-4">
            <Panel as="section" className="space-y-4">
              <div>
                <label htmlFor="ag-briefing" className="text-[15px] font-semibold text-px-ink">O que você precisa criar?</label>
                <p className="mt-0.5 text-[13.5px] text-px-muted">Descreva em linguagem natural. O Agente propõe um plano e, depois da sua aprovação, gera roteiros, capas, legendas e Stories.</p>
              </div>
              <textarea id="ag-briefing" value={briefing} onChange={e => setBriefing(e.target.value)} rows={4} className={TEXTAREA}
                placeholder="Ex: 30 dias de conteúdo para mulheres de 45 anos com dificuldade para emagrecer, com foco em hormônios, menopausa e resistência à insulina" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-px-muted">Exemplos:</span>
                {EXEMPLOS.map(ex => (
                  <button key={ex} type="button" onClick={() => setBriefing(ex)} className="rounded-full border border-px-line bg-white/70 px-3 py-1 text-[13px] text-px-ink hover:bg-white">{ex}</button>
                ))}
              </div>
            </Panel>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Panel as="div" className="space-y-2">
                <p className="text-[13px] font-medium text-px-ink">Volume de conteúdo</p>
                <Segmented label="Volume" value={String(volume)} onChange={v => setVolume(Number(v))} options={VOLUMES.map(v => ({ value: String(v), label: `${v} dias` }))} />
              </Panel>
              <Panel as="div">
                <Field label="Público-alvo" htmlFor="ag-publico">
                  <PxInput id="ag-publico" value={publico} onChange={e => setPublico(e.target.value)} placeholder="Ex: Mulheres 40-55 anos, climatério" />
                </Field>
              </Panel>
            </div>

            <PxButton fullWidth disabled={!briefing.trim()} onClick={executarMissao}>Planejar campanha</PxButton>
          </div>
        )}

        {/* ETAPA 2: PLANEJAMENTO */}
        {stage === "planejamento" && (
          <div className="space-y-4">
            {planejando && <p role="status" className="text-[13.5px] text-px-muted">Analisando o briefing e montando o calendário.</p>}

            {planoError && (
              <Panel as="div" className="space-y-3">
                <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{planoError}</p>
                <div className="flex gap-2">
                  <PxButton size="sm" onClick={executarMissao}>Tentar de novo</PxButton>
                  <PxButton size="sm" variant="secondary" onClick={() => { setStage("briefing"); setPlanoError(null) }}>Voltar ao briefing</PxButton>
                </div>
              </Panel>
            )}

            {!planejando && plano && (
              <>
                <Panel as="section" className="space-y-4">
                  <div>
                    <p className="text-[13px] text-px-muted">Plano proposto, aguardando sua aprovação</p>
                    <h2 className="text-[19px] font-semibold text-px-ink">{plano.tema}</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[13px] font-medium text-px-ink">Pilares editoriais</p>
                      <ul className="space-y-1 text-[13.5px] text-px-ink">{plano.pilares.map((p, i) => <li key={i}>{p}</li>)}</ul>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[13px] font-medium text-px-ink">Formatos</p>
                      <ul className="space-y-1 text-[13.5px] text-px-ink">
                        <li>{plano.distribuicao.reels} Reels</li>
                        <li>{plano.distribuicao.stories} Stories</li>
                        <li>{plano.distribuicao.carrosseis} Carrosséis</li>
                      </ul>
                    </div>
                  </div>
                </Panel>

                <Panel as="section" className="space-y-2">
                  <h3 className="text-[15px] font-semibold text-px-ink">Calendário dia a dia</h3>
                  <ul className="divide-y divide-px-line">
                    {plano.calendario.map(item => (
                      <li key={item.dia} className="flex items-center gap-4 py-2.5">
                        <span className="w-14 flex-shrink-0 text-[13px] font-medium text-px-muted">Dia {item.dia}</span>
                        <p className="flex-1 text-[13.5px] leading-snug text-px-ink">{item.tema}</p>
                        <Tag tone="neutral">{item.formato}</Tag>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <div className="flex flex-wrap gap-2">
                  <PxButton onClick={gerarTudo}>Aprovar e gerar o conteúdo</PxButton>
                  <PxButton variant="secondary" onClick={() => { setStage("briefing"); setPlano(null) }}>Ajustar briefing</PxButton>
                </div>
              </>
            )}
          </div>
        )}

        {/* ETAPA 3: ENTREGA */}
        {stage === "entrega" && (
          <div className="space-y-4">
            <p role="note" className="rounded-px-card bg-px-warn-soft px-4 py-3 text-[13.5px] text-px-warn">
              Conteúdo gerado por IA. Revise cada peça antes de publicar, principalmente promessas de resultado e afirmações clínicas.
            </p>

            {generating && (
              <Panel as="div" className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p role="status" className="text-[13.5px] font-medium text-px-ink">{currentBatch || "Iniciando a geração"}</p>
                  <span className="text-[13px] text-px-muted">{dias.length} de {volume} dias</span>
                </div>
                <div role="progressbar" aria-valuemin={0} aria-valuemax={volume} aria-valuenow={dias.length} aria-label="Dias gerados" className="h-2 overflow-hidden rounded-full bg-px-ink/10">
                  <div className="h-full rounded-full bg-px-ink transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </Panel>
            )}

            {!generating && faltando.length > 0 && (
              <Panel as="div" className="space-y-3">
                <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">
                  {faltando.length === 1 ? `O dia ${faltando[0]} não foi gerado.` : `${faltando.length} dias não foram gerados: ${faltando.join(", ")}.`}
                </p>
                <PxButton size="sm" onClick={tentarFaltantes}>Gerar os dias que faltam</PxButton>
              </Panel>
            )}

            {dias.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-auto text-[13.5px] text-px-muted"><span className="font-semibold text-px-ink">{dias.length}</span> {dias.length === 1 ? "dia gerado" : "dias gerados"}</p>
                <PxButton variant="secondary" size="sm" loading={saving} disabled={todosSalvos || generating} onClick={saveAllToPautas}>
                  {todosSalvos ? "Tudo salvo nas Pautas" : "Salvar tudo nas Pautas"}
                </PxButton>
                <PxButton variant="secondary" size="sm" disabled={generating} onClick={() => exportar(viewMode === "calendario")}>
                  {viewMode === "calendario" ? "Exportar calendário em PDF" : "Exportar em PDF"}
                </PxButton>
                <PxButton variant="secondary" size="sm" disabled={generating} onClick={copyAll}>Copiar tudo</PxButton>
                {viewMode === "lista" && <PxButton variant="quiet" size="sm" onClick={() => setExpandedDays(dias.map(d => d.dia))}>Expandir todos</PxButton>}
              </div>
            )}

            {dias.length > 0 && !generating && (
              <div>
                <Segmented label="Visualização" value={viewMode} onChange={setViewMode} options={[{ value: "lista", label: "Lista" }, { value: "calendario", label: "Calendário" }]} />
              </div>
            )}

            {viewMode === "lista" && (
              <div className="space-y-2">
                {dias.map(d => {
                  const calItem = plano?.calendario.find(c => c.dia === d.dia)
                  const isOpen = expandedDays.includes(d.dia)
                  const cur = activeSections[d.dia] ?? "reel"
                  return (
                    <Panel as="article" key={d.dia} className="!p-0">
                      <button type="button" aria-expanded={isOpen} onClick={() => toggleDay(d.dia)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left">
                        <span className="w-14 flex-shrink-0 text-[13px] font-semibold text-px-accent">Dia {d.dia}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold text-px-ink">{calItem?.tema ?? d.reel.titulo}</span>
                          <span className="block truncate text-[13px] text-px-muted">{d.reel.titulo}</span>
                        </span>
                        {calItem && <Tag tone="neutral">{calItem.formato}</Tag>}
                      </button>
                      {isOpen && (
                        <div className="space-y-4 border-t border-px-line px-5 pb-5 pt-4">
                          <div className="overflow-x-auto">
                            <Segmented label={`Conteúdo do dia ${d.dia}`} value={cur} onChange={v => setActiveSections(prev => ({ ...prev, [d.dia]: v }))} options={SECTIONS} />
                          </div>
                          <DiaView d={d} section={cur} />
                        </div>
                      )}
                    </Panel>
                  )
                })}
              </div>
            )}

            {viewMode === "calendario" && dias.length > 0 && (
              <Panel as="section" className="space-y-4">
                <p className="text-[13.5px] text-px-muted">{volume} dias em {Math.ceil(volume / 7)} {Math.ceil(volume / 7) === 1 ? "semana" : "semanas"}. Os dias seguem a ordem do plano, sem datas fixas. Toque em um dia para abrir o conteúdo.</p>
                <div className="space-y-4 overflow-x-auto">
                  {chunk(Array.from({ length: volume }, (_, i) => i + 1), 7).map((sem, si) => (
                    <div key={si} className="min-w-[640px] space-y-1.5">
                      <p className="text-[13px] font-medium text-px-ink">Semana {si + 1}</p>
                      <div className="grid grid-cols-7 gap-1.5">
                        {sem.map(n => {
                          const cell = plano?.calendario.find(c => c.dia === n) ?? { dia: n, tema: "", formato: "" }
                          const conteudo = dias.find(d => d.dia === n)
                          return (
                            <button
                              key={n}
                              type="button"
                              disabled={!conteudo}
                              onClick={() => { if (conteudo) { setCalendarDay(conteudo); setCalModalSec("reel") } }}
                              className={conteudo
                                ? "min-h-[96px] rounded-px-card border border-px-line bg-white/80 p-2 text-left hover:bg-white"
                                : "min-h-[96px] rounded-px-card border border-dashed border-px-line p-2 text-left opacity-60"}
                            >
                              <span className="block text-[12px] font-semibold text-px-accent">Dia {n}</span>
                              <span className="mt-0.5 line-clamp-3 block text-[12.5px] leading-snug text-px-ink">{cell.tema}</span>
                              {cell.formato && <span className="mt-1 block text-[12px] text-px-muted">{cell.formato}</span>}
                              {!conteudo && <span className="mt-1 block text-[12px] text-px-danger">não gerado</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}
      </div>

      <PxModal open={!!calendarDay} onClose={() => setCalendarDay(null)} title={calendarDay ? `Dia ${calendarDay.dia}: ${plano?.calendario.find(c => c.dia === calendarDay.dia)?.tema ?? calendarDay.reel.titulo}` : ""} className="max-w-2xl">
        {calendarDay && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Segmented label="Conteúdo do dia" value={calModalSec} onChange={setCalModalSec} options={SECTIONS} />
            </div>
            <DiaView d={calendarDay} section={calModalSec} />
          </div>
        )}
      </PxModal>
    </div>
  )
}
