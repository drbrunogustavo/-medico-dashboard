"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Clapperboard, Upload, Play, Pause, Download,
  BookOpen, X, Search, Loader2,
  AlertCircle, ChevronRight, Layers, Type,
  Video, ImageIcon, Sliders, RefreshCw, Sparkles,
  Check,
} from "lucide-react"
import { AI_MODEL } from "@/lib/ai-config"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Segment {
  id:             string
  segundo_inicio: number
  segundo_fim:    number
  instrucao:      string
  tipo:           "video" | "asset" | "texto"
  texto_sugerido?: string
  assetId?:        string
  posicao?:        "topo" | "centro" | "rodape"
  opacidade?:      number
  texto?:          string
}

interface Asset {
  id:        string
  name:      string
  url:       string
  thumbnail: string
}

interface Pauta {
  id:        number | string
  titulo:    string
  categoria: string
  nota?:     string
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const PX_PER_SEC = 12
const TOTAL_SECS = 60

const TRACK_COLORS = {
  video: { bg: "bg-blue-600/70",   border: "border-blue-500/60",   text: "text-blue-100"  },
  asset: { bg: "bg-[#00c07f]/70",  border: "border-[#00c07f]/60",  text: "text-white"     },
  texto: { bg: "bg-amber-500/70",  border: "border-amber-400/60",  text: "text-amber-100" },
}

const MOCK_TIMELINE: Segment[] = [
  { id:"s1", segundo_inicio:0,  segundo_fim:4,  tipo:"texto", instrucao:"Headline de abertura",        texto_sugerido:"1 em cada 3 adultos tem resistência à insulina", texto:"1 em cada 3 adultos tem resistência à insulina" },
  { id:"s2", segundo_inicio:4,  segundo_fim:10, tipo:"video", instrucao:"Fale direto para a câmera",    posicao:"centro" },
  { id:"s3", segundo_inicio:10, segundo_fim:16, tipo:"asset", instrucao:"Gráfico explicativo",          posicao:"centro", opacidade:85 },
  { id:"s4", segundo_inicio:16, segundo_fim:24, tipo:"video", instrucao:"Explique os sintomas",         posicao:"centro" },
  { id:"s5", segundo_inicio:24, segundo_fim:30, tipo:"asset", instrucao:"Infográfico de sintomas",      posicao:"centro", opacidade:85 },
  { id:"s6", segundo_inicio:30, segundo_fim:38, tipo:"video", instrucao:"As 3 soluções práticas",       posicao:"centro" },
  { id:"s7", segundo_inicio:38, segundo_fim:44, tipo:"texto", instrucao:"Lista das soluções",           texto_sugerido:"① Jejum 14h  ② Proteína no café  ③ Caminhe 20min", texto:"① Jejum 14h  ② Proteína no café  ③ Caminhe 20min" },
  { id:"s8", segundo_inicio:44, segundo_fim:52, tipo:"video", instrucao:"CTA: salve e compartilhe",     posicao:"centro" },
  { id:"s9", segundo_inicio:52, segundo_fim:57, tipo:"texto", instrucao:"Handle + CTA",                 texto_sugerido:"@praxisplataforma — Salve esse post!", texto:"@praxisplataforma — Salve esse post!" },
]

// ─── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all flex-shrink-0",
      done   ? "bg-accent border-accent text-background" :
      active ? "bg-accent-dim border-accent text-accent" :
               "bg-transparent border-border text-text-muted"
    )}>
      {done ? <Check className="w-3.5 h-3.5" /> : n}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const [step,           setStep]           = useState<1 | 2 | 3>(1)
  const [roteiro,        setRoteiro]        = useState("")
  const [timeline,       setTimeline]       = useState<Segment[]>([])
  const [assets,         setAssets]         = useState<Asset[]>([])
  const [videoFile,      setVideoFile]      = useState<File | null>(null)
  const [videoUrl,       setVideoUrl]       = useState<string | null>(null)
  const [videoDuration,  setVideoDuration]  = useState(0)
  const [selectedSeg,    setSelectedSeg]    = useState<Segment | null>(null)
  const [currentTime,    setCurrentTime]    = useState(0)
  const [isPlaying,      setIsPlaying]      = useState(false)
  const [isAnalyzing,    setIsAnalyzing]    = useState(false)
  const [isExporting,    setIsExporting]    = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [error,          setError]          = useState<string | null>(null)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [pautas,         setPautas]         = useState<Pauta[]>([])
  const [loadingPautas,  setLoadingPautas]  = useState(false)
  const [pautaSearch,    setPautaSearch]    = useState("")
  const [showGerarModal, setShowGerarModal] = useState(false)
  const [temaRoteiro,    setTemaRoteiro]    = useState("")
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false)

  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const rafRef      = useRef<number>(0)
  const videoInput  = useRef<HTMLInputElement>(null)
  const assetInput  = useRef<HTMLInputElement>(null)
  const assetImgMap = useRef<Map<string, HTMLImageElement>>(new Map())

  // Keep refs in sync to avoid stale closures in RAF
  const timelineRef    = useRef<Segment[]>([])
  timelineRef.current  = timeline
  const currentTimeRef = useRef(0)
  currentTimeRef.current = currentTime

  // ── Canvas renderer ──────────────────────────────────────────────────────────

  const renderFrame = useCallback(() => {
    const canvas   = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const video    = videoRef.current
    const segments = timelineRef.current
    const t        = video ? video.currentTime : currentTimeRef.current
    const W        = canvas.width
    const H        = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = "#08090e"
    ctx.fillRect(0, 0, W, H)

    if (video && video.readyState >= 2) {
      try { ctx.drawImage(video, 0, 0, W, H) } catch { /* ignore cross-origin */ }
    }

    const active = segments.filter(s => t >= s.segundo_inicio && t < s.segundo_fim)

    for (const seg of active) {
      if (seg.tipo === "asset" && seg.assetId) {
        const img = assetImgMap.current.get(seg.assetId)
        if (img && img.complete) {
          ctx.save()
          ctx.globalAlpha = (seg.opacidade ?? 85) / 100
          const aspect = img.width / img.height
          const drawW  = W * 0.88
          const drawH  = drawW / aspect
          const x      = (W - drawW) / 2
          const y      = seg.posicao === "topo"   ? 24 :
                         seg.posicao === "rodape" ? H - drawH - 24 :
                                                    (H - drawH) / 2
          ctx.drawImage(img, x, y, drawW, drawH)
          ctx.restore()
        }
      }

      if (seg.tipo === "texto") {
        const txt = seg.texto || seg.texto_sugerido || ""
        if (!txt) continue
        ctx.save()

        const fontSize = Math.round(W * 0.052)
        ctx.font        = `700 ${fontSize}px Inter, sans-serif`
        ctx.textAlign   = "center"
        ctx.textBaseline = "middle"

        // Word-wrap
        const words: string[] = txt.split(" ")
        const maxLineW        = W - 32
        const lines: string[] = []
        let   line            = ""
        for (const word of words) {
          const test = line ? line + " " + word : word
          if (ctx.measureText(test).width > maxLineW && line) {
            lines.push(line); line = word
          } else {
            line = test
          }
        }
        if (line) lines.push(line)

        const lineH = fontSize * 1.35
        const boxH  = lines.length * lineH + 20
        const boxW  = Math.min(
          Math.max(...lines.map(l => ctx.measureText(l).width)) + 32,
          W - 16
        )
        const y     = seg.posicao === "topo"   ? 56 :
                      seg.posicao === "rodape" ? H - 56 : H * 0.78

        ctx.fillStyle = "rgba(0,0,0,0.72)"
        ctx.beginPath()
        ctx.roundRect(W / 2 - boxW / 2, y - boxH / 2, boxW, boxH, 6)
        ctx.fill()

        ctx.fillStyle = "#ffffff"
        lines.forEach((l, i) => {
          ctx.fillText(l, W / 2, y + (i - (lines.length - 1) / 2) * lineH)
        })
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

  useEffect(() => { renderFrame() }, [timeline, currentTime, renderFrame])

  useEffect(() => {
    assets.forEach(asset => {
      if (!assetImgMap.current.has(asset.id)) {
        const img = new Image()
        img.src = asset.url
        img.onload = () => { assetImgMap.current.set(asset.id, img); renderFrame() }
      }
    })
  }, [assets, renderFrame])

  // ── Video events ─────────────────────────────────────────────────────────────

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
  }
  const handleEnded = () => {
    setIsPlaying(false)
    if (videoRef.current) videoRef.current.currentTime = 0
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v || !videoUrl) return
    if (isPlaying) { v.pause(); setIsPlaying(false) }
    else           { v.play();  setIsPlaying(true)  }
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    setCurrentTime(t)
    if (videoRef.current) videoRef.current.currentTime = t
  }

  // ── Upload ───────────────────────────────────────────────────────────────────

  const handleVideoUpload = (file: File) => {
    if (!file.type.startsWith("video/")) return
    const url = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoUrl(url)
    const tmp = document.createElement("video")
    tmp.src = url
    tmp.onloadedmetadata = () => setVideoDuration(Math.min(tmp.duration, 60))
  }

  const handleAssetUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return
      const url = URL.createObjectURL(file)
      setAssets(prev => [...prev, {
        id: `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        url,
        thumbnail: url,
      }])
    })
  }

  // ── Roteiro analysis ─────────────────────────────────────────────────────────

  const analisarRoteiro = async () => {
    if (!roteiro.trim()) { setError("Cole um roteiro antes de analisar."); return }
    setError(null); setIsAnalyzing(true); setTimeline([])

    try {
      const res  = await fetch("/api/analisar-roteiro", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ roteiro }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const segs: Segment[] = (data.segments as Omit<Segment, "id">[]).map((s, i) => ({
        ...s,
        id:        `seg-${i}-${Date.now()}`,
        opacidade: 85,
        posicao:   s.posicao ?? "centro",
        texto:     s.texto_sugerido ?? "",
      }))
      setTimeline(segs)
      setStep(2)
    } catch (e) {
      setError("Erro ao analisar roteiro. Usando timeline de demonstração.")
      setTimeline(MOCK_TIMELINE.map(s => ({ ...s })))
      setStep(2)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const gerarRoteiro = async () => {
    if (!temaRoteiro.trim()) return
    setGerandoRoteiro(true)
    try {
      const prompt =
        'Crie um roteiro para Reel médico sobre: "' + temaRoteiro + '"\n\n' +
        'Formato: timecodes para vídeo de 45-60 segundos, tom médico direto e sem academicismo.\n' +
        'Use exatamente este formato:\n[0-3s] gancho de abertura\n[3-10s] desenvolvimento 1\n[10-25s] desenvolvimento 2\n[25-40s] desenvolvimento 3\n[40-55s] CTA final\n\n' +
        'Retorne SOMENTE o roteiro com timecodes, sem explicações adicionais.'
      const res = await fetch('/api/roteiros', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      if (text) { setRoteiro(text.trim()); setShowGerarModal(false); setTemaRoteiro('') }
    } catch(e) { console.error(e) }
    setGerandoRoteiro(false)
  }

  // ── Pauta modal ──────────────────────────────────────────────────────────────

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

  const selecionarPauta = (p: Pauta) => {
    const conteudo = [p.titulo, p.nota].filter(Boolean).join("\n\n")
    setRoteiro(conteudo)
    setModalOpen(false)
  }

  // ── Segment editing ──────────────────────────────────────────────────────────

  const updateSegment = (id: string, patch: Partial<Segment>) => {
    setTimeline(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
    setSelectedSeg(prev => prev?.id === id ? { ...prev, ...patch } as Segment : prev)
  }

  // ── Timeline drag ────────────────────────────────────────────────────────────

  const startDrag = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    seg: Segment
  ) => {
    e.stopPropagation()
    const clientX   = "touches" in e ? e.touches[0].clientX : e.clientX
    const origStart = seg.segundo_inicio
    const duration  = seg.segundo_fim - seg.segundo_inicio

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const cx   = "touches" in ev ? ev.touches[0].clientX : ev.clientX
      const dx   = (cx - clientX) / PX_PER_SEC
      const newS = Math.max(0, Math.min(TOTAL_SECS - duration, origStart + dx))
      const snap = Math.round(newS * 2) / 2
      setTimeline(prev => prev.map(s =>
        s.id === seg.id
          ? { ...s, segundo_inicio: snap, segundo_fim: Math.round((snap + duration) * 2) / 2 }
          : s
      ))
    }

    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
      window.removeEventListener("touchmove", onMove as EventListener)
      window.removeEventListener("touchend",  onUp)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
    window.addEventListener("touchmove", onMove as EventListener, { passive: true })
    window.addEventListener("touchend",  onUp)
  }, [])

  // ── Export via FFmpeg.wasm ───────────────────────────────────────────────────

  const handleExport = async () => {
    if (!videoFile) { setError("Faça upload do vídeo antes de exportar."); return }
    setIsExporting(true); setExportProgress(0); setError(null)

    try {
      const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ])

      const ffmpeg = new FFmpeg()
      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        setExportProgress(Math.round(progress * 100))
      })

      // Load single-threaded core from CDN (no SharedArrayBuffer required)
      const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`,   "text/javascript"),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      })

      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile))

      // Scale + pad to 1080×1920 (9:16)
      const filterParts: string[] = [
        "scale=1080:1920:force_original_aspect_ratio=decrease," +
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"
      ]

      // Text overlays via drawtext
      const textSegs = timeline.filter(s => s.tipo === "texto" && (s.texto || s.texto_sugerido))
      for (const seg of textSegs) {
        const txt = (seg.texto || seg.texto_sugerido || "")
          .replace(/\\/g, "\\\\")
          .replace(/:/g,  "\\:")
          .replace(/'/g,  "\\'")
        if (!txt) continue
        const y = seg.posicao === "topo"   ? "80" :
                  seg.posicao === "rodape" ? "h-100" : "h*0.78"
        filterParts.push(
          `drawtext=text='${txt}':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=${y}` +
          `:enable='between(t\\,${seg.segundo_inicio}\\,${seg.segundo_fim})'` +
          `:box=1:boxcolor=black@0.72:boxborderw=10`
        )
      }

      // Asset image overlays
      let inputIdx = 1
      const assetSegs = timeline.filter(s => s.tipo === "asset" && s.assetId)
      let   prevStream = "scaled"

      // Build the filter chain properly
      const complexParts: string[] = [
        `[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black[scaled]`
      ]

      for (const seg of assetSegs) {
        const asset = assets.find(a => a.id === seg.assetId)
        if (!asset) continue
        await ffmpeg.writeFile(`asset${inputIdx}.png`, await fetchFile(asset.url))
        const oy   = seg.posicao === "topo"   ? "24" :
                     seg.posicao === "rodape" ? "main_h-overlay_h-24" : "(main_h-overlay_h)/2"
        const next = `out${inputIdx}`
        complexParts.push(
          `[${inputIdx}:v]scale=960:-1,format=rgba,colorchannelmixer=aa=${(seg.opacidade ?? 85) / 100}[ov${inputIdx}]`,
          `[${prevStream}][ov${inputIdx}]overlay=(main_w-overlay_w)/2:${oy}:enable='between(t,${seg.segundo_inicio},${seg.segundo_fim})'[${next}]`
        )
        prevStream = next
        inputIdx++
      }

      const useComplex = assetSegs.length > 0

      if (useComplex) {
        // Add text filters on top of final stream
        const textFilters = textSegs.map(seg => {
          const txt = (seg.texto || seg.texto_sugerido || "")
            .replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'")
          if (!txt) return ""
          const y = seg.posicao === "topo" ? "80" : seg.posicao === "rodape" ? "h-100" : "h*0.78"
          return `drawtext=text='${txt}':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=${y}` +
                 `:enable='between(t\\,${seg.segundo_inicio}\\,${seg.segundo_fim})'` +
                 `:box=1:boxcolor=black@0.72:boxborderw=10`
        }).filter(Boolean)

        const finalOut = textFilters.length > 0 ? "final" : prevStream
        if (textFilters.length > 0) {
          complexParts.push(`[${prevStream}]${textFilters.join(",")}[${finalOut}]`)
        }

        const assetInputs: string[] = []
        for (let i = 1; i < inputIdx; i++) assetInputs.push("-i", `asset${i}.png`)

        await ffmpeg.exec([
          "-i", "input.mp4", ...assetInputs,
          "-filter_complex", complexParts.join(";"),
          "-map", `[${finalOut}]`, "-map", "0:a?",
          "-c:v", "libx264", "-preset", "fast", "-crf", "22",
          "-c:a", "aac", "-b:a", "128k",
          "-t", "60", "-movflags", "+faststart",
          "output.mp4",
        ])
      } else {
        await ffmpeg.exec([
          "-i", "input.mp4",
          "-vf", filterParts.join(","),
          "-c:v", "libx264", "-preset", "fast", "-crf", "22",
          "-c:a", "aac", "-b:a", "128k",
          "-t", "60", "-movflags", "+faststart",
          "output.mp4",
        ])
      }

      const outData = await ffmpeg.readFile("output.mp4") as Uint8Array<ArrayBuffer>
      const blob    = new Blob([outData], { type: "video/mp4" })
      const url     = URL.createObjectURL(blob)
      const a       = document.createElement("a")
      a.href = url; a.download = `reel-${Date.now()}.mp4`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(
        `Erro ao exportar: ${String(e)}\n` +
        "Verifique se @ffmpeg/ffmpeg está instalado: npm install @ffmpeg/ffmpeg @ffmpeg/util"
      )
    } finally {
      setIsExporting(false)
    }
  }

  const totalDuration = timeline.length > 0
    ? Math.max(...timeline.map(s => s.segundo_fim), videoDuration)
    : Math.max(videoDuration, 30)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      {/* Modal — Gerar Roteiro com IA */}
      {showGerarModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowGerarModal(false)}>
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase mb-0.5">IA · Roteiro</div>
                <h3 className="text-[15px] font-semibold text-text-primary flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Gerar Roteiro</h3>
              </div>
              <button onClick={() => setShowGerarModal(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={temaRoteiro}
                onChange={e => setTemaRoteiro(e.target.value)}
                placeholder="Tema do vídeo... Ex: Resistência à insulina"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                onKeyDown={e => e.key === 'Enter' && !gerandoRoteiro && gerarRoteiro()}
                autoFocus
              />
              <button
                onClick={gerarRoteiro}
                disabled={gerandoRoteiro || !temaRoteiro.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {gerandoRoteiro
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando... (30–60s)</>
                  : <><Sparkles className="w-4 h-4" /> Gerar Roteiro</>}
              </button>
              <p className="text-[10px] text-text-muted text-center">O roteiro gerado já vem no formato com timecodes prontos para análise</p>
            </div>
          </div>
        </div>
      )}

      <TopBar
        title="Editor de Vídeo"
        subtitle="TIMELINE · SOBREPOSIÇÕES · EXPORT REEL 9:16"
        actions={
          step >= 2 && timeline.length > 0 ? (
            <button
              onClick={handleExport}
              disabled={isExporting || !videoFile}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-[#00c07f]/20 transition-colors disabled:opacity-40"
            >
              {isExporting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {exportProgress}%</>
                : <><Download className="w-3.5 h-3.5" /> Exportar Reel</>}
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {([
            { n: 1, label: "Roteiro"  },
            { n: 2, label: "Assets"   },
            { n: 3, label: "Timeline" },
          ] as { n: 1 | 2 | 3; label: string }[]).map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              <button
                disabled={n > step}
                onClick={() => n <= step && setStep(n)}
                className="flex items-center gap-2 disabled:cursor-default"
              >
                <StepDot n={n} active={step === n} done={step > n} />
                <span className={cn(
                  "text-[12px] font-medium hidden sm:block",
                  step === n ? "text-text-primary" : step > n ? "text-[#00c07f]" : "text-text-muted"
                )}>{label}</span>
              </button>
              {i < 2 && <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700 leading-relaxed whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* ════ STEP 1 — ROTEIRO ════ */}
        {step === 1 && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-text-primary">Roteiro do Vídeo</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowGerarModal(true)}
                    className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md border border-accent-border text-accent bg-accent-dim hover:bg-accent/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Gerar roteiro
                  </button>
                  <button
                    onClick={abrirModal}
                    className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md border border-border text-text-muted hover:border-accent-border hover:text-[#00c07f] transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Importar Pauta
                  </button>
                </div>
              </div>
              <textarea
                value={roteiro}
                onChange={e => setRoteiro(e.target.value)}
                placeholder={"Cole o roteiro aqui...\n\nEx:\n[0-3s] Você sabia que resistência à insulina afeta 1 em cada 3 pessoas?\n[3-8s] Hoje vou te explicar os 3 sinais principais...\n[8-15s] Primeiro sinal: cansaço logo após as refeições..."}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-base md:text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-[#00c07f]/40 transition-colors resize-none font-mono leading-relaxed"
                rows={12}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] font-mono text-text-muted">{roteiro.length} caracteres</span>
                <div className="flex gap-2">
                  {timeline.length > 0 && (
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary text-[12px] hover:text-text-primary transition-colors"
                    >
                      Usar timeline existente
                    </button>
                  )}
                  <button
                    onClick={analisarRoteiro}
                    disabled={isAnalyzing || !roteiro.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-[13px] font-bold hover:bg-[#00c07f]/90 transition-colors disabled:opacity-50"
                  >
                    {isAnalyzing
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
                      : <><Clapperboard className="w-4 h-4" /> Analisar Roteiro</>}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg py-10 text-center">
              <Clapperboard className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
              <p className="text-[12px] text-text-muted max-w-xs mx-auto leading-relaxed">
                O Claude irá decompor o roteiro em segmentos de timeline automaticamente — marcando onde falar, onde exibir assets e onde adicionar texto em tela.
              </p>
            </div>
          </div>
        )}

        {/* ════ STEP 2 — ASSETS ════ */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-6">

            {/* Video upload */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-4 h-4 text-blue-400" />
                <h3 className="text-[13px] font-semibold text-text-primary">Vídeo Principal</h3>
                <span className="text-[9px] font-mono text-text-muted ml-auto">MP4 · MOV · MÁX 60s</span>
              </div>

              {videoUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-background rounded-lg p-3">
                    <div className="w-10 h-16 bg-border rounded overflow-hidden flex-shrink-0">
                      <video src={videoUrl} className="w-full h-full object-cover" muted />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-text-primary truncate">{videoFile?.name}</p>
                      <p className="text-[10px] text-text-muted font-mono mt-0.5">
                        {fmtTime(videoDuration)} · {((videoFile?.size ?? 0) / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => { setVideoFile(null); setVideoUrl(null); setIsPlaying(false) }}
                      className="w-7 h-7 flex items-center justify-center rounded border border-border text-text-muted hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => videoInput.current?.click()}
                    className="text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Trocar vídeo
                  </button>
                </div>
              ) : (
                <label
                  className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-[rgba(0,192,127,0.3)] hover:bg-[rgba(0,192,127,0.04)] transition-all"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleVideoUpload(f) }}
                >
                  <Upload className="w-7 h-7 text-text-muted/40" />
                  <div className="text-center">
                    <p className="text-[12px] font-medium text-text-secondary">Arraste o vídeo ou toque para escolher</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Grave direto pelo celular (capture=environment)</p>
                  </div>
                </label>
              )}
              <input
                ref={videoInput}
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f) }}
              />
            </div>

            {/* Image assets */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-4 h-4 text-[#00c07f]" />
                <h3 className="text-[13px] font-semibold text-text-primary">Assets Visuais</h3>
                <span className="text-[9px] font-mono text-text-muted ml-auto">PNG · JPG · MÚLTIPLOS</span>
              </div>

              <label
                className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-[rgba(0,192,127,0.3)] hover:bg-[rgba(0,192,127,0.04)] transition-all mb-3"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) handleAssetUpload(e.dataTransfer.files) }}
              >
                <Upload className="w-5 h-5 text-text-muted/40" />
                <p className="text-[11px] font-medium text-text-secondary">Gráficos, infográficos, fotos de apoio</p>
                <input
                  ref={assetInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => { if (e.target.files) handleAssetUpload(e.target.files) }}
                />
              </label>

              {assets.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto">
                  {assets.map(asset => (
                    <div key={asset.id} className="relative group">
                      <div className="aspect-square bg-background rounded overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => {
                          setAssets(prev => prev.filter(a => a.id !== asset.id))
                          assetImgMap.current.delete(asset.id)
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded bg-black/70 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                      <p className="text-[8px] font-mono text-text-muted truncate mt-0.5">{asset.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-text-muted text-center py-2">Nenhum asset adicionado</p>
              )}
            </div>

            <div className="md:col-span-2 flex justify-between items-center">
              <button onClick={() => setStep(1)} className="text-[12px] text-text-muted hover:text-text-secondary transition-colors">
                ← Editar roteiro
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-[13px] font-bold hover:bg-[#00c07f]/90 transition-colors"
              >
                Ir para Timeline <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ════ STEP 3 — TIMELINE + PREVIEW ════ */}
        {step === 3 && (
          <div className="grid md:grid-cols-[1fr_272px] gap-6 items-start">

            {/* Timeline panel */}
            <div className="space-y-4">

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-text-muted" />
                  <h3 className="text-[13px] font-semibold text-text-primary">Timeline</h3>
                  <span className="text-[10px] font-mono text-text-muted ml-auto">
                    {timeline.length} segmentos · {fmtTime(totalDuration)}
                  </span>
                </div>

                <div className="overflow-x-auto pb-1">
                  <div style={{ width: TOTAL_SECS * PX_PER_SEC + 48, minWidth: "100%" }}>

                    {/* Time ruler */}
                    <div className="relative h-5 mb-1.5" style={{ paddingLeft: 40 }}>
                      {Array.from({ length: TOTAL_SECS + 1 }, (_, i) => i % 5 === 0 && (
                        <div
                          key={i}
                          className="absolute text-[8px] font-mono text-text-muted select-none"
                          style={{ left: 40 + i * PX_PER_SEC - 4 }}
                        >
                          {i}s
                        </div>
                      ))}
                    </div>

                    {/* Tracks */}
                    {(["video", "asset", "texto"] as const).map(tipo => {
                      const segs  = timeline.filter(s => s.tipo === tipo)
                      const c     = TRACK_COLORS[tipo]
                      const Icon  = tipo === "video" ? Video : tipo === "asset" ? ImageIcon : Type

                      return (
                        <div key={tipo} className="flex items-center mb-1" style={{ height: 34 }}>
                          <div className="flex items-center justify-center flex-shrink-0" style={{ width: 40 }}>
                            <Icon className="w-3 h-3 text-text-muted" />
                          </div>
                          <div
                            className="relative flex-1 bg-background/60 rounded border border-border/40"
                            style={{ height: 34 }}
                          >
                            {segs.map(seg => (
                              <div
                                key={seg.id}
                                className={cn(
                                  "absolute top-1 bottom-1 rounded cursor-grab active:cursor-grabbing border select-none transition-shadow",
                                  c.bg, c.border,
                                  selectedSeg?.id === seg.id && "ring-1 ring-[#00c07f] ring-offset-0"
                                )}
                                style={{
                                  left:  seg.segundo_inicio * PX_PER_SEC,
                                  width: Math.max(4, (seg.segundo_fim - seg.segundo_inicio) * PX_PER_SEC - 2),
                                }}
                                title={seg.instrucao}
                                onClick={() => setSelectedSeg(seg)}
                                onMouseDown={e => startDrag(e, seg)}
                                onTouchStart={e => startDrag(e, seg)}
                              >
                                <span className={cn("text-[8px] font-medium px-1.5 leading-[26px] truncate block", c.text)}>
                                  {seg.instrucao}
                                </span>
                              </div>
                            ))}

                            {/* Playhead */}
                            <div
                              className="absolute top-0 bottom-0 w-px bg-[#00c07f]/80 z-10 pointer-events-none"
                              style={{ left: currentTime * PX_PER_SEC }}
                            />
                          </div>
                        </div>
                      )
                    })}

                    {/* Scrubber */}
                    <div style={{ paddingLeft: 40 }} className="mt-2">
                      <input
                        type="range"
                        min={0}
                        max={Math.max(totalDuration, 0.1)}
                        step={0.1}
                        value={currentTime}
                        onChange={handleScrub}
                        className="w-full accent-[#00c07f]"
                        style={{ width: TOTAL_SECS * PX_PER_SEC }}
                      />
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                  {(["video", "asset", "texto"] as const).map(tipo => (
                    <div key={tipo} className="flex items-center gap-1.5">
                      <div className={cn("w-2.5 h-2.5 rounded-sm", TRACK_COLORS[tipo].bg)} />
                      <span className="text-[9px] font-mono text-text-muted">
                        {tipo === "video" ? "Vídeo" : tipo === "asset" ? "Asset" : "Texto"}
                      </span>
                    </div>
                  ))}
                  <span className="text-[9px] font-mono text-text-muted ml-auto">Arraste os segmentos para reposicionar</span>
                </div>
              </div>

              {/* Segment editor */}
              {selectedSeg && (
                <div className="bg-card border border-[rgba(0,192,127,0.25)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-[#00c07f]" />
                      <span className="text-[12px] font-semibold text-text-primary">Editar Segmento</span>
                      <span className="text-[9px] font-mono text-text-muted">
                        {selectedSeg.segundo_inicio}s → {selectedSeg.segundo_fim}s
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedSeg(null)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-border text-text-muted hover:text-text-primary transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1">Instrução de direção</label>
                      <p className="text-[12px] text-text-secondary italic">"{selectedSeg.instrucao}"</p>
                    </div>

                    {/* Asset selector */}
                    {selectedSeg.tipo === "asset" && (
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">Asset Associado</label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => updateSegment(selectedSeg.id, { assetId: undefined })}
                            className={cn(
                              "px-2.5 py-1 text-[10px] rounded border transition-all",
                              !selectedSeg.assetId
                                ? "bg-accent-dim border-accent-border text-[#00c07f]"
                                : "border-border text-text-muted hover:text-text-secondary"
                            )}
                          >
                            Nenhum
                          </button>
                          {assets.map(a => (
                            <button
                              key={a.id}
                              onClick={() => updateSegment(selectedSeg.id, { assetId: a.id })}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded border transition-all",
                                selectedSeg.assetId === a.id
                                  ? "bg-accent-dim border-accent-border text-[#00c07f]"
                                  : "border-border text-text-muted hover:text-text-secondary"
                              )}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={a.thumbnail} alt="" className="w-4 h-4 rounded-sm object-cover" />
                              {a.name.slice(0, 14)}
                            </button>
                          ))}
                          {assets.length === 0 && (
                            <p className="text-[10px] text-text-muted">
                              Adicione assets na etapa 2
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Text editor */}
                    {selectedSeg.tipo === "texto" && (
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">Texto em Tela</label>
                        <textarea
                          value={selectedSeg.texto ?? selectedSeg.texto_sugerido ?? ""}
                          onChange={e => updateSegment(selectedSeg.id, { texto: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-[#00c07f]/40 transition-colors resize-none"
                          rows={2}
                        />
                      </div>
                    )}

                    {/* Position */}
                    {(selectedSeg.tipo === "asset" || selectedSeg.tipo === "texto") && (
                      <div>
                        <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">Posição</label>
                        <div className="flex gap-1.5">
                          {(["topo", "centro", "rodape"] as const).map(pos => (
                            <button
                              key={pos}
                              onClick={() => updateSegment(selectedSeg.id, { posicao: pos })}
                              className={cn(
                                "px-2.5 py-1 text-[10px] capitalize rounded border transition-all",
                                selectedSeg.posicao === pos
                                  ? "bg-accent-dim border-accent-border text-[#00c07f]"
                                  : "border-border text-text-muted hover:text-text-secondary"
                              )}
                            >
                              {pos === "rodape" ? "Rodapé" : pos.charAt(0).toUpperCase() + pos.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opacity */}
                    {selectedSeg.tipo === "asset" && (
                      <div>
                        <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
                          Opacidade — {selectedSeg.opacidade ?? 85}%
                        </label>
                        <input
                          type="range" min={0} max={100} step={5}
                          value={selectedSeg.opacidade ?? 85}
                          onChange={e => updateSegment(selectedSeg.id, { opacidade: parseInt(e.target.value, 10) })}
                          className="w-full accent-[#00c07f]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Preview panel */}
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#00c07f] animate-pulse" />
                  <span className="text-[10px] font-mono text-text-muted tracking-widest uppercase">Preview 9:16</span>
                </div>

                {/* Canvas container */}
                <div className="flex justify-center">
                  <div
                    className="relative rounded-2xl overflow-hidden border-4 border-border shadow-2xl"
                    style={{ width: 252, height: 448 }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={252}
                      height={448}
                      className="w-full h-full block"
                    />
                    {!videoUrl && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-2/90 gap-2">
                        <Video className="w-8 h-8 text-text-muted/30" />
                        <p className="text-[10px] font-mono text-text-muted text-center px-4 leading-relaxed">
                          Faça upload do vídeo<br />na etapa anterior
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Playback controls */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={togglePlay}
                      disabled={!videoUrl}
                      className="w-9 h-9 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center hover:bg-[#00c07f]/20 transition-colors disabled:opacity-40 flex-shrink-0"
                    >
                      {isPlaying
                        ? <Pause className="w-3.5 h-3.5 text-[#00c07f]" />
                        : <Play  className="w-3.5 h-3.5 text-[#00c07f] ml-0.5" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(totalDuration, 0.1)}
                      step={0.1}
                      value={currentTime}
                      onChange={handleScrub}
                      className="flex-1 accent-[#00c07f]"
                    />
                    <span className="text-[10px] font-mono text-text-muted w-9 text-right flex-shrink-0">
                      {fmtTime(currentTime)}
                    </span>
                  </div>

                  {/* Active segment hint */}
                  <div className="text-[9px] font-mono text-text-muted min-h-[14px] truncate">
                    {timeline
                      .filter(s => currentTime >= s.segundo_inicio && currentTime < s.segundo_fim)
                      .map(s => s.instrucao)
                      .join(" · ") || "—"}
                  </div>
                </div>
              </div>

              {/* Export */}
              <button
                onClick={handleExport}
                disabled={isExporting || !videoFile}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-white text-[13px] font-bold hover:bg-[#00c07f]/90 transition-colors disabled:opacity-40"
              >
                {isExporting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Exportando {exportProgress}%</>
                  : <><Download className="w-4 h-4" /> Exportar Reel 9:16</>}
              </button>

              {!videoFile && (
                <p className="text-[9px] font-mono text-text-muted text-center">
                  Faça upload do vídeo na etapa 2 para exportar
                </p>
              )}

              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[9px] font-mono text-text-muted text-center leading-relaxed">
                  MP4 H.264 · 1080×1920 · 9:16<br />
                  Requer: <span className="text-text-secondary">npm install @ffmpeg/ffmpeg @ffmpeg/util</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden video for canvas rendering */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          className="hidden"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      {/* Pauta import modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,9,14,0.88)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-lg rounded-xl border flex flex-col"
            style={{ background: "var(--surface)", borderColor: "var(--border)", maxHeight: "80vh" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#00c07f]" />
                <span className="text-[13px] font-semibold text-text-primary">Importar do Banco de Pautas</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-text-muted hover:text-text-primary transition-all"
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
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted outline-none focus:border-[#00c07f]/40 transition-colors"
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
                <p className="text-center py-12 text-[12px] text-text-muted">Nenhuma pauta encontrada.</p>
              ) : (
                <div className="space-y-1">
                  {pautas
                    .filter(p =>
                      !pautaSearch ||
                      p.titulo.toLowerCase().includes(pautaSearch.toLowerCase())
                    )
                    .map(pauta => (
                      <button
                        key={pauta.id}
                        onClick={() => selecionarPauta(pauta)}
                        className="w-full text-left px-4 py-3 rounded-lg border border-transparent hover:border-[rgba(0,192,127,0.3)] hover:bg-[rgba(0,192,127,0.06)] transition-all group"
                      >
                        <p className="text-[12px] font-medium text-text-primary leading-snug group-hover:text-[#00c07f] transition-colors">
                          {pauta.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-badge font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted">
                            {pauta.categoria}
                          </span>
                          {pauta.nota && (
                            <span className="text-[9px] text-text-muted/60 truncate max-w-[200px]">
                              {pauta.nota}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
