// Salvar em: components/PautasModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { ClipboardList, X } from "lucide-react"

interface Pauta {
  id:        string
  titulo:    string
  categoria: string
  prioridade: string
  estagio:   string
  nota:      string
  fonte?:    string
}

interface Props {
  onSelect: (titulo: string, nota: string) => void
  onClose:  () => void
}

const PRI_COLOR: Record<string, string> = {
  Alta:  'rgba(239,68,68,0.8)',
  Média: 'rgba(245,158,11,0.8)',
  Baixa: 'rgba(34,197,94,0.8)',
}

const C = {
  bg:     '#120a04',
  bgCard: '#1c0f06',
  d2:     '#C9A84C',
  d1:     '#b8976a',
  w:      '#F5F0EB',
  wMid:   'rgba(245,240,235,0.68)',
  wFaint: 'rgba(245,240,235,0.38)',
  border: '#2a1a0a',
  label:  '#6a5040',
}

export function PautasModal({ onSelect, onClose }: Props) {
  const [pautas,  setPautas]  = useState<Pauta[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    fetch('/api/pautas')
      .then(r => r.json())
      .then(d => { setPautas(d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = pautas.filter(p =>
    !search || p.titulo.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0e0804', border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: C.d2, fontSize: 14, fontWeight: 900, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList style={{ width: 16, height: 16 }} /> Banco de Pautas</div>
            <div style={{ color: C.label, fontSize: 11, marginTop: 2 }}>Selecione uma pauta para usar como tema</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.label, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center' }}><X style={{ width: 18, height: 18 }} /></button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar pauta..."
            style={{ width: '100%', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 14px', color: C.w, fontSize: 13, fontFamily: "'Montserrat', sans-serif", outline: 'none', boxSizing: 'border-box' as const }}
          />
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 16px 16px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: C.label, fontSize: 13 }}>Carregando pautas...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: C.label, fontSize: 13 }}>
              {pautas.length === 0 ? 'Nenhuma pauta no banco ainda.' : 'Nenhuma pauta encontrada.'}
            </div>
          )}
          {!loading && filtered.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.titulo, p.nota || ''); onClose() }}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: `1px solid transparent`, borderRadius: 10, padding: '14px 16px', marginBottom: 6, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", transition: 'all 0.15s' }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = C.bgCard
                el.style.borderColor = 'rgba(200,168,76,0.25)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'none'
                el.style.borderColor = 'transparent'
              }}
            >
              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, color: PRI_COLOR[p.prioridade] || C.label, background: 'rgba(0,0,0,0.4)', border: `1px solid ${PRI_COLOR[p.prioridade] || C.label}` }}>
                  {p.prioridade}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, color: C.d1, background: 'rgba(184,151,106,0.1)', border: `1px solid rgba(184,151,106,0.2)` }}>
                  {p.categoria}
                </span>
                {p.estagio && p.estagio !== 'Publicado' && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, color: C.wFaint, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)` }}>
                    {p.estagio}
                  </span>
                )}
              </div>
              {/* Título */}
              <div style={{ color: C.w, fontSize: 14, fontWeight: 700, lineHeight: 1.4, marginBottom: p.nota ? 6 : 0 }}>
                {p.titulo}
              </div>
              {/* Nota */}
              {p.nota && (
                <div style={{ color: C.wFaint, fontSize: 12, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {p.nota}
                </div>
              )}
              {/* Fonte */}
              {p.fonte && (
                <div style={{ color: C.label, fontSize: 10, marginTop: 6, fontStyle: 'italic' }}>via {p.fonte}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
