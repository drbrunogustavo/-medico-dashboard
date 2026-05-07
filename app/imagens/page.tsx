// Salvar em: app/imagens/page.tsx
'use client'

import { useState, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Formato = 'feed-retrato' | 'quadrado' | 'stories' | 'reels-capa'
type Tipo    = 'unica' | 'carrossel'

interface BoxItem  { titulo: string; descricao: string }
interface StatItem { valor: string; unidade?: string; descricao: string }

interface SlideData {
  id: number
  tipo: 'capa' | 'conteudo' | 'cta'
  headline:  string   // use *palavra* para dourado itálico
  subtitulo: string   // label de categoria: "02 — A CIÊNCIA"
  corpo:     string
  fotoIndex: number | null
  fonte?:    string        // "New England Journal of Medicine"
  items?:    BoxItem[]     // layout Boxes 2×2 (4 itens)
  stats?:    StatItem[]    // layout Dados (3 stats)
}

// ─── Paleta — fiel aos posts do Instagram ────────────────────────────────────
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

// Headline tipografia mista: Montserrat bold branco + *Playfair Display italic dourado*
function Headline({ text, fs, lh, cn }: { text: string; fs: number; lh: number; cn: number }) {
  const parts = text.split(/\*([^*]+)\*/)
  return (
    <div style={{ fontSize: fs, lineHeight: lh, fontWeight: 900, color: C.w, fontFamily: "'Montserrat', sans-serif", ...clamp(cn) }}>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <span key={i} style={{ color: C.d2, fontStyle: 'italic', fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </div>
  )
}

// Badge de fonte científica
function SourceBadge({ fonte }: { fonte: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ width: 36, height: 36, background: C.d2, color: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 900, flexShrink: 0 }}>
        {fonte.charAt(0)}
      </div>
      <div style={{ color: C.d2, fontSize: 18, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const }}>
        {fonte}
      </div>
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
}

function SlideCanvas({ slide, formato, fotos, logo, totalSlides, scale }: CanvasProps) {
  const { w, h } = FORMATOS_CONFIG[formato]
  const foto = slide.fotoIndex !== null ? (fotos[slide.fotoIndex] ?? null) : null
  const li = ((slide.id - 2) % 4) + 1

  const base: React.CSSProperties = {
    width: w, height: h, position: 'relative', overflow: 'hidden',
    fontFamily: "'Montserrat', sans-serif",
    transform: `scale(${scale})`, transformOrigin: 'top left', flexShrink: 0,
  }

  const Counter = () => totalSlides > 1 ? (
    <div style={{ position: 'absolute', top: 52, right: 52, background: 'rgba(0,0,0,0.55)', borderRadius: 40, padding: '10px 22px', color: C.w, fontSize: 22, fontWeight: 700 }}>
      {slide.id}/{totalSlides}
    </div>
  ) : null

  const LogoFooter = ({ center = false }: { center?: boolean }) => (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '26px 72px', display: 'flex', justifyContent: center ? 'center' : 'space-between', alignItems: 'center', gap: 16 }}>
      {!center && <div style={{ color: C.d2, fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>}
      {logo && <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '8px 14px' }}><img src={logo} alt="" style={{ height: 36, maxWidth: 108, objectFit: 'contain', display: 'block' }} /></div>}
    </div>
  )

  // ── CAPA — foto como silhueta + tag INFORMAÇÃO + blockquote ──────────────
  if (slide.tipo === 'capa') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: C.bg }} />
        {foto && (<>
          <img src={foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.28 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(170deg, rgba(18,10,4,0.45) 0%, ${C.bg} 72%)` }} />
        </>)}

        {/* Tag canto superior esquerdo */}
        <div style={{ position: 'absolute', top: 56, left: 72 }}>
          <div style={{ display: 'inline-block', padding: '10px 22px', border: `1px solid rgba(184,151,106,0.55)`, background: 'rgba(0,0,0,0.5)', color: C.w, fontSize: 20, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const }}>
            {slide.subtitulo || 'INFORMAÇÃO'}
          </div>
        </div>
        <Counter />

        {/* Conteúdo */}
        <div style={{ position: 'absolute', left: 72, right: 72, top: foto ? 240 : 200 }}>
          <div style={{ color: C.d1, fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const, marginBottom: 28 }}>A GRANDE QUESTÃO</div>
          <Headline text={slide.headline || 'Título do *Post*'} fs={92} lh={1.04} cn={5} />

          {slide.corpo && (
            <div style={{ display: 'flex', gap: 24, marginTop: 52, alignItems: 'flex-start' }}>
              <div style={{ width: 4, flexShrink: 0, background: `linear-gradient(to bottom, ${C.d2}, transparent)`, minHeight: 88 }} />
              <div style={{ color: C.wMid, fontSize: 36, fontStyle: 'italic', lineHeight: 1.5, fontFamily: "'Playfair Display', serif", ...clamp(3) }}>
                "{slide.corpo}"
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '50px 72px', background: `linear-gradient(to top, ${C.bg} 60%, transparent)`, textAlign: 'center' }}>
          <div style={{ color: C.d2, fontSize: 30, fontWeight: 700, letterSpacing: 3 }}>{NOME}</div>
        </div>
      </div>
    )
  }

  // ── CTA — "Salve este post" + lista de ações ──────────────────────────────
  if (slide.tipo === 'cta') {
    const actions = slide.corpo.split('|').filter(Boolean)
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: C.bg }} />
        {foto && (<>
          <img src={foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.28 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(18,10,4,0.6) 0%, ${C.bg} 60%)` }} />
        </>)}

        <div style={{ position: 'absolute', left: 72, right: 72, top: 140 }}>
          <div style={{ color: C.d1, fontSize: 24, fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase' as const, marginBottom: 36, textAlign: 'center' }}>
            {slide.subtitulo}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <Headline text={slide.headline} fs={96} lh={1.05} cn={2} />
          </div>
          <div style={{ width: 100, height: 3, background: C.d2, margin: '36px auto' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {actions.map((action, i) => {
              const [emoji, ...rest] = action.split(' ')
              const restText = rest.join(' ')
              const parts = restText.split(':')
              return (
                <div key={i} style={{ padding: '22px 30px', background: 'rgba(0,0,0,0.45)', border: `1px solid rgba(184,151,106,0.18)`, display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span style={{ fontSize: 36, flexShrink: 0 }}>{emoji}</span>
                  <span style={{ color: C.w, fontSize: 34, lineHeight: 1.4, flex: 1 }}>
                    {parts[0]}{parts.length > 1 && <><span>: </span><strong style={{ color: C.d2 }}>{parts.slice(1).join(':')}</strong></>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '44px 72px', textAlign: 'center', background: `linear-gradient(to top, ${C.bg} 65%, transparent)` }}>
          <div style={{ color: C.d2, fontSize: 42, fontWeight: 900, letterSpacing: 1, marginBottom: 10 }}>{HANDLE}</div>
          <div style={{ color: C.wFaint, fontSize: 22, letterSpacing: 3 }}>{ASSIN}</div>
          {logo && <div style={{ marginTop: 18, display: 'inline-block', background: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: '8px 16px' }}><img src={logo} alt="" style={{ height: 36, maxWidth: 110, objectFit: 'contain', display: 'block' }} /></div>}
        </div>
      </div>
    )
  }

  // ── LAYOUT 1 — Citação sobre foto escurecida ──────────────────────────────
  // Fiel ao slide "Se fosse só dieta e treino..."
  if (li === 1) {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: C.bg }} />
        {foto ? (<>
          <img src={foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.3 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(18,10,4,0.5) 0%, rgba(18,10,4,0.15) 35%, ${C.bg} 82%)` }} />
        </>) : (
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 65% 25%, ${C.bgMid} 0%, ${C.bg} 68%)` }} />
        )}

        <div style={{ position: 'absolute', top: 56, left: 72, color: C.d1, fontSize: 22, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const }}>{slide.subtitulo}</div>
        <div style={{ position: 'absolute', top: 56, right: 72, color: C.d2, fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>
        <Counter />

        {/* Aspas decorativas */}
        <div style={{ position: 'absolute', left: 56, top: '24%', color: C.d1, fontSize: 220, lineHeight: 1, opacity: 0.3, fontFamily: "'Playfair Display', serif", userSelect: 'none' }}>"</div>

        {/* Texto da citação — Playfair Display itálico */}
        <div style={{ position: 'absolute', left: 72, right: 72, top: '33%', bottom: 160 }}>
          <div style={{ color: C.w, fontSize: 62, fontStyle: 'italic', lineHeight: 1.38, fontFamily: "'Playfair Display', serif", fontWeight: 400, ...clamp(7) }}>
            {slide.corpo.split(/\*(.*?)\*/).map((part, i) =>
              i % 2 === 1
                ? <strong key={i} style={{ color: C.d2, fontWeight: 700 }}>{part}</strong>
                : part
            )}
          </div>
        </div>

        {/* Linha + autor */}
        <div style={{ position: 'absolute', bottom: 64, right: 72, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 56, height: 1, background: C.d1 }} />
          <div style={{ color: C.d1, fontSize: 21, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>
          {logo && <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '6px 10px' }}><img src={logo} alt="" style={{ height: 30, maxWidth: 88, objectFit: 'contain', display: 'block' }} /></div>}
        </div>
      </div>
    )
  }

  // ── LAYOUT 2 — Boxes 2×2 ─────────────────────────────────────────────────
  // Fiel ao slide "Os hormônios que comandam o seu peso"
  if (li === 2) {
    const items = slide.items ?? []
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: C.bg }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320, background: `linear-gradient(to bottom, ${C.bgMid} 0%, transparent 100%)` }} />

        <div style={{ position: 'absolute', top: 56, left: 72, color: C.wFaint, fontSize: 21, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' as const }}>{slide.subtitulo}</div>
        <div style={{ position: 'absolute', top: 56, right: 72, color: C.d2, fontSize: 21, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>
        <Counter />

        <div style={{ position: 'absolute', left: 72, right: 72, top: 116 }}>
          <Headline text={slide.headline} fs={72} lh={1.1} cn={2} />
        </div>

        {/* Grid 2×2 */}
        <div style={{ position: 'absolute', left: 60, right: 60, top: 310, bottom: 110, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 20 }}>
          {(items.length > 0 ? items : [
            { titulo: 'Tópico A', descricao: 'Descrição do primeiro ponto.' },
            { titulo: 'Tópico B', descricao: 'Descrição do segundo ponto.' },
            { titulo: 'Tópico C', descricao: 'Descrição do terceiro ponto.' },
            { titulo: 'Tópico D', descricao: 'Descrição do quarto ponto.' },
          ]).slice(0, 4).map((item, i) => (
            <div key={i} style={{ background: C.bgCard, border: `1px solid rgba(184,151,106,0.2)`, borderRadius: 3, padding: '32px 32px', overflow: 'hidden' }}>
              <div style={{ color: C.d2, fontSize: 34, fontWeight: 800, marginBottom: 16, ...clamp(2) }}>{item.titulo}</div>
              <div style={{ color: C.wMid, fontSize: 28, lineHeight: 1.5, ...clamp(5) }}>{item.descricao}</div>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: C.wFaint, fontSize: 20 }}>{HANDLE}</div>
          {logo && <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '6px 10px' }}><img src={logo} alt="" style={{ height: 32, maxWidth: 96, objectFit: 'contain', display: 'block' }} /></div>}
        </div>
      </div>
    )
  }

  // ── LAYOUT 3 — Dados Científicos + Stats ─────────────────────────────────
  // Fiel ao slide "Adaptação Metabólica" com dados do NEJM
  if (li === 3) {
    const stats = slide.stats ?? []
    return (
      <div style={base}>
        <div style={{ position: 'absolute', inset: 0, background: C.bg }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, background: `linear-gradient(135deg, ${C.bgMid} 0%, ${C.bg} 100%)` }} />

        {/* Topo: fonte + label */}
        <div style={{ position: 'absolute', top: 52, left: 72 }}>
          {slide.fonte && <SourceBadge fonte={slide.fonte} />}
          <div style={{ color: C.wFaint, fontSize: 20, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' as const, marginTop: 14 }}>{slide.subtitulo}</div>
        </div>
        <Counter />

        {/* Headline + divisor */}
        <div style={{ position: 'absolute', left: 72, right: 72, top: 180 }}>
          <Headline text={slide.headline} fs={78} lh={1.08} cn={2} />
          <div style={{ width: 56, height: 3, background: C.d2, marginTop: 26 }} />
        </div>

        {/* Corpo + stats */}
        <div style={{ position: 'absolute', left: 60, right: 60, top: 390, bottom: 120, display: 'flex', gap: 0 }}>
          {/* Esquerda: texto descritivo */}
          <div style={{ flex: 1, paddingRight: 36, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {slide.corpo && (
              <div style={{ color: C.wMid, fontSize: 34, lineHeight: 1.6, ...clamp(5) }}>{slide.corpo}</div>
            )}
            {slide.fonte && (
              <div style={{ color: C.wFaint, fontSize: 18, textTransform: 'uppercase' as const, letterSpacing: 2, marginTop: 'auto' }}>
                {slide.fonte}
              </div>
            )}
          </div>

          {/* Separador vertical dourado */}
          <div style={{ width: 2, background: `linear-gradient(to bottom, ${C.d2}, transparent)`, flexShrink: 0, marginRight: 36, alignSelf: 'stretch' }} />

          {/* Direita: stat cards */}
          <div style={{ width: 330, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ color: C.d1, fontSize: 17, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const, marginBottom: 4 }}>DADOS DO ESTUDO</div>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: C.bgCard, border: `1px solid rgba(184,151,106,0.18)`, borderRadius: 3, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <div style={{ color: C.d2, fontSize: 56, fontWeight: 900, lineHeight: 1 }}>{stat.valor}</div>
                  {stat.unidade && <div style={{ color: C.d1, fontSize: 26, fontWeight: 700 }}>{stat.unidade}</div>}
                </div>
                <div style={{ color: C.wMid, fontSize: 24, lineHeight: 1.4, ...clamp(3) }}>{stat.descricao}</div>
              </div>
            ))}
            {/* Significância */}
            <div style={{ background: 'rgba(200,168,76,0.08)', border: `1px solid rgba(200,168,76,0.35)`, borderRadius: 3, padding: '16px 22px' }}>
              <div style={{ color: C.wFaint, fontSize: 15, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' as const, marginBottom: 6 }}>SIGNIFICÂNCIA</div>
              <div style={{ color: C.d2, fontSize: 34, fontWeight: 900 }}>p &lt; 0,001</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid rgba(184,151,106,0.1)` }}>
          <div style={{ color: C.wFaint, fontSize: 17, textTransform: 'uppercase' as const, letterSpacing: 2 }}>{slide.fonte ?? ''}</div>
          {logo && <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '6px 10px' }}><img src={logo} alt="" style={{ height: 30, objectFit: 'contain', display: 'block' }} /></div>}
          <div style={{ color: C.d2, fontSize: 20, fontWeight: 700 }}>{NOME}</div>
        </div>
      </div>
    )
  }

  // ── LAYOUT 4 — Editorial com blockquote ──────────────────────────────────
  return (
    <div style={base}>
      <div style={{ position: 'absolute', inset: 0, background: C.bg }} />

      {/* Foto recuada se disponível */}
      {foto && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: '46%', height: '46%', overflow: 'hidden' }}>
          <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to left, transparent 0%, ${C.bg} 78%)` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: `linear-gradient(to top, ${C.bg}, transparent)` }} />
        </div>
      )}

      {/* Tarja dourada topo */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(to right, ${C.d2} 0%, ${C.d1} 40%, transparent 72%)` }} />

      <div style={{ position: 'absolute', top: 46, left: 72, color: C.wFaint, fontSize: 22, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' as const }}>{slide.subtitulo}</div>
      <div style={{ position: 'absolute', top: 46, right: 72, color: C.d2, fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>
      <Counter />

      <div style={{ position: 'absolute', left: 72, right: foto ? 400 : 72, top: 116, bottom: 150 }}>
        <Headline text={slide.headline} fs={78} lh={1.1} cn={3} />
        <div style={{ width: '100%', height: 2, background: `linear-gradient(to right, ${C.d2} 0%, rgba(200,168,76,0.08) 100%)`, margin: '42px 0' }} />
        <div style={{ color: C.wMid, fontSize: 40, lineHeight: 1.6, ...clamp(6) }}>{slide.corpo}</div>

        {slide.fonte && (
          <div style={{ display: 'flex', gap: 20, marginTop: 44, alignItems: 'flex-start' }}>
            <div style={{ width: 4, flexShrink: 0, background: `linear-gradient(to bottom, ${C.d2}, transparent)`, minHeight: 72 }} />
            <div style={{ color: C.d1, fontSize: 24, fontStyle: 'italic', lineHeight: 1.5, fontFamily: "'Playfair Display', serif" }}>Fonte: {slide.fonte}</div>
          </div>
        )}
      </div>

      {/* Número decorativo */}
      <div style={{ position: 'absolute', bottom: 80, right: 60, color: C.d2, fontSize: 200, fontWeight: 900, opacity: 0.05, lineHeight: 1, userSelect: 'none' }}>
        {String(slide.id - 1).padStart(2, '0')}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid rgba(184,151,106,0.12)` }}>
        {logo
          ? <div style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '7px 12px' }}><img src={logo} alt="" style={{ height: 34, maxWidth: 96, objectFit: 'contain', display: 'block' }} /></div>
          : <div style={{ color: C.wFaint, fontSize: 20 }}>{HANDLE}</div>}
        <div style={{ color: C.d2, fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>{NOME}</div>
      </div>
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

  const fotoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const PREVIEW_W = 400
  const { w, h } = FORMATOS_CONFIG[formato]
  const scale = PREVIEW_W / w
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

  const handleFotoCapaChange = (i: number | null) => { setFotoCapa(i); setSlides(prev => prev.map(s => s.tipo === 'capa' ? { ...s, fotoIndex: i } : s)) }
  const handleFotoCTAChange  = (i: number | null) => { setFotoCTA(i);  setSlides(prev => prev.map(s => s.tipo === 'cta'  ? { ...s, fotoIndex: i } : s)) }
  const handleFotoSlideChange = (si: number, fi: number | null) => setSlides(prev => prev.map((s, i) => i === si ? { ...s, fotoIndex: fi } : s))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSlide = (idx: number, field: keyof SlideData, value: any) =>
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))

  const layoutOf = (id: number) => ((id - 2) % 4) + 1
  const layoutNames = ['', 'Citação', 'Boxes 2×2', 'Dados Científicos', 'Editorial']

  // ── Geração com IA ──
  const generateWithAI = async () => {
    if (!tema.trim()) return
    setIsGenerating(true)
    try {
      const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
      const contentSlides = slides.filter(s => s.tipo === 'conteudo').map(s => ({ id: s.id, layout: layoutOf(s.id) }))

      const prompt = `Você é redator de conteúdo médico para Instagram do Dr. Bruno Gustavo — Clínico-Geral, Pós-Graduado em Endocrinologia e Nutrologia. Poços de Caldas-MG.

TEMA: "${tema}"${publico ? `\nPÚBLICO: ${publico}` : ''}

REGRAS DE TOM:
- Escreva como um médico que conversa com o paciente, não como um robô
- PROIBIDO usar: "mergulhar", "transformador", "desbloqueie", "jornada", "empoderar", "revolucionar"
- Use frases curtas, diretas, humanas
- Dados reais e verificáveis quando possível

Gere ${slides.length} slides. Retorne SOMENTE JSON válido (zero markdown, zero explicação):

{
  "slides": [
    {
      "id": 1, "tipo": "capa",
      "headline": "Texto branco com *parte dourada itálica*",
      "subtitulo": "INFORMAÇÃO",
      "corpo": "Frase provocativa curta (max 90 chars). Use *negrito dourado* para destaque.",
      "fonte": null, "items": null, "stats": null
    }${contentSlides.map(({ id, layout }) => `,
    {
      "id": ${id}, "tipo": "conteudo",
      "headline": ${layout === 1 ? '""' : '"Título com *parte dourada*"'},
      "subtitulo": "${String(id - 1).padStart(2, '0')} — ${layout === 1 ? 'A CIÊNCIA' : layout === 2 ? 'OS FATOS' : layout === 3 ? 'A EVIDÊNCIA' : 'ENTENDA'}",
      "corpo": ${layout === 1 ? '"Frase de impacto em itálico. Use *negrito dourado*. Max 120 chars. Pode ser provocativa ou reveladora."' : layout === 4 ? '"Explicação direta, max 180 chars."' : '""'},
      "fonte": ${layout === 3 ? '"Nome exato do journal (ex: New England Journal of Medicine)"' : 'null'},
      "items": ${layout === 2 ? '[{"titulo":"Nome do conceito","descricao":"Max 85 chars, direto."}, ... (exatos 4 itens relacionados ao tema)]' : 'null'},
      "stats": ${layout === 3 ? '[{"valor":"número ou % ou ×","unidade":"unidade curta","descricao":"max 65 chars"}, ... (exatos 3 dados reais do tema)]' : 'null'}
    }`).join('')},
    {
      "id": ${slides.length}, "tipo": "cta",
      "headline": "SALVE *ESTE POST*",
      "subtitulo": "GOSTOU DESTE CONTEÚDO?",
      "corpo": "📌 Salve para ter esta informação sempre à mão|📤 Compartilhe com quem precisa ler isso agora|💬 Comente: ${publico ? 'pergunta relevante para ' + publico : 'o que mais te surpreendeu?'}",
      "fonte": null, "items": null, "stats": null
    }
  ]
}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 3500, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const json = JSON.parse(data.content?.[0]?.text?.trim() || '')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newSlides: SlideData[] = json.slides.map((s: any) => ({
        ...s,
        fotoIndex: s.tipo === 'capa' ? fotoCapa : s.tipo === 'cta' ? fotoCTA : null,
        items:  s.items  || undefined,
        stats:  s.stats  || undefined,
        fonte:  s.fonte  || undefined,
      }))
      setSlides(newSlides)
      setCurrentSlide(0)
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar. Verifique NEXT_PUBLIC_ANTHROPIC_API_KEY.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Regenerar slide individual ──
  const regenerateSlide = async (idx: number) => {
    if (!editInstruction.trim()) return
    setIsEditGenerating(true)
    try {
      const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
      const s = slides[idx]
      const li = s.tipo === 'conteudo' ? layoutOf(s.id) : 0
      const prompt = `Reescreva este slide para o Dr. Bruno Gustavo (Clínico-Geral, Endocrinologia e Nutrologia). Tom: humano, direto, sem jargões de IA.

Slide: tipo="${s.tipo}" | headline="${s.headline}" | corpo="${s.corpo}"${s.items ? ` | items=${JSON.stringify(s.items)}` : ''}${s.stats ? ` | stats=${JSON.stringify(s.stats)}` : ''}

INSTRUÇÃO: "${editInstruction}"

Use *palavra* para dourado itálico. Retorne SOMENTE JSON com os campos: headline, subtitulo, corpo${li === 2 ? ', items (4 itens {titulo,descricao})' : ''}${li === 3 ? ', stats (3 itens {valor,unidade,descricao}), fonte' : ''}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey || '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 700, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const json = JSON.parse(data.content?.[0]?.text?.trim() || '{}')
      setSlides(prev => prev.map((sl, i) => i === idx ? { ...sl, ...json } : sl))
      setEditInstruction('')
    } catch (err) {
      console.error(err); alert('Erro ao regenerar.')
    } finally {
      setIsEditGenerating(false)
    }
  }

  const currentS = slides[currentSlide]
  const currentLayout = currentS?.tipo === 'conteudo' ? layoutOf(currentS.id) : 0

  // ── Renderização ──
  const panelBg  = '#0e0804'
  const sideBg   = '#1c0f06'
  const border   = '#2a1a0a'
  const labelClr = '#6a5040'
  const inputSty: React.CSSProperties = { background: sideBg, border: `1px solid ${border}`, color: C.w, borderRadius: 8, padding: '10px 14px', fontSize: 13, width: '100%', fontFamily: "'Montserrat', sans-serif", outline: 'none' }

  return (
    <div className="min-h-screen" style={{ background: panelBg, color: C.w, fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');`}</style>

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

      <div style={{ display: 'flex', height: 'calc(100vh - 74px)' }}>

        {/* ── Painel Esquerdo ── */}
        <div style={{ width: 356, flexShrink: 0, borderRight: `1px solid ${border}`, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

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
            <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tema</label>
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
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: `1px dashed ${border}`, background: 'none', color: labelClr, fontSize: 12, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif', marginBottom: 12" }}>
              + Upload de Fotos (múltiplas)
            </button>
            <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFotoUpload} />

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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 16px', overflowY: 'auto', background: '#090503' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
            {FORMATOS_CONFIG[formato].label} · {w}×{h}px
          </div>

          {currentS && (
            <div style={{ width: PREVIEW_W, height: previewH, flexShrink: 0, position: 'relative', borderRadius: 8, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.85)', outline: `1px solid ${border}` }}>
              <SlideCanvas slide={currentS} formato={formato} fotos={fotos} logo={logo} totalSlides={slides.length} scale={scale} />
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
        <div style={{ width: 304, flexShrink: 0, borderLeft: `1px solid ${border}`, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
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
              {/* Dica */}
              <div style={{ fontSize: 11, padding: '8px 12px', borderRadius: 6, background: sideBg, color: labelClr }}>
                Use <strong style={{ color: C.d2 }}>*palavra*</strong> para texto dourado itálico
              </div>

              {/* Headline */}
              <Field label="Headline">
                <textarea value={currentS.headline} onChange={e => updateSlide(currentSlide, 'headline', e.target.value)} rows={3} style={{ ...inputSty, resize: 'none', display: 'block' }} />
              </Field>

              {/* Subtítulo */}
              <Field label="Label / Categoria">
                <input type="text" value={currentS.subtitulo} onChange={e => updateSlide(currentSlide, 'subtitulo', e.target.value)} style={inputSty} />
              </Field>

              {/* Corpo (não para boxes) */}
              {(currentS.tipo !== 'conteudo' || currentLayout !== 2) && (
                <Field label={currentLayout === 1 ? 'Citação (use *destaque*)' : currentS.tipo === 'cta' ? 'Ações (separe com |)' : 'Corpo'}>
                  <textarea value={currentS.corpo} onChange={e => updateSlide(currentSlide, 'corpo', e.target.value)} rows={4} style={{ ...inputSty, resize: 'none', display: 'block' }} />
                </Field>
              )}

              {/* Fonte científica */}
              {currentS.tipo === 'conteudo' && (currentLayout === 3 || currentLayout === 4) && (
                <Field label="Fonte Científica">
                  <input type="text" value={currentS.fonte ?? ''} onChange={e => updateSlide(currentSlide, 'fonte', e.target.value)} placeholder="Ex: New England Journal of Medicine" style={inputSty} />
                </Field>
              )}

              {/* Boxes editor */}
              {currentS.tipo === 'conteudo' && currentLayout === 2 && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Boxes (4 itens)</label>
                  {[0,1,2,3].map(bi => {
                    const items = currentS.items ?? [{titulo:'',descricao:''},{titulo:'',descricao:''},{titulo:'',descricao:''},{titulo:'',descricao:''}]
                    const item = items[bi] ?? {titulo:'',descricao:''}
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

              {/* Stats editor */}
              {currentS.tipo === 'conteudo' && currentLayout === 3 && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: labelClr, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Stats (3 dados)</label>
                  {[0,1,2].map(si => {
                    const stats = currentS.stats ?? [{valor:'',unidade:'',descricao:''},{valor:'',unidade:'',descricao:''},{valor:'',unidade:'',descricao:''}]
                    const stat = stats[si] ?? {valor:'',unidade:'',descricao:''}
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

              {/* Foto do slide */}
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
