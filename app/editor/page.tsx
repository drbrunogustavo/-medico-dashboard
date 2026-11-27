"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { AI_MODEL } from "@/lib/ai-config"
import { Panel, PxButton, PxModal, Segmented, Field, PxInput, Tag, PageHeader } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Tipo = "video" | "asset" | "texto"
type Posicao = "topo" | "centro" | "rodape"

interface Segment {
  id: string
  segundo_inicio: number
  segundo_fim: number
  instrucao: string
  tipo: Tipo
  texto_sugerido?: string
  assetId?: string
  posicao?: Posicao
  opacidade?: number
  texto?: string
}

interface Asset { id: string; name: string; url: string }
interface Pauta { id: number | string; titulo: string; categoria: string; nota?: string }

// ─── Constantes ───────────────────────────────────────────────────────────────

const PX_PER_SEC = 12
const TOTAL_SECS = 60
const LABEL_W = 56
const TIPOS: Tipo[] = ["video", "asset", "texto"]
const TIPO_LABEL: Record<Tipo, string> = { video: "Vídeo", asset: "Imagem", texto: "Texto" }

// Os três tipos se distinguem pelo rótulo da faixa e pelo tratamento do bloco, sem depender de cor.
const BLOCO: Record<Tipo, string> = {
  video: "bg-px-ink border-px-ink text-white",
  asset: "bg-px-accent-soft border-px-accent text-px-accent",
  texto: "bg-white border-px-ink text-px-ink",
}

const TEXTAREA = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

// ─── Funções auxiliares ───────────────────────────────────────────────────────

function fmtTime(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

const snap = (n: number) => Math.round(n * 2) / 2
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

/** Aceita só segmentos com tempos coerentes e tipo conhecido; o resto da resposta da IA é descartado. */
function segmentosValidos(raw: unknown): Omit<Segment, "id">[] {
  if (!Array.isArray(raw)) return []
  const out: Omit<Segment, "id">[] = []
  for (const s of raw) {
    if (!s || typeof s !== "object") continue
    const r = s as Record<string, unknown>
    const ini = Number(r.segundo_inicio)
    const fim = Number(r.segundo_fim)
    if (!Number.isFinite(ini) || !Number.isFinite(fim) || fim <= ini) continue
    if (!TIPOS.includes(r.tipo as Tipo)) continue
    const inicio = clamp(snap(ini), 0, TOTAL_SECS - 0.5)
    out.push({
      segundo_inicio: inicio,
      segundo_fim: clamp(snap(fim), inicio + 0.5, TOTAL_SECS),
      instrucao: typeof r.instrucao === "string" && r.instrucao.trim() ? r.instrucao.trim() : TIPO_LABEL[r.tipo as Tipo],
      tipo: r.tipo as Tipo,
      texto_sugerido: typeof r.texto_sugerido === "string" ? r.texto_sugerido : undefined,
    })
  }
  return out
}

/** Escapa o texto para o filtro drawtext do ffmpeg. */
function escDrawtext(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/%/g, "\\%")
}

function drawtextFilter(seg: Segment): string {
  const txt = escDrawtext(seg.texto || seg.texto_sugerido || "")
  if (!txt) return ""
  const y = seg.posicao === "topo" ? "80" : seg.posicao === "rodape" ? "h-100" : "h*0.78"
  return `drawtext=text='${txt}':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=${y}` +
    `:enable='between(t\\,${seg.segundo_inicio}\\,${seg.segundo_fim})'` +
    `:box=1:boxcolor=black@0.72:boxborderw=10`
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [maxStep, setMaxStep] = useState<1 | 2 | 3>(1)
  const [roteiro, setRoteiro] = useState("")
  const [timeline, setTimeline] = useState<Segment[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [pautaOpen, setPautaOpen] = useState(false)
  const [pautas, setPautas] = useState<Pauta[]>([])
  const [loadingPautas, setLoadingPautas] = useState(false)
  const [pautasError, setPautasError] = useState<string | null>(null)
  const [pautaSearch, setPautaSearch] = useState("")

  const [gerarOpen, setGerarOpen] = useState(false)
  const [temaRoteiro, setTemaRoteiro] = useState("")
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false)
  const [gerarError, setGerarError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const videoInput = useRef<HTMLInputElement>(null)
  const assetImgMap = useRef<Map<string, HTMLImageElement>>(new Map())
  const urlsRef = useRef<Set<string>>(new Set())

  // Refs mantêm o laço de animação sem fechamento desatualizado
  const timelineRef = useRef<Segment[]>([])
  timelineRef.current = timeline
  const currentTimeRef = useRef(0)
  currentTimeRef.current = currentTime

  const selectedSeg = timeline.find(s => s.id === selectedId) ?? null

  // Etapas já alcançadas continuam acessíveis pela navegação
  useEffect(() => { setMaxStep(m => (step > m ? step : m)) }, [step])

  // Libera as URLs de arquivo locais ao sair da página
  useEffect(() => {
    const urls = urlsRef.current
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); urls.clear() }
  }, [])

  // ── Renderização do preview ──────────────────────────────────────────────────

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const video = videoRef.current
    const segments = timelineRef.current
    const t = video ? video.currentTime : currentTimeRef.current
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = "#14130f"
    ctx.fillRect(0, 0, W, H)

    if (video && video.readyState >= 2) {
      try { ctx.drawImage(video, 0, 0, W, H) } catch { /* ignora */ }
    }

    for (const seg of segments.filter(s => t >= s.segundo_inicio && t < s.segundo_fim)) {
      if (seg.tipo === "asset" && seg.assetId) {
        const img = assetImgMap.current.get(seg.assetId)
        if (img && img.complete) {
          ctx.save()
          ctx.globalAlpha = (seg.opacidade ?? 85) / 100
          const drawW = W * 0.88
          const drawH = drawW / (img.width / img.height)
          const x = (W - drawW) / 2
          const y = seg.posicao === "topo" ? 24 : seg.posicao === "rodape" ? H - drawH - 24 : (H - drawH) / 2
          ctx.drawImage(img, x, y, drawW, drawH)
          ctx.restore()
        }
      }

      if (seg.tipo === "texto") {
        const txt = seg.texto || seg.texto_sugerido || ""
        if (!txt) continue
        ctx.save()
        const fontSize = Math.round(W * 0.052)
        ctx.font = `700 ${fontSize}px Inter, sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        const words = txt.split(" ")
        const maxLineW = W - 32
        const lines: string[] = []
        let line = ""
        for (const word of words) {
          const test = line ? line + " " + word : word
          if (ctx.measureText(test).width > maxLineW && line) { lines.push(line); line = word } else { line = test }
        }
        if (line) lines.push(line)

        const lineH = fontSize * 1.35
        const boxH = lines.length * lineH + 20
        const boxW = Math.min(Math.max(...lines.map(l => ctx.measureText(l).width)) + 32, W - 16)
        const y = seg.posicao === "topo" ? 56 : seg.posicao === "rodape" ? H - 56 : H * 0.78

        ctx.fillStyle = "rgba(0,0,0,0.72)"
        ctx.beginPath()
        ctx.roundRect(W / 2 - boxW / 2, y - boxH / 2, boxW, boxH, 6)
        ctx.fill()
        ctx.fillStyle = "#ffffff"
        lines.forEach((l, i) => ctx.fillText(l, W / 2, y + (i - (lines.length - 1) / 2) * lineH))
        ctx.restore()
      }
    }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      const loop = () => { renderFrame(); rafRef.current = requestAnimationFrame(loop) }
      rafRef.current = requestAnimationFrame(loop)
    } else {
      cancelAnimationFrame(rafRef.current)
      renderFrame()
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, renderFrame])

  useEffect(() => { renderFrame() }, [timeline, currentTime, step, renderFrame])

  useEffect(() => {
    assets.forEach(asset => {
      if (!assetImgMap.current.has(asset.id)) {
        const img = new Image()
        img.src = asset.url
        img.onload = () => { assetImgMap.current.set(asset.id, img); renderFrame() }
      }
    })
  }, [assets, renderFrame])

  // ── Vídeo ───────────────────────────────────────────────────────────────────

  const togglePlay = () => {
    const v = videoRef.current
    if (!v || !videoUrl) return
    if (isPlaying) { v.pause(); setIsPlaying(false) } else {
      v.play().then(() => setIsPlaying(true)).catch(() => setError("O navegador não conseguiu reproduzir este vídeo."))
    }
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    setCurrentTime(t)
    if (videoRef.current) videoRef.current.currentTime = t
  }

  const novaUrl = (file: File | Blob) => {
    const url = URL.createObjectURL(file)
    urlsRef.current.add(url)
    return url
  }
  const soltarUrl = (url: string | null) => {
    if (!url) return
    URL.revokeObjectURL(url)
    urlsRef.current.delete(url)
  }

  const handleVideoUpload = (file: File) => {
    if (!file.type.startsWith("video/")) { setError("Escolha um arquivo de vídeo (MP4 ou MOV)."); return }
    setError(null)
    soltarUrl(videoUrl)
    const url = novaUrl(file)
    setVideoFile(file)
    setVideoUrl(url)
    setIsPlaying(false)
    setCurrentTime(0)
    const tmp = document.createElement("video")
    tmp.src = url
    tmp.onloadedmetadata = () => setVideoDuration(tmp.duration)
  }

  const removerVideo = () => {
    soltarUrl(videoUrl)
    setVideoFile(null); setVideoUrl(null); setIsPlaying(false); setVideoDuration(0); setCurrentTime(0)
  }

  const handleAssetUpload = (files: FileList) => {
    const novos: Asset[] = []
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return
      novos.push({ id: `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, url: novaUrl(file) })
    })
    if (novos.length) setAssets(prev => [...prev, ...novos])
  }

  const removerAsset = (a: Asset) => {
    soltarUrl(a.url)
    assetImgMap.current.delete(a.id)
    setAssets(prev => prev.filter(x => x.id !== a.id))
    setTimeline(prev => prev.map(s => s.assetId === a.id ? { ...s, assetId: undefined } : s))
  }

  // ── Roteiro ─────────────────────────────────────────────────────────────────

  const analisarRoteiro = async () => {
    if (!roteiro.trim()) { setError("Cole um roteiro antes de analisar."); return }
    setError(null); setIsAnalyzing(true)
    try {
      const res = await fetch("/api/analisar-roteiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roteiro }),
      })
      const data = await res.json().catch(() => null)
      const validos = res.ok && data ? segmentosValidos(data.segments) : []
      if (validos.length === 0) throw new Error("sem segmentos")

      const stamp = Date.now()
      setTimeline(validos.map((s, i) => ({
        ...s,
        id: `seg-${i}-${stamp}`,
        opacidade: 85,
        posicao: s.posicao ?? "centro",
        texto: s.texto_sugerido ?? "",
      })))
      setSelectedId(null)
      setStep(2)
    } catch {
      setError("Não foi possível dividir o roteiro em segmentos. O texto foi mantido, tente de novo.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const gerarRoteiro = async () => {
    if (!temaRoteiro.trim()) return
    setGerarError(null)
    setGerandoRoteiro(true)
    try {
      const prompt =
        'Crie um roteiro para Reel médico sobre: "' + temaRoteiro + '"\n\n' +
        'Formato: timecodes para vídeo de 45-60 segundos, tom médico direto e sem academicismo.\n' +
        'Use exatamente este formato:\n[0-3s] gancho de abertura\n[3-10s] desenvolvimento 1\n[10-25s] desenvolvimento 2\n[25-40s] desenvolvimento 3\n[40-55s] CTA final\n\n' +
        'Não invente números, estatísticas nem estudos. Se for citar um dado, escreva-o de forma que o médico consiga conferir a fonte.\n' +
        'Retorne SOMENTE o roteiro com timecodes, sem explicações adicionais.'
      const res = await fetch("/api/roteiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
      })
      const data = await res.json().catch(() => null)
      const text: string = res.ok && typeof data?.content?.[0]?.text === "string" ? data.content[0].text.trim() : ""
      if (!text) throw new Error("vazio")
      setRoteiro(text)
      setGerarOpen(false)
      setTemaRoteiro("")
    } catch {
      setGerarError("Não foi possível gerar o roteiro agora. Tente de novo em instantes.")
    } finally {
      setGerandoRoteiro(false)
    }
  }

  const abrirPautas = async () => {
    setPautaOpen(true); setPautaSearch(""); setPautasError(null)
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
    setRoteiro([p.titulo, p.nota].filter(Boolean).join("\n\n"))
    setPautaOpen(false)
  }

  // ── Edição de segmentos ─────────────────────────────────────────────────────

  const updateSegment = (id: string, patch: Partial<Segment>) => {
    setTimeline(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  const moverSegmento = (id: string, novoInicio: number) => {
    setTimeline(prev => prev.map(s => {
      if (s.id !== id) return s
      const dur = s.segundo_fim - s.segundo_inicio
      const ini = snap(clamp(novoInicio, 0, TOTAL_SECS - dur))
      return { ...s, segundo_inicio: ini, segundo_fim: snap(ini + dur) }
    }))
  }

  const definirTempos = (id: string, campo: "segundo_inicio" | "segundo_fim", valor: number) => {
    if (!Number.isFinite(valor)) return
    setTimeline(prev => prev.map(s => {
      if (s.id !== id) return s
      if (campo === "segundo_inicio") {
        const ini = snap(clamp(valor, 0, s.segundo_fim - 0.5))
        return { ...s, segundo_inicio: ini }
      }
      return { ...s, segundo_fim: snap(clamp(valor, s.segundo_inicio + 0.5, TOTAL_SECS)) }
    }))
  }

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent, seg: Segment) => {
    e.stopPropagation()
    setSelectedId(seg.id)
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const origStart = seg.segundo_inicio
    const duration = seg.segundo_fim - seg.segundo_inicio

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const cx = "touches" in ev ? ev.touches[0].clientX : ev.clientX
      const novo = snap(clamp(origStart + (cx - clientX) / PX_PER_SEC, 0, TOTAL_SECS - duration))
      setTimeline(prev => prev.map(s => s.id === seg.id ? { ...s, segundo_inicio: novo, segundo_fim: snap(novo + duration) } : s))
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("touchmove", onMove as EventListener)
      window.removeEventListener("touchend", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("touchmove", onMove as EventListener, { passive: true })
    window.addEventListener("touchend", onUp)
  }, [])

  // ── Exportação (ffmpeg.wasm) ────────────────────────────────────────────────

  const handleExport = async () => {
    if (!videoFile) { setError("Envie o vídeo antes de exportar."); return }
    setIsExporting(true); setExportProgress(0); setError(null)
    let ffmpegRef: { terminate: () => void } | null = null

    try {
      const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")])
      const ffmpeg = new FFmpeg()
      ffmpegRef = ffmpeg
      ffmpeg.on("progress", ({ progress }: { progress: number }) => setExportProgress(clamp(Math.round(progress * 100), 0, 100)))

      // Núcleo de thread única, carregado da CDN (não exige SharedArrayBuffer)
      const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      })
      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile))

      const textFilters = timeline.filter(s => s.tipo === "texto").map(drawtextFilter).filter(Boolean)
      const assetSegs = timeline.filter(s => s.tipo === "asset" && s.assetId && assets.some(a => a.id === s.assetId))
      const saida = ["-c:v", "libx264", "-preset", "fast", "-crf", "22", "-c:a", "aac", "-b:a", "128k", "-t", "60", "-movflags", "+faststart", "output.mp4"]
      const enquadra = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"

      if (assetSegs.length === 0) {
        await ffmpeg.exec(["-i", "input.mp4", "-vf", [enquadra, ...textFilters].join(","), ...saida])
      } else {
        const partes: string[] = [`[0:v]${enquadra}[scaled]`]
        const entradas: string[] = []
        let prev = "scaled"
        let idx = 1
        for (const seg of assetSegs) {
          const asset = assets.find(a => a.id === seg.assetId)!
          await ffmpeg.writeFile(`asset${idx}.png`, await fetchFile(asset.url))
          entradas.push("-i", `asset${idx}.png`)
          const oy = seg.posicao === "topo" ? "24" : seg.posicao === "rodape" ? "main_h-overlay_h-24" : "(main_h-overlay_h)/2"
          const next = `out${idx}`
          partes.push(
            `[${idx}:v]scale=960:-1,format=rgba,colorchannelmixer=aa=${(seg.opacidade ?? 85) / 100}[ov${idx}]`,
            `[${prev}][ov${idx}]overlay=(main_w-overlay_w)/2:${oy}:enable='between(t,${seg.segundo_inicio},${seg.segundo_fim})'[${next}]`,
          )
          prev = next
          idx++
        }
        let final = prev
        if (textFilters.length > 0) { partes.push(`[${prev}]${textFilters.join(",")}[final]`); final = "final" }
        await ffmpeg.exec(["-i", "input.mp4", ...entradas, "-filter_complex", partes.join(";"), "-map", `[${final}]`, "-map", "0:a?", ...saida])
      }

      const outData = await ffmpeg.readFile("output.mp4") as Uint8Array<ArrayBuffer>
      const url = URL.createObjectURL(new Blob([outData], { type: "video/mp4" }))
      const a = document.createElement("a")
      a.href = url; a.download = `reel-${Date.now()}.mp4`; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (e) {
      setError(
        "Não foi possível exportar o vídeo. Na primeira exportação o conversor é baixado da internet, então confira a conexão e tente de novo.\n" +
        `Detalhe técnico: ${String(e).slice(0, 160)}`
      )
    } finally {
      try { ffmpegRef?.terminate() } catch { /* já encerrado */ }
      setIsExporting(false)
    }
  }

  const totalDuration = timeline.length > 0
    ? Math.max(...timeline.map(s => s.segundo_fim), videoDuration)
    : Math.max(videoDuration, 30)
  const pautasFiltradas = pautas.filter(p => !pautaSearch || p.titulo.toLowerCase().includes(pautaSearch.toLowerCase()))

  const ExportButton = (
    <PxButton
      size="sm"
      onClick={handleExport}
      loading={isExporting}
      disabled={!videoFile}
      leftIcon={Download}
    >
      {isExporting ? `Exportando ${exportProgress}%` : "Exportar Reel 9:16"}
    </PxButton>
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Editor de Vídeo"
        caption="Divida o roteiro em segmentos, posicione textos e imagens e exporte em 9:16"
        actions={step >= 2 && timeline.length > 0 ? ExportButton : undefined}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <nav aria-label="Etapas" className="flex flex-wrap gap-1.5">
          {([{ n: 1, label: "Roteiro" }, { n: 2, label: "Arquivos" }, { n: 3, label: "Timeline" }] as { n: 1 | 2 | 3; label: string }[]).map(({ n, label }) => (
            <button
              key={n}
              type="button"
              disabled={n > maxStep}
              aria-current={step === n ? "step" : undefined}
              onClick={() => setStep(n)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40",
                step === n ? "bg-px-ink font-medium text-white" : "border border-px-line bg-white/70 text-px-ink hover:bg-white",
                n > maxStep && "cursor-default opacity-50 hover:bg-white/70"
              )}
            >
              {n}. {label}
            </button>
          ))}
        </nav>

        {error && <p role="alert" className="whitespace-pre-line rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{error}</p>}

        {/* ETAPA 1: ROTEIRO */}
        {step === 1 && (
          <div className="max-w-2xl space-y-4">
            <Panel as="section" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="ed-roteiro" className="text-[15px] font-semibold text-px-ink">Roteiro do vídeo</label>
                <div className="flex gap-2">
                  <PxButton variant="secondary" size="sm" onClick={() => { setGerarError(null); setGerarOpen(true) }}>Gerar roteiro</PxButton>
                  <PxButton variant="secondary" size="sm" onClick={abrirPautas}>Importar pauta</PxButton>
                </div>
              </div>
              <textarea
                id="ed-roteiro"
                value={roteiro}
                onChange={e => setRoteiro(e.target.value)}
                rows={12}
                className={cn(TEXTAREA, "font-mono leading-relaxed")}
                placeholder={"Cole o roteiro aqui.\n\nExemplo:\n[0-3s] Pergunta de abertura sobre o tema\n[3-8s] Apresentação do assunto\n[8-15s] Primeiro ponto, com a explicação"}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] text-px-muted">{roteiro.length} caracteres</span>
                <div className="flex gap-2">
                  {timeline.length > 0 && <PxButton variant="secondary" onClick={() => setStep(2)}>Usar timeline existente</PxButton>}
                  <PxButton onClick={analisarRoteiro} loading={isAnalyzing} disabled={!roteiro.trim()}>
                    {isAnalyzing ? "Analisando" : "Analisar roteiro"}
                  </PxButton>
                </div>
              </div>
            </Panel>
            <p className="text-[13.5px] leading-relaxed text-px-muted">
              A IA divide o roteiro em segmentos de timeline: onde você fala para a câmera, onde entra uma imagem de apoio e onde aparece texto em tela. A divisão é uma sugestão, e você ajusta cada tempo na etapa 3.
            </p>
          </div>
        )}

        {/* ETAPA 2: ARQUIVOS */}
        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel as="section" className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-px-ink">Vídeo principal</h2>
                <span className="text-[13px] text-px-muted">MP4 ou MOV, até 60 s</span>
              </div>

              {videoUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-px-card border border-px-line bg-white/60 p-3">
                    <div className="h-16 w-10 flex-shrink-0 overflow-hidden rounded bg-px-ink/10">
                      <video src={videoUrl} className="h-full w-full object-cover" muted aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-px-ink">{videoFile?.name}</p>
                      <p className="text-[13px] text-px-muted">{fmtTime(videoDuration)} · {((videoFile?.size ?? 0) / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <PxButton variant="quiet" size="sm" aria-label="Remover vídeo" onClick={removerVideo}>Remover</PxButton>
                  </div>
                  {videoDuration > TOTAL_SECS && (
                    <p role="note" className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[13px] text-px-warn">
                      O vídeo tem {fmtTime(videoDuration)}. A exportação usa só os primeiros 60 segundos.
                    </p>
                  )}
                  <PxButton variant="secondary" size="sm" onClick={() => videoInput.current?.click()}>Trocar vídeo</PxButton>
                </div>
              ) : (
                <label
                  className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-px-card border-2 border-dashed border-px-line p-10 text-center hover:bg-white/50 focus-within:ring-2 focus-within:ring-px-ink/40"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleVideoUpload(f) }}
                >
                  <span className="text-[13.5px] font-medium text-px-ink">Arraste o vídeo ou escolha um arquivo</span>
                  <span className="text-[13px] text-px-muted">No celular, a galeria e a câmera aparecem como opção</span>
                  <input
                    ref={videoInput}
                    type="file"
                    accept="video/*"
                    aria-label="Escolher vídeo"
                    className="sr-only"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); e.target.value = "" }}
                  />
                </label>
              )}
              {videoUrl && (
                <input ref={videoInput} type="file" accept="video/*" aria-label="Trocar vídeo" className="sr-only" tabIndex={-1}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); e.target.value = "" }} />
              )}
            </Panel>

            <Panel as="section" className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-px-ink">Imagens de apoio</h2>
                <span className="text-[13px] text-px-muted">PNG ou JPG, quantas quiser</span>
              </div>
              <label
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-px-card border-2 border-dashed border-px-line p-5 text-center hover:bg-white/50 focus-within:ring-2 focus-within:ring-px-ink/40"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) handleAssetUpload(e.dataTransfer.files) }}
              >
                <span className="text-[13.5px] font-medium text-px-ink">Gráficos, infográficos, fotos de apoio</span>
                <input type="file" accept="image/*" multiple aria-label="Escolher imagens" className="sr-only"
                  onChange={e => { if (e.target.files) handleAssetUpload(e.target.files); e.target.value = "" }} />
              </label>

              {assets.length > 0 ? (
                <ul className="grid max-h-[220px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-3">
                  {assets.map(asset => (
                    <li key={asset.id} className="space-y-1">
                      <div className="aspect-square overflow-hidden rounded border border-px-line bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                      </div>
                      <p className="truncate text-[12px] text-px-muted">{asset.name}</p>
                      <button type="button" onClick={() => removerAsset(asset)} aria-label={`Remover ${asset.name}`}
                        className="text-[12px] font-medium text-px-ink underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-center text-[13px] text-px-muted">Nenhuma imagem adicionada.</p>
              )}
            </Panel>

            <div className="flex items-center justify-between md:col-span-2">
              <PxButton variant="quiet" onClick={() => setStep(1)}>Editar roteiro</PxButton>
              <PxButton onClick={() => setStep(3)}>Ir para a timeline</PxButton>
            </div>
          </div>
        )}

        {/* ETAPA 3: TIMELINE E PREVIEW */}
        {step === 3 && (
          <div className="grid items-start gap-4 md:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-4">
              <Panel as="section" className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-[15px] font-semibold text-px-ink">Timeline</h2>
                  <span className="text-[13px] text-px-muted">{timeline.length} segmentos · {fmtTime(totalDuration)}</span>
                </div>
                <p className="text-[13px] text-px-muted">Arraste um bloco para mover. Com o bloco selecionado, as setas do teclado movem 0,5 s. Os tempos também podem ser digitados abaixo.</p>

                <div className="overflow-x-auto pb-1">
                  <div style={{ width: TOTAL_SECS * PX_PER_SEC + LABEL_W + 8, minWidth: "100%" }}>
                    <div className="relative mb-1.5 h-5" style={{ paddingLeft: LABEL_W }} aria-hidden="true">
                      {Array.from({ length: TOTAL_SECS + 1 }, (_, i) => i % 5 === 0 && (
                        <div key={i} className="absolute text-[11px] text-px-muted select-none" style={{ left: LABEL_W + i * PX_PER_SEC - 4 }}>{i}s</div>
                      ))}
                    </div>

                    {TIPOS.map(tipo => (
                      <div key={tipo} className="mb-1 flex items-center" style={{ height: 38 }}>
                        <div className="flex-shrink-0 pr-2 text-[12px] font-medium text-px-ink" style={{ width: LABEL_W }}>{TIPO_LABEL[tipo]}</div>
                        <div className="relative rounded border border-px-line bg-white/50" style={{ height: 38, width: TOTAL_SECS * PX_PER_SEC }}>
                          {timeline.filter(s => s.tipo === tipo).map(seg => (
                            <div
                              key={seg.id}
                              role="button"
                              tabIndex={0}
                              aria-label={`${TIPO_LABEL[tipo]}, ${seg.instrucao}, de ${seg.segundo_inicio} a ${seg.segundo_fim} segundos`}
                              aria-pressed={selectedId === seg.id}
                              className={cn(
                                "absolute top-1 bottom-1 cursor-grab select-none rounded border active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/60",
                                BLOCO[tipo],
                                selectedId === seg.id && "outline outline-2 outline-offset-2 outline-px-ink"
                              )}
                              style={{ left: seg.segundo_inicio * PX_PER_SEC, width: Math.max(6, (seg.segundo_fim - seg.segundo_inicio) * PX_PER_SEC - 2) }}
                              title={seg.instrucao}
                              onClick={() => setSelectedId(seg.id)}
                              onMouseDown={e => startDrag(e, seg)}
                              onTouchStart={e => startDrag(e, seg)}
                              onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(seg.id) }
                                if (e.key === "ArrowLeft") { e.preventDefault(); setSelectedId(seg.id); moverSegmento(seg.id, seg.segundo_inicio - 0.5) }
                                if (e.key === "ArrowRight") { e.preventDefault(); setSelectedId(seg.id); moverSegmento(seg.id, seg.segundo_inicio + 0.5) }
                              }}
                            >
                              <span className="block truncate px-1.5 text-[11px] font-medium leading-[28px]">{seg.instrucao}</span>
                            </div>
                          ))}
                          <div className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-px-ink" style={{ left: currentTime * PX_PER_SEC }} aria-hidden="true" />
                        </div>
                      </div>
                    ))}

                    <div style={{ paddingLeft: LABEL_W }} className="mt-2">
                      <input
                        type="range" min={0} max={Math.max(totalDuration, 0.1)} step={0.1} value={currentTime}
                        onChange={handleScrub} aria-label="Posição no vídeo"
                        className="accent-px-ink" style={{ width: TOTAL_SECS * PX_PER_SEC }}
                      />
                    </div>
                  </div>
                </div>
              </Panel>

              {selectedSeg ? (
                <Panel as="section" className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-semibold text-px-ink">Editar segmento</h3>
                      <p className="mt-0.5 text-[13.5px] text-px-muted">{selectedSeg.instrucao}</p>
                    </div>
                    <PxButton variant="quiet" size="sm" onClick={() => setSelectedId(null)}>Fechar</PxButton>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                    <Field label="Início (s)" htmlFor="seg-ini">
                      <PxInput id="seg-ini" type="number" min={0} max={TOTAL_SECS} step={0.5} value={selectedSeg.segundo_inicio}
                        onChange={e => definirTempos(selectedSeg.id, "segundo_inicio", parseFloat(e.target.value))} />
                    </Field>
                    <Field label="Fim (s)" htmlFor="seg-fim">
                      <PxInput id="seg-fim" type="number" min={0} max={TOTAL_SECS} step={0.5} value={selectedSeg.segundo_fim}
                        onChange={e => definirTempos(selectedSeg.id, "segundo_fim", parseFloat(e.target.value))} />
                    </Field>
                  </div>

                  {selectedSeg.tipo === "asset" && (
                    <div className="space-y-1.5">
                      <p className="text-[13px] font-medium text-px-ink">Imagem deste trecho</p>
                      {assets.length === 0 ? (
                        <p className="text-[13px] text-px-muted">Nenhuma imagem enviada. Volte à etapa 2 para adicionar.</p>
                      ) : (
                        <Segmented
                          label="Imagem do segmento"
                          value={selectedSeg.assetId ?? ""}
                          onChange={v => updateSegment(selectedSeg.id, { assetId: v || undefined })}
                          options={[{ value: "", label: "Nenhuma" }, ...assets.map(a => ({ value: a.id, label: a.name.length > 18 ? a.name.slice(0, 17) + "…" : a.name }))]}
                        />
                      )}
                    </div>
                  )}

                  {selectedSeg.tipo === "texto" && (
                    <div className="space-y-1.5">
                      <label htmlFor="seg-texto" className="text-[13px] font-medium text-px-ink">Texto em tela</label>
                      <textarea id="seg-texto" rows={2} className={TEXTAREA}
                        value={selectedSeg.texto ?? selectedSeg.texto_sugerido ?? ""}
                        onChange={e => updateSegment(selectedSeg.id, { texto: e.target.value })} />
                    </div>
                  )}

                  {(selectedSeg.tipo === "asset" || selectedSeg.tipo === "texto") && (
                    <div className="space-y-1.5">
                      <p className="text-[13px] font-medium text-px-ink">Posição</p>
                      <Segmented<Posicao>
                        label="Posição na tela"
                        value={selectedSeg.posicao ?? "centro"}
                        onChange={v => updateSegment(selectedSeg.id, { posicao: v })}
                        options={[{ value: "topo", label: "Topo" }, { value: "centro", label: "Centro" }, { value: "rodape", label: "Rodapé" }]}
                      />
                    </div>
                  )}

                  {selectedSeg.tipo === "asset" && (
                    <div className="space-y-1.5">
                      <label htmlFor="seg-op" className="text-[13px] font-medium text-px-ink">Opacidade: {selectedSeg.opacidade ?? 85}%</label>
                      <input id="seg-op" type="range" min={0} max={100} step={5} className="block w-full max-w-sm accent-px-ink"
                        value={selectedSeg.opacidade ?? 85}
                        onChange={e => updateSegment(selectedSeg.id, { opacidade: parseInt(e.target.value, 10) })} />
                    </div>
                  )}
                </Panel>
              ) : (
                <p className="text-[13.5px] text-px-muted">Selecione um bloco da timeline para editar tempo, texto, imagem e posição.</p>
              )}
            </div>

            <div className="space-y-3">
              <Panel as="aside" className="space-y-3">
                <h2 className="text-[15px] font-semibold text-px-ink">Preview 9:16</h2>
                <div className="flex justify-center">
                  <div className="relative overflow-hidden rounded-px-card border border-px-line" style={{ width: 252, height: 448 }}>
                    <canvas ref={canvasRef} width={252} height={448} className="block h-full w-full" aria-label="Pré-visualização do Reel" />
                    {!videoUrl && (
                      <div className="px-dark absolute inset-0 flex items-center justify-center p-4 text-center">
                        <p className="text-[13px] leading-relaxed text-white">Envie o vídeo na etapa 2 para ver o preview com os textos e imagens.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <PxButton variant="secondary" size="sm" onClick={togglePlay} disabled={!videoUrl} aria-label={isPlaying ? "Pausar" : "Reproduzir"}>
                    {isPlaying ? "Pausar" : "Reproduzir"}
                  </PxButton>
                  <input type="range" min={0} max={Math.max(totalDuration, 0.1)} step={0.1} value={currentTime}
                    onChange={handleScrub} aria-label="Posição no preview" className="min-w-0 flex-1 accent-px-ink" />
                  <span className="w-10 flex-shrink-0 text-right text-[13px] text-px-muted">{fmtTime(currentTime)}</span>
                </div>

                <p className="min-h-[18px] truncate text-[13px] text-px-muted">
                  {timeline.filter(s => currentTime >= s.segundo_inicio && currentTime < s.segundo_fim).map(s => s.instrucao).join(" · ") || "Nenhum segmento neste instante"}
                </p>
              </Panel>

              {ExportButton}
              {!videoFile && <p className="text-center text-[13px] text-px-muted">Envie o vídeo na etapa 2 para liberar a exportação.</p>}
              <p className="text-center text-[13px] text-px-muted">MP4 H.264, 1080 por 1920, até 60 s. O processamento acontece no seu navegador e pode levar alguns minutos.</p>
            </div>
          </div>
        )}
      </div>

      {/* Vídeo oculto que alimenta o canvas */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          className="hidden"
          onTimeUpdate={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime) }}
          onEnded={() => { setIsPlaying(false); if (videoRef.current) videoRef.current.currentTime = 0 }}
        />
      )}

      {/* Gerar roteiro */}
      <PxModal open={gerarOpen} onClose={() => setGerarOpen(false)} title="Gerar roteiro com IA">
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (!gerandoRoteiro) gerarRoteiro() }}>
          <Field label="Tema do vídeo" htmlFor="ed-tema" hint="O roteiro sai com timecodes, pronto para a análise. Confira dados e afirmações clínicas antes de gravar.">
            <PxInput id="ed-tema" value={temaRoteiro} onChange={e => setTemaRoteiro(e.target.value)} placeholder="Ex: Resistência à insulina" autoFocus />
          </Field>
          {gerarError && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{gerarError}</p>}
          <PxButton type="submit" fullWidth loading={gerandoRoteiro} disabled={!temaRoteiro.trim()}>
            {gerandoRoteiro ? "Gerando, pode levar até um minuto" : "Gerar roteiro"}
          </PxButton>
        </form>
      </PxModal>

      {/* Importar pauta */}
      <PxModal open={pautaOpen} onClose={() => setPautaOpen(false)} title="Importar do Banco de Pautas" className="max-w-lg">
        <div className="space-y-3">
          <Field label="Buscar pauta" htmlFor="ed-busca">
            <PxInput id="ed-busca" value={pautaSearch} onChange={e => setPautaSearch(e.target.value)} placeholder="Título da pauta" />
          </Field>
          <div className="max-h-[50vh] overflow-y-auto">
            {loadingPautas ? (
              <p role="status" className="py-8 text-center text-[13.5px] text-px-muted">Carregando pautas.</p>
            ) : pautasError ? (
              <div className="space-y-2 py-4">
                <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{pautasError}</p>
                <PxButton size="sm" variant="secondary" onClick={abrirPautas}>Tentar de novo</PxButton>
              </div>
            ) : pautasFiltradas.length === 0 ? (
              <p className="py-8 text-center text-[13.5px] text-px-muted">{pautas.length === 0 ? "O Banco de Pautas está vazio." : "Nenhuma pauta com esse título."}</p>
            ) : (
              <ul className="space-y-1">
                {pautasFiltradas.map(p => (
                  <li key={p.id}>
                    <button type="button" onClick={() => selecionarPauta(p)}
                      className="w-full rounded-px-card border border-transparent px-3 py-2.5 text-left hover:border-px-line hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
                      <span className="block text-[13.5px] font-medium leading-snug text-px-ink">{p.titulo}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <Tag tone="neutral">{p.categoria}</Tag>
                        {p.nota && <span className="max-w-[240px] truncate text-[12px] text-px-muted">{p.nota}</span>}
                      </span>
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
