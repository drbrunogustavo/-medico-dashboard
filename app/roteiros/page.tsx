// Salvar em: app/roteiros/page.tsx
'use client'

import { useState, useCallback } from 'react'
import { PautasModal } from '@/components/PautasModal'

// ─── Types ────────────────────────────────────────────────────────────────────
type Duracao  = '15s' | '30s' | '60s' | '90s'
type Estilo   = 'talking-head' | 'texto-tela' | 'broll' | 'misto'

interface Bloco {
  id:        number
  tempo:     string   // "0:00 – 0:03"
  tipo:      'gancho' | 'problema' | 'conteudo' | 'insight' | 'cta'
  fala:      string   // texto falado pelo médico
  visual:    string   // descrição do que aparece na tela
  corte:     string   // tipo de transição
}

interface Roteiro {
  titulo:   string
  blocos:   Bloco[]
  legenda:  string
  hashtags: string[]
  hook:     string   // primeira frase (gancho) — aparece destacada
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
  panel:  '#0e0804',
  border: '#2a1a0a',
  label:  '#6a5040',
  side:   '#1c0f06',
}

const TIPO_CONFIG = {
  gancho:   { label: 'GANCHO',   color: '#C9A84C', icon: '⚡' },
  problema: { label: 'PROBLEMA', color: '#e07b54', icon: '🎯' },
  conteudo: { label: 'CONTEÚDO', color: '#7ab8a0', icon: '📋' },
  insight:  { label: 'INSIGHT',  color: '#a07ab8', icon: '💡' },
  cta:      { label: 'CTA',      color: '#b8976a', icon: '👆' },
}

const DURACOES: { value: Duracao; label: string; desc: string }[] = [
  { value: '15s', label: '15s', desc: 'Viral curto'   },
  { value: '30s', label: '30s', desc: 'Stories / Feed' },
  { value: '60s', label: '60s', desc: 'Educativo'      },
  { value: '90s', label: '90s', desc: 'Detalhado'      },
]

const ESTILOS: { value: Estilo; label: string; desc: string }[] = [
  { value: 'talking-head', label: 'Talking Head',  desc: 'Médico falando direto para câmera' },
  { value: 'texto-tela',   label: 'Texto na Tela', desc: 'Palavras aparecem enquanto fala'   },
  { value: 'broll',        label: 'B-Roll',        desc: 'Imagens + voz over'               },
  { value: 'misto',        label: 'Misto',         desc: 'Combinação dos formatos'           },
]

// ─── Componentes UI ───────────────────────────────────────────────────────────
const inputSty = {
  background: C.side, border: `1px solid ${C.border}`, color: C.w,
  borderRadius: 8, padding: '10px 14px', fontSize: 13, width: '100%',
  fontFamily: "'Montserrat', sans-serif", outline: 'none',
} as React.CSSProperties

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
      {children}
    </label>
  )
}

function CopyBtn({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button onClick={copy} style={{ padding: '7px 16px', borderRadius: 7, border: `1px solid rgba(200,168,76,0.35)`, background: copied ? 'rgba(200,168,76,0.15)' : 'none', color: copied ? C.d2 : C.label, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", transition: 'all 0.2s' }}>
      {copied ? '✓ Copiado' : label}
    </button>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function RoteirosPage() {
  const [tema,       setTema]       = useState('')
  const [publico,    setPublico]    = useState('')
  const [duracao,    setDuracao]    = useState<Duracao>('60s')
  const [estilo,     setEstilo]     = useState<Estilo>('talking-head')
  const [roteiro,    setRoteiro]    = useState<Roteiro | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [editIdx,    setEditIdx]    = useState<number | null>(null)
  const [editInstr,  setEditInstr]  = useState('')
  const [regenLoad,  setRegenLoad]  = useState(false)
  const [activeTab,  setActiveTab]  = useState<'roteiro' | 'legenda' | 'hashtags'>('roteiro')
  const [showPautas, setShowPautas] = useState(false)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // ── Gerar roteiro completo ──
  const gerar = useCallback(async () => {
    if (!tema.trim()) return
    setLoading(true)
    try {
      const prompt =
        'Você é roteirista médico para Reels do Dr. Bruno Gustavo — Clínico-Geral, Endocrinologia e Nutrologia, Poços de Caldas-MG. @drbrunogustavo\n' +
        'TEMA: ' + tema + (publico ? '\nPÚBLICO: ' + publico : '') + '\n' +
        'DURAÇÃO: ' + duracao + '\nESTILO: ' + estilo + '\n\n' +
        'REGRAS:\n' +
        '- Tom: médico que conversa como amigo, direto, sem enrolação\n' +
        '- Gancho nos primeiros 3 segundos: frase que para o dedo no scroll\n' +
        '- Proibido: "mergulhar", "jornada", "empoderar", "transformador"\n' +
        '- Falas curtas, ritmo de Reel (não de aula)\n' +
        '- CTA específico para médico: salvar, comentar diagnóstico, marcar consulta\n\n' +
        'Retorne SOMENTE JSON válido:\n' +
        '{"titulo":"título do reel","hook":"primeira frase gancho",' +
        '"blocos":[{"id":1,"tempo":"0:00–0:03","tipo":"gancho","fala":"texto falado","visual":"o que aparece na tela","corte":"tipo de corte/transição"}],' +
        '"legenda":"legenda completa com emojis e quebras de linha para Instagram (max 2200 chars)",' +
        '"hashtags":["hashtag1","hashtag2"]}\n\n' +
        'Tipos de bloco em ordem: gancho → problema → conteudo (1 a 3x) → insight → cta\n' +
        'Tipos de corte: corte seco | zoom in | jump cut | texto aparece | transição suave | freeze frame'

      const res  = await fetch('/api/roteiros', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const raw  = (data.content?.[0]?.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim()
      const json = JSON.parse(raw)
      if (!json.blocos) throw new Error('Resposta inválida da API')
      setRoteiro(json as Roteiro)
      setActiveTab('roteiro')
      setEditIdx(null)
    } catch (err) {
      alert('Erro: ' + String(err))
    } finally {
      setLoading(false)
    }
  }, [tema, publico, duracao, estilo])

  // ── Regenerar bloco individual ──
  const regenerarBloco = useCallback(async (idx: number) => {
    if (!roteiro || !editInstr.trim()) return
    setRegenLoad(true)
    const bloco = roteiro.blocos[idx]
    try {
      const prompt =
        'Reescreva este bloco de roteiro para o Dr. Bruno Gustavo. Tom: humano, direto.\n' +
        'Bloco atual: tipo="' + bloco.tipo + '" | tempo="' + bloco.tempo + '" | fala="' + bloco.fala + '" | visual="' + bloco.visual + '"\n' +
        'INSTRUÇÃO: ' + editInstr + '\n' +
        'Retorne SOMENTE JSON: {"fala":"...","visual":"...","corte":"..."}'

      const res  = await fetch('/api/roteiros', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const raw  = (data.content?.[0]?.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim()
      const json = JSON.parse(raw)
      setRoteiro(prev => {
        if (!prev) return prev
        const newBlocos = prev.blocos.map((b, i) => i === idx ? { ...b, ...json } : b)
        return { ...prev, blocos: newBlocos }
      })
      setEditInstr('')
      setEditIdx(null)
    } catch (err) {
      alert('Erro: ' + String(err))
    } finally {
      setRegenLoad(false)
    }
  }, [roteiro, editInstr])

  // Monta texto completo do roteiro para copiar
  const roteiroCompleto = roteiro
    ? roteiro.blocos.map(b =>
        '[' + b.tempo + '] ' + TIPO_CONFIG[b.tipo].label + '\n' +
        'FALA: ' + b.fala + '\n' +
        'VISUAL: ' + b.visual + '\n' +
        'CORTE: ' + b.corte
      ).join('\n\n')
    : ''

  return (
    <div style={{ minHeight: '100vh', background: C.panel, color: C.w, fontFamily: "'Montserrat', sans-serif" }}>
      {showPautas && (
        <PautasModal
          onSelect={(titulo, nota) => { setTema(titulo); if (nota) setPublico(''); setShowPautas(false) }}
          onClose={() => setShowPautas(false)}
        />
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        * { box-sizing: border-box; }
        textarea:focus, input:focus { border-color: rgba(200,168,76,0.5) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${C.panel}; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: C.d2, letterSpacing: 1, margin: 0 }}>Gerador de Roteiros</h1>
          <p style={{ fontSize: 12, color: C.label, margin: '4px 0 0' }}>Roteiros para Reels do Instagram</p>
        </div>
        <button
          onClick={gerar}
          disabled={loading || !tema.trim()}
          style={{ background: tema.trim() ? C.d2 : C.border, color: tema.trim() ? C.bg : C.label, padding: '12px 28px', borderRadius: 10, border: 'none', fontWeight: 900, fontSize: 13, cursor: tema.trim() ? 'pointer' : 'not-allowed', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {loading ? '⟳ Gerando...' : '✦ Gerar Roteiro'}
        </button>
      </div>

      <div style={{ display: 'flex', height: isMobile ? 'auto' : 'calc(100vh - 74px)', flexDirection: isMobile ? 'column' : 'row' }}>

        {/* ── Painel Esquerdo ── */}
        <div style={{ width: isMobile ? '100%' : 300, flexShrink: 0, borderRight: isMobile ? 'none' : `1px solid ${C.border}`, borderBottom: isMobile ? `1px solid ${C.border}` : 'none', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.label, letterSpacing: 3, textTransform: 'uppercase' as const }}>Tema do Reel</span>
              <button onClick={() => setShowPautas(true)}
                style={{ fontSize: 10, fontWeight: 700, color: C.d2, background: 'rgba(200,168,76,0.08)', border: '1px solid rgba(200,168,76,0.25)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", letterSpacing: 1 }}>
                📋 Banco de Pautas
              </button>
            </div>
            <textarea
              value={tema}
              onChange={e => setTema(e.target.value)}
              placeholder="Ex: Por que a dieta falha mesmo com força de vontade"
              rows={3}
              style={{ ...inputSty, resize: 'none', display: 'block' }}
            />
          </div>

          <div>
            <Label>Público <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></Label>
            <input type="text" value={publico} onChange={e => setPublico(e.target.value)} placeholder="Ex: Mulheres 35–50 anos" style={inputSty} />
          </div>

          <div>
            <Label>Duração</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {DURACOES.map(d => (
                <button key={d.value} onClick={() => setDuracao(d.value)}
                  style={{ padding: '10px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', background: duracao === d.value ? C.d2 : C.side, color: duracao === d.value ? C.bg : C.label, fontFamily: "'Montserrat', sans-serif" }}>
                  <div style={{ fontWeight: 900, fontSize: 15 }}>{d.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Estilo de Gravação</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ESTILOS.map(e => (
                <button key={e.value} onClick={() => setEstilo(e.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2, background: estilo === e.value ? C.d2 : C.side, color: estilo === e.value ? C.bg : C.label, fontFamily: "'Montserrat', sans-serif" }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{e.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>{e.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Centro — Roteiro ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 16 : 32, background: '#090503' }}>

          {!roteiro && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16, opacity: 0.5 }}>
              <div style={{ fontSize: 52 }}>🎬</div>
              <div style={{ color: C.label, fontSize: 14, fontWeight: 700, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase' }}>
                Defina o tema e clique em<br />✦ Gerar Roteiro
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
              <div style={{ width: 44, height: 44, border: '3px solid rgba(200,168,76,0.2)', borderTop: `3px solid ${C.d2}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ color: C.d2, fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>ESCREVENDO ROTEIRO...</div>
            </div>
          )}

          {roteiro && !loading && (
            <>
              {/* Título + tabs */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: C.d1, fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
                  {duracao} · {ESTILOS.find(e => e.value === estilo)?.label}
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.w }}>{roteiro.titulo}</h2>

                {/* Gancho destacado */}
                <div style={{ marginTop: 16, padding: '16px 20px', background: 'rgba(200,168,76,0.08)', border: `1px solid rgba(200,168,76,0.3)`, borderRadius: 8, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ color: C.d2, fontSize: 22, flexShrink: 0 }}>⚡</div>
                  <div>
                    <div style={{ color: C.d2, fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>GANCHO DE ABERTURA</div>
                    <div style={{ color: C.w, fontSize: 16, fontStyle: 'italic', lineHeight: 1.5, fontFamily: "'Playfair Display', serif" }}>"{roteiro.hook}"</div>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginTop: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
                  {(['roteiro', 'legenda', 'hashtags'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      style={{ padding: '8px 20px', border: 'none', borderBottom: activeTab === tab ? `2px solid ${C.d2}` : '2px solid transparent', background: 'none', color: activeTab === tab ? C.d2 : C.label, fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2, fontFamily: "'Montserrat', sans-serif", marginBottom: -1 }}>
                      {tab === 'roteiro' ? '🎬 Roteiro' : tab === 'legenda' ? '📝 Legenda' : '# Hashtags'}
                    </button>
                  ))}
                  {activeTab === 'roteiro' && (
                    <div style={{ marginLeft: 'auto', paddingBottom: 4 }}>
                      <CopyBtn text={roteiroCompleto} label="⎘ Copiar roteiro" />
                    </div>
                  )}
                </div>
              </div>

              {/* Tab: Roteiro */}
              {activeTab === 'roteiro' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {roteiro.blocos.map((bloco, idx) => {
                    const cfg = TIPO_CONFIG[bloco.tipo]
                    const isEditing = editIdx === idx
                    return (
                      <div key={bloco.id}
                        style={{ background: C.bgCard, border: `1px solid ${isEditing ? C.d2 : 'rgba(42,26,10,0.8)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s' }}>

                        {/* Header do bloco */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.2)' }}>
                          <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: cfg.color, textTransform: 'uppercase' }}>{cfg.label}</span>
                          <span style={{ fontSize: 11, color: C.wFaint, fontWeight: 700, marginLeft: 4 }}>{bloco.tempo}</span>
                          <button onClick={() => { setEditIdx(isEditing ? null : idx); setEditInstr('') }}
                            style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, border: `1px solid rgba(200,168,76,0.25)`, background: isEditing ? 'rgba(200,168,76,0.12)' : 'none', color: isEditing ? C.d2 : C.label, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                            {isEditing ? '✕ Fechar' : '✦ Editar'}
                          </button>
                        </div>

                        {/* Conteúdo do bloco */}
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {/* Fala */}
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.label, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>🎙 FALA</div>
                            {isEditing ? (
                              <textarea value={bloco.fala}
                                onChange={e => setRoteiro(prev => {
                                  if (!prev) return prev
                                  const b = [...prev.blocos]; b[idx] = { ...b[idx], fala: e.target.value }
                                  return { ...prev, blocos: b }
                                })}
                                rows={3} style={{ ...inputSty, resize: 'none', display: 'block', fontSize: 14 }} />
                            ) : (
                              <div style={{ color: C.w, fontSize: 15, lineHeight: 1.7, fontWeight: 500 }}>{bloco.fala}</div>
                            )}
                          </div>

                          {/* Visual + Corte */}
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.label, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>🎥 VISUAL</div>
                              {isEditing ? (
                                <input type="text" value={bloco.visual}
                                  onChange={e => setRoteiro(prev => {
                                    if (!prev) return prev
                                    const b = [...prev.blocos]; b[idx] = { ...b[idx], visual: e.target.value }
                                    return { ...prev, blocos: b }
                                  })}
                                  style={{ ...inputSty, fontSize: 13 }} />
                              ) : (
                                <div style={{ color: C.wMid, fontSize: 13, lineHeight: 1.5 }}>{bloco.visual}</div>
                              )}
                            </div>
                            <div style={{ minWidth: 140 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.label, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>✂ CORTE</div>
                              {isEditing ? (
                                <input type="text" value={bloco.corte}
                                  onChange={e => setRoteiro(prev => {
                                    if (!prev) return prev
                                    const b = [...prev.blocos]; b[idx] = { ...b[idx], corte: e.target.value }
                                    return { ...prev, blocos: b }
                                  })}
                                  style={{ ...inputSty, fontSize: 12, width: '100%' }} />
                              ) : (
                                <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, background: 'rgba(200,168,76,0.1)', border: `1px solid rgba(200,168,76,0.2)`, color: C.d1, fontSize: 11, fontWeight: 700 }}>{bloco.corte}</span>
                              )}
                            </div>
                          </div>

                          {/* Regenerar com IA */}
                          {isEditing && (
                            <div style={{ paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: C.d2, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>✦ REGENERAR COM IA</div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input type="text" value={editInstr} onChange={e => setEditInstr(e.target.value)}
                                  placeholder="Ex: mais impactante, foco em mulheres, use dado do NEJM..."
                                  style={{ ...inputSty, flex: 1 }}
                                  onKeyDown={e => { if (e.key === 'Enter' && editInstr.trim()) regenerarBloco(idx) }}
                                />
                                <button onClick={() => regenerarBloco(idx)} disabled={regenLoad || !editInstr.trim()}
                                  style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid rgba(200,168,76,0.35)`, background: 'none', color: editInstr.trim() ? C.d2 : C.label, fontWeight: 700, fontSize: 12, cursor: editInstr.trim() ? 'pointer' : 'not-allowed', fontFamily: "'Montserrat', sans-serif", whiteSpace: 'nowrap' }}>
                                  {regenLoad ? '⟳' : '⚡ Gerar'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Tab: Legenda */}
              {activeTab === 'legenda' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ color: C.label, fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
                      {roteiro.legenda.length} / 2200 chars
                    </div>
                    <CopyBtn text={roteiro.legenda + '\n\n' + roteiro.hashtags.map(h => '#' + h).join(' ')} label="⎘ Copiar legenda completa" />
                  </div>
                  <textarea
                    value={roteiro.legenda}
                    onChange={e => setRoteiro(prev => prev ? { ...prev, legenda: e.target.value } : prev)}
                    rows={16}
                    style={{ ...inputSty, resize: 'none', display: 'block', lineHeight: 1.7, fontSize: 14 }}
                  />
                </div>
              )}

              {/* Tab: Hashtags */}
              {activeTab === 'hashtags' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ color: C.label, fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
                      {roteiro.hashtags.length} hashtags
                    </div>
                    <CopyBtn text={roteiro.hashtags.map(h => '#' + h).join(' ')} label="⎘ Copiar todas" />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {roteiro.hashtags.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
                        <span style={{ padding: '8px 14px', color: C.d2, fontSize: 13, fontWeight: 700 }}>#{h}</span>
                        <button onClick={() => {
                          const arr = [...roteiro.hashtags]; arr.splice(i, 1)
                          setRoteiro(prev => prev ? { ...prev, hashtags: arr } : prev)
                        }} style={{ padding: '8px 10px', background: 'none', border: 'none', color: C.label, cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    ))}
                  </div>

                  {/* Adicionar hashtag manual */}
                  <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                    <input type="text" placeholder="Adicionar hashtag..." id="new-hashtag"
                      style={{ ...inputSty, flex: 1 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.replace('#', '').trim()
                          if (val) {
                            setRoteiro(prev => prev ? { ...prev, hashtags: [...prev.hashtags, val] } : prev);
                            (e.target as HTMLInputElement).value = ''
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const inp = document.getElementById('new-hashtag') as HTMLInputElement
                        const val = inp.value.replace('#', '').trim()
                        if (val) { setRoteiro(prev => prev ? { ...prev, hashtags: [...prev.hashtags, val] } : prev); inp.value = '' }
                      }}
                      style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.side, color: C.d2, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                      + Adicionar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
