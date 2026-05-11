// Salvar em: app/analise/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'

const C = {
  bg:'#08090e', bgCard:'#13141d', bgMid:'#0f1018',
  d1:'#7c85a0', d2:'#00c07f',
  w:'#F5F0EB', wMid:'rgba(245,240,235,0.68)', wFaint:'rgba(245,240,235,0.38)',
  panel:'#08090e', border:'#1c1d2a', label:'#474f66', side:'#13141d',
}

const inputSty = {
  background: C.side, border: `1px solid ${C.border}`, color: C.w,
  borderRadius: 8, padding: '10px 14px', fontSize: 13, width: '100%',
  fontFamily: "'Inter',sans-serif", outline: 'none',
} as React.CSSProperties

interface AnaliseResult {
  perfil: {
    nome:          string
    handle:        string
    especialidade: string
    posicionamento: string
    tom:           string
    frequencia:    string
    formatos:      string[]
  }
  temas: {
    principal: string
    secundarios: string[]
    gaps: string[]
  }
  pontos_fortes:  string[]
  pontos_fracos:  string[]
  oportunidades:  string[]
  estrategia: {
    diferencial:  string
    temas_atacar: string[]
    formatos_rec: string[]
    gancho:       string
  }
  score: {
    conteudo:    number
    consistencia: number
    engajamento: number
    nicho:       number
  }
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:2, textTransform:'uppercase' as const }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:900, color: value >= 7 ? '#34d399' : value >= 5 ? C.d2 : '#f87171' }}>{value}/10</span>
      </div>
      <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
        <div style={{ height:'100%', width: (value*10)+'%', borderRadius:3, background: value >= 7 ? '#34d399' : value >= 5 ? C.d2 : '#f87171', transition:'width 1s ease' }} />
      </div>
    </div>
  )
}

function Tag({ text, color = C.d2 }: { text: string; color?: string }) {
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99, color, background:'rgba(0,0,0,0.4)', border:`1px solid ${color}`, display:'inline-block' }}>
      {text}
    </span>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1600) }}
      style={{ padding:'5px 12px', borderRadius:6, border:`1px solid rgba(200,168,76,0.3)`, background:ok?'rgba(200,168,76,0.12)':'none', color:ok?C.d2:C.label, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
      {ok ? '✓ Copiado' : '⎘ Copiar'}
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:10, padding:'20px 24px' }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:14 }}>{title}</div>
      {children}
    </div>
  )
}

export default function AnalisePage() {
  const [handle,   setHandle]   = useState('')
  const [nicho,    setNicho]    = useState('')
  const [resultado, setResultado] = useState<AnaliseResult | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])

  const analisarHandle = useCallback(async (h: string, n: string) => {
    setHandle(h)
    setNicho(n)
    setLoading(true)
    setErro('')
    setResultado(null)

    try {
      const prompt =
        'Você é um estrategista de conteúdo médico. Analise o perfil @' + h + ' no Instagram' +
        (n ? ' (nicho: ' + n + ')' : '') + ' do ponto de vista do Dr. Bruno Gustavo — Clínico-Geral, Endocrinologia e Nutrologia, Poços de Caldas-MG (@drbrunogustavo).\n\n' +
        'Com base no que você sabe sobre este perfil (ou perfis similares neste nicho), gere uma análise estratégica completa.\n' +
        'Se não conhecer o perfil específico, baseie-se em perfis típicos desta especialidade/nicho.\n\n' +
        'Retorne SOMENTE JSON válido:\n' +
        '{\n' +
        '  "perfil": {\n' +
        '    "nome": "nome completo ou estimado",\n' +
        '    "handle": "@' + h + '",\n' +
        '    "especialidade": "especialidade principal",\n' +
        '    "posicionamento": "como se posiciona",\n' +
        '    "tom": "tom de voz predominante",\n' +
        '    "frequencia": "frequência estimada de posts",\n' +
        '    "formatos": ["formato1", "formato2"]\n' +
        '  },\n' +
        '  "temas": {\n' +
        '    "principal": "tema dominante",\n' +
        '    "secundarios": ["tema2", "tema3", "tema4"],\n' +
        '    "gaps": ["gap1", "gap2"]\n' +
        '  },\n' +
        '  "pontos_fortes": ["ponto1", "ponto2", "ponto3"],\n' +
        '  "pontos_fracos": ["fraco1", "fraco2"],\n' +
        '  "oportunidades": ["oport1", "oport2", "oport3"],\n' +
        '  "estrategia": {\n' +
        '    "diferencial": "como Dr. Bruno pode se diferenciar em 2 frases",\n' +
        '    "temas_atacar": ["tema1"],\n' +
        '    "formatos_rec": ["formato1"],\n' +
        '    "gancho": "exemplo de gancho para Dr. Bruno"\n' +
        '  },\n' +
        '  "score": { "conteudo": 7, "consistencia": 6, "engajamento": 8, "nicho": 7 }\n' +
        '}'

      const res  = await fetch('/api/roteiros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const raw  = (data.content?.[0]?.text || '{}').replace(/```json/g,'').replace(/```/g,'').trim()
      const startIdx = raw.indexOf('{'); const jsonStr = startIdx >= 0 ? raw.slice(startIdx) : raw; const json = JSON.parse(jsonStr) as AnaliseResult
      if (!json.perfil){console.error('API response:',json);throw new Error('Resposta inesperada da IA. Tente novamente.')}
      setResultado(json)
    } catch(e) {
      setErro('Erro ao analisar. Verifique o handle e tente novamente.')
      console.error(e)
    }
    setLoading(false)
  }, [])

  // Lê handle da URL e inicia análise automaticamente
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const h = params.get('handle')?.replace('@','').trim()
    const n = params.get('nicho') || ''
    if (h) analisarHandle(h, n)
  }, [analisarHandle])

  const analisar = () => {
    const h = handle.replace('@','').trim()
    if (h) analisarHandle(h, nicho)
  }

  // Monta texto completo para copiar
  const relatorioTexto = resultado ? [
    '=== ANÁLISE ESTRATÉGICA: ' + resultado.perfil.handle + ' ===\n',
    'PERFIL',
    'Especialidade: ' + resultado.perfil.especialidade,
    'Posicionamento: ' + resultado.perfil.posicionamento,
    'Tom: ' + resultado.perfil.tom,
    'Frequência: ' + resultado.perfil.frequencia,
    'Formatos: ' + resultado.perfil.formatos.join(', '),
    '\nTEMAS',
    'Principal: ' + resultado.temas.principal,
    'Secundários: ' + resultado.temas.secundarios.join(', '),
    'Gaps: ' + resultado.temas.gaps.join(', '),
    '\nPONTOS FORTES',
    ...resultado.pontos_fortes.map(p => '+ ' + p),
    '\nPONTOS FRACOS',
    ...resultado.pontos_fracos.map(p => '- ' + p),
    '\nOPORTUNIDADES PARA DR. BRUNO',
    ...resultado.oportunidades.map(o => '→ ' + o),
    '\nESTRATÉGIA',
    'Diferencial: ' + resultado.estrategia.diferencial,
    'Temas a atacar: ' + resultado.estrategia.temas_atacar.join(', '),
    'Formatos recomendados: ' + resultado.estrategia.formatos_rec.join(', '),
    'Gancho sugerido: ' + resultado.estrategia.gancho,
  ].join('\n') : ''

  return (
    <div style={{ minHeight:'100vh', background:C.panel, color:C.w, fontFamily:"'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:'18px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:C.d2, letterSpacing:1, margin:0 }}>Análise de Concorrentes</h1>
          <p style={{ fontSize:12, color:C.label, margin:'4px 0 0' }}>Análise estratégica de perfis médicos no Instagram</p>
        </div>
        <button onClick={analisar} disabled={loading || !handle.trim()}
          style={{ background:handle.trim()?C.d2:C.border, color:handle.trim()?C.bg:C.label, padding:'12px 28px', borderRadius:10, border:'none', fontWeight:900, fontSize:13, cursor:handle.trim()?'pointer':'not-allowed', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:8 }}>
          {loading ? '⟳ Analisando...' : '✦ Analisar Perfil'}
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:isMobile?'column':'row', height:isMobile?'auto':'calc(100vh - 74px)' }}>

        {/* ── Painel Esquerdo ── */}
        <div style={{ width:isMobile?'100%':280, flexShrink:0, borderRight:isMobile?'none':`1px solid ${C.border}`, borderBottom:isMobile?`1px solid ${C.border}`:'none', overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:20 }}>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>Handle do Concorrente</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.label, fontSize:14, fontWeight:700 }}>@</span>
              <input
                type="text"
                value={handle}
                onChange={e => setHandle(e.target.value.replace('@',''))}
                placeholder="drnomeexemplo"
                onKeyDown={e => { if (e.key === 'Enter' && handle.trim()) analisar() }}
                style={{ ...inputSty, paddingLeft:28 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, display:'block', marginBottom:8 }}>
              Nicho / Especialidade <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(opcional)</span>
            </label>
            <input type="text" value={nicho} onChange={e => setNicho(e.target.value)}
              placeholder="Ex: Endocrinologia, Nutrologia..."
              style={inputSty} />
          </div>

          {/* Aviso */}
          <div style={{ padding:'12px 14px', borderRadius:8, background:'rgba(200,168,76,0.06)', border:'1px solid rgba(200,168,76,0.2)', fontSize:11, color:C.wMid, lineHeight:1.6 }}>
            <strong style={{ color:C.d2 }}>Como funciona:</strong> A IA analisa o perfil com base no seu conhecimento sobre médicos influentes neste nicho e gera um relatório estratégico com gaps e oportunidades para o Dr. Bruno.
          </div>

          {/* Histórico de análises recentes */}
          {resultado && (
            <div style={{ paddingTop:16, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:10 }}>Última análise</div>
              <div style={{ padding:'10px 14px', background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:8 }}>
                <div style={{ color:C.d2, fontSize:13, fontWeight:700 }}>{resultado.perfil.handle}</div>
                <div style={{ color:C.wFaint, fontSize:11, marginTop:2 }}>{resultado.perfil.especialidade}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Centro — Resultado ── */}
        <div style={{ flex:1, overflowY:'auto', padding:isMobile?16:32, background:'#090503' }}>

          {/* Estado vazio */}
          {!resultado && !loading && !erro && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16, opacity:.5 }}>
              <div style={{ fontSize:52 }}>🔍</div>
              <div style={{ color:C.label, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' as const, textAlign:'center' }}>
                Digite o @handle e clique<br />em ✦ Analisar Perfil
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
              <div style={{ width:44, height:44, border:'3px solid rgba(200,168,76,0.2)', borderTop:`3px solid ${C.d2}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <div style={{ color:C.d2, fontSize:13, fontWeight:700, letterSpacing:2, textAlign:'center' }}>
                ANALISANDO @{handle.toUpperCase()}...
              </div>
              <div style={{ color:C.label, fontSize:11, textAlign:'center', lineHeight:1.7 }}>
                Identificando temas · Mapeando gaps<br />Gerando estratégia para Dr. Bruno
              </div>
            </div>
          )}

          {/* Erro */}
          {erro && !loading && (
            <div style={{ padding:'16px 20px', borderRadius:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:13 }}>
              {erro}
            </div>
          )}

          {/* Resultado */}
          {resultado && !loading && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Header do relatório */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:4 }}>
                <div>
                  <div style={{ color:C.label, fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:6 }}>Relatório Estratégico</div>
                  <h2 style={{ margin:0, fontSize:24, fontWeight:900, color:C.w }}>{resultado.perfil.handle}</h2>
                  <div style={{ color:C.d1, fontSize:13, marginTop:4 }}>{resultado.perfil.nome} · {resultado.perfil.especialidade}</div>
                </div>
                <CopyBtn text={relatorioTexto} />
              </div>

              {/* Scores */}
              <Section title="Score do Concorrente">
                <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:14 }}>
                  <ScoreBar label="Qualidade de Conteúdo" value={resultado.score.conteudo} />
                  <ScoreBar label="Consistência"          value={resultado.score.consistencia} />
                  <ScoreBar label="Engajamento Estimado"  value={resultado.score.engajamento} />
                  <ScoreBar label="Domínio de Nicho"      value={resultado.score.nicho} />
                </div>
              </Section>

              {/* Perfil */}
              <Section title="Perfil do Concorrente">
                <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:10, marginBottom:14 }}>
                  {[
                    { l:'Posicionamento', v: resultado.perfil.posicionamento },
                    { l:'Tom de Voz',     v: resultado.perfil.tom },
                    { l:'Frequência',     v: resultado.perfil.frequencia },
                  ].map(item => (
                    <div key={item.l} style={{ padding:'10px 14px', background:'rgba(0,0,0,0.3)', borderRadius:8, border:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:9, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:4 }}>{item.l}</div>
                      <div style={{ color:C.w, fontSize:12, lineHeight:1.5 }}>{item.v}</div>
                    </div>
                  ))}
                  <div style={{ padding:'10px 14px', background:'rgba(0,0,0,0.3)', borderRadius:8, border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:9, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:6 }}>Formatos</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {resultado.perfil.formatos.map(f => <Tag key={f} text={f} color={C.d1} />)}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Temas */}
              <Section title="Mapa de Temas">
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:8 }}>Tema Principal</div>
                  <div style={{ padding:'10px 16px', background:'rgba(200,168,76,0.08)', border:`1px solid rgba(200,168,76,0.25)`, borderRadius:8, color:C.w, fontSize:14, fontWeight:700 }}>
                    {resultado.temas.principal}
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:8 }}>Temas Secundários</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {resultado.temas.secundarios.map(t => <Tag key={t} text={t} color={C.d2} />)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(52,211,153,0.9)', letterSpacing:3, textTransform:'uppercase' as const, marginBottom:8 }}>Gaps — O Que Ele Não Aborda</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {resultado.temas.gaps.map(t => <Tag key={t} text={t} color="rgba(52,211,153,0.9)" />)}
                  </div>
                </div>
              </Section>

              {/* Fortes e Fracos */}
              <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:16 }}>
                <Section title="✅ Pontos Fortes">
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {resultado.pontos_fortes.map((p, i) => (
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <span style={{ color:'#34d399', fontSize:14, flexShrink:0, marginTop:1 }}>+</span>
                        <span style={{ color:C.wMid, fontSize:13, lineHeight:1.5 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="⚠️ Pontos Fracos">
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {resultado.pontos_fracos.map((p, i) => (
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <span style={{ color:'#f87171', fontSize:14, flexShrink:0, marginTop:1 }}>−</span>
                        <span style={{ color:C.wMid, fontSize:13, lineHeight:1.5 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Oportunidades */}
              <Section title="🎯 Oportunidades para Dr. Bruno">
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {resultado.oportunidades.map((o, i) => (
                    <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 16px', background:'rgba(200,168,76,0.05)', border:'1px solid rgba(200,168,76,0.15)', borderRadius:8 }}>
                      <span style={{ color:C.d2, fontWeight:900, fontSize:14, flexShrink:0 }}>→</span>
                      <span style={{ color:C.w, fontSize:13, lineHeight:1.5 }}>{o}</span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Estratégia */}
              <Section title="⚡ Estratégia Recomendada">
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ padding:'14px 18px', background:'rgba(200,168,76,0.08)', border:`1px solid rgba(200,168,76,0.3)`, borderRadius:8 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.d2, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:8 }}>Seu Diferencial</div>
                    <div style={{ color:C.w, fontSize:14, lineHeight:1.6, fontStyle:'italic', fontFamily:"'Playfair Display',serif" }}>"{resultado.estrategia.diferencial}"</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:12 }}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:8 }}>Temas para Atacar</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {resultado.estrategia.temas_atacar.map(t => <Tag key={t} text={t} color="rgba(167,139,250,0.9)" />)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:8 }}>Formatos Recomendados</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {resultado.estrategia.formatos_rec.map(f => <Tag key={f} text={f} color="rgba(96,165,250,0.9)" />)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:C.label, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:8 }}>Gancho Sugerido</div>
                    <div style={{ padding:'12px 16px', background:'rgba(0,0,0,0.3)', border:`1px solid ${C.border}`, borderRadius:8, color:C.wMid, fontSize:13, lineHeight:1.6, fontStyle:'italic' }}>
                      "{resultado.estrategia.gancho}"
                    </div>
                  </div>
                </div>
              </Section>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
