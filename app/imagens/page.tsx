"use client"

import { useState, useRef, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import {
  Wand2, RefreshCw, Download, Copy, Check,
  ChevronDown, ChevronUp, Sparkles, Edit3,
  Image as ImageIcon, History, AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Formato  = "story" | "reels" | "retrato" | "quadrado"
type Modelo   = "gpt-image" | "gemini" | "flux"
type EstiloId =
  | "card-premium" | "luxo-editorial"  | "capa-reels"   | "story-impacto"
  | "carrossel-medico" | "antes-depois" | "foto-institucional"
  | "anuncio-premium"  | "campanha"     | "autoridade"

interface PromptParts {
  conceito:    string
  direcao:     string
  composicao:  string
  iluminacao:  string
  tipografia:  string
  elementos:   string
  negativo:    string
  promptFinal: string
}

interface HistoryItem {
  id:        number
  imageUrl:  string
  prompt:    string
  formato:   string
  estilo:    string
  audit:     string
  timestamp: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMATOS: Record<Formato, { label: string; ratio: string; wR: number; hR: number; desc: string; apiRatio: string }> = {
  story:    { label:"Story",       ratio:"9:16", wR:9,  hR:16, desc:"Vertical · Stories",   apiRatio:"9:16" },
  reels:    { label:"Reels Cover", ratio:"9:16", wR:9,  hR:16, desc:"Capa de Reels",        apiRatio:"9:16" },
  retrato:  { label:"Retrato",     ratio:"4:5",  wR:4,  hR:5,  desc:"Feed Retrato · 4:5",  apiRatio:"4:5"  },
  quadrado: { label:"Quadrado",    ratio:"1:1",  wR:1,  hR:1,  desc:"Feed Quadrado · 1:1", apiRatio:"1:1"  },
}

const ESTILOS: Record<EstiloId, { label: string; desc: string; prompt: string }> = {
  "card-premium":       { label:"Card Premium",         desc:"Editorial minimalista, headline central, muito respiro",        prompt:"minimalist editorial card, centered headline, maximum breathing space, clean luxury layout, single focal point, typography-driven" },
  "luxo-editorial":     { label:"Card Luxo Editorial",  desc:"Texturas metálicas sutis, iluminação dramática lateral",       prompt:"luxury editorial, subtle metallic textures, dramatic side lighting, chiaroscuro shadows, high-end magazine aesthetic" },
  "capa-reels":         { label:"Capa de Reels",        desc:"Impacto máximo em 1 segundo, headline enorme",                prompt:"maximum social media visual impact, oversized bold headline, dark vibrant background, instant attention-grabbing composition" },
  "story-impacto":      { label:"Story Impacto",        desc:"Vertical 9:16, composição centralizada, CTA implícito",       prompt:"vertical 9:16 social story, centered power composition, strong visual hierarchy, implicit call-to-action energy" },
  "carrossel-medico":   { label:"Carrossel Médico",     desc:"Slide conceitual com hierarquia visual clara",                prompt:"conceptual medical carousel slide, clear visual hierarchy, educational layout, clean information architecture" },
  "antes-depois":       { label:"Antes e Depois",       desc:"Divisão visual simbólica, sem fotos reais",                   prompt:"symbolic visual split composition, before/after concept without real photos, abstract representation, conceptual duality" },
  "foto-institucional": { label:"Foto Institucional",   desc:"Médico/autoridade, iluminação de estúdio premium",            prompt:"professional medical authority portrait, premium studio lighting, institutional gravitas, expert positioning" },
  "anuncio-premium":    { label:"Anúncio Premium",      desc:"Composição de campanha publicitária médica",                  prompt:"high-end medical advertising campaign, luxury product placement, premium brand communication, editorial ad aesthetic" },
  "campanha":           { label:"Campanha Conversão",   desc:"Urgência visual, headline de impacto, CTA visual",            prompt:"conversion campaign visual urgency, impactful headline composition, strong visual call-to-action, direct response design" },
  "autoridade":         { label:"Autoridade Médica",    desc:"Credibilidade, sofisticação, posicionamento de especialista", prompt:"medical expertise and authority, sophisticated positioning, specialist credibility, professional excellence" },
}

const MODELOS: Record<Modelo, { label: string; sub: string; note: string }> = {
  "gpt-image": { label:"GPT Image",     sub:"OpenAI · gpt-image-1",         note:"Melhor qualidade geral"           },
  "gemini":    { label:"Gemini Imagen", sub:"Google · imagen-3.0-generate",  note:"Ótimo para composições complexas" },
  "flux":      { label:"Flux Schnell",  sub:"HuggingFace · FLUX.1-schnell",  note:"Rápido e eficiente"               },
}

const PART_KEYS: (keyof Omit<PromptParts, "promptFinal">)[] = [
  "conceito","direcao","composicao","iluminacao","tipografia","elementos","negativo",
]
const PART_LABEL: Record<typeof PART_KEYS[number], string> = {
  conceito:"Conceito Visual", direcao:"Direção Artística", composicao:"Composição e Formato",
  iluminacao:"Iluminação e Textura", tipografia:"Tipografia", elementos:"Elementos Visuais", negativo:"Prompt Negativo",
}
const PART_ICON: Record<typeof PART_KEYS[number], string> = {
  conceito:"🎨", direcao:"🎬", composicao:"📐", iluminacao:"💡",
  tipografia:"✍️", elementos:"🖼️", negativo:"🚫",
}

const MSG_PROMPT = [
  "Analisando o tema...",
  "Elaborando conceito visual...",
  "Escrevendo direção artística...",
  "Compondo iluminação e textura...",
  "Finalizando prompt criativo...",
]
const MSG_IMAGE = [
  "Enviando para geração...",
  "Processando imagem...",
  "Renderizando detalhes...",
  "Quase pronto...",
]

const VISUAL_IDENTITY = `FIXED VISUAL IDENTITY (mandatory for every prompt):
- Background: sophisticated black graphite with texture (#08090e)
- Color palette: black graphite + emerald green (#00c07f) + ice white ONLY
- Lighting: cinematic lateral/dramatic, high contrast, 3D depth, chiaroscuro
- Style: ultra-premium editorial — Forbes, Bloomberg, Apple, luxury brand campaign
- Typography feeling: elegant, modern, luxury brand-grade
- Composition: ample breathing space, soft shadows, ultra-premium finish
- STRICT EXCLUSIONS: no Canva look, no generic templates, no clinical/hospital aesthetics, no excess elements, no multiple colors, no amateur composition`

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormatoCard({ id, active, onClick }: { id: Formato; active: boolean; onClick: () => void }) {
  const f   = FORMATOS[id]
  const MAX = 44
  const w   = Math.round(MAX * (f.wR / Math.max(f.wR, f.hR)))
  const h   = Math.round(MAX * (f.hR / Math.max(f.wR, f.hR)))
  return (
    <button onClick={onClick} className={cn(
      "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
      active ? "bg-accent-dim border-accent-border" : "border-border hover:border-border-hover"
    )}>
      <div className="flex items-center justify-center" style={{ width:44, height:50 }}>
        <div className={cn(
          "rounded-sm border-2 flex-shrink-0 transition-all",
          active ? "border-accent bg-accent/10" : "border-text-muted/40 bg-white/[0.04]"
        )} style={{ width:w, height:h }} />
      </div>
      <div className="text-center">
        <div className={cn("text-[11px] font-semibold leading-tight", active ? "text-accent" : "text-text-secondary")}>{f.label}</div>
        <div className="text-[9px] font-mono text-text-muted">{f.ratio}</div>
      </div>
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiretorCriativoPage() {
  const [formato,       setFormato]       = useState<Formato>("story")
  const [estilo,        setEstilo]        = useState<EstiloId>("card-premium")
  const [ideia,         setIdeia]         = useState("")
  const [modelo,        setModelo]        = useState<Modelo>("gpt-image")
  const [promptParts,   setPromptParts]   = useState<PromptParts | null>(null)
  const [editedPrompt,  setEditedPrompt]  = useState("")
  const [editMode,      setEditMode]      = useState(false)
  const [imageUrl,      setImageUrl]      = useState<string | null>(null)
  const [audit,         setAudit]         = useState<string | null>(null)
  const [history,       setHistory]       = useState<HistoryItem[]>([])
  const [selectedHist,  setSelectedHist]  = useState<HistoryItem | null>(null)
  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const [loadingImage,  setLoadingImage]  = useState(false)
  const [loadingAudit,  setLoadingAudit]  = useState(false)
  const [loadingMsg,    setLoadingMsg]    = useState("")
  const [error,         setError]         = useState<string | null>(null)
  const [copied,        setCopied]        = useState(false)
  const [expanded,      setExpanded]      = useState<string | null>(null)

  const msgTimer = useRef<ReturnType<typeof setInterval>>()

  const startMsgs = (msgs: string[], ms = 2200) => {
    let i = 0; setLoadingMsg(msgs[0])
    clearInterval(msgTimer.current)
    msgTimer.current = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]) }, ms)
  }
  const stopMsgs = () => { clearInterval(msgTimer.current); setLoadingMsg("") }

  // ── Step 1: Generate creative direction via Claude ──────────────────────────

  const gerarPrompt = async () => {
    if (!ideia.trim()) { setError("Digite o tema da sua arte antes de continuar."); return }
    setError(null); setLoadingPrompt(true); setPromptParts(null)
    setImageUrl(null); setAudit(null); setEditMode(false); setSelectedHist(null)
    startMsgs(MSG_PROMPT)

    try {
      const es = ESTILOS[estilo]
      const ft = FORMATOS[formato]

      const systemPrompt = `You are a world-class creative director specializing in ultra-premium luxury medical content for social media. Transform simple ideas into cinematic, editorial-grade visual prompts.

${VISUAL_IDENTITY}

Return ONLY valid JSON. No markdown. No code blocks. No explanation.`

      const userMsg = `Creative direction request:
THEME: ${ideia}
FORMAT: ${ft.label} (${ft.ratio} — ${ft.desc})
STYLE: ${es.label} — ${es.prompt}

Generate structured creative direction as JSON with exactly these fields:
{
  "conceito": "Visual concept — what the image represents and communicates (2-3 sentences in Portuguese)",
  "direcao": "Artistic direction — mood, tone, feeling, visual atmosphere (2-3 sentences in Portuguese)",
  "composicao": "Composition — specific layout for this format, element placement (2-3 sentences in Portuguese)",
  "iluminacao": "Lighting and texture — specific technical lighting (2-3 sentences in Portuguese)",
  "tipografia": "Typography — headline suggestion in Portuguese + font style description (2-3 sentences)",
  "elementos": "Visual elements — specific objects, symbols, materials to include (2-3 sentences in Portuguese)",
  "negativo": "Negative prompt — what to strictly avoid in this image (1-2 sentences in Portuguese)",
  "promptFinal": "The complete unified prompt IN ENGLISH for image generation — detailed, cinematographic, technical, 150-200 words combining all the above with the fixed visual identity"
}`

      const res  = await fetch("/api/roteiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1400,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
        }),
      })

      const data = await res.json()
      const raw  = (data.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim()
      const idx  = raw.indexOf("{")
      const parsed = JSON.parse(idx >= 0 ? raw.slice(idx) : raw) as PromptParts
      setPromptParts(parsed)
      setEditedPrompt(parsed.promptFinal)
    } catch (e) {
      setError("Erro ao gerar direção criativa: " + String(e))
    } finally {
      stopMsgs(); setLoadingPrompt(false)
    }
  }

  // ── Step 2: Send to image generation API ───────────────────────────────────

  const gerarImagem = async () => {
    const prompt = editMode ? editedPrompt : (promptParts?.promptFinal ?? "")
    if (!prompt) return
    setError(null); setLoadingImage(true); setImageUrl(null); setAudit(null)
    startMsgs(MSG_IMAGE, 2500)

    try {
      const res  = await fetch("/api/gerar-imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, formato: FORMATOS[formato].apiRatio, modelo }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.image) throw new Error("Nenhuma imagem retornada pela API.")

      setImageUrl(data.image)
      setSelectedHist(null)

      const newItem: HistoryItem = {
        id: Date.now(), imageUrl: data.image, prompt,
        formato: FORMATOS[formato].label, estilo: ESTILOS[estilo].label,
        audit: "", timestamp: new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" }),
      }
      setHistory(prev => [newItem, ...prev].slice(0, 5))
      auditarImagem(prompt, newItem.id)
    } catch (e) {
      setError("Erro ao gerar imagem: " + String(e))
    } finally {
      stopMsgs(); setLoadingImage(false)
    }
  }

  // ── Step 3: Visual audit ────────────────────────────────────────────────────

  const auditarImagem = useCallback(async (prompt: string, histId: number) => {
    setLoadingAudit(true)
    try {
      const res  = await fetch("/api/roteiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 300,
          messages: [{
            role: "user",
            content: `You are a creative director reviewing an AI-generated medical image. Prompt used: "${prompt.slice(0, 500)}".

Provide a brief visual audit in Brazilian Portuguese (3-4 sentences). Start with ✅ if likely successful or ⚠️ if issues expected. Evaluate: overall aesthetic quality expected, alignment with premium medical content brief, and one specific improvement suggestion.`,
          }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text ?? "Auditoria não disponível."
      setAudit(text)
      setHistory(prev => prev.map(h => h.id === histId ? { ...h, audit: text } : h))
    } catch {
      setAudit("Auditoria não disponível.")
    } finally {
      setLoadingAudit(false)
    }
  }, [])

  // ── Utilities ───────────────────────────────────────────────────────────────

  const downloadImage = () => {
    const url = selectedHist?.imageUrl ?? imageUrl
    if (!url) return
    const a = document.createElement("a")
    a.href = url; a.download = `diretor-criativo-${Date.now()}.png`; a.click()
  }

  const copyPrompt = async () => {
    const p = editMode ? editedPrompt : (promptParts?.promptFinal ?? "")
    if (!p) return
    await navigator.clipboard.writeText(p)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const displayImage = selectedHist?.imageUrl ?? imageUrl
  const displayAudit = selectedHist?.audit     ?? audit
  const anyLoading   = loadingPrompt || loadingImage

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Diretor Criativo IA"
        subtitle="DIREÇÃO CRIATIVA · GERAÇÃO DE IMAGENS · IDENTIDADE VISUAL"
        actions={
          anyLoading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {loadingMsg}
            </div>
          ) : undefined
        }
      />

      <div className="p-8">
        <div className="grid gap-6 items-start" style={{ gridTemplateColumns:"300px 1fr" }}>

          {/* ════════════════════════════════
              LEFT — CONFIG PANEL
          ════════════════════════════════ */}
          <div className="space-y-4 sticky top-8">

            {/* 1 — Formato */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-3">1 — Formato</div>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(FORMATOS) as Formato[]).map(f => (
                  <FormatoCard key={f} id={f} active={formato===f} onClick={() => setFormato(f)} />
                ))}
              </div>
            </div>

            {/* 2 — Estilo */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-3">2 — Estilo da Biblioteca</div>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1 -mr-1">
                {(Object.entries(ESTILOS) as [EstiloId, typeof ESTILOS[EstiloId]][]).map(([id, s]) => (
                  <button key={id} onClick={() => setEstilo(id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md border transition-all",
                      estilo===id ? "bg-accent-dim border-accent-border" : "border-transparent hover:bg-white/[0.03]"
                    )}>
                    <div className={cn("text-[12px] font-semibold leading-tight", estilo===id ? "text-accent" : "text-text-primary")}>{s.label}</div>
                    <div className="text-[10px] text-text-muted mt-0.5 leading-snug">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3 — Tema */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-3">3 — Tema da Arte</div>
              <textarea
                value={ideia}
                onChange={e => setIdeia(e.target.value)}
                placeholder="Ex: resistência à insulina, menopausa e hormônios, jejum intermitente..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none"
                rows={3}
              />
            </div>

            {/* 4 — Modelo */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-3">4 — Modelo de Geração</div>
              <div className="space-y-1.5">
                {(Object.entries(MODELOS) as [Modelo, typeof MODELOS[Modelo]][]).map(([id, m]) => (
                  <button key={id} onClick={() => setModelo(id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-md border transition-all flex items-start gap-3",
                      modelo===id ? "bg-accent-dim border-accent-border" : "border-transparent hover:bg-white/[0.03]"
                    )}>
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-[5px]", modelo===id ? "bg-accent" : "bg-text-muted/30")} />
                    <div>
                      <div className={cn("text-[12px] font-semibold", modelo===id ? "text-accent" : "text-text-primary")}>{m.label}</div>
                      <div className="text-[9px] font-mono text-text-muted">{m.sub}</div>
                      <div className="text-[9px] text-text-muted mt-0.5">{m.note}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Elaborate Button */}
            <button
              onClick={gerarPrompt}
              disabled={anyLoading || !ideia.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPrompt ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {loadingPrompt ? "Elaborando direção..." : "Elaborar Direção Criativa"}
            </button>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-3 h-3 text-text-muted" />
                  <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Histórico da Sessão</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {history.map(h => (
                    <button key={h.id}
                      onClick={() => setSelectedHist(selectedHist?.id===h.id ? null : h)}
                      title={`${h.estilo} · ${h.formato} · ${h.timestamp}`}
                      className={cn(
                        "relative rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                        selectedHist?.id===h.id ? "border-accent" : "border-transparent hover:border-border-hover"
                      )}
                      style={{ width:52, height:52 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={h.imageUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                {selectedHist && (
                  <p className="mt-2 text-[9px] text-text-muted font-mono">
                    {selectedHist.estilo} · {selectedHist.formato} · {selectedHist.timestamp}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ════════════════════════════════
              RIGHT — RESULTS PANEL
          ════════════════════════════════ */}
          <div className="space-y-5 min-w-0">

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 bg-red-950/40 border border-red-500/30 rounded-lg p-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-300 leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── Empty state ── */}
            {!promptParts && !loadingPrompt && !loadingImage && (
              <div className="bg-card border border-border rounded-lg p-14 flex flex-col items-center justify-center gap-5 min-h-[480px]">
                <div className="w-16 h-16 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-accent" />
                </div>
                <div className="text-center max-w-md">
                  <h3 className="text-[15px] font-semibold text-text-primary mb-2">Diretor Criativo IA</h3>
                  <p className="text-[12px] text-text-muted leading-relaxed">
                    Configure o formato, estilo e tema à esquerda. O Claude elaborará uma direção criativa cinematográfica com 7 componentes antes de enviar para geração de imagem.
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 w-full max-w-md mt-1">
                  {["Conceito Visual","Direção Artística","Iluminação","Prompt Final"].map(l => (
                    <div key={l} className="bg-background rounded-lg p-3 text-center">
                      <div className="text-[9px] text-text-muted leading-tight">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Loading: generating prompt ── */}
            {loadingPrompt && (
              <div className="bg-card border border-border rounded-lg p-14 flex flex-col items-center justify-center gap-5 min-h-[480px]">
                <Sparkles className="w-12 h-12 text-accent animate-pulse" />
                <div className="text-center">
                  <div className="text-[15px] font-semibold text-text-primary mb-1">{loadingMsg}</div>
                  <div className="text-[10px] font-mono text-text-muted tracking-widest">CLAUDE ELABORANDO DIREÇÃO CRIATIVA</div>
                </div>
              </div>
            )}

            {/* ── Prompt Components ── */}
            {promptParts && !loadingPrompt && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-text-primary">Direção Criativa Elaborada</h3>
                    <p className="text-[11px] text-text-muted mt-0.5">{ESTILOS[estilo].label} · {FORMATOS[formato].label} · {FORMATOS[formato].ratio}</p>
                  </div>
                  <button onClick={gerarPrompt} disabled={anyLoading}
                    className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-accent transition-colors disabled:opacity-40">
                    <RefreshCw className="w-3 h-3" /> Regenerar direção
                  </button>
                </div>

                {/* 7 components */}
                <div className="grid grid-cols-2 gap-2">
                  {PART_KEYS.map(key => (
                    <button key={key}
                      onClick={() => setExpanded(expanded===key ? null : key)}
                      className={cn(
                        "bg-card border border-border rounded-lg p-3 text-left hover:border-border-hover transition-all",
                        key==="negativo" && "col-span-2"
                      )}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span>{PART_ICON[key]}</span>
                          <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">{PART_LABEL[key]}</span>
                        </div>
                        {expanded===key
                          ? <ChevronUp   className="w-3 h-3 text-text-muted flex-shrink-0" />
                          : <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0" />}
                      </div>
                      <p className={cn("text-[11px] text-text-secondary leading-relaxed", expanded!==key && "line-clamp-2")}>
                        {promptParts[key]}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Unified final prompt */}
                <div className="bg-card border border-accent-border/40 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] font-mono text-accent uppercase tracking-wider">Prompt Final Unificado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditMode(!editMode); if (!editMode) setEditedPrompt(promptParts.promptFinal) }}
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md border transition-all",
                          editMode ? "bg-accent-dim border-accent-border text-accent" : "border-border text-text-muted hover:text-text-secondary"
                        )}>
                        <Edit3 className="w-3 h-3" />{editMode ? "Editando" : "Editar"}
                      </button>
                      <button onClick={copyPrompt}
                        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md border border-border text-text-muted hover:text-text-secondary transition-all">
                        {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  {editMode ? (
                    <textarea
                      value={editedPrompt}
                      onChange={e => setEditedPrompt(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[11px] text-text-primary font-mono outline-none focus:border-accent/40 transition-colors resize-none leading-relaxed"
                      rows={7}
                    />
                  ) : (
                    <p className="text-[11px] text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">
                      {promptParts.promptFinal}
                    </p>
                  )}
                </div>

                {/* Generate Image Button */}
                <button
                  onClick={gerarImagem}
                  disabled={loadingImage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                >
                  {loadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  {loadingImage ? loadingMsg : `Gerar Imagem · ${MODELOS[modelo].label}`}
                </button>
              </div>
            )}

            {/* ── Loading: generating image ── */}
            {loadingImage && (
              <div className="bg-card border border-border rounded-lg p-14 flex flex-col items-center justify-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-accent" />
                  </div>
                  <RefreshCw className="w-5 h-5 text-accent animate-spin absolute -top-1.5 -right-1.5" />
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-semibold text-text-primary mb-1">{loadingMsg}</div>
                  <div className="text-[9px] font-mono text-text-muted tracking-widest">PROCESSANDO VIA {MODELOS[modelo].label.toUpperCase()}</div>
                </div>
              </div>
            )}

            {/* ── Image Result ── */}
            {displayImage && !loadingImage && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-text-primary">Imagem Gerada</span>
                      {selectedHist && (
                        <span className="text-[9px] font-mono text-text-muted px-2 py-0.5 rounded bg-white/[0.04] border border-border">
                          Histórico · {selectedHist.timestamp}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={copyPrompt}
                        className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-all">
                        {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                        Copiar Prompt
                      </button>
                      {!selectedHist && promptParts && (
                        <button onClick={gerarImagem} disabled={loadingImage}
                          className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-all disabled:opacity-40">
                          <RefreshCw className="w-3 h-3" /> Regenerar
                        </button>
                      )}
                      <button onClick={downloadImage}
                        className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-accent-dim border border-accent-border text-accent hover:bg-accent/20 transition-all font-medium">
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center bg-background rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImage}
                      alt="Imagem gerada pelo Diretor Criativo IA"
                      className="max-w-full max-h-[640px] object-contain rounded"
                    />
                  </div>
                </div>

                {/* Visual Audit */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Auditoria Visual Automática</span>
                    {loadingAudit && <RefreshCw className="w-3 h-3 text-text-muted animate-spin ml-auto" />}
                  </div>
                  {displayAudit ? (
                    <p className="text-[12px] text-text-secondary leading-relaxed">{displayAudit}</p>
                  ) : loadingAudit ? (
                    <p className="text-[11px] text-text-muted font-mono">Analisando resultado...</p>
                  ) : (
                    <p className="text-[11px] text-text-muted">Auditoria não disponível para este item do histórico.</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
