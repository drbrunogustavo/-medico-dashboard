// Salvar em: app/titulos/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { PautasModal } from '@/components/PautasModal'

const D = {
  bg:'#08090e',surface:'#0f1018',card:'#13141d',border:'#1c1d2a',
  text:'#e8eaf2',text2:'#7c85a0',muted:'#474f66',
  accent:'#00c07f',adim:'rgba(0,192,127,0.12)',aborder:'rgba(0,192,127,0.3)',atext:'#00e893',
  font:"'Inter', system-ui, sans-serif",mono:"'JetBrains Mono', monospace",
}
const inputSty = { background:D.card, border:`1px solid ${D.border}`, color:D.text, borderRadius:8, padding:'10px 14px', fontSize:13, width:'100%', fontFamily:"'Inter'", outline:'none' } as React.CSSProperties

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
      style={{ padding:'5px 12px', borderRadius:6, border:`1px solid rgba(200,168,76,0.3)`, background: ok?'rgba(200,168,76,0.12)':'none', color: ok?D.accent:D.muted, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Inter'" }}>
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
  const [isMob, setIsMob] = useState(false)
  useEffect(() => { setIsMob(window.innerWidth < 768) }, [])

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
    <div className="min-h-screen" style={{ fontFamily:D.font, color:D.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap'); *{box-sizing:border-box}`}</style>
      {showPautas && <PautasModal onSelect={(t)=>{setTema(t);setShowPautas(false)}} onClose={()=>setShowPautas(false)} />}

      {/* Header */}
      <div className="border-b border-border bg-surface" style={{ padding:'18px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:D.accent, letterSpacing:1, margin:0 }}>Gerador de Títulos</h1>
          <p style={{ fontSize:12, color:D.muted, margin:'4px 0 0' }}>Headlines para posts e Reels</p>
        </div>
        <button onClick={gerar} disabled={loading||!tema.trim()}
          style={{ background:tema.trim()?D.accent:D.border, color:tema.trim()?D.bg:D.muted, padding:'12px 28px', borderRadius:10, border:'none', fontWeight:900, fontSize:13, cursor:tema.trim()?'pointer':'not-allowed', fontFamily:"'Inter'" }}>
          {loading ? '⟳ Gerando...' : '✦ Gerar Títulos'}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:isMob?'column':'row', height:isMob?'auto':'calc(100vh - 74px)' }}>
        {/* Left */}
        <div className="bg-card border-r border-border md:border-b-0 border-b" style={{ width:isMob?'100%':280, flexShrink:0, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const }}>Tema</label>
              <button onClick={()=>setShowPautas(true)} style={{ fontSize:10, fontWeight:700, color:D.accent, background:'rgba(200,168,76,0.08)', border:'1px solid rgba(200,168,76,0.25)', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontFamily:"'Inter'" }}>
                📋 Banco de Pautas
              </button>
            </div>
            <textarea value={tema} onChange={e=>setTema(e.target.value)} rows={3} placeholder="Ex: Resistência à insulina em pessoas magras" style={{ ...inputSty, resize:'none', display:'block' }} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Formato</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {FORMATOS.map(f => (
                <button key={f} onClick={()=>setFormato(f)}
                  style={{ padding:'9px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background:formato===f?D.accent:D.card, color:formato===f?D.bg:D.muted, fontFamily:"'Inter'" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Objetivo</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {OBJETIVOS.map(o => (
                <button key={o.v} onClick={()=>setObjetivo(o.v)}
                  style={{ padding:'10px 14px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10, background:objetivo===o.v?D.accent:D.card, color:objetivo===o.v?D.bg:D.muted, fontFamily:"'Inter'", fontWeight:700, fontSize:12 }}>
                  <span>{o.e}</span><span>{o.l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="bg-background" style={{ flex:1, overflowY:'auto', padding:isMob?16:32 }}>
          {!titulos.length && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:12, opacity:.5 }}>
              <div style={{ fontSize:48 }}>✍️</div>
              <div style={{ color:D.muted, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' as const, textAlign:'center' }}>Defina o tema e clique em<br />✦ Gerar Títulos</div>
            </div>
          )}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
              <div style={{ width:44, height:44, border:'3px solid rgba(200,168,76,0.2)', borderTop:`3px solid ${D.accent}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ color:D.accent, fontSize:13, fontWeight:700, letterSpacing:2 }}>CRIANDO TÍTULOS...</div>
            </div>
          )}
          {!loading && titulos.length > 0 && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div style={{ color:D.muted, fontSize:11, fontWeight:700, letterSpacing:3, textTransform:'uppercase' as const }}>{titulos.length} títulos gerados · {formato}</div>
                <button onClick={gerar} style={{ padding:'7px 16px', borderRadius:8, border:`1px solid ${D.border}`, background:'none', color:D.muted, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Inter'" }}>↺ Regerar tudo</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr':'1fr 1fr', gap:12 }}>
                {titulos.map((t, i) => (
                  <div key={i} style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:10, padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                      <div style={{ color:D.muted, fontSize:11, fontWeight:900, minWidth:24 }}>{String(i+1).padStart(2,'0')}</div>
                      <div style={{ color:D.accent, fontSize:10, fontWeight:700, letterSpacing:2, padding:'2px 8px', borderRadius:99, background:'rgba(200,168,76,0.1)', border:'1px solid rgba(200,168,76,0.2)', whiteSpace:'nowrap' as const }}>{t.tipo}</div>
                    </div>
                    <div style={{ color:D.text, fontSize:15, fontWeight:700, lineHeight:1.5, flex:1 }}>{t.texto}</div>
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
