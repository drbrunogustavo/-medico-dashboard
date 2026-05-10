// Salvar em: app/hashtags/page.tsx
'use client'
import { useState } from 'react'
import { PautasModal } from '@/components/PautasModal'

const C = {
  bg:'#120a04',bgCard:'#1c0f06',d1:'#b8976a',d2:'#C9A84C',
  w:'#F5F0EB',wMid:'rgba(245,240,235,0.68)',wFaint:'rgba(245,240,235,0.38)',
  panel:'#0e0804',border:'#2a1a0a',label:'#6a5040',side:'#1c0f06',
}
const inputSty = { background:C.side, border:`1px solid ${C.border}`, color:C.w, borderRadius:8, padding:'10px 14px', fontSize:13, width:'100%', fontFamily:"'Montserrat',sans-serif", outline:'none' } as React.CSSProperties

const NICHOS = ['Nutrologia','Endocrinologia','Longevidade','Metabolismo','Hormônios','Anti-aging','Emagrecimento','Diabetes','Tireoide']
const OBJETIVOS = [
  { v:'alcance',     l:'Alcance Máximo',   e:'📡', desc:'Hashtags amplas para mais pessoas' },
  { v:'nicho',       l:'Nicho Médico',     e:'🩺', desc:'Médicos e profissionais de saúde' },
  { v:'engajamento', l:'Engajamento',      e:'💬', desc:'Audiência que comenta e salva' },
  { v:'local',       l:'Local',            e:'📍', desc:'Poços de Caldas e região' },
]

interface HashtagResult {
  hashtag:  string
  motivo:   string
  tipo:     string
}

function CopyBtn({ text, label='⎘ Copiar' }: { text:string; label?:string }) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1600) }}
      style={{ padding:'8px 16px', borderRadius:8, border:`1px solid rgba(200,168,76,0.3)`, background:ok?'rgba(200,168,76,0.12)':'none', color:ok?C.d2:C.label, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>
      {ok ? '✓ Copiado!' : label}
    </button>
  )
}

export default function HashtagsPage() {
  const [tema,       setTema]       = useState('')
  const [nicho,      setNicho]      = useState('Nutrologia')
  const [objetivo,   setObjetivo]   = useState('alcance')
  const [resultado,  setResultado]  = useState<HashtagResult[]>([])
  const [loading,    setLoading]    = useState(false)
  const [showPautas, setShowPautas] = useState(false)
  const [salvos,     setSalvos]     = useState<string[][]>([])
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const gerar = async () => {
    if (!tema.trim()) return
    setLoading(true)
    try {
      const obj = OBJETIVOS.find(o => o.v === objetivo)
      const prompt =
        'Sugira EXATAMENTE 5 hashtags para o Instagram do Dr. Bruno Gustavo — ' + nicho + ', Poços de Caldas-MG.\n' +
        'TEMA DO POST: ' + tema + '\nOBJETIVO: ' + obj?.l + ' — ' + obj?.desc + '\n\n' +
        'REGRAS CRÍTICAS:\n' +
        '- Instagram em 2024-2025 penaliza posts com muitas hashtags. Use APENAS 5.\n' +
        '- Misture: 1-2 hashtags grandes (>500k posts) + 2-3 médias (50k-500k) + 1 pequena/nicho\n' +
        '- Sem hashtags genéricas demais como #saude ou #medico\n' +
        '- Foco em quem realmente segue conteúdo médico de qualidade\n\n' +
        'Retorne SOMENTE JSON: {"hashtags":[{"hashtag":"semcerquilha","motivo":"motivo em 1 frase","tipo":"nicho|alcance|engajamento|local"}]}'
      const res  = await fetch('/api/roteiros', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:800, messages:[{role:'user',content:prompt}] }) })
      const data = await res.json()
      const raw  = (data.content?.[0]?.text||'{}').replace(/```json/g,'').replace(/```/g,'').trim()
      const json = JSON.parse(raw)
      if (!json.hashtags) throw new Error('inválido')
      setResultado(json.hashtags.slice(0,5))
    } catch(e) { alert('Erro: '+String(e)) }
    setLoading(false)
  }

  const salvarSet = () => {
    if (!resultado.length) return
    setSalvos(prev => [[...resultado.map(h=>'#'+h.hashtag)], ...prev].slice(0,5))
  }

  const TIPO_COLOR: Record<string,string> = {
    nicho:'rgba(167,139,250,0.8)', alcance:'rgba(96,165,250,0.8)',
    engajamento:'rgba(52,211,153,0.8)', local:'rgba(251,146,60,0.8)',
  }

  return (
    <div className="min-h-screen bg-background text-text-primary" style={{ fontFamily:"'Montserrat',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap'); *{box-sizing:border-box} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {showPautas && <PautasModal onSelect={(t)=>{setTema(t);setShowPautas(false)}} onClose={()=>setShowPautas(false)} />}

      {/* Header */}
      <div className="border-b border-border bg-surface" style={{ padding:'18px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.d2, letterSpacing:1, margin:0 }}>Análise de Hashtags</h1>
          <p style={{ fontSize:12, color:C.label, margin:'4px 0 0' }}>5 hashtags otimizadas por post · Instagram 2025</p>
        </div>
        <button onClick={gerar} disabled={loading||!tema.trim()}
          style={{ background:tema.trim()?C.d2:C.border, color:tema.trim()?C.bg:C.label, padding:'12px 28px', borderRadius:10, border:'none', fontWeight:900, fontSize:13, cursor:tema.trim()?'pointer':'not-allowed', fontFamily:"'Montserrat',sans-serif" }}>
          {loading ? '⟳ Analisando...' : '✦ Gerar Hashtags'}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:isMobile?'column':'row', height:isMobile?'auto':'calc(100vh - 74px)' }}>
        {/* Left */}
        <div className="bg-card border-r border-border md:border-b-0 border-b" style={{ width:isMobile?'100%':280, flexShrink:0, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const }}>Tema do Post</label>
              <button onClick={()=>setShowPautas(true)} style={{ fontSize:10, fontWeight:700, color:C.d2, background:'rgba(200,168,76,0.08)', border:'1px solid rgba(200,168,76,0.25)', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>
                📋 Banco de Pautas
              </button>
            </div>
            <textarea value={tema} onChange={e=>setTema(e.target.value)} rows={3} placeholder="Ex: Tieoide e ganho de peso" style={{ ...inputSty, resize:'none', display:'block' }} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Nicho Principal</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {NICHOS.map(n => (
                <button key={n} onClick={()=>setNicho(n)}
                  style={{ padding:'6px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:nicho===n?C.d2:C.side, color:nicho===n?C.bg:C.label, fontFamily:"'Montserrat',sans-serif" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Objetivo</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {OBJETIVOS.map(o => (
                <button key={o.v} onClick={()=>setObjetivo(o.v)}
                  style={{ padding:'10px 14px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', background:objetivo===o.v?C.d2:C.side, color:objetivo===o.v?C.bg:C.label, fontFamily:"'Montserrat',sans-serif" }}>
                  <div style={{ fontWeight:700, fontSize:12 }}>{o.e} {o.l}</div>
                  <div style={{ fontSize:10, fontWeight:400, opacity:.75, marginTop:2 }}>{o.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sets salvos */}
          {salvos.length > 0 && (
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:10 }}>Sets Salvos</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {salvos.map((set, i) => (
                  <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ color:C.wFaint, fontSize:11, lineHeight:1.7 }}>{set.join(' ')}</div>
                    <div style={{ marginTop:6 }}>
                      <CopyBtn text={set.join(' ')} label="⎘ Copiar set" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center */}
        <div className="bg-background" style={{ flex:1, overflowY:'auto', padding:isMobile?16:32 }}>
          {/* Aviso Instagram */}
          <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:8, background:'rgba(200,168,76,0.06)', border:'1px solid rgba(200,168,76,0.2)', display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:18 }}>📌</span>
            <div style={{ fontSize:12, color:C.wMid, lineHeight:1.5 }}>
              <strong style={{ color:C.d2 }}>Instagram 2025:</strong> O algoritmo prioriza posts com <strong style={{ color:C.w }}>até 5 hashtags</strong> relevantes. Menos é mais.
            </div>
          </div>

          {!resultado.length && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50vh', gap:12, opacity:.5 }}>
              <div style={{ fontSize:48 }}>#️⃣</div>
              <div style={{ color:C.label, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' as const, textAlign:'center' }}>Defina o tema e<br />clique em ✦ Gerar Hashtags</div>
            </div>
          )}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50vh', gap:16 }}>
              <div style={{ width:44, height:44, border:'3px solid rgba(200,168,76,0.2)', borderTop:`3px solid ${C.d2}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <div style={{ color:C.d2, fontSize:13, fontWeight:700, letterSpacing:2 }}>ANALISANDO HASHTAGS...</div>
            </div>
          )}
          {!loading && resultado.length > 0 && (
            <>
              {/* Header resultado */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
                <div style={{ color:C.label, fontSize:11, fontWeight:700, letterSpacing:3, textTransform:'uppercase' as const }}>
                  {resultado.length} hashtags · {nicho}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={salvarSet} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid rgba(200,168,76,0.3)`, background:'none', color:C.d1, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>
                    💾 Salvar set
                  </button>
                  <CopyBtn text={resultado.map(h=>'#'+h.hashtag).join(' ')} label="⎘ Copiar todos" />
                  <button onClick={gerar} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${C.border}`, background:'none', color:C.label, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>
                    ↺ Regerar
                  </button>
                </div>
              </div>

              {/* Hashtags */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {resultado.map((h, i) => (
                  <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:'20px 24px', display:'flex', alignItems:'center', gap:20 }}>
                    <div style={{ fontSize:28, fontWeight:900, color:C.d2, minWidth:30 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' as const }}>
                        <span style={{ fontSize:20, fontWeight:900, color:C.w }}>#{h.hashtag}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, color:TIPO_COLOR[h.tipo]||C.label, background:'rgba(0,0,0,0.4)', border:`1px solid ${TIPO_COLOR[h.tipo]||C.label}` }}>
                          {h.tipo}
                        </span>
                      </div>
                      <div style={{ color:C.wMid, fontSize:13, lineHeight:1.5 }}>{h.motivo}</div>
                    </div>
                    <CopyBtn text={'#'+h.hashtag} />
                  </div>
                ))}
              </div>

              {/* Copy block */}
              <div style={{ marginTop:20, padding:'16px 20px', background:C.bgCard, border:`1px solid rgba(200,168,76,0.2)`, borderRadius:10 }}>
                <div style={{ color:C.d1, fontSize:11, fontWeight:700, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:10 }}>Bloco para colar na legenda</div>
                <div style={{ color:C.wMid, fontSize:14, letterSpacing:1, lineHeight:2 }}>
                  {resultado.map(h=>'#'+h.hashtag).join(' ')}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
