"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import {
  Wand2, RefreshCw, Download, Copy, Check,
  ChevronDown, ChevronUp, Sparkles, Edit3,
  Image as ImageIcon, History, AlertCircle,
  BookOpen, X, Search, Loader2, TrendingUp, Layers2,
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

interface Variacao {
  url:    string
  prompt: string
  label:  string
}

interface Pauta {
  id:         number | string
  titulo:     string
  categoria:  string
  prioridade: string
  nota?:      string
  estagio?:   string
}

interface Headline {
  titulo:  string
  gatilho: "Medo" | "Curiosidade" | "Autoridade" | "Escassez" | "Dor" | "Benefício"
  score:   number
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

const CATEGORIA_PARA_ESTILO: Record<string, EstiloId> = {
  "Emagrecimento":         "card-premium",
  "Hormônios":             "autoridade",
  "Andropausa":            "autoridade",
  "Menopausa":             "autoridade",
  "Terapia Hormonal":      "autoridade",
  "Endocrinologia":        "autoridade",
  "Longevidade":           "luxo-editorial",
  "Anti-aging":            "luxo-editorial",
  "Envelhecimento":        "luxo-editorial",
  "Nutrologia":            "carrossel-medico",
  "Nutrição Clínica":      "carrossel-medico",
  "Metabolismo":           "carrossel-medico",
  "Microbioma":            "carrossel-medico",
  "Genômica":              "carrossel-medico",
  "Obesidade":             "anuncio-premium",
  "Cardiometabolismo":     "anuncio-premium",
  "Medicina do Esporte":   "campanha",
  "Suplementação":         "campanha",
  "Saúde Mental":          "card-premium",
  "Imunologia":            "card-premium",
  "Sono e Cronobiologia":  "card-premium",
  "Oportunidade de Conteúdo": "capa-reels",
}

const PRIORIDADE_STYLE: Record<string, string> = {
  "Alta":  "bg-red-950/60 border-red-500/40 text-red-400",
  "Média": "bg-amber-950/60 border-amber-500/40 text-amber-400",
  "Baixa": "bg-slate-900/60 border-slate-600/40 text-slate-400",
}

const GATILHO_COLORS: Record<string, string> = {
  "Medo":        "bg-red-950/60 border-red-500/40 text-red-400",
  "Curiosidade": "bg-blue-950/60 border-blue-500/40 text-blue-400",
  "Autoridade":  "bg-violet-950/60 border-violet-500/40 text-violet-400",
  "Escassez":    "bg-amber-950/60 border-amber-500/40 text-amber-400",
  "Dor":         "bg-orange-950/60 border-orange-500/40 text-orange-400",
  "Benefício":   "bg-green-950/60 border-green-600/40 text-green-400",
}

const MOCK_HEADLINES: Headline[] = [
  { titulo: "O sintoma de resistência à insulina que 80% das pessoas ignoram silenciosamente", gatilho: "Medo", score: 95 },
  { titulo: "Por que seu médico nunca te explicou isso sobre testosterona — e como muda tudo", gatilho: "Curiosidade", score: 93 },
  { titulo: "Como endocrinologista, vejo esses 3 erros todos os dias no consultório", gatilho: "Autoridade", score: 91 },
  { titulo: "Últimas vagas para entender o protocolo GLP-1 que mudou minha prática clínica", gatilho: "Escassez", score: 88 },
  { titulo: "A fadiga que você sente todo dia pode ser um sinal hormonal — veja o que fazer", gatilho: "Dor", score: 86 },
  { titulo: "Os 3 marcadores laboratoriais que transformam a saúde metabólica em 90 dias", gatilho: "Benefício", score: 84 },
  { titulo: "Tirzepatida vs. Semaglutida: o que os estudos não dizem nas headlines", gatilho: "Curiosidade", score: 83 },
  { titulo: "Andropausa silenciosa: o diagnóstico que está sendo perdido em homens de 35 anos", gatilho: "Medo", score: 82 },
  { titulo: "Depois de 15 anos atendendo menopausa, esse é o protocolo que mais funciona", gatilho: "Autoridade", score: 80 },
  { titulo: "Jejum intermitente para mulheres: a resposta que você não encontra no Google", gatilho: "Dor", score: 78 },
  { titulo: "Sarcopenia começa nos 30 — e a ciência já tem o protocolo para prevenir", gatilho: "Benefício", score: 77 },
  { titulo: "O exame que eu peço em 100% dos meus pacientes e que quase ninguém solicita", gatilho: "Curiosidade", score: 76 },
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
  const [formato,         setFormato]         = useState<Formato>("story")
  const [estilo,          setEstilo]          = useState<EstiloId>("card-premium")
  const [ideia,           setIdeia]           = useState("")
  const [modelo,          setModelo]          = useState<Modelo>("gpt-image")
  const [promptParts,     setPromptParts]     = useState<PromptParts | null>(null)
  const [editedPrompt,    setEditedPrompt]    = useState("")
  const [editMode,        setEditMode]        = useState(false)
  const [imageUrl,        setImageUrl]        = useState<string | null>(null)
  const [audit,           setAudit]           = useState<string | null>(null)
  const [history,         setHistory]         = useState<HistoryItem[]>([])
  const [selectedHist,    setSelectedHist]    = useState<HistoryItem | null>(null)
  const [loadingPrompt,   setLoadingPrompt]   = useState(false)
  const [loadingImage,    setLoadingImage]    = useState(false)
  const [loadingAudit,    setLoadingAudit]    = useState(false)
  const [loadingMsg,      setLoadingMsg]      = useState("")
  const [error,           setError]           = useState<string | null>(null)
  const [copied,          setCopied]          = useState(false)
  const [expanded,        setExpanded]        = useState<string[]>([])
  const [modalOpen,       setModalOpen]       = useState(false)
  const [pautas,          setPautas]          = useState<Pauta[]>([])
  const [loadingPautas,   setLoadingPautas]   = useState(false)
  const [pautaSearch,     setPautaSearch]     = useState("")

  // Variações state
  const [variacoes,        setVariacoes]        = useState<Variacao[]>([])
  const [loadingVariacoes, setLoadingVariacoes] = useState(false)
  const [variacaoSel,      setVariacaoSel]      = useState<number | null>(null)
  const [variacaoAudit,    setVariacaoAudit]    = useState<string | null>(null)

  // Headlines section
  const [activeSection,    setActiveSection]    = useState<"imagens" | "headlines">("imagens")
  const [headlineTema,     setHeadlineTema]     = useState("")
  const [headlines,        setHeadlines]        = useState<Headline[]>([])
  const [loadingHeadlines, setLoadingHeadlines] = useState(false)
  const [headlineFilter,   setHeadlineFilter]   = useState("Todos")
  const [modalTarget,      setModalTarget]      = useState<"imagens" | "headlines">("imagens")

  const msgTimer = useRef<ReturnType<typeof setInterval>>()

  // Open all accordion items on desktop by default
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setExpanded([...PART_KEYS])
    }
  }, [])

  const startMsgs = (msgs: string[], ms = 2200) => {
    let i = 0; setLoadingMsg(msgs[0])
    clearInterval(msgTimer.current)
    msgTimer.current = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]) }, ms)
  }
  const stopMsgs = () => { clearInterval(msgTimer.current); setLoadingMsg("") }

  const toggleExpanded = (key: string) =>
    setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  // ── Modal: importar do banco de pautas ─────────────────────────────────────

  const abrirModalPautas = async (target: "imagens" | "headlines" = "imagens") => {
    setModalTarget(target)
    setModalOpen(true)
    setPautaSearch("")
    if (pautas.length > 0) return
    setLoadingPautas(true)
    try {
      const res  = await fetch("/api/pautas")
      const data = await res.json()
      setPautas(Array.isArray(data) ? data : [])
    } catch {
      setPautas([])
    } finally {
      setLoadingPautas(false)
    }
  }

  const selecionarPauta = (pauta: Pauta) => {
    if (modalTarget === "headlines") {
      setHeadlineTema(pauta.titulo)
    } else {
      setIdeia(pauta.titulo)
      const estiloMapeado = CATEGORIA_PARA_ESTILO[pauta.categoria] ?? "card-premium"
      setEstilo(estiloMapeado)
    }
    setModalOpen(false)
  }

  // ── Step 1: Generate creative direction via Claude ──────────────────────────

  const gerarPrompt = async () => {
    if (!ideia.trim()) { setError("Digite o tema da sua arte antes de continuar."); return }
    setError(null); setLoadingPrompt(true); setPromptParts(null)
    setImageUrl(null); setAudit(null); setEditMode(false); setSelectedHist(null)
    setVariacoes([]); setVariacaoSel(null); setVariacaoAudit(null)
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
          model: "claude-sonnet-4-20250514", max_tokens: 1400,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
        }),
      })

      const data   = await res.json()
      const raw    = (data.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim()
      const idx    = raw.indexOf("{")
      const parsed = JSON.parse(idx >= 0 ? raw.slice(idx) : raw) as PromptParts
      setPromptParts(parsed)
      setEditedPrompt(parsed.promptFinal)
      setExpanded([...PART_KEYS])
    } catch (e) {
      setError("Erro ao gerar direção criativa: " + String(e))
    } finally {
      stopMsgs(); setLoadingPrompt(false)
    }
  }

  // ── Step 2a: Single image ───────────────────────────────────────────────────

  const gerarImagem = async () => {
    const prompt = editMode ? editedPrompt : (promptParts?.promptFinal ?? "")
    if (!prompt) return
    console.log("[gerarImagem] modelo:", modelo, "formato:", FORMATOS[formato].apiRatio)
    setError(null); setLoadingImage(true); setImageUrl(null); setAudit(null)
    setVariacoes([]); setVariacaoSel(null); setVariacaoAudit(null)
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

  // ── Step 2b: Generate 3 variations ─────────────────────────────────────────

  const gerarVariacoes = async () => {
    const basePrompt = editMode ? editedPrompt : (promptParts?.promptFinal ?? "")
    if (!basePrompt) {
      setError("Prompt não disponível. Gere a direção criativa primeiro.")
      return
    }
    setError(null); setLoadingVariacoes(true)
    setVariacoes([]); setVariacaoSel(null); setVariacaoAudit(null)
    setImageUrl(null); setAudit(null)

    const promptVariants = [
      basePrompt,
      basePrompt + ", alternative composition, different angle, more minimalist approach",
      basePrompt + ", bolder typography, stronger contrast, more dramatic lighting",
    ]

    try {
      console.log("[gerarVariacoes] 3 chamadas paralelas via", modelo, "formato:", FORMATOS[formato].apiRatio)

      // Promise.allSettled ensures one failure never blocks the others
      const settled = await Promise.allSettled(
        promptVariants.map(p =>
          fetch("/api/gerar-imagem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: p, formato: FORMATOS[formato].apiRatio, modelo }),
          }).then(r => r.json() as Promise<{ image?: string; error?: string }>)
        )
      )

      const geradas: Variacao[] = settled
        .map((result, i) => {
          if (result.status === "rejected" || !result.value.image) return null
          return { url: result.value.image, prompt: promptVariants[i], label: `Variação ${i + 1}` }
        })
        .filter((v): v is Variacao => v !== null)

      const firstErrorMsg = settled
        .map(r => r.status === "fulfilled" ? r.value.error : String((r as PromiseRejectedResult).reason))
        .find(Boolean)

      console.log("[gerarVariacoes] geradas:", geradas.length, "/ primeiro erro:", firstErrorMsg ?? "nenhum")

      if (geradas.length === 0) {
        throw new Error(firstErrorMsg ?? "Nenhuma variação foi gerada. Verifique o modelo e a chave de API.")
      }

      setVariacoes(geradas)

      if (geradas.length >= 2) {
        gerarAuditoriaVariacoes(promptVariants.slice(0, geradas.length))
      }
    } catch (e) {
      setError("Erro ao gerar variações: " + String(e))
    } finally {
      setLoadingVariacoes(false)
    }
  }

  const gerarAuditoriaVariacoes = async (prompts: string[]) => {
    try {
      const res  = await fetch("/api/roteiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 120,
          messages: [{
            role: "user",
            content: `You are a creative director comparing ${prompts.length} AI-generated medical image variations.
Prompt 1 (base): "${prompts[0].slice(0, 150)}"
Prompt 2 (minimal): "${prompts[1]?.slice(0, 150) ?? ""}"
Prompt 3 (dramatic): "${prompts[2]?.slice(0, 150) ?? ""}"

In 1-2 sentences in Brazilian Portuguese, recommend which variation is typically best and why. Start with "Recomendamos a Variação X —".`,
          }],
        }),
      })
      const data = await res.json()
      setVariacaoAudit(data.content?.[0]?.text ?? null)
    } catch {
      /* ignore */
    }
  }

  const confirmarVariacao = () => {
    if (variacaoSel === null || !variacoes[variacaoSel]) return
    const chosen = variacoes[variacaoSel]

    setImageUrl(chosen.url)
    setSelectedHist(null)

    const ts = new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })

    const newItem: HistoryItem = {
      id: Date.now(), imageUrl: chosen.url, prompt: chosen.prompt,
      formato: FORMATOS[formato].label, estilo: ESTILOS[estilo].label,
      audit: "", timestamp: ts,
    }
    setHistory(prev => [newItem, ...prev].slice(0, 5))
    auditarImagem(chosen.prompt, newItem.id)

    // Add non-selected to history too
    variacoes.forEach((v, i) => {
      if (i !== variacaoSel) {
        const histItem: HistoryItem = {
          id: Date.now() + i + 1, imageUrl: v.url, prompt: v.prompt,
          formato: FORMATOS[formato].label, estilo: ESTILOS[estilo].label,
          audit: "", timestamp: ts,
        }
        setHistory(prev => [histItem, ...prev].slice(0, 5))
      }
    })

    setVariacoes([])
    setVariacaoSel(null)
    setVariacaoAudit(null)
  }

  // ── Step 3: Visual audit ────────────────────────────────────────────────────

  const auditarImagem = useCallback(async (prompt: string, histId: number) => {
    setLoadingAudit(true)
    try {
      const res  = await fetch("/api/roteiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 300,
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

  // ── Headlines ────────────────────────────────────────────────────────────────

  const gerarHeadlines = async () => {
    if (!headlineTema.trim()) { setError("Digite o tema antes de gerar as headlines."); return }
    setError(null); setLoadingHeadlines(true); setHeadlines([]); setHeadlineFilter("Todos")

    try {
      const res  = await fetch("/api/roteiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: `Você é o maior especialista em copywriting médico viral do Brasil, especializado em Endocrinologia, Nutrologia e Longevidade. Crie headlines que combinam autoridade científica com gatilhos emocionais para médicos no Instagram. Retorne SOMENTE JSON array, sem markdown.`,
          messages: [{
            role: "user",
            content: `Tema médico: ${headlineTema}

Gere exatamente 100 headlines virais para posts médicos sobre este tema.

Gatilhos emocionais:
- Medo: provoca urgência ou preocupação legítima com saúde
- Curiosidade: desperta o interesse de saber mais
- Autoridade: posiciona o médico como especialista único
- Escassez: cria senso de exclusividade ou urgência temporal
- Dor: fala diretamente com o problema ou sofrimento do paciente
- Benefício: foca na transformação ou resultado positivo esperado

Score de viralidade 0-100 baseado em clareza + impacto emocional + potencial de compartilhamento.

Retorne JSON array: [{"titulo": "...", "gatilho": "Medo|Curiosidade|Autoridade|Escassez|Dor|Benefício", "score": 85}, ...]

Gere exatamente 100 headlines variadas, distribuídas entre os 6 gatilhos, ordenadas do maior para menor score.`,
          }],
        }),
      })
      const data   = await res.json()
      const raw    = (data.content?.[0]?.text ?? "[]").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      const idx    = raw.indexOf("[")
      const parsed = JSON.parse(idx >= 0 ? raw.slice(idx) : raw) as Headline[]
      setHeadlines(parsed.length > 0 ? parsed : MOCK_HEADLINES)
    } catch (e) {
      setError("Erro ao gerar headlines: " + String(e))
      setHeadlines(MOCK_HEADLINES)
    } finally {
      setLoadingHeadlines(false)
    }
  }

  // ── Utilities ───────────────────────────────────────────────────────────────

  const downloadImage = (url?: string) => {
    const target = url ?? selectedHist?.imageUrl ?? imageUrl
    if (!target) return
    const a = document.createElement("a")
    a.href = target; a.download = `diretor-criativo-${Date.now()}.png`; a.click()
  }

  const copyPrompt = async () => {
    const p = editMode ? editedPrompt : (promptParts?.promptFinal ?? "")
    if (!p) return
    await navigator.clipboard.writeText(p)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const displayImage = variacoes.length === 0 ? (selectedHist?.imageUrl ?? imageUrl) : null
  const displayAudit = selectedHist?.audit ?? audit
  const anyLoading   = loadingPrompt || loadingImage || loadingVariacoes

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Diretor Criativo IA"
        subtitle="DIREÇÃO CRIATIVA · GERAÇÃO DE IMAGENS · IDENTIDADE VISUAL"
        actions={
          anyLoading ? (
            <div className="flex items-center gap-2 text-accent text-[11px] font-mono tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {loadingMsg || (loadingVariacoes ? "Gerando 3 variações..." : "")}
            </div>
          ) : undefined
        }
      />

      {/* ── Section tabs ── */}
      <div className="px-4 md:px-8 pt-5 flex items-center border-b border-border">
        {(["imagens", "headlines"] as const).map(sec => (
          <button key={sec} onClick={() => setActiveSection(sec)}
            className={cn(
              "px-4 py-2.5 text-[12.5px] font-medium border-b-2 -mb-px transition-all",
              activeSection === sec
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-secondary"
            )}>
            {sec === "imagens" ? "Diretor Criativo" : "✦ Headlines"}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SEÇÃO IMAGENS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === "imagens" && (
        <div className="p-4 md:p-8 space-y-6">

          {/* ── BLOCO 1: CONFIGURAÇÕES ─────────────────────────────────────── */}
          <div className="space-y-4">

            {/* 1 — Formato */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-3">1 — Formato</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(Object.keys(FORMATOS) as Formato[]).map(f => (
                  <FormatoCard key={f} id={f} active={formato === f} onClick={() => setFormato(f)} />
                ))}
              </div>
            </div>

            {/* 2 — Estilo */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-3">2 — Estilo da Biblioteca</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-1.5">
                {(Object.entries(ESTILOS) as [EstiloId, typeof ESTILOS[EstiloId]][]).map(([id, s]) => (
                  <button key={id} onClick={() => setEstilo(id)}
                    className={cn(
                      "text-left px-3 py-2 rounded-md border transition-all",
                      estilo === id ? "bg-accent-dim border-accent-border" : "border-transparent hover:bg-white/[0.03]"
                    )}>
                    <div className={cn("text-[12px] font-semibold leading-tight", estilo === id ? "text-accent" : "text-text-primary")}>{s.label}</div>
                    <div className="text-[10px] text-text-muted mt-0.5 leading-snug">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3 — Tema */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">3 — Tema da Arte</div>
                <button
                  onClick={() => abrirModalPautas("imagens")}
                  className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all"
                >
                  <BookOpen className="w-3 h-3" />
                  Banco de Pautas
                </button>
              </div>
              <textarea
                value={ideia}
                onChange={e => setIdeia(e.target.value)}
                placeholder="Ex: resistência à insulina, menopausa e hormônios, jejum intermitente..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-base md:text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors resize-none"
                rows={3}
              />
            </div>

            {/* 4 — Modelo */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-3">4 — Modelo de Geração</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.entries(MODELOS) as [Modelo, typeof MODELOS[Modelo]][]).map(([id, m]) => (
                  <button key={id} onClick={() => setModelo(id)}
                    className={cn(
                      "text-left px-3 py-2.5 rounded-md border transition-all flex items-start gap-3",
                      modelo === id ? "bg-accent-dim border-accent-border" : "border-border hover:bg-white/[0.03]"
                    )}>
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-[5px]", modelo === id ? "bg-accent" : "bg-text-muted/30")} />
                    <div>
                      <div className={cn("text-[12px] font-semibold", modelo === id ? "text-accent" : "text-text-primary")}>{m.label}</div>
                      <div className="text-[9px] font-mono text-text-muted">{m.sub}</div>
                      <div className="text-[9px] text-text-muted mt-0.5">{m.note}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botão Gerar Direção */}
            <button
              onClick={gerarPrompt}
              disabled={anyLoading || !ideia.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              {loadingPrompt ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {loadingPrompt ? "Elaborando direção..." : "Elaborar Direção Criativa"}
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 bg-red-950/40 border border-red-500/30 rounded-lg p-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!promptParts && !loadingPrompt && !loadingImage && !loadingVariacoes && (
            <div className="bg-card border border-border rounded-lg p-10 md:p-14 flex flex-col items-center justify-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
                <Wand2 className="w-8 h-8 text-accent" />
              </div>
              <div className="text-center max-w-md">
                <h3 className="text-[15px] font-semibold text-text-primary mb-2">Diretor Criativo IA</h3>
                <p className="text-[12px] text-text-muted leading-relaxed">
                  Configure o formato, estilo e tema acima. O Claude elaborará uma direção criativa cinematográfica com 7 componentes antes de enviar para geração de imagem.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-md mt-1">
                {["Conceito Visual", "Direção Artística", "Iluminação", "Prompt Final"].map(l => (
                  <div key={l} className="bg-background rounded-lg p-3 text-center">
                    <div className="text-[9px] text-text-muted leading-tight">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading: gerando prompt */}
          {loadingPrompt && (
            <div className="bg-card border border-border rounded-lg p-14 flex flex-col items-center justify-center gap-5">
              <Sparkles className="w-12 h-12 text-accent animate-pulse" />
              <div className="text-center">
                <div className="text-[15px] font-semibold text-text-primary mb-1">{loadingMsg}</div>
                <div className="text-[10px] font-mono text-text-muted tracking-widest">CLAUDE ELABORANDO DIREÇÃO CRIATIVA</div>
              </div>
            </div>
          )}

          {/* ── BLOCO 2: PROMPT GERADO ─────────────────────────────────────── */}
          {promptParts && !loadingPrompt && (
            <div className="space-y-4">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold text-text-primary">Direção Criativa Elaborada</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">{ESTILOS[estilo].label} · {FORMATOS[formato].label} · {FORMATOS[formato].ratio}</p>
                </div>
                <button onClick={gerarPrompt} disabled={anyLoading}
                  className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-accent transition-colors disabled:opacity-40">
                  <RefreshCw className="w-3 h-3" /> Regenerar
                </button>
              </div>

              {/* 7 componentes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PART_KEYS.map(key => (
                  <button key={key}
                    onClick={() => toggleExpanded(key)}
                    className={cn(
                      "bg-card border border-border rounded-lg p-3 text-left hover:border-border-hover transition-all",
                      key === "negativo" && "sm:col-span-2"
                    )}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span>{PART_ICON[key]}</span>
                        <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">{PART_LABEL[key]}</span>
                      </div>
                      {expanded.includes(key)
                        ? <ChevronUp   className="w-3 h-3 text-text-muted flex-shrink-0" />
                        : <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0" />}
                    </div>
                    <p className={cn("text-[11px] text-text-secondary leading-relaxed text-left", !expanded.includes(key) && "line-clamp-2")}>
                      {promptParts[key]}
                    </p>
                  </button>
                ))}
              </div>

              {/* Prompt final unificado */}
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
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-base md:text-[11px] text-text-primary font-mono outline-none focus:border-accent/40 transition-colors resize-y leading-relaxed"
                    style={{ minHeight: 120 }}
                  />
                ) : (
                  <p className="text-[11px] text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">
                    {promptParts.promptFinal}
                  </p>
                )}
              </div>

              {/* Botões: Gerar Imagem + Gerar 3 Variações */}
              <div className="flex gap-3">
                <button
                  onClick={gerarImagem}
                  disabled={loadingImage || loadingVariacoes}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-lg bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 min-h-[56px]"
                >
                  {loadingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  {loadingImage ? loadingMsg : `Gerar Imagem · ${MODELOS[modelo].label}`}
                </button>
                <button
                  onClick={gerarVariacoes}
                  disabled={loadingImage || loadingVariacoes}
                  className="flex items-center justify-center gap-2 px-5 py-4 rounded-lg border border-border text-text-secondary text-[13px] font-semibold hover:border-accent-border hover:text-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] whitespace-nowrap"
                >
                  {loadingVariacoes ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers2 className="w-4 h-4" />}
                  {loadingVariacoes ? "Gerando..." : "3 Variações"}
                </button>
              </div>
            </div>
          )}

          {/* Loading: gerando imagem única */}
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

          {/* Loading: gerando 3 variações (skeletons) */}
          {loadingVariacoes && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers2 className="w-4 h-4 text-accent animate-pulse" />
                <span className="text-[13px] font-semibold text-text-primary">Gerando 3 variações em paralelo...</span>
                <span className="text-[10px] font-mono text-text-muted">Via {MODELOS[modelo].label}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                    <div className="bg-background/60" style={{ aspectRatio: "3/4" }} />
                    <div className="p-3 space-y-2">
                      <div className="h-2 bg-white/[0.06] rounded w-1/3" />
                      <div className="h-8 bg-white/[0.04] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BLOCO 2.5: VARIAÇÕES ───────────────────────────────────────── */}
          {variacoes.length > 0 && !loadingVariacoes && (
            <div className="space-y-4">

              {/* AI recommendation */}
              {variacaoAudit && (
                <div className="flex items-start gap-3 bg-accent-dim border border-accent-border rounded-lg px-4 py-3">
                  <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-accent/90 leading-snug">{variacaoAudit}</p>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold text-text-primary">3 Variações Geradas</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Escolha uma para confirmar · As demais vão para o histórico</p>
                </div>
                <button type="button" onClick={gerarVariacoes} disabled={loadingVariacoes}
                  className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-accent transition-colors disabled:opacity-40">
                  <RefreshCw className="w-3 h-3" /> Regenerar
                </button>
              </div>

              {/* 3-card grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {variacoes.map((v, i) => (
                  <div key={i} className={cn(
                    "bg-card border rounded-xl overflow-hidden transition-all",
                    variacaoSel === i
                      ? "border-accent shadow-lg shadow-accent/10 ring-1 ring-accent/30"
                      : "border-border"
                  )}>
                    {/* Image */}
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.url} alt={v.label} className="w-full object-cover" style={{ aspectRatio: "3/4" }} />
                      {variacaoSel === i && (
                        <div className="absolute top-2 right-2">
                          <span className="text-[8px] font-mono font-bold px-2 py-1 rounded-full bg-accent text-background">
                            SELECIONADA
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border",
                          i === 0 ? "bg-accent-dim border-accent-border text-accent"
                            : i === 1 ? "bg-blue-950/60 border-blue-500/40 text-blue-400"
                              : "bg-purple-950/60 border-purple-500/40 text-purple-400"
                        )}>
                          {v.label}
                        </span>
                        {i === 1 && <span className="text-[8px] text-text-muted">+ minimalista</span>}
                        {i === 2 && <span className="text-[8px] text-text-muted">+ dramática</span>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setVariacaoSel(prev => prev === i ? null : i)}
                          className={cn(
                            "flex-1 text-[11px] py-1.5 rounded-lg border transition-all font-semibold",
                            variacaoSel === i
                              ? "bg-accent-dim border-accent text-accent"
                              : "border-border text-text-muted hover:border-accent-border hover:text-accent"
                          )}
                        >
                          {variacaoSel === i ? "✓ Selecionada" : "Escolher Esta"}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadImage(v.url)}
                          className="px-2.5 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-all"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirm selection */}
              {variacaoSel !== null && (
                <button
                  type="button"
                  onClick={confirmarVariacao}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-accent text-background text-[14px] font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                >
                  <Check className="w-4 h-4" />
                  Confirmar Seleção — {variacoes[variacaoSel]?.label}
                </button>
              )}
            </div>
          )}

          {/* ── BLOCO 3: IMAGEM GERADA ─────────────────────────────────────── */}
          {displayImage && !loadingImage && !loadingVariacoes && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-text-primary">Imagem Gerada</span>
                    {selectedHist && (
                      <span className="text-[9px] font-mono text-text-muted px-2 py-0.5 rounded bg-white/[0.04] border border-border">
                        Histórico · {selectedHist.timestamp}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={copyPrompt}
                      className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-all min-h-[36px]">
                      {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                      Copiar Prompt
                    </button>
                    {!selectedHist && promptParts && (
                      <button onClick={gerarImagem} disabled={loadingImage}
                        className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-all disabled:opacity-40 min-h-[36px]">
                        <RefreshCw className="w-3 h-3" /> Regenerar
                      </button>
                    )}
                    <button onClick={() => downloadImage()}
                      className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-accent-dim border border-accent-border text-accent hover:bg-accent/20 transition-all font-medium min-h-[36px]">
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

              {/* Auditoria Visual */}
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

          {/* ── BLOCO 4: HISTÓRICO ─────────────────────────────────────────── */}
          {history.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-3 h-3 text-text-muted" />
                <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Histórico da Sessão</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {history.map(h => (
                  <button key={h.id}
                    onClick={() => setSelectedHist(selectedHist?.id === h.id ? null : h)}
                    title={`${h.estilo} · ${h.formato} · ${h.timestamp}`}
                    className={cn(
                      "relative rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                      selectedHist?.id === h.id ? "border-accent" : "border-transparent hover:border-border-hover"
                    )}
                    style={{ width: 56, height: 56 }}
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
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HEADLINES SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === "headlines" && (
        <div className="p-4 md:p-8 space-y-5">

          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[13px] font-semibold text-text-primary">100 Headlines com IA</h3>
                <p className="text-[11px] text-text-muted mt-0.5">Classificadas por gatilho emocional · Ordenadas do mais viral ao menos viral</p>
              </div>
              <button
                onClick={() => abrirModalPautas("headlines")}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all flex-shrink-0"
              >
                <BookOpen className="w-3 h-3" /> Banco de Pautas
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={headlineTema}
                onChange={e => setHeadlineTema(e.target.value)}
                onKeyDown={e => e.key === "Enter" && gerarHeadlines()}
                placeholder="Ex: resistência à insulina, testosterona e andropausa, menopausa e TRH..."
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-base md:text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
              />
              <button
                onClick={gerarHeadlines}
                disabled={loadingHeadlines || !headlineTema.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {loadingHeadlines
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando...</>
                  : <><TrendingUp className="w-4 h-4" /> Gerar 100 Headlines</>}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-950/40 border border-red-500/30 rounded-lg p-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          {headlines.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Gatilho:</span>
              {["Todos", "Medo", "Curiosidade", "Autoridade", "Escassez", "Dor", "Benefício"].map(g => (
                <button key={g} onClick={() => setHeadlineFilter(g)}
                  className={cn(
                    "text-[10px] px-3 py-1 rounded-full border transition-all",
                    headlineFilter === g
                      ? g === "Todos" ? "bg-accent-dim border-accent-border text-accent font-medium" : cn("font-medium", GATILHO_COLORS[g] || "bg-accent-dim border-accent-border text-accent")
                      : "border-border text-text-muted hover:text-text-secondary"
                  )}>
                  {g}
                  {g !== "Todos" && (
                    <span className="ml-1 text-[9px] opacity-60">
                      {headlines.filter(h => h.gatilho === g).length}
                    </span>
                  )}
                </button>
              ))}
              <span className="ml-auto text-[10px] font-mono text-text-muted">
                {headlines.filter(h => headlineFilter === "Todos" || h.gatilho === headlineFilter).length} headlines
              </span>
            </div>
          )}

          {loadingHeadlines && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Sparkles className="w-10 h-10 text-accent animate-pulse" />
              <div className="text-center">
                <div className="text-[14px] font-semibold text-text-primary">Gerando 100 headlines...</div>
                <div className="text-[10px] font-mono text-text-muted tracking-widest mt-1">CLAUDE ELABORANDO COPYWRITING VIRAL</div>
              </div>
            </div>
          )}

          {!loadingHeadlines && headlines.length === 0 && (
            <div className="bg-card border border-border rounded-lg py-16 flex flex-col items-center justify-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
              <div className="text-center max-w-md">
                <h3 className="text-[14px] font-semibold text-text-primary mb-2">Gerador de Headlines Virais</h3>
                <p className="text-[12px] text-text-muted leading-relaxed">
                  Digite um tema médico e receba 100 headlines classificadas por gatilho emocional e score viral.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {Object.keys(GATILHO_COLORS).map(g => (
                  <span key={g} className={cn("text-[9px] font-mono font-semibold px-2.5 py-1 rounded-full border", GATILHO_COLORS[g])}>
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!loadingHeadlines && headlines.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-2 border-b border-border flex items-center gap-4">
                <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider w-7">#</span>
                <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider w-24 flex-shrink-0">Gatilho</span>
                <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider flex-1">Headline</span>
                <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider w-12 text-right">Score</span>
                <span className="w-28" />
              </div>
              <div className="divide-y divide-border">
                {headlines
                  .filter(h => headlineFilter === "Todos" || h.gatilho === headlineFilter)
                  .map((h, idx) => (
                    <div key={idx} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] group transition-colors">
                      <span className="text-[11px] font-mono text-text-muted w-7 flex-shrink-0 tabular-nums">{idx + 1}</span>
                      <span className={cn(
                        "text-[9px] font-mono font-semibold px-2.5 py-1 rounded-full border w-24 text-center flex-shrink-0",
                        GATILHO_COLORS[h.gatilho] || "bg-slate-900 border-slate-700 text-slate-400"
                      )}>
                        {h.gatilho}
                      </span>
                      <p className="text-[13px] text-text-primary flex-1 leading-snug">{h.titulo}</p>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span className={cn(
                          "text-[13px] font-bold font-mono tabular-nums w-8 text-right",
                          h.score >= 90 ? "text-accent" : h.score >= 75 ? "text-amber-400" : "text-text-secondary"
                        )}>
                          {h.score}
                        </span>
                        <button
                          onClick={() => { setIdeia(h.titulo); setActiveSection("imagens") }}
                          className="text-[10px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 whitespace-nowrap w-28 min-h-[36px]"
                        >
                          Usar na Arte →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — Banco de Pautas
      ══════════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,9,14,0.85)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-lg rounded-xl border flex flex-col"
            style={{ background: "var(--surface)", borderColor: "var(--border)", maxHeight: "80vh" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <span className="text-[13px] font-semibold text-text-primary">Banco de Pautas</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  autoFocus
                  value={pautaSearch}
                  onChange={e => setPautaSearch(e.target.value)}
                  placeholder="Buscar pauta..."
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {loadingPautas ? (
                <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[12px] font-mono">Carregando pautas...</span>
                </div>
              ) : pautas.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-[12px]">Nenhuma pauta encontrada no banco.</div>
              ) : (
                <div className="space-y-1.5">
                  {pautas
                    .filter(p => !pautaSearch || p.titulo.toLowerCase().includes(pautaSearch.toLowerCase()) || p.categoria.toLowerCase().includes(pautaSearch.toLowerCase()))
                    .map(pauta => {
                      const estiloSugerido = CATEGORIA_PARA_ESTILO[pauta.categoria] ?? "card-premium"
                      const prioStyle = PRIORIDADE_STYLE[pauta.prioridade] ?? PRIORIDADE_STYLE["Baixa"]
                      return (
                        <button key={pauta.id} onClick={() => selecionarPauta(pauta)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-transparent hover:border-accent-border hover:bg-accent-dim/30 transition-all group">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <p className="text-[12px] font-medium text-text-primary leading-snug group-hover:text-accent transition-colors">{pauta.titulo}</p>
                            <span className={cn("flex-shrink-0 text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border", prioStyle)}>{pauta.prioridade}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">{pauta.categoria}</span>
                            <span className="text-[9px] text-text-muted/60">→</span>
                            <span className="text-[9px] text-accent/70">{ESTILOS[estiloSugerido].label}</span>
                          </div>
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-[9px] font-mono text-text-muted text-center tracking-wider">
                {pautas.length} PAUTA{pautas.length !== 1 ? "S" : ""} NO BANCO · CLIQUE PARA IMPORTAR
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
