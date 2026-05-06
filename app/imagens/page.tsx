"use client"

import { useState, useEffect, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { RefreshCw, Download, Layers, Upload, X, Pencil, Check, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Brand ────────────────────────────────────────────────
const GOLD     = "#b8976a"
const GOLD_VIV = "#C9A84C"
const GOLD_DIM = "rgba(185,151,106,0.13)"
const WHITE    = "#FFFFFF"
const GRAY     = "#D1D5DB"
const BEIGE    = "#D6CCC2"
const SCI_BG   = "#0D1B2A"
const BGS      = ["#534F49","#3E4345","#515664","#1a1410","#2c2018","#3E4345","#534F49"]
const SPECIALTY = "Médico Clínico-Geral | Pós-Graduado em Endocrinologia & Nutrologia"

const FORMATS = [
  { id:"retrato",  label:"Retrato Feed",  dims:"1080×1350", fw:1080, fh:1350 },
  { id:"quadrado", label:"Quadrado",      dims:"1080×1080", fw:1080, fh:1080 },
  { id:"reels",    label:"Capa de Reels", dims:"1080×1920", fw:1080, fh:1920 },
  { id:"stories",  label:"Stories",       dims:"1080×1920", fw:1080, fh:1920 },
]

const PREVIEW_W = 260

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

interface PhotoAssignment {
  capa: number|null
  cta:  number|null
  unica: number|null
}

interface Pauta { id: string; titulo: string }
interface Fmt   { id:string; label:string; dims:string; fw:number; fh:number }

// ─── Decorations ─────────────────────────────────────────
function Brackets({ size, color, opacity=0.45 }: { size:number; color:string; opacity?:number }) {
  const s: React.CSSProperties = { position:"absolute", width:size, height:size, opacity }
  return <>
    <div style={{ ...s, top:size*0.6, left:size*0.6,
      borderTop:`2px solid ${color}`, borderLeft:`2px solid ${color}` }} />
    <div style={{ ...s, bottom:size*0.6, right:size*0.6,
      borderBottom:`2px solid ${color}`, borderRight:`2px solid ${color}` }} />
  </>
}

function GlowCircle({ fw }: { fw:number }) {
  return (
    <div style={{ position:"absolute", top:"-20%", right:"-10%",
      width: fw*0.6, height: fw*0.6, borderRadius:"50%",
      background:`radial-gradient(circle, rgba(185,151,106,0.09) 0%, transparent 70%)`,
      pointerEvents:"none" }} />
  )
}

// ─── Slide Content ────────────────────────────────────────
function SlideContent({ slide, fw, fh, photo, logo }: {
  slide: Slide; fw:number; fh:number; photo:string|null; logo:string|null
}) {
  const pad   = Math.round(fw * 0.085)
  const is916 = fh > fw * 1.3
  const topOff= is916 ? Math.round(fh * 0.035) : 0
  const W     = fw - pad * 2

  const FS = {
    h:  Math.round(fw * 0.077), // ~83px @1080
    s:  Math.round(fw * 0.052), // ~56px
    b:  Math.round(fw * 0.039), // ~42px
    lb: Math.round(fw * 0.022), // ~24px
    ti: Math.round(fw * 0.019), // ~21px
  }

  const clamp = (n: number): React.CSSProperties => ({
    display:"-webkit-box",
    WebkitBoxOrient:"vertical",
    WebkitLineClamp:n,
    overflow:"hidden",
  } as React.CSSProperties)

  const tx: React.CSSProperties = {
    fontFamily:"'Montserrat','Inter',sans-serif",
    WebkitFontSmoothing:"antialiased",
  }

  // ── CAPA ──────────────────────────────────────────────
  if (slide.tipo === "capa") return <>
    {photo && <img src={photo} alt="" style={{ position:"absolute", inset:0,
      width:"100%", height:"100%", objectFit:"cover", opacity:0.3 }} />}
    <div style={{ position:"absolute", inset:0,
      background:"linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)" }} />
    <GlowCircle fw={fw} />
    <Brackets size={Math.round(fw*0.065)} color={GOLD} opacity={0.4} />

    {/* Top bar */}
    <div style={{ position:"absolute", top:0, left:0, right:0, height:5,
      background:`linear-gradient(90deg,${GOLD},${GOLD_VIV},${GOLD})` }} />

    {slide.tag && (
      <div style={{ ...tx, position:"absolute", top:pad+topOff, left:pad,
        fontSize:FS.lb, letterSpacing:7, color:GOLD, textTransform:"uppercase", fontWeight:700 }}>
        {slide.tag}
      </div>
    )}
    <div style={{ ...tx, position:"absolute", top:pad+topOff, right:pad,
      fontSize:FS.ti, color:GOLD, letterSpacing:4, fontWeight:700, opacity:0.65 }}>
      01
    </div>

    {/* Bottom content */}
    <div style={{ position:"absolute", bottom:pad, left:pad, right:pad }}>
      <div style={{ display:"flex", alignItems:"center", gap:Math.round(fw*0.018), marginBottom:Math.round(fw*0.022) }}>
        <div style={{ width:52, height:3, background:GOLD, borderRadius:2 }} />
        <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.2)" }} />
      </div>
      <div style={{ ...tx, ...clamp(2), fontSize:FS.h, fontWeight:800, color:WHITE,
        lineHeight:1.0, textTransform:"uppercase", marginBottom:Math.round(fw*0.02) }}>
        {slide.headline}
      </div>
      {slide.subtitulo && (
        <div style={{ ...tx, ...clamp(2), fontSize:FS.s, color:BEIGE, fontStyle:"italic",
          lineHeight:1.35, marginBottom:Math.round(fw*0.025) }}>
          {slide.subtitulo}
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:Math.round(fw*0.014), marginTop:Math.round(fw*0.02) }}>
        <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.3)" }} />
        <div style={{ ...tx, fontSize:FS.lb, color:GOLD, letterSpacing:3, fontWeight:600 }}>
          @drbrunogustavo
        </div>
      </div>
      {logo && (
        <img src={logo} alt="" style={{ height:Math.round(fw*0.05), width:"auto",
          marginTop:Math.round(fw*0.018), mixBlendMode:"screen", opacity:0.85 }} />
      )}
    </div>

    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3,
      background:`linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
  </>

  // ── CONTEÚDO ──────────────────────────────────────────
  if (slide.tipo === "conteudo") {
    const isSci = slide.cientifico
    const gap   = Math.round(fw * 0.025)
    const gapSm = Math.round(fw * 0.016)

    return <>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:5,
        background:`linear-gradient(90deg,${GOLD},${GOLD_VIV},${GOLD})` }} />
      <GlowCircle fw={fw} />
      {!isSci && <Brackets size={Math.round(fw*0.055)} color={GOLD} opacity={0.3} />}

      {isSci && <>
        {/* Simulated chart bars */}
        <div style={{ position:"absolute", bottom:Math.round(fh*0.18), left:pad, display:"flex", alignItems:"flex-end", gap:Math.round(fw*0.012), opacity:0.12 }}>
          {[0.4,0.65,0.5,0.85,0.7,0.95,0.8].map((h,i) => (
            <div key={i} style={{ width:Math.round(fw*0.022), height:Math.round(fh*0.12*h),
              background:GOLD, borderRadius:"2px 2px 0 0" }} />
          ))}
        </div>
      </>}

      <div style={{ ...tx, position:"absolute", top:pad+topOff, right:pad,
        fontSize:FS.ti, color:GOLD, letterSpacing:4, fontWeight:700, opacity:0.65 }}>
        {String(slide.numero).padStart(2,"0")}
      </div>

      <div style={{ position:"absolute", inset:0, padding:pad, paddingTop:pad+topOff,
        display:"flex", flexDirection:"column", justifyContent:"center", gap }}>

        {isSci && slide.dados && (
          <div style={{ background:GOLD_DIM, border:`1px solid rgba(185,151,106,0.3)`,
            borderRadius:14, padding:`${gapSm*1.4}px ${gap}px`, flexShrink:0 }}>
            <div style={{ ...tx, ...clamp(2), fontSize:FS.s*0.95, color:GOLD_VIV,
              fontWeight:800, lineHeight:1.25, marginBottom:gapSm }}>
              {slide.dados}
            </div>
            {slide.fonte && (
              <div style={{ display:"flex", alignItems:"center", gap:gapSm }}>
                <div style={{ width:24, height:2, background:GOLD, borderRadius:1 }} />
                <div style={{ ...tx, fontSize:FS.ti*0.85, color:BEIGE, letterSpacing:3,
                  textTransform:"uppercase", fontWeight:600 }}>
                  {slide.fonte}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <div style={{ ...tx, ...clamp(2), fontSize:FS.h*0.9, fontWeight:800, color:WHITE,
            lineHeight:1.0, textTransform:"uppercase", marginBottom:gapSm }}>
            {slide.headline}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:gapSm }}>
            <div style={{ width:44, height:3, background:GOLD, borderRadius:2 }} />
            <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.15)" }} />
          </div>
        </div>

        {slide.texto && (
          <div style={{ ...tx, ...clamp(3), fontSize:FS.b, color:GRAY, lineHeight:1.7 }}>
            {slide.texto}
          </div>
        )}

        {!isSci && slide.dados && (
          <div style={{ borderLeft:`5px solid ${GOLD}`, background:GOLD_DIM,
            padding:`${gapSm}px ${gap}px`, borderRadius:"0 10px 10px 0", flexShrink:0 }}>
            <div style={{ ...tx, ...clamp(2), fontSize:FS.b*0.95, color:GOLD_VIV, fontWeight:700, lineHeight:1.4 }}>
              {slide.dados}
            </div>
            {slide.fonte && (
              <div style={{ ...tx, fontSize:FS.ti, color:BEIGE, marginTop:gapSm, letterSpacing:2, textTransform:"uppercase" }}>
                {slide.fonte}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ position:"absolute", bottom:pad, left:pad, display:"flex", alignItems:"center", gap:Math.round(fw*0.012) }}>
        <div style={{ width:18, height:1, background:GOLD, opacity:0.5 }} />
        <div style={{ ...tx, fontSize:FS.ti*0.82, color:GOLD, letterSpacing:2, opacity:0.65 }}>
          @drbrunogustavo
        </div>
      </div>
      {logo && (
        <img src={logo} alt="" style={{ position:"absolute", bottom:pad, right:pad,
          height:Math.round(fw*0.044), width:"auto", mixBlendMode:"screen", opacity:0.8 }} />
      )}

      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
    </>
  }

  // ── CTA ───────────────────────────────────────────────
  if (slide.tipo === "cta") return <>
    {photo && <img src={photo} alt="" style={{ position:"absolute", inset:0,
      width:"100%", height:"100%", objectFit:"cover", opacity:0.18 }} />}
    <div style={{ position:"absolute", inset:0,
      background:"radial-gradient(ellipse at center, rgba(185,151,106,0.16) 0%, rgba(0,0,0,0.55) 75%)" }} />
    <Brackets size={Math.round(fw*0.07)} color={GOLD} opacity={0.5} />

    <div style={{ position:"absolute", top:0, left:0, right:0, height:5,
      background:`linear-gradient(90deg,${GOLD},${GOLD_VIV},${GOLD})` }} />

    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:pad, textAlign:"center",
      gap:Math.round(fw*0.028) }}>

      <div style={{ width:Math.round(fw*0.065), height:Math.round(fw*0.065), borderRadius:"50%",
        border:`2px solid ${GOLD}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:Math.round(fw*0.028), height:Math.round(fw*0.028), borderRadius:"50%",
          background:GOLD_DIM, border:`1px solid ${GOLD}` }} />
      </div>

      <div style={{ ...tx, fontSize:FS.h*1.08, fontWeight:800, color:WHITE,
        textTransform:"uppercase", lineHeight:0.9, letterSpacing:-1 }}>
        SALVE<br/>ESTE POST
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:Math.round(fw*0.025), width:"55%" }}>
        <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.35)" }} />
        <div style={{ width:7, height:7, borderRadius:"50%", background:GOLD }} />
        <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.35)" }} />
      </div>

      <div style={{ ...tx, fontSize:FS.s, color:BEIGE, lineHeight:1.65 }}>
        Compartilhe com quem<br/>precisa saber disso
      </div>

      <div style={{ ...tx, fontSize:FS.lb, letterSpacing:5, color:GOLD,
        textTransform:"uppercase", fontWeight:700 }}>
        SIGA PARA MAIS CONTEÚDO
      </div>

      <div style={{ ...tx, fontSize:FS.h*0.6, fontWeight:800, color:WHITE }}>
        @drbrunogustavo
      </div>

      <div style={{ ...tx, fontSize:FS.lb*0.88, color:BEIGE, letterSpacing:0.5, lineHeight:1.55, maxWidth:W*0.85 }}>
        {SPECIALTY}
      </div>

      {logo && (
        <img src={logo} alt="" style={{ height:Math.round(fw*0.052), width:"auto",
          mixBlendMode:"screen", opacity:0.85 }} />
      )}
    </div>

    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3,
      background:`linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
  </>

  // ── IMAGEM ÚNICA ──────────────────────────────────────
  return <>
    {photo && <img src={photo} alt="" style={{ position:"absolute", inset:0,
      width:"100%", height:"100%", objectFit:"cover", opacity:0.28 }} />}
    <div style={{ position:"absolute", inset:0,
      background:"linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 100%)" }} />
    <GlowCircle fw={fw} />
    <Brackets size={Math.round(fw*0.06)} color={GOLD} opacity={0.4} />

    <div style={{ position:"absolute", top:0, left:0, right:0, height:5,
      background:`linear-gradient(90deg,${GOLD},${GOLD_VIV},${GOLD})` }} />

    {slide.tag && (
      <div style={{ ...tx, position:"absolute", top:pad+topOff, left:pad,
        fontSize:FS.lb, letterSpacing:7, color:GOLD, textTransform:"uppercase", fontWeight:700 }}>
        {slide.tag}
      </div>
    )}

    <div style={{ position:"absolute", inset:0, padding:pad, paddingTop:pad+topOff,
      display:"flex", flexDirection:"column", justifyContent:"center", gap:Math.round(fw*0.025) }}>
      <div style={{ display:"flex", alignItems:"center", gap:Math.round(fw*0.016) }}>
        <div style={{ width:44, height:3, background:GOLD, borderRadius:2 }} />
        <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.2)" }} />
      </div>
      <div style={{ ...tx, ...clamp(2), fontSize:FS.h, fontWeight:800, color:WHITE,
        lineHeight:1.0, textTransform:"uppercase" }}>
        {slide.headline}
      </div>
      {slide.subtitulo && (
        <div style={{ ...tx, ...clamp(2), fontSize:FS.s, color:GOLD_VIV, fontStyle:"italic", lineHeight:1.35 }}>
          {slide.subtitulo}
        </div>
      )}
      {slide.texto && (
        <div style={{ ...tx, ...clamp(3), fontSize:FS.b, color:GRAY, lineHeight:1.7 }}>
          {slide.texto}
        </div>
      )}
    </div>

    <div style={{ position:"absolute", bottom:pad, left:pad, right:pad,
      display:"flex", alignItems:"center", gap:Math.round(fw*0.014) }}>
      <div style={{ flex:1, height:1, background:"rgba(185,151,106,0.25)" }} />
      <div style={{ ...tx, fontSize:FS.lb, color:GOLD, letterSpacing:3 }}>
        @drbrunogustavo
      </div>
    </div>
    {logo && (
      <img src={logo} alt="" style={{ position:"absolute", bottom:pad*1.8, right:pad,
        height:Math.round(fw*0.05), width:"auto", mixBlendMode:"screen", opacity:0.85 }} />
    )}
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3,
      background:`linear-gradient(90deg,transparent,${GOLD},transparent)` }} />
  </>
}

// ─── Slide Card ───────────────────────────────────────────
function SlideCard({ slide, fmt, index, photo, logo, tema, onDownload, onUpdate }: {
  slide: Slide; fmt: Fmt; index: number; photo: string|null; logo: string|null
  tema: string; onDownload:(i:number)=>void; onUpdate:(i:number, s:Slide)=>void
}) {
  const scale     = PREVIEW_W / fmt.fw
  const prevH     = Math.round(fmt.fh * scale)
  const bg        = slide.cientifico ? SCI_BG : BGS[slide.numero % BGS.length]
  const [editing, setEditing]   = useState(false)
  const [instrucao, setInstrucao] = useState("")
  const [regen, setRegen]       = useState(false)

  const regenerate = async () => {
    if (!instrucao.trim()) return
    setRegen(true)
    try {
      const res = await fetch("/api/imagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, singleSlide: slide, instrucao }),
      })
      const data = await res.json()
      if (data.slide) { onUpdate(index, { ...data.slide, numero: slide.numero }); setEditing(false); setInstrucao("") }
    } catch {}
    setRegen(false)
  }

  return (
    <div className="flex flex-col gap-2" style={{ width: PREVIEW_W }}>
      {/* Slide preview */}
      <div style={{ width: PREVIEW_W, height: prevH, overflow:"hidden",
        borderRadius:6, border:"1px solid rgba(255,255,255,0.07)", flexShrink:0, position:"relative" }}>
        <div id={`slide-${index}`} style={{ width:fmt.fw, height:fmt.fh, background:bg,
          position:"relative", overflow:"hidden",
          transform:`scale(${scale})`, transformOrigin:"top left" }}>
          <SlideContent slide={slide} fw={fmt.fw} fh={fmt.fh} photo={photo} logo={logo} />
        </div>
        {/* Slide number badge */}
        <div className="absolute top-1.5 left-1.5 text-[9px] font-mono bg-black/50 text-white/70 px-1.5 py-0.5 rounded">
          {String(slide.numero).padStart(2,"0")}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <button onClick={() => onDownload(index)}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all">
          <Download className="w-3 h-3" /> PNG
        </button>
        <button onClick={() => setEditing(v => !v)}
          className={cn("flex items-center justify-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border transition-all",
            editing ? "bg-accent-dim border-accent-border text-accent" : "border-border text-text-muted hover:border-accent-border hover:text-accent")}>
          <Pencil className="w-3 h-3" /> Editar
        </button>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="space-y-1.5 animate-fade-in">
          <textarea
            value={instrucao}
            onChange={e => setInstrucao(e.target.value)}
            placeholder="Ex: Deixe o headline mais curto. Adicione dado do NEJM."
            rows={2}
            className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-[11px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 resize-none" />
          <button onClick={regenerate} disabled={regen || !instrucao.trim()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent-dim border border-accent-border text-accent text-[11px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-50">
            {regen ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            {regen ? "Regenerando…" : "Regenerar Slide"}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────
function UploadZone({ label, value, onChange, hint, compact=false }: {
  label:string; value:string|null; onChange:(url:string|null)=>void; hint:string; compact?:boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const handleFile = (f: File) => {
    const r = new FileReader(); r.onload = e => onChange(e.target?.result as string); r.readAsDataURL(f)
  }
  if (compact && value) return (
    <div className="relative group cursor-pointer" onClick={() => ref.current?.click()}>
      <img src={value} alt="" className="w-14 h-14 object-contain rounded-lg border border-accent-border" />
      <button onClick={e => { e.stopPropagation(); onChange(null) }}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="w-2.5 h-2.5 text-white" />
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f) }} />
    </div>
  )
  if (compact) return (
    <button onClick={() => ref.current?.click()}
      className="w-14 h-14 rounded-lg border border-dashed border-border hover:border-accent-border flex items-center justify-center transition-colors group">
      <Upload className="w-4 h-4 text-text-muted group-hover:text-accent" />
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f) }} />
    </button>
  )
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-mono text-text-muted tracking-widest uppercase">{label}</label>
      {value ? (
        <div className="flex items-center gap-2.5 p-2.5 bg-background border border-accent-border rounded-lg">
          <img src={value} alt="" className="w-10 h-10 object-contain rounded" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-text-primary font-medium">Carregada ✓</div>
            <div className="text-[9px] text-text-muted truncate">{hint}</div>
          </div>
          <button onClick={() => onChange(null)} className="w-5 h-5 rounded border border-border flex items-center justify-center text-text-muted hover:text-red-400 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()}
          className="w-full flex items-center gap-2.5 p-2.5 bg-background border border-dashed border-border rounded-lg hover:border-accent-border transition-all group">
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-border flex items-center justify-center group-hover:border-accent-border transition-colors flex-shrink-0">
            <Upload className="w-3.5 h-3.5 text-text-muted group-hover:text-accent" />
          </div>
          <div className="text-left">
            <div className="text-[11px] text-text-secondary">Upload de imagem</div>
            <div className="text-[9px] text-text-muted">{hint}</div>
          </div>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f) }} />
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

  // Photos: array + assignments
  const [photos,      setPhotos]      = useState<string[]>([])
  const [logo,        setLogo]        = useState<string|null>(null)
  const [assignments, setAssignments] = useState<PhotoAssignment>({ capa:null, cta:null, unica:null })

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

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null),2800) }

  const getTema = () => {
    if (selectedPauta) return pautas.find(p=>p.id===selectedPauta)?.titulo || temaLivre
    return temaLivre
  }

  const addPhoto = (url: string) => {
    setPhotos(prev => {
      const next = [...prev, url]
      // Auto-assign first photo to capa, second to cta
      if (next.length === 1) setAssignments(a => ({ ...a, capa: 0, unica: 0 }))
      if (next.length === 2) setAssignments(a => ({ ...a, cta: 1 }))
      return next
    })
  }

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_,idx)=>idx!==i))
    setAssignments(prev => ({
      capa:  prev.capa  === i ? null : prev.capa  !== null && prev.capa  > i ? prev.capa  - 1 : prev.capa,
      cta:   prev.cta   === i ? null : prev.cta   !== null && prev.cta   > i ? prev.cta   - 1 : prev.cta,
      unica: prev.unica === i ? null : prev.unica !== null && prev.unica > i ? prev.unica - 1 : prev.unica,
    }))
  }

  const getPhotoForSlide = (slide: Slide) => {
    if (slide.tipo === "capa"   && assignments.capa  !== null) return photos[assignments.capa]  ?? null
    if (slide.tipo === "cta"    && assignments.cta   !== null) return photos[assignments.cta]   ?? null
    if (slide.tipo === "unica"  && assignments.unica !== null) return photos[assignments.unica] ?? null
    return null
  }

  const gerar = async () => {
    const tema = getTema().trim()
    if (!tema) { showToast("Selecione uma pauta ou digite um tema"); return }
    setLoading(true); setSlides([])
    try {
      const res = await fetch("/api/imagens", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ tema, tipo, numSlides: tipo==="unica"?1:numSlides }),
      })
      const data = await res.json()
      if (data.slides) setSlides(data.slides)
      else showToast("Erro ao gerar slides")
    } catch { showToast("Erro ao gerar slides") }
    setLoading(false)
  }

  const updateSlide = (index: number, updated: Slide) => {
    setSlides(prev => prev.map((s,i) => i===index ? updated : s))
  }

  const downloadSlide = async (index: number) => {
    const original = document.getElementById(`slide-${index}`) as HTMLElement|null
    if (!original) return
    const h2c = (window as any).html2canvas
    if (!h2c) { showToast("Aguarde carregamento da biblioteca"); return }
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
    } finally { document.body.removeChild(clone) }
  }

  const tema = getTema()

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

          {/* ── Assets ── */}
          <div className="space-y-3">
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Assets Visuais</div>
            <div className="grid grid-cols-2 gap-3">
              {/* Photos */}
              <div className="space-y-2">
                <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">📸 Fotos / Imagens IA</div>
                <div className="flex flex-wrap gap-2">
                  {photos.map((p,i) => (
                    <div key={i} className="relative group">
                      <img src={p} alt="" className="w-14 h-14 object-cover rounded-lg border border-border" />
                      <button onClick={() => removePhoto(i)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 items-center justify-center hidden group-hover:flex">
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                      <div className="text-[8px] text-center text-text-muted font-mono mt-0.5">#{i+1}</div>
                    </div>
                  ))}
                  <label className="w-14 h-14 rounded-lg border border-dashed border-border hover:border-accent-border flex items-center justify-center cursor-pointer transition-colors group">
                    <Upload className="w-4 h-4 text-text-muted group-hover:text-accent" />
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=ev=>addPhoto(ev.target?.result as string); r.readAsDataURL(f) }}} />
                  </label>
                </div>
                {photos.length > 0 && (
                  <div className="space-y-1.5">
                    {[
                      { key:"capa",  label:"Capa (slide 1)" },
                      { key:"cta",   label:"CTA (último slide)" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-text-muted w-28">{label}</span>
                        <select
                          value={assignments[key as keyof PhotoAssignment] ?? ""}
                          onChange={e => setAssignments(a => ({ ...a, [key]: e.target.value === "" ? null : Number(e.target.value) }))}
                          className="flex-1 bg-background border border-border rounded px-2 py-1 text-[10px] text-text-primary outline-none">
                          <option value="">Sem foto</option>
                          {photos.map((_,i) => <option key={i} value={i}>Foto #{i+1}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Logo */}
              <UploadZone
                label="🏷️ Logomarca"
                value={logo}
                onChange={setLogo}
                hint="Rodapé de todos os slides · PNG recomendado"
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Pauta */}
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
              {[{id:"unica",label:"🖼️ Imagem Única"},{id:"carrossel",label:"📑 Carrossel"}].map(t=>(
                <button key={t.id} onClick={() => setTipo(t.id as any)}
                  className={cn("flex-1 py-2.5 rounded-lg border text-[12px] font-medium transition-all",
                    tipo===t.id?"bg-accent-dim border-accent-border text-accent":"border-border text-text-muted hover:border-border-hover")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <label className="text-[9px] font-mono text-text-muted tracking-widest uppercase">Formato</label>
            <div className="grid grid-cols-4 gap-2">
              {FORMATS.map(f=>(
                <button key={f.id} onClick={() => setFmt(f)}
                  className={cn("py-2 px-3 rounded-lg border text-[11px] transition-all",
                    fmt.id===f.id?"bg-accent-dim border-accent-border text-accent":"border-border text-text-muted hover:border-border-hover")}>
                  <div className="font-medium">{f.label}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">{f.dims}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Num slides */}
          {tipo==="carrossel" && (
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-text-muted tracking-widest uppercase">
                Número de Slides — <span className="text-accent">{numSlides}</span>
              </label>
              <input type="range" min={2} max={15} value={numSlides}
                onChange={e => setNumSlides(Number(e.target.value))} className="w-full accent-accent" />
              <div className="flex justify-between text-[9px] text-text-muted font-mono">
                <span>2</span><span>15</span>
              </div>
            </div>
          )}

          <button onClick={gerar} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-accent-dim border border-accent-border text-accent text-[13px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-50">
            {loading?<><RefreshCw className="w-4 h-4 animate-spin"/>Gerando…</>:<><Layers className="w-4 h-4"/>Gerar Imagens</>}
          </button>
        </div>

        {/* Preview */}
        {slides.length > 0 && (
          <div className="space-y-4">
            <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase">
              Preview · {slides.length} slide{slides.length>1?"s":""} · {fmt.dims}px · Clique em Editar para corrigir um slide
            </div>
            <div className="flex flex-wrap gap-5">
              {slides.map((slide, i) => (
                <SlideCard key={`${i}-${slide.headline}`}
                  slide={slide} fmt={fmt} index={i}
                  photo={getPhotoForSlide(slide)}
                  logo={logo} tema={tema}
                  onDownload={downloadSlide}
                  onUpdate={updateSlide}
                />
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
