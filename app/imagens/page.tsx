"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { AI_MODEL } from "@/lib/ai-config"
import { Panel, PxButton, PxModal, Segmented, Field, PxInput, Tag, PageHeader, CopyButton } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Formato = "story" | "reels" | "retrato" | "quadrado"
type Modelo = "gpt-image" | "gemini" | "flux"
type EstiloId =
  | "card-premium" | "luxo-editorial" | "capa-reels" | "story-impacto"
  | "carrossel-medico" | "antes-depois" | "foto-institucional"
  | "anuncio-premium" | "campanha" | "autoridade"
type Gatilho = "Medo" | "Curiosidade" | "Autoridade" | "Escassez" | "Dor" | "Benefício"

interface PromptParts {
  conceito: string; direcao: string; composicao: string; iluminacao: string
  tipografia: string; elementos: string; negativo: string; promptFinal: string
}
interface HistoryItem { id: number; imageUrl: string; prompt: string; formato: string; estilo: string; revisao: string; aspect: string; timestamp: string }
interface Variacao { url: string; prompt: string; label: string; aspect: string }
interface Pauta { id: number | string; titulo: string; categoria: string; prioridade: string; nota?: string; estagio?: string }
interface Headline { titulo: string; gatilho: Gatilho; score: number }

// ─── Constantes ───────────────────────────────────────────────────────────────

const FORMATOS: Record<Formato, { label: string; ratio: string; wR: number; hR: number; desc: string }> = {
  story: { label: "Story", ratio: "9:16", wR: 9, hR: 16, desc: "Vertical, Stories" },
  reels: { label: "Capa de Reels", ratio: "9:16", wR: 9, hR: 16, desc: "Capa de Reels" },
  retrato: { label: "Retrato", ratio: "4:5", wR: 4, hR: 5, desc: "Feed retrato" },
  quadrado: { label: "Quadrado", ratio: "1:1", wR: 1, hR: 1, desc: "Feed quadrado" },
}

const ESTILOS: Record<EstiloId, { label: string; desc: string; prompt: string }> = {
  "card-premium": { label: "Card Premium", desc: "Editorial minimalista, headline central, muito respiro", prompt: "minimalist editorial card, centered headline, maximum breathing space, clean luxury layout, single focal point, typography-driven" },
  "luxo-editorial": { label: "Card Luxo Editorial", desc: "Texturas metálicas sutis, iluminação dramática lateral", prompt: "luxury editorial, subtle metallic textures, dramatic side lighting, chiaroscuro shadows, high-end magazine aesthetic" },
  "capa-reels": { label: "Capa de Reels", desc: "Impacto máximo em 1 segundo, headline enorme", prompt: "maximum social media visual impact, oversized bold headline, dark vibrant background, instant attention-grabbing composition" },
  "story-impacto": { label: "Story Impacto", desc: "Vertical 9:16, composição centralizada, CTA implícito", prompt: "vertical 9:16 social story, centered power composition, strong visual hierarchy, implicit call-to-action energy" },
  "carrossel-medico": { label: "Carrossel Médico", desc: "Slide conceitual com hierarquia visual clara", prompt: "conceptual medical carousel slide, clear visual hierarchy, educational layout, clean information architecture" },
  "antes-depois": { label: "Antes e Depois", desc: "Divisão visual simbólica, sem fotos reais", prompt: "symbolic visual split composition, before/after concept without real photos, abstract representation, conceptual duality" },
  "foto-institucional": { label: "Foto Institucional", desc: "Médico/autoridade, iluminação de estúdio premium", prompt: "professional medical authority portrait, premium studio lighting, institutional gravitas, expert positioning" },
  "anuncio-premium": { label: "Anúncio Premium", desc: "Composição de campanha publicitária médica", prompt: "high-end medical advertising campaign, luxury product placement, premium brand communication, editorial ad aesthetic" },
  "campanha": { label: "Campanha Conversão", desc: "Urgência visual, headline de impacto, CTA visual", prompt: "conversion campaign visual urgency, impactful headline composition, strong visual call-to-action, direct response design" },
  "autoridade": { label: "Autoridade Médica", desc: "Credibilidade, sofisticação, posicionamento de especialista", prompt: "medical expertise and authority, sophisticated positioning, specialist credibility, professional excellence" },
}

const MODELOS: Record<Modelo, { label: string; sub: string; note: string; available: boolean }> = {
  "gpt-image": { label: "GPT Image", sub: "OpenAI, gpt-image-1", note: "Requer configuração de chave de API", available: false },
  "gemini": { label: "Gemini Imagen", sub: "Google, imagen-3.0-generate", note: "Bom para composições complexas", available: true },
  "flux": { label: "Flux Schnell", sub: "HuggingFace, FLUX.1-schnell", note: "Rápido e eficiente", available: true },
}

const PART_KEYS = ["conceito", "direcao", "composicao", "iluminacao", "tipografia", "elementos", "negativo"] as const
type PartKey = typeof PART_KEYS[number]
const PART_LABEL: Record<PartKey, string> = {
  conceito: "Conceito visual", direcao: "Direção artística", composicao: "Composição e formato",
  iluminacao: "Iluminação e textura", tipografia: "Tipografia", elementos: "Elementos visuais", negativo: "Prompt negativo",
}

const CATEGORIA_PARA_ESTILO: Record<string, EstiloId> = {
  "Emagrecimento": "card-premium", "Hormônios": "autoridade", "Andropausa": "autoridade", "Menopausa": "autoridade",
  "Terapia Hormonal": "autoridade", "Endocrinologia": "autoridade", "Longevidade": "luxo-editorial",
  "Anti-aging": "luxo-editorial", "Envelhecimento": "luxo-editorial", "Nutrologia": "carrossel-medico",
  "Nutrição Clínica": "carrossel-medico", "Metabolismo": "carrossel-medico", "Microbioma": "carrossel-medico",
  "Genômica": "carrossel-medico", "Obesidade": "anuncio-premium", "Cardiometabolismo": "anuncio-premium",
  "Medicina do Esporte": "campanha", "Suplementação": "campanha", "Saúde Mental": "card-premium",
  "Imunologia": "card-premium", "Sono e Cronobiologia": "card-premium", "Oportunidade de Conteúdo": "capa-reels",
}

const GATILHOS: Gatilho[] = ["Medo", "Curiosidade", "Autoridade", "Escassez", "Dor", "Benefício"]

const VISUAL_IDENTITY = `FIXED VISUAL IDENTITY (mandatory for every prompt):
- Background: sophisticated black graphite with texture (#08090e)
- Color palette: black graphite + emerald green (#00c07f) + ice white ONLY
- Lighting: cinematic lateral/dramatic, high contrast, 3D depth, chiaroscuro
- Style: ultra-premium editorial — Forbes, Bloomberg, Apple, luxury brand campaign
- Typography feeling: elegant, modern, luxury brand-grade
- Composition: ample breathing space, soft shadows, ultra-premium finish
- STRICT EXCLUSIONS: no Canva look, no generic templates, no clinical/hospital aesthetics, no excess elements, no multiple colors, no amateur composition`

const TEXTAREA = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
const OPCAO = "rounded-px-card border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
const OPCAO_ON = "border-px-ink bg-white"
const OPCAO_OFF = "border-px-line bg-white/50 hover:bg-white"

// ─── Funções auxiliares ───────────────────────────────────────────────────────

/** Extrai o primeiro objeto ou array JSON de uma resposta de texto da IA. */
function extrairJson(texto: string, abre: "{" | "["): unknown {
  const fecha = abre === "{" ? "}" : "]"
  const limpo = texto.replace(/```json|```/g, "").trim()
  const i = limpo.indexOf(abre)
  const j = limpo.lastIndexOf(fecha)
  if (i < 0 || j <= i) throw new Error("sem json")
  return JSON.parse(limpo.slice(i, j + 1))
}

function partesValidas(x: unknown): x is PromptParts {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return [...PART_KEYS, "promptFinal"].every(k => typeof o[k] === "string" && (o[k] as string).trim().length > 0)
}

function headlinesValidas(x: unknown): Headline[] {
  if (!Array.isArray(x)) return []
  const out: Headline[] = []
  for (const h of x) {
    if (!h || typeof h !== "object") continue
    const r = h as Record<string, unknown>
    if (typeof r.titulo !== "string" || !r.titulo.trim()) continue
    if (!GATILHOS.includes(r.gatilho as Gatilho)) continue
    const score = Number(r.score)
    out.push({ titulo: r.titulo.trim(), gatilho: r.gatilho as Gatilho, score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0 })
  }
  return out.sort((a, b) => b.score - a.score)
}

async function textoDaIa(body: Record<string, unknown>): Promise<string> {
  const res = await fetch("/api/roteiros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, ...body }),
  })
  const data = await res.json().catch(() => null)
  const texto = data?.content?.[0]?.text
  if (!res.ok || typeof texto !== "string" || !texto.trim()) throw new Error("ia")
  return texto
}

/** Pede uma imagem. Só a mensagem do limite de plano (429) vem do servidor; o resto vira texto genérico. */
async function pedirImagem(prompt: string, ratio: string, modelo: Modelo): Promise<string> {
  let res: Response
  try {
    res = await fetch("/api/gerar-imagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, formato: ratio, modelo }),
    })
  } catch {
    throw new Error(`Não foi possível gerar a imagem agora com ${MODELOS[modelo].label}. Confira a conexão e tente de novo.`)
  }
  const data = await res.json().catch(() => null)
  if (res.ok && typeof data?.image === "string" && data.image) return data.image
  if (res.status === 429 && typeof data?.error === "string") throw new Error(data.error)
  throw new Error(`Não foi possível gerar a imagem agora com ${MODELOS[modelo].label}. Tente de novo ou troque o modelo.`)
}

function hora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function FormatoBotao({ id, active, onClick }: { id: Formato; active: boolean; onClick: () => void }) {
  const f = FORMATOS[id]
  const MAX = 44
  const w = Math.round(MAX * (f.wR / Math.max(f.wR, f.hR)))
  const h = Math.round(MAX * (f.hR / Math.max(f.wR, f.hR)))
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn(OPCAO, "flex flex-col items-center gap-2 text-center", active ? OPCAO_ON : OPCAO_OFF)}>
      <span className="flex items-center justify-center" style={{ width: 44, height: 50 }} aria-hidden="true">
        <span className={cn("rounded-sm border-2", active ? "border-px-ink bg-px-ink/10" : "border-px-muted")} style={{ width: w, height: h }} />
      </span>
      <span>
        <span className="block text-[13px] font-semibold leading-tight text-px-ink">{f.label}</span>
        <span className="block text-[12px] text-px-muted">{f.ratio}</span>
      </span>
    </button>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DiretorCriativoPage() {
  const [secao, setSecao] = useState<"imagens" | "headlines">("imagens")
  const [formato, setFormato] = useState<Formato>("story")
  const [estilo, setEstilo] = useState<EstiloId>("card-premium")
  const [ideia, setIdeia] = useState("")
  const [modelo, setModelo] = useState<Modelo>("gemini")

  const [promptParts, setPromptParts] = useState<PromptParts | null>(null)
  const [promptEditado, setPromptEditado] = useState("")
  const [editando, setEditando] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageAspect, setImageAspect] = useState("9/16")
  const [revisao, setRevisao] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedHist, setSelectedHist] = useState<HistoryItem | null>(null)
  const [variacoes, setVariacoes] = useState<Variacao[]>([])
  const [variacaoSel, setVariacaoSel] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [loadingVariacoes, setLoadingVariacoes] = useState(false)
  const [loadingRevisao, setLoadingRevisao] = useState(false)
  const [errorImg, setErrorImg] = useState<string | null>(null)

  const idRef = useRef(0)

  const [pautaOpen, setPautaOpen] = useState(false)
  const [pautaAlvo, setPautaAlvo] = useState<"imagens" | "headlines">("imagens")
  const [pautas, setPautas] = useState<Pauta[]>([])
  const [loadingPautas, setLoadingPautas] = useState(false)
  const [pautasError, setPautasError] = useState<string | null>(null)
  const [pautaSearch, setPautaSearch] = useState("")

  const [perfil, setPerfil] = useState<{ marca_cor_primaria?: string; marca_cor_secundaria?: string; marca_cor_fundo?: string; marca_tipografia?: string; nome?: string } | null>(null)

  const [headlineTema, setHeadlineTema] = useState("")
  const [headlines, setHeadlines] = useState<Headline[]>([])
  const [loadingHeadlines, setLoadingHeadlines] = useState(false)
  const [headlineFilter, setHeadlineFilter] = useState<"Todos" | Gatilho>("Todos")
  const [errorHead, setErrorHead] = useState<string | null>(null)

  // Identidade da marca do médico, quando cadastrada; sem ela, vale a identidade fixa do produto
  useEffect(() => {
    fetch("/api/perfil")
      .then(r => (r.ok ? r.json() : null))
      .then(p => { if (p && typeof p === "object" && !("error" in p)) setPerfil(p) })
      .catch(() => {})
  }, [])

  // Tema vindo do Banco de Pautas (?tema=)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tema")
    if (t && t.trim()) setIdeia(t.trim().slice(0, 300))
  }, [])

  const promptAtual = promptEditado
  const promptEditadoDiferente = !!promptParts && promptEditado !== promptParts.promptFinal
  const promptExibido = selectedHist?.prompt ?? promptAtual
  const displayImage = variacoes.length === 0 ? (selectedHist?.imageUrl ?? imageUrl) : null
  const displayAspect = selectedHist?.aspect ?? imageAspect
  const displayRevisao = selectedHist ? selectedHist.revisao : revisao
  const anyLoading = loadingPrompt || loadingImage || loadingVariacoes

  const toggleExpanded = (key: string) => setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  // ── Banco de Pautas ─────────────────────────────────────────────────────────

  const abrirPautas = async (alvo: "imagens" | "headlines") => {
    setPautaAlvo(alvo); setPautaOpen(true); setPautaSearch(""); setPautasError(null)
    if (pautas.length > 0) return
    setLoadingPautas(true)
    try {
      const res = await fetch("/api/pautas")
      if (!res.ok) throw new Error("falha")
      const data = await res.json()
      setPautas(Array.isArray(data) ? data : [])
    } catch {
      setPautasError("Não foi possível carregar o Banco de Pautas.")
    } finally {
      setLoadingPautas(false)
    }
  }

  const selecionarPauta = (p: Pauta) => {
    if (pautaAlvo === "headlines") setHeadlineTema(p.titulo)
    else { setIdeia(p.titulo); setEstilo(CATEGORIA_PARA_ESTILO[p.categoria] ?? "card-premium") }
    setPautaOpen(false)
  }

  // ── Etapa 1: direção criativa ───────────────────────────────────────────────

  const getVisualIdentity = () => {
    if (!perfil) return VISUAL_IDENTITY
    const cor1 = perfil.marca_cor_primaria ?? "#b8976a"
    const cor2 = perfil.marca_cor_secundaria ?? "#0D1B2A"
    const fundo = perfil.marca_cor_fundo ?? "#1a1a2e"
    const fonte = perfil.marca_tipografia ?? "Montserrat"
    return `IDENTIDADE VISUAL DO MÉDICO (referência obrigatória):
- Cor primária (deve dominar o design): ${cor1}
- Cor secundária: ${cor2}
- Cor de fundo: ${fundo}
- Tipografia: ${fonte}${perfil.nome ? `\n- Nome do médico: ${perfil.nome}` : ""}
- Estética: editorial premium, iluminação cinematográfica, alto contraste, acabamento sofisticado. Sem visual de template/Canva, sem estética clínica/hospitalar.`
  }

  const limparResultados = () => {
    setImageUrl(null); setRevisao(null); setSelectedHist(null)
    setVariacoes([]); setVariacaoSel(null); setAviso(null)
  }

  const gerarPrompt = async () => {
    if (!ideia.trim()) { setErrorImg("Digite o tema da arte antes de continuar."); return }
    setErrorImg(null); setLoadingPrompt(true); setPromptParts(null); setEditando(false)
    limparResultados()
    try {
      const es = ESTILOS[estilo]
      const ft = FORMATOS[formato]
      const texto = await textoDaIa({
        max_tokens: 1400,
        system: `You are a world-class creative director specializing in ultra-premium luxury medical content for social media. Transform simple ideas into cinematic, editorial-grade visual prompts.

${getVisualIdentity()}

Return ONLY valid JSON. No markdown. No code blocks. No explanation.`,
        messages: [{
          role: "user",
          content: `Creative direction request:
THEME: ${ideia}
FORMAT: ${ft.label} (${ft.ratio}, ${ft.desc})
STYLE: ${es.label}, ${es.prompt}

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
}`,
        }],
      })
      const parsed = extrairJson(texto, "{")
      if (!partesValidas(parsed)) throw new Error("formato")
      setPromptParts(parsed)
      setPromptEditado(parsed.promptFinal)
      setExpanded([...PART_KEYS])
    } catch {
      setErrorImg("Não foi possível elaborar a direção criativa agora. O tema foi mantido, tente de novo.")
    } finally {
      setLoadingPrompt(false)
    }
  }

  // ── Revisão do prompt (a IA lê o texto, não a imagem) ───────────────────────

  const revisarPrompt = useCallback(async (prompt: string, histId: number) => {
    setLoadingRevisao(true)
    try {
      const texto = await textoDaIa({
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `You are a creative director reviewing the PROMPT (not the image) that was sent to an AI image generator for a medical social media post. Prompt used: "${prompt.slice(0, 500)}".

Write a brief review in Brazilian Portuguese (3-4 sentences, no emojis). Begin with "Prompt consistente." or "Prompt com pontos de atenção." Then evaluate clarity, alignment with a premium medical content brief, and give one specific improvement suggestion.`,
        }],
      })
      setRevisao(texto)
      setHistory(prev => prev.map(h => h.id === histId ? { ...h, revisao: texto } : h))
    } catch {
      setRevisao(null)
    } finally {
      setLoadingRevisao(false)
    }
  }, [])

  const registrar = (url: string, prompt: string, aspect: string) => {
    const item: HistoryItem = {
      id: ++idRef.current, imageUrl: url, prompt, aspect,
      formato: FORMATOS[formato].label, estilo: ESTILOS[estilo].label, revisao: "", timestamp: hora(),
    }
    setHistory(prev => [item, ...prev].slice(0, 5))
    return item
  }

  // ── Etapa 2: imagem e variações ─────────────────────────────────────────────

  const gerarImagem = async () => {
    const prompt = promptAtual
    if (!prompt) return
    const aspect = `${FORMATOS[formato].wR}/${FORMATOS[formato].hR}`
    setErrorImg(null); setLoadingImage(true); limparResultados()
    try {
      const url = await pedirImagem(prompt, FORMATOS[formato].ratio, modelo)
      setImageUrl(url); setImageAspect(aspect)
      const item = registrar(url, prompt, aspect)
      revisarPrompt(prompt, item.id)
    } catch (e) {
      setErrorImg(e instanceof Error ? e.message : "Não foi possível gerar a imagem.")
    } finally {
      setLoadingImage(false)
    }
  }

  const gerarVariacoes = async () => {
    const base = promptAtual
    if (!base) { setErrorImg("Gere a direção criativa primeiro."); return }
    const aspect = `${FORMATOS[formato].wR}/${FORMATOS[formato].hR}`
    setErrorImg(null); setLoadingVariacoes(true); limparResultados()
    const prompts = [
      base,
      base + ", alternative composition, different angle, more minimalist approach",
      base + ", bolder typography, stronger contrast, more dramatic lighting",
    ]
    const rotulos = ["Original", "Mais minimalista", "Mais dramática"]
    try {
      const settled = await Promise.allSettled(prompts.map(p => pedirImagem(p, FORMATOS[formato].ratio, modelo)))
      const geradas: Variacao[] = []
      settled.forEach((r, i) => { if (r.status === "fulfilled") geradas.push({ url: r.value, prompt: prompts[i], label: rotulos[i], aspect }) })
      if (geradas.length === 0) {
        const motivo = settled.find((r): r is PromiseRejectedResult => r.status === "rejected")?.reason
        throw motivo instanceof Error ? motivo : new Error("Nenhuma variação foi gerada.")
      }
      setVariacoes(geradas)
      if (geradas.length < 3) setAviso(`${geradas.length} de 3 variações foram geradas. Use Regenerar para tentar de novo.`)
    } catch (e) {
      setErrorImg(e instanceof Error ? e.message : "Não foi possível gerar as variações.")
    } finally {
      setLoadingVariacoes(false)
    }
  }

  const confirmarVariacao = () => {
    if (variacaoSel === null || !variacoes[variacaoSel]) return
    const escolhida = variacoes[variacaoSel]
    variacoes.forEach((v, i) => { if (i !== variacaoSel) registrar(v.url, v.prompt, v.aspect) })
    const item = registrar(escolhida.url, escolhida.prompt, escolhida.aspect)
    setImageUrl(escolhida.url); setImageAspect(escolhida.aspect); setSelectedHist(null)
    setVariacoes([]); setVariacaoSel(null); setAviso(null)
    revisarPrompt(escolhida.prompt, item.id)
  }

  const downloadImage = (url?: string) => {
    const alvo = url ?? displayImage
    if (!alvo) return
    const a = document.createElement("a")
    a.href = alvo; a.download = `diretor-criativo-${Date.now()}.png`; a.click()
  }

  // ── Headlines ───────────────────────────────────────────────────────────────

  const gerarHeadlines = async () => {
    if (!headlineTema.trim()) { setErrorHead("Digite o tema antes de gerar as headlines."); return }
    setErrorHead(null); setLoadingHeadlines(true); setHeadlines([]); setHeadlineFilter("Todos")
    try {
      const texto = await textoDaIa({
        max_tokens: 8000,
        system: `Você é especialista em copywriting médico para Instagram, com foco em Endocrinologia, Nutrologia e Longevidade. Crie headlines que combinam autoridade científica com gatilhos emocionais. Não invente números, porcentagens, estudos nem experiência pessoal do médico (anos de prática, número de pacientes atendidos). Retorne SOMENTE JSON array, sem markdown.`,
        messages: [{
          role: "user",
          content: `Tema médico: ${headlineTema}

Gere 100 headlines para posts médicos sobre este tema.

Gatilhos emocionais:
- Medo: provoca urgência ou preocupação legítima com saúde
- Curiosidade: desperta o interesse de saber mais
- Autoridade: posiciona o médico como especialista
- Escassez: cria senso de exclusividade ou urgência temporal
- Dor: fala diretamente com o problema ou sofrimento do paciente
- Benefício: foca na transformação ou resultado positivo esperado

Dê a cada headline uma nota de 0 a 100 para clareza e impacto emocional.

Retorne JSON array: [{"titulo": "...", "gatilho": "Medo|Curiosidade|Autoridade|Escassez|Dor|Benefício", "score": 85}, ...]

Distribua as headlines entre os 6 gatilhos.`,
        }],
      })
      const lista = headlinesValidas(extrairJson(texto, "["))
      if (lista.length === 0) throw new Error("vazio")
      setHeadlines(lista)
    } catch {
      setErrorHead("Não foi possível gerar as headlines agora. O tema foi mantido, tente de novo.")
    } finally {
      setLoadingHeadlines(false)
    }
  }

  const headlinesVisiveis = headlines.filter(h => headlineFilter === "Todos" || h.gatilho === headlineFilter)
  const pautasFiltradas = pautas.filter(p => {
    const q = pautaSearch.toLowerCase()
    return !q || p.titulo.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)
  })

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <PageHeader title="Diretor Criativo" caption="Direção criativa, geração de imagens e headlines para o seu Instagram" />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Segmented<"imagens" | "headlines">
          label="Seção"
          value={secao}
          onChange={setSecao}
          options={[{ value: "imagens", label: "Imagens" }, { value: "headlines", label: "Headlines" }]}
        />

        {/* ════ IMAGENS ════ */}
        {secao === "imagens" && (
          <div className="space-y-4">
            <Panel as="section" className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">1. Formato</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(FORMATOS) as Formato[]).map(f => <FormatoBotao key={f} id={f} active={formato === f} onClick={() => setFormato(f)} />)}
              </div>
            </Panel>

            <Panel as="section" className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">2. Estilo</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {(Object.entries(ESTILOS) as [EstiloId, typeof ESTILOS[EstiloId]][]).map(([id, s]) => (
                  <button key={id} type="button" aria-pressed={estilo === id} onClick={() => setEstilo(id)} className={cn(OPCAO, estilo === id ? OPCAO_ON : OPCAO_OFF)}>
                    <span className="block text-[13px] font-semibold leading-tight text-px-ink">{s.label}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-px-muted">{s.desc}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel as="section" className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="img-tema" className="text-[15px] font-semibold text-px-ink">3. Tema da arte</label>
                <PxButton variant="secondary" size="sm" onClick={() => abrirPautas("imagens")}>Banco de Pautas</PxButton>
              </div>
              <textarea id="img-tema" value={ideia} onChange={e => setIdeia(e.target.value)} rows={3} className={TEXTAREA}
                placeholder="Ex: resistência à insulina, menopausa e hormônios, jejum intermitente" />
            </Panel>

            <Panel as="section" className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">4. Modelo de geração</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(Object.entries(MODELOS) as [Modelo, typeof MODELOS[Modelo]][]).map(([id, m]) => (
                  <button key={id} type="button" disabled={!m.available} aria-pressed={modelo === id} onClick={() => setModelo(id)}
                    className={cn(OPCAO, modelo === id ? OPCAO_ON : OPCAO_OFF, !m.available && "cursor-not-allowed opacity-60 hover:bg-white/50")}>
                    <span className="block text-[13px] font-semibold text-px-ink">{m.label}</span>
                    <span className="block text-[12px] text-px-muted">{m.sub}</span>
                    <span className="mt-0.5 block text-[12.5px] text-px-muted">{m.available ? m.note : "Indisponível no momento"}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <PxButton fullWidth loading={loadingPrompt} disabled={anyLoading || !ideia.trim()} onClick={gerarPrompt}>
              {loadingPrompt ? "Elaborando a direção criativa" : "Elaborar direção criativa"}
            </PxButton>

            {errorImg && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{errorImg}</p>}
            {aviso && <p role="status" className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[13px] text-px-warn">{aviso}</p>}
            {(loadingImage || loadingVariacoes) && (
              <p role="status" className="text-[13.5px] text-px-muted">
                {loadingVariacoes ? `Gerando 3 variações com ${MODELOS[modelo].label}. Pode levar alguns instantes.` : `Gerando a imagem com ${MODELOS[modelo].label}. Pode levar alguns instantes.`}
              </p>
            )}

            {!promptParts && !loadingPrompt && (
              <p className="text-[13.5px] leading-relaxed text-px-muted">
                A IA elabora uma direção criativa com sete componentes (conceito, direção artística, composição, iluminação, tipografia, elementos e prompt negativo) e um prompt final em inglês. Você revisa, edita se quiser e só então manda para a geração de imagem.
              </p>
            )}

            {/* Direção criativa */}
            {promptParts && !loadingPrompt && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-px-ink">Direção criativa</h2>
                    <p className="text-[13px] text-px-muted">{ESTILOS[estilo].label} · {FORMATOS[formato].label} · {FORMATOS[formato].ratio}</p>
                  </div>
                  <PxButton variant="secondary" size="sm" disabled={anyLoading} onClick={gerarPrompt}>Regenerar</PxButton>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PART_KEYS.map(key => (
                    <Panel as="article" key={key} className={cn("!p-0", key === "negativo" && "sm:col-span-2")}>
                      <button type="button" aria-expanded={expanded.includes(key)} onClick={() => toggleExpanded(key)} className="w-full space-y-1.5 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 rounded-px-card">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold text-px-ink">{PART_LABEL[key]}</span>
                          <span className="text-[12px] text-px-muted">{expanded.includes(key) ? "Recolher" : "Expandir"}</span>
                        </span>
                        <span className={cn("block text-[13.5px] leading-relaxed text-px-ink", !expanded.includes(key) && "line-clamp-2")}>{promptParts[key]}</span>
                      </button>
                    </Panel>
                  ))}
                </div>

                <Panel as="section" className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-px-ink">Prompt final</h3>
                    <div className="flex flex-wrap gap-2">
                      {promptEditadoDiferente && <PxButton variant="quiet" size="sm" onClick={() => setPromptEditado(promptParts.promptFinal)}>Restaurar original</PxButton>}
                      <PxButton variant="secondary" size="sm" aria-label={editando ? "Concluir edição do prompt" : "Editar prompt"} onClick={() => setEditando(v => !v)}>{editando ? "Concluir edição" : "Editar"}</PxButton>
                      <CopyButton text={promptAtual} label="Copiar" />
                    </div>
                  </div>
                  {editando ? (
                    <textarea aria-label="Prompt final" value={promptEditado} onChange={e => setPromptEditado(e.target.value)} className={cn(TEXTAREA, "resize-y font-mono leading-relaxed")} style={{ minHeight: 140 }} />
                  ) : (
                    <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-px-ink">{promptAtual}</p>
                  )}
                  {promptEditadoDiferente && <p className="text-[13px] text-px-muted">Este prompt foi editado por você e é o que será enviado para a geração.</p>}
                </Panel>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <PxButton fullWidth loading={loadingImage} disabled={loadingImage || loadingVariacoes || !promptAtual.trim()} onClick={gerarImagem}>
                    {loadingImage ? "Gerando a imagem" : `Gerar imagem com ${MODELOS[modelo].label}`}
                  </PxButton>
                  <PxButton variant="secondary" loading={loadingVariacoes} disabled={loadingImage || loadingVariacoes || !promptAtual.trim()} onClick={gerarVariacoes}>
                    {loadingVariacoes ? "Gerando variações" : "Gerar 3 variações"}
                  </PxButton>
                </div>
              </div>
            )}

            {/* Variações */}
            {variacoes.length > 0 && !loadingVariacoes && (
              <section className="space-y-3" aria-label="Variações geradas">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-px-ink">{variacoes.length} {variacoes.length === 1 ? "variação gerada" : "variações geradas"}</h2>
                    <p className="text-[13px] text-px-muted">Escolha uma para confirmar. As demais vão para o histórico da sessão.</p>
                  </div>
                  <PxButton variant="secondary" size="sm" onClick={gerarVariacoes}>Regenerar</PxButton>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {variacoes.map((v, i) => (
                    <Panel as="article" key={i} className={cn("space-y-2 !p-3", variacaoSel === i && "ring-2 ring-px-ink")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.url} alt={`${v.label}, ${FORMATOS[formato].label}`} className="w-full rounded-px-ctl object-cover" style={{ aspectRatio: v.aspect }} />
                      <div className="flex items-center justify-between gap-2">
                        <Tag tone="neutral">{v.label}</Tag>
                        {variacaoSel === i && <span className="text-[12px] font-semibold text-px-ink">Selecionada</span>}
                      </div>
                      <div className="flex gap-2">
                        <PxButton size="sm" variant={variacaoSel === i ? "primary" : "secondary"} fullWidth onClick={() => setVariacaoSel(prev => prev === i ? null : i)}>
                          {variacaoSel === i ? "Selecionada" : "Escolher esta"}
                        </PxButton>
                        <PxButton size="sm" variant="secondary" aria-label={`Baixar ${v.label}`} onClick={() => downloadImage(v.url)}>Baixar</PxButton>
                      </div>
                    </Panel>
                  ))}
                </div>
                {variacaoSel !== null && <PxButton fullWidth onClick={confirmarVariacao}>Confirmar: {variacoes[variacaoSel]?.label}</PxButton>}
              </section>
            )}

            {/* Imagem gerada */}
            {displayImage && !loadingImage && !loadingVariacoes && (
              <div className="space-y-4">
                <Panel as="section" className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-px-ink">Imagem gerada</h2>
                      {selectedHist && <Tag tone="neutral">Histórico, {selectedHist.timestamp}</Tag>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CopyButton text={promptExibido} label="Copiar prompt" />
                      {!selectedHist && promptParts && <PxButton variant="secondary" size="sm" onClick={gerarImagem}>Regenerar</PxButton>}
                      <PxButton size="sm" onClick={() => downloadImage()}>Baixar</PxButton>
                    </div>
                  </div>
                  <div className="flex justify-center rounded-px-card bg-px-ink/5 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={displayImage} alt="Imagem gerada pelo Diretor Criativo" className="max-h-[640px] max-w-full rounded object-contain" style={{ aspectRatio: displayAspect }} />
                  </div>
                </Panel>

                <Panel as="section" className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-px-ink">Revisão do prompt</h3>
                  <p className="text-[13px] text-px-muted">A IA analisa o texto do prompt. Ela não vê a imagem gerada, então confira o resultado você mesmo.</p>
                  {displayRevisao ? (
                    <p className="text-[13.5px] leading-relaxed text-px-ink">{displayRevisao}</p>
                  ) : loadingRevisao && !selectedHist ? (
                    <p role="status" className="text-[13.5px] text-px-muted">Revisando o prompt.</p>
                  ) : (
                    <p className="text-[13.5px] text-px-muted">Sem revisão disponível para este item.</p>
                  )}
                </Panel>
              </div>
            )}

            {/* Histórico */}
            {history.length > 0 && (
              <Panel as="section" className="space-y-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-px-ink">Histórico da sessão</h2>
                  <p className="text-[13px] text-px-muted">Guarda as últimas 5 imagens e some ao recarregar a página. Baixe o que quiser manter.</p>
                </div>
                <ul className="flex gap-2 overflow-x-auto pb-1">
                  {history.map(h => (
                    <li key={h.id} className="flex-shrink-0">
                      <button type="button" aria-pressed={selectedHist?.id === h.id} onClick={() => setSelectedHist(selectedHist?.id === h.id ? null : h)}
                        aria-label={`${h.estilo}, ${h.formato}, ${h.timestamp}`}
                        className={cn("block h-14 w-14 overflow-hidden rounded-px-ctl border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40", selectedHist?.id === h.id ? "border-px-ink" : "border-transparent")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={h.imageUrl} alt="" className="h-full w-full object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
                {selectedHist && <p className="text-[13px] text-px-muted">{selectedHist.estilo} · {selectedHist.formato} · {selectedHist.timestamp}</p>}
              </Panel>
            )}
          </div>
        )}

        {/* ════ HEADLINES ════ */}
        {secao === "headlines" && (
          <div className="space-y-4">
            <Panel as="section" className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-px-ink">Headlines por gatilho emocional</h2>
                  <p className="text-[13px] text-px-muted">A IA sugere cerca de 100 headlines e dá a cada uma uma nota estimada de clareza e impacto.</p>
                </div>
                <PxButton variant="secondary" size="sm" onClick={() => abrirPautas("headlines")}>Banco de Pautas</PxButton>
              </div>
              <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={e => { e.preventDefault(); if (!loadingHeadlines) gerarHeadlines() }}>
                <div className="flex-1">
                  <Field label="Tema" htmlFor="hl-tema">
                    <PxInput id="hl-tema" value={headlineTema} onChange={e => setHeadlineTema(e.target.value)} placeholder="Ex: resistência à insulina, testosterona e andropausa" />
                  </Field>
                </div>
                <PxButton type="submit" loading={loadingHeadlines} disabled={!headlineTema.trim()}>
                  {loadingHeadlines ? "Gerando" : "Gerar headlines"}
                </PxButton>
              </form>
              <p role="note" className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[13px] text-px-warn">
                Texto gerado por IA. Confira números, afirmações clínicas e promessas de resultado antes de publicar.
              </p>
            </Panel>

            {errorHead && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{errorHead}</p>}
            {loadingHeadlines && <p role="status" className="text-[13.5px] text-px-muted">Gerando as headlines. Pode levar até um minuto.</p>}

            {headlines.length > 0 && !loadingHeadlines && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Segmented<"Todos" | Gatilho>
                    label="Filtrar por gatilho"
                    value={headlineFilter}
                    onChange={setHeadlineFilter}
                    options={[{ value: "Todos", label: `Todos ${headlines.length}` }, ...GATILHOS.map(g => ({ value: g, label: `${g} ${headlines.filter(h => h.gatilho === g).length}` }))]}
                  />
                  <span className="text-[13px] text-px-muted">{headlinesVisiveis.length} {headlinesVisiveis.length === 1 ? "headline" : "headlines"}, da maior para a menor nota</span>
                </div>

                <Panel as="section" className="!p-0">
                  {headlinesVisiveis.length === 0 ? (
                    <p className="p-5 text-[13.5px] text-px-muted">Nenhuma headline neste gatilho.</p>
                  ) : (
                    <ul className="divide-y divide-px-line">
                      {headlinesVisiveis.map((h, idx) => (
                        <li key={`${idx}-${h.titulo}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                          <span className="w-7 flex-shrink-0 text-[13px] tabular-nums text-px-muted">{idx + 1}</span>
                          <span className="w-24 flex-shrink-0"><Tag tone="neutral">{h.gatilho}</Tag></span>
                          <p className="min-w-[200px] flex-1 text-[13.5px] leading-snug text-px-ink">{h.titulo}</p>
                          <span className="w-16 flex-shrink-0 text-right text-[13px] tabular-nums text-px-ink" title="Nota estimada pela IA, não mede alcance real">
                            nota {h.score}
                          </span>
                          <div className="flex flex-shrink-0 gap-2">
                            <CopyButton text={h.titulo} iconOnly label="Copiar headline" />
                            <PxButton size="sm" variant="secondary" onClick={() => { setIdeia(h.titulo); setSecao("imagens") }}>Usar na arte</PxButton>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </>
            )}

            {!loadingHeadlines && headlines.length === 0 && !errorHead && (
              <p className="text-[13.5px] leading-relaxed text-px-muted">
                Digite um tema e gere as headlines. Depois filtre por gatilho, copie a que servir ou envie direto para a criação da arte.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Banco de Pautas */}
      <PxModal open={pautaOpen} onClose={() => setPautaOpen(false)} title="Banco de Pautas" className="max-w-lg">
        <div className="space-y-3">
          <Field label="Buscar pauta" htmlFor="img-busca">
            <PxInput id="img-busca" value={pautaSearch} onChange={e => setPautaSearch(e.target.value)} placeholder="Título ou categoria" />
          </Field>
          <div className="max-h-[50vh] overflow-y-auto">
            {loadingPautas ? (
              <p role="status" className="py-8 text-center text-[13.5px] text-px-muted">Carregando pautas.</p>
            ) : pautasError ? (
              <div className="space-y-2 py-4">
                <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{pautasError}</p>
                <PxButton size="sm" variant="secondary" onClick={() => abrirPautas(pautaAlvo)}>Tentar de novo</PxButton>
              </div>
            ) : pautasFiltradas.length === 0 ? (
              <p className="py-8 text-center text-[13.5px] text-px-muted">{pautas.length === 0 ? "O Banco de Pautas está vazio." : "Nenhuma pauta encontrada para essa busca."}</p>
            ) : (
              <ul className="space-y-1">
                {pautasFiltradas.map(p => (
                  <li key={p.id}>
                    <button type="button" onClick={() => selecionarPauta(p)} className="w-full rounded-px-card border border-transparent px-3 py-2.5 text-left hover:border-px-line hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-[13.5px] font-medium leading-snug text-px-ink">{p.titulo}</span>
                        <Tag tone="neutral">{p.prioridade}</Tag>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-px-muted">
                        <span>{p.categoria}</span>
                        {pautaAlvo === "imagens" && <span>Estilo sugerido: {ESTILOS[CATEGORIA_PARA_ESTILO[p.categoria] ?? "card-premium"].label}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-center text-[12.5px] text-px-muted">{pautas.length} {pautas.length === 1 ? "pauta" : "pautas"} no banco. Clique em uma para importar.</p>
        </div>
      </PxModal>
    </div>
  )
}
