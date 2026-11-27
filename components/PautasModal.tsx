'use client'

import { useState, useEffect, useCallback } from 'react'
import { PxModal, PxInput, PxButton, Tag } from '@/components/px'

interface Pauta {
  id:         string
  titulo:     string
  categoria:  string
  prioridade: string
  estagio:    string
  nota:       string
  fonte?:     string
}

interface Props {
  onSelect: (titulo: string, nota: string) => void
  onClose:  () => void
}

const PRI_TONE: Record<string, 'danger' | 'warn' | 'ok'> = { Alta: 'danger', Média: 'warn', Baixa: 'ok' }

export function PautasModal({ onSelect, onClose }: Props) {
  const [pautas,  setPautas]  = useState<Pauta[]>([])
  const [loading, setLoading] = useState(true)
  const [erro,    setErro]    = useState(false)
  const [search,  setSearch]  = useState('')

  const carregar = useCallback(async () => {
    setLoading(true); setErro(false)
    try {
      const res = await fetch('/api/pautas')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()
      setPautas(Array.isArray(d) ? d : [])
    } catch (e) {
      console.error('[PautasModal] erro ao carregar pautas:', e)
      setErro(true)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const termo = search.trim().toLowerCase()
  const filtered = pautas.filter(p =>
    !termo || p.titulo.toLowerCase().includes(termo) || (p.categoria ?? '').toLowerCase().includes(termo)
  )

  return (
    <PxModal open onClose={onClose} title="Banco de Pautas" className="max-w-xl">
      <div className="space-y-3">
        <p className="text-[13px] text-px-muted">Escolha uma pauta para usar como tema.</p>
        <PxInput autoFocus type="search" aria-label="Buscar pauta" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título ou categoria" />

        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <p role="status" className="py-10 text-center text-[13px] text-px-muted">Carregando pautas</p>
          ) : erro ? (
            <div className="py-10 text-center">
              <p role="alert" className="mb-3 text-[13.5px] font-semibold text-px-ink">Não foi possível carregar as pautas</p>
              <PxButton variant="secondary" size="sm" onClick={carregar}>Tentar de novo</PxButton>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-px-muted">{pautas.length === 0 ? 'Nenhuma pauta no banco ainda.' : 'Nenhuma pauta encontrada.'}</p>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map(p => (
                <li key={p.id}>
                  <button type="button" onClick={() => { onSelect(p.titulo, p.nota || ''); onClose() }}
                    className="w-full rounded-px-card border border-transparent p-3 text-left transition-colors hover:border-px-ink/15 hover:bg-px-ink/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">
                    <span className="mb-1.5 flex flex-wrap gap-1.5">
                      <Tag tone={PRI_TONE[p.prioridade] ?? 'neutral'}>{p.prioridade}</Tag>
                      <Tag tone="neutral">{p.categoria}</Tag>
                      {p.estagio && p.estagio !== 'Publicado' && <Tag tone="neutral">{p.estagio}</Tag>}
                    </span>
                    <span className="block text-[14px] font-semibold leading-snug text-px-ink">{p.titulo}</span>
                    {p.nota && <span className="mt-1 line-clamp-2 block text-[12.5px] leading-relaxed text-px-muted">{p.nota}</span>}
                    {p.fonte && <span className="mt-1 block text-[12px] text-px-muted">via {p.fonte}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PxModal>
  )
}
