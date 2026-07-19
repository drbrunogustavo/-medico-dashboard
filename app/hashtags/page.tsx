// Salvar em: app/hashtags/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Copy, Check, Sparkles, ClipboardList, Pin, Save, Loader2, Hash, RotateCcw } from "lucide-react"
import { PautasModal } from '@/components/PautasModal'
import { Toast } from '@/components/Toast'
import { AI_MODEL } from "@/lib/ai-config"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

const D = {
  bg:'var(--background)',surface:'var(--surface)',card:'var(--surface-2)',border:'var(--border)',
  text:'var(--text-primary)',text2:'var(--text-secondary)',muted:'var(--text-muted)',
  accent:'var(--accent)',adim:'var(--accent-dim)',aborder:'var(--accent-border)',atext:'var(--accent-text)',
  font:"'Inter', system-ui, sans-serif",mono:"'JetBrains Mono', monospace",
}
const inputSty = { background:D.card, border:`1px solid ${D.border}`, color:D.text, borderRadius:8, padding:'10px 14px', fontSize:13, width:'100%', fontFamily:"'Inter'", outline:'none' } as React.CSSProperties

const NICHOS = ['Nutrologia','Endocrinologia','Longevidade','Metabolismo','Hormônios','Anti-aging','Emagrecimento','Diabetes','Tireoide']
const OBJETIVOS = [
  { v:'alcance',     l:'Alcance Máximo',   e:'📡', desc:'Hashtags amplas para mais pessoas' },
  { v:'nicho',       l:'Nicho Médico',     e:'🩺', desc:'Médicos e profissionais de saúde' },
  { v:'engajamento', l:'Engajamento',      e:'💬', desc:'Audiência que comenta e salva' },
  { v:'local',       l:'Local',            e:'📍', desc:'Sua cidade e região' },
]

interface HashtagResult {
  hashtag:  string
  motivo:   string
  tipo:     string
}

function CopyBtn({ text, label='Copiar' }: { text:string; label?:string }) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1600) }}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:`1px solid rgba(200,168,76,0.3)`, background:ok?'rgba(200,168,76,0.12)':'none', color:ok?D.accent:D.muted, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Inter'" }}>
      {ok ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {ok ? 'Copiado!' : label}
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
  const [isMob,   setIsMob]   = useState(false)
  const [errMsg,  setErrMsg]  = useState<string | null>(null)
  useEffect(() => { setIsMob(window.innerWidth < 768) }, [])
  const showErr = (msg: string) => { setErrMsg(msg); setTimeout(() => setErrMsg(null), 4000) }

  const gerar = async () => {
    if (!tema.trim()) return
    setLoading(true)
    try {
      const obj = OBJETIVOS.find(o => o.v === objetivo)
      const prompt =
        'Sugira EXATAMENTE 5 hashtags para o Instagram do médico usuário — ' + nicho + '.\n' +
        'TEMA DO POST: ' + tema + '\nOBJETIVO: ' + obj?.l + ' — ' + obj?.desc + '\n\n' +
        'REGRAS CRÍTICAS:\n' +
        '- Instagram em 2024-2025 penaliza posts com muitas hashtags. Use APENAS 5.\n' +
        '- Misture: 1-2 hashtags grandes (>500k posts) + 2-3 médias (50k-500k) + 1 pequena/nicho\n' +
        '- Sem hashtags genéricas demais como #saude ou #medico\n' +
        '- Foco em quem realmente segue conteúdo médico de qualidade\n\n' +
        'Retorne SOMENTE JSON: {"hashtags":[{"hashtag":"semcerquilha","motivo":"motivo em 1 frase","tipo":"nicho|alcance|engajamento|local"}]}'
      const res  = await fetch('/api/roteiros', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:AI_MODEL, max_tokens:800, messages:[{role:'user',content:prompt}] }) })
      const data = await res.json()
      const raw  = (data.content?.[0]?.text||'{}').replace(/```json/g,'').replace(/```/g,'').trim()
      const startIdx = raw.indexOf('{'); const jsonStr = startIdx >= 0 ? raw.slice(startIdx) : raw; const json = JSON.parse(jsonStr)
      if (!json.hashtags){console.error('API response:',json);throw new Error('Resposta inesperada da IA. Tente novamente.')}
      setResultado(json.hashtags.slice(0,5))
    } catch(e) { const m=String(e); showErr(m.includes('rate_limit') ? 'Limite de requisições atingido. Aguarde 1 minuto e tente novamente.' : 'Erro ao gerar hashtags. Tente novamente.') }
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
    <div className="min-h-screen" style={{ fontFamily:D.font, color:D.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap'); *{box-sizing:border-box} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <MobileOnlyHeader title="Análise de Hashtags" />
      {showPautas && <PautasModal onSelect={(t)=>{setTema(t);setShowPautas(false)}} onClose={()=>setShowPautas(false)} />}

      {/* Header */}
      <div className="border-b border-border bg-surface" style={{ padding:'18px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:D.accent, letterSpacing:1, margin:0 }}>Análise de Hashtags</h1>
          <p style={{ fontSize:11, color:D.text2, margin:'4px 0 0', fontFamily:D.font }}>Descubra hashtags relevantes para aumentar o alcance do seu conteúdo.</p>
        </div>
        <button onClick={gerar} disabled={loading||!tema.trim()}
          style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, background:tema.trim()?D.accent:D.border, color:tema.trim()?D.bg:D.muted, padding:'12px 28px', borderRadius:10, border:'none', fontWeight:900, fontSize:13, cursor:tema.trim()?'pointer':'not-allowed', fontFamily:"'Inter'" }}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</> : <><Sparkles className="w-4 h-4" /> Gerar Hashtags</>}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:isMob?'column':'row', height:isMob?'auto':'calc(100vh - 74px)' }}>
        {/* Left */}
        <div className="bg-card border-r border-border md:border-b-0 border-b" style={{ width:isMob?'100%':280, flexShrink:0, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const }}>Tema do Post</label>
              <button onClick={()=>setShowPautas(true)} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, color:D.accent, background:'rgba(200,168,76,0.08)', border:'1px solid rgba(200,168,76,0.25)', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontFamily:"'Inter'" }}>
                <ClipboardList className="w-3 h-3" /> Banco de Pautas
              </button>
            </div>
            <textarea value={tema} onChange={e=>setTema(e.target.value)} rows={3} placeholder="Ex: Tieoide e ganho de peso" style={{ ...inputSty, resize:'none', display:'block' }} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Nicho Principal</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {NICHOS.map(n => (
                <button key={n} onClick={()=>setNicho(n)}
                  style={{ padding:'6px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:nicho===n?D.accent:D.card, color:nicho===n?D.bg:D.muted, fontFamily:"'Inter'" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Objetivo</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {OBJETIVOS.map(o => (
                <button key={o.v} onClick={()=>setObjetivo(o.v)}
                  style={{ padding:'10px 14px', borderRadius:8, border:'none', cursor:'pointer', textAlign:'left', background:objetivo===o.v?D.accent:D.card, color:objetivo===o.v?D.bg:D.muted, fontFamily:"'Inter'" }}>
                  <div style={{ fontWeight:700, fontSize:12 }}>{o.e} {o.l}</div>
                  <div style={{ fontSize:10, fontWeight:400, opacity:.75, marginTop:2 }}>{o.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sets salvos */}
          {salvos.length > 0 && (
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:10 }}>Sets Salvos</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {salvos.map((set, i) => (
                  <div key={i} style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ color:D.muted, fontSize:11, lineHeight:1.7 }}>{set.join(' ')}</div>
                    <div style={{ marginTop:6 }}>
                      <CopyBtn text={set.join(' ')} label="Copiar set" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center */}
        <div className="bg-background" style={{ flex:1, overflowY:'auto', padding:isMob?16:32 }}>
          {/* Aviso Instagram */}
          <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:8, background:'rgba(200,168,76,0.06)', border:'1px solid rgba(200,168,76,0.2)', display:'flex', gap:12, alignItems:'center' }}>
            <Pin style={{ width:18, height:18, color:D.accent, flexShrink:0 }} />
            <div style={{ fontSize:12, color:D.text2, lineHeight:1.5 }}>
              <strong style={{ color:D.accent }}>Instagram 2025:</strong> O algoritmo prioriza posts com <strong style={{ color:D.text }}>até 5 hashtags</strong> relevantes. Menos é mais.
            </div>
          </div>

          {!resultado.length && !loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50vh', gap:12, opacity:.5 }}>
              <Hash style={{ width:48, height:48, color:D.muted }} />
              <div style={{ color:D.muted, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' as const, textAlign:'center' }}>Defina o tema e<br />clique em Gerar Hashtags</div>
            </div>
          )}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'50vh', gap:16 }}>
              <div style={{ width:44, height:44, border:'3px solid rgba(200,168,76,0.2)', borderTop:`3px solid ${D.accent}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <div style={{ color:D.accent, fontSize:13, fontWeight:700, letterSpacing:2 }}>ANALISANDO HASHTAGS...</div>
            </div>
          )}
          {!loading && resultado.length > 0 && (
            <>
              {/* Header resultado */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
                <div style={{ color:D.muted, fontSize:11, fontWeight:700, letterSpacing:3, textTransform:'uppercase' as const }}>
                  {resultado.length} hashtags · {nicho}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={salvarSet} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:`1px solid rgba(200,168,76,0.3)`, background:'none', color:D.atext, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Inter'" }}>
                    <Save className="w-3.5 h-3.5" /> Salvar set
                  </button>
                  <CopyBtn text={resultado.map(h=>'#'+h.hashtag).join(' ')} label="Copiar todos" />
                  <button onClick={gerar} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:`1px solid ${D.border}`, background:'none', color:D.muted, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Inter'" }}>
                    <RotateCcw className="w-3.5 h-3.5" /> Regerar
                  </button>
                </div>
              </div>

              {/* Hashtags */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {resultado.map((h, i) => (
                  <div key={i} style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:10, padding:'20px 24px', display:'flex', alignItems:'center', gap:20 }}>
                    <div style={{ fontSize:28, fontWeight:900, color:D.accent, minWidth:30 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' as const }}>
                        <span style={{ fontSize:20, fontWeight:900, color:D.text }}>#{h.hashtag}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, color:TIPO_COLOR[h.tipo]||D.muted, background:'rgba(0,0,0,0.4)', border:`1px solid ${TIPO_COLOR[h.tipo]||D.muted}` }}>
                          {h.tipo}
                        </span>
                      </div>
                      <div style={{ color:D.text2, fontSize:13, lineHeight:1.5 }}>{h.motivo}</div>
                    </div>
                    <CopyBtn text={'#'+h.hashtag} />
                  </div>
                ))}
              </div>

              {/* Copy block */}
              <div style={{ marginTop:20, padding:'16px 20px', background:D.card, border:`1px solid rgba(200,168,76,0.2)`, borderRadius:10 }}>
                <div style={{ color:D.atext, fontSize:11, fontWeight:700, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:10 }}>Bloco para colar na legenda</div>
                <div style={{ color:D.text2, fontSize:14, letterSpacing:1, lineHeight:2 }}>
                  {resultado.map(h=>'#'+h.hashtag).join(' ')}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Toast message={errMsg} type="error" />
    </div>
  )
}
