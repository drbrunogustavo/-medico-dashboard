// Salvar em: app/titulos/page.tsx
'use client'
import { useState } from 'react'
import { PautasModal } from '@/components/PautasModal'

const C = {
  bg:'#120a04',bgCard:'#1c0f06',bgMid:'#261408',d1:'#b8976a',d2:'#C9A84C',
  w:'#F5F0EB',wMid:'rgba(245,240,235,0.68)',wFaint:'rgba(245,240,235,0.38)',
  panel:'#0e0804',border:'#2a1a0a',label:'#6a5040',side:'#1c0f06',
}
const inputSty = { background:C.side, border:`1px solid ${C.border}`, color:C.w, borderRadius:8, padding:'10px 14px', fontSize:13, width:'100%', fontFamily:"'Montserrat',sans-serif", outline:'none' } as React.CSSProperties

const FORMATOS = ['Reel','Carrossel','Feed','Stories']
const OBJETIVOS = [
  { v:'curiosidade', l:'Curiosidade', e:'🤔' },
  { v:'autoridade',  l:'Autoridade',  e:'🏆' },
  { v:'urgencia',    l:'Urgência',    e:'⚡' },
  { v:'pergunta',    l:'Pergunta',    e:'❓' },
  { v:'choque',      l:'Dado Chocante', e:'😱' },
]

interface Titulo { texto: string; tipo: string }

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1600) }}
      style={{ padding:'5px 12px', borderRadius:6, border:`1px solid rgba(200,168,76,0.3)`, background: ok?'rgba(200,168,76,0.12)':'none', color: ok?C.d2:C.label, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>
      {ok ? '✓ Copiado' : '⎘ Copiar'}
    </button>
  )
}

export default function TitulosPage() {
  const [tema,       setTema]       = useState('')
  const [formato,    setFormato]    = useState('Reel')
  const [objetivo,   setObjetivo]   = useState('curiosidade')
  const [titulos,    setTitulos]    = useState<Titulo[]>([])
  const [loading,    setLoading]    = useState(false)
  const [showPautas, setShowPautas] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const gerar = async () => {
    if (!tema.trim()) return
    setLoading(true)
    try {
      const obj = OBJETIVOS.find(o => o.v === objetivo)
      const prompt =
        'Crie 10 títulos/headlines para um post de ' + formato + ' do Dr. Bruno Gustavo — Clínico-Geral, Endocrinologia e Nutrologia.\n' +
        'TEMA: ' + tema + '\nOBJETIVO: ' + obj?.l + '\n' +
        'REGRAS: diretos, sem enrolação, máx 12 palavras cada, sem clichês de IA.\n' +
        'Retorne SOMENTE JSON: {"titulos":[{"texto":"...","tipo":"' + obj?.l + '"}]}'
      const res  = await fetch('/api/roteiros', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1000, messages:[{role:'user',content:prompt}] }) })
      const data = await res.json()
      const raw  = (data.content?.[0]?.text||'{}').replace(/```json/g,'').replace(/```/g,'').trim()
      const json = JSON.parse(raw)
      if (!json.titulos) throw new Error('inválido')
      setTitulos(json.titulos)
    } catch(e) { alert('Erro: '+String(e)) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:C.panel, color:C.w, fontFamily:"'Montserrat',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap'); *{box-sizing:border-box}`}</style>
      {showPautas && <PautasModal onSelect={(t)=>{setTema(t);setShowPautas(false)}} onClose={()=>setShowPautas(false)} />}

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:'18px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.d2, letterSpacing:1, margin:0 }}>Gerador de Títulos</h1>
          <p style={{ fontSize:12, color:C.label, margin:'4px 0 0' }}>Headlines para posts e Reels</p>
        </div>
        <button onClick={gerar} disabled={loading||!tema.trim()}
          style={{ background:tema.trim()?C.d2:C.border, color:tema.trim()?C.bg:C.label, padding:'12px 28px', borderRadius:10, border:'none', fontWeight:900, fontSize:13, cursor:tema.trim()?'pointer':'not-allowed', fontFamily:"'Montserrat',sans-serif" }}>
          {loading ? '⟳ Gerando...' : '✦ Gerar Títulos'}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:isMobile?'column':'row', height:isMobile?'auto':'calc(100vh - 74px)' }}>
        {/* Left */}
        <div style={{ width:isMobile?'100%':280, flexShrink:0, borderRight:isMobile?'none':`1px solid ${C.border}`, borderBottom:isMobile?`1px solid ${C.border}`:'none', overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const }}>Tema</label>
              <button onClick={()=>setShowPautas(true)} style={{ fontSize:10, fontWeight:700, color:C.d2, background:'rgba(200,168,76,0.08)', border:'1px solid rgba(200,168,76,0.25)', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>
                📋 Banco de Pautas
              </button>
            </div>
            <textarea value={tema} onChange={e=>setTema(e.target.value)} rows={3} placeholder="Ex: Resistência à insulina em pessoas magras" style={{ ...inputSty, resize:'none', display:'block' }} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Formato</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {FORMATOS.map(f => (
                <button key={f} onClick={()=>setFormato(f)}
                  style={{ padding:'9px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background:formato===f?C.d2:C.side, color:formato===f?C.bg:C.label, fontFamily:"'Montserrat',sans-serif" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Objetivo</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {OBJETIVOS.map(o => (
                <button key={o.v} onClick={()=>setObjetivo(o.v)}
                  style={{ padding:'10px 14px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10, background:objetivo===o.v?C.d2:C.side, color:objetivo===o.v?C.bg:C.label, fontFamily:"'Montserrat',sans-serif", fontWeight:700, fontSize:12 }}>
                  <span>{o.e}</span><span>{o.l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center */}
        <div style={{ flex:1, overflowY:'auto', padding:isMobile?16:32, background:'#090503' }}>
          {!titulos.length && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:12, opacity:.5 }}>
              <div style={{ fontSize:48 }}>✍️</div>
              <div style={{ color:C.label, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' as const, textAlign:'center' }}>Defina o tema e clique em<br />✦ Gerar Títulos</div>
            </div>
          )}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
              <div style={{ width:44, height:44, border:'3px solid rgba(200,168,76,0.2)', borderTop:`3px solid ${C.d2}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ color:C.d2, fontSize:13, fontWeight:700, letterSpacing:2 }}>CRIANDO TÍTULOS...</div>
            </div>
          )}
          {!loading && titulos.length > 0 && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div style={{ color:C.label, fontSize:11, fontWeight:700, letterSpacing:3, textTransform:'uppercase' as const }}>{titulos.length} títulos gerados · {formato}</div>
                <button onClick={gerar} style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${C.border}`, background:'none', color:C.label, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>↺ Regerar tudo</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12 }}>
                {titulos.map((t, i) => (
                  <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                      <div style={{ color:C.wFaint, fontSize:11, fontWeight:900, minWidth:24 }}>{String(i+1).padStart(2,'0')}</div>
                      <div style={{ color:C.d2, fontSize:10, fontWeight:700, letterSpacing:2, padding:'2px 8px', borderRadius:99, background:'rgba(200,168,76,0.1)', border:'1px solid rgba(200,168,76,0.2)', whiteSpace:'nowrap' as const }}>{t.tipo}</div>
                    </div>
                    <div style={{ color:C.w, fontSize:15, fontWeight:700, lineHeight:1.5, flex:1 }}>{t.texto}</div>
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <CopyBtn text={t.texto} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
