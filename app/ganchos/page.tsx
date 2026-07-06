// Salvar em: app/ganchos/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { TopBar } from '@/components/TopBar'
import { PautasModal } from '@/components/PautasModal'
import { Toast } from '@/components/Toast'
import { AI_MODEL } from "@/lib/ai-config"

const D = {
  bg:'var(--background)',surface:'var(--surface)',card:'var(--surface-2)',border:'var(--border)',
  text:'var(--text-primary)',text2:'var(--text-secondary)',muted:'var(--text-muted)',
  accent:'var(--accent)',adim:'var(--accent-dim)',aborder:'var(--accent-border)',atext:'var(--accent-text)',
}
const inputSty = { background:D.card, border:`1px solid ${D.border}`, color:D.text, borderRadius:8, padding:'10px 14px', fontSize:14, width:'100%', outline:'none' } as React.CSSProperties

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
      style={{ padding:'6px 12px', borderRadius:6, border:`1px solid rgba(200,168,76,0.3)`, background:ok?'rgba(200,168,76,0.12)':'none', color:ok?D.accent:D.muted, fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
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
  const [isMob,   setIsMob]   = useState(false)
  const [errMsg,  setErrMsg]  = useState<string | null>(null)
  useEffect(() => { setIsMob(window.innerWidth < 768) }, [])
  const showErr = (msg: string) => { setErrMsg(msg); setTimeout(() => setErrMsg(null), 4000) }

  const toggleTipo = (v:string) => setTipos(prev => prev.includes(v) ? prev.filter(t=>t!==v) : [...prev,v])
  const toggleFav  = (g:Gancho) => setFavoritos(prev => prev.some(f=>f.texto===g.texto) ? prev.filter(f=>f.texto!==g.texto) : [g,...prev])
  const isFav = (g:Gancho) => favoritos.some(f=>f.texto===g.texto)

  const gerar = async () => {
    if (!tema.trim() || !tipos.length) return
    setLoading(true)
    try {
      const tiposLabel = tipos.map(v => TIPOS.find(t=>t.v===v)?.l).filter(Boolean).join(', ')
      const prompt =
        'Crie 8 ganchos de abertura para ' + formato + ' do médico usuário — Clínico-Geral, Endocrinologia e Nutrologia.\n' +
        'TEMA: ' + tema + '\nTIPOS DE GANCHO: ' + tiposLabel + '\n\n' +
        'REGRAS:\n' +
        '- Máx 2 frases por gancho — para o dedo no scroll em 3 segundos\n' +
        '- Tom: médico que fala como amigo, direto, sem academicismo\n' +
        '- Proibido: "Você sabia que", "Neste vídeo", "Hoje vou falar"\n' +
        '- Distribua os tipos solicitados entre os 8 ganchos\n\n' +
        'Retorne SOMENTE JSON: {"ganchos":[{"texto":"...","tipo":"nome do tipo"}]}'
      const res  = await fetch('/api/ganchos', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:AI_MODEL, max_tokens:1200, messages:[{role:'user',content:prompt}] }) })
      const data = await res.json()
      const raw  = (data.content?.[0]?.text||'{}').replace(/```json/g,'').replace(/```/g,'').trim()
      const startIdx = raw.indexOf('{'); const jsonStr = startIdx >= 0 ? raw.slice(startIdx) : raw; const json = JSON.parse(jsonStr)
      if (!json.ganchos){console.error('API response:',json);throw new Error('Resposta inesperada da IA. Tente novamente.')}
      const mapped: Gancho[] = json.ganchos.map((g: {texto:string; tipo:string}) => ({
        texto: g.texto,
        tipo:  g.tipo,
        cor:   TIPOS.find(t=>t.l===g.tipo)?.cor || D.accent,
      }))
      setGanchos(mapped)
      setAba('gerar')
    } catch(e) { const m=String(e); showErr(m.includes('rate_limit') ? 'Limite de requisições atingido. Aguarde 1 minuto e tente novamente.' : 'Erro ao gerar ganchos. Tente novamente.') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{ color:D.text }}>
      {showPautas && <PautasModal onSelect={(t)=>{setTema(t);setShowPautas(false)}} onClose={()=>setShowPautas(false)} />}
      <TopBar
        title="Biblioteca de Ganchos"
        subtitle="GANCHOS · COPYWRITING · CONVERSÃO"
        actions={
          <button
            onClick={gerar}
            disabled={loading || !tema.trim() || !tipos.length}
            className="flex items-center gap-1.5 text-[12px] font-bold rounded-lg px-4 py-1.5 transition-all disabled:opacity-50"
            style={{ background: tema.trim()&&tipos.length ? D.accent : D.border, color: tema.trim()&&tipos.length ? D.bg : D.muted }}
          >
            {loading ? '⟳ Gerando...' : '✦ Gerar Ganchos'}
          </button>
        }
      />

      <div style={{ display:'flex', flexDirection:isMob?'column':'row', height:isMob?'auto':'calc(100vh - 60px)' }}>
        {/* Left */}
        <div className="bg-card border-r border-border md:border-b-0 border-b" style={{ width:isMob?'100%':280, flexShrink:0, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const }}>Tema</label>
              <button onClick={()=>setShowPautas(true)} style={{ fontSize:10, fontWeight:700, color:D.accent, background:'rgba(200,168,76,0.08)', border:'1px solid rgba(200,168,76,0.25)', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>
                📋 Banco de Pautas
              </button>
            </div>
            <textarea value={tema} onChange={e=>setTema(e.target.value)} rows={3} placeholder="Ex: Resistência à insulina" style={{ ...inputSty, resize:'none', display:'block' }} />
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Formato</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {FORMATOS.map(f => (
                <button key={f} onClick={()=>setFormato(f)}
                  style={{ padding:'9px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:12, background:formato===f?D.accent:D.card, color:formato===f?D.bg:D.muted }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>
              Tipos de Gancho <span style={{ color:D.muted, fontWeight:400, textTransform:'none', letterSpacing:0 }}>(selecione 1+)</span>
            </label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {TIPOS.map(t => {
                const ativo = tipos.includes(t.v)
                return (
                  <button key={t.v} onClick={()=>toggleTipo(t.v)}
                    style={{ padding:'10px 14px', borderRadius:8, border:`1px solid ${ativo?t.cor:'transparent'}`, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10, background:ativo?'rgba(0,0,0,0.3)':D.card }}>
                    <span style={{ fontSize:16 }}>{t.e}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:12, color:ativo?t.cor:D.muted }}>{t.l}</div>
                      <div style={{ fontSize:10, color:D.muted, marginTop:2, fontStyle:'italic' }}>{t.ex}</div>
                    </div>
                    {ativo && <span style={{ color:t.cor, fontSize:14 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="bg-background" style={{ flex:1, overflowY:'auto', padding:isMob?16:32 }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:`1px solid ${D.border}`, paddingBottom:0 }}>
            {(['gerar','favoritos'] as const).map(tab => (
              <button key={tab} onClick={()=>setAba(tab)}
                style={{ padding:'8px 20px', border:'none', borderBottom:aba===tab?`2px solid ${D.accent}`:'2px solid transparent', background:'none', color:aba===tab?D.accent:D.muted, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase' as const, letterSpacing:2, marginBottom:-1 }}>
                {tab==='gerar' ? '⚡ Ganchos' : `★ Favoritos (${favoritos.length})`}
              </button>
            ))}
          </div>

          {/* Tab Ganchos */}
          {aba==='gerar' && (
            <>
              {loading && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50vh', gap:16 }}>
                  <div className="animate-spin" style={{ width:44, height:44, border:'3px solid rgba(200,168,76,0.2)', borderTop:`3px solid ${D.accent}`, borderRadius:'50%' }} />
                  <div style={{ color:D.accent, fontSize:13, fontWeight:700, letterSpacing:2 }}>CRIANDO GANCHOS...</div>
                  <div style={{ color:'#7c85a0', fontSize:10, marginTop:6, letterSpacing:0.5 }}>A geração pode levar 30–60 segundos. Não feche a página.</div>
                </div>
              )}
              {!loading && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {ganchos.map((g, i) => (
                    <div key={i} style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:10, padding:'18px 20px', borderLeft:`3px solid ${g.cor}` }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, color:g.cor, background:'rgba(0,0,0,0.4)', border:`1px solid ${g.cor}` }}>{g.tipo}</span>
                          </div>
                          <div className="font-playfair" style={{ color:D.text, fontSize:15, lineHeight:1.65, fontStyle:'italic' }}>
                            "{g.texto}"
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                          <CopyBtn text={g.texto} />
                          <button onClick={()=>toggleFav(g)}
                            style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${isFav(g)?'rgba(200,168,76,0.5)':D.border}`, background:isFav(g)?'rgba(200,168,76,0.12)':'none', color:isFav(g)?D.accent:D.muted, fontSize:11, fontWeight:700, cursor:'pointer' }}>
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
                  <div style={{ color:D.muted, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' as const, textAlign:'center' }}>Nenhum favorito ainda<br />Clique em ☆ para salvar</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {favoritos.map((g, i) => (
                    <div key={i} style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:10, padding:'18px 20px', borderLeft:`3px solid ${g.cor}` }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ marginBottom:8 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, color:g.cor, background:'rgba(0,0,0,0.4)', border:`1px solid ${g.cor}` }}>{g.tipo}</span>
                          </div>
                          <div className="font-playfair" style={{ color:D.text, fontSize:15, lineHeight:1.65, fontStyle:'italic' }}>
                            "{g.texto}"
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                          <CopyBtn text={g.texto} />
                          <button onClick={()=>toggleFav(g)}
                            style={{ padding:'6px 12px', borderRadius:6, border:`1px solid rgba(200,168,76,0.5)`, background:'rgba(200,168,76,0.12)', color:D.accent, fontSize:11, fontWeight:700, cursor:'pointer' }}>
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
      <Toast message={errMsg} type="error" />
    </div>
  )
}
