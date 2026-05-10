// Salvar em: app/ganchos/page.tsx
'use client'
import { useState } from 'react'
import { PautasModal } from '@/components/PautasModal'

const C = {
  bg:'#120a04',bgCard:'#1c0f06',d1:'#b8976a',d2:'#C9A84C',
  w:'#F5F0EB',wMid:'rgba(245,240,235,0.68)',wFaint:'rgba(245,240,235,0.38)',
  panel:'#0e0804',border:'#2a1a0a',label:'#6a5040',side:'#1c0f06',
}
const inputSty = { background:C.side, border:`1px solid ${C.border}`, color:C.w, borderRadius:8, padding:'10px 14px', fontSize:13, width:'100%', fontFamily:"'Montserrat',sans-serif", outline:'none' } as React.CSSProperties

const TIPOS = [
  { v:'dado',      l:'Dado Chocante',    e:'📊', cor:'rgba(96,165,250,0.85)',  ex:'95% das pessoas que fazem dieta...' },
  { v:'pergunta',  l:'Pergunta',         e:'❓', cor:'rgba(167,139,250,0.85)', ex:'Por que médicos nunca te contam isso?' },
  { v:'polemico',  l:'Afirmação Polêmica',e:'🔥', cor:'rgba(251,146,60,0.85)', ex:'Dieta não emagrece. Ponto final.' },
  { v:'segredo',   l:'Segredo Revelado', e:'🤫', cor:'rgba(52,211,153,0.85)',  ex:'O que a indústria não quer que você saiba...' },
  { v:'contra',    l:'Contra-intuitivo', e:'🔄', cor:'rgba(251,191,36,0.85)',  ex:'Comer mais pode te fazer emagrecer.' },
  { v:'autoridade',l:'Autoridade',       e:'🏆', cor:'rgba(245,101,101,0.85)', ex:'Depois de ver 10.000 pacientes, aprendi...' },
]

const FORMATOS = ['Reel','Carrossel','Feed','Stories']

interface Gancho { texto: string; tipo: string; cor: string }

function CopyBtn({ text }: { text:string }) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={()=>{ navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1600) }}
      style={{ padding:'6px 12px', borderRadius:6, border:`1px solid rgba(200,168,76,0.3)`, background:ok?'rgba(200,168,76,0.12)':'none', color:ok?C.d2:C.label, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Montserrat',sans-serif", flexShrink:0 }}>
      {ok?'✓':'⎘'}
    </button>
  )
}

// Ganchos da biblioteca estática (usados antes da IA)
const BIBLIOTECA_FIXA: Gancho[] = [
  { texto:'95% das pessoas que fazem dieta recuperam tudo em 2 anos. Isso não é falta de vontade.', tipo:'Dado Chocante', cor:'rgba(96,165,250,0.85)' },
  { texto:'O que a balança mostra não é o que importa. Te explico por quê.', tipo:'Contra-intuitivo', cor:'rgba(251,191,36,0.85)' },
  { texto:'Médico, te faço uma pergunta: você trata o sintoma ou a causa?', tipo:'Pergunta', cor:'rgba(167,139,250,0.85)' },
  { texto:'Depois de 10 anos atendendo pacientes com obesidade, aprendi uma coisa:', tipo:'Autoridade', cor:'rgba(245,101,101,0.85)' },
  { texto:'Parar de comer não emagrece. E eu posso provar com dados.', tipo:'Afirmação Polêmica', cor:'rgba(251,146,60,0.85)' },
  { texto:'Tem uma informação sobre tireoide que a maioria dos médicos ignora.', tipo:'Segredo Revelado', cor:'rgba(52,211,153,0.85)' },
  { texto:'O exame voltou normal. O paciente continua com todos os sintomas. Por quê?', tipo:'Pergunta', cor:'rgba(167,139,250,0.85)' },
  { texto:'Insulina alta em jejum com glicose normal: o sinal que ninguém vê.', tipo:'Dado Chocante', cor:'rgba(96,165,250,0.85)' },
]

export default function GanchosPage() {
  const [tema,       setTema]       = useState('')
  const [tipos,      setTipos]      = useState<string[]>(['dado','pergunta','polemico'])
  const [formato,    setFormato]    = useState('Reel')
  const [ganchos,    setGanchos]    = useState<Gancho[]>(BIBLIOTECA_FIXA)
  const [loading,    setLoading]    = useState(false)
  const [favoritos,  setFavoritos]  = useState<Gancho[]>([])
  const [showPautas, setShowPautas] = useState(false)
  const [aba,        setAba]        = useState<'gerar'|'favoritos'>('gerar')
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const toggleTipo = (v:string) => setTipos(prev => prev.includes(v) ? prev.filter(t=>t!==v) : [...prev,v])
  const toggleFav  = (g:Gancho) => setFavoritos(prev => prev.some(f=>f.texto===g.texto) ? prev.filter(f=>f.texto!==g.texto) : [g,...prev])
  const isFav = (g:Gancho) => favoritos.some(f=>f.texto===g.texto)

  const gerar = async () => {
    if (!tema.trim() || !tipos.length) return
    setLoading(true)
    try {
      const tiposLabel = tipos.map(v => TIPOS.find(t=>t.v===v)?.l).filter(Boolean).join(', ')
      const prompt =
        'Crie 8 ganchos de abertura para ' + formato + ' do Dr. Bruno Gustavo — Clínico-Geral, Endocrinologia e Nutrologia.\n' +
        'TEMA: ' + tema + '\nTIPOS DE GANCHO: ' + tiposLabel + '\n\n' +
        'REGRAS:\n' +
        '- Máx 2 frases por gancho — para o dedo no scroll em 3 segundos\n' +
        '- Tom: médico que fala como amigo, direto, sem academicismo\n' +
        '- Proibido: "Você sabia que", "Neste vídeo", "Hoje vou falar"\n' +
        '- Distribua os tipos solicitados entre os 8 ganchos\n\n' +
        'Retorne SOMENTE JSON: {"ganchos":[{"texto":"...","tipo":"nome do tipo"}]}'
      const res  = await fetch('/api/roteiros', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1200, messages:[{role:'user',content:prompt}] }) })
      const data = await res.json()
      const raw  = (data.content?.[0]?.text||'{}').replace(/```json/g,'').replace(/```/g,'').trim()
      const json = JSON.parse(raw)
      if (!json.ganchos) throw new Error('inválido')
      const mapped: Gancho[] = json.ganchos.map((g: {texto:string; tipo:string}) => ({
        texto: g.texto,
        tipo:  g.tipo,
        cor:   TIPOS.find(t=>t.l===g.tipo)?.cor || C.d2,
      }))
      setGanchos(mapped)
      setAba('gerar')
    } catch(e) { alert('Erro: '+String(e)) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background text-text-primary" style={{ fontFamily:"'Montserrat',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&family=Playfair+Display:ital,wght@1,700&display=swap'); *{box-sizing:border-box} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {showPautas && <PautasModal onSelect={(t)=>{setTema(t);setShowPautas(false)}} onClose={()=>setShowPautas(false)} />}

      {/* Header */}
      <div className="border-b border-border bg-surface" style={{ padding:'18px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.d2, letterSpacing:1, margin:0 }}>Biblioteca de Ganchos</h1>
          <p style={{ fontSize:12, color:C.label, margin:'4px 0 0' }}>Aberturas que param o scroll em 3 segundos</p>
        </div>
        <button onClick={gerar} disabled={loading||!tema.trim()||!tipos.length}
          style={{ background:tema.trim()&&tipos.length?C.d2:C.border, color:tema.trim()&&tipos.length?C.bg:C.label, padding:'12px 28px', borderRadius:10, border:'none', fontWeight:900, fontSize:13, cursor:(tema.trim()&&tipos.length)?'pointer':'not-allowed', fontFamily:"'Montserrat',sans-serif" }}>
          {loading ? '⟳ Gerando...' : '✦ Gerar Ganchos'}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:isMobile?'column':'row', height:isMobile?'auto':'calc(100vh - 74px)' }}>
        {/* Left */}
        <div className="bg-card border-r border-border md:border-b-0 border-b" style={{ width:isMobile?'100%':280, flexShrink:0, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const }}>Tema</label>
              <button onClick={()=>setShowPautas(true)} style={{ fontSize:10, fontWeight:700, color:C.d2, background:'rgba(200,168,76,0.08)', border:'1px solid rgba(200,168,76,0.25)', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>
                📋 Banco de Pautas
              </button>
            </div>
            <textarea value={tema} onChange={e=>setTema(e.target.value)} rows={3} placeholder="Ex: Resistência à insulina" style={{ ...inputSty, resize:'none', display:'block' }} />
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
            <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>
              Tipos de Gancho <span style={{ color:C.wFaint, fontWeight:400, textTransform:'none', letterSpacing:0 }}>(selecione 1+)</span>
            </label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {TIPOS.map(t => {
                const ativo = tipos.includes(t.v)
                return (
                  <button key={t.v} onClick={()=>toggleTipo(t.v)}
                    style={{ padding:'10px 14px', borderRadius:8, border:`1px solid ${ativo?t.cor:'transparent'}`, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10, background:ativo?'rgba(0,0,0,0.3)':C.side, fontFamily:"'Montserrat',sans-serif" }}>
                    <span style={{ fontSize:16 }}>{t.e}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:12, color:ativo?t.cor:C.label }}>{t.l}</div>
                      <div style={{ fontSize:10, color:C.wFaint, marginTop:2, fontStyle:'italic' }}>{t.ex}</div>
                    </div>
                    {ativo && <span style={{ color:t.cor, fontSize:14 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="bg-background" style={{ flex:1, overflowY:'auto', padding:isMobile?16:32 }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:`1px solid ${C.border}`, paddingBottom:0 }}>
            {(['gerar','favoritos'] as const).map(tab => (
              <button key={tab} onClick={()=>setAba(tab)}
                style={{ padding:'8px 20px', border:'none', borderBottom:aba===tab?`2px solid ${C.d2}`:'2px solid transparent', background:'none', color:aba===tab?C.d2:C.label, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase' as const, letterSpacing:2, fontFamily:"'Montserrat',sans-serif", marginBottom:-1 }}>
                {tab==='gerar' ? '⚡ Ganchos' : `★ Favoritos (${favoritos.length})`}
              </button>
            ))}
          </div>

          {/* Tab Ganchos */}
          {aba==='gerar' && (
            <>
              {loading && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50vh', gap:16 }}>
                  <div style={{ width:44, height:44, border:'3px solid rgba(200,168,76,0.2)', borderTop:`3px solid ${C.d2}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                  <div style={{ color:C.d2, fontSize:13, fontWeight:700, letterSpacing:2 }}>CRIANDO GANCHOS...</div>
                </div>
              )}
              {!loading && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {ganchos.map((g, i) => (
                    <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px', borderLeft:`3px solid ${g.cor}` }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, color:g.cor, background:'rgba(0,0,0,0.4)', border:`1px solid ${g.cor}` }}>{g.tipo}</span>
                          </div>
                          <div style={{ color:C.w, fontSize:15, lineHeight:1.65, fontFamily:"'Playfair Display', serif", fontStyle:'italic' }}>
                            "{g.texto}"
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                          <CopyBtn text={g.texto} />
                          <button onClick={()=>toggleFav(g)}
                            style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${isFav(g)?'rgba(200,168,76,0.5)':C.border}`, background:isFav(g)?'rgba(200,168,76,0.12)':'none', color:isFav(g)?C.d2:C.label, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>
                            {isFav(g)?'★':'☆'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tab Favoritos */}
          {aba==='favoritos' && (
            <>
              {favoritos.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50vh', gap:12, opacity:.5 }}>
                  <div style={{ fontSize:48 }}>★</div>
                  <div style={{ color:C.label, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' as const, textAlign:'center' }}>Nenhum favorito ainda<br />Clique em ☆ para salvar</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {favoritos.map((g, i) => (
                    <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px', borderLeft:`3px solid ${g.cor}` }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ marginBottom:8 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, color:g.cor, background:'rgba(0,0,0,0.4)', border:`1px solid ${g.cor}` }}>{g.tipo}</span>
                          </div>
                          <div style={{ color:C.w, fontSize:15, lineHeight:1.65, fontFamily:"'Playfair Display', serif", fontStyle:'italic' }}>
                            "{g.texto}"
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                          <CopyBtn text={g.texto} />
                          <button onClick={()=>toggleFav(g)}
                            style={{ padding:'6px 12px', borderRadius:6, border:`1px solid rgba(200,168,76,0.5)`, background:'rgba(200,168,76,0.12)', color:C.d2, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Montserrat',sans-serif" }}>
                            ★
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
