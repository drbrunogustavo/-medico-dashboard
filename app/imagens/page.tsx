// Salvar em: app/imagens/page.tsx
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { PautasModal } from '@/components/PautasModal'

// ─── Types ────────────────────────────────────────────────────────────────────
type Formato = 'feed-retrato' | 'quadrado' | 'stories' | 'reels-capa'
type Tipo    = 'unica' | 'carrossel'
type OffsetMap   = Record<string, { x: number; y: number }>
type TextOffsets = Record<number, OffsetMap>

interface BoxItem  { titulo: string; descricao: string }
interface StatItem { valor: string; unidade?: string; descricao: string }

interface SlideData {
  id: number
  tipo: 'capa' | 'conteudo' | 'cta'
  headline:  string
  subtitulo: string
  corpo:     string
  fotoIndex: number | null
  fonte?:    string
  items?:    BoxItem[]
  stats?:    StatItem[]
}

// ─── Paleta · Estrutura ──────────────────────────────────────────────────────
type PaletaId    = 'dourado' | 'azul' | 'esmeralda' | 'vinho' | 'offwhite'
type TipografiaId = 'montserrat' | 'poppins' | 'raleway' | 'dm-sans'
type EstruturaId = 'classico' | 'split' | 'topo-bold' | 'minimal'

interface PaletaCores {
  bg: string; bgCard: string; bgMid: string
  d1: string; d2: string
  w: string; wMid: string; wFaint: string
}

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  bg:     '#120a04',
  bgCard: '#1c0f06',
  bgMid:  '#261408',
  d1:     '#b8976a',
  d2:     '#C9A84C',
  w:      '#F5F0EB',
  wMid:   'rgba(245,240,235,0.68)',
  wFaint: 'rgba(245,240,235,0.38)',
}

const PALETAS: Record<PaletaId, { label: string; emoji: string; preview: string[]; cores: PaletaCores }> = {
  dourado:   { label: 'Dourado Escuro', emoji: '🟤', preview: ['#120a04','#C9A84C','#F5F0EB'],
    cores: { bg:'#120a04', bgCard:'#1c0f06', bgMid:'#261408', d1:'#b8976a', d2:'#C9A84C', w:'#F5F0EB', wMid:'rgba(245,240,235,0.68)', wFaint:'rgba(245,240,235,0.38)' } },
  azul:      { label: 'Azul Médico',    emoji: '🔵', preview: ['#040d1a','#3b82f6','#EFF6FF'],
    cores: { bg:'#040d1a', bgCard:'#071428', bgMid:'#0a1f3d', d1:'#60a5fa', d2:'#3b82f6', w:'#EFF6FF', wMid:'rgba(239,246,255,0.68)', wFaint:'rgba(239,246,255,0.35)' } },
  esmeralda: { label: 'Esmeralda',      emoji: '🟢', preview: ['#020f0a','#10b981','#ECFDF5'],
    cores: { bg:'#020f0a', bgCard:'#041a10', bgMid:'#052b18', d1:'#34d399', d2:'#10b981', w:'#ECFDF5', wMid:'rgba(236,253,245,0.68)', wFaint:'rgba(236,253,245,0.35)' } },
  offwhite:  { label: 'Off-White',      emoji: '◻️', preview: ['#F8F6F1','#1a1a1a','#2d2d2d'],
    cores: { bg:'#F8F6F1', bgCard:'#EFEFEB', bgMid:'#E8E5DE', d1:'#6b6b6b', d2:'#1a1a1a', w:'#1a1a1a', wMid:'rgba(26,26,26,0.65)', wFaint:'rgba(26,26,26,0.38)' } },
  vinho:     { label: 'Vinho Premium',  emoji: '🍷', preview: ['#0d0105','#9f1239','#FDF2F4'],
    cores: { bg:'#0d0105', bgCard:'#170208', bgMid:'#22030d', d1:'#9f1239', d2:'#be123c', w:'#FDF2F4', wMid:'rgba(253,242,244,0.68)', wFaint:'rgba(253,242,244,0.35)' } },
}

const ESTRUTURAS: Record<EstruturaId, { label: string; emoji: string; desc: string }> = {
  'classico':  { label: 'Clássico',  emoji: '🖼️', desc: 'Foto full-screen, texto inferior' },
  'split':     { label: 'Split',     emoji: '▪️▪️', desc: 'Foto à direita, texto à esquerda' },
  'topo-bold': { label: 'Topo Bold', emoji: '⬆️', desc: 'Headline grande no topo com faixa' },
  'minimal':   { label: 'Minimal',   emoji: '◻️', desc: 'Tipografia maximalista, sem foto' },
}

const TIPOGRAFIAS: Record<TipografiaId, { label: string; serif: string; sans: string; import: string }> = {
  'montserrat': { label: 'Montserrat',  sans: "'Montserrat', sans-serif",   serif: "'Playfair Display', serif", import: "Montserrat:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700" },
  'poppins':    { label: 'Poppins',     sans: "'Poppins', sans-serif",      serif: "'Cormorant Garamond', serif", import: "Poppins:wght@400;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,700;1,700" },
  'raleway':    { label: 'Raleway',     sans: "'Raleway', sans-serif",      serif: "'Libre Baskerville', serif",  import: "Raleway:wght@400;600;700;800;900&family=Libre+Baskerville:ital,wght@0,700;1,400" },
  'dm-sans':    { label: 'DM Sans',     sans: "'DM Sans', sans-serif",      serif: "'DM Serif Display', serif",   import: "DM+Sans:wght@400;600;700;800;900&family=DM+Serif+Display:ital@0;1" },
}

const FORMATOS_CONFIG = {
  'feed-retrato': { label: 'Feed Retrato',   w: 1080, h: 1350, desc: '4:5'  },
  quadrado:       { label: 'Quadrado',        w: 1080, h: 1080, desc: '1:1'  },
  stories:        { label: 'Stories',         w: 1080, h: 1920, desc: '9:16' },
  'reels-capa':   { label: 'Capa de Reels',   w: 1080, h: 1920, desc: '9:16' },
}

const HANDLE = '@drbrunogustavo'
const NOME   = 'DR. BRUNO GUSTAVO'
const ASSIN  = 'MEDICINA BASEADA EM EVIDÊNCIA'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (n: number): React.CSSProperties => ({
  display: '-webkit-box' as React.CSSProperties['display'],
  WebkitLineClamp: n,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WebkitBoxOrient: 'vertical' as any,
  overflow: 'hidden',
})

function Headline({ text, fs, lh, cn, pal, sans, serif }: { text: string; fs: number; lh: number; cn: number; pal?: PaletaCores; sans?: string; serif?: string }) {
  const activeP  = pal ?? C
  const sansFont = sans  ?? "'Montserrat', sans-serif"
  const serifFont = serif ?? "'Playfair Display', serif"
  const parts = text.split(/\*([^*]+)\*/)
  return (
    <div style={{ fontSize: fs, lineHeight: lh, fontWeight: 900, color: activeP.w, fontFamily: sansFont, ...clamp(cn) }}>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <span key={i} style={{ color: activeP.d2, fontStyle: 'italic', fontFamily: serifFont, fontWeight: 700 }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </div>
  )
}

function SourceBadge({ fonte, pal }: { fonte: string; pal?: PaletaCores }) {
  const activeP = pal ?? C
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ width: 36, height: 36, background: activeP.d2, color: activeP.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, flexShrink: 0 }}>
        {fonte.charAt(0)}
      </div>
      <div style={{ color: activeP.d2, fontSize: 18, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const }}>
        {fonte}
      </div>
    </div>
  )
}

// ─── DragWrap ─────────────────────────────────────────────────────────────────
// Torna qualquer bloco arrastável. Usa ref para evitar closures desatualizadas.
function DragWrap({
  dragKey, offsets, onDrag, scale, enabled, children, style,
}: {
  dragKey: string
  offsets: OffsetMap
  onDrag:  (key: string, x: number, y: number) => void
  scale:   number
  enabled: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const off = offsets[dragKey] ?? { x: 0, y: 0 }
  // ref para nunca ter closure desatualizada dentro dos event listeners globais
  const live = useRef({ off, onDrag, scale, dragKey })
  live.current = { off, onDrag, scale, dragKey }

  const beginDrag = (startX: number, startY: number) => {
    const origin = { ...live.current.off }
    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
      const { scale: s, onDrag: cb, dragKey: k } = live.current
      cb(k, origin.x + (cx - startX) / s, origin.y + (cy - startY) / s)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend',  onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend',  onUp)
  }

  return (
    <div
      style={{
        ...style,
        transform: `translate(${off.x}px, ${off.y}px)`,
        cursor:      enabled ? 'move'   : undefined,
        outline:     enabled ? '1.5px dashed rgba(200,168,76,0.55)' : 'none',
        userSelect:  enabled ? 'none'   : undefined,
        touchAction: enabled ? 'none'   : undefined,
      } as React.CSSProperties}
      onMouseDown={enabled ? (e) => { e.preventDefault(); e.stopPropagation(); beginDrag(e.clientX, e.clientY) } : undefined}
      onTouchStart={enabled ? (e) => { e.stopPropagation(); beginDrag(e.touches[0].clientX, e.touches[0].clientY) } : undefined}
    >
      {children}
    </div>
  )
}

// ─── Default slides ───────────────────────────────────────────────────────────
function createDefaultSlides(tipo: Tipo, n: number): SlideData[] {
  if (tipo === 'unica') return [{ id: 1, tipo: 'capa', headline: 'Título do *Post*', subtitulo: 'INFORMAÇÃO', corpo: '', fotoIndex: null }]

  const slides: SlideData[] = []
  slides.push({ id: 1, tipo: 'capa', headline: 'Título do *Carrossel*', subtitulo: 'INFORMAÇÃO', corpo: '', fotoIndex: null })

  for (let i = 2; i <= n - 1; i++) {
    const li = ((i - 2) % 4) + 1
    const num = String(i - 1).padStart(2, '0')
    if (li === 1) {
      slides.push({ id: i, tipo: 'conteudo', fotoIndex: null, headline: '', subtitulo: `${num} — A CIÊNCIA`, corpo: 'Se fosse só força de vontade, os medicamentos não funcionariam. Mas eles funcionam — e *muito bem*.' })
    } else if (li === 2) {
      slides.push({ id: i, tipo: 'conteudo', fotoIndex: null, headline: `Os *mecanismos* por trás`, subtitulo: `${num} — OS FATOS`, corpo: '', items: [
        { titulo: 'Tópico A', descricao: 'Descrição concisa do primeiro ponto relevante ao tema.' },
        { titulo: 'Tópico B', descricao: 'Descrição concisa do segundo ponto relevante ao tema.' },
        { titulo: 'Tópico C', descricao: 'Descrição concisa do terceiro ponto relevante ao tema.' },
        { titulo: 'Tópico D', descricao: 'Descrição concisa do quarto ponto relevante ao tema.' },
      ]})
    } else if (li === 3) {
      slides.push({ id: i, tipo: 'conteudo', fotoIndex: null, headline: `*Adaptação* Metabólica`, subtitulo: `${num} — A EVIDÊNCIA`, corpo: '', fonte: 'New England Journal of Medicine', stats: [
        { valor: '−500', unidade: 'kcal', descricao: 'Redução do gasto energético diário após perda de peso' },
        { valor: '6×',   unidade: 'mais', descricao: 'Aumento da fome após 6 meses de restrição calórica' },
        { valor: '95',   unidade: '%',    descricao: 'Reganham o peso perdido em até 5 anos' },
      ]})
    } else {
      slides.push({ id: i, tipo: 'conteudo', fotoIndex: null, headline: `Ponto *${i - 1}*`, subtitulo: `${num} — ENTENDA`, corpo: 'O corpo tem mecanismos de defesa contra a perda de peso. Entender isso muda a forma de tratar.' })
    }
  }

  slides.push({
    id: n, tipo: 'cta',
    headline: 'SALVE *ESTE POST*',
    subtitulo: 'GOSTOU DESTE CONTEÚDO?',
    corpo: '📌 Salve para ter esta informação sempre à mão|📤 Compartilhe com quem precisa ler isso agora|💬 Comente: o que mais te surpreendeu?',
    fotoIndex: null,
  })

  return slides
}

// ─── SlideCanvas ──────────────────────────────────────────────────────────────
interface CanvasProps {
  slide: SlideData; formato: Formato; fotos: string[]
  logo: string | null; totalSlides: number; scale: number
  dragMode?: boolean
  offsets?:  OffsetMap
  onDrag?:   (key: string, x: number, y: number) => void
  paleta?:   PaletaId
  estrutura?: EstruturaId
  tipografia?: TipografiaId
}

function SlideCanvas({ slide, formato, fotos, logo, totalSlides, scale, dragMode = false, offsets = {}, onDrag = () => {}, paleta = 'dourado', estrutura = 'classico', tipografia = 'montserrat' }: CanvasProps) {
  const { w, h } = FORMATOS_CONFIG[formato]
  const foto = slide.fotoIndex !== null ? (fotos[slide.fotoIndex] ?? null) : null
  const li = ((slide.id - 2) % 4) + 1
  const P = PALETAS[paleta]?.cores ?? C  // active palette
  const T = TIPOGRAFIAS[tipografia] ?? TIPOGRAFIAS['montserrat']  // active typography

  const base: React.CSSProperties = {
    width: w, height: h, position: 'relative', overflow: 'hidden',
    fontFamily: T.sans,
    transform: `scale(${scale})`, transformOrigin: 'top left', flexShrink: 0,
  }

  // Shared drag props for DragWrap
  const dp = { offsets, onDrag, scale, enabled: dragMode }

  const Counter = () => totalSlides > 1 ? (
    <div style={{ position: 'absolute', top: 90, right: 52, background: 'rgba(0,0,0,0.55)', borderRadius: 40, padding: '10px 22px', color: P.w, fontSize: 22, fontWeight: 700, zIndex: 10 }}>
      {slide.id}/{totalSlides}
    </div>
  ) : null

  // ── CAPA — Split Layout ─────────────────────────────────────────────────
  if (slide.tipo === 'capa' && estrutura === 'split') {
    return (
      <div style={{ width:w, height:h, position:'relative', overflow:'hidden', fontFamily: T.sans, transform:`scale(${scale})`, transformOrigin:'top left', flexShrink:0 }}>
        <div style={{ position:'absolute', inset:0, background:P.bg }} />
        {/* Right half — foto */}
        {foto && (
          <div style={{ position:'absolute', top:0, right:0, width:'52%', height:'100%', overflow:'hidden' }}>
            <img src={foto} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', opacity:0.85 }} />
            <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right, ${P.bg} 0%, rgba(0,0,0,0) 50%)` }} />
          </div>
        )}
        {/* Vertical divider line */}
        <div style={{ position:'absolute', left:'48%', top:'10%', bottom:'10%', width:2, background:`linear-gradient(to bottom, transparent, ${P.d2}, transparent)` }} />
        {/* Left half — text */}
        <DragWrap dragKey="tag" {...{offsets, onDrag, scale, enabled:dragMode}} style={{ position:'absolute', top:90, left:60, zIndex:5 }}>
          <div style={{ display:'inline-block', padding:'8px 18px', border:`1px solid rgba(${P.d2.replace('#','').match(/.{2}/g)?.map(x=>parseInt(x,16)).join(',')},0.5)`, background:'rgba(0,0,0,0.5)', color:P.w, fontSize:18, fontWeight:700, letterSpacing:4, textTransform:'uppercase' as const }}>{slide.subtitulo||'INFORMAÇÃO'}</div>
        </DragWrap>
        <DragWrap dragKey="content" {...{offsets, onDrag, scale, enabled:dragMode}} style={{ position:'absolute', left:60, right:'54%', top:200, zIndex:5 }}>
          <div style={{ color:P.d1, fontSize:22, fontWeight:700, letterSpacing:4, textTransform:'uppercase' as const, marginBottom:24 }}>A GRANDE QUESTÃO</div>
          <Headline text={slide.headline||'Título do *Post*'} fs={86} lh={1.05} cn={6} pal={P} sans={T.sans} serif={T.serif} />
          {slide.corpo && <div style={{ display:'flex', gap:20, marginTop:44, alignItems:'flex-start' }}>
            <div style={{ width:4, flexShrink:0, background:`linear-gradient(to bottom,${P.d2},transparent)`, minHeight:72 }} />
            <div style={{ color:P.wMid, fontSize:32, fontStyle:'italic', lineHeight:1.5, fontFamily: T.serif, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' as const }}>"{slide.corpo}"</div>
          </div>}
        </DragWrap>
        <DragWrap dragKey="footer" {...{offsets, onDrag, scale, enabled:dragMode}} style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:5 }}>
          <div style={{ padding:'32px 60px', background:`linear-gradient(to top,${P.bg} 60%,transparent)`, display:'flex', alignItems:'center', justifyContent:logo?'flex-end':'center' }}>
            {logo && <div style={{ background:'transparent', display:'inline-block' }}><img src={logo} alt="" style={{ height:90, maxWidth:280, objectFit:'contain' , display:'block' }} /></div>}
          </div>
        </DragWrap>
      </div>
    )
  }

  // ── CAPA — Topo Bold Layout ───────────────────────────────────────────────
  if (slide.tipo === 'capa' && estrutura === 'topo-bold') {
    return (
      <div style={{ width:w, height:h, position:'relative', overflow:'hidden', fontFamily: T.sans, transform:`scale(${scale})`, transformOrigin:'top left', flexShrink:0 }}>
        <div style={{ position:'absolute', inset:0, background:P.bg }} />
        {foto && (<>
          <img src={foto} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', opacity:0.35 }} />
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom,${P.bg} 0%,rgba(0,0,0,0) 40%,${P.bg} 80%)` }} />
        </>)}
        {/* Top color bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:8, background:`linear-gradient(to right,${P.d2},${P.d1},transparent)` }} />
        {/* Top section — headline */}
        <DragWrap dragKey="content" {...{offsets, onDrag, scale, enabled:dragMode}} style={{ position:'absolute', top:60, left:80, right:80, zIndex:5 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
            <div style={{ width:44, height:44, background:P.d2, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ color:P.bg, fontSize:20, fontWeight:900 }}>+</div>
            </div>
            <div style={{ color:P.d2, fontSize:18, fontWeight:700, letterSpacing:4, textTransform:'uppercase' as const }}>{slide.subtitulo||'INFORMAÇÃO'}</div>
          </div>
          <Headline text={slide.headline||'Título do *Post*'} fs={100} lh={1.0} cn={4} pal={P} sans={T.sans} serif={T.serif} />
        </DragWrap>
        {/* Bottom section */}
        <DragWrap dragKey="footer" {...{offsets, onDrag, scale, enabled:dragMode}} style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:5 }}>
          <div style={{ padding:'0 80px 60px', background:`linear-gradient(to top,${P.bg} 70%,transparent)` }}>
            {slide.corpo && <div style={{ display:'flex', gap:20, marginBottom:32, alignItems:'flex-start' }}>
              <div style={{ width:4, flexShrink:0, background:`linear-gradient(to bottom,${P.d2},transparent)`, minHeight:72 }} />
              <div style={{ color:P.wMid, fontSize:36, fontStyle:'italic', lineHeight:1.5, fontFamily: T.serif, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' as const }}>"{slide.corpo}"</div>
            </div>}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ color:P.d1, fontSize:20, fontWeight:700, letterSpacing:2 }}>DR. BRUNO GUSTAVO</div>
              {logo && <div style={{ background:'transparent', display:'inline-block' }}><img src={logo} alt="" style={{ height:80, maxWidth:240, objectFit:'contain' , display:'block' }} /></div>}
            </div>
          </div>
        </DragWrap>
      </div>
    )
  }

  // ── CAPA — Minimal Layout ─────────────────────────────────────────────────
  if (slide.tipo === 'capa' && estrutura === 'minimal') {
    return (
      <div style={{ width:w, height:h, position:'relative', overflow:'hidden', fontFamily: T.sans, transform:`scale(${scale})`, transformOrigin:'top left', flexShrink:0, background:P.bg }}>
        {/* Geometric accent */}
        <div style={{ position:'absolute', top:0, right:0, width:'40%', height:'40%', background:`linear-gradient(135deg,${P.d2}18,transparent)`, borderBottom:`1px solid ${P.d2}22` }} />
        <div style={{ position:'absolute', bottom:0, left:0, width:'40%', height:'30%', background:`linear-gradient(315deg,${P.d2}12,transparent)` }} />
        {/* Horizontal lines */}
        <div style={{ position:'absolute', top:'28%', left:80, right:80, height:1, background:`linear-gradient(to right,${P.d2},${P.d1}44,transparent)` }} />
        <div style={{ position:'absolute', top:'72%', left:80, right:80, height:1, background:`linear-gradient(to right,transparent,${P.d1}44,${P.d2})` }} />
        {/* Tag */}
        <DragWrap dragKey="tag" {...{offsets, onDrag, scale, enabled:dragMode}} style={{ position:'absolute', top:80, left:80, zIndex:5 }}>
          <div style={{ color:P.d2, fontSize:18, fontWeight:700, letterSpacing:6, textTransform:'uppercase' as const }}>● {slide.subtitulo||'INFORMAÇÃO'}</div>
        </DragWrap>
        {/* Center — headline */}
        <DragWrap dragKey="content" {...{offsets, onDrag, scale, enabled:dragMode}} style={{ position:'absolute', left:80, right:80, top:'30%', zIndex:5 }}>
          <Headline text={slide.headline||'Título do *Post*'} fs={106} lh={1.0} cn={5} pal={P} sans={T.sans} serif={T.serif} />
          {slide.corpo && <div style={{ marginTop:48, color:P.wMid, fontSize:38, fontStyle:'italic', lineHeight:1.5, fontFamily: T.serif, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>"{slide.corpo}"</div>}
        </DragWrap>
        {/* Footer */}
        <DragWrap dragKey="footer" {...{offsets, onDrag, scale, enabled:dragMode}} style={{ position:'absolute', bottom:60, left:80, right:80, zIndex:5 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ color:P.d2, fontSize:22, fontWeight:900, letterSpacing:1 }}>DR. BRUNO GUSTAVO</div>
              <div style={{ color:P.wFaint, fontSize:16, letterSpacing:3, marginTop:4 }}>MEDICINA BASEADA EM EVIDÊNCIA</div>
            </div>
            {logo && <div style={{ background:'transparent', display:'inline-block' }}><img src={logo} alt="" style={{ height:90, maxWidth:260, objectFit:'contain' , display:'block' }} /></div>}
          </div>
        </DragWrap>
      </div>
    )
  }

  // ── CAPA — Clássico (estrutura padrão) ────────────────────────────────────
  // ── CAPA ──────────────────────────────────────────────────────────────────
  if (slide.tipo === 'capa') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: P.bg }} />
        {foto && (<>
          <img src={foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.75 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(18,10,4,0.15) 0%, rgba(18,10,4,0.35) 55%, ${P.bg} 88%)` }} />
        </>)}

        {/* Tag */}
        <DragWrap dragKey="tag" {...dp} style={{ position: 'absolute', top: 90, left: 72, zIndex: 5 }}>
          <div style={{ display: 'inline-block', padding: '10px 22px', border: `1px solid rgba(184,151,106,0.55)`, background: 'rgba(0,0,0,0.5)', color: P.w, fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const }}>
            {slide.subtitulo || 'INFORMAÇÃO'}
          </div>
        </DragWrap>
        <Counter />

        {/* Conteúdo principal */}
        <DragWrap dragKey="content" {...dp} style={{ position: 'absolute', left: 90, right: 90, top: foto ? 240 : 200, zIndex: 5 }}>
          <div style={{ color: P.d1, fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const, marginBottom: 28 }}>A GRANDE QUESTÃO</div>
          <Headline text={slide.headline || 'Título do *Post*'} fs={92} lh={1.04} cn={5}  pal={P} sans={T.sans} serif={T.serif} />
          {slide.corpo && (
            <div style={{ display: 'flex', gap: 24, marginTop: 52, alignItems: 'flex-start' }}>
              <div style={{ width: 4, flexShrink: 0, background: `linear-gradient(to bottom, ${P.d2}, transparent)`, minHeight: 88 }} />
              <div style={{ color: P.wMid, fontSize: 36, fontStyle: 'italic', lineHeight: 1.5, fontFamily: T.serif, ...clamp(3) }}>
                "{slide.corpo}"
              </div>
            </div>
          )}
        </DragWrap>

        {/* Rodapé */}
        <DragWrap dragKey="footer" {...dp} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 }}>
          <div style={{ padding: '40px 72px', background: `linear-gradient(to top, ${P.bg} 60%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: logo ? 'flex-end' : 'center' }}>
            {logo && <div style={{ background:'transparent' }}><img src={logo} alt="" style={{ height: 110, maxWidth: 320, objectFit: 'contain', display: 'block' }} /></div>}
          </div>
        </DragWrap>
      </div>
    )
  }

  // ── CTA ───────────────────────────────────────────────────────────────────
  if (slide.tipo === 'cta') {
    const actions = slide.corpo.split('|').filter(Boolean)
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: P.bg }} />
        {foto && (<>
          <img src={foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.88 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(18,10,4,0.25) 0%, ${P.bg} 65%)` }} />
        </>)}

        <DragWrap dragKey="content" {...dp} style={{ position: 'absolute', left: 90, right: 90, top: 140, zIndex: 5 }}>
          <div style={{ color: P.d1, fontSize: 24, fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase' as const, marginBottom: 36, textAlign: 'center' }}>
            {slide.subtitulo}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <Headline text={slide.headline} fs={96} lh={1.05} cn={2}  pal={P} sans={T.sans} serif={T.serif} />
          </div>
          <div style={{ width: 100, height: 3, background: P.d2, margin: '36px auto' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {actions.map((action, i) => {
              const [emoji, ...rest] = action.split(' ')
              const restText = rest.join(' ')
              const parts = restText.split(':')
              return (
                <div key={i} style={{ padding: '22px 30px', background: 'rgba(0,0,0,0.45)', border: `1px solid rgba(184,151,106,0.18)`, display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span style={{ fontSize: 36, flexShrink: 0 }}>{emoji}</span>
                  <span style={{ color: P.w, fontSize: 34, lineHeight: 1.4, flex: 1 }}>
                    {parts[0]}{parts.length > 1 && <><span>: </span><strong style={{ color: P.d2 }}>{parts.slice(1).join(':')}</strong></>}
                  </span>
                </div>
              )
            })}
          </div>
        </DragWrap>

        <DragWrap dragKey="footer" {...dp} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 }}>
          <div style={{ padding: '44px 90px', textAlign: 'center', background: `linear-gradient(to top, ${P.bg} 65%, transparent)` }}>
            <div style={{ color: P.d2, fontSize: 42, fontWeight: 900, letterSpacing: 1, marginBottom: 10 }}>{HANDLE}</div>
            <div style={{ color: P.wFaint, fontSize: 22, letterSpacing: 3 }}>{ASSIN}</div>
            {logo && <div style={{ marginTop: 18, display: 'inline-block', background: 'transparent' }}><img src={logo} alt="" style={{ height: 110, maxWidth: 320, objectFit: 'contain', display: 'block' }} /></div>}
          </div>
        </DragWrap>
      </div>
    )
  }

  // ── LAYOUT 1 — Citação ────────────────────────────────────────────────────
  if (li === 1) {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: P.bg }} />
        {foto ? (<>
          <img src={foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.75 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(18,10,4,0.5) 0%, rgba(18,10,4,0.15) 35%, ${P.bg} 82%)` }} />
        </>) : (
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 65% 25%, ${P.bgMid} 0%, ${P.bg} 68%)` }} />
        )}

        <DragWrap dragKey="tag" {...dp} style={{ position: 'absolute', top: 90, left: 90, zIndex: 5 }}>
          <div style={{ color: P.d1, fontSize: 22, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const }}>{slide.subtitulo}</div>
        </DragWrap>
        {!logo && {!logo && totalSlides <= 1 && <div style={{ position: 'absolute', top: 90, right: 90, color: P.d2, fontSize: 21, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>}
        <Counter />

        {/* Aspas decorativas */}
        <div style={{ position: 'absolute', left: 56, top: '24%', color: P.d1, fontSize: 220, lineHeight: 1, opacity: 0.3, fontFamily: T.serif, userSelect: 'none' }}>"</div>

        {/* Citação */}
        <DragWrap dragKey="content" {...dp} style={{ position: 'absolute', left: 90, right: 90, top: '33%', bottom: 160, zIndex: 5 }}>
          <div style={{ color: P.w, fontSize: 62, fontStyle: 'italic', lineHeight: 1.38, fontFamily: T.serif, fontWeight: 400, ...clamp(7) }}>
            {slide.corpo.split(/\*(.*?)\*/).map((part, i) =>
              i % 2 === 1
                ? <strong key={i} style={{ color: P.d2, fontWeight: 700 }}>{part}</strong>
                : part
            )}
          </div>
        </DragWrap>

        <DragWrap dragKey="footer" {...dp} style={{ position: 'absolute', bottom: 64, right: 90, zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 56, height: 1, background: P.d1 }} />
            {!logo && <div style={{ color: P.d1, fontSize: 21, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>}
            {logo && <div style={{ background:'transparent' }}><img src={logo} alt="" style={{ height: 110, maxWidth: 320, objectFit: 'contain', display: 'block' }} /></div>}
          </div>
        </DragWrap>
      </div>
    )
  }

  // ── LAYOUT 2 — Boxes 2×2 ─────────────────────────────────────────────────
  if (li === 2) {
    const items = slide.items ?? []
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: P.bg }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, background: `linear-gradient(to bottom, ${P.bgMid} 0%, transparent 100%)` }} />

        <DragWrap dragKey="tag" {...dp} style={{ position: 'absolute', top: 90, left: 90, zIndex: 5 }}>
          <div style={{ color: P.wFaint, fontSize: 21, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' as const }}>{slide.subtitulo}</div>
        </DragWrap>
        {!logo && {!logo && totalSlides <= 1 && <div style={{ position: 'absolute', top: 90, right: 90, color: P.d2, fontSize: 21, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>}
        <Counter />

        <DragWrap dragKey="content" {...dp} style={{ position: 'absolute', left: 90, right: 90, top: 116, zIndex: 5 }}>
          <Headline text={slide.headline} fs={72} lh={1.1} cn={2}  pal={P} sans={T.sans} serif={T.serif} />
        </DragWrap>

            {/* Grid 2×2 — cada box arrastável individualmente */}
        <div style={{ position: 'absolute', left: 60, right: 60, top: 310, bottom: 110, zIndex: 5, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 20 }}>
          {(items.length > 0 ? items : [
            { titulo: 'Tópico A', descricao: 'Descrição do primeiro ponto.' },
            { titulo: 'Tópico B', descricao: 'Descrição do segundo ponto.' },
            { titulo: 'Tópico C', descricao: 'Descrição do terceiro ponto.' },
            { titulo: 'Tópico D', descricao: 'Descrição do quarto ponto.' },
          ]).slice(0, 4).map((item, i) => (
            <DragWrap key={i} dragKey={`box-${i}`} {...dp} style={{ overflow: 'hidden' }}>
              <div style={{ height: '100%', background: P.bgCard, border: `1px solid rgba(184,151,106,0.2)`, borderRadius: 3, padding: '32px 32px' }}>
                <div style={{ color: P.d2, fontSize: 34, fontWeight: 800, marginBottom: 16, ...clamp(2) }}>{item.titulo}</div>
                <div style={{ color: P.wMid, fontSize: 28, lineHeight: 1.5, ...clamp(5) }}>{item.descricao}</div>
              </div>
            </DragWrap>
          ))}
        </div>

        <DragWrap dragKey="footer" {...dp} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 }}>
          <div style={{ padding: '22px 90px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: P.wFaint, fontSize: 20 }}>{HANDLE}</div>
            {logo && <div style={{ background:'transparent' }}><img src={logo} alt="" style={{ height: 110, maxWidth: 320, objectFit: 'contain', display: 'block' }} /></div>}
          </div>
        </DragWrap>
      </div>
    )
  }

  // ── LAYOUT 3 — Dados Científicos ──────────────────────────────────────────
  if (li === 3) {
    const stats = slide.stats ?? []
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: P.bg }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, background: `linear-gradient(135deg, ${P.bgMid} 0%, ${P.bg} 100%)` }} />

        <DragWrap dragKey="tag" {...dp} style={{ position: 'absolute', top: 90, left: 72, zIndex: 5 }}>
          <div>
            {slide.fonte && <SourceBadge fonte={slide.fonte} pal={P} />}
            <div style={{ color: P.wFaint, fontSize: 20, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' as const, marginTop: 14 }}>{slide.subtitulo}</div>
          </div>
        </DragWrap>
        <Counter />

        <DragWrap dragKey="content" {...dp} style={{ position: 'absolute', left: 90, right: 90, top: 180, zIndex: 5 }}>
          <Headline text={slide.headline} fs={78} lh={1.08} cn={2}  pal={P} sans={T.sans} serif={T.serif} />
          <div style={{ width: 56, height: 3, background: P.d2, marginTop: 26 }} />
        </DragWrap>

        {/* Corpo + stats */}
        <DragWrap dragKey="body" {...dp} style={{ position: 'absolute', left: 60, right: 60, top: 390, bottom: 120, zIndex: 5 }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', gap: 0 }}>
            <div style={{ flex: 1, paddingRight: 36, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {slide.corpo && (
                <div style={{ color: P.wMid, fontSize: 34, lineHeight: 1.6, ...clamp(5) }}>{slide.corpo}</div>
              )}
              {slide.fonte && (
                <div style={{ color: P.wFaint, fontSize: 18, textTransform: 'uppercase' as const, letterSpacing: 2, marginTop: 'auto' }}>{slide.fonte}</div>
              )}
            </div>
            <div style={{ width: 2, background: `linear-gradient(to bottom, ${P.d2}, transparent)`, flexShrink: 0, marginRight: 36, alignSelf: 'stretch' }} />
            <div style={{ width: 330, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ color: P.d1, fontSize: 17, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const, marginBottom: 4 }}>DADOS DO ESTUDO</div>
              {stats.map((stat, i) => (
                <div key={i} style={{ background: P.bgCard, border: `1px solid rgba(184,151,106,0.18)`, borderRadius: 3, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <div style={{ color: P.d2, fontSize: 56, fontWeight: 900, lineHeight: 1 }}>{stat.valor}</div>
                    {stat.unidade && <div style={{ color: P.d1, fontSize: 26, fontWeight: 700 }}>{stat.unidade}</div>}
                  </div>
                  <div style={{ color: P.wMid, fontSize: 24, lineHeight: 1.4, ...clamp(3) }}>{stat.descricao}</div>
                </div>
              ))}
              <div style={{ background: 'rgba(200,168,76,0.08)', border: `1px solid rgba(200,168,76,0.35)`, borderRadius: 3, padding: '16px 22px' }}>
                <div style={{ color: P.wFaint, fontSize: 15, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 6 }}>SIGNIFICÂNCIA</div>
                <div style={{ color: P.d2, fontSize: 34, fontWeight: 900 }}>p &lt; 0,001</div>
              </div>
            </div>
          </div>
        </DragWrap>

        <DragWrap dragKey="footer" {...dp} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 }}>
          <div style={{ padding: '20px 90px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid rgba(184,151,106,0.1)` }}>
            <div style={{ color: P.wFaint, fontSize: 17, textTransform: 'uppercase' as const, letterSpacing: 2 }}>{slide.fonte ?? ''}</div>
            {logo && <div style={{ background:'transparent' }}><img src={logo} alt="" style={{ height: 110, maxWidth: 320, objectFit: 'contain', display: 'block' }} /></div>}
          </div>
        </DragWrap>
      </div>
    )
  }

  // ── LAYOUT 4 — Editorial ──────────────────────────────────────────────────
  return (
    <div style={base}>
      <div style={{ position: 'absolute', inset: 0, background: P.bg }} />
      {foto && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: '46%', height: '46%', overflow: 'hidden' }}>
          <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to left, transparent 0%, ${P.bg} 78%)` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: `linear-gradient(to top, ${P.bg}, transparent)` }} />
        </div>
      )}

      {/* Tarja dourada topo */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(to right, ${P.d2} 0%, ${P.d1} 40%, transparent 72%)` }} />

      <DragWrap dragKey="tag" {...dp} style={{ position: 'absolute', top: 90, left: 90, zIndex: 5 }}>
        <div style={{ color: P.wFaint, fontSize: 22, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const }}>{slide.subtitulo}</div>
      </DragWrap>
      {!logo && {!logo && totalSlides <= 1 && <div style={{ position: 'absolute', top: 90, right: 90, color: P.d2, fontSize: 21, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>}
      <Counter />

      <DragWrap dragKey="content" {...dp} style={{ position: 'absolute', left: 90, right: foto ? 400 : 72, top: 116, bottom: 150, zIndex: 5 }}>
        <Headline text={slide.headline} fs={78} lh={1.1} cn={3}  pal={P} sans={T.sans} serif={T.serif} />
        <div style={{ width: '100%', height: 2, background: `linear-gradient(to right, ${P.d2} 0%, rgba(200,168,76,0.08) 100%)`, margin: '42px 0' }} />
        <div style={{ color: P.wMid, fontSize: 40, lineHeight: 1.6, ...clamp(6) }}>{slide.corpo}</div>
        {slide.fonte && (
          <div style={{ display: 'flex', gap: 20, marginTop: 44, alignItems: 'flex-start' }}>
            <div style={{ width: 4, flexShrink: 0, background: `linear-gradient(to bottom, ${P.d2}, transparent)`, minHeight: 72 }} />
            <div style={{ color: P.d1, fontSize: 24, fontStyle: 'italic', lineHeight: 1.5, fontFamily: T.serif }}>Fonte: {slide.fonte}</div>
          </div>
        )}
      </DragWrap>

      {/* Número decorativo */}
      <div style={{ position: 'absolute', bottom: 80, right: 60, color: P.d2, fontSize: 200, fontWeight: 900, opacity: 0.05, lineHeight: 1, userSelect: 'none' }}>
        {String(slide.id - 1).padStart(2, '0')}
      </div>

      <DragWrap dragKey="footer" {...dp} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 }}>
        <div style={{ padding: '22px 90px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid rgba(184,151,106,0.12)` }}>
          {logo
            ? <div><img src={logo} alt="" style={{ height: 110, maxWidth: 320, objectFit: 'contain', display: 'block' }} /></div>
            : <div style={{ color: P.wFaint, fontSize: 20 }}>{HANDLE}</div>}
        </div>
      </DragWrap>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ImagensPage() {
  const [tipo, setTipo]           = useState<Tipo>('carrossel')
  const [formato, setFormato]     = useState<Formato>('feed-retrato')
  const [numSlides, setNumSlides] = useState(6)
  const [tema, setTema]           = useState('')
  const [publico, setPublico]     = useState('')
  const [slides, setSlides]       = useState<SlideData[]>(() => createDefaultSlides('carrossel', 6))
  const [fotos, setFotos]         = useState<string[]>([])
  const [logo, setLogo]           = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editInstruction, setEditInstruction] = useState('')
  const [isEditGenerating, setIsEditGenerating] = useState(false)
  const [fotoCapa, setFotoCapa]   = useState<number | null>(null)
  const [fotoCTA, setFotoCTA]     = useState<number | null>(null)
  const [showPautas,     setShowPautas]     = useState(false)
  const [paleta,         setPaleta]         = useState<PaletaId>('dourado')
  const [tipografia,     setTipografia]     = useState<TipografiaId>('montserrat')
  const [estrutura,      setEstrutura]      = useState<EstruturaId>('classico')
  const [isGenAI,        setIsGenAI]        = useState(false)
  const [genAIError,     setGenAIError]     = useState('')
  useEffect(() => { if (typeof window === 'undefined') return; const t = new URLSearchParams(window.location.search).get('tema'); if (t) setTema(decodeURIComponent(t)) }, [])

  // ── Drag state ──
  const [dragMode, setDragMode]       = useState(false)
  const [textOffsets, setTextOffsets] = useState<TextOffsets>({})
  const [isCapturing, setIsCapturing] = useState(false)

  // ── iOS save modal ──
  const [saveModalUrl, setSaveModalUrl] = useState<string | null>(null)

  const fotoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const PREVIEW_W = isMobile ? Math.min(window.innerWidth - 32, 380) : 400

  // Atualiza offset de um elemento num slide específico
  const updateDragOffset = useCallback((slideIdx: number, key: string, x: number, y: number) => {
    setTextOffsets(prev => ({
      ...prev,
      [slideIdx]: { ...(prev[slideIdx] ?? {}), [key]: { x, y } },
    }))
  }, [])

  const resetOffsets = () => setTextOffsets({})

  // ── Gerar imagem com IA — chamada direta do browser via Pollinations ──
  const gerarImagemIA = async () => {
    if (!tema.trim()) { alert('Defina o tema do post antes de gerar a imagem.'); return }
    setIsGenAI(true)
    setGenAIError('')
    try {
      const { w, h } = FORMATOS_CONFIG[formato]
      // Gera prompt profissional via Claude antes de chamar Pollinations
      let visualPrompt = tema
      try {
        const promptRes = await fetch('/api/roteiros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 300,
            messages: [{
              role: 'user',
              content:
                'You are a professional AI image prompt engineer specializing in medical content photography.\n' +
                'Create a single detailed image generation prompt in English for Flux/Stable Diffusion.\n\n' +
                'MEDICAL THEME: ' + tema + '\n\n' +
                'REQUIRED AESTHETIC (match exactly):\n' +
                '- Dark moody background: deep browns #120a04 and #1c0f06, almost black\n' +
                '- Warm golden bokeh lights in background, soft amber glows\n' +
                '- Cinematic dramatic side lighting, chiaroscuro effect\n' +
                '- Photorealistic professional medical photography\n' +
                '- Subject: professional doctor or medical professional, elegant attire\n' +
                '- Medical environment: laboratory, clinic or hospital softly out of focus\n' +
                '- Luxury high-end editorial aesthetic\n' +
                '- Depth of field, sharp subject, blurred background\n' +
                '- Color palette: dark browns, warm golds, soft whites, deep shadows\n' +
                '- Inspired by: dark luxury fashion photography meets medical documentary\n\n' +
                'OUTPUT: Return ONLY the image prompt text, no explanation, no quotes, max 120 words.'
            }]
          }),
        })
        const promptData = await promptRes.json()
        const generated  = promptData.content?.[0]?.text?.trim()
        if (generated && generated.length > 20) {
          visualPrompt = generated + ', no text, no watermarks, no logos, no captions'
        }
      } catch { /* usa tema direto como fallback */ }

      const prompt = encodeURIComponent(visualPrompt)
      const seed = Math.floor(Math.random() * 99999)
      const url  = 'https://image.pollinations.ai/prompt/' + prompt +
                   '?width=' + w + '&height=' + h + '&seed=' + seed + '&model=flux&nologo=true'

      const res = await fetch(url)
      if (!res.ok) throw new Error('Serviço indisponível (status ' + res.status + '). Tente novamente.')

      const blob   = await res.blob()
      const reader = new FileReader()
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload  = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      setFotos(prev => [...prev, dataUrl])
    } catch (err) {
      setGenAIError('Erro: ' + String(err))
    } finally {
      setIsGenAI(false)
    }
  }

  // ── Download / Save ──
  // Abordagem de composição manual em canvas:
  // 1. Esconde imgs + div de fundo escuro → html-to-image captura gradientes/texto com bg transparente
  // 2. Compõe canvas: fundo escuro → foto (cover) → overlay html-to-image → logo (topo)
  const downloadCurrentSlide = useCallback(async () => {
    const slide = slides[currentSlide]
    if (!slide) return
    const { w, h } = FORMATOS_CONFIG[formato]
    setIsCapturing(true)
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))

    const wrapper = document.getElementById('slide-canvas-wrapper')
    const inner   = wrapper?.firstElementChild as HTMLElement | null
    if (!inner || !wrapper) { setIsCapturing(false); return }

    const origTransform       = inner.style.transform
    const origWrapperOverflow = wrapper.style.overflow
    inner.style.transform     = 'none'
    wrapper.style.overflow    = 'visible'
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))

    // Determina qual src é a foto de fundo (vs. logo)
    const photoSrc = (slide.fotoIndex !== null && slide.fotoIndex !== undefined)
      ? (fotos[slide.fotoIndex] ?? null)
      : null

    // Captura geometria de cada <img> ANTES de escondê-las
    const innerRect = inner.getBoundingClientRect()
    const allImgs   = Array.from(inner.querySelectorAll('img')) as HTMLImageElement[]
    const snapshots = allImgs.map(img => {
      const r = img.getBoundingClientRect()
      return {
        src:            img.src,
        x:              r.left - innerRect.left,
        y:              r.top  - innerRect.top,
        dw:             r.width,
        dh:             r.height,
        fit:            img.style.objectFit || 'cover',
        pos:            img.style.objectPosition || 'center top',
        alpha:          parseFloat(img.style.opacity || '1'),
        isPhoto:        !!photoSrc && img.src === photoSrc,
      }
    })

    // Esconde imgs + primeiro filho (div fundo escuro) para captura transparente
    const darkBg = inner.firstElementChild as HTMLElement | null
    allImgs.forEach(img => { img.style.visibility = 'hidden' })
    if (darkBg) darkBg.style.visibility = 'hidden'

    const restore = () => {
      inner.style.transform    = origTransform
      wrapper.style.overflow   = origWrapperOverflow
      allImgs.forEach(img => { img.style.visibility = '' })
      if (darkBg) darkBg.style.visibility = ''
    }

    try {
      const { toCanvas } = await import('html-to-image')
      // overlayCanvas: gradientes + texto + boxes — fundo transparente onde havia imgs/darkBg
      const overlayCanvas = await toCanvas(inner, { width: w, height: h, pixelRatio: 1 })

      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!

      const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src
      })

      const blit = async (snap: typeof snapshots[number]) => {
        if (!snap.src || snap.dw <= 0 || snap.dh <= 0) return
        try {
          const img = await loadImg(snap.src)
          ctx.save(); ctx.globalAlpha = snap.alpha
          if (snap.fit === 'cover') {
            const sc = Math.max(snap.dw / img.width, snap.dh / img.height)
            const sw = img.width * sc, sh = img.height * sc
            const dx = snap.x + (snap.dw - sw) / 2
            const dy = snap.pos.includes('top') ? snap.y : snap.y + (snap.dh - sh) / 2
            ctx.beginPath(); ctx.rect(snap.x, snap.y, snap.dw, snap.dh); ctx.clip()
            ctx.drawImage(img, dx, dy, sw, sh)
          } else {
            const sc = Math.min(snap.dw / img.width, snap.dh / img.height)
            const sw = img.width * sc, sh = img.height * sc
            ctx.drawImage(img, snap.x + (snap.dw - sw) / 2, snap.y + (snap.dh - sh) / 2, sw, sh)
          }
          ctx.restore()
        } catch { ctx.restore() }
      }

      // Camada 1: fundo escuro sólido
      ctx.fillStyle = '#120a04'; ctx.fillRect(0, 0, w, h)

      // Camada 2: foto de fundo (abaixo do gradiente overlay)
      for (const s of snapshots.filter(s => s.isPhoto)) await blit(s)

      // Camada 3: gradientes + texto capturados (bg transparente)
      ctx.drawImage(overlayCanvas, 0, 0)

      // Camada 4: logo (acima de tudo, incluindo gradiente do rodapé)
      for (const s of snapshots.filter(s => !s.isPhoto)) await blit(s)

      restore()
      setIsCapturing(false)

      const dataUrl = canvas.toDataURL('image/png')
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        setSaveModalUrl(dataUrl)
      } else {
        const link = document.createElement('a')
        link.download = 'drbrunogustavo-slide-' + (currentSlide + 1) + '.png'
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      restore()
      setIsCapturing(false)
      alert('Erro: ' + String(err))
    }
  }, [currentSlide, slides, formato, fotos])

  const { w, h } = FORMATOS_CONFIG[formato]
  const scale   = PREVIEW_W / w
  const previewH = h * scale

  const syncFotos = (s: SlideData[], cap: number | null, cta: number | null) =>
    s.map(sl => ({ ...sl, fotoIndex: sl.tipo === 'capa' ? cap : sl.tipo === 'cta' ? cta : sl.fotoIndex }))

  const handleTipoChange = (t: Tipo) => {
    setTipo(t)
    const n = t === 'unica' ? 1 : numSlides
    setSlides(syncFotos(createDefaultSlides(t, n), fotoCapa, fotoCTA))
    setCurrentSlide(0)
  }
  const handleNumSlidesChange = (n: number) => {
    setNumSlides(n)
    setSlides(syncFotos(createDefaultSlides('carrossel', n), fotoCapa, fotoCTA))
    setCurrentSlide(prev => Math.min(prev, n - 1))
  }

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const r = new FileReader()
      r.onload = ev => setFotos(prev => [...prev, ev.target?.result as string])
      r.readAsDataURL(file)
    })
    e.target.value = ''
  }
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = ev => setLogo(ev.target?.result as string)
    r.readAsDataURL(file)
    e.target.value = ''
  }

  const handleFotoCapaChange  = (i: number | null) => { setFotoCapa(i); setSlides(prev => prev.map(s => s.tipo === 'capa' ? { ...s, fotoIndex: i } : s)) }
  const handleFotoCTAChange   = (i: number | null) => { setFotoCTA(i);  setSlides(prev => prev.map(s => s.tipo === 'cta'  ? { ...s, fotoIndex: i } : s)) }
  const handleFotoSlideChange = (si: number, fi: number | null) => setSlides(prev => prev.map((s, idx) => idx === si ? { ...s, fotoIndex: fi } : s))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSlide = (idx: number, field: keyof SlideData, value: any) =>
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))

  const layoutOf    = (id: number) => ((id - 2) % 4) + 1
  const layoutNames = ['', 'Citação', 'Boxes 2×2', 'Dados Científicos', 'Editorial']

  // ── Geração com IA ──
  const generateWithAI = async () => {
    if (!tema.trim()) return
    setIsGenerating(true)
    try {
      const contentSlides = slides.filter(s => s.tipo === 'conteudo').map(s => ({ id: s.id, layout: layoutOf(s.id) }))

      const slideInstructions = contentSlides.map(({ id, layout }) => {
        const num = String(id - 1).padStart(2, '0')
        const lbl = layout===1?'A CIÊNCIA':layout===2?'OS FATOS':layout===3?'A EVIDÊNCIA':'ENTENDA'
        const detail = layout===1
          ? ', headline vazio, corpo frase impacto max 120 chars com *destaque*'
          : layout===2
          ? ', headline com *dourado*, items:[{titulo,descricao}] 4 itens do tema'
          : layout===3
          ? ', headline com *dourado*, fonte:"journal real", stats:[{valor,unidade,descricao}] 3 dados'
          : ', headline com *dourado*, corpo explicação max 180 chars'
        return id + '. conteudo — subtitulo "' + num + ' — ' + lbl + '"' + detail
      }).join('\n')
      const ctaCorpo = '📌 Salve para ter esta informação sempre à mão|📤 Compartilhe com quem precisa ler isso agora|💬 Comente: ' + (publico ? 'pergunta para ' + publico : 'o que mais te surpreendeu?')
      const prompt = 'Redator médico Instagram — Dr. Bruno Gustavo, Clínico-Geral, Endocrinologia/Nutrologia, Poços de Caldas-MG.\n'
        + 'TEMA: ' + tema + (publico ? '. PÚBLICO: ' + publico : '') + '\n'
        + 'Tom: direto, humano. Proibido: mergulhar/transformador/jornada/empoderar. Use *palavra* para dourado itálico.\n\n'
        + 'Retorne SOMENTE JSON válido: {"slides":[...]}\n\n'
        + 'Slides necessários:\n'
        + '1. capa — headline impactante com *itálico dourado*, subtitulo "INFORMAÇÃO", corpo citação curta max 90 chars\n'
        + slideInstructions + '\n'
        + slides.length + '. cta — headline "SALVE *ESTE POST*", subtitulo "GOSTOU DESTE CONTEÚDO?", corpo "' + ctaCorpo + '"\n\n'
        + 'Campos obrigatórios: id, tipo, headline, subtitulo, corpo, fonte (null se vazio), items (null se vazio), stats (null se vazio)'

      const res = await fetch('/api/imagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 3500, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const _raw = (data.content?.[0]?.text || '{}').replace(/```json/g,'').replace(/```/g,'').trim()
      const json = JSON.parse(_raw)
      if (!json.slides || !Array.isArray(json.slides)) {
        throw new Error('API retornou: ' + JSON.stringify(data).slice(0, 300))
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newSlides: SlideData[] = json.slides.map((s: any) => ({
        ...s,
        fotoIndex: s.tipo === 'capa' ? fotoCapa : s.tipo === 'cta' ? fotoCTA : null,
        items: s.items  || undefined,
        stats: s.stats  || undefined,
        fonte: s.fonte  || undefined,
      }))
      setSlides(newSlides)
      setTextOffsets({}) // reset posições ao gerar novo conteúdo
      setCurrentSlide(0)
    } catch (err) {
      console.error(err)
      const msg = String(err)
      if (msg.includes('rate_limit')) {
        alert('Limite de requisições atingido.\nAguarde 1 minuto e tente novamente.')
      } else {
        alert('Erro ao gerar: ' + msg)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Regenerar slide individual ──
  const regenerateSlide = async (idx: number) => {
    if (!editInstruction.trim()) return
    setIsEditGenerating(true)
    try {
      const s  = slides[idx]
      const li = s.tipo === 'conteudo' ? layoutOf(s.id) : 0
      const prompt = `Reescreva este slide para o Dr. Bruno Gustavo (Clínico-Geral, Endocrinologia e Nutrologia). Tom: humano, direto, sem jargões de IA.

Slide: tipo="${s.tipo}" | headline="${s.headline}" | corpo="${s.corpo}"${s.items ? ` | items=${JSON.stringify(s.items)}` : ''}${s.stats ? ` | stats=${JSON.stringify(s.stats)}` : ''}

INSTRUÇÃO: "${editInstruction}"

Use *palavra* para dourado itálico. Retorne SOMENTE JSON com os campos: headline, subtitulo, corpo${li === 2 ? ', items (4 itens {titulo,descricao})' : ''}${li === 3 ? ', stats (3 itens {valor,unidade,descricao}), fonte' : ''}`

      const res = await fetch('/api/imagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const _raw2 = (data.content?.[0]?.text || '{}').replace(/```json/g,'').replace(/```/g,'').trim()
      const json  = JSON.parse(_raw2)
      setSlides(prev => prev.map((sl, i) => i === idx ? { ...sl, ...json } : sl))
      setEditInstruction('')
    } catch (err) {
      console.error(err); alert('Erro ao regenerar: ' + String(err))
    } finally {
      setIsEditGenerating(false)
    }
  }

  const currentS      = slides[currentSlide]
  const currentLayout = currentS?.tipo === 'conteudo' ? layoutOf(currentS.id) : 0
  const currentOffsets = textOffsets[currentSlide] ?? {}

  const panelBg  = '#0e0804'
  const sideBg   = '#1c0f06'
  const border   = '#2a1a0a'
  const labelClr = '#6a5040'
  const inputSty: React.CSSProperties = { background: sideBg, border: `1px solid ${border}`, color: C.w, borderRadius: 8, padding: '10px 14px', fontSize: 13, width: '100%', fontFamily: "'Montserrat', sans-serif", outline: 'none' }

  return (
    <div className="min-h-screen" style={{ background: panelBg, color: C.w, fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Poppins:wght@400;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,700;1,700&family=Raleway:wght@400;600;700;800;900&family=Libre+Baskerville:ital,wght@0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800;9..40,900&family=DM+Serif+Display:ital@0;1&display=swap');`}</style>

      {/* ── Overlay de Loading durante captura ── */}
      {isCapturing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9,5,3,0.92)', zIndex: 9990, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(200,168,76,0.2)', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: '#C9A84C', fontSize: 15, fontWeight: 700, letterSpacing: 2 }}>GERANDO IMAGEM...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Modal iOS — Salvar Imagem ── */}
      {saveModalUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ color: C.d2, fontSize: 15, fontWeight: 700, marginBottom: 6, textAlign: 'center', letterSpacing: 1 }}>
            📱 SALVAR IMAGEM
          </div>
          <div style={{ color: C.wMid, fontSize: 13, marginBottom: 20, textAlign: 'center', lineHeight: 1.6 }}>
            Pressione e segure a imagem abaixo<br />→ <strong style={{ color: C.w }}>Salvar na Fototeca</strong>
          </div>
          <img
            src={saveModalUrl}
            alt="Slide para salvar"
            style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}
          />
          <button
            onClick={() => setSaveModalUrl(null)}
            style={{ marginTop: 28, padding: '12px 40px', background: C.d2, color: C.bg, border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}
          >
            ✕ Fechar
          </button>
        </div>
      )}

      {/* Modal Banco de Pautas */}
      {showPautas && (
        <PautasModal
          onSelect={(titulo) => { setTema(titulo); setShowPautas(false) }}
          onClose={() => setShowPautas(false)}
        />
      )}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: C.d2, letterSpacing: 1, margin: 0 }}>Gerador de Imagens</h1>
          <p style={{ fontSize: 12, color: labelClr, margin: '4px 0 0' }}>Posts e carrosséis para o Instagram</p>
        </div>
        <button onClick={generateWithAI} disabled={isGenerating || !tema.trim()}
          style={{ background: tema.trim() ? C.d2 : '#2a1a0a', color: tema.trim() ? C.bg : labelClr, padding: '12px 24px', borderRadius: 10, border: 'none', fontWeight: 900, fontSize: 13, cursor: tema.trim() ? 'pointer' : 'not-allowed', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
          {isGenerating ? '⟳ Gerando...' : '✦ Gerar com IA'}
        </button>
      </div>

      <div style={{ display: 'flex', height: isMobile ? 'auto' : 'calc(100vh - 74px)', flexDirection: isMobile ? 'column' : 'row' }}>

        {/* ── Painel Esquerdo ── */}
        <div style={{ width: isMobile ? '100%' : 356, flexShrink: 0, borderRight: isMobile ? 'none' : `1px solid ${border}`, borderBottom: isMobile ? `1px solid ${border}` : 'none', overflowY: 'auto', maxHeight: isMobile ? '70vh' : 'none', padding: isMobile ? '16px' : 24, display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20 }}>

          {/* Tipo */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tipo</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['unica', 'carrossel'] as Tipo[]).map(t => (
                <button key={t} onClick={() => handleTipoChange(t)}
                  style={{ padding: '10px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', background: tipo === t ? C.d2 : sideBg, color: tipo === t ? C.bg : labelClr, fontFamily: "'Montserrat', sans-serif" }}>
                  {t === 'unica' ? 'Imagem Única' : 'Carrossel'}
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Formato</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.entries(FORMATOS_CONFIG) as [Formato, { label: string; desc: string }][]).map(([k, v]) => (
                <button key={k} onClick={() => setFormato(k)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer', textAlign: 'left', background: formato === k ? C.d2 : sideBg, color: formato === k ? C.bg : labelClr, fontFamily: "'Montserrat', sans-serif" }}>
                  <div>{v.label}</div><div style={{ opacity: 0.6, fontWeight: 400, fontSize: 10 }}>{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Paleta */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Paleta de Cores</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(Object.entries(PALETAS) as [PaletaId, typeof PALETAS[PaletaId]][]).map(([id, p]) => (
                <button key={id} onClick={() => setPaleta(id)}
                  style={{ padding: '9px 10px', borderRadius: 8, border: `1px solid ${paleta === id ? p.cores.d2 : border}`, cursor: 'pointer', textAlign: 'left', background: paleta === id ? `${p.cores.d2}18` : sideBg, fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    {p.preview.map((col, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: col }} />)}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: paleta === id ? p.cores.d2 : labelClr }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Estrutura */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Estrutura da Capa</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.entries(ESTRUTURAS) as [EstruturaId, typeof ESTRUTURAS[EstruturaId]][]).map(([id, e]) => (
                <button key={id} onClick={() => setEstrutura(id)}
                  style={{ padding: '9px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', background: estrutura === id ? C.d2 : sideBg, color: estrutura === id ? C.bg : labelClr, fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{e.emoji}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{e.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{e.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tipografia */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tipografia</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {(Object.entries(TIPOGRAFIAS) as [TipografiaId, typeof TIPOGRAFIAS[TipografiaId]][]).map(([id, t]) => (
                <button key={id} onClick={() => setTipografia(id)}
                  style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${tipografia === id ? C.d2 : border}`, cursor: 'pointer', textAlign: 'left', background: tipografia === id ? `rgba(200,168,76,0.1)` : sideBg, fontFamily: "'Montserrat', sans-serif" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: tipografia === id ? C.d2 : labelClr }}>{t.label}</div>
                  <div style={{ fontSize: 9, color: tipografia === id ? C.d1 : '#3a2a1a', marginTop: 2, letterSpacing: 1 }}>Aa Bb Cc</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nº slides */}
          {tipo === 'carrossel' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Slides: <span style={{ color: C.d2 }}>{numSlides}</span>
              </label>
              <input type="range" min={3} max={15} value={numSlides} onChange={e => handleNumSlidesChange(Number(e.target.value))} style={{ width: '100%', accentColor: C.d2 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: labelClr, marginTop: 4 }}><span>3</span><span>15</span></div>
            </div>
          )}

          {/* Tema */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase' }}>Tema</label>
              <button onClick={() => setShowPautas(true)}
                style={{ fontSize: 10, fontWeight: 700, color: C.d2, background: 'rgba(200,168,76,0.08)', border: '1px solid rgba(200,168,76,0.25)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", letterSpacing: 1 }}>
                📋 Banco de Pautas
              </button>
            </div>
            <input type="text" value={tema} onChange={e => setTema(e.target.value)} placeholder="Ex: Resistência à insulina" style={inputSty} />
          </div>

          {/* Público */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Público <span style={{ textTransform: 'none', fontWeight: 400 }}>(opcional)</span></label>
            <input type="text" value={publico} onChange={e => setPublico(e.target.value)} placeholder="Ex: Mulheres acima de 35 anos" style={inputSty} />
          </div>

          {/* Logo */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Logomarca</label>
            {logo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: sideBg, borderRadius: 8, border: `1px solid rgba(200,168,76,0.3)` }}>
                <div style={{ width: 44, height: 44, background: 'rgba(0,0,0,0.6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={logo} alt="" style={{ maxWidth: 40, maxHeight: 40, objectFit: 'contain' }} />
                </div>
                <span style={{ color: C.d2, fontSize: 12, flex: 1 }}>Logo carregado ✓</span>
                <button onClick={() => setLogo(null)} style={{ background: 'none', border: 'none', color: labelClr, cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            ) : (
              <button onClick={() => logoRef.current?.click()}
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: `1px dashed ${border}`, background: 'none', color: labelClr, fontSize: 12, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                + Upload Logo (PNG transparente)
              </button>
            )}
            <input ref={logoRef} type="file" accept="image/png" style={{ display: 'none' }} onChange={handleLogoUpload} />
          </div>

          {/* Fotos */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Fotos</label>
            <button onClick={() => fotoRef.current?.click()}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: `1px dashed ${border}`, background: 'none', color: labelClr, fontSize: 12, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
              + Upload de Fotos (múltiplas)
            </button>
            <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFotoUpload} />

            {/* Gerar imagem por I.A */}
            <button
              onClick={gerarImagemIA}
              disabled={isGenAI || !tema.trim()}
              style={{ width:'100%', marginTop:8, padding:'12px', borderRadius:8, border:`1px solid ${isGenAI || !tema.trim() ? '#2a1a0a' : 'rgba(200,168,76,0.4)'}`, background: isGenAI || !tema.trim() ? 'none' : 'rgba(200,168,76,0.06)', color: isGenAI || !tema.trim() ? labelClr : C.d2, fontSize:12, fontWeight:700, cursor: isGenAI || !tema.trim() ? 'not-allowed' : 'pointer', fontFamily:"'Montserrat',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {isGenAI ? (
                <>
                  <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(200,168,76,0.3)', borderTop:`2px solid ${C.d2}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                  Gerando imagem...
                </>
              ) : (
                <>✨ Gerar Imagem por I.A</>
              )}
            </button>
            {genAIError && <div style={{ fontSize:11, color:'#f87171', marginTop:6, lineHeight:1.5 }}>{genAIError}</div>}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {fotos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {fotos.map((f, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden' }}>
                      <img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setFotos(prev => prev.filter((_, fi) => fi !== i))}
                        style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: C.d2, fontSize: 9, fontWeight: 700, padding: '2px 5px', borderTopLeftRadius: 4 }}>F{i + 1}</div>
                    </div>
                  ))}
                </div>
                <FotoSelect label="Foto da Capa" value={fotoCapa} fotos={fotos} onChange={handleFotoCapaChange} />
                {tipo === 'carrossel' && <FotoSelect label="Foto do CTA" value={fotoCTA} fotos={fotos} onChange={handleFotoCTAChange} />}
              </div>
            )}
          </div>

          {/* Lista de slides */}
          {tipo === 'carrossel' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Slides</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {slides.map((s, i) => {
                  const li = s.tipo === 'conteudo' ? layoutOf(s.id) : 0
                  const icon = s.tipo === 'capa' ? '📌' : s.tipo === 'cta' ? '🎯' : li === 1 ? '💬' : li === 2 ? '⊞' : li === 3 ? '📊' : '📝'
                  return (
                    <button key={s.id} onClick={() => setCurrentSlide(i)}
                      style={{ padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, background: currentSlide === i ? C.d2 : sideBg, color: currentSlide === i ? C.bg : labelClr, fontFamily: "'Montserrat', sans-serif", fontSize: 12 }}>
                      <span style={{ flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontWeight: 700, flexShrink: 0 }}>{s.tipo === 'capa' ? 'Capa' : s.tipo === 'cta' ? 'CTA' : layoutNames[li]}</span>
                      <span style={{ opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {(s.headline || s.corpo || '—').replace(/\*/g, '').slice(0, 28)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Centro — Preview ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: isMobile ? '20px 16px' : '32px 16px', overflowY: 'auto', background: '#090503' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
            {FORMATOS_CONFIG[formato].label} · {w}×{h}px
          </div>

          {currentS && (
            <div id='slide-canvas-wrapper' style={{ width: PREVIEW_W, height: previewH, flexShrink: 0, position: 'relative', borderRadius: 8, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.85)', outline: `1px solid ${border}` }}>
                <SlideCanvas
                  slide={currentS}
                  formato={formato}
                  fotos={fotos}
                  logo={logo}
                  totalSlides={slides.length}
                  scale={scale}
                  dragMode={dragMode && !isCapturing}
                  offsets={currentOffsets}
                  onDrag={(key, x, y) => updateDragOffset(currentSlide, key, x, y)}
                  paleta={paleta}
                  estrutura={estrutura}
                  tipografia={tipografia}
                />
              </div>

          )}

          {/* Botões de ação abaixo do preview */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Salvar */}
            <button onClick={downloadCurrentSlide}
              style={{ padding: '12px 28px', background: C.d2, border: 'none', borderRadius: 10, color: C.bg, fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
              ⬇ Salvar Slide {currentSlide + 1}
            </button>

            {/* Toggle Mover Textos */}
            <button
              onClick={() => setDragMode(d => !d)}
              style={{
                padding: '12px 20px', border: `1px solid ${dragMode ? C.d2 : border}`,
                borderRadius: 10, background: dragMode ? 'rgba(200,168,76,0.12)' : 'none',
                color: dragMode ? C.d2 : labelClr, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              ✥ {dragMode ? 'Editando posições' : 'Mover textos'}
            </button>

            {/* Reset posições */}
            {Object.keys(textOffsets).length > 0 && (
              <button onClick={resetOffsets}
                style={{ padding: '12px 16px', border: `1px solid ${border}`, borderRadius: 10, background: 'none', color: labelClr, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                ↺ Reset posições
              </button>
            )}
          </div>

          {/* Dica de drag mode */}
          {dragMode && (
            <div style={{ marginTop: 10, padding: '8px 16px', borderRadius: 8, background: 'rgba(200,168,76,0.08)', border: `1px solid rgba(200,168,76,0.2)`, fontSize: 11, color: C.d1, textAlign: 'center' }}>
              Arraste os blocos com borda dourada pontilhada · Desative antes de salvar
            </div>
          )}

          {slides.length > 1 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
                <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: sideBg, border: 'none', color: labelClr, cursor: currentSlide > 0 ? 'pointer' : 'not-allowed', opacity: currentSlide > 0 ? 1 : 0.3, fontSize: 16, fontWeight: 700 }}>←</button>
                <span style={{ fontSize: 13, color: labelClr, fontWeight: 700, minWidth: 56, textAlign: 'center' }}>{currentSlide + 1} / {slides.length}</span>
                <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: sideBg, border: 'none', color: labelClr, cursor: currentSlide < slides.length - 1 ? 'pointer' : 'not-allowed', opacity: currentSlide < slides.length - 1 ? 1 : 0.3, fontSize: 16, fontWeight: 700 }}>→</button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)}
                    style={{ borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all 0.2s', width: i === currentSlide ? 20 : 8, height: 8, background: i === currentSlide ? C.d2 : border }} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Painel Direito — Editor ── */}
        <div style={{ width: isMobile ? '100%' : 304, flexShrink: 0, borderLeft: isMobile ? 'none' : `1px solid ${border}`, borderTop: isMobile ? `1px solid ${border}` : 'none', overflowY: 'auto', padding: isMobile ? '16px' : 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase' }}>
              Editar slide {currentSlide + 1}
            </span>
            {currentS?.tipo === 'conteudo' && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: C.d2 }}>· {layoutNames[currentLayout]}</span>
            )}
          </div>

          {currentS && (
            <>
              <div style={{ fontSize: 11, padding: '8px 12px', borderRadius: 6, background: sideBg, color: labelClr }}>
                Use <strong style={{ color: C.d2 }}>*palavra*</strong> para texto dourado itálico
              </div>

              <Field label="Headline">
                <textarea value={currentS.headline} onChange={e => updateSlide(currentSlide, 'headline', e.target.value)} rows={3} style={{ ...inputSty, resize: 'none', display: 'block' }} />
              </Field>

              <Field label="Label / Categoria">
                <input type="text" value={currentS.subtitulo} onChange={e => updateSlide(currentSlide, 'subtitulo', e.target.value)} style={inputSty} />
              </Field>

              {(currentS.tipo !== 'conteudo' || currentLayout !== 2) && (
                <Field label={currentLayout === 1 ? 'Citação (use *destaque*)' : currentS.tipo === 'cta' ? 'Ações (separe com |)' : 'Corpo'}>
                  <textarea value={currentS.corpo} onChange={e => updateSlide(currentSlide, 'corpo', e.target.value)} rows={4} style={{ ...inputSty, resize: 'none', display: 'block' }} />
                </Field>
              )}

              {currentS.tipo === 'conteudo' && (currentLayout === 3 || currentLayout === 4) && (
                <Field label="Fonte Científica">
                  <input type="text" value={currentS.fonte ?? ''} onChange={e => updateSlide(currentSlide, 'fonte', e.target.value)} placeholder="Ex: New England Journal of Medicine" style={inputSty} />
                </Field>
              )}

              {currentS.tipo === 'conteudo' && currentLayout === 2 && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Boxes (4 itens)</label>
                  {[0,1,2,3].map(bi => {
                    const items = currentS.items ?? [{titulo:'',descricao:''},{titulo:'',descricao:''},{titulo:'',descricao:''},{titulo:'',descricao:''}]
                    const item  = items[bi] ?? {titulo:'',descricao:''}
                    return (
                      <div key={bi} style={{ marginBottom: 10, padding: 10, borderRadius: 6, background: sideBg, border: `1px solid ${border}` }}>
                        <input type="text" value={item.titulo} placeholder={`Título ${bi + 1}`} onChange={e => {
                          const ni = [...items]; ni[bi] = {...ni[bi], titulo: e.target.value}; updateSlide(currentSlide, 'items', ni)
                        }} style={{ ...inputSty, marginBottom: 6, color: C.d2 }} />
                        <textarea value={item.descricao} placeholder="Descrição..." rows={2} onChange={e => {
                          const ni = [...items]; ni[bi] = {...ni[bi], descricao: e.target.value}; updateSlide(currentSlide, 'items', ni)
                        }} style={{ ...inputSty, resize: 'none', display: 'block' }} />
                      </div>
                    )
                  })}
                </div>
              )}

              {currentS.tipo === 'conteudo' && currentLayout === 3 && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Stats (3 dados)</label>
                  {[0,1,2].map(si => {
                    const stats = currentS.stats ?? [{valor:'',unidade:'',descricao:''},{valor:'',unidade:'',descricao:''},{valor:'',unidade:'',descricao:''}]
                    const stat  = stats[si] ?? {valor:'',unidade:'',descricao:''}
                    return (
                      <div key={si} style={{ marginBottom: 10, padding: 10, borderRadius: 6, background: sideBg, border: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                          <input type="text" value={stat.valor} placeholder="−500" onChange={e => {
                            const ns = [...stats]; ns[si] = {...ns[si], valor: e.target.value}; updateSlide(currentSlide, 'stats', ns)
                          }} style={{ ...inputSty, flex: 1, color: C.d2 }} />
                          <input type="text" value={stat.unidade ?? ''} placeholder="kcal" onChange={e => {
                            const ns = [...stats]; ns[si] = {...ns[si], unidade: e.target.value}; updateSlide(currentSlide, 'stats', ns)
                          }} style={{ ...inputSty, width: 72, color: C.d1 }} />
                        </div>
                        <input type="text" value={stat.descricao} placeholder="Descrição..." onChange={e => {
                          const ns = [...stats]; ns[si] = {...ns[si], descricao: e.target.value}; updateSlide(currentSlide, 'stats', ns)
                        }} style={inputSty} />
                      </div>
                    )
                  })}
                </div>
              )}

              {currentS.tipo === 'conteudo' && fotos.length > 0 && (
                <FotoSelect label="Foto neste slide" value={currentS.fotoIndex} fotos={fotos} onChange={i => handleFotoSlideChange(currentSlide, i)} />
              )}

              {/* Regenerar com IA */}
              <div style={{ paddingTop: 18, borderTop: `1px solid ${border}` }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.d2, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>✦ Regenerar com IA</label>
                <textarea value={editInstruction} onChange={e => setEditInstruction(e.target.value)} rows={3} placeholder="Ex: Use dados do NEJM 2023, foque em mulheres..." style={{ ...inputSty, resize: 'none', display: 'block', marginBottom: 10 }} />
                <button onClick={() => regenerateSlide(currentSlide)} disabled={isEditGenerating || !editInstruction.trim()}
                  style={{ width: '100%', padding: '11px', borderRadius: 8, border: `1px solid rgba(200,168,76,0.35)`, background: 'none', color: C.d2, fontWeight: 700, fontSize: 13, cursor: editInstruction.trim() ? 'pointer' : 'not-allowed', opacity: editInstruction.trim() ? 1 : 0.4, fontFamily: "'Montserrat', sans-serif" }}>
                  {isEditGenerating ? '⟳ Regenerando...' : '⚡ Regenerar Slide'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#6a5040', letterSpacing: 3, textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  )
}

function FotoSelect({ label, value, fotos, onChange }: { label: string; value: number | null; fotos: string[]; onChange: (i: number | null) => void }) {
  const sideBg = '#1c0f06'
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#6a5040', letterSpacing: 3, textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>{label}</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => onChange(null)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: value === null ? '#C9A84C' : sideBg, color: value === null ? '#120a04' : '#6a5040', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>Nenhuma</button>
        {fotos.map((_, i) => (
          <button key={i} onClick={() => onChange(i)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: value === i ? '#C9A84C' : sideBg, color: value === i ? '#120a04' : '#6a5040', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>F{i+1}</button>
        ))}
      </div>
    </div>
  )
}
