"use client"

import { useState, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"
import {
  Bot, Sparkles, Play, Layers, FileText, MessageSquare,
  Check, Loader2, AlertCircle, RefreshCw, Download, Copy,
  ChevronDown, ChevronUp, Calendar, Target, Zap, Palette,
  CheckSquare2, ArrowRight, BookOpen, Smartphone, LayoutGrid, X, List,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

type Stage          = "briefing" | "planejamento" | "entrega"
type ContentSection = "reel" | "imagem" | "legenda" | "story"

interface CalCell { dia: number; tema: string; formato: string }

interface Plano {
  tema:         string
  pilares:      string[]
  distribuicao: { reels: number; stories: number; carrosseis: number }
  calendario:   CalCell[]
}

interface DiaConteudo {
  dia:     number
  reel:    { titulo: string; gancho: string; roteiro: string[]; cta: string }
  imagem:  { headline: string; prompt: string; estilo: string }
  legenda: { texto: string; hashtags: string[] }
  story:   { slides: string[] }
}

// ─── Config ─────────────────────────────────────────────────────────────────────

const EXEMPLOS = [
  "7 dias de conteúdo sobre resistência à insulina",
  "Campanha de 15 dias para menopausa e climatério",
  "30 Reels sobre emagrecimento masculino após os 40",
  "Semana de conteúdo educativo sobre tirzepatida",
]

const VOLUMES = [7, 15, 30]

const CONTENT_TABS: { key: ContentSection; label: string; Icon: LucideIcon }[] = [
  { key: "reel",    label: "Reel",    Icon: Play     },
  { key: "imagem",  label: "Imagem",  Icon: Palette  },
  { key: "legenda", label: "Legenda", Icon: FileText  },
  { key: "story",   label: "Story",   Icon: Layers   },
]

const FORMATO_BADGE: Record<string, string> = {
  "Reel":      "bg-blue-50 border-blue-200 text-blue-700",
  "Story":     "bg-purple-50 border-purple-200 text-purple-700",
  "Carrossel": "bg-amber-50 border-amber-200 text-amber-700",
}

const FORMATO_CAL_BG: Record<string, string> = {
  "Reel":      "bg-accent/10 border-accent/30 hover:bg-accent/15",
  "Story":     "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/15",
  "Carrossel": "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15",
  "Post":      "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15",
}

const FORMATO_CAL_TEXT: Record<string, string> = {
  "Reel":      "text-accent",
  "Story":     "text-purple-400",
  "Carrossel": "text-blue-400",
  "Post":      "text-amber-400",
}

const FORMATO_CAL_ICON: Record<string, LucideIcon> = {
  "Reel":      Play,
  "Story":     Smartphone,
  "Carrossel": LayoutGrid,
  "Post":      Palette,
}

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

// ─── Mock helpers ───────────────────────────────────────────────────────────────

const makeMockDia = (dia: number, tema?: string): DiaConteudo => ({
  dia,
  reel: {
    titulo: tema ?? `Dia ${dia}: Conteúdo de demonstração`,
    gancho: `Linha 1 do gancho — cria tensão ou curiosidade para o dia ${dia}.\nLinha 2 que aprofunda o problema ou promessa.\nLinha 3 que justifica continuar assistindo.`,
    roteiro: [
      "1. Abertura com dado ou pergunta impactante (10s)",
      "2. Contexto: o problema que o paciente reconhece (15s)",
      "3. O insight ou solução surpreendente (15s)",
      "4. Prova: estudo, caso clínico ou dado real (10s)",
      "5. Conclusão e chamada para ação direta (10s)",
    ],
    cta: "Salva esse vídeo e manda para alguém que precisa ouvir isso.",
  },
  imagem: {
    headline: "A ciência que muda tudo",
    prompt: "Professional photo of a doctor in white coat in modern clinic, dark elegant background, soft side lighting, shallow depth of field, high quality portrait photography",
    estilo: "Autoridade Médica",
  },
  legenda: {
    texto: `💡 Você sabia disso? Essa é uma informação que muda completamente a forma como entendemos o tratamento.\n\nA ciência mais recente aponta para algo que poucos médicos explicam com clareza. E entender isso pode ser o que falta para você finalmente ver resultados reais.\n\n📩 Me chama para conversar sobre o seu caso específico.`,
    hashtags: ["#endocrinologia", "#nutrologia", "#saude", "#medicina", "#drbruno"],
  },
  story: {
    slides: [
      `Você sabia que isso pode estar te impedindo de emagrecer? 🤔`,
      "3 pontos que a maioria dos médicos não explica:\n✅ Ponto 1\n✅ Ponto 2\n✅ Ponto 3",
      "Manda essa publicação para alguém que precisa ver. 👉 Arrasta para mais",
    ],
  },
})

const MOCK_PLANO: Plano = {
  tema: "Saúde hormonal e metabolismo feminino após os 40",
  pilares: ["Educação Científica", "Empoderamento", "Autoridade Clínica"],
  distribuicao: { reels: 4, stories: 2, carrosseis: 1 },
  calendario: [
    { dia: 1, tema: "Por que é mais difícil emagrecer após os 40?",        formato: "Reel"      },
    { dia: 2, tema: "Resistência à insulina: o vilão silencioso",          formato: "Carrossel" },
    { dia: 3, tema: "O papel dos hormônios no peso corporal",              formato: "Reel"      },
    { dia: 4, tema: "Menopausa e metabolismo: o que muda de verdade",      formato: "Story"     },
    { dia: 5, tema: "Protocolo de exercícios que respeita seu corpo",      formato: "Reel"      },
    { dia: 6, tema: "Sono e cortisol: a conexão que sabota seu resultado", formato: "Story"     },
    { dia: 7, tema: "5 mitos sobre emagrecimento feminino",                formato: "Reel"      },
  ],
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function AgentePage() {
  const [stage,          setStage]          = useState<Stage>("briefing")
  const [briefing,       setBriefing]       = useState("")
  const [volume,         setVolume]         = useState(7)
  const [publico,        setPublico]        = useState("Mulheres 40-55 anos, climatério e emagrecimento")
  const [plano,          setPlano]          = useState<Plano | null>(null)
  const [planejando,     setPlanejando]     = useState(false)
  const [planoError,     setPlanoError]     = useState<string | null>(null)
  const [dias,           setDias]           = useState<DiaConteudo[]>([])
  const [generating,     setGenerating]     = useState(false)
  const [progress,       setProgress]       = useState({ current: 0, total: 7 })
  const [currentBatch,   setCurrentBatch]   = useState("")
  const [expandedDays,   setExpandedDays]   = useState<number[]>([])
  const [activeSections, setActiveSections] = useState<Record<number, ContentSection>>({})
  const [saving,         setSaving]         = useState(false)
  const [allSaved,       setAllSaved]       = useState(false)
  const [toast,          setToast]          = useState<string | null>(null)
  const [viewMode,       setViewMode]       = useState<"lista" | "calendario">("lista")
  const [calendarDay,    setCalendarDay]    = useState<DiaConteudo | null>(null)
  const [calModalSec,    setCalModalSec]    = useState<ContentSection>("reel")

  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3200)
  }

  const toggleDay = (dayNum: number) => {
    setExpandedDays(prev =>
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
    )
    setActiveSections(prev => ({ [dayNum]: "reel", ...prev }))
  }

  const setSection = (dayNum: number, section: ContentSection) => {
    setActiveSections(prev => ({ ...prev, [dayNum]: section }))
  }

  // ── Stage 1 → 2: Plan ───────────────────────────────────────────────────────

  const executarMissao = async () => {
    if (!briefing.trim()) return
    setPlanoError(null)
    setPlanejando(true)
    setStage("planejamento")
    setPlano(null)

    try {
      const res  = await fetch("/api/agente/planejar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ briefing, volume, publico }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPlano(data)
    } catch {
      setPlanoError("Erro ao gerar plano. Usando demonstração.")
      setPlano({ ...MOCK_PLANO, calendario: MOCK_PLANO.calendario.slice(0, volume) })
    } finally {
      setPlanejando(false)
    }
  }

  // ── Stage 2 → 3: Generate ───────────────────────────────────────────────────

  const gerarTudo = async () => {
    if (!plano) return
    setStage("entrega")
    setGenerating(true)
    setDias([])
    setAllSaved(false)
    setExpandedDays([])
    setProgress({ current: 0, total: volume })
    setViewMode("lista")

    const BATCH   = 7
    const allDias: DiaConteudo[] = []

    try {
      for (let start = 1; start <= volume; start += BATCH) {
        const end   = Math.min(start + BATCH - 1, volume)
        const lote  = Array.from({ length: end - start + 1 }, (_, i) => start + i)
        setCurrentBatch(`Gerando dias ${start}${end > start ? `–${end}` : ""}...`)

        try {
          const res  = await fetch("/api/agente/gerar", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ plano, dias: lote, publico, briefing }),
          })
          const data = await res.json() as { dias?: DiaConteudo[]; error?: string }
          if (data.error) throw new Error(data.error)
          allDias.push(...(data.dias ?? []))
        } catch {
          const calItems = plano.calendario.filter(c => lote.includes(c.dia))
          lote.forEach(d => {
            const cal = calItems.find(c => c.dia === d)
            allDias.push(makeMockDia(d, cal?.tema))
          })
        }

        setDias([...allDias])
        setProgress({ current: end, total: volume })
      }
    } finally {
      setGenerating(false)
      setCurrentBatch("")
      setExpandedDays([allDias[0]?.dia ?? 1])
    }
  }

  // ── Save / Export / Copy ────────────────────────────────────────────────────

  const saveAllToPautas = async () => {
    if (!dias.length) return
    setSaving(true)
    let saved = 0
    for (const d of dias) {
      const calItem = plano?.calendario.find(c => c.dia === d.dia)
      try {
        await fetch("/api/pautas", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            titulo:    `Dia ${d.dia}: ${d.reel.titulo}`,
            nota:      `Campanha: ${plano?.tema ?? ""}\nGancho: ${d.reel.gancho}\n\nLegenda:\n${d.legenda.texto}`,
            categoria: "Agente Executivo",
            prioridade:"Alta",
            estagio:   "Ideia",
            tags:      ["agente", calItem?.formato.toLowerCase() ?? "reel"],
          }),
        })
        saved++
      } catch { /* continue */ }
    }
    setSaving(false)
    setAllSaved(true)
    showToast(`${saved} dia${saved !== 1 ? "s" : ""} salvo${saved !== 1 ? "s" : ""} no Banco de Pautas!`)
  }

  const copyAll = () => {
    const lines: string[] = [`PLANO DE CONTEÚDO: ${plano?.tema ?? ""}\n`]
    if (plano) lines.push(`Pilares: ${plano.pilares.join(" | ")}`, "")
    for (const d of dias) {
      lines.push("═".repeat(60), `DIA ${d.dia}`, "═".repeat(60))
      lines.push("", "📱 REEL", `Título: ${d.reel.titulo}`, `\nGancho:\n${d.reel.gancho}`, `\nRoteiro:\n${d.reel.roteiro.join("\n")}`, `\nCTA: ${d.reel.cta}`)
      lines.push("", "🖼️ IMAGEM", `Headline: ${d.imagem.headline}`, `Prompt: ${d.imagem.prompt}`, `Estilo: ${d.imagem.estilo}`)
      lines.push("", "📝 LEGENDA", d.legenda.texto, d.legenda.hashtags.join(" "))
      lines.push("", "📱 STORY", ...d.story.slides.map((s, i) => `Slide ${i + 1}: ${s}`), "")
    }
    navigator.clipboard.writeText(lines.join("\n"))
      .then(() => showToast("Conteúdo completo copiado!"))
      .catch(() => showToast("Erro ao copiar. Tente novamente."))
  }

  const exportarPDF = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Plano: ${plano?.tema ?? ""}</title>
<style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:40px auto;color:#111;padding:0 20px}h1{color:#00c07f;border-bottom:3px solid #00c07f;padding-bottom:10px;font-size:22px}h2{background:#f0fdf9;color:#065f46;padding:8px 16px;border-radius:6px;margin-top:32px;font-size:16px}h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:16px 0 6px}.dia{break-inside:avoid;margin-bottom:40px;border:1px solid #e5e7eb;border-radius:8px;padding:20px}p{line-height:1.7;color:#374151;margin:4px 0}ul{padding-left:20px;margin:6px 0}li{margin:4px 0;color:#374151}.ht{color:#3b7fff}</style>
</head><body>`
    html += `<h1>📋 ${plano?.tema ?? "Plano de Conteúdo"}</h1>`
    if (plano) html += `<p><b>Briefing:</b> ${briefing}</p><p><b>Público:</b> ${publico}</p><p><b>Pilares:</b> ${plano.pilares.join(" · ")}</p><p><b>Volume:</b> ${volume} dias</p>`
    for (const d of dias) {
      const cal = plano?.calendario.find(c => c.dia === d.dia)
      html += `<div class="dia"><h2>Dia ${d.dia}${cal ? ` — ${cal.tema}` : ""}</h2>`
      html += `<h3>📱 Reel</h3><p><b>${d.reel.titulo}</b></p><p><i>${d.reel.gancho.replace(/\n/g, "<br>")}</i></p><ul>${d.reel.roteiro.map(r => `<li>${r}</li>`).join("")}</ul><p><b>CTA:</b> ${d.reel.cta}</p>`
      html += `<h3>🖼️ Imagem</h3><p><b>${d.imagem.headline}</b></p><p>${d.imagem.prompt}</p><p><b>Estilo:</b> ${d.imagem.estilo}</p>`
      html += `<h3>📝 Legenda</h3><p>${d.legenda.texto.replace(/\n/g, "<br>")}</p><p class="ht">${d.legenda.hashtags.join(" ")}</p>`
      html += `<h3>📱 Story</h3><ul>${d.story.slides.map((s, i) => `<li><b>Slide ${i + 1}:</b> ${s}</li>`).join("")}</ul></div>`
    }
    html += `</body></html>`
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500) }
  }

  const exportarPDFCalendario = () => {
    const calCells: (CalCell | null)[] = []
    for (let i = 1; i <= volume; i++) {
      const item = plano?.calendario.find(c => c.dia === i) ?? { dia: i, tema: `Dia ${i}`, formato: "" }
      calCells.push(item)
    }
    while (calCells.length % 7 !== 0) calCells.push(null)

    const CAL_COLORS: Record<string, string> = {
      "Reel": "#f0fdf4", "Story": "#faf5ff", "Carrossel": "#eff6ff", "Post": "#fefce8",
    }
    let calRows = ""
    for (let i = 0; i < calCells.length; i += 7) {
      calRows += "<tr>"
      for (let j = i; j < i + 7; j++) {
        const cell = calCells[j]
        if (!cell) {
          calRows += `<td style="background:#f9fafb;border:1px solid #e5e7eb;min-height:80px;"></td>`
        } else {
          const bg = CAL_COLORS[cell.formato] ?? "#f9fafb"
          calRows += `<td style="background:${bg};border:1px solid #e5e7eb;padding:8px;vertical-align:top;min-height:80px;width:calc(100%/7)">
            <div style="font-size:10px;color:#9ca3af;font-family:monospace;margin-bottom:4px">${cell.dia}</div>
            <div style="font-size:11px;color:#111827;line-height:1.4">${cell.tema}</div>
            ${cell.formato ? `<div style="font-size:9px;font-family:monospace;font-weight:700;color:#374151;margin-top:4px">${cell.formato.toUpperCase()}</div>` : ""}
          </td>`
        }
      }
      calRows += "</tr>"
    }

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Calendário: ${plano?.tema ?? ""}</title>
<style>
body{font-family:-apple-system,sans-serif;max-width:1100px;margin:32px auto;color:#111;padding:0 20px}
h1{color:#00c07f;border-bottom:3px solid #00c07f;padding-bottom:10px;font-size:22px}
.cal-table{border-collapse:collapse;width:100%;margin:20px 0;table-layout:fixed}
.cal-table th{background:#00c07f;color:white;padding:10px;text-align:center;font-size:12px;font-weight:600}
.page-break{page-break-after:always;margin-bottom:32px}
h2{background:#f0fdf9;color:#065f46;padding:8px 16px;border-radius:6px;margin-top:32px;font-size:16px}
h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin:16px 0 6px}
.dia{break-inside:avoid;margin-bottom:32px;border:1px solid #e5e7eb;border-radius:8px;padding:20px}
p{line-height:1.7;color:#374151;margin:4px 0}ul{padding-left:20px;margin:6px 0}li{margin:4px 0;color:#374151}
</style>
</head><body>
<h1>📅 Calendário de Conteúdo: ${plano?.tema ?? ""}</h1>
<p><b>Briefing:</b> ${briefing}</p><p><b>Público:</b> ${publico}</p><p><b>Volume:</b> ${volume} dias</p>
<div class="page-break">
  <table class="cal-table">
    <tr>${WEEK_LABELS.map(d => `<th>${d}</th>`).join("")}</tr>
    ${calRows}
  </table>
  <div style="margin-top:16px;display:flex;gap:16px;font-size:11px;align-items:center">
    <span style="color:#6b7280">Legenda:</span>
    <span style="background:#f0fdf4;padding:3px 10px;border-radius:4px;border:1px solid #bbf7d0">Reel</span>
    <span style="background:#faf5ff;padding:3px 10px;border-radius:4px;border:1px solid #e9d5ff">Story</span>
    <span style="background:#eff6ff;padding:3px 10px;border-radius:4px;border:1px solid #bfdbfe">Carrossel</span>
    <span style="background:#fefce8;padding:3px 10px;border-radius:4px;border:1px solid #fef08a">Post</span>
  </div>
</div>`

    for (const d of dias) {
      const cal = plano?.calendario.find(c => c.dia === d.dia)
      html += `<div class="dia"><h2>Dia ${d.dia}${cal ? ` — ${cal.tema}` : ""}</h2>`
      html += `<h3>📱 Reel</h3><p><b>${d.reel.titulo}</b></p><p><i>${d.reel.gancho.replace(/\n/g, "<br>")}</i></p><ul>${d.reel.roteiro.map(r => `<li>${r}</li>`).join("")}</ul><p><b>CTA:</b> ${d.reel.cta}</p>`
      html += `<h3>🖼️ Imagem</h3><p><b>${d.imagem.headline}</b></p><p>${d.imagem.prompt}</p><p><b>Estilo:</b> ${d.imagem.estilo}</p>`
      html += `<h3>📝 Legenda</h3><p>${d.legenda.texto.replace(/\n/g, "<br>")}</p>`
      html += `<h3>📱 Story</h3><ul>${d.story.slides.map((s, i) => `<li><b>Slide ${i + 1}:</b> ${s}</li>`).join("")}</ul></div>`
    }
    html += "</body></html>"
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500) }
  }

  const resetar = () => {
    setStage("briefing"); setPlano(null); setDias([])
    setPlanoError(null); setAllSaved(false); setExpandedDays([])
    setViewMode("lista"); setCalendarDay(null)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Agente Executivo"
        subtitle="DESCREVA O QUE VOCÊ PRECISA · CONTEÚDO COMPLETO PRONTO PARA PUBLICAR"
        actions={
          stage !== "briefing" ? (
            <button onClick={resetar} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-colors">
              <RefreshCw className="w-3 h-3" /> Nova missão
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* ── STAGE 1: BRIEFING ─────────────────────────────────────────── */}
        {stage === "briefing" && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-text-primary">O que você precisa criar?</h2>
                  <p className="text-[12px] text-text-muted mt-0.5">Descreva em linguagem natural. O Agente planeja e entrega tudo: roteiros, capas, legendas e stories.</p>
                </div>
              </div>
              <textarea
                value={briefing}
                onChange={e => setBriefing(e.target.value)}
                rows={4}
                placeholder="Ex: Preciso de 30 dias de conteúdo para mulheres de 45 anos com dificuldade para emagrecer. Foco em hormônios, menopausa e resistência à insulina."
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-base md:text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none leading-relaxed"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-[10px] font-mono text-text-muted self-center">Exemplos:</span>
                {EXEMPLOS.map((ex, i) => (
                  <button key={i} onClick={() => setBriefing(ex)}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all">
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-3">Volume de conteúdo</label>
                <div className="flex gap-2">
                  {VOLUMES.map(v => (
                    <button key={v} onClick={() => setVolume(v)}
                      className={cn(
                        "flex-1 py-3 rounded-lg border text-[13px] font-bold transition-all",
                        volume === v ? "bg-accent-dim border-accent-border text-accent" : "border-border text-text-muted hover:text-text-secondary"
                      )}>
                      {v} dias
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-3">Público-alvo</label>
                <input
                  value={publico}
                  onChange={e => setPublico(e.target.value)}
                  placeholder="Ex: Mulheres 40-55 anos, climatério"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-base md:text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={executarMissao}
              disabled={!briefing.trim()}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-accent text-background text-[15px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Bot className="w-5 h-5" />
              Executar Missão
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STAGE 2: PLANEJAMENTO ─────────────────────────────────────── */}
        {stage === "planejamento" && (
          <div className="space-y-5">
            {planejando && (
              <div className="bg-card border border-border rounded-xl py-16 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <Bot className="w-12 h-12 text-accent" />
                  <Loader2 className="w-5 h-5 text-accent animate-spin absolute -bottom-1 -right-1" />
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-semibold text-text-primary">Agente planejando sua campanha...</div>
                  <div className="text-[10px] font-mono text-text-muted tracking-widest mt-1">ANALISANDO BRIEFING · ESTRUTURANDO CALENDÁRIO</div>
                </div>
              </div>
            )}

            {planoError && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 leading-relaxed">{planoError}</p>
              </div>
            )}

            {!planejando && plano && (
              <>
                <div className="bg-card border border-accent-border/60 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-accent" />
                    <span className="text-[12px] font-mono text-accent uppercase tracking-wider">Plano aprovado pelo Agente</span>
                  </div>
                  <h3 className="text-[18px] font-bold text-text-primary mb-4">{plano.tema}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-2">Pilares editoriais</div>
                      <div className="space-y-1.5">
                        {(plano.pilares ?? []).map((p, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                            <span className="text-[12px] text-text-secondary">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-2">Distribuição de formatos</div>
                      <div className="space-y-1.5">
                        {[
                          { label: "Reels",      value: plano.distribuicao?.reels      ?? 0, color: "text-blue-400",   bg: "bg-blue-500"   },
                          { label: "Stories",    value: plano.distribuicao?.stories    ?? 0, color: "text-purple-400", bg: "bg-purple-500" },
                          { label: "Carrosséis", value: plano.distribuicao?.carrosseis ?? 0, color: "text-amber-400",  bg: "bg-amber-500"  },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-2">
                            <span className={cn("text-[11px] font-bold font-mono w-4", item.color)}>{item.value}</span>
                            <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", item.bg)} style={{ width: `${(item.value / volume) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-text-muted">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[11px] font-semibold text-text-primary">Calendário dia a dia</span>
                    <span className="text-[9px] font-mono text-text-muted ml-auto">{volume} dias</span>
                  </div>
                  <div className="divide-y divide-border">
                    {(plano.calendario ?? []).map(item => (
                      <div key={item.dia} className="flex items-center gap-4 px-5 py-2.5 hover:bg-white/[0.02] transition-colors">
                        <span className="text-[11px] font-mono font-bold text-accent w-10 flex-shrink-0">Dia {item.dia}</span>
                        <p className="flex-1 text-[12px] text-text-secondary leading-snug">{item.tema}</p>
                        <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border flex-shrink-0", FORMATO_BADGE[item.formato] ?? "bg-white/[0.06] border-border text-text-muted")}>
                          {item.formato}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={gerarTudo}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-colors">
                    <Sparkles className="w-4 h-4" />
                    Aprovar e Gerar Tudo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setStage("briefing"); setPlano(null) }}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-border text-text-secondary text-[13px] font-medium hover:text-text-primary transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Ajustar Plano
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STAGE 3: ENTREGA ──────────────────────────────────────────── */}
        {stage === "entrega" && (
          <div className="space-y-5">

            {/* Progress bar */}
            {generating && (
              <div className="bg-card border border-accent-border/60 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-accent animate-pulse" />
                    <span className="text-[12px] font-semibold text-text-primary">{currentBatch || "Iniciando geração..."}</span>
                  </div>
                  <span className="text-[11px] font-mono text-accent">{progress.current}/{progress.total} dias</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                </div>
                <div className="flex gap-1 mt-2.5 flex-wrap">
                  {Array.from({ length: progress.total }, (_, i) => i + 1).map(d => (
                    <div key={d} className={cn(
                      "w-6 h-6 rounded-md text-[9px] font-mono font-bold flex items-center justify-center transition-all",
                      d <= progress.current
                        ? "bg-accent text-background"
                        : d === progress.current + 1 && generating
                          ? "bg-accent/30 border border-accent/60 text-accent animate-pulse"
                          : "bg-background border border-border text-text-muted"
                    )}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {dias.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-text-secondary">
                    <span className="font-semibold text-text-primary">{dias.length}</span> dia{dias.length !== 1 ? "s" : ""} gerado{dias.length !== 1 ? "s" : ""}
                    {generating && <span className="text-text-muted"> · gerando mais...</span>}
                  </p>
                </div>
                <button onClick={saveAllToPautas} disabled={saving || allSaved}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold border transition-all",
                    allSaved
                      ? "bg-accent-dim border-accent-border text-accent cursor-default"
                      : "border-border text-text-muted hover:border-accent-border hover:text-accent"
                  )}>
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</>
                    : allSaved ? <><Check className="w-3.5 h-3.5" /> Tudo salvo!</>
                      : <><BookOpen className="w-3.5 h-3.5" /> Salvar Tudo no Banco de Pautas</>}
                </button>
                {viewMode === "calendario" ? (
                  <button onClick={exportarPDFCalendario} disabled={dias.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all disabled:opacity-40">
                    <Download className="w-3.5 h-3.5" /> Exportar Calendário PDF
                  </button>
                ) : (
                  <button onClick={exportarPDF} disabled={dias.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all disabled:opacity-40">
                    <Download className="w-3.5 h-3.5" /> Exportar como PDF
                  </button>
                )}
                <button onClick={copyAll} disabled={dias.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all disabled:opacity-40">
                  <Copy className="w-3.5 h-3.5" /> Copiar Tudo
                </button>
                {viewMode === "lista" && (
                  <button onClick={() => setExpandedDays(dias.map(d => d.dia))}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] border border-border text-text-muted hover:text-text-secondary transition-colors">
                    <ChevronDown className="w-3 h-3" /> Expandir todos
                  </button>
                )}
              </div>
            )}

            {/* View mode toggle */}
            {dias.length > 0 && !generating && (
              <div className="flex items-center gap-1 p-1 bg-background rounded-lg border border-border w-fit">
                <button
                  onClick={() => setViewMode("lista")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                    viewMode === "lista" ? "bg-card border border-border text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <List className="w-3 h-3" /> Lista
                </button>
                <button
                  onClick={() => setViewMode("calendario")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                    viewMode === "calendario" ? "bg-card border border-border text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  <Calendar className="w-3 h-3" /> Calendário
                </button>
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {viewMode === "lista" && (
              <div className="space-y-2">
                {dias.map(d => {
                  const calItem    = plano?.calendario.find(c => c.dia === d.dia)
                  const isOpen     = expandedDays.includes(d.dia)
                  const curSection = activeSections[d.dia] ?? "reel"

                  return (
                    <div key={d.dia} className="bg-card border border-border rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleDay(d.dia)}
                        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold font-mono text-accent">{d.dia}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-text-primary leading-snug truncate">
                            {calItem?.tema ?? d.reel.titulo}
                          </p>
                          <p className="text-[10px] text-text-muted mt-0.5 truncate">{d.reel.titulo}</p>
                        </div>
                        {calItem && (
                          <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border flex-shrink-0", FORMATO_BADGE[calItem.formato] ?? "bg-white/[0.06] border-border text-text-muted")}>
                            {calItem.formato}
                          </span>
                        )}
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />}
                      </button>

                      {isOpen && (
                        <div className="border-t border-border">
                          <div className="flex gap-0.5 px-4 pt-3">
                            {CONTENT_TABS.map(({ key, label, Icon }) => (
                              <button key={key} onClick={() => setSection(d.dia, key)}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                                  curSection === key ? "bg-accent-dim border border-accent-border text-accent" : "text-text-muted hover:text-text-secondary"
                                )}>
                                <Icon className="w-3 h-3" />{label}
                              </button>
                            ))}
                          </div>
                          <div className="px-5 pb-5 pt-3">
                            {curSection === "reel" && (
                              <div className="space-y-4">
                                <div>
                                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Título do Reel</div>
                                  <p className="text-[13px] font-bold text-text-primary">{d.reel.titulo}</p>
                                </div>
                                <div>
                                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Gancho de abertura</div>
                                  <p className="text-[12px] text-text-secondary italic leading-relaxed whitespace-pre-line bg-background border border-border rounded-lg px-4 py-3">{d.reel.gancho}</p>
                                </div>
                                <div>
                                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Roteiro (60s)</div>
                                  <div className="space-y-1.5">
                                    {(d.reel.roteiro ?? []).map((ponto, pi) => (
                                      <div key={pi} className="flex items-start gap-2.5">
                                        <span className="text-[9px] font-bold font-mono text-accent flex-shrink-0 mt-1">{pi + 1}</span>
                                        <p className="text-[11px] text-text-secondary leading-snug">{ponto.replace(/^\d+\.\s*/, "")}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="bg-accent-dim border border-accent-border rounded-lg px-4 py-2.5 flex items-start gap-2">
                                  <Zap className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-[8px] font-mono text-accent uppercase tracking-wider mb-0.5">CTA</div>
                                    <p className="text-[11px] text-accent/90">{d.reel.cta}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {curSection === "imagem" && (
                              <div className="space-y-4">
                                <div>
                                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Headline da Arte</div>
                                  <p className="text-[18px] font-black text-text-primary leading-tight">{d.imagem.headline}</p>
                                </div>
                                <div className="bg-background border border-border rounded-lg p-4 space-y-3">
                                  <div>
                                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Prompt para IA</div>
                                    <p className="text-[12px] text-text-secondary leading-relaxed">{d.imagem.prompt}</p>
                                    <button onClick={() => navigator.clipboard.writeText(d.imagem.prompt).then(() => showToast("Prompt copiado!"))}
                                      className="mt-2 flex items-center gap-1.5 text-[10px] text-text-muted hover:text-accent transition-colors">
                                      <Copy className="w-3 h-3" /> Copiar prompt
                                    </button>
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Estilo recomendado</div>
                                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-border text-text-secondary bg-white/[0.04]">{d.imagem.estilo}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            {curSection === "legenda" && (
                              <div className="space-y-4">
                                <div>
                                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Legenda completa</div>
                                  <div className="bg-background border border-border rounded-lg px-4 py-3">
                                    <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{d.legenda.texto}</p>
                                    <button onClick={() => navigator.clipboard.writeText(`${d.legenda.texto}\n\n${d.legenda.hashtags.join(" ")}`).then(() => showToast("Legenda copiada!"))}
                                      className="mt-3 flex items-center gap-1.5 text-[10px] text-text-muted hover:text-accent transition-colors">
                                      <Copy className="w-3 h-3" /> Copiar legenda
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-2">Hashtags</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(d.legenda.hashtags ?? []).map((h, hi) => (
                                      <span key={hi} className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">{h}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            {curSection === "story" && (
                              <div className="space-y-3">
                                <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Sequência de 3 slides</div>
                                {(d.story.slides ?? []).map((slide, si) => (
                                  <div key={si} className="bg-background border border-border rounded-lg p-4">
                                    <div className="text-[8px] font-mono text-text-muted uppercase mb-2 flex items-center gap-1.5">
                                      <MessageSquare className="w-2.5 h-2.5" /> Slide {si + 1}
                                    </div>
                                    <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{slide}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── CALENDAR VIEW ── */}
            {viewMode === "calendario" && dias.length > 0 && (() => {
              const calendarCells: (CalCell | null)[] = []
              for (let i = 1; i <= volume; i++) {
                const item = plano?.calendario.find(c => c.dia === i) ?? { dia: i, tema: `Dia ${i}`, formato: "" }
                calendarCells.push(item)
              }
              while (calendarCells.length % 7 !== 0) calendarCells.push(null)

              return (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[11px] font-semibold text-text-primary">Calendário do Plano</span>
                      <span className="text-[9px] font-mono text-text-muted">{volume} dias · {Math.ceil(volume / 7)} semana{Math.ceil(volume / 7) !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Week day headers */}
                    <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                      {WEEK_LABELS.map(d => (
                        <div key={d} className="text-[9px] font-mono text-text-muted text-center uppercase tracking-wider py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {calendarCells.map((cell, idx) => {
                        if (!cell) {
                          return <div key={idx} className="min-h-[80px] rounded-lg bg-background/30" />
                        }
                        const diaContent = dias.find(d => d.dia === cell.dia)
                        const bg        = FORMATO_CAL_BG[cell.formato] ?? "bg-white/[0.03] border-white/[0.06]"
                        const tc        = FORMATO_CAL_TEXT[cell.formato] ?? "text-text-muted"
                        const Icon      = FORMATO_CAL_ICON[cell.formato]

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (diaContent) { setCalendarDay(diaContent); setCalModalSec("reel") }
                            }}
                            title={cell.tema}
                            className={cn(
                              "relative text-left rounded-lg border p-2 min-h-[80px] transition-all",
                              bg,
                              diaContent ? "cursor-pointer hover:scale-[1.03] hover:shadow-lg" : "cursor-default opacity-50"
                            )}
                          >
                            <span className="text-[8px] font-mono text-text-muted block mb-1 leading-none">{cell.dia}</span>
                            <p className="text-[9px] text-text-primary leading-snug line-clamp-2 mb-1.5">{cell.tema}</p>
                            {cell.formato && Icon && (
                              <div className={cn("flex items-center gap-1", tc)}>
                                <Icon className="w-2.5 h-2.5" />
                                <span className="text-[7px] font-mono font-semibold">{cell.formato.toUpperCase()}</span>
                              </div>
                            )}
                            {diaContent && (
                              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent/60" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border flex-wrap">
                      <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Legenda:</span>
                      {[
                        { label: "Reel",      dot: "bg-accent" },
                        { label: "Story",     dot: "bg-purple-400" },
                        { label: "Carrossel", dot: "bg-blue-400" },
                        { label: "Post",      dot: "bg-amber-400" },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-1.5">
                          <div className={cn("w-2 h-2 rounded-sm flex-shrink-0", item.dot)} />
                          <span className="text-[9px] text-text-muted">{item.label}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                        <span className="text-[9px] text-text-muted">Conteúdo gerado</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Empty/loading state */}
            {dias.length === 0 && generating && (
              <div className="bg-card border border-border rounded-xl py-16 flex flex-col items-center justify-center gap-4">
                <Bot className="w-10 h-10 text-accent animate-pulse" />
                <div className="text-center">
                  <div className="text-[13px] font-semibold text-text-primary">Agente trabalhando...</div>
                  <div className="text-[10px] font-mono text-text-muted mt-1">O primeiro lote aparecerá em segundos</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Calendar Day Modal ──────────────────────────────────────────────────── */}
      {calendarDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,9,14,0.9)", backdropFilter: "blur(4px)" }}
          onClick={() => setCalendarDay(null)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden flex flex-col"
            style={{ maxHeight: "88vh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-md bg-accent-dim border border-accent-border flex items-center justify-center">
                    <span className="text-[9px] font-bold font-mono text-accent">{calendarDay.dia}</span>
                  </div>
                  {(() => {
                    const cal = plano?.calendario.find(c => c.dia === calendarDay.dia)
                    return cal?.formato ? (
                      <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", FORMATO_BADGE[cal.formato] ?? "border-border text-text-muted")}>
                        {cal.formato}
                      </span>
                    ) : null
                  })()}
                </div>
                <div className="text-[14px] font-bold text-text-primary leading-snug">
                  {plano?.calendario.find(c => c.dia === calendarDay.dia)?.tema ?? calendarDay.reel.titulo}
                </div>
              </div>
              <button
                onClick={() => setCalendarDay(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content tabs */}
            <div className="flex gap-0.5 px-4 pt-3 flex-shrink-0">
              {CONTENT_TABS.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setCalModalSec(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                    calModalSec === key ? "bg-accent-dim border border-accent-border text-accent" : "text-text-muted hover:text-text-secondary"
                  )}>
                  <Icon className="w-3 h-3" />{label}
                </button>
              ))}
            </div>

            {/* Modal content body */}
            <div className="overflow-y-auto flex-1 px-5 pb-5 pt-3">
              {calModalSec === "reel" && (
                <div className="space-y-4">
                  <div>
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Título do Reel</div>
                    <p className="text-[13px] font-bold text-text-primary">{calendarDay.reel.titulo}</p>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Gancho de abertura</div>
                    <p className="text-[12px] text-text-secondary italic leading-relaxed whitespace-pre-line bg-background border border-border rounded-lg px-4 py-3">{calendarDay.reel.gancho}</p>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Roteiro (60s)</div>
                    <div className="space-y-1.5">
                      {(calendarDay.reel.roteiro ?? []).map((ponto, pi) => (
                        <div key={pi} className="flex items-start gap-2.5">
                          <span className="text-[9px] font-bold font-mono text-accent flex-shrink-0 mt-1">{pi + 1}</span>
                          <p className="text-[11px] text-text-secondary leading-snug">{ponto.replace(/^\d+\.\s*/, "")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-accent-dim border border-accent-border rounded-lg px-4 py-2.5 flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[8px] font-mono text-accent uppercase tracking-wider mb-0.5">CTA</div>
                      <p className="text-[11px] text-accent/90">{calendarDay.reel.cta}</p>
                    </div>
                  </div>
                </div>
              )}
              {calModalSec === "imagem" && (
                <div className="space-y-4">
                  <div>
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Headline da Arte</div>
                    <p className="text-[18px] font-black text-text-primary leading-tight">{calendarDay.imagem.headline}</p>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-4 space-y-3">
                    <div>
                      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Prompt para IA</div>
                      <p className="text-[12px] text-text-secondary leading-relaxed">{calendarDay.imagem.prompt}</p>
                      <button onClick={() => navigator.clipboard.writeText(calendarDay.imagem.prompt).then(() => showToast("Prompt copiado!"))}
                        className="mt-2 flex items-center gap-1.5 text-[10px] text-text-muted hover:text-accent transition-colors">
                        <Copy className="w-3 h-3" /> Copiar prompt
                      </button>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">Estilo recomendado</div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-border text-text-secondary bg-white/[0.04]">{calendarDay.imagem.estilo}</span>
                    </div>
                  </div>
                </div>
              )}
              {calModalSec === "legenda" && (
                <div className="space-y-4">
                  <div>
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">Legenda completa</div>
                    <div className="bg-background border border-border rounded-lg px-4 py-3">
                      <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{calendarDay.legenda.texto}</p>
                      <button onClick={() => navigator.clipboard.writeText(`${calendarDay.legenda.texto}\n\n${calendarDay.legenda.hashtags.join(" ")}`).then(() => showToast("Legenda copiada!"))}
                        className="mt-3 flex items-center gap-1.5 text-[10px] text-text-muted hover:text-accent transition-colors">
                        <Copy className="w-3 h-3" /> Copiar legenda
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-2">Hashtags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(calendarDay.legenda.hashtags ?? []).map((h, hi) => (
                        <span key={hi} className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">{h}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {calModalSec === "story" && (
                <div className="space-y-3">
                  <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Sequência de slides</div>
                  {(calendarDay.story.slides ?? []).map((slide, si) => (
                    <div key={si} className="bg-background border border-border rounded-lg p-4">
                      <div className="text-[8px] font-mono text-text-muted uppercase mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-2.5 h-2.5" /> Slide {si + 1}
                      </div>
                      <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{slide}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          <Check className="w-3.5 h-3.5 flex-shrink-0" /> {toast}
        </div>
      )}
    </div>
  )
}
