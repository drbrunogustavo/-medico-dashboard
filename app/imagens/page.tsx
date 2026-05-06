"use client"

import { useState, useEffect, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { RefreshCw, Download, Layers, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Brand ───────────────────────────────────────────────
const C = {
  gold:    "#b8976a",
  goldViv: "#C9A84C",
  goldDim: "rgba(185,151,106,0.15)",
  white:   "#FFFFFF",
  gray:    "#D1D5DB",
  beige:   "#D6CCC2",
  sciBg:   "#0D1B2A",
  bgs:     ["#534F49","#3E4345","#515664","#1a1410","#2c2018"],
}

const SPECIALTY = "Médico Clínico-Geral | Pós-Graduado em Endocrinologia e Nutrologia"

const FORMATS = [
  { id:"retrato",  label:"Retrato Feed",  dims:"1080×1350", fw:1080, fh:1350 },
  { id:"quadrado", label:"Quadrado",      dims:"1080×1080", fw:1080, fh:1080 },
  { id:"reels",    label:"Capa de Reels", dims:"1080×1920", fw:1080, fh:1920 },
  { id:"stories",  label:"Stories",       dims:"1080×1920", fw:1080, fh:1920 },
]

const PREVIEW_W = 270

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
interface Fmt   { id:string; label:string; dims:string; fw:number; fh:number }
interface Assets { photo: string|null; logo: string|null }

// ─── Slide Content ────────────────────────────────────────
function SlideContent({ slide, fw, fh, assets }: {
  slide: Slide; fw: number; fh: number; assets: Assets
}) {
  const pad    = Math.round(fw * 0.083)
  const is169  = fh > fw * 1.1
  const topOff = is169 ? Math.round(fh * 0.04) : 0

  const FS = {
    headline: 84,
    sub:      56,
    body:     42,
    label:    24,
    tiny:     20,
  }
  const SP = {
    pad,
    gap:   Math.round(fw * 0.028),
    gapSm: Math.round(fw * 0.016),
  }

  const tx: React.CSSProperties = {
    fontFamily: "'Montserrat','Inter',sans-serif",
    WebkitFontSmoothing: "antialiased",
  }

  const showPhoto = !!assets.photo && (slide.tipo === "capa" || slide.tipo === "cta" || slide.tipo === "unica")

  // ── CAPA ────────────────────────────────────────────
  if (slide.tipo === "capa") return (
    <>
      {/* Photo background */}
      {showPhoto && (
        <img src={assets.photo!} alt="" style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover", opacity:0.28
        }} />
      )}
      {/* Gradient */}
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.1) 100%)" }} />

      {/* Top bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:5,
        background:`linear-gradient(90deg, ${C.gold}, ${C.goldViv}, ${C.gold})` }} />

      {/* Tag */}
      {slide.tag && (
        <div style={{ ...tx, position:"absolute", top: SP.pad + topOff, left: SP.pad,
          fontSize: FS.label, letterSpacing:7, color: C.gold,
          textTransform:"uppercase", fontWeight:700 }}>
          {slide.tag}
        </div>
      )}

      {/* Slide num */}
      <div style={{ ...tx, position:"absolute", top: SP.pad + topOff, right: SP.pad,
        fontSize: FS.tiny, color: C.gold, letterSpacing:4, fontWeight:700, opacity:0.7 }}>
        01
      </div>

      {/* Bottom content */}
      <div style={{ position:"absolute", bottom: SP.pad, left: SP.pad, right: SP.pad }}>
        <div style={{ width:64, height:3, background: C.gold, marginBottom: SP.gap, borderRadius:2 }} />

        <div style={{ ...tx, fontSize: FS.headline, fontWeight:800, color: C.white,
          lineHeight:1.0, textTransform:"uppercase",
          marginBottom: slide.subtitulo ? SP.gap : 0, wordBreak:"break-word" }}>
          {slide.headline}
        </div>

        {slide.subtitulo && (
          <div style={{ ...tx, fontSize: FS.sub, color: C.beige, fontStyle:"italic",
            lineHeight:1.4, marginBottom: SP.gap, wordBreak:"break-word" }}>
            {slide.subtitulo}
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", gap: SP.gapSm, marginTop: SP.gap }}>
          <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.35)" }} />
          <div style={{ ...tx, fontSize: FS.label, color: C.gold, letterSpacing:3, fontWeight:600 }}>
            @drbrunogustavo
          </div>
        </div>

        {/* Logo */}
        {assets.logo && (
          <img src={assets.logo} alt="logo" style={{
            position:"absolute", bottom: SP.pad + 60, right: SP.pad,
            height: Math.round(fw * 0.055), width:"auto",
            mixBlendMode:"multiply", opacity:0.9
          }} />
        )}
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
    </>
  )

  // ── CONTEÚDO ────────────────────────────────────────
  if (slide.tipo === "conteudo") {
    const isSci = slide.cientifico
    return (
      <>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:5,
          background:`linear-gradient(90deg, ${C.gold}, ${C.goldViv}, ${C.gold})` }} />

        {isSci && (
          <div style={{ position:"absolute", inset:0,
            background:"radial-gradient(ellipse at 80% 15%, rgba(185,151,106,0.08) 0%, transparent 65%)" }} />
        )}

        <div style={{ ...tx, position:"absolute", top: SP.pad + topOff, right: SP.pad,
          fontSize: FS.tiny, color: C.gold, letterSpacing:4, fontWeight:700, opacity:0.75 }}>
          {String(slide.numero).padStart(2,"0")}
        </div>

        <div style={{ position:"absolute", inset:0, padding: SP.pad, paddingTop: SP.pad + topOff,
          display:"flex", flexDirection:"column", justifyContent:"center", gap: SP.gap }}>

          {isSci && slide.dados && (
            <div style={{ background: C.goldDim,
              border:`1px solid rgba(185,151,106,0.35)`,
              borderRadius:14, padding:`${SP.gap}px ${Math.round(SP.gap*1.1)}px` }}>
              <div style={{ ...tx, fontSize: FS.sub, color: C.goldViv, fontWeight:800,
                lineHeight:1.3, marginBottom: SP.gapSm, wordBreak:"break-word" }}>
                {slide.dados}
              </div>
              {slide.fonte && (
                <div style={{ display:"flex", alignItems:"center", gap: SP.gapSm }}>
                  <div style={{ width:28, height:2, background: C.gold, borderRadius:1 }} />
                  <div style={{ ...tx, fontSize: FS.tiny, color: C.beige,
                    letterSpacing:3, textTransform:"uppercase", fontWeight:600 }}>
                    {slide.fonte}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <div style={{ ...tx, fontSize: FS.headline * 0.88, fontWeight:800, color: C.white,
              lineHeight:1.0, textTransform:"uppercase",
              marginBottom: SP.gapSm, wordBreak:"break-word" }}>
              {slide.headline}
            </div>
            <div style={{ width:52, height:3, background: C.gold, borderRadius:2 }} />
          </div>

          {slide.texto && (
            <div style={{ ...tx, fontSize: FS.body, color: C.gray, lineHeight:1.75, wordBreak:"break-word" }}>
              {slide.texto}
            </div>
          )}

          {!isSci && slide.dados && (
            <div style={{ borderLeft:`5px solid ${C.gold}`,
              background: C.goldDim, padding:`${SP.gapSm}px ${SP.gap}px`,
              borderRadius:"0 10px 10px 0" }}>
              <div style={{ ...tx, fontSize: FS.body, color: C.goldViv,
                fontWeight:700, lineHeight:1.4, wordBreak:"break-word" }}>
                {slide.dados}
              </div>
              {slide.fonte && (
                <div style={{ ...tx, fontSize: FS.tiny, color: C.beige,
                  marginTop: SP.gapSm, letterSpacing:2, textTransform:"uppercase" }}>
                  {slide.fonte}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logo bottom-right */}
        {assets.logo && (
          <img src={assets.logo} alt="logo" style={{
            position:"absolute", bottom: SP.pad, right: SP.pad,
            height: Math.round(fw * 0.048), width:"auto",
            mixBlendMode:"multiply", opacity:0.85
          }} />
        )}

        <div style={{ position:"absolute", bottom: SP.pad, left: SP.pad,
          display:"flex", alignItems:"center", gap: SP.gapSm }}>
          <div style={{ width:22, height:1, background: C.gold, opacity:0.6 }} />
          <div style={{ ...tx, fontSize: FS.tiny * 0.85, color: C.gold, letterSpacing:2, opacity:0.7 }}>
            @drbrunogustavo
          </div>
        </div>

        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
      </>
    )
  }

  // ── CTA ─────────────────────────────────────────────
  if (slide.tipo === "cta") return (
    <>
      {showPhoto && (
        <img src={assets.photo!} alt="" style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover", opacity:0.15
        }} />
      )}
      <div style={{ position:"absolute", inset:0,
        background:"radial-gradient(ellipse at center, rgba(185,151,106,0.14) 0%, rgba(0,0,0,0.4) 80%)" }} />

      <div style={{ position:"absolute", top:0, left:0, right:0, height:5,
        background:`linear-gradient(90deg, ${C.gold}, ${C.goldViv}, ${C.gold})` }} />

      <div style={{ position:"absolute", inset:0,
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding: SP.pad, textAlign:"center", gap: SP.gap }}>

        <div style={{ width:64, height:64, borderRadius:"50%",
          border:`2px solid ${C.gold}`, display:"flex", alignItems:"center",
          justifyContent:"center" }}>
          <div style={{ width:28, height:28, borderRadius:"50%",
            background: C.goldDim, border:`1px solid ${C.gold}` }} />
        </div>

        <div style={{ ...tx, fontSize: FS.headline * 1.05, fontWeight:800,
          color: C.white, textTransform:"uppercase", lineHeight:0.92, letterSpacing:-1 }}>
          SALVE<br/>ESTE POST
        </div>

        <div style={{ display:"flex", alignItems:"center", gap: SP.gap, width:"58%" }}>
          <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.4)" }} />
          <div style={{ width:7, height:7, borderRadius:"50%", background: C.gold }} />
          <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.4)" }} />
        </div>

        <div style={{ ...tx, fontSize: FS.sub, color: C.beige, lineHeight:1.7 }}>
          Compartilhe com quem<br/>precisa saber disso
        </div>

        <div style={{ ...tx, fontSize: FS.label, letterSpacing:5,
          color: C.gold, textTransform:"uppercase", fontWeight:700 }}>
          SIGA PARA MAIS CONTEÚDO
        </div>

        <div style={{ ...tx, fontSize: FS.headline * 0.62, fontWeight:800, color: C.white }}>
          @drbrunogustavo
        </div>

        <div style={{ ...tx, fontSize: FS.label, color: C.beige, letterSpacing:1, lineHeight:1.6 }}>
          {SPECIALTY}
        </div>

        {assets.logo && (
          <img src={assets.logo} alt="logo" style={{
            height: Math.round(fw * 0.055), width:"auto",
            mixBlendMode:"multiply", opacity:0.9, marginTop: SP.gapSm
          }} />
        )}
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
    </>
  )

  // ── IMAGEM ÚNICA ────────────────────────────────────
  return (
    <>
      {showPhoto && (
        <img src={assets.photo!} alt="" style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          objectFit:"cover", opacity:0.25
        }} />
      )}
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 100%)" }} />

      <div style={{ position:"absolute", top:0, left:0, right:0, height:5,
        background:`linear-gradient(90deg, ${C.gold}, ${C.goldViv}, ${C.gold})` }} />

      {slide.tag && (
        <div style={{ ...tx, position:"absolute", top: SP.pad + topOff, left: SP.pad,
          fontSize: FS.label, letterSpacing:7, color: C.gold,
          textTransform:"uppercase", fontWeight:700 }}>
          {slide.tag}
        </div>
      )}

      <div style={{ position:"absolute", inset:0, padding: SP.pad, paddingTop: SP.pad + topOff,
        display:"flex", flexDirection:"column", justifyContent:"center", gap: SP.gap }}>
        <div style={{ width:52, height:3, background: C.gold, borderRadius:2 }} />
        <div style={{ ...tx, fontSize: FS.headline, fontWeight:800, color: C.white,
          lineHeight:1.0, textTransform:"uppercase", wordBreak:"break-word" }}>
          {slide.headline}
        </div>
        {slide.subtitulo && (
          <div style={{ ...tx, fontSize: FS.sub, color: C.goldViv, fontStyle:"italic",
            lineHeight:1.4, wordBreak:"break-word" }}>
            {slide.subtitulo}
          </div>
        )}
        {slide.texto && (
          <div style={{ ...tx, fontSize: FS.body, color: C.gray,
            lineHeight:1.75, wordBreak:"break-word" }}>
            {slide.texto}
          </div>
        )}
      </div>

      <div style={{ position:"absolute", bottom: SP.pad, left: SP.pad, right: SP.pad,
        display:"flex", alignItems:"center", gap: SP.gapSm }}>
        <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.3)" }} />
        <div style={{ ...tx, fontSize: FS.label, color: C.gold, letterSpacing:3 }}>
          @drbrunogustavo
        </div>
      </div>

      {assets.logo && (
        <img src={assets.logo} alt="logo" style={{
          position:"absolute", bottom: SP.pad + 60, right: SP.pad,
          height: Math.round(fw * 0.055), width:"auto",
          mixBlendMode:"multiply", opacity:0.9
        }} />
      )}

      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
    </>
  )
}

// ─── Slide Card ───────────────────────────────────────────
function SlideCard({ slide, fmt, index, assets, onDownload }: {
  slide: Slide; fmt: Fmt; index: number; assets: Assets; onDownload:(i:number)=>void
}) {
  const scale = PREVIEW_W / fmt.fw
  const prevH = Math.round(fmt.fh * scale)
  const bg    = slide.cientifico ? C.sciBg : C.bgs[slide.numero % C.bgs.length]

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: PREVIEW_W, height: prevH, overflow:"hidden",
        borderRadius:6, border:"1px solid rgba(255,255,255,0.08)", flexShrink:0 }}>
        <div id={`slide-${index}`} style={{
          width: fmt.fw, height: fmt.fh, background: bg,
          position:"relative", overflow:"hidden",
          transform:`scale(${scale})`, transformOrigin:"top left", flexShrink:0,
        }}>
          <SlideContent slide={slide} fw={fmt.fw} fh={fmt.fh} assets={assets} />
        </div>
      </div>
      <button onClick={() => onDownload(index)}
        className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all w-full justify-center">
        <Download className="w-3 h-3" />
        Slide {slide.numero}
      </button>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────
function UploadZone({ label, value, onChange, hint }: {
  label: string; value: string|null; onChange:(url:string|null)=>void; hint: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-mono text-text-muted tracking-widest uppercase">{label}</label>
      {value ? (
        <div className="relative flex items-center gap-3 p-3 bg-background border border-accent-border rounded-lg">
          <img src={value} alt="" className="w-12 h-12 object-contain rounded" />
          <div className="flex-1">
            <div className="text-[12px] text-text-primary font-medium">Imagem carregada ✓</div>
            <div className="text-[10px] text-text-muted">{hint}</div>
          </div>
          <button onClick={() => onChange(null)}
            className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-400 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()}
          className="w-full flex items-center gap-3 p-3 bg-background border border-border border-dashed rounded-lg hover:border-accent-border hover:bg-accent/5 transition-all group">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-border flex items-center justify-center group-hover:border-accent-border transition-colors">
            <Upload className="w-4 h-4 text-text-muted group-hover:text-accent" />
          </div>
          <div className="text-left">
            <div className="text-[12px] text-text-secondary">Clique para fazer upload</div>
            <div className="text-[10px] text-text-muted">{hint}</div>
          </div>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f) }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────
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
  const [assets,        setAssets]        = useState<Assets>({ photo: null, logo: null })

  useEffect(() => {
    const s = document.createElement("script")
    s.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js"
    document.head.appendChild(s)
    const l = document.createElement("link")
    l.href = "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,800;1,400&display=swap"
    l.rel  = "stylesheet"
    document.head.appendChild(l)
    fetch("/api/pautas").then(r => r.json()).then(d => setPautas(d || []))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2800)
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
    const original = document.getElementById(`slide-${index}`) as HTMLElement|null
    if (!original) return
    const h2c = (window as any).html2canvas
    if (!h2c) { showToast("Aguarde o carregamento da biblioteca"); return }
    showToast("Gerando PNG…")

    const clone = original.cloneNode(true) as HTMLElement
    clone.style.transform = "none"
    clone.style.position  = "fixed"
    clone.style.top       = "-9999px"
    clone.style.left      = "-9999px"
    clone.style.zIndex    = "-999"
    document.body.appendChild(clone)

    try {
      const canvas = await h2c(clone, { scale:1, useCORS:true, allowTaint:true, backgroundColor:null, logging:false })
      const a = document.createElement("a")
      a.download = `slide_${String(index+1).padStart(2,"0")}_drbrunogustavo.png`
      a.href = canvas.toDataURL("image/png")
      a.click()
      showToast("✓ Download iniciado!")
    } finally {
      document.body.removeChild(clone)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Gerador de Imagens"
        subtitle="INSTAGRAM · STORIES · REELS · IA ESPECIALIZADA"
        actions={
          <span className="text-[11px] font-mono text-text-muted">
            {slides.length > 0 ? `${slides.length} slides · ${fmt.dims}px` : ""}
          </span>
        }
      />

      <div className="p-8 space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 space-y-5">

          {/* Assets */}
          <div className="space-y-3">
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Assets Visuais</div>
            <div className="grid grid-cols-2 gap-3">
              <UploadZone
                label="📸 Foto / Imagem IA"
                value={assets.photo}
                onChange={url => setAssets(a => ({ ...a, photo: url }))}
                hint="Fundo da capa e CTA · JPG, PNG"
              />
              <UploadZone
                label="🏷️ Logomarca"
                value={assets.logo}
                onChange={url => setAssets(a => ({ ...a, logo: url }))}
                hint="Rodapé de todos os slides · PNG"
              />
            </div>
          </div>

          <div className="border-t border-border" />

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
              {[{ id:"unica", label:"🖼️ Imagem Única" },{ id:"carrossel", label:"📑 Carrossel" }].map(t => (
                <button key={t.id} onClick={() => setTipo(t.id as any)}
                  className={cn("flex-1 py-2.5 rounded-lg border text-[12px] font-medium transition-all",
                    tipo === t.id ? "bg-accent-dim border-accent-border text-accent" : "border-border text-text-muted hover:border-border-hover")}>
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
                    fmt.id === f.id ? "bg-accent-dim border-accent-border text-accent" : "border-border text-text-muted hover:border-border-hover")}>
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

          <button onClick={gerar} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-accent-dim border border-accent-border text-accent text-[13px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-50">
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando…</>
              : <><Layers className="w-4 h-4" /> Gerar Imagens</>}
          </button>
        </div>

        {/* Preview */}
        {slides.length > 0 && (
          <div className="space-y-4">
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">
              Preview · {slides.length} slide{slides.length > 1 ? "s" : ""} · Download em {fmt.dims}px
            </div>
            <div className="flex flex-wrap gap-4">
              {slides.map((slide, i) => (
                <SlideCard key={i} slide={slide} fmt={fmt} index={i}
                  assets={assets} onDownload={downloadSlide} />
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
