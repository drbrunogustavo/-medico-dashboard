"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { RefreshCw, Download, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Brand ───────────────────────────────────────────────
const GOLD       = "#b8976a"
const GOLD_VIV   = "#C9A84C"
const GOLD_DIM   = "#C9A84C22"
const BGS        = ["#534F49","#3E4345","#515664","#1a1410","#2c2018"]
const SCI_BG     = "#0D1B2A"

// ─── Formats ─────────────────────────────────────────────
const FORMATS = [
  { id:"retrato",  label:"Retrato Feed",  dims:"1080×1350", fw:1080, fh:1350 },
  { id:"quadrado", label:"Quadrado",      dims:"1080×1080", fw:1080, fh:1080 },
  { id:"reels",    label:"Capa de Reels", dims:"1080×1920", fw:1080, fh:1920 },
  { id:"stories",  label:"Stories",       dims:"1080×1920", fw:1080, fh:1920 },
]

const PREVIEW_W = 270

// ─── Types ───────────────────────────────────────────────
interface Slide {
  numero: number
  tipo: "capa"|"conteudo"|"cta"|"unica"
  tag: string|null
  headline: string
  subtitulo: string|null
  texto: string|null
  cientifico: boolean
  dados: string|null
  fonte: string|null
}
interface Pauta { id: string; titulo: string; categoria: string }
interface Fmt { id:string; label:string; dims:string; fw:number; fh:number }

// ─── Slide Renderer ──────────────────────────────────────
function SlideCard({ slide, fmt, index, onDownload }: {
  slide: Slide; fmt: Fmt; index: number; onDownload:(i:number)=>void
}) {
  const scale  = PREVIEW_W / fmt.fw
  const prevH  = fmt.fh * scale
  const bg     = slide.cientifico ? SCI_BG : BGS[index % BGS.length]

  const S = {
    pad:      90,
    headline: 80,
    sub:      52,
    body:     40,
    label:    22,
    tiny:     18,
  }

  const slideStyle: React.CSSProperties = {
    width: fmt.fw, height: fmt.fh,
    background: bg,
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Montserrat','Inter',sans-serif",
    padding: S.pad,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: slide.tipo === "capa" ? "flex-end" : "center",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    flexShrink: 0,
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* wrapper keeps layout space */}
      <div style={{ width: PREVIEW_W, height: prevH, overflow:"hidden", borderRadius:6, border:"1px solid #ffffff10", flexShrink:0 }}>
        <div id={`slide-${index}`} style={slideStyle}>

          {/* Top gold line */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:4,
            background:`linear-gradient(90deg,${GOLD},${GOLD_VIV},${GOLD})` }} />

          {/* Slide number */}
          <div style={{ position:"absolute", top:32, right:S.pad,
            fontSize:S.tiny, color:GOLD, letterSpacing:4, fontWeight:700 }}>
            {String(slide.numero).padStart(2,"0")}
          </div>

          {/* CAPA */}
          {slide.tipo === "capa" && <>
            {slide.tag && (
              <div style={{ fontSize:S.label, letterSpacing:6, color:GOLD,
                textTransform:"uppercase", fontWeight:700, marginBottom:24 }}>
                {slide.tag}
              </div>
            )}
            <div style={{ fontSize:S.headline, fontWeight:800, color:"#FFFFFF",
              lineHeight:1.05, textTransform:"uppercase", marginBottom:20 }}>
              {slide.headline}
            </div>
            {slide.subtitulo && (
              <div style={{ fontSize:S.sub, color:"#D6CCC2", fontStyle:"italic", lineHeight:1.4 }}>
                {slide.subtitulo}
              </div>
            )}
            <div style={{ position:"absolute", bottom:S.pad, left:S.pad,
              fontSize:S.label, color:GOLD, letterSpacing:3, fontWeight:600 }}>
              @drbrunogustavo
            </div>
          </>}

          {/* CONTEÚDO */}
          {slide.tipo === "conteudo" && <>
            {/* Dados científicos */}
            {slide.cientifico && slide.dados && (
              <div style={{ background:GOLD_DIM, border:`1px solid ${GOLD}50`,
                borderRadius:10, padding:"24px 28px", marginBottom:32,
                fontSize:S.sub, color:GOLD_VIV, fontWeight:700, lineHeight:1.3 }}>
                {slide.dados}
                {slide.fonte && (
                  <div style={{ fontSize:S.label, color:"#D6CCC2", marginTop:10, letterSpacing:3 }}>
                    {slide.fonte}
                  </div>
                )}
              </div>
            )}
            <div style={{ fontSize:S.headline, fontWeight:800, color:"#FFFFFF",
              lineHeight:1.05, textTransform:"uppercase", marginBottom:24 }}>
              {slide.headline}
            </div>
            {slide.texto && (
              <div style={{ fontSize:S.body, color:"#D1D5DB", lineHeight:1.7 }}>
                {slide.texto}
              </div>
            )}
            {!slide.cientifico && slide.dados && (
              <div style={{ marginTop:28, padding:"20px 24px",
                background:GOLD_DIM, borderLeft:`4px solid ${GOLD}`,
                fontSize:S.body, color:GOLD_VIV, fontWeight:600, lineHeight:1.4 }}>
                {slide.dados}
              </div>
            )}
          </>}

          {/* CTA */}
          {slide.tipo === "cta" && (
            <div style={{ textAlign:"center", width:"100%" }}>
              <div style={{ fontSize:S.headline * 1.1, fontWeight:800, color:"#FFFFFF",
                textTransform:"uppercase", lineHeight:1, marginBottom:32 }}>
                SALVE<br/>ESTE POST
              </div>
              <div style={{ width:60, height:3, background:GOLD, margin:"0 auto 32px" }} />
              <div style={{ fontSize:S.sub, color:"#D6CCC2", lineHeight:1.7, marginBottom:40 }}>
                Compartilhe com quem<br/>precisa saber disso
              </div>
              <div style={{ fontSize:S.label, letterSpacing:5, color:GOLD,
                textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>
                SIGA PARA MAIS CONTEÚDO
              </div>
              <div style={{ fontSize:S.headline * 0.7, fontWeight:800, color:"#FFFFFF" }}>
                @drbrunogustavo
              </div>
              <div style={{ fontSize:S.label, color:"#D6CCC2", marginTop:12, letterSpacing:2 }}>
                Médico Clínico-Geral | Endocrinologia &amp; Nutrologia
              </div>
            </div>
          )}

          {/* IMAGEM ÚNICA */}
          {slide.tipo === "unica" && <>
            {slide.tag && (
              <div style={{ position:"absolute", top:S.pad, left:S.pad,
                fontSize:S.label, letterSpacing:6, color:GOLD,
                textTransform:"uppercase", fontWeight:700 }}>
                {slide.tag}
              </div>
            )}
            <div style={{ fontSize:S.headline, fontWeight:800, color:"#FFFFFF",
              lineHeight:1.05, textTransform:"uppercase", marginBottom:20 }}>
              {slide.headline}
            </div>
            {slide.subtitulo && (
              <div style={{ fontSize:S.sub, color:GOLD_VIV, fontStyle:"italic", marginBottom:24 }}>
                {slide.subtitulo}
              </div>
            )}
            {slide.texto && (
              <div style={{ fontSize:S.body, color:"#D1D5DB", lineHeight:1.7 }}>
                {slide.texto}
              </div>
            )}
            <div style={{ position:"absolute", bottom:S.pad, left:S.pad,
              fontSize:S.label, color:GOLD, letterSpacing:3 }}>
              @drbrunogustavo
            </div>
          </>}

          {/* Bottom gold line */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2,
            background:`linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
        </div>
      </div>

      <button onClick={() => onDownload(index)}
        className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all">
        <Download className="w-3 h-3" />
        Slide {slide.numero}
      </button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────
export default function ImagensPage() {
  const [pautas,        setPautas]        = useState<Pauta[]>([])
  const [selectedPauta, setSelectedPauta] = useState("")
  const [temaLivre,     setTemaLivre]     = useState("")
  const [tipo,          setTipo]          = useState<"unica"|"carrossel">("carrossel")
  const [fmt,           setFmt]           = useState(FORMATS[0])
  const [numSlides,     setNumSlides]     = useState(9)
  const [slides,        setSlides]        = useState<Slide[]>([])
  const [loading,       setLoading]       = useState(false)
  const [toast,         setToast]         = useState<string|null>(null)

  useEffect(() => {
    // html2canvas via CDN
    const s = document.createElement("script")
    s.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js"
    document.head.appendChild(s)
    // Google Fonts
    const l = document.createElement("link")
    l.href = "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,800;1,400&display=swap"
    l.rel  = "stylesheet"
    document.head.appendChild(l)
    // Pautas
    fetch("/api/pautas").then(r => r.json()).then(d => setPautas(d || []))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const getTema = () => {
    if (selectedPauta) return pautas.find(p => p.id === selectedPauta)?.titulo || temaLivre
    return temaLivre
  }

  const gerar = async () => {
    const tema = getTema().trim()
    if (!tema) { showToast("Selecione uma pauta ou digite um tema"); return }
    setLoading(true); setSlides([])
    try {
      const res = await fetch("/api/imagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, tipo, numSlides: tipo === "unica" ? 1 : numSlides }),
      })
      const data = await res.json()
      if (data.slides) setSlides(data.slides)
      else showToast("Erro ao gerar slides")
    } catch { showToast("Erro ao gerar slides") }
    setLoading(false)
  }

  const downloadSlide = async (index: number) => {
    const el = document.getElementById(`slide-${index}`) as HTMLElement|null
    if (!el) return
    const h2c = (window as any).html2canvas
    if (!h2c) { showToast("Aguarde o carregamento da biblioteca"); return }
    showToast("Gerando PNG…")

    // Remove transform temporarily for full-res capture
    const prev = el.style.transform
    el.style.transform = "none"
    try {
      const canvas = await h2c(el, { scale:1, useCORS:true, backgroundColor:null })
      const a = document.createElement("a")
      a.download = `slide_${String(index+1).padStart(2,"0")}_drbrunogustavo.png`
      a.href = canvas.toDataURL("image/png")
      a.click()
      showToast("Download iniciado!")
    } finally {
      el.style.transform = prev
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Gerador de Imagens"
        subtitle="INSTAGRAM · STORIES · REELS · IA ESPECIALIZADA"
        actions={
          <span className="text-[11px] font-mono text-text-muted">
            {slides.length > 0 && `${slides.length} slides gerados`}
          </span>
        }
      />

      <div className="p-8 space-y-6">
        {/* ── Config ── */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-5">

          {/* Pauta / Tema */}
          <div className="space-y-2">
            <label className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Pauta ou Tema</label>
            <select value={selectedPauta}
              onChange={e => { setSelectedPauta(e.target.value); if(e.target.value) setTemaLivre("") }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent/40">
              <option value="">— Digitar tema livre —</option>
              {pautas.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
            {!selectedPauta && (
              <input value={temaLivre} onChange={e => setTemaLivre(e.target.value)}
                placeholder="Ex: Semaglutida e perda de peso — o que a ciência diz"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <label className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Tipo</label>
            <div className="flex gap-3">
              {[
                { id:"unica",     label:"🖼️ Imagem Única" },
                { id:"carrossel", label:"📑 Carrossel"     },
              ].map(t => (
                <button key={t.id} onClick={() => setTipo(t.id as any)}
                  className={cn("flex-1 py-2.5 rounded-lg border text-[12px] font-medium transition-all",
                    tipo === t.id
                      ? "bg-accent-dim border-accent-border text-accent"
                      : "border-border text-text-muted hover:border-border-hover")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <label className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Formato</label>
            <div className="grid grid-cols-4 gap-2">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFmt(f)}
                  className={cn("py-2 px-3 rounded-lg border text-[11px] transition-all",
                    fmt.id === f.id
                      ? "bg-accent-dim border-accent-border text-accent"
                      : "border-border text-text-muted hover:border-border-hover")}>
                  <div className="font-medium">{f.label}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">{f.dims}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Num slides */}
          {tipo === "carrossel" && (
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-text-muted tracking-widest uppercase">
                Número de Slides — <span className="text-accent">{numSlides}</span>
              </label>
              <input type="range" min={2} max={15} value={numSlides}
                onChange={e => setNumSlides(Number(e.target.value))}
                className="w-full accent-accent" />
              <div className="flex justify-between text-[9px] text-text-muted font-mono">
                <span>2</span><span>15</span>
              </div>
            </div>
          )}

          {/* Gerar */}
          <button onClick={gerar} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-accent-dim border border-accent-border text-accent text-[13px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-50">
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando…</>
              : <><Layers className="w-4 h-4" /> Gerar Imagens</>}
          </button>
        </div>

        {/* ── Preview ── */}
        {slides.length > 0 && (
          <div className="space-y-4">
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">
              Preview · {slides.length} slide{slides.length > 1 ? "s" : ""} · {fmt.dims}px · Clique para baixar PNG
            </div>
            <div className="flex flex-wrap gap-6">
              {slides.map((slide, i) => (
                <SlideCard key={i} slide={slide} fmt={fmt} index={i} onDownload={downloadSlide} />
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
