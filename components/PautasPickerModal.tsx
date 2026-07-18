"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Search, Loader2, FileText, ChevronRight, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pauta {
  id:         string
  titulo:     string
  categoria?: string
  estagio?:   string
  descricao?: string
}

interface PautasPickerModalProps {
  onSelect: (titulo: string) => void
  onClose:  () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIA_STYLE: Record<string, string> = {
  "Endocrinologia":  "bg-blue-50 border-blue-200 text-blue-700",
  "Nutrologia":      "bg-green-50 border-green-200 text-green-700",
  "Longevidade":     "bg-amber-50 border-amber-200 text-amber-700",
  "Estilo de Vida":  "bg-purple-50 border-purple-200 text-purple-700",
  "Saúde Mental":    "bg-pink-50 border-pink-200 text-pink-700",
  "Preventiva":      "bg-teal-50 border-teal-200 text-teal-700",
  "Cardiologia":     "bg-red-50 border-red-200 text-red-700",
}

function getCategoriaStyle(cat?: string) {
  if (!cat) return "bg-gray-50 border-gray-200 text-gray-600"
  return CATEGORIA_STYLE[cat] ?? "bg-accent-dim border-accent-border text-accent"
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PautasPickerModal({ onSelect, onClose }: PautasPickerModalProps) {
  const [pautas,  setPautas]  = useState<Pauta[]>([])
  const [busca,   setBusca]   = useState("")
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")

  useEffect(() => {
    fetch("/api/pautas")
      .then(r => r.ok ? r.json() as Promise<Pauta[]> : Promise.reject(r.statusText))
      .then(setPautas)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const filtradas = pautas.filter(p => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return p.titulo?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q)
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full sm:max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <span className="text-[14px] font-semibold text-text-primary">Banco de Pautas</span>
            {!loading && (
              <span className="text-[10px] font-mono text-text-muted ml-1">{pautas.length} pautas</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Filtrar pautas..."
              autoFocus
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-3">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-3 m-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700">Erro ao carregar pautas: {error}</p>
            </div>
          )}

          {!loading && !error && filtradas.length === 0 && (
            <div className="text-center py-10">
              <FileText className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-[13px] font-semibold text-text-primary mb-1">
                {pautas.length === 0 ? "Nenhuma pauta cadastrada" : "Nenhum resultado"}
              </p>
              <p className="text-[11px] text-text-muted">
                {pautas.length === 0
                  ? "Crie pautas no Banco de Pautas para usá-las aqui"
                  : "Tente buscar com outros termos"}
              </p>
            </div>
          )}

          {!loading && !error && filtradas.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.titulo); onClose() }}
              className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent-dim/40 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary truncate leading-snug">{p.titulo}</p>
                <div className="flex items-center gap-2 mt-1">
                  {p.categoria && (
                    <span className={cn("text-badge font-mono font-semibold px-1.5 py-0.5 rounded border", getCategoriaStyle(p.categoria))}>
                      {p.categoria}
                    </span>
                  )}
                  {p.estagio && (
                    <span className="text-[9px] font-mono text-text-muted">{p.estagio}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                Usar <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-border flex-shrink-0">
          <p className="text-[10px] text-text-muted text-center">
            Clique em uma pauta para usar como tema do gerador
          </p>
        </div>
      </div>
    </div>
  )
}
